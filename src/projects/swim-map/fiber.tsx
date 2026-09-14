import { Line, Text, useCursor } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type CameraControlsImpl from 'camera-controls'
import { schemeTableau10 } from 'd3-scale-chromatic'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import type { Line2 } from 'three-stdlib'
import ExplosionConfetti from './confetti'
import { DemMap, latLngToMercator, markShadowsDirty, useDemMapSettings, type DemMapApi, type DemStats, type MapFrame } from './dem-map'
import { Onboarding } from './onboarding'
import { BETTY_SPOTLIGHT, RACES, UNITS_PER_METER, latestYear, parseSwimmerId, raceKeyForSlug, resultsUrl, swimmerId, viewSlug, type CameraStart, type Course, type Race } from './races'

// The race replay: swimmers, buoys, labels, playback and the panel chrome,
// drawn on top of the state-wide voxel basemap (dem-map.tsx). Everything in
// the scene is placed through the basemap's MapFrame (lat/lng -> scene,
// sea level), so a course can be anywhere in the islands.

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

// Marker sizes follow the voxel size of the level being drawn, as on the old
// single-grid map: a fixed 100m buoy is one cell at 80m voxels but five at
// 20m, which reads as a giant. Both are clamped so they never vanish on the
// fine levels or balloon on the coarse ones.
/** buoy tetrahedron base radius, meters, for a voxel size in meters */
const buoyRadiusM = (voxelM: number) => THREE.MathUtils.clamp(voxelM * 1.15, 20, 50)
/** swimmer box edge, meters: half a voxel, never under 20m */
const swimmerSizeM = (voxelM: number) => Math.max(20, voxelM * 0.5)

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
    /** "year-bib" (see swimmerId): the swimmer's identity in the scene */
    id: string
    bib: string
    name: string
    minutes: number
    color: string
}

/** stable per-swimmer randomness: lane across the gates, per-leg arc bulge,
 * pacing profile, and a tiny height jitter so overlapping boxes don't z-fight */
interface SwimmerRand {
    /** each leg bows out perpendicular to the straight line by up to ~18% of
     * its length, either side; most swimmers stay near the line */
    bulges: number[]
    /** where along each leg the bow peaks (0.35-0.65), so arcs of the same
     * side don't stack into one band */
    peaks: number[]
    lane: { start: number, finish: number, yJitter: number }
    pace: (u: number) => number
}

const BULGE_MAX = 0.18

/** triangular sample on (-1, 1): densest at 0, tailing off to the sides.
 * A flat random-sign draw split the field into two clean arcs with an
 * empty middle; this fills the middle while keeping the wide lines. */
const triangular = () => Math.random() + Math.random() - 1

function makeRand(nLegs: number): SwimmerRand {
    return {
        bulges: Array.from({ length: nLegs }, () => triangular() * BULGE_MAX),
        peaks: Array.from({ length: nLegs }, () => 0.35 + Math.random() * 0.3),
        lane: {
            start: (Math.random() - 0.5) * 0.8, // +/- 40% of gate width
            finish: (Math.random() - 0.5) * 0.8,
            yJitter: Math.random() * 0.02,
        },
        pace: SPEED_PROFILES[Math.floor(Math.random() * SPEED_PROFILES.length)].f,
    }
}

