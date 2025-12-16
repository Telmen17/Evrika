import type { FC } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

interface BathSceneCanvasProps {
  waterLevel: number
}

const BathSceneInner: FC<BathSceneCanvasProps> = ({ waterLevel }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 4]} intensity={0.9} />

      {/* Bath tub */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[6, 1, 3]} />
        <meshStandardMaterial color="#263238" />
      </mesh>

      {/* Water plane – waterLevel is 0..1 mapped to height */}
      <mesh position={[0, -0.5 + waterLevel * 0.8, 0]}>
        <boxGeometry args={[5.6, 0.01, 2.6]} />
        <meshStandardMaterial color="#039be5" transparent opacity={0.75} />
      </mesh>

      {/* Simple object placeholder above water */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#ffca28" />
      </mesh>

      <OrbitControls enablePan={false} minDistance={5} maxDistance={10} />
    </>
  )
}

const BathSceneCanvas: FC<BathSceneCanvasProps> = ({ waterLevel }) => {
  return (
    <Canvas camera={{ position: [6, 4, 6], fov: 40 }}>
      <BathSceneInner waterLevel={waterLevel} />
    </Canvas>
  )
}

export default BathSceneCanvas


