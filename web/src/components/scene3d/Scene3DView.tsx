import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useDesignStore } from '@/store/designStore'
import { cellSizeFt } from '@/utils/gridHelpers'
import { Lighting } from './Lighting'
import { Ground } from './Ground'
import { TerrainMesh } from './TerrainMesh'
import { PrefabRenderer } from './PrefabRenderer'

export function Scene3DView() {
  const gridSettings = useDesignStore((s) => s.gridSettings)
  const cellFt = cellSizeFt(gridSettings.increment)
  const centerX = (gridSettings.widthFt / cellFt) * cellFt / 2
  const centerZ = (gridSettings.heightFt / cellFt) * cellFt / 2
  const dist = Math.max(gridSettings.widthFt, gridSettings.heightFt)

  return (
    <Canvas
      camera={{
        position: [centerX + dist * 0.5, dist * 0.7, centerZ + dist * 0.8],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      shadows
    >
      <Suspense fallback={null}>
        <Lighting />
        <Ground />
        <TerrainMesh />
        <PrefabRenderer />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={300}
          target={[centerX, 0, centerZ]}
        />
      </Suspense>
    </Canvas>
  )
}
