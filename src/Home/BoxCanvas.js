import { Canvas } from '@react-three/fiber';
import { BoxMesh } from './BoxMesh';


export function BoxCanvas() {

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <BoxMesh position={[0, 0, 0]} />
    </Canvas>
  );
}

