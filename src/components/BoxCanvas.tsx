import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type * as THREE from 'three'

function BoxMesh() {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [scale, setScale] = useState(1)

  useFrame((_state, delta) => {
    ref.current.rotation.x += delta / 6
    ref.current.rotation.y += delta / 6
    if (clicked && scale > 1) setScale(scale - 0.2)
    if (!clicked && scale < 2) setScale(scale + 0.2)
  })

  return (
    <mesh
      ref={ref}
      scale={scale}
      onClick={() => setClicked(c => !c)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial metalness={0.8} color={hovered ? '#4980f5' : '#7aa2f8'} />
    </mesh>
  )
}

/** The spinning dodecahedron from the old site's hero. */
export function BoxCanvas() {
  return (
    // the mesh grows to a bounding sphere of radius 2; at z=4 that sphere
    // stays inside the default 75° frustum in every rotation, so the shape
    // is never clipped
    <Canvas camera={{ position: [0, 0, 4] }}>
      {/* three switched to physically-correct lights since the old site;
          decay 0 + higher intensities restore the original look */}
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={2.5} decay={0} />
      <BoxMesh />
    </Canvas>
  )
}
