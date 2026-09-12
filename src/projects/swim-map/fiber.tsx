import { CameraControls, Line, Text, useCursor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type CameraControlsImpl from 'camera-controls'
import { scaleQuantile, type ScaleQuantile } from 'd3-scale'
import { schemeTableau10 } from 'd3-scale-chromatic'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Line2 } from 'three-stdlib'
import ExplosionConfetti from './confetti'
import { Onboarding } from './onboarding'
import { BETTY_SPOTLIGHT, RACES, UNITS_PER_METER, latestYear, resultsUrl, type CameraStart, type Course } from './races'
import { VoxelWater } from './water'

const safetyOrange = "#FF6600"

// swimmer hover-label billboard (scene units)
const LABEL_FONT = '/fonts/inter-regular.woff' // troika needs .woff, not .woff2; local so no CDN fetch
const LABEL_BOX_W = 1.2
const LABEL_BOX_H = 0.34
const LABEL_BOX_D = 0.1
const LABEL_FRAME = 0.05
// the box tracks the camera but stays a few degrees off dead-on (a slight yaw
// "lag" plus tilt) so its depth reads as 3d while the text stays legible
const LABEL_YAW = THREE.MathUtils.degToRad(9)
const LABEL_TILT = THREE.MathUtils.degToRad(-5)
// the label anchors at each race's configured labelAnchor lat/lng (races.ts)

// swimmers keep swimming this far past the finish gate, then celebrate
const FINISH_OVERRUN_M = 40
// the confetti component animates at "human" scale (~1 unit = 1m); shrink it
// to fit the scene (0.0025 units/m world)
const CONFETTI_SCALE = 0.15
// with ~500 swimmers finishing, cap how many confetti bursts run at once;
// swimmers over the cap just disappear at the end of their overrun
const MAX_CONFETTI = 20

const DATASETS: Record<string, string> = {
    'Waimea 10m': '/data/waimea-10m',
    'Waimea 200m': '/data/waimea-200m',
}

interface Grid {
    name: string
    nRows: number
    nCols: number
    cellX: number // meters per cell, EPSG:3857
    cellY: number
    col0CenterX: number // mercator x of col 0 cell center
    row0CenterY: number // mercator y of row 0 cell center (rows go north -> south)
    elev: Float32Array // row-major, NaN = no data
}

async function loadGrid(base: string): Promise<Grid> {
    const [meta, buf] = await Promise.all([
        fetch(`${base}.meta.json`).then(r => r.json()),
        fetch(`${base}.bin`).then(r => r.arrayBuffer()),
    ])
    return { ...meta, elev: new Float32Array(buf) }
}

/** average stride x stride blocks into one cell */
function downsample(g: Grid, stride: number): Grid {
    if (stride === 1) return g
    const nRows = Math.ceil(g.nRows / stride)
    const nCols = Math.ceil(g.nCols / stride)
    const out = new Float32Array(nRows * nCols).fill(NaN)
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            let sum = 0, n = 0
            for (let rr = r * stride; rr < Math.min((r + 1) * stride, g.nRows); rr++) {
                for (let cc = c * stride; cc < Math.min((c + 1) * stride, g.nCols); cc++) {
                    const e = g.elev[rr * g.nCols + cc]
                    if (!Number.isNaN(e)) { sum += e; n++ }
                }
            }
            if (n > 0) out[r * nCols + c] = sum / n
        }
    }
    return {
        ...g,
        nRows,
        nCols,
        cellX: g.cellX * stride,
        cellY: g.cellY * stride,
        col0CenterX: g.col0CenterX + ((stride - 1) / 2) * g.cellX,
        row0CenterY: g.row0CenterY - ((stride - 1) / 2) * g.cellY,
        elev: out,
    }
}

/**
 * One pass of Laplacian smoothing over the heightfield.
 * Each cell moves toward the average of its N/S/E/W neighbors by `strength`.
 * strength = 0 -> untouched, strength = 1 -> pure neighbor average.
 * Repeated passes approximate a Gaussian blur of the terrain.
 */
function smoothPass(elev: Float32Array, nRows: number, nCols: number, strength: number): Float32Array {
    const out = new Float32Array(elev.length)
    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            const i = r * nCols + c
            const e = elev[i]
            if (Number.isNaN(e)) { out[i] = NaN; continue }
            let sum = 0, n = 0
            if (r > 0 && !Number.isNaN(elev[i - nCols])) { sum += elev[i - nCols]; n++ }
            if (r < nRows - 1 && !Number.isNaN(elev[i + nCols])) { sum += elev[i + nCols]; n++ }
            if (c > 0 && !Number.isNaN(elev[i - 1])) { sum += elev[i - 1]; n++ }
            if (c < nCols - 1 && !Number.isNaN(elev[i + 1])) { sum += elev[i + 1]; n++ }
            out[i] = n > 0 ? e + strength * (sum / n - e) : e
        }
    }
    return out
}

// grid is EPSG:3857 (Web Mercator); project [lat, lng] into it
const EARTH_RADIUS = 6378137
function latLngToMercator([lat, lng]: number[]): [number, number] {
    return [
        (lng * Math.PI / 180) * EARTH_RADIUS,
        Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * EARTH_RADIUS,
    ]
}

/** inverse of latLngToMercator ∘ mercToScene, for the buoy editor */
function sceneToLatLng(g: Grid, x: number, z: number): [number, number] {
    const row = x / (g.cellY * UNITS_PER_METER) + (g.nRows - 1) / 2
    const col = -z / (g.cellX * UNITS_PER_METER) + (g.nCols - 1) / 2
    const mx = g.col0CenterX + col * g.cellX
    const my = g.row0CenterY - row * g.cellY
    return [
        (2 * Math.atan(Math.exp(my / EARTH_RADIUS)) - Math.PI / 2) * 180 / Math.PI,
        (mx / EARTH_RADIUS) * 180 / Math.PI,
    ]
}

const oceanColors = [
    'rgb(0, 30, 80)',
    'rgb(0, 51, 102)',
    'rgb(0, 102, 153)',
    'rgb(0, 153, 205)',
    'rgb(100, 200, 255)',
    // 'rgb(198, 236, 255)'
];

// light coastal green -> dark jungle green
const landColors = [
    'rgb(181, 200, 141)',
    'rgb(152, 186, 121)',
    'rgb(122, 166, 101)',
    'rgb(96, 146, 86)',
    'rgb(72, 126, 71)',
    'rgb(52, 106, 60)',
    'rgb(37, 86, 50)',
    'rgb(26, 66, 41)'
];

const sandColor = 'rgb(230, 214, 168)'

export interface View {
    g: Grid
    y: Float32Array // display elevation (ocean compression applied), NaN = no data
    distToOcean: Uint16Array // grid-cell steps to the nearest ocean cell (0 = ocean)
    heightOffset: number
    oceanColorScale: ScaleQuantile<string>
    landColorScale: ScaleQuantile<string>
}

const MAX_OCEAN_DIST = 64 // cells; beyond this we don't care (never beach)

/** multi-source BFS from every ocean cell, in grid steps */
function oceanDistance(y: Float32Array, nRows: number, nCols: number): Uint16Array {
    const dist = new Uint16Array(y.length).fill(65535)
    let frontier: number[] = []
    for (let i = 0; i < y.length; i++) {
        if (y[i] < 0) { dist[i] = 0; frontier.push(i) }
    }
    let d = 1
    while (frontier.length > 0 && d <= MAX_OCEAN_DIST) {
        const next: number[] = []
        for (const i of frontier) {
            const r = (i / nCols) | 0
            const c = i - r * nCols
            const neighbors = [
                r > 0 ? i - nCols : -1,
                r < nRows - 1 ? i + nCols : -1,
                c > 0 ? i - 1 : -1,
                c < nCols - 1 ? i + 1 : -1,
            ]
            for (const n of neighbors) {
                if (n >= 0 && dist[n] === 65535 && !Number.isNaN(y[n])) {
                    dist[n] = d
                    next.push(n)
                }
            }
        }
        frontier = next
        d++
    }
    return dist
}

/** all terrain blocks in a single draw call */
function TerrainInstances({ view, heightScale, blockFootprint, beachMaxElev, beachReachCells }: {
    view: View, heightScale: number, blockFootprint: number, beachMaxElev: number, beachReachCells: number
}) {
    const { g, y, distToOcean, heightOffset, oceanColorScale, landColorScale } = view
    const ref = useRef<THREE.InstancedMesh>(null!)

    const count = useMemo(() => {
        let n = 0
        for (let i = 0; i < y.length; i++) if (!Number.isNaN(y[i])) n++
        return n
    }, [y])

    useLayoutEffect(() => {
        const mesh = ref.current
        const m = new THREE.Matrix4()
        const color = new THREE.Color()
        const rowCell = g.cellY * UNITS_PER_METER // scene x axis follows rows
        const colCell = g.cellX * UNITS_PER_METER // scene z axis follows cols
        const cR = (g.nRows - 1) / 2
        const cC = (g.nCols - 1) / 2
        let i = 0
        for (let r = 0; r < g.nRows; r++) {
            for (let c = 0; c < g.nCols; c++) {
                const idx = r * g.nCols + c
                const yv = y[idx]
                if (Number.isNaN(yv)) continue
                const h = Math.max((yv + heightOffset) * heightScale, 0.002)
                m.makeScale(rowCell * blockFootprint, h, colCell * blockFootprint)
                m.setPosition((r - cR) * rowCell, h / 2, -(c - cC) * colCell)
                mesh.setMatrixAt(i, m)
                // beach: low-lying land close to the ocean; high coastal cliffs
                // fail the elevation test, low inland valleys fail the distance test
                const isBeach = yv >= 0 && yv <= beachMaxElev && distToOcean[idx] <= beachReachCells
                mesh.setColorAt(i, color.set(
                    yv < 0 ? oceanColorScale(yv) : isBeach ? sandColor : landColorScale(yv)
                ))
                i++
            }
        }
        mesh.count = i
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        mesh.computeBoundingSphere()
    }, [view, heightScale, blockFootprint, beachMaxElev, beachReachCells, g, y, distToOcean, heightOffset, oceanColorScale, landColorScale])

    return (
        <instancedMesh key={`${g.name}-${count}`} ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
            <boxGeometry />
            <meshStandardMaterial />
        </instancedMesh>
    )
}

