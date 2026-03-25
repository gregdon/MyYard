import * as THREE from 'three'
import { useDesignStore } from '@/store/designStore'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import type { PlacedObject3D } from '@/types/design'
import { renderPrefab } from './prefabs'

export function PrefabRenderer() {
  const placedObjects = useDesignStore((s) => s.placedObjects)
  useDesignStore((s) => s.gridVersion) // trigger re-render on changes

  // Pre-compute elevation: objects on top of slabs should be lifted
  const slabs = placedObjects.filter((o) => o.type === 'concrete_slab')

  function getBaseY(obj: PlacedObject3D): number {
    if (obj.type === 'concrete_slab') return 0 // slabs sit on ground
    const cx = obj.position[0] + obj.size.widthFt / 2
    const cz = obj.position[2] + obj.size.depthFt / 2
    let maxY = 0
    for (const slab of slabs) {
      const sl = slab.position[0]
      const sr = sl + slab.size.widthFt
      const st = slab.position[2]
      const sb = st + slab.size.depthFt
      if (cx > sl && cx < sr && cz > st && cz < sb) {
        maxY = Math.max(maxY, slab.size.heightFt)
      }
    }
    return maxY
  }

  return (
    <>
      {placedObjects.map((obj) => {
        const prefab = PREFAB_CATALOG.find((p) => p.type === obj.type)
        if (!prefab) return null

        const { widthFt, depthFt, heightFt } = obj.size
        const color = new THREE.Color(prefab.color)
        const baseY = getBaseY(obj)

        const el = renderPrefab(obj, prefab, widthFt, depthFt, heightFt, color)
        if (!el) return null

        // Lift objects that sit on top of a slab
        if (baseY > 0) {
          return <group key={`elev-${obj.id}`} position={[0, baseY, 0]}>{el}</group>
        }
        return el
      })}
    </>
  )
}
