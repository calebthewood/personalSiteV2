import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { UNITS_PER_METER } from './races'
import type { View } from './fiber'

// Animated voxel water: the same instanced seafloor-to-surface columns as
// before, but the surface verts ride a sum of three sine waves (vertex
// shader), crests lighten toward foam, and lighting follows the wave slope.
// Columns share corner positions, so the displaced tops read as one
// continuous low-poly sheet while the silhouette stays blocky.

const WAVE_AMP_M = 1.6 // wave amplitude in "sea meters" (scaled by heightScale)
// Three wave trains, wavelengths ~95m / ~140m / ~200m in scene units.
// p = world (x, z); a term sin(k . p - wt) travels toward +k. k sits mostly
// on p.y (world z) pointed at the land side of the map, so every train rolls
// in from open water toward the beach, with a small x mix to fan their
// angles so the sea doesn't look ruled.
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

function makeWaterMaterial(opacity: number, uniforms: { uTime: { value: number }, uAmp: { value: number } }) {
    const mat = new THREE.MeshStandardMaterial({
        color: 'rgb(96, 176, 240)',
        transparent: true,
        opacity,
        depthWrite: false,
        roughness: 0.35,
        metalness: 0.05,
    })
    mat.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime
        shader.uniforms.uAmp = uniforms.uAmp

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

/** translucent columns from the seafloor up to an animated wave surface, one draw call */
export function VoxelWater({ view, heightScale, blockFootprint, opacity }: {
    view: View, heightScale: number, blockFootprint: number, opacity: number
}) {
    const { g, y, heightOffset } = view
    const ref = useRef<THREE.InstancedMesh>(null!)

    const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmp: { value: 0 } }), [])
    const material = useMemo(() => makeWaterMaterial(opacity, uniforms), [uniforms]) // eslint-disable-line react-hooks/exhaustive-deps
    material.opacity = opacity
    useLayoutEffect(() => () => material.dispose(), [material])

    useFrame(({ clock }) => {
        uniforms.uTime.value = clock.elapsedTime
        uniforms.uAmp.value = WAVE_AMP_M * heightScale
    })

    const count = useMemo(() => {
        let n = 0
        for (let i = 0; i < y.length; i++) if (y[i] < 0) n++
        return n
    }, [y])

    useLayoutEffect(() => {
        const mesh = ref.current
        if (!mesh) return
        const m = new THREE.Matrix4()
        const rowCell = g.cellY * UNITS_PER_METER
        const colCell = g.cellX * UNITS_PER_METER
        const cR = (g.nRows - 1) / 2
        const cC = (g.nCols - 1) / 2
        let i = 0
        for (let r = 0; r < g.nRows; r++) {
            for (let c = 0; c < g.nCols; c++) {
                const yv = y[r * g.nCols + c]
                if (!(yv < 0)) continue
                const floorTop = (yv + heightOffset) * heightScale
                const h = -yv * heightScale
                m.makeScale(rowCell * blockFootprint, h, colCell * blockFootprint)
                m.setPosition((r - cR) * rowCell, floorTop + h / 2, -(c - cC) * colCell)
                mesh.setMatrixAt(i, m)
                i++
            }
        }
        mesh.count = i
        mesh.instanceMatrix.needsUpdate = true
        mesh.computeBoundingSphere()
        // the surface animates above the static bounds; pad so edge columns
        // aren't frustum-culled mid-crest
        if (mesh.boundingSphere) mesh.boundingSphere.radius += 1
    }, [view, heightScale, blockFootprint, g, y, heightOffset])

    if (count === 0) return null

    return (
        <instancedMesh
            key={`${g.name}-${count}`}
            ref={ref}
            args={[undefined, undefined, count]}
            material={material}
        >
            <boxGeometry />
        </instancedMesh>
    )
}