/** scene x/z for a mercator point, fractional (not snapped to a cell center) */
function mercToScene(g: Grid, mx: number, my: number): [number, number] {
    const row = (g.row0CenterY - my) / g.cellY
    const col = (mx - g.col0CenterX) / g.cellX
    return [
        (row - (g.nRows - 1) / 2) * g.cellY * UNITS_PER_METER,
        -(col - (g.nCols - 1) / 2) * g.cellX * UNITS_PER_METER,
    ]
}

/** scene-space top of the terrain column under scene (x, z); 0 if off-grid or no data */
function terrainTopAt(view: View, heightScale: number, x: number, z: number): number {
    const { g, y, heightOffset } = view
    // inverse of mercToScene's cell -> scene mapping
    const r = Math.round(x / (g.cellY * UNITS_PER_METER) + (g.nRows - 1) / 2)
    const c = Math.round(-z / (g.cellX * UNITS_PER_METER) + (g.nCols - 1) / 2)
    if (r < 0 || r >= g.nRows || c < 0 || c >= g.nCols) return 0
    const e = y[r * g.nCols + c]
    if (Number.isNaN(e)) return 0
    return Math.max((e + heightOffset) * heightScale, 0.002)
}

// playback speed = course time / wall time; the clock counts course ms, so
// switching speed mid-race never teleports the swimmers.
// 2x (120: 1 course minute in 500ms) matches the original fixed speed
// Tailwind's `sm` breakpoint, as a media query — the layout switches between
// the phone column and the free-floating desktop chrome here
const SM_UP = '(min-width: 640px)'

// Auto-fit framing: the fraction of the canvas the buoys should span. Scaling
// with the viewport (rather than reserving a fixed pixel margin) frames a phone
// as tightly as a desktop. Vertical is tighter — the playback bar and the top
// pill overlay the top and bottom of the canvas. The leftover margin is also
// what keeps wandering swimmers, and the run past the finish gate, in frame.
const FIT_FRACTION_X = 0.78
const FIT_FRACTION_Y = 0.70

const SPEED_PRESETS = [
    { label: '1×', factor: 1 }, // real-time
    { label: '120×', factor: 120 }, // ~1 course minute every 500ms (the original fixed speed)
    { label: '240×', factor: 240 },
]

// Pacing profiles: map time-fraction u -> distance-fraction within a leg.
// Each satisfies f(0)=0 and f(1)=1, so every leg (and the race) still takes
// exactly the swimmer's real time — the profile only redistributes speed
// within a leg. Derivatives stay within 0.75..1.25 (±25%), a realistic swing
// for open-water swimming.
const SIN_AMP = 0.25 / (2 * Math.PI) // sine terms: |f'-1| <= 0.25
const SPEED_PROFILES: { name: string, f: (u: number) => number }[] = [
    { name: 'steady', f: u => u },
    // negative split: starts ~25% slow, builds to ~25% fast at the buoy
    { name: 'negative-split', f: u => 0.75 * u + 0.25 * u * u },
    // fast start: charges off the line, fades ~25% by the buoy
    { name: 'fast-start', f: u => 1.25 * u - 0.25 * u * u },
    // mid-leg surge: settles in, surges through the middle, eases into the buoy
    { name: 'mid-surge', f: u => u - SIN_AMP * Math.sin(2 * Math.PI * u) },
    // mid-leg lull: pushes at the start and finish of each leg, lulls mid-leg
    { name: 'mid-lull', f: u => u + SIN_AMP * Math.sin(2 * Math.PI * u) },
]

/**
 * Freezes the shadow map: every shadow caster in the scene is static (terrain,
 * buoys — swimmers and water don't cast), yet three.js re-renders the whole
 * shadow pass each frame by default, roughly doubling geometry cost. Render it
 * once, then only when something a shadow depends on actually changes.
 */
function ShadowFreeze({ casters }: { casters: unknown[] }) {
    const gl = useThree(s => s.gl)
    useEffect(() => {
        gl.shadowMap.autoUpdate = false
        return () => { gl.shadowMap.autoUpdate = true }
    }, [gl])
    useEffect(() => {
        gl.shadowMap.needsUpdate = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gl, ...casters])
    return null
}

/** advances the shared race clock (in course ms); all swimmers read from it so they stay in sync */
function RaceClock({ clockRef, playing, speed }: {
    clockRef: React.MutableRefObject<number>
    playing: boolean
    speed: number
}) {
    useFrame((_, delta) => {
        if (playing) clockRef.current += delta * 1000 * speed
    })
    return null
}

interface SwimmerEntry {
    bib: string
    name: string
    minutes: number
    color: string
}

/** stable per-swimmer randomness: lane across the gates, per-leg arc bulge,
 * pacing profile, and a tiny height jitter so overlapping boxes don't z-fight */
interface SwimmerRand {
    /** each leg bows out perpendicular to the straight line by 5-18%, random side */
    bulges: number[]
    lane: { start: number, finish: number, yJitter: number }
    pace: (u: number) => number
}

function makeRand(nLegs: number): SwimmerRand {
    return {
        bulges: Array.from({ length: nLegs }, () => (0.05 + Math.random() * 0.13) * (Math.random() < 0.5 ? -1 : 1)),
        lane: {
            start: (Math.random() - 0.5) * 0.8, // +/- 40% of gate width
            finish: (Math.random() - 0.5) * 0.8,
            yJitter: Math.random() * 0.02,
        },
        pace: SPEED_PROFILES[Math.floor(Math.random() * SPEED_PROFILES.length)].f,
    }
}

/** bezier path through the course for one swimmer's lane + bulges */
function makePath(g: Grid, course: Course, rand: SwimmerRand) {
    const last = course.waypoints.length - 1
    const pts = course.waypoints.map((pt, i) => {
        let [mx, my] = latLngToMercator(pt)
        const laneFrac = i === 0 ? rand.lane.start : i === last ? rand.lane.finish : 0
        if (laneFrac !== 0) {
            const bearing = (i === 0 ? course.startGateBearing : course.finishGateBearing) * Math.PI / 180
            const offM = laneFrac * course.gateWidthM / Math.cos(pt[0] * Math.PI / 180)
            mx += Math.sin(bearing) * offM
            my += Math.cos(bearing) * offM
        }
        const [x, z] = mercToScene(g, mx, my)
        return new THREE.Vector3(x, 0, z)
    })
    const curves: THREE.QuadraticBezierCurve3[] = []
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const dir = b.clone().sub(a)
        const perp = new THREE.Vector3(-dir.z, 0, dir.x)
        const mid = a.clone().lerp(b, 0.5).add(perp.multiplyScalar(rand.bulges[i]))
        curves.push(new THREE.QuadraticBezierCurve3(a, mid, b))
    }
    // time is proportional to distance across legs (same average speed per
    // leg); the pacing profile only warps time *within* a leg
    const lengths = curves.map(c => c.getLength())
    const total = lengths.reduce((s, l) => s + l, 0)
    let acc = 0
    const legs = curves.map((curve, i) => {
        const t0 = acc / total
        acc += lengths[i]
        return { curve, t0, t1: acc / total }
    })
    // straight overrun past the finish, continuing the final tangent
    const finish = pts[pts.length - 1]
    const finishDir = curves[curves.length - 1].getTangentAt(1).setY(0).normalize()
    const overrunEnd = finish.clone().addScaledVector(finishDir, FINISH_OVERRUN_M * UNITS_PER_METER)
    return { legs, finish, finishDir, overrunEnd, totalLen: total }
}

/**
 * All swimmers in one InstancedMesh (one draw call, one useFrame) instead of a
 * mesh + material + frame callback per swimmer — the difference between ~550
 * scene objects and 2 when the whole field races. A second invisible instanced
 * mesh with a 5x geometry is the hover hitbox (swimmers are near sub-pixel at
 * low zoom); it shares the visible mesh's instanceMatrix so it's written once.
 * Finished swimmers collapse to zero scale (hides them and kills raycasts).
 */
