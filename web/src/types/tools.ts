export const ToolMode = {
  Pointer: 'pointer',
  Brush: 'brush',
  Rectangle: 'rectangle',
  Circle: 'circle',
  Line: 'line',
  Polygon: 'polygon',
  Eraser: 'eraser',
} as const

export type ToolMode = (typeof ToolMode)[keyof typeof ToolMode]

export type ViewMode = '2d' | '3d'

export type FillMode = 'fill' | 'outline'

export type GridIncrement = '1ft' | '6in'

export type RightDrawer = 'help' | 'ai' | null