/** bezier path through the course for one swimmer's lane + bulges */
function makePath(frame: MapFrame, course: Course, rand: SwimmerRand) {
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
        const [x, z] = frame.projectMerc(mx, my)
        return new THREE.Vector3(x, 0, z)
    })
    const curves: THREE.QuadraticBezierCurve3[] = []
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const dir = b.clone().sub(a)
        const perp = new THREE.Vector3(-dir.z, 0, dir.x)
        const mid = a.clone().lerp(b, rand.peaks[i]).add(perp.multiplyScalar(rand.bulges[i]))
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
function SwimmerField({ frame, course, voxelM, raceKey, swimmers, clockRef, loop, positionsRef, onHover, onSelect }: {
    frame: MapFrame
    course: Course
    /** voxel size of the level being drawn, meters (sizes the boxes) */
    voxelM: number
    raceKey: string
    swimmers: SwimmerEntry[]
    clockRef: React.MutableRefObject<number>
    loop: boolean
    positionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    onHover: (id: string, name: string, color: string) => void
    /** click/tap — pins the label; the only way in on touch, which has no hover */
    onSelect: (id: string, name: string, color: string) => void
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

    // swimmers celebrated (confetti popped, hidden); survives path rebuilds
    const celebrated = useRef(new Set<string>())
    // active confetti bursts, capped at MAX_CONFETTI
    const [bursts, setBursts] = useState<{ id: string, color: string, pos: [number, number, number] }[]>([])

    const sims = useMemo(() => swimmers.map(s => {
        let rand = randCache.current.get(s.id)
        if (!rand) {
            rand = makeRand(course.waypoints.length - 1)
            randCache.current.set(s.id, rand)
        }
        return { ...s, rand, path: makePath(frame, course, rand), raceMs: s.minutes * 60_000 }
    }), [swimmers, frame, course])

    // prune celebration/burst/position state for swimmers no longer on the map
    useEffect(() => {
        const valid = new Set(swimmers.map(s => s.id))
        setBursts(bs => bs.some(b => !valid.has(b.id)) ? bs.filter(b => valid.has(b.id)) : bs)
        for (const id of [...celebrated.current]) if (!valid.has(id)) celebrated.current.delete(id)
        for (const id of [...positionsRef.current.keys()]) if (!valid.has(id)) positionsRef.current.delete(id)
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

    const size = swimmerSizeM(voxelM) * UNITS_PER_METER
    const seaLevel = frame.seaLevel

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
                    if (!celebrated.current.has(s.id)) {
                        celebrated.current.add(s.id)
                        finished.push({
                            id: s.id,
                            color: s.color,
                            pos: [s.path.overrunEnd.x, seaLevel + s.rand.lane.yJitter, s.path.overrunEnd.z],
                        })
                    }
                }
            } else {
                if (celebrated.current.has(s.id)) {
                    // clock was restarted
                    celebrated.current.delete(s.id)
                    restarted.push(s.id)
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
            let reg = positionsRef.current.get(s.id)
            if (!reg) { reg = new THREE.Vector3(); positionsRef.current.set(s.id, reg) }
            reg.copy(p)
        }
        mesh.instanceMatrix.needsUpdate = true
        if (finished.length > 0 || restarted.length > 0) {
            setBursts(bs => {
                let next = restarted.length ? bs.filter(b => !restarted.includes(b.id)) : bs
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
        if (celebrated.current.has(s.id)) return null
        e.stopPropagation()
        return { id, s }
    }

    const handlePointer = (e: { instanceId?: number, stopPropagation: () => void }) => {
        const hit = simAt(e)
        if (!hit) return
        setHovered(true)
        if (lastHover.current !== hit.id) {
            lastHover.current = hit.id
            onHover(hit.s.id, hit.s.name, hit.s.color)
        }
    }

    const handleClick = (e: { instanceId?: number, stopPropagation: () => void }) => {
        const hit = simAt(e)
        if (hit) onSelect(hit.s.id, hit.s.name, hit.s.color)
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
                <group key={b.id} position={b.pos} scale={CONFETTI_SCALE}>
                    <ExplosionConfetti
                        numberOfExplosions={1}
                        particleAmount={100}
                        explosionCount={1}
                        spreadAreaRadius={0}
                        colorsArray={[b.color, '#e8bf56', '#e2f7ce', '#ffffff']}
                        onComplete={() => setBursts(bs => bs.filter(x => x.id !== b.id))}
                    />
                </group>
            ))}
        </>
    )
}

/** scene-space buoy positions (tetrahedron centers) + tetrahedron dimensions;
 * waypointOf maps each buoy back to its course waypoint (gates share one) */
function computeBuoys(frame: MapFrame, course: Course, voxelM: number): {
    positions: THREE.Vector3[], waypointOf: number[], height: number, baseRadius: number
} {
    const seaLevel = frame.seaLevel
    const baseRadius = buoyRadiusM(voxelM) * UNITS_PER_METER
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
        const [x, z] = frame.projectMerc(mx, my)
        return new THREE.Vector3(x, seaLevel + height / 2, z)
    })
    return { positions, waypointOf, height, baseRadius }
}

/** race course markers: tetrahedra floating at sea level; start + finish are
 * 2-buoy gates. In edit mode (settings open) buoys are click-draggable: drags
 * move the underlying course waypoint (both buoys of a gate move together). */
