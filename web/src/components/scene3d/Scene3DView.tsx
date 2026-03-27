import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useDesignStore } from '@/store/designStore'
import { cellSizeFt } from '@/utils/gridHelpers'
import { Lighting } from './Lighting'
import { Ground } from './Ground'
import { TerrainMesh } from './TerrainMesh'
import { PrefabRenderer } from './PrefabRenderer'

/** Exposes the gl context so external code can capture screenshots via custom event */
function ScreenshotBridge() {
  const { gl } = useThree()
  useEffect(() => {
    const handler = () => {
      const dataUrl = gl.domElement.toDataURL('image/png')
      window.dispatchEvent(new CustomEvent('screenshot-result', { detail: dataUrl }))
    }
    window.addEventListener('screenshot-capture', handler)
    return () => window.removeEventListener('screenshot-capture', handler)
  }, [gl])
  return null
}

/** Capture a screenshot from the 3D canvas. Returns a data URL. */
export function capture3DScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('screenshot-result', handler)
      reject(new Error('Screenshot capture timed out — is the 3D view active?'))
    }, 3000)

    const handler = (e: Event) => {
      clearTimeout(timeout)
      window.removeEventListener('screenshot-result', handler)
      resolve((e as CustomEvent).detail as string)
    }
    window.addEventListener('screenshot-result', handler)
    window.dispatchEvent(new Event('screenshot-capture'))
  })
}

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
        <Ground widthFt={gridSettings.widthFt} heightFt={gridSettings.heightFt} />
        <TerrainMesh />
        <PrefabRenderer />
        <ScreenshotBridge />
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