function SwimmerField({ view, course, heightScale, raceKey, swimmers, clockRef, loop, positionsRef, onHover, onSelect }: {
    view: View
    course: Course
    heightScale: number
    raceKey: string
    swimmers: SwimmerEntry[]
    clockRef: React.MutableRefObject<number>
    loop: boolean
    positionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    onHover: (bib: string, name: string, color: string) => void
    /** click/tap — pins the label; the only way in on touch, which has no hover */
    onSelect: (bib: string, name: string, color: string) => void
}) {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const hitRef = useRef<THREE.InstancedMesh>(null!)
    const [hovered, setHovered] = useState(false)
    const lastHover = useRef<number | null>(null)
    useCursor(hovered)

    // Per-swimmer randomness must stay stable across selection toggles and
    // buoy drags (the course object changes identity every move), so it lives
    // in a per-bib cache, cleared only when the race changes.
    const randCache = useRef(new Map<string, SwimmerRand>())
    const randRace = useRef(raceKey)
    if (randRace.current !== raceKey) {
        randRace.current = raceKey
        randCache.current.clear()
    }

    // bibs celebrated (confetti popped, hidden); survives path rebuilds
    const celebrated = useRef(new Set<string>())
    // active confetti bursts, capped at MAX_CONFETTI
    const [bursts, setBursts] = useState<{ bib: string, color: string, pos: [number, number, number] }[]>([])

    const sims = useMemo(() => swimmers.map(s => {
        let rand = randCache.current.get(s.bib)
        if (!rand) {
            rand = makeRand(course.waypoints.length - 1)
            randCache.current.set(s.bib, rand)
        }
        return { ...s, rand, path: makePath(view.g, course, rand), raceMs: s.minutes * 60_000 }
    }), [swimmers, view.g, course])

    // prune celebration/burst/position state for swimmers no longer on the map
    useEffect(() => {
        const valid = new Set(swimmers.map(s => s.bib))
        setBursts(bs => bs.some(b => !valid.has(b.bib)) ? bs.filter(b => valid.has(b.bib)) : bs)
        for (const bib of [...celebrated.current]) if (!valid.has(bib)) celebrated.current.delete(bib)
        for (const bib of [...positionsRef.current.keys()]) if (!valid.has(bib)) positionsRef.current.delete(bib)
    }, [swimmers, positionsRef])

    // per-instance colors; the hitbox shares the visible mesh's matrices
    useLayoutEffect(() => {
        const mesh = meshRef.current
        const hit = hitRef.current
        if (!mesh || !hit) return
        hit.instanceMatrix = mesh.instanceMatrix
        const color = new THREE.Color()
        sims.forEach((s, i) => mesh.setColorAt(i, color.set(s.color)))
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }, [sims])

    // half a voxel, but never smaller than 20m x 20m so swimmers stay visible
    // on fine-grained strides
    const size = Math.max(20, view.g.cellY * 0.5) * UNITS_PER_METER
    const seaLevel = view.heightOffset * heightScale

    const scratch = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3() }), [])

    useFrame(() => {
        const mesh = meshRef.current
        if (!mesh) return
        const { m, p } = scratch
        const ms = clockRef.current
        const finished: typeof bursts = []
        const restarted: string[] = []
        for (let i = 0; i < sims.length; i++) {
            const s = sims[i]
            let hidden = false
            if (!loop && ms >= s.raceMs) {
                // finished: keep swimming past the gate at race-average pace,
                // then pop the confetti and hold (hidden) position
                const overrunLen = FINISH_OVERRUN_M * UNITS_PER_METER
                const overrunMs = s.raceMs * (overrunLen / s.path.totalLen)
                const k = Math.min((ms - s.raceMs) / overrunMs, 1)
                p.set(
                    s.path.finish.x + s.path.finishDir.x * overrunLen * k,
                    seaLevel + s.rand.lane.yJitter,
                    s.path.finish.z + s.path.finishDir.z * overrunLen * k,
                )
                if (k >= 1) {
                    hidden = true
                    if (!celebrated.current.has(s.bib)) {
                        celebrated.current.add(s.bib)
                        finished.push({
                            bib: s.bib,
                            color: s.color,
                            pos: [s.path.overrunEnd.x, seaLevel + s.rand.lane.yJitter, s.path.overrunEnd.z],
                        })
                    }
                }
            } else {
                if (celebrated.current.has(s.bib)) {
                    // clock was restarted
                    celebrated.current.delete(s.bib)
                    restarted.push(s.bib)
                }
                const t = loop ? (ms % s.raceMs) / s.raceMs : Math.min(ms / s.raceMs, 1)
                // find the current leg, ease time within it, then sample by arc length
                let leg = s.path.legs[s.path.legs.length - 1]
                for (const l of s.path.legs) if (t <= l.t1) { leg = l; break }
                const u = (t - leg.t0) / (leg.t1 - leg.t0)
                leg.curve.getPointAt(THREE.MathUtils.clamp(s.rand.pace(u), 0, 1), p)
                p.y = seaLevel + s.rand.lane.yJitter
            }
            const sc = hidden ? 0 : size
            m.makeScale(sc, sc, sc)
            m.setPosition(p)
            mesh.setMatrixAt(i, m)
            // publish position for the hover-label leader line
            let reg = positionsRef.current.get(s.bib)
            if (!reg) { reg = new THREE.Vector3(); positionsRef.current.set(s.bib, reg) }
            reg.copy(p)
        }
        mesh.instanceMatrix.needsUpdate = true
        if (finished.length > 0 || restarted.length > 0) {
            setBursts(bs => {
                let next = restarted.length ? bs.filter(b => !restarted.includes(b.bib)) : bs
                for (const f of finished) {
                    if (next.length < MAX_CONFETTI) next = [...next, f]
                }
                return next
            })
        }
    })

    /** resolve an instanced-mesh event to a swimmer, skipping finished (hidden) ones */
    const simAt = (e: { instanceId?: number, stopPropagation: () => void }) => {
        const id = e.instanceId
        if (id === undefined || id >= sims.length) return null
        const s = sims[id]
        if (celebrated.current.has(s.bib)) return null
        e.stopPropagation()
        return { id, s }
    }

    const handlePointer = (e: { instanceId?: number, stopPropagation: () => void }) => {
        const hit = simAt(e)
        if (!hit) return
        setHovered(true)
        if (lastHover.current !== hit.id) {
            lastHover.current = hit.id
            onHover(hit.s.bib, hit.s.name, hit.s.color)
        }
    }

    const handleClick = (e: { instanceId?: number, stopPropagation: () => void }) => {
        const hit = simAt(e)
        if (hit) onSelect(hit.s.bib, hit.s.name, hit.s.color)
    }

    if (sims.length === 0) return null

    return (
        <>
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, sims.length]}
                frustumCulled={false}
            >
                <boxGeometry />
                <meshStandardMaterial />
            </instancedMesh>
            {/* invisible meshes still raycast: this is the widened hover target */}
            <instancedMesh
                ref={hitRef}
                args={[undefined, undefined, sims.length]}
                visible={false}
                frustumCulled={false}
                onPointerOver={handlePointer}
                onPointerMove={handlePointer}
                onPointerOut={() => { setHovered(false); lastHover.current = null }}
                onClick={handleClick}
            >
                <boxGeometry args={[5, 5, 5]} />
                <meshBasicMaterial />
            </instancedMesh>
            {bursts.map(b => (
                <group key={b.bib} position={b.pos} scale={CONFETTI_SCALE}>
                    <ExplosionConfetti
                        numberOfExplosions={1}
                        particleAmount={100}
                        explosionCount={1}
                        spreadAreaRadius={0}
                        colorsArray={[b.color, '#e8bf56', '#e2f7ce', '#ffffff']}
                        onComplete={() => setBursts(bs => bs.filter(x => x.bib !== b.bib))}
                    />
                </group>
            ))}
        </>
    )
}

/** scene-space buoy positions (tetrahedron centers) + tetrahedron dimensions;
 * waypointOf maps each buoy back to its course waypoint (gates share one) */
function computeBuoys(view: View, course: Course, heightScale: number): {
    positions: THREE.Vector3[], waypointOf: number[], height: number, baseRadius: number
} {
    const { g, heightOffset } = view
    const seaLevel = heightOffset * heightScale
    // scale with voxel size: keeps the proportions of the large strides (~50m at
    // 40m cells) but shrinks on fine grids, never below the swimmer min (20m)
    const baseRadius = THREE.MathUtils.clamp(g.cellY * 1.15, 20, 50) * UNITS_PER_METER
    // 3-sided cone with h = r*sqrt(2) is a regular tetrahedron (all edges r*sqrt(3))
    const height = baseRadius * Math.SQRT2

    // buoy positions in mercator meters
    const merc: [number, number][] = []
    const waypointOf: number[] = []
    course.waypoints.forEach((pt, i) => {
        const [mx, my] = latLngToMercator(pt)
        const isGate = i === 0 || i === course.waypoints.length - 1
        if (!isGate) {
            merc.push([mx, my])
            waypointOf.push(i)
            return
        }
        const bearing = (i === 0 ? course.startGateBearing : course.finishGateBearing) * Math.PI / 180
        // ground meters -> mercator meters at this latitude
        const half = (course.gateWidthM / 2) / Math.cos(pt[0] * Math.PI / 180)
        const dx = Math.sin(bearing) * half // east
        const dy = Math.cos(bearing) * half // north
        merc.push([mx - dx, my - dy], [mx + dx, my + dy])
        waypointOf.push(i, i)
    })

    const positions = merc.map(([mx, my]) => {
        const [x, z] = mercToScene(g, mx, my)
        return new THREE.Vector3(x, seaLevel + height / 2, z)
    })
    return { positions, waypointOf, height, baseRadius }
}

/** race course markers: tetrahedra floating at sea level; start + finish are
 * 2-buoy gates. In edit mode (settings open) buoys are click-draggable: drags
 * move the underlying course waypoint (both buoys of a gate move together). */
function CourseMarkers({ buoys, g, waypoints, editable, selectedWaypoint, onSelectWaypoint, onMoveWaypoint, controlsRef }: {
    buoys: ReturnType<typeof computeBuoys>
    g: Grid
    waypoints: number[][]
    editable: boolean
    selectedWaypoint: number | null
    onSelectWaypoint: (i: number) => void
    onMoveWaypoint: (i: number, latlng: [number, number]) => void
    controlsRef: React.MutableRefObject<CameraControlsImpl | null>
}) {
    const [hovered, setHovered] = useState(false)
    useCursor(editable && hovered, 'grab')
    // drag = pointer capture on the buoy + raycast against a horizontal plane
    // at buoy height; the waypoint moves by the lat/lng delta since pointerdown
    const drag = useRef<{ wp: number, lat0: number, lng0: number, hitLat0: number, hitLng0: number } | null>(null)
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const hit = useRef(new THREE.Vector3())

    return (
        <>
            {buoys.positions.map((p, i) => {
                const wp = buoys.waypointOf[i]
                return (
                    <mesh
                        key={`buoy-${i}`}
                        position={p}
                        castShadow
                        onPointerOver={editable ? e => { e.stopPropagation(); setHovered(true) } : undefined}
                        onPointerOut={editable ? () => setHovered(false) : undefined}
                        onPointerDown={editable ? e => {
                            e.stopPropagation()
                            onSelectWaypoint(wp)
                            plane.current.constant = -p.y
                            if (!e.ray.intersectPlane(plane.current, hit.current)) return
                            const [hitLat0, hitLng0] = sceneToLatLng(g, hit.current.x, hit.current.z)
                            drag.current = { wp, lat0: waypoints[wp][0], lng0: waypoints[wp][1], hitLat0, hitLng0 }
                            ;(e.target as Element).setPointerCapture(e.pointerId)
                            if (controlsRef.current) controlsRef.current.enabled = false
                        } : undefined}
                        onPointerMove={editable ? e => {
                            const d = drag.current
                            if (!d || d.wp !== wp) return
                            e.stopPropagation()
                            if (!e.ray.intersectPlane(plane.current, hit.current)) return
                            const [lat, lng] = sceneToLatLng(g, hit.current.x, hit.current.z)
                            onMoveWaypoint(d.wp, [d.lat0 + lat - d.hitLat0, d.lng0 + lng - d.hitLng0])
                        } : undefined}
                        onPointerUp={editable ? e => {
                            if (drag.current) {
                                (e.target as Element).releasePointerCapture(e.pointerId)
                                drag.current = null
                            }
                            if (controlsRef.current) controlsRef.current.enabled = true
                        } : undefined}
                    >
                        {/* 3-sided cone = regular tetrahedron (see height above) */}
                        <coneGeometry args={[buoys.baseRadius, buoys.height, 3]} />
                        <meshStandardMaterial
                            color={safetyOrange}
                            emissive={editable && wp === selectedWaypoint ? '#ffd000' : 'black'}
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                )
            })}
        </>
    )
}

