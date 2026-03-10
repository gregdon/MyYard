import { useMemo } from 'react'
import * as THREE from 'three'
import { useDesignStore } from '@/store/designStore'
import { INDEX_TO_MATERIAL, Material } from '@/types/materials'
import { MATERIAL_DEFS } from '@/constants/materials'
import { cellSizeFt } from '@/utils/gridHelpers'

export function TerrainMesh() {
  const grid = useDesignStore((s) => s.grid)
  const rows = useDesignStore((s) => s.rows)
  const cols = useDesignStore((s) => s.cols)
  const gridSettings = useDesignStore((s) => s.gridSettings)
  const gridVersion = useDesignStore((s) => s.gridVersion)

  const meshes = useMemo(() => {
    const cellFt = cellSizeFt(gridSettings.increment)

    // Group cells by material
    const groups = new Map<Material, { row: number; col: number }[]>()

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const matIdx = grid[r * cols + c]
        const material = INDEX_TO_MATERIAL.get(matIdx) ?? Material.Empty
        if (material === Material.Empty) continue

        if (!groups.has(material)) groups.set(material, [])
        groups.get(material)!.push({ row: r, col: c })
      }
    }

    // Build merged geometry per material
    const result: { geometry: THREE.BufferGeometry; color: string; key: string }[] = []

    for (const [material, cells] of groups) {
      const def = MATERIAL_DEFS[material]
      const height = Math.abs(def.heightFt) || 0.02 // min height for flat materials
      const geometries: THREE.BoxGeometry[] = []

      for (const { row, col } of cells) {
        const geo = new THREE.BoxGeometry(cellFt, height, cellFt)
        const yPos = def.sunken ? -height / 2 : height / 2
        geo.translate(
          col * cellFt + cellFt / 2,
          yPos,
          row * cellFt + cellFt / 2,
        )
        geometries.push(geo)
      }

      if (geometries.length > 0) {
        const merged = mergeGeometries(geometries)
        if (merged) {
          result.push({
            geometry: merged,
            color: def.color,
            key: `${material}-${gridVersion}`,
          })
        }
        // Dispose individual geometries
        geometries.forEach((g) => g.dispose())
      }
    }

    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridVersion, grid, rows, cols, gridSettings.increment])

  return (
    <>
      {meshes.map(({ geometry, color, key }) => (
        <mesh key={key} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color={color} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}
    </>
  )
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null
  if (geometries.length === 1) return geometries[0].clone()

  let totalVertices = 0
  let totalIndices = 0

  for (const geo of geometries) {
    totalVertices += geo.getAttribute('position').count
    totalIndices += geo.index ? geo.index.count : 0
  }

  const positions = new Float32Array(totalVertices * 3)
  const normals = new Float32Array(totalVertices * 3)
  const indices = new Uint32Array(totalIndices)

  let vertexOffset = 0
  let indexOffset = 0
  let vertexCount = 0

  for (const geo of geometries) {
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute
    const idx = geo.index

    positions.set(new Float32Array(posAttr.array), vertexOffset * 3)
    normals.set(new Float32Array(normAttr.array), vertexOffset * 3)

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices[indexOffset + i] = idx.getX(i) + vertexCount
      }
      indexOffset += idx.count
    }

    vertexCount += posAttr.count
    vertexOffset += posAttr.count
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setIndex(new THREE.BufferAttribute(indices, 1))

  return merged
}
