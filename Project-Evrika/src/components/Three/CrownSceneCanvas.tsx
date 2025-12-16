import type { FC } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

interface CrownSceneCanvasProps {
  crownDisplacement: number
  barDisplacement: number
}

const CrownSceneInner: FC<CrownSceneCanvasProps> = ({
  crownDisplacement,
  barDisplacement,
}) => {
  const crownWaterY = -0.6 + crownDisplacement * 0.6
  const barWaterY = -0.6 + barDisplacement * 0.6

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 4]} intensity={1} />

      {/* Bases */}
      <mesh position={[-1.8, -0.9, 0]}>
        <boxGeometry args={[1.4, 0.2, 1.4]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
      <mesh position={[1.8, -0.9, 0]}>
        <boxGeometry args={[1.4, 0.2, 1.4]} />
        <meshStandardMaterial color="#263238" />
      </mesh>

      {/* Water blocks */}
      <mesh position={[-1.8, crownWaterY, 0]}>
        <boxGeometry args={[1.2, 0.01, 1.2]} />
        <meshStandardMaterial color="#039be5" transparent opacity={0.8} />
      </mesh>
      <mesh position={[1.8, barWaterY, 0]}>
        <boxGeometry args={[1.2, 0.01, 1.2]} />
        <meshStandardMaterial color="#039be5" transparent opacity={0.8} />
      </mesh>

      {/* Crown */}
      <mesh position={[-1.8, 0, 0]}>
        <torusGeometry args={[0.45, 0.18, 16, 32]} />
        <meshStandardMaterial color="#ffca28" />
      </mesh>

      {/* Gold bar */}
      <mesh position={[1.8, 0, 0]}>
        <boxGeometry args={[0.8, 0.25, 0.4]} />
        <meshStandardMaterial color="#ffd54f" />
      </mesh>

      <OrbitControls enablePan={false} minDistance={4} maxDistance={8} />
    </>
  )
}

const CrownSceneCanvas: FC<CrownSceneCanvasProps> = ({
  crownDisplacement,
  barDisplacement,
}) => {
  return (
    <Canvas camera={{ position: [4.5, 3, 6], fov: 45 }}>
      <CrownSceneInner
        crownDisplacement={crownDisplacement}
        barDisplacement={barDisplacement}
      />
    </Canvas>
  )
}

export default CrownSceneCanvas


