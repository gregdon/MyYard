import type { GridIncrement } from './tools'

export interface GridSettings {
  widthFt: number
  heightFt: number
  increment: GridIncrement
}

export interface DesignMetadata {
  name: string
  createdAt: string
  lastModifiedAt: string
  schemaVersion: number
}

export interface PlacedObject3D {
  id: string
  type: string
  name?: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  size: { widthFt: number; depthFt: number; heightFt: number }
  customProps?: Record<string, unknown>
}

export interface HeightOverride {
  row: number
  col: number
  heightFt: number
}

export interface CellCoord {
  row: number
  col: number
}