/**
 * hover label: swimmer-colored billboard box (white panel, black name) fixed
 * at `anchor` near a buoy, plus a fine leader line that tracks the swimmer;
 * stays up until dismissed via the corner button
 */
function SwimmerLabel({ bib, name, color, anchor, positionsRef, onDismiss }: {
    bib: string
    name: string
    color: string
    anchor: THREE.Vector3
    positionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    onDismiss: () => void
}) {
    const lineRef = useRef<Line2>(null!)
    const [dismissHovered, setDismissHovered] = useState(false)
    useCursor(dismissHovered)
    const boxRef = useRef<THREE.Group>(null!)
    const offsetQuat = useMemo(
        () => new THREE.Quaternion().setFromEuler(new THREE.Euler(LABEL_TILT, LABEL_YAW, 0)),
        []
    )

    useFrame(({ camera }) => {
        // near-billboard: camera orientation plus a fixed off-axis offset
        // (applied in the camera's local frame) so the box's depth is visible
        boxRef.current.quaternion.copy(camera.quaternion).multiply(offsetQuat)

        const line = lineRef.current
        if (!line) return
        const p = positionsRef.current.get(bib)
        if (!p) { line.visible = false; return }
        line.visible = true
        // imperative update only — changing the `points` prop rebuilds the
        // geometry through React every frame
        line.geometry.setPositions([
            p.x, p.y, p.z,
            anchor.x, anchor.y - LABEL_BOX_H / 2, anchor.z, // meet the box's bottom edge
        ])
    })

    const shown = name.length > 22 ? name.slice(0, 21) + '…' : name

    return (
        <>
            {/* dummy points; endpoints are set imperatively each frame, so the
                stale bounding sphere would cull the line without frustumCulled=false */}
            <Line ref={lineRef} points={[[0, 0, 0], [0, 0, 1]]} color={color} lineWidth={1} frustumCulled={false} />
            <group ref={boxRef} position={anchor}>
                {/* swimmer-colored slab; a touch of emissive keeps the frame
                    colorful no matter which way the box faces relative to the sun */}
                <mesh>
                    <boxGeometry args={[LABEL_BOX_W, LABEL_BOX_H, LABEL_BOX_D]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.5} />
                </mesh>
                {/* white panel proud of the slab so it (and the text) win the
                    depth test against the opaque colored box */}
                <mesh position={[0, 0, LABEL_BOX_D / 2]}>
                    <boxGeometry args={[LABEL_BOX_W - 2 * LABEL_FRAME, LABEL_BOX_H - 2 * LABEL_FRAME, 0.02]} />
                    <meshBasicMaterial color='white' />
                </mesh>
                <Text
                    position={[0, 0, LABEL_BOX_D / 2 + 0.015]}
                    fontSize={0.13}
                    color='black'
                    anchorX='center'
                    anchorY='middle'
                    font={LABEL_FONT}
                    // shrink long names to fit the panel once troika lays them out
                    onSync={(troika) => {
                        const [minX, , maxX] = troika.textRenderInfo.blockBounds
                        const maxW = LABEL_BOX_W - 2 * LABEL_FRAME - 0.06
                        troika.scale.setScalar(Math.min(1, maxW / (maxX - minX)))
                    }}
                >
                    {shown}
                </Text>
                {/* dismiss button: small dark cube on the top-right corner */}
                <mesh
                    position={[LABEL_BOX_W / 2, LABEL_BOX_H / 2, LABEL_BOX_D / 2]}
                    onClick={e => { e.stopPropagation(); onDismiss() }}
                    onPointerOver={e => { e.stopPropagation(); setDismissHovered(true) }}
                    onPointerOut={() => setDismissHovered(false)}
                >
                    <boxGeometry args={[0.14, 0.14, 0.06]} />
                    <meshStandardMaterial color={dismissHovered ? '#666' : '#333'} emissive='#222' />
                </mesh>
                <Text
                    position={[LABEL_BOX_W / 2, LABEL_BOX_H / 2, LABEL_BOX_D / 2 + 0.035]}
                    fontSize={0.11}
                    color='white'
                    anchorX='center'
                    anchorY='middle'
                    font={LABEL_FONT}
                >
                    ×
                </Text>
            </group>
        </>
    )
}

// ---- race results ----

interface Racer {
    place: number
    bib: string
    name: string
    chipTime: string
    minutes: number
    division: string
}

interface RaceResultsFile {
    headings: { key: string }[]
    resultSet: { results: (string | number | boolean)[][] }
}

/** "42:45.8" or "1:02:45" -> minutes */
function parseTimeToMinutes(t: string): number | null {
    const parts = t.split(':').map(Number)
    if (parts.length < 2 || parts.some(Number.isNaN)) return null
    let seconds = 0
    for (const p of parts) seconds = seconds * 60 + p
    return seconds / 60
}

function parseRacers(file: RaceResultsFile): Racer[] {
    const idx: Record<string, number> = {}
    file.headings.forEach((h, i) => { idx[h.key] = i })
    const out: Racer[] = []
    for (const row of file.resultSet.results) {
        const chipTime = String(row[idx.chip_time] ?? '')
        const minutes = parseTimeToMinutes(chipTime)
        if (minutes === null || minutes <= 0) continue
        out.push({
            place: Number(row[idx.race_placement]),
            bib: String(row[idx.bib_num]),
            name: String(row[idx.name]),
            chipTime,
            minutes,
            division: String(row[idx.division] || 'Unknown'),
        })
    }
    return out
}

const swimmerColors = [...schemeTableau10]

// shared dark-glass form styles
const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 '
    + 'placeholder:text-slate-500 transition focus:border-cyan-400/60 focus:bg-white/10 focus:outline-none'
const selectCls = inputCls + ' appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-slate-100'
const sectionLabelCls = 'text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500'

