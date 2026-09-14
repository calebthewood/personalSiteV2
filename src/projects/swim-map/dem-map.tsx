import { CameraControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type CameraControlsImpl from 'camera-controls'
import { fromArrayBuffer } from 'geotiff'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { UNITS_PER_METER } from './races'

// <DemMap> — the state-wide Hawaii DEM tile pyramid rendered as voxels, the
// basemap under the race replay. Tiles are 256x256 GeoTIFFs (three Float32
// bands: mean / min / max elevation) parsed in-browser with geotiff.js; one
// InstancedMesh per tile, one box per data pixel. Only the tiles under the
// camera's ground footprint are fetched and built, and the level (voxel size)
// follows the zoom, so the same map serves an island overview and a 20m
// close-up of a bay.
//
// This module owns terrain, water, LOD, lighting and the camera. It knows
// nothing about what is drawn on top: a page supplies scene content as a
// child render function and gets back a DemMapApi for placing things
// (lat/lng -> scene, elevation sampling, camera framing).
//
// Scene mapping: scene x follows tile rows (north -> south), scene -z follows
// tile cols (west -> east), all in EPSG:3857 meters * UNITS_PER_METER,
// anchored at the pyramid origin (the tileset's north-west corner). Y is up;
// every column's base sits at y = 0 and the sea surface at api.seaLevel.
//
// Tiles come from `${DEM_BASE}/tiles/...` and `${DEM_BASE}/attrs/...`. In dev
// the vite middleware serves data/hi_dem at the site root; for production
// point VITE_DEM_BASE at wherever the pyramid is hosted.

const DEM_BASE = (import.meta.env.VITE_DEM_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
const INDEX_URL = `${DEM_BASE}/tiles/index.json`
const ATTR_INDEX_URL = `${DEM_BASE}/attrs/index.json`

const HEIGHT_SCALE_DEFAULT = 0.005
const OCEAN_DIVISOR_DEFAULT = 1 // 1 = true-scale depths; >1 compresses, <1 exaggerates
const MIN_BOX_H = 0.002
// EPSG:3857 stretches horizontal distance at Hawaii's latitude (~20.5N): one
// projected meter is ~cos(20.5) ground meters. Elevations are true meters, so
// stretch them to match the projected horizontal scale, or terrain renders
// ~6.3% flatter than reality.
const LAT_STRETCH = 1 / Math.cos(20.5 * Math.PI / 180)
// Island promotion defaults (see DemTile): promote only at res >= min-res
// (finer levels resolve real islands through their own pixels), and only when
// the cell is shallow relative to its own peak (mean > -max * ratio).
const ISLAND_PROMOTE_MIN_RES_DEFAULT = 320
const ISLAND_PROMOTE_RATIO_DEFAULT = 0.25
// per-level cap on simultaneously mounted tiles (finer levels = fewer tiles)
const tileBudget = (res: number) => res <= 20 ? 18 : res <= 80 ? 40 : 128
// How far the camera may tip toward the horizon. 90 is dead level; stopping a
// hair short keeps the ground plane from going exactly edge-on, which would
// make the viewport footprint (and so the tile window) undefined.
const MAX_POLAR_DEG = 89.5
// Animated water columns are one instance per ocean pixel, so they only run
// at the close-up levels; the island/state overviews get a flat sea sheet.
const WATER_COLUMNS_MAX_RES = 160
// Below this camera zoom (px per scene unit) the water goes away entirely:
// the bathymetry's own colors carry the ocean at island and state scale, and
// a translucent sheet floating past the tiles reads as haze, not sea.
const WATER_MIN_ZOOM = 10

// ---- geo helpers ----

const EARTH_R = 6378137

/** [lat, lng] -> EPSG:3857 meters */
export function latLngToMercator([lat, lng]: number[]): [number, number] {
    return [
        (lng * Math.PI / 180) * EARTH_R,
        Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * EARTH_R,
    ]
}

/** EPSG:3857 meters -> [lat, lng] */
export function mercToLatLng(mx: number, my: number): [number, number] {
    return [
        (2 * Math.atan(Math.exp(my / EARTH_R)) - Math.PI / 2) * 180 / Math.PI,
        (mx / EARTH_R) * 180 / Math.PI,
    ]
}

// ---- tile index ----
// One shared origin, power-of-two resolutions that nest as an exact quadtree,
// three bands per pixel (mean/min/max), and sparse detail levels (20-160m
// exist only within ~12nm of shore; 320/640/1280m are gapless). index.json is
// the existence oracle - no 404 probing.

export interface TileLevel {
    res: number
    dir: string
    cols: number // tiles along x (west -> east)
    rows: number // tiles along y (north -> south)
    sparse: boolean
    exists: Set<string> // "tx,ty", 0-indexed
}

export interface TileManifest {
    originX: number // extent xmin
    originY: number // extent ymax (north edge; y decreases as ty increases)
    tileSize: number
    levels: TileLevel[] // sorted fine -> coarse
}

interface IndexJson {
    extent: [number, number, number, number]
    tile_px: number
    levels: Record<string, { res: number, grid: [number, number], sparse: boolean, tiles: string[] }>
}

function parseIndex(idx: IndexJson): TileManifest {
    const levels = Object.values(idx.levels)
        .map(l => ({
            res: l.res,
            dir: `${l.res}m`,
            cols: l.grid[0],
            rows: l.grid[1],
            sparse: l.sparse,
            exists: new Set(l.tiles),
        }))
        .sort((a, b) => a.res - b.res)
    return { originX: idx.extent[0], originY: idx.extent[3], tileSize: idx.tile_px, levels }
}

interface TileAddr {
    tx: number
    ty: number
}

/** a tile chosen for display: possibly a coarser ancestor of what was asked for */
interface MountedTile {
    level: TileLevel
    tx: number
    ty: number
}

/** finest existing tile at or coarser than levels[li] covering this address.
 * Levels nest exactly (shared origin, power-of-two resolutions), so stepping
 * one level coarser just halves the indices; the gapless coarse levels
 * guarantee termination - a missing detail tile is by design (open ocean has
 * no data finer than ~475m), never an error. */
function resolveTile(levels: TileLevel[], li: number, tx: number, ty: number): { li: number, tx: number, ty: number } | null {
    for (let i = li; i < levels.length; i++) {
        if (levels[i].exists.has(`${tx},${ty}`)) return { li: i, tx, ty }
        tx >>= 1
        ty >>= 1
    }
    return null
}

interface TileData {
    /** band 1: average elevation of the source cells in each pixel */
    mean: Float32Array
    /** band 2: lowest source elevation in each pixel */
    min: Float32Array
    /** band 3: highest source elevation in each pixel */
    max: Float32Array
    /** non-NoData pixels */
    count: number
}

// NoData is -32768 in the data proper, but the padding beyond the grid edge in
// the last row/column of tiles is NaN, so every test is written as
// `!(e > NODATA_CUTOFF)` (false for NaN) rather than `e <= NODATA_CUTOFF`
const NODATA_CUTOFF = -30000

function tileUrl(level: TileLevel, tx: number, ty: number): string {
    return `${DEM_BASE}/tiles/${level.dir}/x${tx}_y${ty}.tif`
}

// ---- tile cache: url -> promise of parsed pixels (null = missing tile) ----

const tileCache = new Map<string, Promise<TileData | null>>()
const TILE_CACHE_MAX = 200

async function fetchTile(url: string): Promise<TileData | null> {
    const res = await fetch(url)
    if (!res.ok) return null
    const tiff = await fromArrayBuffer(await res.arrayBuffer())
    const image = await tiff.getImage()
    const rasters = await image.readRasters() as Float32Array[] // bands: mean, min, max
    const mean = rasters[0]
    const min = rasters[1] ?? rasters[0]
    const max = rasters[2] ?? rasters[0]
    let count = 0
    for (let i = 0; i < mean.length; i++) if (mean[i] > NODATA_CUTOFF) count++
    return { mean, min, max, count }
}

function loadTile(url: string): Promise<TileData | null> {
    let p = tileCache.get(url)
    if (p) {
        // refresh LRU position
        tileCache.delete(url)
        tileCache.set(url, p)
        return p
    }
    p = fetchTile(url).catch(() => null)
    tileCache.set(url, p)
    if (tileCache.size > TILE_CACHE_MAX) {
        const oldest = tileCache.keys().next().value
        if (oldest) tileCache.delete(oldest)
    }
    return p
}

// ---- attribute tiles: land cover + fractions on the same grid ----
// attrs/index.json carries its own existence lists (sparse over ocean AND
// over land the layer misses) and a landcover palette (code -> hex, data not
// code). A missing attr tile just means: fall back to elevation-based color.

interface AttrIndexJson {
    palette: Record<string, string>
    levels: Record<string, { res: number, tiles: string[] }>
}

interface AttrIndex {
    /** landcover class code -> color (index 0 unused; undefined = no cover color) */
    palette: (THREE.Color | undefined)[]
    /** res -> existing "tx,ty" */
    exists: Map<number, Set<string>>
}

async function loadAttrIndex(): Promise<AttrIndex | null> {
    try {
        const r = await fetch(ATTR_INDEX_URL)
        if (!r.ok) return null
        const idx: AttrIndexJson = await r.json()
        const palette: (THREE.Color | undefined)[] = []
        for (const [code, hex] of Object.entries(idx.palette)) {
            const override = COVER_OVERRIDES[Number(code)]
            palette[Number(code)] = override === null
                ? undefined // fall through to the hypsometric base
                : new THREE.Color(override ?? hex)
        }
        const exists = new Map<number, Set<string>>()
        for (const l of Object.values(idx.levels)) exists.set(l.res, new Set(l.tiles))
        return { palette, exists }
    } catch {
        return null
    }
}

interface AttrData {
    cover: Uint8Array // band 1: CAH biome class, 0 = no land
    lcFrac: Uint8Array // band 2: dominant class's share of the land, 0-255
    landFrac: Uint8Array // band 3: land share of the whole cell, 0-255
}

const attrCache = new Map<string, Promise<AttrData | null>>()

function loadAttrTile(attrs: AttrIndex | null, level: TileLevel, tx: number, ty: number): Promise<AttrData | null> {
    if (!attrs || !attrs.exists.get(level.res)?.has(`${tx},${ty}`)) return Promise.resolve(null)
    const url = `${DEM_BASE}/attrs/${level.dir}/x${tx}_y${ty}.tif`
    let p = attrCache.get(url)
    if (p) return p
    p = (async () => {
        const res = await fetch(url)
        if (!res.ok) return null
        const tiff = await fromArrayBuffer(await res.arrayBuffer())
        const image = await tiff.getImage()
        const bands = await image.readRasters() as Uint8Array[]
        return { cover: bands[0], lcFrac: bands[1], landFrac: bands[2] }
    })().catch(() => null)
    attrCache.set(url, p)
    if (attrCache.size > TILE_CACHE_MAX) {
        const oldest = attrCache.keys().next().value
        if (oldest) attrCache.delete(oldest)
    }
    return p
}

// ---- colors ----
// 'none' is the bare hypsometric ramp; 'terrain' layers land cover plus the
// beach / slope / summit biases on top.
export type ColorMode = 'none' | 'terrain'

// terrain color biases that need no attr data (from the elevation bands):
// steep slopes read as rock, and above ~3000m it is cinder regardless of
// what any classifier says (Mauna Kea / Mauna Loa summits)
const ROCK_COLOR = new THREE.Color('#6f6d66')
const CINDER_COLOR = new THREE.Color('#6e5f52')
const SAND_COLOR = new THREE.Color('rgb(230, 214, 168)')

// Low-lying, gently-sloped shore cells render as beach; steeper coastal
// faces keep their rock/lava reading. Sand applies to lava/bare cells below
// the elevation cap and to unclassified water-facing shore - classified
// covers like Developed or Grassland keep their (light green) colors.
const BEACH_MAX_ELEV = 10 // meters
const BEACH_MAX_SLOPE = 0.25
// A cell more ocean than land colors as ocean - unless its peak clears this,
// in which case it is a cliff face and colors as terrain regardless.
const LAND_MAX_OVERRIDE_M = 10

// The map aims for attractive over strictly realistic: soften the CAH
// palette so the greens flow as one family (the swim-map ramp), agriculture
// reads olive instead of rust, and developed areas keep the hypsometric base
// (null) instead of painting the city grey.
const COVER_OVERRIDES: Record<number, string | null> = {
    1: 'rgb(37, 86, 50)', // Forest (Wet) - deep jungle, not near-black
    2: 'rgb(52, 106, 60)', // Forest (Mesic)
    3: 'rgb(96, 146, 86)', // Forest (Dry)
    4: 'rgb(72, 126, 71)', // Forest
    5: 'rgb(96, 146, 86)', // Shrubland (Wet)
    6: 'rgb(122, 166, 101)', // Shrubland (Mesic)
    7: 'rgb(152, 186, 121)', // Shrubland (Dry)
    8: '#E9D8A6', // Coastal Strand
    9: 'rgb(122, 166, 101)', // Grassland (Wet)
    10: 'rgb(152, 186, 121)', // Grassland (Mesic)
    11: 'rgb(181, 200, 141)', // Grassland (Dry)
    12: '#B8BC8B', // Agriculture - olive fields
    13: '#4A6D7C', // Wetland
    14: null, // Developed - keep the hypsometric base
    15: '#9B7B62', // Not Vegetated (lava) - columbia-palette brown
}

// Banded scheme with ABSOLUTE meter anchors. Land runs the swim-map
// jungle-green ramp up to Oahu's summits (~1,400m: the deep greens really are
// jungle on the lower islands), then climbs back through light green into
// straw/tan/brown so Mauna Kea's summit (~4,120m) lands in the final brown.
// Ocean gets extra dark steps to break up the deep water.
const OCEAN_BANDS = {
    breaks: [-4200, -3400, -2600, -1800, -1000, -500, -50, 0],
    colors: ['#001433', '#001E50', '#003366', '#004C80', '#006699', '#0099CD', '#64C8FF'],
}
const LAND_BANDS = {
    breaks: [0, 10, 100, 350, 500, 650, 1150, 1400, 1900, 2500, 3000, 3500, 3900, 4300],
    colors: [
        'rgb(181, 200, 141)', 'rgb(152, 186, 121)', 'rgb(122, 166, 101)', 'rgb(96, 146, 86)',
        'rgb(72, 126, 71)', 'rgb(52, 106, 60)', 'rgb(37, 86, 50)',
        'rgb(172, 191, 139)', '#E4DFAF', '#E6CA94', '#CDAB83', '#B59880', '#9B7B62',
    ],
}

export interface Palette {
    minElev: number
    maxElev: number
    /** raw elevation (m) -> shared THREE.Color (do not mutate) */
    pick: (e: number) => THREE.Color
}

const srgb = (hex: string) => new THREE.Color(hex)

/** banded lookup over absolute elevation breaks (ocean below 0, land above) */
function bandedPick(
    oBreaks: number[], oCols: THREE.Color[],
    lBreaks: number[], lCols: THREE.Color[],
): (e: number) => THREE.Color {
    return (e: number) => {
        if (e < 0) {
            for (let i = 1; i < oBreaks.length; i++) {
                if (e <= oBreaks[i]) return oCols[i - 1]
            }
            return oCols[oCols.length - 1]
        }
        for (let i = 1; i < lBreaks.length; i++) {
            if (e <= lBreaks[i]) return lCols[i - 1]
        }
        return lCols[lCols.length - 1]
    }
}

const PICK = bandedPick(
    OCEAN_BANDS.breaks, OCEAN_BANDS.colors.map(srgb),
    LAND_BANDS.breaks, LAND_BANDS.colors.map(srgb),
)

/** scan the coarsest (gapless) level once for the data's true min/max, so
 * the sea-floor lift is identical across every level and tile; the max comes
 * from band 3 so palette tops track true summits, not pixel averages */
async function buildPalette(manifest: TileManifest): Promise<Palette> {
    const level = manifest.levels[manifest.levels.length - 1]
    let min = 0, max = 0
    const jobs: Promise<TileData | null>[] = []
    for (const key of level.exists) {
        const [tx, ty] = key.split(',').map(Number)
        jobs.push(loadTile(tileUrl(level, tx, ty)))
    }
    for (const tile of await Promise.all(jobs)) {
        if (!tile) continue
        for (let i = 0; i < tile.mean.length; i++) {
            if (!(tile.mean[i] > NODATA_CUTOFF)) continue // NaN is nodata too
            if (tile.mean[i] < min) min = tile.mean[i]
            if (tile.max[i] > max) max = tile.max[i]
        }
    }
    return { minElev: min, maxElev: max, pick: PICK }
}

// ---- the viewport footprint ----
// Tiles, the sea sheet, and the sun/shadow frustum all track the camera's
// ground-plane footprint (the AABB of the viewport corners projected onto
// the sea-level plane), so the screen is always filled with terrain.

interface Square {
    cx: number
    cz: number
    halfX: number // half-extent along scene x (north-south)
    halfZ: number // half-extent along scene z (east-west)
}

const vDir = new THREE.Vector3()
const vCorner = new THREE.Vector3()
const NDC_CORNERS: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
const FOOTPRINT_HALF_MAX = 2200 // clamp runaway extents at near-horizon angles

/** viewport footprint on the horizontal plane y=planeY, padded; false when
 * the camera grazes or looks above the horizon (keep the previous footprint
 * then) */
function groundFootprint(camera: THREE.Camera, planeY: number, padFrac: number, out: Square): boolean {
    camera.getWorldDirection(vDir)
    if (vDir.y > -0.015) return false
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const [nx, ny] of NDC_CORNERS) {
        vCorner.set(nx, ny, -1).unproject(camera)
        const t = (planeY - vCorner.y) / vDir.y // orthographic: rays are parallel
        const x = vCorner.x + vDir.x * t
        const z = vCorner.z + vDir.z * t
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (z < minZ) minZ = z
        if (z > maxZ) maxZ = z
    }
    out.cx = (minX + maxX) / 2
    out.cz = (minZ + maxZ) / 2
    out.halfX = Math.min(((maxX - minX) / 2) * (1 + padFrac), FOOTPRINT_HALF_MAX)
    out.halfZ = Math.min(((maxZ - minZ) / 2) * (1 + padFrac), FOOTPRINT_HALF_MAX)
    return true
}

// Shadow maps re-render only when this is set: the scene is static between
// interactions, so the default render-shadows-every-frame burns a core doing
// nothing. Footprint moves, tile mounts, and tile loads all mark it dirty;
// scene children that move their shadow casters call it too.
let shadowsDirty = true
export function markShadowsDirty() { shadowsDirty = true }

// one material shared by every tile (colors come from instanceColor)
const tileMaterial = new THREE.MeshStandardMaterial()

// ---- animated voxel water ----
// Translucent columns from the sea floor up to the surface, one per ocean
// pixel, sharing one material: the surface verts ride a sum of three sine
// waves (vertex shader), crests lighten toward foam, and lighting follows the
// wave slope. Columns share corner positions, so the displaced tops read as
// one continuous low-poly sheet while the silhouette stays blocky.

const WAVE_AMP_M = 1.6 // wave amplitude in "sea meters" (scaled like elevation)
// Three wave trains, wavelengths ~95m / ~140m / ~200m in scene units. p =
// world (x, z); a term sin(k . p - wt) travels toward +k. k sits mostly on
// p.y (world z, east-west) with a small x mix to fan the angles so the sea
// doesn't look ruled.
const WAVE_GLSL = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying float vWave;
float waveH(vec2 p, float t) {
    return sin((p.y + 0.15 * p.x) * 26.0 - t * 1.5) * 0.45
         + sin((p.y - 0.25 * p.x) * 18.0 - t * 1.15 + 1.7) * 0.35
         + sin((p.y + 0.50 * p.x) * 12.5 - t * 1.9 + 4.2) * 0.20;
}
`

const waterUniforms = { uTime: { value: 0 }, uAmp: { value: 0 } }

function makeWaterMaterial() {
    const mat = new THREE.MeshStandardMaterial({
        color: 'rgb(96, 176, 240)',
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        roughness: 0.35,
        metalness: 0.05,
    })
    mat.onBeforeCompile = shader => {
        shader.uniforms.uTime = waterUniforms.uTime
        shader.uniforms.uAmp = waterUniforms.uAmp

        shader.vertexShader = WAVE_GLSL + shader.vertexShader
            // tilt surface normals to the wave slope so the sun glints off it
            .replace('#include <beginnormal_vertex>', /* glsl */ `
                #include <beginnormal_vertex>
                #ifdef USE_INSTANCING
                if (position.y > 0.49) {
                    vec2 wp0 = vec2(
                        instanceMatrix[3][0] + position.x * instanceMatrix[0][0],
                        instanceMatrix[3][2] + position.z * instanceMatrix[2][2]
                    );
                    float e = 0.02;
                    float dwdx = (waveH(wp0 + vec2(e, 0.0), uTime) - waveH(wp0 - vec2(e, 0.0), uTime)) / (2.0 * e) * uAmp;
                    float dwdz = (waveH(wp0 + vec2(0.0, e), uTime) - waveH(wp0 - vec2(0.0, e), uTime)) / (2.0 * e) * uAmp;
                    // objectNormal gets multiplied by the instance scale later;
                    // pre-divide so the *world* normal matches the wave slope
                    objectNormal = normalize(vec3(-dwdx, 1.0, -dwdz)) / vec3(
                        instanceMatrix[0][0], instanceMatrix[1][1], instanceMatrix[2][2]
                    );
                }
                #endif
            `)
            // lift the surface verts by the wave field (world-space xz)
            .replace('#include <begin_vertex>', /* glsl */ `
                #include <begin_vertex>
                vWave = 0.0;
                #ifdef USE_INSTANCING
                if (position.y > 0.49) {
                    vec2 wp = vec2(
                        instanceMatrix[3][0] + position.x * instanceMatrix[0][0],
                        instanceMatrix[3][2] + position.z * instanceMatrix[2][2]
                    );
                    float w = waveH(wp, uTime);
                    transformed.y += w * uAmp / max(instanceMatrix[1][1], 1e-4);
                    vWave = w * 0.5 + 0.5;
                }
                #endif
            `)

        shader.fragmentShader = 'varying float vWave;\n' + shader.fragmentShader
            .replace('#include <color_fragment>', /* glsl */ `
                #include <color_fragment>
                // crests fade toward foam-white; troughs sit a touch deeper
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.98, 1.0), smoothstep(0.62, 1.0, vWave) * 0.75);
                diffuseColor.rgb *= 0.9 + 0.2 * vWave;
            `)
    }
    mat.customProgramCacheKey = () => 'voxel-water'
    return mat
}

// one material shared by every tile's water columns
const waterMaterial = makeWaterMaterial()

/** updates the footprint square from the camera, drives the shadow refresh,
 * carries the footprint-anchored sun, and ticks the water uniforms */
function SceneRig({ controls, squareRef, shadows, sunIntensity, seaLevel, waveAmp, lockTarget }: {
    controls: CameraControlsImpl | null
    squareRef: React.MutableRefObject<Square>
    shadows: boolean
    sunIntensity: number
    seaLevel: number
    waveAmp: number
    lockTarget: boolean
}) {
    const camera = useThree(st => st.camera)
    const gl = useThree(st => st.gl)
    const lightRef = useRef<THREE.DirectionalLight>(null!)
    const fp = useRef<Square>({ cx: 0, cz: 0, halfX: 0, halfZ: 0 })
    const tgt = useRef(new THREE.Vector3())

    useEffect(() => {
        gl.shadowMap.autoUpdate = false
        markShadowsDirty()
        return () => { gl.shadowMap.autoUpdate = true }
    }, [gl])
    useEffect(() => { markShadowsDirty() }, [shadows])

    useFrame(({ clock }) => {
        waterUniforms.uTime.value = clock.elapsedTime
        waterUniforms.uAmp.value = waveAmp

        if (!controls) return
        // keep the orbit/zoom anchor ON the sea-level plane: ortho zoom then
        // holds the surface steady (no height jump between levels), and
        // tilted panning can't drift the pivot into or under the terrain
        if (lockTarget) {
            controls.getTarget(tgt.current)
            if (Math.abs(tgt.current.y - seaLevel) > 1e-3) {
                controls.setTarget(tgt.current.x, seaLevel, tgt.current.z, false)
            }
        }
        if (!groundFootprint(camera, seaLevel, 0.08, fp.current)) return
        const sq = squareRef.current
        const eps = Math.max(fp.current.halfX, 1) * 1e-4
        if (Math.abs(sq.cx - fp.current.cx) + Math.abs(sq.cz - fp.current.cz) > eps
            || Math.abs(sq.halfX - fp.current.halfX) > eps
            || Math.abs(sq.halfZ - fp.current.halfZ) > eps) {
            shadowsDirty = true
        }
        sq.cx = fp.current.cx
        sq.cz = fp.current.cz
        sq.halfX = fp.current.halfX
        sq.halfZ = fp.current.halfZ
        const halfX = sq.halfX
        const halfZ = sq.halfZ
        if (shadowsDirty) {
            gl.shadowMap.needsUpdate = true
            shadowsDirty = false
        }

        const light = lightRef.current
        if (!light) return
        const span = 2 * Math.max(halfX, halfZ)
        light.position.set(sq.cx + span * 0.6, span * 1.1, sq.cz - span * 0.5)
        light.target.position.set(sq.cx, 0, sq.cz)
        light.target.updateMatrixWorld()
        const ext = Math.max(halfX, halfZ) * 1.6
        const shadowCam = light.shadow.camera
        if (Math.abs(shadowCam.right - ext) > ext * 0.02) {
            shadowCam.left = -ext
            shadowCam.right = ext
            shadowCam.top = ext
            shadowCam.bottom = -ext
            shadowCam.near = 0.1
            shadowCam.far = span * 4
            shadowCam.updateProjectionMatrix()
        }
    })

    return (
        <directionalLight
            ref={lightRef}
            castShadow={shadows}
            color='#fff2e0'
            intensity={sunIntensity}
            shadow-mapSize={[2048, 2048]}
        />
    )
}

/**
 * Throttled camera watcher: unprojects the four screen corners onto the
 * ground plane, converts the footprint to a tile range at the active level
 * (nearest-first, capped by the level's budget), and reports level picks for
 * auto mode (ortho zoom -> meters per screen pixel -> coarsest level that
 * keeps a voxel >= detailPx pixels).
 */
function TileWindow({ levelIdx, levels, manifest, squareRef, detailPx, onTiles, onStats }: {
    levelIdx: number
    levels: TileLevel[]
    manifest: TileManifest
    squareRef: React.MutableRefObject<Square>
    /** minimum on-screen pixels per voxel before stepping to a finer level */
    detailPx: number
    onTiles: (tiles: MountedTile[], levelIdx: number) => void
    onStats: (stats: { zoom: number, mPerPx: number, res: number }) => void
}) {
    const camera = useThree(s => s.camera)
    const acc = useRef(1)
    const lastKey = useRef('')
    // tiles currently on screen get a score bonus so panning doesn't churn
    // the mounted set at the budget boundary
    const mounted = useRef(new Set<string>())

    useEffect(() => { mounted.current.clear() }, [levelIdx])

    useFrame((_, delta) => {
        acc.current += delta
        if (acc.current < 0.12) return
        acc.current = 0

        // auto-resolution suggestion from the ortho zoom
        const mPerPx = 1 / (camera.zoom * UNITS_PER_METER)
        const wanted = mPerPx * detailPx
        let autoRes = levels[levels.length - 1].res
        for (const l of levels) {
            if (l.res >= wanted) { autoRes = l.res; break }
        }
        onStats({ zoom: camera.zoom, mPerPx, res: autoRes })

        const sq = squareRef.current
        if (sq.halfX === 0) return // square not measured yet
        // small margin so tiles are mounted before their edge shows
        const minX = sq.cx - sq.halfX * 1.05
        const maxX = sq.cx + sq.halfX * 1.05
        const minZ = sq.cz - sq.halfZ * 1.05
        const maxZ = sq.cz + sq.halfZ * 1.05

        // scene rect -> 0-based tile range; all levels share the scene anchor
        // (scene x tracks ty north->south, scene -z tracks tx west->east)
        const level = levels[levelIdx]
        const span = manifest.tileSize * level.res * UNITS_PER_METER
        const ty0 = Math.max(0, Math.floor(minX / span))
        const ty1 = Math.min(level.rows - 1, Math.floor(maxX / span))
        const tx0 = Math.max(0, Math.floor(-maxZ / span))
        const tx1 = Math.min(level.cols - 1, Math.floor(-minZ / span))
        if (ty1 < ty0 || tx1 < tx0) {
            if (lastKey.current !== 'none') {
                lastKey.current = 'none'
                mounted.current.clear()
                onTiles([], levelIdx)
            }
            return
        }

        // Desired tiles at the active level, resolved through the sparse
        // pyramid: a missing detail tile falls back to its coarser ancestor
        // (multiple missing neighbors dedupe onto one ancestor), so open
        // ocean renders at 320m+ while shorelines get full detail.
        const centerTy = (ty0 + ty1) / 2
        const centerTx = (tx0 + tx1) / 2
        const resolved = new Map<string, { li: number, tx: number, ty: number, s: number }>()
        for (let ty = ty0; ty <= ty1; ty++) {
            for (let tx = tx0; tx <= tx1; tx++) {
                const r = resolveTile(levels, levelIdx, tx, ty)
                if (!r) continue
                const k = `${r.li}:${r.tx},${r.ty}`
                const dist = Math.abs(ty - centerTy) + Math.abs(tx - centerTx)
                const sticky = mounted.current.has(k) ? 0.75 : 0
                const score = dist - sticky
                const cur = resolved.get(k)
                if (!cur || score < cur.s) resolved.set(k, { ...r, s: score })
            }
        }
        const capped = [...resolved.values()]
            .sort((a, b) => a.s - b.s)
            .slice(0, tileBudget(level.res))

        const key = capped.map(x => `${x.li}:${x.tx},${x.ty}`).join(';')
        if (key !== lastKey.current) {
            lastKey.current = key
            mounted.current = new Set(capped.map(x => `${x.li}:${x.tx},${x.ty}`))
            onTiles(capped.map(x => ({ level: levels[x.li], tx: x.tx, ty: x.ty })), levelIdx)
        }
    })
    return null
}

/**
 * Flat translucent sea sheet sized to the camera's ground footprint: the
 * water at the overview levels, where per-pixel columns would be too many.
 */
function OceanSheet({ seaLevel, squareRef, opacity }: {
    seaLevel: number
    squareRef: React.MutableRefObject<Square>
    opacity: number
}) {
    const surfRef = useRef<THREE.Mesh>(null!)

    useFrame(() => {
        const sq = squareRef.current
        if (sq.halfX === 0 || !surfRef.current) return
        surfRef.current.position.set(sq.cx, seaLevel - 0.015, sq.cz)
        surfRef.current.scale.set(sq.halfX * 2, sq.halfZ * 2, 1)
    })

    return (
        // plane rotated flat: local x -> world x, local y -> world z
        <mesh ref={surfRef} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry />
            <meshStandardMaterial color='#5cb8e6' transparent opacity={opacity} depthWrite={false} />
        </mesh>
    )
}

// ---- one tile = one InstancedMesh (plus one for its water columns) ----

const cScratch = new THREE.Color()
const cWater = new THREE.Color()

function DemTile({ level, manifest, addr, palette, heightScale, oceanDivisor, promoteMinRes, promoteRatio, attrs, colorMode, water, tileKey, visible, onReady }: {
    level: TileLevel
    manifest: TileManifest
    addr: TileAddr
    palette: Palette
    heightScale: number
    oceanDivisor: number
    promoteMinRes: number
    promoteRatio: number
    attrs: AttrIndex | null
    colorMode: ColorMode
    /** draw the animated water columns over this tile's ocean pixels */
    water: boolean
    tileKey: string
    /** false while this tile is warming up behind the outgoing level */
    visible: boolean
    /** fired once the instances for this tile exist and it is safe to show */
    onReady?: (key: string) => void
}) {
    const ref = useRef<THREE.InstancedMesh>(null!)
    const waterRef = useRef<THREE.InstancedMesh>(null!)
    const [tile, setTile] = useState<TileData | null>(null)
    const [attr, setAttr] = useState<AttrData | null>(null)
    const [loaded, setLoaded] = useState(false)
    const onReadyRef = useRef(onReady)
    onReadyRef.current = onReady

    useEffect(() => {
        let live = true
        setLoaded(false)
        Promise.all([
            loadTile(tileUrl(level, addr.tx, addr.ty)),
            loadAttrTile(attrs, level, addr.tx, addr.ty),
        ]).then(([t, a]) => {
            if (!live) return
            setAttr(a)
            setTile(t)
            setLoaded(true)
        })
        return () => { live = false }
    }, [level, addr, attrs])

    // Passive effects run after the layout effect below, so by the time this
    // fires the instance matrices are built and the mesh can be shown in the
    // very next commit - no frame where the tile is mounted but empty. A tile
    // with no data (missing/all-NoData) is "ready" too: it draws nothing.
    useEffect(() => {
        if (loaded) onReadyRef.current?.(tileKey)
    }, [loaded, tileKey])

    // ocean pixels (for the water mesh's instance count); promoted islet
    // cells are land, everything else below sea level is water
    const oceanCount = useMemo(() => {
        if (!tile || !water) return 0
        let n = 0
        for (let i = 0; i < tile.mean.length; i++) {
            const e = tile.mean[i]
            if (!(e > NODATA_CUTOFF) || e >= 0) continue
            const mx = tile.max[i]
            const promote = level.res >= promoteMinRes && mx > 0 && e > -mx * promoteRatio
            if (!promote) n++
        }
        return n
    }, [tile, water, level, promoteMinRes, promoteRatio])

    useLayoutEffect(() => {
        const mesh = ref.current
        if (!mesh || !tile || tile.count === 0) return
        const wmesh = waterRef.current as THREE.InstancedMesh | null
        const S = manifest.tileSize
        const cell = level.res * UNITS_PER_METER
        const x0 = addr.ty * S * cell
        const z0 = -(addr.tx * S * cell)
        const m = new THREE.Matrix4()
        const heightOffset = -palette.minElev / oceanDivisor
        const seaLevel = heightOffset * LAT_STRETCH * heightScale
        const pick = palette.pick
        let i = 0
        let wi = 0
        for (let py = 0; py < S; py++) {
            for (let px = 0; px < S; px++) {
                const idx = py * S + px
                const e = tile.mean[idx]
                if (!(e > NODATA_CUTOFF)) continue // -32768 or NaN (edge padding)
                // island promotion: at coarse levels, a cell whose peak
                // dominates its water renders as land even when its mean is
                // below sea level - keeps prominent islets visible without
                // painting every land-touching harbor cell as coastline
                const mx = tile.max[idx]
                const promote = level.res >= promoteMinRes
                    && e <= 0 && mx > 0 && e > -mx * promoteRatio
                const eR = promote ? mx : e
                const y = eR < 0 ? eR / oceanDivisor : eR
                const h = Math.max((y + heightOffset) * LAT_STRETCH * heightScale, MIN_BOX_H)
                const cx = x0 + (py + 0.5) * cell
                const cz = z0 - (px + 0.5) * cell
                m.makeScale(cell, h, cell)
                m.setPosition(cx, h / 2, cz)
                mesh.setMatrixAt(i, m)

                // water column from the sea floor up to the surface
                if (wmesh && eR < 0 && wi < oceanCount) {
                    const wh = seaLevel - h
                    if (wh > 0) {
                        m.makeScale(cell, wh, cell)
                        m.setPosition(cx, h + wh / 2, cz)
                        wmesh.setMatrixAt(wi, m)
                        wi++
                    }
                }

                // ---- color: elevation base, layered with land cover ----
                cScratch.copy(pick(eR))
                if (colorMode === 'terrain' && eR > 0) {
                    const eW = px > 0 && tile.mean[idx - 1] > NODATA_CUTOFF ? tile.mean[idx - 1] : e
                    const eE = px < S - 1 && tile.mean[idx + 1] > NODATA_CUTOFF ? tile.mean[idx + 1] : e
                    const eN = py > 0 && tile.mean[idx - S] > NODATA_CUTOFF ? tile.mean[idx - S] : e
                    const eS2 = py < S - 1 && tile.mean[idx + S] > NODATA_CUTOFF ? tile.mean[idx + S] : e
                    const slope = Math.max(Math.abs(eE - eW), Math.abs(eS2 - eN)) / (2 * level.res)
                    const nearWater = eW < 0 || eE < 0 || eN < 0 || eS2 < 0
                        || (attr ? attr.landFrac[idx] < 250 : false)
                    const cls = attr ? attr.cover[idx] : 0
                    const lf = attr ? attr.landFrac[idx] / 255 : 1
                    // a peak clearing this is a cliff face: terrain, not water
                    const cliff = mx > LAND_MAX_OVERRIDE_M

                    const beach = eR <= BEACH_MAX_ELEV && slope < BEACH_MAX_SLOPE
                        && (cls === 15 || (cls === 14 && eR <= 2) || (cls === 0 && nearWater))

                    if (attr && lf < 0.5 && !cliff && !beach) {
                        // more ocean than land, no meaningful relief: water
                        cScratch.copy(pick(Math.min(e, -4)))
                    } else if (beach) {
                        // lava/bare flats and unclassified low shore are sand;
                        // classified covers (Developed, Grassland...) keep
                        // their own light colors even at the waterline
                        cScratch.copy(SAND_COLOR)
                    } else {
                        const clsColor = cls > 0 && attrs ? attrs.palette[cls] : undefined
                        if (attr && clsColor) {
                            // class color, tempered by how dominant the class
                            // is (coarse mixed cells drift toward the base
                            // instead of rendering as flat Voronoi patches)
                            cScratch.lerp(clsColor, attr.lcFrac[idx] / 255)
                            // shoreline: partly-land cells fade toward water,
                            // but never cliff faces - they read as terrain
                            if (lf < 0.995 && !cliff) {
                                cWater.copy(pick(-4))
                                cScratch.lerp(cWater, (1 - lf) * 0.85)
                            }
                        }
                        // steep slopes read as rock
                        if (slope > 0.35) {
                            cScratch.lerp(ROCK_COLOR, Math.min(0.65, (slope - 0.35) * 1.1))
                        }
                        // above ~3000m it is cinder no matter the classifier
                        if (eR > 3000) {
                            cScratch.lerp(CINDER_COLOR, Math.min(0.85, (eR - 3000) / 900))
                        }
                    }
                }
                mesh.setColorAt(i, cScratch)
                i++
            }
        }
        mesh.count = i
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        mesh.computeBoundingSphere()
        if (wmesh) {
            wmesh.count = wi
            wmesh.instanceMatrix.needsUpdate = true
            wmesh.computeBoundingSphere()
            // the surface animates above the static bounds; pad so edge
            // columns aren't frustum-culled mid-crest
            if (wmesh.boundingSphere) wmesh.boundingSphere.radius += 1
        }
        markShadowsDirty()
    }, [tile, attr, attrs, colorMode, level, manifest, addr, palette, heightScale, oceanDivisor, promoteMinRes, promoteRatio, oceanCount])

    if (!tile || tile.count === 0) return null

    const url = tileUrl(level, addr.tx, addr.ty)
    return (
        <>
            <instancedMesh
                key={`${url}-${tile.count}`}
                ref={ref}
                args={[undefined, undefined, tile.count]}
                visible={visible}
                castShadow
                receiveShadow
                material={tileMaterial}
            >
                <boxGeometry />
            </instancedMesh>
            {oceanCount > 0 && (
                <instancedMesh
                    key={`${url}-water-${oceanCount}`}
                    ref={waterRef}
                    args={[undefined, undefined, oceanCount]}
                    visible={visible}
                    material={waterMaterial}
                >
                    <boxGeometry />
                </instancedMesh>
            )}
        </>
    )
}

// ---- settings ----
// One bag of tunables. The page can pin them or expose some in its own UI.

export interface DemMapSettings {
    /** pick the level from the camera zoom instead of levelIdx */
    auto: boolean
    /** manual level (index into manifest.levels, fine -> coarse); used when !auto */
    levelIdx: number
    /** minimum on-screen pixels per voxel before stepping to a finer level */
    detailPx: number
    heightScale: number
    oceanDivisor: number
    shadows: boolean
    sunIntensity: number
    ambient: number
    /** water opacity (columns at the close-up levels, a flat sheet above); 0 = off */
    waterOpacity: number
    promoteMinRes: number
    promoteRatio: number
    colorMode: ColorMode
}

export const DEM_MAP_DEFAULTS: DemMapSettings = {
    auto: true,
    levelIdx: -1, // -1 = "not chosen yet"; the map starts at its coarsest level
    detailPx: 5,
    heightScale: HEIGHT_SCALE_DEFAULT,
    oceanDivisor: OCEAN_DIVISOR_DEFAULT,
    shadows: true,
    sunIntensity: 1.8,
    ambient: 0.6,
    waterOpacity: 0.35,
    promoteMinRes: ISLAND_PROMOTE_MIN_RES_DEFAULT,
    promoteRatio: ISLAND_PROMOTE_RATIO_DEFAULT,
    colorMode: 'terrain',
}

export function useDemMapSettings(overrides?: Partial<DemMapSettings>) {
    const [settings, setSettings] = useState<DemMapSettings>(() => ({ ...DEM_MAP_DEFAULTS, ...overrides }))
    const set = useCallback(<K extends keyof DemMapSettings>(key: K, value: DemMapSettings[K]) => {
        setSettings(s => s[key] === value ? s : { ...s, [key]: value })
    }, [])
    return { settings, set }
}

/** live readout of what the map is doing, mirrored out for page UI */
export interface DemStats {
    zoom: number
    mPerPx: number
    /** resolution auto mode would pick at this zoom */
    autoRes: number
    /** index into levels of the level actually drawn */
    levelIdx: number
    tiles: number
    /** tiles of the next level loading behind the current one */
    warming: number
}

/**
 * The geometry of the map, stable across LOD swaps: everything a scene child
 * needs to place things. Changes identity only when the tileset or the
 * vertical scale changes, so it is safe to memo course geometry on it.
 */
export interface MapFrame {
    manifest: TileManifest
    /** scene y of the sea-level plane (columns are lifted by the ocean floor) */
    seaLevel: number
    /** lat/lng -> scene [x, z] */
    project: (lat: number, lng: number) => [number, number]
    /** EPSG:3857 meters -> scene [x, z] */
    projectMerc: (mx: number, my: number) => [number, number]
    /** scene [x, z] -> [lat, lng] */
    unproject: (x: number, z: number) => [number, number]
    /** elevation in meters -> scene y of the top of that voxel */
    sceneY: (elevM: number) => number
}

/** handle onto a mounted map: place things on it and drive its camera */
export interface DemMapApi extends MapFrame {
    frame: MapFrame
    palette: Palette
    levels: TileLevel[]
    levelIdx: number
    controls: CameraControlsImpl | null
    /**
     * Ground elevation under a coordinate, sampled from the level currently
     * drawn (and through the same coarse-ancestor fallback and island
     * promotion the renderer uses), so anything placed with it sits exactly on
     * the voxel it appears to stand on rather than on some other LOD's idea of
     * the terrain. Resolves null when the tile is missing or NoData.
     */
    sampleElevation: (lat: number, lng: number) => Promise<number | null>
    /** frame a point: spanM is the ground distance that should fill the
     * shorter side of the viewport */
    flyTo: (v: { lat: number, lng: number, spanM: number, animate?: boolean }) => void
}

/** longest the outgoing level is held waiting on a stalled tile fetch */
const HOLD_MAX_MS = 2500

/** stable identity for a mounted tile - also its React key, so a tile shared
 * between two levels stays mounted across the swap instead of remounting */
const tileKeyOf = (t: MountedTile) => `${t.level.dir}-${t.tx}-${t.ty}`

export interface DemMapProps {
    settings: DemMapSettings
    /** where the camera settles once the terrain is up */
    initialView?: { lat: number, lng: number, spanM: number }
    onStats?: (s: DemStats) => void
    onApi?: (api: DemMapApi | null) => void
    /** keep the orbit pivot pinned to the sea-level plane, so ortho zoom holds
     * the surface steady. Turn off when the page drives the camera itself. */
    lockTarget?: boolean
    background?: string
    /** scene content drawn on top of the terrain, once the map is ready */
    children?: (api: DemMapApi) => React.ReactNode
}

export function DemMap({
    settings, initialView, onStats, onApi, lockTarget = true, background = '#a8c8e6', children,
}: DemMapProps) {
    const [manifest, setManifest] = useState<TileManifest | null>(null)
    const [palette, setPalette] = useState<Palette | null>(null)
    const [attrs, setAttrs] = useState<AttrIndex | null>(null)
    const [levelIdx, setLevelIdx] = useState(0)
    // water is drawn only when zoomed in past WATER_MIN_ZOOM (see handleStats)
    const [waterOn, setWaterOn] = useState(true)
    const squareRef = useRef<Square>({ cx: 0, cz: 0, halfX: 0, halfZ: 0 })
    const hostRef = useRef<HTMLDivElement>(null)
    // state (not ref): the initial fly-to must wait until controls exist,
    // and the manifest fetch can win that race on a warm reload
    const [controls, setControls] = useState<CameraControlsImpl | null>(null)

    // committed = what is on screen; pending = the next level, mounted but
    // invisible while it loads (see handleTiles)
    const [committed, setCommitted] = useState<MountedTile[]>([])
    const [pending, setPending] = useState<MountedTile[] | null>(null)
    const committedRef = useRef<MountedTile[]>([])
    const committedLevel = useRef(-1)
    const pendingRef = useRef<MountedTile[] | null>(null)
    const pendingLevel = useRef(-1)
    const pendingNeed = useRef<Set<string>>(new Set())
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { heightScale, oceanDivisor, promoteMinRes, promoteRatio, colorMode, waterOpacity } = settings

    useEffect(() => {
        let live = true
        loadAttrIndex().then(a => { if (live) setAttrs(a) })
        return () => { live = false }
    }, [])

    useEffect(() => {
        let live = true
        fetch(INDEX_URL)
            .then(r => r.json())
            .then((idx: IndexJson) => {
                if (!live) return
                const m = parseIndex(idx)
                setManifest(m)
                setLevelIdx(m.levels.length - 1) // start coarse
                buildPalette(m).then(p => { if (live) setPalette(p) })
            })
            .catch(err => console.error('DEM tiles: could not load index', err))
        return () => { live = false }
    }, [])

    // manual level picks take effect only while auto is off
    useEffect(() => {
        if (!settings.auto && settings.levelIdx >= 0) setLevelIdx(settings.levelIdx)
    }, [settings.auto, settings.levelIdx])

    const activeLevels = useMemo(() => manifest?.levels ?? [], [manifest])
    const level = activeLevels[levelIdx] ?? null
    const seaLevel = palette ? (-palette.minElev / oceanDivisor) * LAT_STRETCH * heightScale : 0

    // the shared water material's opacity follows the setting; the material
    // is module-level so this is a plain mutation, not a re-render trigger
    waterMaterial.opacity = waterOpacity

    /** swap the staged level in: the outgoing tiles unmount and the incoming
     * ones flip visible in the same commit, so there is never a frame with
     * neither on screen (and never one with both, which would z-fight) */
    const commitPending = useCallback(() => {
        if (!pendingRef.current) return
        if (holdTimer.current) {
            clearTimeout(holdTimer.current)
            holdTimer.current = null
        }
        committedRef.current = pendingRef.current
        committedLevel.current = pendingLevel.current
        setCommitted(pendingRef.current)
        pendingRef.current = null
        pendingNeed.current.clear()
        setPending(null)
        markShadowsDirty()
    }, [])

    const handleReady = useCallback((key: string) => {
        if (!pendingNeed.current.delete(key)) return
        if (pendingNeed.current.size === 0) commitPending()
    }, [commitPending])

    /**
     * Same level (ordinary pan): commit straight through - tiles that persist
     * keep their instances, only edge tiles mount.
     *
     * Level change: the whole set is replaced at once, and clearing it before
     * the replacements finish their fetch+parse is what made the map blink.
     * So stage it instead - mount the new level invisible, hold the old one,
     * and swap only once every new tile reports ready.
     */
    const handleTiles = useCallback((next: MountedTile[], li: number) => {
        // nothing on screen yet (first load): nothing to protect, let tiles
        // pop in as they arrive rather than withholding the whole first frame
        if (li === committedLevel.current || committedRef.current.length === 0) {
            committedLevel.current = li
            if (holdTimer.current) {
                clearTimeout(holdTimer.current)
                holdTimer.current = null
            }
            pendingRef.current = null
            pendingNeed.current.clear()
            setPending(null)
            committedRef.current = next
            setCommitted(next)
            return
        }
        // tiles already on screen (coarse fallbacks are shared between
        // levels) need no warm-up and must not be mounted twice
        const have = new Set(committedRef.current.map(tileKeyOf))
        pendingRef.current = next
        pendingLevel.current = li
        pendingNeed.current = new Set(next.map(tileKeyOf).filter(k => !have.has(k)))
        setPending(next)
        if (pendingNeed.current.size === 0) {
            commitPending()
            return
        }
        // a stalled fetch must not strand the map on the old level forever
        if (holdTimer.current) clearTimeout(holdTimer.current)
        holdTimer.current = setTimeout(commitPending, HOLD_MAX_MS)
    }, [commitPending])

    useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current) }, [])

    // pending tiles that are not already drawn by the committed set
    const warming = useMemo(() => {
        if (!pending) return []
        const have = new Set(committed.map(tileKeyOf))
        return pending.filter(t => !have.has(tileKeyOf(t)))
    }, [pending, committed])

    // ---- stats out, auto-level in ----
    const statsRef = useRef<DemStats>({ zoom: 0, mPerPx: 0, autoRes: 0, levelIdx: 0, tiles: 0, warming: 0 })
    const onStatsRef = useRef(onStats)
    onStatsRef.current = onStats

    const handleStats = useCallback((next: { zoom: number, mPerPx: number, res: number }) => {
        const prev = statsRef.current
        if (Math.abs(prev.zoom - next.zoom) > prev.zoom * 0.01 || prev.autoRes !== next.res) {
            statsRef.current = { ...prev, zoom: next.zoom, mPerPx: next.mPerPx, autoRes: next.res }
            onStatsRef.current?.(statsRef.current)
        }
        const on = next.zoom >= WATER_MIN_ZOOM
        setWaterOn(w => w === on ? w : on)
        if (!settings.auto) return
        const idx = activeLevels.findIndex(l => l.res === next.res)
        if (idx >= 0) setLevelIdx(i => i === idx ? i : idx)
    }, [settings.auto, activeLevels])

    useEffect(() => {
        statsRef.current = { ...statsRef.current, levelIdx, tiles: committed.length, warming: warming.length }
        onStatsRef.current?.(statsRef.current)
    }, [levelIdx, committed.length, warming.length])

    // ---- the frame (stable geometry) and the api handed to scene children ----
    const frame = useMemo<MapFrame | null>(() => {
        if (!manifest || !palette) return null
        const heightOffset = -palette.minElev / oceanDivisor
        const projectMerc = (mx: number, my: number): [number, number] =>
            [(manifest.originY - my) * UNITS_PER_METER, -(mx - manifest.originX) * UNITS_PER_METER]
        const project = (lat: number, lng: number): [number, number] => {
            const [mx, my] = latLngToMercator([lat, lng])
            return projectMerc(mx, my)
        }
        const unproject = (x: number, z: number): [number, number] =>
            mercToLatLng(manifest.originX - z / UNITS_PER_METER, manifest.originY - x / UNITS_PER_METER)
        const sceneY = (elevM: number) => {
            const y = elevM < 0 ? elevM / oceanDivisor : elevM
            return Math.max((y + heightOffset) * LAT_STRETCH * heightScale, MIN_BOX_H)
        }
        const sea = heightOffset * LAT_STRETCH * heightScale
        return { manifest, seaLevel: sea, project, projectMerc, unproject, sceneY }
    }, [manifest, palette, oceanDivisor, heightScale])

    const api = useMemo<DemMapApi | null>(() => {
        if (!frame || !manifest || !palette) return null
        return {
            ...frame,
            frame,
            palette,
            levels: manifest.levels,
            levelIdx,
            controls,
            sampleElevation: async (lat, lng) => {
                const [mx, my] = latLngToMercator([lat, lng])
                const S = manifest.tileSize
                const want = manifest.levels[levelIdx]
                if (!want) return null
                const r = resolveTile(
                    manifest.levels, levelIdx,
                    Math.floor((mx - manifest.originX) / (want.res * S)),
                    Math.floor((manifest.originY - my) / (want.res * S)),
                )
                if (!r) return null
                const lv = manifest.levels[r.li]
                const px = Math.floor((mx - manifest.originX) / lv.res) - r.tx * S
                const py = Math.floor((manifest.originY - my) / lv.res) - r.ty * S
                if (px < 0 || py < 0 || px >= S || py >= S) return null
                const tile = await loadTile(tileUrl(lv, r.tx, r.ty))
                if (!tile) return null
                const idx = py * S + px
                const e = tile.mean[idx]
                if (!(e > NODATA_CUTOFF)) return null
                const peak = tile.max[idx]
                const promote = lv.res >= promoteMinRes && e <= 0 && peak > 0 && e > -peak * promoteRatio
                return promote ? peak : e
            },
            flyTo: ({ lat, lng, spanM, animate = true }) => {
                if (!controls) return
                const [x, z] = frame.project(lat, lng)
                const sea = frame.seaLevel
                const d = 500 // ortho: direction matters, distance is style
                controls.setLookAt(x + 0.55 * d, sea + 0.78 * d, z + 0.35 * d, x, sea, z, animate)
                const host = hostRef.current
                const short = host ? Math.min(host.clientWidth, host.clientHeight) : Math.min(window.innerWidth, window.innerHeight)
                controls.zoomTo(short / (spanM * UNITS_PER_METER), animate)
            },
        }
    }, [frame, manifest, palette, levelIdx, controls, promoteMinRes, promoteRatio])

    const onApiRef = useRef(onApi)
    onApiRef.current = onApi
    useEffect(() => { onApiRef.current?.(api) }, [api])

    // Settle on the initial view once the manifest AND the controls are ready.
    // api exists as soon as the terrain loads, which can be before <CameraControls>
    // has handed back its ref - arming the guard then would burn the one shot.
    const started = useRef(false)
    useEffect(() => {
        if (started.current || !api?.controls || !initialView) return
        started.current = true
        api.flyTo({ ...initialView, animate: false })
    }, [api, initialView])

    const drawnLevel = activeLevels[committedLevel.current] ?? level
    const water = waterOpacity > 0 && waterOn
    const waterColumns = water && !!drawnLevel && drawnLevel.res <= WATER_COLUMNS_MAX_RES

    const tileProps = {
        manifest: manifest!,
        palette: palette!,
        heightScale,
        oceanDivisor,
        promoteMinRes,
        promoteRatio,
        attrs,
        colorMode,
    }

    return (
        <div ref={hostRef} className='absolute inset-0'>
            <Canvas
                orthographic
                shadows
                camera={{ zoom: 2, position: [400, 500, -500], near: -5000, far: 10000 }}
                // dev-only debug handle for poking at the scene from the console
                onCreated={import.meta.env.DEV ? s => { (window as unknown as Record<string, unknown>).__demScene = s.scene } : undefined}
            >
                <color attach='background' args={[background]} />
                {/* cool blue skylight from above, warm sand/ocean bounce from below */}
                <hemisphereLight args={['#bdd4ee', '#997f5f', 1.0]} />
                {/* shadowless base brightness so shadows stay soft */}
                <ambientLight color='#f2ede4' intensity={settings.ambient} />
                <SceneRig
                    controls={controls}
                    squareRef={squareRef}
                    shadows={settings.shadows}
                    sunIntensity={settings.sunIntensity}
                    seaLevel={seaLevel}
                    waveAmp={WAVE_AMP_M * LAT_STRETCH * heightScale}
                    lockTarget={lockTarget}
                />
                {manifest && level && (
                    <TileWindow
                        levelIdx={levelIdx}
                        levels={activeLevels}
                        manifest={manifest}
                        squareRef={squareRef}
                        detailPx={settings.detailPx}
                        onTiles={handleTiles}
                        onStats={handleStats}
                    />
                )}
                {manifest && palette && committed.map(t => (
                    <DemTile
                        key={tileKeyOf(t)}
                        tileKey={tileKeyOf(t)}
                        visible
                        level={t.level}
                        addr={t}
                        water={water && t.level.res <= WATER_COLUMNS_MAX_RES}
                        {...tileProps}
                    />
                ))}
                {/* next level warming up behind the current one */}
                {manifest && palette && warming.map(t => (
                    <DemTile
                        key={tileKeyOf(t)}
                        tileKey={tileKeyOf(t)}
                        visible={false}
                        onReady={handleReady}
                        level={t.level}
                        addr={t}
                        water={water && t.level.res <= WATER_COLUMNS_MAX_RES}
                        {...tileProps}
                    />
                ))}
                {/* flat sea at the overview levels, where columns would be too many */}
                {palette && water && !waterColumns && (
                    <OceanSheet seaLevel={seaLevel} squareRef={squareRef} opacity={waterOpacity} />
                )}
                {api && children?.(api)}
                {/* polar cap keeps the camera above the horizon, but only just */}
                <CameraControls
                    ref={setControls}
                    maxPolarAngle={THREE.MathUtils.degToRad(MAX_POLAR_DEG)}
                    minZoom={0.3}
                />
            </Canvas>
        </div>
    )
}
