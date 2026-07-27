// CONFETTI COMPONENT V2 BY ANDERSON MANCINI - CC 2024
// If you use, please credit it :)
// Reworked for TypeScript + React 18/19 StrictMode: per-particle mutable state
// lives outside the render phase, one useFrame per burst, shadows disabled.

import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const MAX_PARTICLES = 300
const MAX_EXPLOSIONS = 3
const SCALE_REDUCTION_FACTOR = 0.3
const PARTICLE_DRIFT_RADIUS = 0.3
const DEFAULT_COLORS = ['#452632', '#91204d', '#e4844a', '#e8bf56', '#e2f7ce']

export interface ExplosionConfettiProps {
    /** Position of the confetti explosion in the scene. */
    position?: [number, number, number]
    /** Hex color codes for confetti particles. */
    colorsArray?: string[]
    /** Number of simultaneous bursts. Capped at 3 for performance. */
    numberOfExplosions?: number
    /** Particles per burst. Capped at 300. */
    particleAmount?: number
    /** Size of each particle. */
    particleSize?: number
    /** Radius within which each burst origin is randomized. */
    spreadAreaRadius?: number
    /** Duration of each burst in frames. */
    confettiDuration?: number
    /** How many times each burst repeats before removing itself. */
    explosionCount?: number
    /** Called once when every burst has finished (never fires with explosionCount=Infinity). */
    onComplete?: () => void
}

interface ParticleState {
    velocity: THREE.Vector3
    rotateSpeed: THREE.Vector3
    baseScale: THREE.Vector3
}

interface BurstState {
    originX: number
    originZ: number
    life: number
    duration: number
    repetition: number
    particles: ParticleState[]
}

function resetBurst(s: BurstState, spreadAreaRadius: number) {
    s.originX = spreadAreaRadius / 2 - Math.random() * spreadAreaRadius
    s.originZ = spreadAreaRadius / 2 - Math.random() * spreadAreaRadius
    s.life = 0
    for (const p of s.particles) {
        const randomSpeed = Math.random() * 0.015
        p.velocity.set(
            (Math.random() - 0.5) * PARTICLE_DRIFT_RADIUS + randomSpeed * 2,
            (Math.random() - 0.5) * PARTICLE_DRIFT_RADIUS + randomSpeed,
            (Math.random() - 0.5) * PARTICLE_DRIFT_RADIUS + randomSpeed * 2,
        )
        p.rotateSpeed.set(
            Math.random() * 0.5 + randomSpeed * 0.4,
            Math.random() * 0.5 + randomSpeed * 0.5,
            Math.random() * 0.5 + randomSpeed * 0.6,
        )
        p.baseScale.set(
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
        )
    }
}

interface BurstProps {
    index: number
    colorsArray: string[]
    particleAmount: number
    particleSize: number
    spreadAreaRadius: number
    confettiDuration: number
    explosionCount: number
    onFinished?: () => void
}

function Burst({ index, colorsArray, particleAmount, particleSize, spreadAreaRadius, confettiDuration, explosionCount, onFinished }: BurstProps) {
    const [finished, setFinished] = useState(false)
    const meshRefs = useRef<(THREE.Object3D | null)[]>([])

    const colorArray = useMemo(() => {
        const tmp = new THREE.Color()
        return Float32Array.from(
            Array.from({ length: particleAmount }, () =>
                tmp.set(colorsArray[Math.floor(Math.random() * colorsArray.length)]).toArray(),
            ).flat(),
        )
    }, [particleAmount, colorsArray])

    // Mutable simulation state; created once, never touched during render.
    const burst = useMemo<BurstState>(() => {
        const s: BurstState = {
            originX: 0,
            originZ: 0,
            life: 0,
            // Stagger bursts by ~20 frames each.
            duration: confettiDuration + Math.floor(Math.random() + 20 * index),
            repetition: 0,
            particles: Array.from({ length: particleAmount }, () => ({
                velocity: new THREE.Vector3(),
                rotateSpeed: new THREE.Vector3(),
                baseScale: new THREE.Vector3(),
            })),
        }
        resetBurst(s, spreadAreaRadius)
        return s
        // Intentionally created once for the component's lifetime.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useFrame(() => {
        if (finished) return
        const scaleReduction = Math.max(1 - (SCALE_REDUCTION_FACTOR * burst.life) / 25, 0)
        burst.particles.forEach((p, i) => {
            const m = meshRefs.current[i]
            if (!m) return
            if (burst.life === 0) {
                m.position.set(burst.originX, 0, burst.originZ)
                m.rotation.set(0, 0, 0)
            }
            m.position.x += p.velocity.x
            m.position.y += p.velocity.y + scaleReduction * 0.1
            m.position.z += p.velocity.z
            m.rotation.x += p.rotateSpeed.x / 2
            m.rotation.y += p.rotateSpeed.y / 4
            m.rotation.z += p.rotateSpeed.z / 2
            m.scale.set(
                p.baseScale.x * scaleReduction,
                p.baseScale.y * scaleReduction,
                p.baseScale.z * scaleReduction,
            )
        })
        burst.life++
        if (burst.life > burst.duration) {
            burst.repetition++
            if (burst.repetition >= explosionCount) {
                setFinished(true)
                onFinished?.()
            } else {
                resetBurst(burst, spreadAreaRadius)
            }
        }
    })

    if (finished) return null

    return (
        <Instances
            limit={particleAmount}
            castShadow={false}
            receiveShadow={false}
            frustumCulled={false}
        >
            <planeGeometry args={[particleSize, particleSize]}>
                <instancedBufferAttribute attach='attributes-color' args={[colorArray, 3]} />
            </planeGeometry>
            <meshBasicMaterial side={THREE.DoubleSide} vertexColors />
            {Array.from({ length: particleAmount }, (_, i) => (
                <Instance key={i} ref={el => { meshRefs.current[i] = el as THREE.Object3D | null }} />
            ))}
        </Instances>
    )
}

function ExplosionConfetti({
    position = [0, 0, 0],
    colorsArray = DEFAULT_COLORS,
    numberOfExplosions = 2,
    particleAmount = 100,
    particleSize = 0.2,
    spreadAreaRadius = 5,
    confettiDuration = 75,
    explosionCount = Infinity,
    onComplete,
}: ExplosionConfettiProps) {
    const count = Math.min(particleAmount, MAX_PARTICLES)
    const burstCount = Math.min(numberOfExplosions, MAX_EXPLOSIONS)
    const finishedBursts = useRef(0)
    return (
        <group position={position}>
            {Array.from({ length: burstCount }, (_, i) => (
                <Burst
                    key={i}
                    index={i}
                    colorsArray={colorsArray}
                    particleAmount={count}
                    particleSize={particleSize}
                    spreadAreaRadius={spreadAreaRadius}
                    confettiDuration={confettiDuration}
                    explosionCount={explosionCount}
                    onFinished={() => {
                        finishedBursts.current++
                        if (finishedBursts.current === burstCount) onComplete?.()
                    }}
                />
            ))}
        </group>
    )
}

export default memo(ExplosionConfetti)
