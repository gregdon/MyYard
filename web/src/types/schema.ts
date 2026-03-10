import type { Material } from './materials'
import type { GridSettings, DesignMetadata, HeightOverride, PlacedObject3D } from './design'

export interface DesignFileV1 {
  schemaVersion: 1
  metadata: DesignMetadata
  gridSettings: GridSettings
  grid: Material[][]
  heightOverrides: HeightOverride[]
  placedObjects: PlacedObject3D[]
}

export type DesignFile = DesignFileV1
