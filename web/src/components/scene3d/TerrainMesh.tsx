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
  const placedObjects = useDesignStore((s) => s.placedObjects)

  const meshes = useMemo(() => {
    const cellFt = cellSizeFt(gridSettings.increment)

    // Build a set of cells occluded by concrete slabs (to prevent z-fighting)
    const slabs = placedObjects.filter((o) => o.type === 'concrete_slab')
    const occluded = new Set<number>()
    for (const slab of slabs) {
      const sx = slab.position[0]
      const sz = slab.position[2]
      const sw = slab.size.widthFt
      const sd = slab.size.depthFt
      // Convert slab bounds to cell indices, with 1-cell margin to eliminate edge z-fighting
      const cStart = Math.floor(sx / cellFt) - 1
      const cEnd = Math.ceil((sx + sw) / cellFt) + 1
      const rStart = Math.floor(sz / cellFt) - 1
      const rEnd = Math.ceil((sz + sd) / cellFt) + 1
      for (let r = rStart; r < rEnd && r < rows; r++) {
        for (let c = cStart; c < cEnd && c < cols; c++) {
          if (r >= 0 && c >= 0) occluded.add(r * cols + c)
        }
      }
    }

    // Group cells by material
    const groups = new Map<Material, { row: number; col: number }[]>()

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const matIdx = grid[r * cols + c]
        const material = INDEX_TO_MATERIAL.get(matIdx) ?? Material.Empty
        if (material === Material.Empty) continue
        // Skip cells under concrete slabs
        if (occluded.has(r * cols + c)) continue

        if (!groups.has(material)) groups.set(material, [])
        groups.get(material)!.push({ row: r, col: c })
      }
    }

    // Build merged geometry per material
    const result: { geometry: THREE.BufferGeometry; color: string; key: string }[] = []

    for (const [material, cells] of groups) {
      const def = MATERIAL_DEFS[material]
      const height = Math.abs(def.heightFt) || 0.02 // min height for flat materials
      const usePlane = !def.sunken && height <= 0.1 // flat materials use PlaneGeometry (no side faces)
      const geometries: THREE.BufferGeometry[] = []

      for (const { row, col } of cells) {
        let geo: THREE.BufferGeometry
        if (usePlane) {
          // PlaneGeometry: no side faces, eliminates z-fighting with ground/slabs
          geo = new THREE.PlaneGeometry(cellFt, cellFt)
          geo.rotateX(-Math.PI / 2) // lay flat
          geo.translate(
            col * cellFt + cellFt / 2,
            0.001, // just above ground plane
            row * cellFt + cellFt / 2,
          )
        } else {
          geo = new THREE.BoxGeometry(cellFt, height, cellFt)
          const yPos = def.sunken ? -height / 2 : height / 2 - 0.02
          geo.translate(
            col * cellFt + cellFt / 2,
            yPos,
            row * cellFt + cellFt / 2,
          )
        }
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
  }, [gridVersion, grid, rows, cols, gridSettings.increment, placedObjects])

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