function CourseMarkers({ buoys, frame, waypoints, editable, selectedWaypoint, onSelectWaypoint, onMoveWaypoint, controlsRef }: {
    buoys: ReturnType<typeof computeBuoys>
    frame: MapFrame
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

    // buoys cast shadows and the basemap only re-renders its shadow map on
    // request, so every buoy move (race switch, drag) asks for one
    useEffect(() => { markShadowsDirty() }, [buoys])

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
                            const [hitLat0, hitLng0] = frame.unproject(hit.current.x, hit.current.z)
                            drag.current = { wp, lat0: waypoints[wp][0], lng0: waypoints[wp][1], hitLat0, hitLng0 }
                            ;(e.target as Element).setPointerCapture(e.pointerId)
                            if (controlsRef.current) controlsRef.current.enabled = false
                        } : undefined}
                        onPointerMove={editable ? e => {
                            const d = drag.current
                            if (!d || d.wp !== wp) return
                            e.stopPropagation()
                            if (!e.ray.intersectPlane(plane.current, hit.current)) return
                            const [lat, lng] = frame.unproject(hit.current.x, hit.current.z)
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
function SwimmerLabel({ id, name, color, anchor, positionsRef, onDismiss }: {
    id: string
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
        const p = positionsRef.current.get(id)
        if (!p) { line.visible = false; return }
        line.visible = true
        // imperative update only — changing the `points` prop rebuilds the
        // geometry through React every frame
        line.geometry.setPositions([
            p.x, p.y, p.z,
            anchor.x, anchor.y - LABEL_BOX_H / 2, anchor.z, // meet the box's bottom edge
        ])
    })

    // "BETTY ANN BARNETT ’26": the season matters now that one person can be
    // on the map from several years
    const season = parseSwimmerId(id)?.year
    const shown = (name.length > 22 ? name.slice(0, 21) + '…' : name) + (season ? ` ${shortYear(season)}` : '')

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

/** a racer resolved from the selection: which season, and the "year-bib" id */
interface SelectedRacer extends Racer {
    id: string
    year: number
}

const EMPTY_RACERS: Racer[] = []

/** 2026 -> ’26 */
const shortYear = (y: number) => `’${String(y).slice(-2)}`

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
        // some seasons publish gun time only (no chip time): fall back to it
        const chipTime = String(row[idx.chip_time] || row[idx.clock_time] || '')
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
    raceKey, onSelectRace, year, onSelectYear, racers, selectedIds, selectedRacers, onToggle, onAddGroup, onClear,
    pinnedId, onHoverSwimmer, onPinSwimmer,
}: {
    raceKey: string
    onSelectRace: (key: string) => void
    /** season currently shown (always one of the race's `years`) */
    year: number
    onSelectYear: (year: number) => void
    /** finishers of the season being browsed */
    racers: Racer[]
    /** "year-bib" ids on the map, in selection order (any season of this race) */
    selectedIds: string[]
    /** those ids resolved against loaded results, same order */
    selectedRacers: SelectedRacer[]
    onToggle: (id: string) => void
    onAddGroup: (group: string) => void
    onClear: () => void
    /** id whose name label is pinned in the scene (roster click / 3d hover) */
    pinnedId: string | null
    /** roster row hover: show that swimmer's name label (null on leave) */
    onHoverSwimmer: (id: string | null) => void
    /** roster row click: pin/unpin that swimmer's name label */
    onPinSwimmer: (id: string) => void
}) {
    const [query, setQuery] = useState('')

    // races grouped by region, in RACES order (first appearance of a region
    // sets its position)
    const regions = useMemo(() => {
        const groups = new Map<string, [string, Race][]>()
        for (const entry of Object.entries(RACES)) {
            const list = groups.get(entry[1].region) ?? []
            list.push(entry)
            groups.set(entry[1].region, list)
        }
        return [...groups.entries()]
    }, [])

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

    const selectedSet = new Set(selectedIds)

    return (
        <div className='flex h-full flex-col gap-3 p-4 text-sm'>
            {/* header */}
            <div>
                <div className='text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400'>{RACES[raceKey].region}</div>
                <h1 className='text-lg font-bold tracking-tight text-white'>Open Water Replay</h1>
            </div>

            {/* race switcher: a select grouped by region, so the list of races
                can grow without eating the swimmer search below */}
            <div className='flex flex-col gap-1.5'>
                <span className={sectionLabelCls}>Race</span>
                <select
                    className={selectCls}
                    value={raceKey}
                    onChange={e => onSelectRace(e.target.value)}
                >
                    {regions.map(([region, races]) => (
                        <optgroup key={region} label={region}>
                            {races.map(([key, r]) => (
                                <option key={key} value={key}>{r.name} · {r.miles} mi</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
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
                    const id = swimmerId(year, r.bib)
                    const selected = selectedSet.has(id)
                    return (
                        <button
                            key={id}
                            className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition ${selected
                                ? 'bg-cyan-400/10 text-white'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                            onClick={() => onToggle(id)}
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
                        const pinned = pinnedId === r.id
                        return (
                            <div
                                key={r.id}
                                className={`group flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition ${pinned
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-200 hover:bg-white/5'}`}
                                title={pinned ? 'Click to unpin name label' : 'Click to pin name label'}
                                onMouseEnter={() => onHoverSwimmer(r.id)}
                                onMouseLeave={() => onHoverSwimmer(null)}
                                onClick={() => onPinSwimmer(r.id)}
                            >
                                <span
                                    className='inline-block h-3 w-3 shrink-0 rounded-sm'
                                    style={{ background: swimmerColors[i % swimmerColors.length] }}
                                />
                                <span className='flex-1 truncate'>{r.name}</span>
                                {/* the season this entry comes from */}
                                <span className='shrink-0 rounded bg-white/10 px-1 text-[10px] tabular-nums text-slate-400' title={`${r.year} season`}>
                                    {shortYear(r.year)}
                                </span>
                                {pinned && <span className='shrink-0 text-[10px] text-cyan-300'>◉</span>}
                                <span className='tabular-nums text-slate-500'>{r.chipTime}</span>
                                <button
                                    className='px-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400'
                                    title='Remove from the map'
                                    onClick={e => { e.stopPropagation(); onToggle(r.id) }}
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
function CameraRig({ preset, controls, frame, buoys }: {
    preset: (CameraStart & { nonce: number }) | null
    controls: CameraControlsImpl | null
    frame: MapFrame
    buoys: ReturnType<typeof computeBuoys> | null
}) {
    const appliedNonce = useRef<number | null>(null)
    // the very first framing snaps into place: the basemap's default camera
    // is nowhere near any course, so animating from it is a swoop across
    // the state
    const applied = useRef(false)
    const camera = useThree(s => s.camera)
    const size = useThree(s => s.size)

    const courseBox = useMemo(
        () => buoys && new THREE.Box3().setFromPoints(buoys.positions),
        [buoys]
    )

    // clamp the orbit target to a generous box around the buoys so the course
    // can't be panned out of frame
    useEffect(() => {
        if (!controls || !courseBox) return
        // extra vertical headroom: preset targets can sit well above sea level
        controls.setBoundary(courseBox.clone().expandByVector(new THREE.Vector3(3, 6, 3)))
    }, [courseBox, controls])

    useEffect(() => {
        // apply each request exactly once (buoy changes must not re-snap the
        // camera after the user has moved away); wait for the course to exist
        if (!preset || preset.nonce === appliedNonce.current) return
        if (!controls || !buoys) return
        appliedNonce.current = preset.nonce
        const animate = applied.current
        applied.current = true
        // rotate first, then contain-fit at the final angle. Fitting by hand
        // because controls.fitToBox rounds the rotation to the nearest 90°
        // axis, which would snap every angled preset back to overhead.
        controls
            .rotateTo(THREE.MathUtils.degToRad(preset.azimuth), THREE.MathUtils.degToRad(preset.polar), animate)
            .then(() => {
                // explicit framing pinned in the preset: no auto-fit
                if (preset.zoom !== undefined && preset.target) {
                    const [x, z] = frame.project(preset.target[0], preset.target[1])
                    controls.moveTo(x, frame.seaLevel, z, animate)
                    controls.zoomTo(preset.zoom, animate)
                    return
                }
                // an instant rotate only settles on the next controls.update
                // (drei runs it per frame); apply it now so the fit below
                // measures from the new angle, not the old one
                if (!animate) controls.update(0)
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
                const fitZoom = Math.min(
                    (size.width * FIT_FRACTION_X) / spanX,
                    (size.height * FIT_FRACTION_Y) / spanY,
                )
                // a preset can pull the framing in or out (fit) or fix the zoom
                // outright while keeping the auto-fit center
                const zoom = preset.zoom ?? fitZoom * (preset.fit ?? 1)
                // re-centre on the middle of what was just measured — the box
                // centre can sit well off it for a lopsided course
                const center = camera.localToWorld(new THREE.Vector3(
                    (minX + maxX) / 2,
                    (minY + maxY) / 2,
                    sumZ / buoys.positions.length,
                ))
                controls.moveTo(center.x, center.y, center.z, animate)
                controls.zoomTo(zoom, animate)
            })
    }, [preset, buoys, controls, camera, size, frame])
    return null
}

/** writes the live camera angles/zoom/target into a DOM input, throttled */
function CameraReadout({ outRef, controls, frame }: {
    outRef: React.RefObject<HTMLInputElement>
    controls: CameraControlsImpl | null
    frame: MapFrame
}) {
    const camera = useThree(s => s.camera)
    const acc = useRef(1)
    const tmp = useRef(new THREE.Vector3())
    useFrame((_, delta) => {
        acc.current += delta
        if (acc.current < 0.2) return
        acc.current = 0
        const el = outRef.current
        if (!el || !controls) return
        const t = controls.getTarget(tmp.current)
        const [lat, lng] = frame.unproject(t.x, t.z)
        el.value = `az ${THREE.MathUtils.radToDeg(controls.azimuthAngle).toFixed(1)}°`
            + ` pol ${THREE.MathUtils.radToDeg(controls.polarAngle).toFixed(1)}°`
            + ` zoom ${camera.zoom.toFixed(1)}`
            + ` target [${lat.toFixed(6)}, ${lng.toFixed(6)}]`
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

const EMPTY_STATS: DemStats = { zoom: 0, mPerPx: 0, autoRes: 0, levelIdx: 0, tiles: 0, warming: 0 }

const MAP_PATH = '/projects/swim-map'

/** the onboarding's featured swimmers, as "year-bib" ids */
const FEATURED_IDS = BETTY_SPOTLIGHT.bibs.map(b => swimmerId(BETTY_SPOTLIGHT.year, b))

/** query string with the commas of the `swimmers` list left readable
 * (URLSearchParams would escape them to %2C; a comma is safe in a query) */
const toSearch = (p: URLSearchParams) => p.toString().replace(/%2C/gi, ',')

/** the `swimmers` query param: comma-separated "year-bib" ids, deduped, in order */
function parseSwimmersParam(v: string | null): string[] {
    if (!v) return []
    const out: string[] = []
    for (const id of v.split(',')) if (parseSwimmerId(id) && !out.includes(id)) out.push(id)
    return out
}

/**
 * The page. Everything a visitor can adjust (settings aside) lives in the url,
 * so a view is shareable and the back button works:
 *
 *   /projects/swim-map/<race slug>?year=2025&view=east&swimmers=2026-883,2025-883
 *
 * Defaults (latest season, the race's first view, nobody on the map) are
 * omitted from the query. Query changes replace the history entry; race
 * changes push one.
 */
export function FiberCanvas() {
    const isMobile = useIsMobile()
    // results panel starts open on desktop, collapsed to its toggle on phones
    const [sidebarOpen, setSidebarOpen] = useState(
        () => typeof window === 'undefined' || window.matchMedia(SM_UP).matches,
    )

    // ---- url state ----
    const params = useParams<{ race?: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const raceKey = raceKeyForSlug(params.race) ?? Object.keys(RACES)[0]
    const race = RACES[raceKey]
    // season being browsed; falls back to the race's latest when the url
    // names a season this race never ran
    const yearParam = Number(searchParams.get('year'))
    const year = race.years.includes(yearParam) ? yearParam : latestYear(race)
    const viewParam = searchParams.get('view')
    const camera = race.cameras.find(c => viewSlug(c) === viewParam) ?? race.cameras[0]
    const swimmersParam = searchParams.get('swimmers')
    const selectedIds = useMemo(() => parseSwimmersParam(swimmersParam), [swimmersParam])

    // canonical path: an unknown or missing slug redirects to the race shown
    useEffect(() => {
        if (params.race !== race.slug) {
            const q = toSearch(searchParams)
            navigate(`${MAP_PATH}/${race.slug}${q ? `?${q}` : ''}`, { replace: true })
        }
    }, [params.race, race.slug, searchParams, navigate])

    // query writers go through navigate rather than setSearchParams, which
    // re-serializes (and so re-escapes the swimmer list's commas)
    const setQuery = useCallback((patch: Record<string, string | null>) => {
        const next = new URLSearchParams(searchParams)
        for (const [k, v] of Object.entries(patch)) {
            if (v === null) next.delete(k)
            else next.set(k, v)
        }
        const q = toSearch(next)
        navigate({ search: q ? `?${q}` : '' }, { replace: true })
    }, [searchParams, navigate])
    const selectRace = useCallback((key: string) => {
        // a fresh query: swimmers and seasons are race-specific
        if (key !== raceKey) navigate(`${MAP_PATH}/${RACES[key].slug}`)
    }, [navigate, raceKey])
    const selectYear = useCallback((y: number) => {
        setQuery({ year: y === latestYear(race) ? null : String(y) })
    }, [setQuery, race])
    const selectView = useCallback((c: CameraStart) => {
        setQuery({ view: c === race.cameras[0] ? null : viewSlug(c) })
    }, [setQuery, race])
    const updateSelectedIds = useCallback((update: (ids: string[]) => string[]) => {
        const ids = update(parseSwimmersParam(searchParams.get('swimmers')))
        setQuery({ swimmers: ids.length ? ids.join(',') : null })
    }, [searchParams, setQuery])

    // basemap: the tile pyramid picks its voxel size from the zoom by default;
    // the settings dialog can pin a level and tune the look
    const { settings: mapSettings, set: setMapSetting } = useDemMapSettings({ ambient: 0.7 })
    const [api, setApi] = useState<DemMapApi | null>(null)
    const [mapStats, setMapStats] = useState<DemStats>(EMPTY_STATS)
    const handleApi = useCallback((a: DemMapApi | null) => setApi(a), [])
    const handleStats = useCallback((s: DemStats) => setMapStats(s), [])
    // the placement frame is stable across LOD swaps; memo course geometry on it
    const frame = api?.frame ?? null
    const controls = api?.controls ?? null
    // the buoy editor and the readout still take a ref (pointer handlers
    // toggle controls.enabled mid-drag)
    const controlsRef = useRef<CameraControlsImpl | null>(null)
    controlsRef.current = controls

    // ---- results: one file per race-season, cached; the season being
    // browsed plus every season a selected swimmer comes from ----
    const [results, setResults] = useState<Record<string, Racer[]>>({})
    const loading = useRef(new Set<string>())
    const neededYears = useMemo(() => {
        const ys = new Set<number>([year])
        for (const id of selectedIds) {
            const p = parseSwimmerId(id)
            if (p && race.years.includes(p.year)) ys.add(p.year)
        }
        return [...ys]
    }, [year, selectedIds, race])
    useEffect(() => {
        for (const y of neededYears) {
            const key = `${raceKey}-${y}`
            if (results[key] || loading.current.has(key)) continue
            loading.current.add(key)
            fetch(resultsUrl(raceKey, y))
                .then(r => r.json())
                .then((file: RaceResultsFile) => {
                    setResults(m => m[key] ? m : { ...m, [key]: parseRacers(file) })
                })
                .catch(err => console.error(`results for ${raceKey} ${y} failed to load`, err))
                .finally(() => loading.current.delete(key))
        }
    }, [neededYears, raceKey, results])
    /** the season being browsed (the search list) */
    const racers = results[`${raceKey}-${year}`] ?? EMPTY_RACERS

    // every loaded swimmer of this race by "year-bib" id
    const byId = useMemo(() => {
        const m = new Map<string, SelectedRacer>()
        for (const [key, rs] of Object.entries(results)) {
            if (!key.startsWith(`${raceKey}-`)) continue
            const y = Number(key.slice(raceKey.length + 1))
            for (const r of rs) {
                const id = swimmerId(y, r.bib)
                m.set(id, { ...r, id, year: y })
            }
        }
        return m
    }, [results, raceKey])
    // selected swimmers whose season has loaded, in selection order
    const selectedRacers = useMemo(
        () => selectedIds.map(id => byId.get(id)).filter((r): r is SelectedRacer => !!r),
        [selectedIds, byId]
    )

    const [playing, setPlaying] = useState(false)
    const [loop, setLoop] = useState(false)
    const [speed, setSpeed] = useState(SPEED_PRESETS[1].factor)
    const raceClock = useRef(0)

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

    // a new race starts from the gun, stopped
    useEffect(() => {
        setSelectedWaypoint(null)
        setPlaying(false)
        raceClock.current = 0
    }, [raceKey])

    // ui chrome: settings dialog + camera starting points + live coord readout
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [cameraPreset, setCameraPreset] = useState<(CameraStart & { nonce: number }) | null>(null)
    const camReadoutRef = useRef<HTMLInputElement>(null)
    const applyCamera = useCallback((c: CameraStart) => {
        // nonce so re-clicking the same starting point re-applies it
        setCameraPreset({ ...c, nonce: performance.now() })
    }, [])

    // the url's view (or the race's first) applies whenever it or the race changes
    useEffect(() => {
        applyCamera(camera)
    }, [race, camera, applyCamera])
    const handleViewClick = (c: CameraStart) => {
        // the effect above handles a change; re-clicking the current view
        // just re-frames it
        if (c === camera) applyCamera(c)
        else selectView(c)
    }

    // name-label state: live swimmer positions (written by Swimmer useFrame),
    // a pinned label (3d hover or roster click; persists until dismissed /
    // unclicked), and a transient label from hovering a roster row, which
    // takes display precedence while the pointer is over the row
    const swimmerPositions = useRef(new Map<string, THREE.Vector3>())
    const [label, setLabel] = useState<{ id: string, name: string, color: string, anchor: THREE.Vector3 } | null>(null)
    const [hoverLabel, setHoverLabel] = useState<{ id: string, name: string, color: string, anchor: THREE.Vector3 } | null>(null)

    const toggleId = (id: string) => updateSelectedIds(s =>
        s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    )
    // groups come from the season being browsed
    const addGroup = (group: string) => {
        const members = group === '__all__' ? racers
            : group === '__top100__' ? racers.slice(0, 100)
                : racers.filter(r => r.division === group)
        const ids = members.map(r => swimmerId(year, r.bib))
        updateSelectedIds(s => {
            const existing = new Set(s)
            return [...s, ...ids.filter(id => !existing.has(id))]
        })
    }
    const clearSelected = () => updateSelectedIds(() => [])

    // stable identity matters: SwimmerField rebuilds its paths when this changes
    const swimmerEntries = useMemo<SwimmerEntry[]>(
        () => selectedRacers.map((r, i) => ({
            id: r.id,
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

    // onboarding: shown when the page is opened at the bare /projects/swim-map
    // (no race in the path), reopenable via the ? button. A link straight to
    // a race skips it. Read once on mount: the canonical-path redirect above
    // fills the slug in right after, without remounting.
    const [showOnboarding, setShowOnboarding] = useState(() => !params.race)

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

    // voxel size of the level on screen; markers are sized from it, so they
    // step down as the map refines on zoom-in (and back up on zoom-out)
    const voxelM = api?.levels[mapStats.levelIdx]?.res ?? 20
    const buoys = useMemo(
        () => frame && computeBuoys(frame, course, voxelM),
        [frame, course, voxelM]
    )

    const makeLabel = useCallback((id: string, name: string, color: string) => {
        if (!buoys || !frame) return null
        // fixed anchor at the race's configured lat/lng, floating a buoy's
        // height above sea level (raised clear of the terrain below, if any,
        // once the basemap has sampled it - see the effect below)
        const [x, z] = frame.project(race.labelAnchor[0], race.labelAnchor[1])
        const anchor = new THREE.Vector3(x, frame.seaLevel + buoys.height + 0.5, z)
        return { id, name, color, anchor }
    }, [buoys, frame, race])

    // never bury the label in terrain it hovers over: sample the ground under
    // the anchor (async, through the basemap's current level) and lift the
    // box above it. One-time per anchor placement.
    const pinnedAnchor = label?.anchor ?? null
    useEffect(() => {
        if (!api || !pinnedAnchor) return
        let live = true
        api.sampleElevation(race.labelAnchor[0], race.labelAnchor[1]).then(e => {
            if (!live || e === null) return
            const top = api.sceneY(e)
            if (pinnedAnchor.y < top + LABEL_BOX_H) {
                setLabel(l => l && l.anchor === pinnedAnchor
                    ? { ...l, anchor: new THREE.Vector3(pinnedAnchor.x, top + LABEL_BOX_H, pinnedAnchor.z) }
                    : l)
            }
        })
        return () => { live = false }
    }, [api, pinnedAnchor, race])

    const handleSwimmerHover = useCallback((id: string, name: string, color: string) => {
        const l = makeLabel(id, name, color)
        if (l) setLabel(l)
    }, [makeLabel])

    // clicking a swimmer's block pins that name. Also drops any roster-hover
    // label, which would otherwise keep display precedence — on touch,
    // mouseenter fires on tap and never gets a matching mouseleave.
    const handleSwimmerClick = useCallback((id: string, name: string, color: string) => {
        const l = makeLabel(id, name, color)
        if (l) { setHoverLabel(null); setLabel(l) }
    }, [makeLabel])

    // roster rows share the swimmer's assigned color (index in selection order)
    const labelForId = (id: string) => {
        const i = selectedRacers.findIndex(r => r.id === id)
        if (i < 0) return null
        return makeLabel(id, selectedRacers[i].name, swimmerColors[i % swimmerColors.length])
    }
    const handleRosterHover = (id: string | null) => {
        // touch reports a mouseenter on tap and often never a matching
        // mouseleave, so on phones taps go through handleRosterClick alone
        if (isMobile) return
        setHoverLabel(id ? labelForId(id) : null)
    }
    const handleRosterClick = (id: string) => {
        // click pins the label; clicking the same swimmer again unpins
        setHoverLabel(null)
        setLabel(prev => prev?.id === id ? null : labelForId(id))
    }

    // anchor position goes stale when the race or the map's vertical scale changes
    useEffect(() => {
        setLabel(null)
        setHoverLabel(null)
    }, [raceKey, frame])

    // drop labels whose swimmer is removed from the map
    useEffect(() => {
        if (label && !selectedIds.includes(label.id)) setLabel(null)
        if (hoverLabel && !selectedIds.includes(hoverLabel.id)) setHoverLabel(null)
    }, [label, hoverLabel, selectedIds])

    // Betty spotlight (launched from the onboarding): the onboarding sends the
    // browser to the featured race with the featured swimmers in the url;
    // once that season's results and the buoys are ready, start the replay
    // and pin the name label on Betty. Declared after the label-clearing
    // effects so the label set here survives the same-commit clear when the
    // map finishes loading last.
    const [spotlight, setSpotlight] = useState(false)
    // ready only once the url actually carries the featured setup (navigate
    // can land a render after setSpotlight) and that season has loaded
    const spotlightReady = spotlight && raceKey === BETTY_SPOTLIGHT.raceKey && !!buoys
        && FEATURED_IDS.every(id => selectedIds.includes(id) && byId.has(id))
    useEffect(() => {
        if (!spotlightReady) return
        raceClock.current = 0
        setPlaying(true)
        const starId = swimmerId(BETTY_SPOTLIGHT.year, BETTY_SPOTLIGHT.labelBib)
        const i = selectedRacers.findIndex(r => r.id === starId)
        if (i >= 0) handleSwimmerHover(starId, selectedRacers[i].name, swimmerColors[i % swimmerColors.length])
        setSpotlight(false)
    }, [spotlightReady, selectedRacers, handleSwimmerHover])

    const showBettyRace = () => {
        const featured = RACES[BETTY_SPOTLIGHT.raceKey]
        const q = new URLSearchParams()
        if (BETTY_SPOTLIGHT.year !== latestYear(featured)) q.set('year', String(BETTY_SPOTLIGHT.year))
        q.set('swimmers', FEATURED_IDS.join(','))
        navigate(`${MAP_PATH}/${featured.slug}?${toSearch(q)}`)
        setSpotlight(true)
        setShowOnboarding(false)
    }

    const levels = api?.levels ?? []
    const drawnLevel = levels[mapStats.levelIdx] ?? null

    // 100dvh, not 100vh: on phones the URL bar shrinks the visible viewport and
    // 100vh would push the bottom chrome off-screen
    return (
        <div className='relative h-[100dvh] w-full overflow-hidden overscroll-none bg-slate-950 text-slate-100'>
            {/* scene: the full-bleed basemap, with the race drawn on top; all
                chrome floats over it */}
            <DemMap
                settings={mapSettings}
                onApi={handleApi}
                onStats={handleStats}
                lockTarget={false}
            >
                {/* placement uses the api from onApi (one render earlier), so
                    the scene body needs nothing from the callback */}
                {() => frame && buoys && (
                    <>
                        <CameraRig preset={cameraPreset} controls={controls} frame={frame} buoys={buoys} />
                        <CameraReadout outRef={camReadoutRef} controls={controls} frame={frame} />
                        <RaceClock clockRef={raceClock} playing={playing} speed={speed} />
                        <CourseMarkers
                            buoys={buoys}
                            frame={frame}
                            waypoints={course.waypoints}
                            editable={settingsOpen}
                            selectedWaypoint={selectedWaypoint}
                            onSelectWaypoint={setSelectedWaypoint}
                            onMoveWaypoint={moveWaypoint}
                            controlsRef={controlsRef}
                        />
                        <SwimmerField
                            frame={frame}
                            course={course}
                            voxelM={voxelM}
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
                                id={(hoverLabel ?? label)!.id}
                                name={(hoverLabel ?? label)!.name}
                                color={(hoverLabel ?? label)!.color}
                                anchor={(hoverLabel ?? label)!.anchor}
                                positionsRef={swimmerPositions}
                                onDismiss={() => { setLabel(null); setHoverLabel(null) }}
                            />
                        )}
                    </>
                )}
            </DemMap>

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
                            onSelectRace={selectRace}
                            year={year}
                            onSelectYear={selectYear}
                            racers={racers}
                            selectedIds={selectedIds}
                            selectedRacers={selectedRacers}
                            onToggle={toggleId}
                            onAddGroup={addGroup}
                            onClear={clearSelected}
                            pinnedId={label?.id ?? null}
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
                        className={`shrink-0 rounded-full px-3 py-1 text-xs transition max-sm:px-2 ${c === camera
                            ? 'bg-cyan-400/20 font-semibold text-cyan-300'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                        onClick={() => handleViewClick(c)}
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
                        {/* voxel size = tile pyramid level: auto follows the zoom */}
                        <div className='mb-1 flex flex-wrap items-center gap-4 text-sm text-slate-300'>
                            <label className='flex items-center gap-2'>
                                <span>Voxel size</span>
                                <select
                                    className={selectCls + ' !w-auto'}
                                    value={mapSettings.auto ? 'auto' : String(mapSettings.levelIdx)}
                                    onChange={e => {
                                        if (e.target.value === 'auto') {
                                            setMapSetting('auto', true)
                                        } else {
                                            // hand the slider the level currently drawn
                                            // first, so turning auto off doesn't jump the map
                                            setMapSetting('levelIdx', Number(e.target.value))
                                            setMapSetting('auto', false)
                                        }
                                    }}
                                >
                                    <option value='auto'>Auto{drawnLevel ? ` (${drawnLevel.res}m)` : ''}</option>
                                    {levels.map((l, i) => <option key={l.dir} value={i}>{l.res}m</option>)}
                                </select>
                            </label>
                            <label className='flex items-center gap-2'>
                                <input
                                    type='checkbox'
                                    className='accent-cyan-400'
                                    checked={mapSettings.shadows}
                                    onChange={e => setMapSetting('shadows', e.target.checked)}
                                />
                                Shadows
                            </label>
                            <label className='flex items-center gap-2'>
                                <input
                                    type='checkbox'
                                    className='accent-cyan-400'
                                    checked={mapSettings.colorMode === 'terrain'}
                                    onChange={e => setMapSetting('colorMode', e.target.checked ? 'terrain' : 'none')}
                                />
                                Land cover colors
                            </label>
                            <span className='text-xs text-slate-500'>
                                {api
                                    ? `${mapStats.tiles} tile${mapStats.tiles === 1 ? '' : 's'} · ${mapStats.mPerPx.toFixed(1)} m/px`
                                    : 'loading terrain…'}
                            </span>
                        </div>
                        <Control label='Auto detail (px per voxel)' value={mapSettings.detailPx} min={2} max={16} step={1} onChange={v => setMapSetting('detailPx', v)} />
                        <Control label='Height scale' value={mapSettings.heightScale} min={0.002} max={0.02} step={0.001} onChange={v => setMapSetting('heightScale', v)} />
                        <Control label='Ocean depth compression' value={mapSettings.oceanDivisor} min={1} max={15} step={0.5} onChange={v => setMapSetting('oceanDivisor', v)} />
                        <Control label='Water opacity' value={mapSettings.waterOpacity} min={0} max={0.6} step={0.05} onChange={v => setMapSetting('waterOpacity', v)} />
                        <Control label='Sun intensity' value={mapSettings.sunIntensity} min={0} max={3} step={0.1} onChange={v => setMapSetting('sunIntensity', v)} />
                        <Control label='Ambient light' value={mapSettings.ambient} min={0} max={2} step={0.05} onChange={v => setMapSetting('ambient', v)} />

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

                        {/* live camera coordinates, for pinning new starting points
                            (the target is a lat/lng, ready for CameraStart.target) */}
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
                    onPickRace={key => { selectRace(key); setShowOnboarding(false) }}
                    onShowBettyRace={showBettyRace}
                    onClose={() => setShowOnboarding(false)}
                />
            )}
        </div>
    )
}
