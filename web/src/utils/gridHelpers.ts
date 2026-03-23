import type { GridIncrement } from '@/types/tools'
import type { GridSettings } from '@/types/design'

export function cellSizeFt(increment: GridIncrement): number {
  if (increment === '1ft') return 1.0
  if (increment === '6in') return 0.5
  return 0.25 // 3in
}

export function ftToCells(ft: number, increment: GridIncrement): number {
  return Math.round(ft / cellSizeFt(increment))
}

export function gridDimensions(settings: GridSettings): { rows: number; cols: number } {
  const size = cellSizeFt(settings.increment)
  return {
    rows: Math.round(settings.heightFt / size),
    cols: Math.round(settings.widthFt / size),
  }
}

export function cellIndex(row: number, col: number, cols: number): number {
  return row * cols + col
}

export function createEmptyGrid(rows: number, cols: number): Uint8Array {
  return new Uint8Array(rows * cols)
}

export function cloneGrid(grid: Uint8Array): Uint8Array {
  return new Uint8Array(grid)
}

export function pixelToCell(
  px: number,
  py: number,
  viewportX: number,
  viewportY: number,
  cellPixelSize: number
): { row: number; col: number } {
  const col = Math.floor((px + viewportX) / cellPixelSize)
  const row = Math.floor((py + viewportY) / cellPixelSize)
  return { row, col }
}

export function cellToWorld(
  row: number,
  col: number,
  cellSize: number
): { x: number; z: number } {
  return {
    x: col * cellSize,
    z: row * cellSize,
  }
}