function ResultsPanel({
    raceKey, onSelectRace, year, onSelectYear, racers, selectedBibs, onToggle, onAddGroup, onClear,
    pinnedBib, onHoverSwimmer, onPinSwimmer,
}: {
    raceKey: string
    onSelectRace: (key: string) => void
    /** season currently shown (always one of the race's `years`) */
    year: number
    onSelectYear: (year: number) => void
    racers: Racer[]
    selectedBibs: string[]
    onToggle: (bib: string) => void
    onAddGroup: (group: string) => void
    onClear: () => void
    /** bib whose name label is pinned in the scene (roster click / 3d hover) */
    pinnedBib: string | null
    /** roster row hover: show that swimmer's name label (null on leave) */
    onHoverSwimmer: (bib: string | null) => void
    /** roster row click: pin/unpin that swimmer's name label */
    onPinSwimmer: (bib: string) => void
}) {
    const [query, setQuery] = useState('')

    const divisions = useMemo(() => {
        const counts = new Map<string, number>()
        for (const r of racers) counts.set(r.division, (counts.get(r.division) ?? 0) + 1)
        // non-age divisions (All, Top, Open, …) first, then age groups youngest
        // to oldest with Female before Male within each bracket (alphabetical)
        const ageOf = (d: string) => { const m = d.match(/\d+/); return m ? Number(m[0]) : -1 }
        return [...counts.entries()].sort((a, b) =>
            ageOf(a[0]) - ageOf(b[0]) || a[0].localeCompare(b[0])
        )
    }, [racers])

    const q = query.trim().toLowerCase()
    const matches = q
        ? racers.filter(r => r.name.toLowerCase().includes(q) || r.bib.includes(q))
        : racers
    const shown = matches.slice(0, 40)

    const selectedSet = new Set(selectedBibs)
    const byBib = new Map(racers.map(r => [r.bib, r]))
    const selectedRacers = selectedBibs.map(b => byBib.get(b)).filter((r): r is Racer => !!r)

    return (
        <div className='flex h-full flex-col gap-3 p-4 text-sm'>
            {/* header */}
            <div>
                <div className='text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400'>North Shore · Oahu</div>
                <h1 className='text-lg font-bold tracking-tight text-white'>Open Water Replay</h1>
            </div>

            {/* race switcher */}
            <div className='flex flex-col gap-1.5'>
                <span className={sectionLabelCls}>Race</span>
                {Object.entries(RACES).map(([key, r]) => {
                    const active = key === raceKey
                    return (
                        <button
                            key={key}
                            onClick={() => onSelectRace(key)}
                            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition ${active
                                ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-500/25 to-sky-500/15 font-semibold text-white shadow-inner shadow-cyan-500/10'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'}`}
                            title={r.name}
                        >
                            <span className='min-w-0 flex-1 truncate'>{r.name}</span>
                            {active && <span className='shrink-0 text-cyan-300'>●</span>}
                        </button>
                    )
                })}
            </div>

            {/* year switcher */}
            <div className='flex flex-col gap-1.5'>
                <span className={sectionLabelCls}>Year</span>
                <div className='flex gap-1.5'>
                    {RACES[raceKey].years.map(y => {
                        const active = y === year
                        return (
                            <button
                                key={y}
                                onClick={() => onSelectYear(y)}
                                className={`flex-1 rounded-lg border px-2 py-1 text-center text-xs tabular-nums transition ${active
                                    ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-500/25 to-sky-500/15 font-semibold text-white shadow-inner shadow-cyan-500/10'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'}`}
                            >
                                {y}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* swimmer picker */}
            <div className='flex flex-col gap-1.5'>
                <div className='flex items-baseline justify-between'>
                    <span className={sectionLabelCls}>Swimmers</span>
                    <span className='text-[11px] tabular-nums text-slate-500'>{racers.length} finishers</span>
                </div>
                <input
                    type='text'
                    className={inputCls}
                    placeholder='Search name or bib…'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <select
                    className={selectCls}
                    value=''
                    onChange={e => { if (e.target.value) onAddGroup(e.target.value) }}
                >
                    <option value=''>＋ Add a group…</option>
                    <option value='__all__'>Everyone ({racers.length})</option>
                    {racers.length > 100 && <option value='__top100__'>Top 100</option>}
                    {divisions.map(([d, n]) => (
                        <option key={d} value={d}>{d} ({n})</option>
                    ))}
                </select>
            </div>

            {/* fills the remaining sidebar height; long lists scroll internally */}
            <div className='min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20'>
                {shown.map(r => {
                    const selected = selectedSet.has(r.bib)
                    return (
                        <button
                            key={r.bib}
                            className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition ${selected
                                ? 'bg-cyan-400/10 text-white'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                            onClick={() => onToggle(r.bib)}
                        >
                            <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[9px] leading-none transition ${selected
                                ? 'border-cyan-400 bg-cyan-400 text-slate-900'
                                : 'border-white/25'}`}>
                                {selected ? '✓' : ''}
                            </span>
                            <span className='w-10 shrink-0 tabular-nums text-slate-500'>#{r.bib}</span>
                            <span className='flex-1 truncate'>{r.name}</span>
                            <span className='tabular-nums text-slate-500'>{r.chipTime}</span>
                        </button>
                    )
                })}
                {matches.length > shown.length && (
                    <div className='px-2.5 py-1.5 text-xs text-slate-500'>…{matches.length - shown.length} more — refine your search</div>
                )}
                {matches.length === 0 && <div className='px-2.5 py-1.5 text-xs text-slate-500'>No matches</div>}
            </div>

            {/* roster on the map */}
            <div className='flex items-baseline justify-between'>
                <span className={sectionLabelCls}>
                    On the map <span className='ml-1 text-cyan-300'>{selectedRacers.length}</span>
                </span>
                {selectedRacers.length > 0 && (
                    <button className='text-[11px] text-slate-500 transition hover:text-slate-200' onClick={onClear}>Clear all</button>
                )}
            </div>
            {selectedRacers.length === 0 ? (
                <div className='rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-slate-500'>
                    Add swimmers above, then press play.
                </div>
            ) : (
                <div className='flex max-h-44 flex-col gap-0.5 overflow-y-auto pr-1'>
                    {selectedRacers.map((r, i) => {
                        const pinned = pinnedBib === r.bib
                        return (
                            <div
                                key={r.bib}
                                className={`group flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition ${pinned
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-200 hover:bg-white/5'}`}
                                title={pinned ? 'Click to unpin name label' : 'Click to pin name label'}
                                onMouseEnter={() => onHoverSwimmer(r.bib)}
                                onMouseLeave={() => onHoverSwimmer(null)}
                                onClick={() => onPinSwimmer(r.bib)}
                            >
                                <span
                                    className='inline-block h-3 w-3 shrink-0 rounded-sm'
                                    style={{ background: swimmerColors[i % swimmerColors.length] }}
                                />
                                <span className='flex-1 truncate'>{r.name}</span>
                                {pinned && <span className='shrink-0 text-[10px] text-cyan-300'>◉</span>}
                                <span className='tabular-nums text-slate-500'>{r.chipTime}</span>
                                <button
                                    className='px-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400'
                                    title='Remove from the map'
                                    onClick={e => { e.stopPropagation(); onToggle(r.bib) }}
                                >×</button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/** course-clock ms -> "m:ss" (or "h:mm:ss") */
function formatCourseMs(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = String(s % 60).padStart(2, '0')
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** bottom playback bar: play/restart, scrubber over the slowest swimmer's race, speed, loop */
function PlaybackBar({ clockRef, playing, onTogglePlay, onRestart, speed, onSpeed, loop, onLoop, durationMs, hasSwimmers }: {
    clockRef: React.MutableRefObject<number>
    playing: boolean
    onTogglePlay: () => void
    onRestart: () => void
    speed: number
    onSpeed: (f: number) => void
    loop: boolean
    onLoop: (v: boolean) => void
    durationMs: number
    hasSwimmers: boolean
}) {
    // mirror the ref into state at ~7fps for the scrubber/readout; the
    // animation itself never touches React state
    const [now, setNow] = useState(0)
    useEffect(() => {
        const id = setInterval(() => {
            setNow(clockRef.current)
            // auto-pause once every swimmer has finished (plus the overrun +
            // confetti tail) so the clock doesn't run on forever
            if (playing && !loop && durationMs > 0 && clockRef.current > durationMs + 150_000) onTogglePlay()
        }, 150)
        return () => clearInterval(id)
    }, [clockRef, playing, loop, durationMs, onTogglePlay])

    // the replay has run out: the play button restarts instead of resuming
    const finished = !playing && durationMs > 0 && now >= durationMs

    return (
        <div className='pointer-events-auto flex w-[min(560px,calc(100vw-2rem))] flex-col gap-1.5 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2.5 shadow-2xl shadow-black/40 backdrop-blur-xl'>
            {/* wraps to two rows on phones: transport + scrubber, then speeds */}
            <div className='flex flex-wrap items-center justify-center gap-3 text-sm text-slate-200'>
                <button
                    className='grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30 transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:opacity-40 disabled:saturate-0'
                    onClick={onTogglePlay}
                    disabled={!hasSwimmers}
                    title={hasSwimmers ? (playing ? 'Pause' : finished ? 'Replay' : 'Play') : 'Add swimmers first'}
                >
                    {playing ? (
                        <span className='flex gap-[3px]'>
                            <span className='h-3 w-[3px] rounded-sm bg-current' />
                            <span className='h-3 w-[3px] rounded-sm bg-current' />
                        </span>
                    ) : (
                        <span className='pl-0.5 text-[15px]'>▶</span>
                    )}
                </button>
                <button
                    className='text-slate-400 transition hover:text-white'
                    onClick={onRestart}
                    title='Restart'
                >
                    ↺
                </button>
                {hasSwimmers ? (
                    <>
                        <span className='w-14 shrink-0 text-right tabular-nums text-xs text-slate-400'>{formatCourseMs(Math.min(now, durationMs))}</span>
                        <input
                            type='range'
                            className='h-1 min-w-[110px] flex-1 cursor-pointer accent-cyan-400'
                            min={0}
                            max={durationMs}
                            step={1000}
                            value={Math.min(now, durationMs)}
                            onChange={e => {
                                clockRef.current = Number(e.target.value)
                                setNow(clockRef.current)
                            }}
                        />
                        <span className='w-14 shrink-0 tabular-nums text-xs text-slate-400'>{formatCourseMs(durationMs)}</span>
                    </>
                ) : (
                    // the hint eats the whole bar on a narrow screen; the
                    // onboarding covers the same ground there
                    <span className='flex-1 text-center text-xs text-slate-500 max-md:hidden'>Add swimmers from the panel to start the race</span>
                )}
                <span className='h-5 w-px shrink-0 bg-white/10 max-sm:hidden' />
                <div className='flex shrink-0 items-center gap-0.5 rounded-full bg-white/5 p-0.5'>
                    {SPEED_PRESETS.map(p => (
                        <button
                            key={p.label}
                            className={`rounded-full px-2 py-0.5 text-xs transition ${speed === p.factor
                                ? 'bg-cyan-400/20 font-semibold text-cyan-300'
                                : 'text-slate-400 hover:text-white'}`}
                            onClick={() => onSpeed(p.factor)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <button
                    className={`shrink-0 rounded-full px-2 py-0.5 text-base leading-none transition ${loop
                        ? 'bg-cyan-400/20 font-semibold text-cyan-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    onClick={() => onLoop(!loop)}
                    title={loop ? 'Looping — click to stop' : 'Loop the replay'}
                >
                    ∞
                </button>
            </div>
        </div>
    )
}

/**
 * applies camera starting points (rotate to the preset's angles, then fit the
 * course buoys into frame) and keeps panning anchored to the course
 */
function CameraRig({ preset, controlsRef, buoys }: {
    preset: (CameraStart & { nonce: number }) | null
    controlsRef: React.MutableRefObject<CameraControlsImpl | null>
    buoys: ReturnType<typeof computeBuoys> | null
}) {
    const appliedNonce = useRef<number | null>(null)
    const camera = useThree(s => s.camera)
    const size = useThree(s => s.size)

    const courseBox = useMemo(
        () => buoys && new THREE.Box3().setFromPoints(buoys.positions),
        [buoys]
    )

    // clamp the orbit target to a generous box around the buoys so the course
    // can't be panned out of frame
    useEffect(() => {
        const controls = controlsRef.current
        if (!controls || !courseBox) return
        // extra vertical headroom: preset targets can sit well above sea level
        controls.setBoundary(courseBox.clone().expandByVector(new THREE.Vector3(3, 6, 3)))
    }, [courseBox, controlsRef])

    useEffect(() => {
        const controls = controlsRef.current
        // apply each request exactly once (buoy changes must not re-snap the
        // camera after the user has moved away); wait for the course to exist
        if (!preset || preset.nonce === appliedNonce.current) return
        if (!controls || !buoys) return
        appliedNonce.current = preset.nonce
        // rotate first, then contain-fit at the final angle. Fitting by hand
        // because controls.fitToBox rounds the rotation to the nearest 90°
        // axis, which would snap every angled preset back to overhead.
        controls
            .rotateTo(THREE.MathUtils.degToRad(preset.azimuth), THREE.MathUtils.degToRad(preset.polar), true)
            .then(() => {
                // explicit framing pinned in the preset: no auto-fit
                if (preset.zoom !== undefined && preset.target) {
                    controls.moveTo(...preset.target, true)
                    controls.zoomTo(preset.zoom, true)
                    return
                }
                camera.updateMatrixWorld() // rotation settled; also updates matrixWorldInverse
                // Measure the buoys themselves, not the corners of their
                // bounding box: a course running diagonally through the box
                // barely touches those corners, and fitting them instead cost
                // us most of the usable zoom.
                const v = new THREE.Vector3()
                let minX = Infinity, maxX = -Infinity
                let minY = Infinity, maxY = -Infinity
                let sumZ = 0
                for (const p of buoys.positions) {
                    v.copy(p).applyMatrix4(camera.matrixWorldInverse)
                    minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x)
                    minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y)
                    sumZ += v.z
                }
                const spanX = Math.max(maxX - minX, 1e-6)
                const spanY = Math.max(maxY - minY, 1e-6)
                const zoom = Math.min(
                    (size.width * FIT_FRACTION_X) / spanX,
                    (size.height * FIT_FRACTION_Y) / spanY,
                )
                // re-centre on the middle of what was just measured — the box
                // centre can sit well off it for a lopsided course
                const center = camera.localToWorld(new THREE.Vector3(
                    (minX + maxX) / 2,
                    (minY + maxY) / 2,
                    sumZ / buoys.positions.length,
                ))
                controls.moveTo(center.x, center.y, center.z, true)
                controls.zoomTo(zoom, true)
            })
    }, [preset, buoys, controlsRef, camera, size])
    return null
}

/** writes the live camera angles/zoom/target into a DOM input, throttled */
function CameraReadout({ outRef, controlsRef }: {
    outRef: React.RefObject<HTMLInputElement>
    controlsRef: React.MutableRefObject<CameraControlsImpl | null>
}) {
    const camera = useThree(s => s.camera)
    const acc = useRef(1)
    const tmp = useRef(new THREE.Vector3())
    useFrame((_, delta) => {
        acc.current += delta
        if (acc.current < 0.2) return
        acc.current = 0
        const el = outRef.current
        const controls = controlsRef.current
        if (!el || !controls) return
        const t = controls.getTarget(tmp.current)
        el.value = `az ${THREE.MathUtils.radToDeg(controls.azimuthAngle).toFixed(1)}°`
            + ` pol ${THREE.MathUtils.radToDeg(controls.polarAngle).toFixed(1)}°`
            + ` zoom ${camera.zoom.toFixed(1)}`
            + ` target [${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)}]`
    })
    return null
}

interface ControlProps {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (v: number) => void
}

function Control({ label, value, min, max, step, onChange }: ControlProps) {
    return (
        <label className='flex items-center gap-2 text-sm text-slate-300'>
            <span className='w-44 shrink-0'>{label}</span>
            <input
                type='range'
                className='h-1 flex-1 cursor-pointer accent-cyan-400'
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
            />
            <span className='w-14 text-right tabular-nums text-slate-400'>{value}</span>
        </label>
    )
}

/** live match for "narrower than Tailwind's `sm`", i.e. phone layout */
function useIsMobile() {
    const [mobile, setMobile] = useState(
        () => typeof window !== 'undefined' && !window.matchMedia(SM_UP).matches,
    )
    useEffect(() => {
        const mq = window.matchMedia(SM_UP)
        const onChange = () => setMobile(!mq.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])
    return mobile
}

export function FiberCanvas() {
    const [dataset, setDataset] = useState('Waimea 10m')
    const isMobile = useIsMobile()
    // results panel starts open on desktop, collapsed to its toggle on phones
    const [sidebarOpen, setSidebarOpen] = useState(
        () => typeof window === 'undefined' || window.matchMedia(SM_UP).matches,
    )
    const [stride, setStride] = useState(8)
    const [heightScale, setHeightScale] = useState(0.005)
    const [oceanDepthDivisor, setOceanDepthDivisor] = useState(0.25)
    const [waterOpacity, setWaterOpacity] = useState(0.35)
    const [smoothStrength, setSmoothStrength] = useState(0.6)
    const [smoothIterations, setSmoothIterations] = useState(1)
    const [blockFootprint, setBlockFootprint] = useState(1)
    const [lightIntensity, setLightIntensity] = useState(1)
    const [ambientIntensity, setAmbientIntensity] = useState(0.7)
    const [timeOfDay, setTimeOfDay] = useState(9) // hours, 6 = sunrise .. 18 = sunset
    const [beachMaxElev, setBeachMaxElev] = useState(10) // meters
    const [beachReach, setBeachReach] = useState(120) // meters inland from the water

    // Sun position/color for Oahu (~21.6N): rises in the east, arcs high through
    // the southern sky (peak ~78 deg), sets west. Scene compass: -x = north, -z = east.
    const sun = useMemo(() => {
        const frac = (timeOfDay - 6) / 12
        const elev = Math.max(0.05, Math.sin(Math.PI * frac) * 78 * Math.PI / 180)
        const az = (90 + 180 * frac) * Math.PI / 180 // east -> south -> west
        const R = 40
        const pos: [number, number, number] = [
            -Math.cos(az) * Math.cos(elev) * R,
            Math.sin(elev) * R,
            -Math.sin(az) * Math.cos(elev) * R,
        ]
        // warm gold near the horizon fading to near-white overhead; a touch
        // dimmer at the ends of the day
        const warmth = Math.min(1, Math.sin(elev) * 1.6)
        const color = '#' + new THREE.Color('#ffc98a').lerp(new THREE.Color('#fff6ea'), warmth).getHexString()
        const intensity = 1.0 + 0.8 * Math.sin(elev)
        return { pos, color, intensity }
    }, [timeOfDay])

    const [grid, setGrid] = useState<Grid | null>(null)

    // race results + swimmer selection
    const [raceKey, setRaceKey] = useState(Object.keys(RACES)[0])
    // season picked by the user; falls back to the race's latest year when the
    // selected race never ran that season
    const [pickedYear, setPickedYear] = useState<number | null>(null)
    const [racers, setRacers] = useState<Racer[]>([])
    // which "race-year" the loaded `racers` belong to (results load async after a switch)
    const [racersFor, setRacersFor] = useState('')
    const [selectedBibs, setSelectedBibs] = useState<string[]>([])
    const [playing, setPlaying] = useState(false)
    const [loop, setLoop] = useState(false)
    const [speed, setSpeed] = useState(SPEED_PRESETS[1].factor)
    const raceClock = useRef(0)
    const race = RACES[raceKey]
    const year = pickedYear !== null && race.years.includes(pickedYear) ? pickedYear : latestYear(race)

    // buoy editor (active while settings are open): session-only waypoint
    // overrides per race; copy the tuned coords back into RACES by hand
    const [editedWaypoints, setEditedWaypoints] = useState<Record<string, number[][]>>({})
    const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null)
    const course = useMemo<Course>(() => {
        const wps = editedWaypoints[raceKey]
        return wps ? { ...race.course, waypoints: wps } : race.course
    }, [race, raceKey, editedWaypoints])
    const moveWaypoint = useCallback((i: number, latlng: [number, number]) => {
        setEditedWaypoints(m => {
            const wps = (m[raceKey] ?? RACES[raceKey].course.waypoints).map((w, j) => j === i ? latlng : w)
            return { ...m, [raceKey]: wps }
        })
    }, [raceKey])

    // ui chrome: settings dialog + camera starting points + live coord readout
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [cameraPreset, setCameraPreset] = useState<(CameraStart & { nonce: number }) | null>(null)
    const controlsRef = useRef<CameraControlsImpl | null>(null)
    const camReadoutRef = useRef<HTMLInputElement>(null)
    const applyCamera = useCallback((c: CameraStart) => {
        // nonce so re-clicking the same starting point re-applies it
        setCameraPreset({ ...c, nonce: performance.now() })
    }, [])

    // jump to the race's first camera starting point when the race changes
    useEffect(() => {
        applyCamera(race.cameras[0])
    }, [race, applyCamera])

    // name-label state: live swimmer positions (written by Swimmer useFrame),
    // a pinned label (3d hover or roster click; persists until dismissed /
    // unclicked), and a transient label from hovering a roster row, which
    // takes display precedence while the pointer is over the row
    const swimmerPositions = useRef(new Map<string, THREE.Vector3>())
    const [label, setLabel] = useState<{ bib: string, name: string, color: string, anchor: THREE.Vector3 } | null>(null)
    const [hoverLabel, setHoverLabel] = useState<{ bib: string, name: string, color: string, anchor: THREE.Vector3 } | null>(null)

    useEffect(() => {
        let live = true
        setGrid(null)
        loadGrid(DATASETS[dataset]).then(g => { if (live) setGrid(g) })
        return () => { live = false }
    }, [dataset])

    useEffect(() => {
        let live = true
        setRacers([])
        setSelectedBibs([])
        setSelectedWaypoint(null)
        setPlaying(false)
        raceClock.current = 0
        fetch(resultsUrl(raceKey, year))
            .then(r => r.json())
            .then((file: RaceResultsFile) => {
                if (!live) return
                setRacers(parseRacers(file))
                setRacersFor(`${raceKey}-${year}`)
            })
        return () => { live = false }
    }, [race, raceKey, year])

    const toggleBib = (bib: string) => setSelectedBibs(s =>
        s.includes(bib) ? s.filter(b => b !== bib) : [...s, bib]
    )
    const addGroup = (group: string) => setSelectedBibs(s => {
        const members = group === '__all__' ? racers
            : group === '__top100__' ? racers.slice(0, 100)
                : racers.filter(r => r.division === group)
        const existing = new Set(s)
        return [...s, ...members.filter(r => !existing.has(r.bib)).map(r => r.bib)]
    })

    const byBib = useMemo(() => new Map(racers.map(r => [r.bib, r])), [racers])
    const selectedRacers = useMemo(
        () => selectedBibs.map(b => byBib.get(b)).filter((r): r is Racer => !!r),
        [selectedBibs, byBib]
    )
    // stable identity matters: SwimmerField rebuilds its paths when this changes
    const swimmerEntries = useMemo<SwimmerEntry[]>(
        () => selectedRacers.map((r, i) => ({
            bib: r.bib,
            name: r.name,
            minutes: r.minutes,
            color: swimmerColors[i % swimmerColors.length],
        })),
        [selectedRacers]
    )

    // scrubber range: the slowest selected swimmer's finish
    const durationMs = selectedRacers.reduce((max, r) => Math.max(max, r.minutes * 60_000), 0)
    const hasSwimmers = selectedRacers.length > 0

    const togglePlay = useCallback(() => {
        if (!playing) {
            // once the replay has run out, play doubles as restart (same
            // swimmers, same speed — just from the gun again)
            if (durationMs > 0 && raceClock.current >= durationMs) raceClock.current = 0
            // on phones the panel owns most of the screen; starting the replay
            // is the cue to get it out of the way of the map
            if (isMobile) setSidebarOpen(false)
        }
        setPlaying(!playing)
    }, [playing, durationMs, isMobile])

    // onboarding: shown on load, reopenable via the ? button
    const [showOnboarding, setShowOnboarding] = useState(true)

    // space bar toggles playback (unless typing in a field)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return
            const tag = (e.target as HTMLElement | null)?.tagName
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
            if (!hasSwimmers || showOnboarding) return
            e.preventDefault()
            togglePlay()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [hasSwimmers, showOnboarding, togglePlay])

    // downsample + smoothing are the expensive passes; keep them independent of
    // the depth-compression slider so dragging it only redoes the cheap remap
    const smoothed = useMemo(() => {
        if (!grid) return null
        const g = downsample(grid, stride)
        let elev = g.elev
        for (let i = 0; i < smoothIterations; i++) {
            elev = smoothPass(elev, g.nRows, g.nCols, smoothStrength)
        }
        return { g, elev }
    }, [grid, stride, smoothStrength, smoothIterations])

    const view = useMemo<View | null>(() => {
        if (!smoothed) return null
        const { g, elev } = smoothed

        // apply ocean depth compression, gather stats + samples for the color scales
        const y = new Float32Array(elev.length)
        let min = Infinity, max = -Infinity
        const oceanSample: number[] = []
        const landSample: number[] = []
        const sampleEvery = Math.max(1, Math.floor(elev.length / 50000))
        for (let i = 0; i < elev.length; i++) {
            const e = elev[i]
            if (Number.isNaN(e)) { y[i] = NaN; continue }
            const v = e < 0 ? e / oceanDepthDivisor : e
            y[i] = v
            if (v < min) min = v
            if (v > max) max = v
            if (i % sampleEvery === 0) (v < 0 ? oceanSample : landSample).push(v)
        }

        return {
            g,
            y,
            distToOcean: oceanDistance(y, g.nRows, g.nCols),
            heightOffset: Math.max(0, -min),
            oceanColorScale: scaleQuantile<string>()
                .domain(oceanSample.length ? oceanSample : [-1, 0])
                .range(oceanColors),
            landColorScale: scaleQuantile<string>()
                .domain(landSample.length ? landSample : [0, max])
                .range(landColors),
        }
    }, [smoothed, oceanDepthDivisor])

    const buoys = useMemo(
        () => view && computeBuoys(view, course, heightScale),
        [view, course, heightScale]
    )

    const makeLabel = useCallback((bib: string, name: string, color: string) => {
        if (!buoys || !view) return null
        // fixed anchor at the race's configured lat/lng, floating a buoy's
        // height above sea level
        const [mx, my] = latLngToMercator(race.labelAnchor)
        const [x, z] = mercToScene(view.g, mx, my)
        const anchor = new THREE.Vector3(x, view.heightOffset * heightScale + buoys.height + 0.5, z)
        // sanity check: never bury the label in the terrain it hovers over
        // (one-time, at anchor placement)
        const top = terrainTopAt(view, heightScale, anchor.x, anchor.z)
        anchor.y = Math.max(anchor.y, top + LABEL_BOX_H)
        return { bib, name, color, anchor }
    }, [buoys, view, heightScale, race])

    const handleSwimmerHover = useCallback((bib: string, name: string, color: string) => {
        const l = makeLabel(bib, name, color)
        if (l) setLabel(l)
    }, [makeLabel])

    // clicking a swimmer's block pins that name. Also drops any roster-hover
    // label, which would otherwise keep display precedence — on touch,
    // mouseenter fires on tap and never gets a matching mouseleave.
    const handleSwimmerClick = useCallback((bib: string, name: string, color: string) => {
        const l = makeLabel(bib, name, color)
        if (l) { setHoverLabel(null); setLabel(l) }
    }, [makeLabel])

    // roster rows share the swimmer's assigned color (index in selection order)
    const labelForBib = (bib: string) => {
        const i = selectedRacers.findIndex(r => r.bib === bib)
        if (i < 0) return null
        return makeLabel(bib, selectedRacers[i].name, swimmerColors[i % swimmerColors.length])
    }
    const handleRosterHover = (bib: string | null) => {
        // touch reports a mouseenter on tap and often never a matching
        // mouseleave, so on phones taps go through handleRosterClick alone
        if (isMobile) return
        setHoverLabel(bib ? labelForBib(bib) : null)
    }
    const handleRosterClick = (bib: string) => {
        // click pins the label; clicking the same swimmer again unpins
        setHoverLabel(null)
        setLabel(prev => prev?.bib === bib ? null : labelForBib(bib))
    }

    // anchor position goes stale when the race, grid, or vertical scale changes
    useEffect(() => {
        setLabel(null)
        setHoverLabel(null)
    }, [raceKey, view, heightScale])

    // drop labels whose swimmer is removed from the map
    useEffect(() => {
        if (label && !selectedBibs.includes(label.bib)) setLabel(null)
        if (hoverLabel && !selectedBibs.includes(hoverLabel.bib)) setHoverLabel(null)
    }, [label, hoverLabel, selectedBibs])

    // Betty spotlight (launched from the onboarding): once the featured race's
    // results and buoys are ready, select the featured swimmers, start the
    // replay, and pin the name label on Betty. Declared after the label-clearing
    // effects so the label set here survives the same-commit clear when the
    // grid finishes loading last.
    const [spotlight, setSpotlight] = useState(false)
    useEffect(() => {
        if (!spotlight || !buoys || racersFor !== `${BETTY_SPOTLIGHT.raceKey}-${BETTY_SPOTLIGHT.year}`) return
        const found = BETTY_SPOTLIGHT.bibs.filter(b => racers.some(r => r.bib === b))
        setSelectedBibs(found)
        raceClock.current = 0
        setPlaying(true)
        const star = racers.find(r => r.bib === BETTY_SPOTLIGHT.labelBib)
        if (star) {
            const i = Math.max(0, found.indexOf(star.bib))
            handleSwimmerHover(star.bib, star.name, swimmerColors[i % swimmerColors.length])
        }
        setSpotlight(false)
    }, [spotlight, racers, racersFor, buoys, handleSwimmerHover])

    // 100dvh, not 100vh: on phones the URL bar shrinks the visible viewport and
    // 100vh would push the bottom chrome off-screen
    return (
        <div className='relative h-[100dvh] w-full overflow-hidden overscroll-none bg-slate-950 text-slate-100'>
            {/* scene: full-bleed, all chrome floats on top */}
            <div className='absolute inset-0'>
                <Canvas
                    shadows
                    orthographic
                    camera={{
                        zoom: 15,
                        position: [20, 30, 10]
                    }}>
                    {/* soft, slightly hazy early-morning sky blue */}
                    <color attach='background' args={['#a8c8e6']} />
                    <CameraRig preset={cameraPreset} controlsRef={controlsRef} buoys={buoys} />
                    <CameraReadout outRef={camReadoutRef} controlsRef={controlsRef} />
                    <RaceClock clockRef={raceClock} playing={playing} speed={speed} />
                    {/* casters: anything that moves the terrain, buoys, or the sun */}
                    <ShadowFreeze casters={[view, heightScale, blockFootprint, sun, course]} />
                    {/* early morning at Waimea: cool blue skylight from above, warm
                        sand/ocean bounce from below */}
                    <hemisphereLight args={['#bdd4ee', '#997f5f', 1.0]} />
                    {/* shadowless base brightness so shadows stay soft even when
                        the scene is lifted */}
                    <ambientLight color='#f2ede4' intensity={ambientIntensity} />
                    {/* the "sun": position/color/strength driven by the time-of-day slider */}
                    <directionalLight
                        castShadow
                        position={sun.pos}
                        color={sun.color}
                        intensity={lightIntensity * sun.intensity}
                        shadow-mapSize={[2048, 2048]} // Higher resolution shadows
                        shadow-camera-far={200}
                        shadow-camera-left={-50}
                        shadow-camera-right={50}
                        shadow-camera-top={50}
                        shadow-camera-bottom={-50}
                    />
                    {view && buoys && (
                        <>
                            <TerrainInstances
                                view={view}
                                heightScale={heightScale}
                                blockFootprint={blockFootprint}
                                beachMaxElev={beachMaxElev}
                                beachReachCells={Math.round(beachReach / view.g.cellY)}
                            />
                            {waterOpacity > 0 && (
                                <VoxelWater view={view} heightScale={heightScale} blockFootprint={blockFootprint} opacity={waterOpacity} />
                            )}
                            <CourseMarkers
                                buoys={buoys}
                                g={view.g}
                                waypoints={course.waypoints}
                                editable={settingsOpen}
                                selectedWaypoint={selectedWaypoint}
                                onSelectWaypoint={setSelectedWaypoint}
                                onMoveWaypoint={moveWaypoint}
                                controlsRef={controlsRef}
                            />
                            <SwimmerField
                                view={view}
                                course={course}
                                heightScale={heightScale}
                                raceKey={raceKey}
                                swimmers={swimmerEntries}
                                clockRef={raceClock}
                                loop={loop}
                                positionsRef={swimmerPositions}
                                onHover={handleSwimmerHover}
                                onSelect={handleSwimmerClick}
                            />
                            {(hoverLabel ?? label) && (
                                <SwimmerLabel
                                    bib={(hoverLabel ?? label)!.bib}
                                    name={(hoverLabel ?? label)!.name}
                                    color={(hoverLabel ?? label)!.color}
                                    anchor={(hoverLabel ?? label)!.anchor}
                                    positionsRef={swimmerPositions}
                                    onDismiss={() => { setLabel(null); setHoverLabel(null) }}
                                />
                            )}
                        </>
                    )}
                    {/* clamp at the horizon: the map has no underside worth seeing */}
                    <CameraControls ref={controlsRef} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            </div>

            {/* left chrome. On phones this is a flex column so the panel and the
                playback bar split the viewport instead of stacking on top of each
                other; from `sm` up both children float independently again. */}
            <div className='pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-4 sm:block sm:p-0'>
                {/* sidebar: race switcher + swimmer search/selection. Collapsible —
                    shrinks to just its toggle so the map is usable on phones. */}
                <div
                    className={`pointer-events-auto relative overflow-hidden border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40 backdrop-blur-xl animate-fade-in-up transition-[height,width,border-radius] duration-300 sm:absolute sm:left-4 sm:top-4 ${sidebarOpen
                        ? 'min-h-0 w-80 max-w-full flex-1 rounded-2xl sm:h-[calc(100%-2rem)] sm:max-w-[calc(100vw-2rem)]'
                        : 'h-11 w-11 shrink-0 rounded-full'}`}
                >
                    <button
                        className={`absolute z-20 grid place-items-center text-slate-300 transition hover:text-white ${sidebarOpen
                            ? 'right-2 top-2 h-8 w-8 rounded-full hover:bg-white/10'
                            : 'inset-0'}`}
                        onClick={() => setSidebarOpen(o => !o)}
                        title={sidebarOpen ? 'Collapse panel' : 'Races & swimmers'}
                    >
                        {sidebarOpen ? (
                            <span className='text-lg leading-none'>×</span>
                        ) : (
                            <span className='flex flex-col gap-[3px]'>
                                <span className='h-[2px] w-4 rounded bg-current' />
                                <span className='h-[2px] w-4 rounded bg-current' />
                                <span className='h-[2px] w-4 rounded bg-current' />
                            </span>
                        )}
                    </button>
                    <div
                        className={`h-full w-80 max-w-full transition-opacity duration-200 ${sidebarOpen
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0'}`}
                    >
                        <ResultsPanel
                            raceKey={raceKey}
                            onSelectRace={setRaceKey}
                            year={year}
                            onSelectYear={setPickedYear}
                            racers={racers}
                            selectedBibs={selectedBibs}
                            onToggle={toggleBib}
                            onAddGroup={addGroup}
                            onClear={() => setSelectedBibs([])}
                            pinnedBib={label?.bib ?? null}
                            onHoverSwimmer={handleRosterHover}
                            onPinSwimmer={handleRosterClick}
                        />
                    </div>
                </div>

                {/* playback bar: last row of the phone column (mt-auto pins it to
                    the bottom when the panel is collapsed); from `sm` up it floats
                    centered in the space right of the sidebar */}
                <div className='pointer-events-none mt-auto flex shrink-0 justify-center sm:absolute sm:bottom-4 sm:left-1/2 sm:mt-0 sm:-translate-x-1/2 lg:left-[calc(50%+10.5rem)]'>
                    <PlaybackBar
                        clockRef={raceClock}
                        playing={playing}
                        onTogglePlay={togglePlay}
                        onRestart={() => { raceClock.current = 0 }}
                        speed={speed}
                        onSpeed={setSpeed}
                        loop={loop}
                        onLoop={setLoop}
                        durationMs={durationMs}
                        hasSwimmers={hasSwimmers}
                    />
                </div>
            </div>

            {/* top-right: camera starting points + settings + help. Shares the
                top row with the panel toggle; on phones it tightens up and is
                capped short of the toggle rather than colliding with it. */}
            <div className={`absolute right-4 top-4 z-10 flex items-center justify-end gap-1.5 rounded-full border border-white/10 bg-slate-900/70 p-1 text-sm shadow-lg shadow-black/30 backdrop-blur-xl max-sm:max-w-[calc(100vw-5.25rem)] max-sm:flex-wrap max-sm:gap-0.5 ${sidebarOpen ? 'max-sm:hidden' : ''}`}>
                {race.cameras.map(c => (
                    <button
                        key={c.name}
                        className='shrink-0 rounded-full px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white max-sm:px-2'
                        onClick={() => applyCamera(c)}
                    >
                        {c.name}
                    </button>
                ))}
                <span className='h-4 w-px shrink-0 bg-white/10' />
                <button
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs transition ${settingsOpen
                        ? 'bg-cyan-400/20 text-cyan-300'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                    onClick={() => setSettingsOpen(o => !o)}
                    title='Scene settings'
                >
                    ⚙
                </button>
                <button
                    className='grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs text-slate-300 transition hover:bg-white/10 hover:text-white'
                    onClick={() => setShowOnboarding(true)}
                    title='Help'
                >
                    ?
                </button>
            </div>

            {/* settings dialog */}
            {settingsOpen && (
                    <div className='absolute right-4 top-14 z-20 flex max-h-[calc(100%-5.5rem)] w-[520px] max-w-[calc(100%-2rem)] flex-col gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/85 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl animate-fade-in-up'>
                        <div className='mb-1 flex items-center justify-between'>
                            <span className={sectionLabelCls}>Scene settings</span>
                            <button className='px-1 text-slate-500 transition hover:text-white' onClick={() => setSettingsOpen(false)}>×</button>
                        </div>
                        <div className='mb-1 flex items-center gap-4 text-sm text-slate-300'>
                            <label className='flex items-center gap-2'>
                                <span>Dataset</span>
                                <select className={selectCls + ' !w-auto'} value={dataset} onChange={e => setDataset(e.target.value)}>
                                    {Object.keys(DATASETS).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </label>
                            <label className='flex items-center gap-2'>
                                <span>Detail</span>
                                <select className={selectCls + ' !w-auto'} value={stride} onChange={e => setStride(Number(e.target.value))}>
                                    {[1, 2, 4, 8, 16].map(s => <option key={s} value={s}>{s}x</option>)}
                                </select>
                            </label>
                            <span className='text-xs text-slate-500'>
                                {view ? `${view.g.nRows} × ${view.g.nCols} = ${(view.g.nRows * view.g.nCols).toLocaleString()} cells` : 'loading…'}
                            </span>
                        </div>
                        <Control label='Height scale' value={heightScale} min={0.002} max={0.05} step={0.001} onChange={setHeightScale} />
                        <Control label='Ocean depth compression' value={oceanDepthDivisor} min={0.25} max={15} step={0.25} onChange={setOceanDepthDivisor} />
                        <Control label='Water opacity' value={waterOpacity} min={0} max={0.6} step={0.05} onChange={setWaterOpacity} />
                        <Control label='Smoothing strength' value={smoothStrength} min={0} max={1} step={0.05} onChange={setSmoothStrength} />
                        <Control label='Smoothing iterations' value={smoothIterations} min={0} max={4} step={1} onChange={setSmoothIterations} />
                        <Control label='Block footprint' value={blockFootprint} min={0.5} max={1.2} step={0.05} onChange={setBlockFootprint} />
                        <Control label='Light intensity' value={lightIntensity} min={0} max={3} step={0.1} onChange={setLightIntensity} />
                        <Control label='Ambient light' value={ambientIntensity} min={0} max={2} step={0.05} onChange={setAmbientIntensity} />
                        <Control label='Time of day (hr)' value={timeOfDay} min={6} max={18} step={0.25} onChange={setTimeOfDay} />
                        <Control label='Beach max elevation (m)' value={beachMaxElev} min={0} max={20} step={0.5} onChange={setBeachMaxElev} />
                        <Control label='Beach reach (m inland)' value={beachReach} min={0} max={400} step={20} onChange={setBeachReach} />

                        {/* buoy editor: active while this dialog is open */}
                        <div className='mt-2 flex flex-col gap-1 border-t border-white/10 pt-2 text-sm'>
                            <span className={sectionLabelCls}>Buoy editor</span>
                            <span className='text-xs text-slate-500'>
                                Click a buoy to select it, drag to move. Edits last for this session only —
                                copy the coords into the race config.
                            </span>
                            {selectedWaypoint === null ? (
                                <span className='text-xs text-slate-600'>No buoy selected</span>
                            ) : (
                                <div className='flex items-center gap-2 text-slate-300'>
                                    <span className='text-slate-500'>Waypoint {selectedWaypoint}</span>
                                    <label className='flex items-center gap-1'>
                                        lat
                                        <input
                                            type='number'
                                            className={inputCls + ' !w-32 !px-1.5 !py-0.5 tabular-nums'}
                                            step={0.0001}
                                            value={Number(course.waypoints[selectedWaypoint][0].toFixed(6))}
                                            onChange={e => {
                                                const v = Number(e.target.value)
                                                if (!Number.isNaN(v)) moveWaypoint(selectedWaypoint, [v, course.waypoints[selectedWaypoint][1]])
                                            }}
                                        />
                                    </label>
                                    <label className='flex items-center gap-1'>
                                        lng
                                        <input
                                            type='number'
                                            className={inputCls + ' !w-32 !px-1.5 !py-0.5 tabular-nums'}
                                            step={0.0001}
                                            value={Number(course.waypoints[selectedWaypoint][1].toFixed(6))}
                                            onChange={e => {
                                                const v = Number(e.target.value)
                                                if (!Number.isNaN(v)) moveWaypoint(selectedWaypoint, [course.waypoints[selectedWaypoint][0], v])
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* live camera coordinates, for pinning new starting points */}
                        <div className='mt-2 flex flex-col gap-1 border-t border-white/10 pt-2'>
                            <span className={sectionLabelCls}>Camera</span>
                            <input
                                ref={camReadoutRef}
                                readOnly
                                className='w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-slate-400'
                            />
                        </div>
                    </div>
            )}

            {/* first-load onboarding, reopenable via the ? button */}
            {showOnboarding && (
                <Onboarding
                    onPickRace={key => { setRaceKey(key); setShowOnboarding(false) }}
                    onShowBettyRace={() => {
                        setRaceKey(BETTY_SPOTLIGHT.raceKey)
                        setPickedYear(BETTY_SPOTLIGHT.year)
                        setSpotlight(true)
                        setShowOnboarding(false)
                    }}
                    onClose={() => setShowOnboarding(false)}
                />
            )}
        </div>
    )
}
