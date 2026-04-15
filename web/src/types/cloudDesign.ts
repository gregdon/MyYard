import type { HeightOverride, PlacedObject3D } from './design'
import type { Material } from './materials'

/** Metadata for a cloud-persisted design (no canvas data) */
export interface DesignMeta {
  id: string
  userId: string
  name: string
  description: string
  gridWidth: number
  gridHeight: number
  gridIncrement: string
  groundColor: string
  gradeNw: number
  gradeNe: number
  gradeSw: number
  gradeSe: number
  projectId: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

/** Version list entry (no data payload) */
export interface DesignVersionMeta {
  id: string
  designId: string
  versionNumber: number
  autoSave: boolean
  createdAt: string
}

/** The JSONB payload stored in design_versions.data */
export interface DesignVersionData {
  grid: Material[][]
  heightOverrides: HeightOverride[]
  placedObjects: PlacedObject3D[]
}

/** Full design with its version data loaded */
export interface DesignWithData extends DesignMeta {
  versionNumber: number
  versionData: DesignVersionData
}
