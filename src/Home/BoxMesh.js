import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export function BoxMesh(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  const [scale, setScale] = useState(2);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    ref.current.rotation.x += delta / 6;
    ref.current.rotation.y += delta / 6;
    if (clicked && scale > 1) setScale(scale - 0.2);
    if (!clicked && scale < 2) setScale(scale + 0.2);
  });

  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={scale}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial metalness={.8} color={hovered ? "#4980f5" : "#7aa2f8"} />
    </mesh>
  );
}
