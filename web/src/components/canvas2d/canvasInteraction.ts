import type { Viewport } from './gridRenderer'
import type { CellCoord, PlacedObject3D } from '@/types/design'
import { ToolMode } from '@/types/tools'
import type { FillMode, GridIncrement } from '@/types/tools'
import { Material } from '@/types/materials'
import { cellSizeFt } from '@/utils/gridHelpers'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import { rasterizeRect, rasterizeLine, rasterizeEllipse, rasterizePolygon } from '@/utils/shapeRasterizer'

export type InteractionState =
  | { type: 'idle' }
  | { type: 'panning'; startX: number; startY: number; startOffsetX: number; startOffsetY: number }
  | { type: 'painting' }
  | { type: 'drawing_shape'; startCell: CellCoord; currentCell: CellCoord }
  | { type: 'placing_polygon'; vertices: CellCoord[]; currentCell: CellCoord | null }
  | { type: 'dragging_object'; objectId: string; startX: number; startY: number; startPos: [number, number, number] }
  | { type: 'rotating_object'; objectId: string; centerX: number; centerY: number; startAngle: number; origRotation: number }
  | { type: 'marquee_selecting'; startX: number; startY: number; currentX: number; currentY: number }
  | { type: 'dragging_group'; objectIds: string[]; startX: number; startY: number; startPositions: Map<string, [number, number, number]> }

export interface CanvasInteractionManager {
  viewport: Viewport
  state: InteractionState
  hoverCell: CellCoord | null
  previewCells: CellCoord[]
  spaceHeld: boolean
  dirty: boolean
  /** Screen-space marquee rectangle (for rendering) */
  marqueeRect: { x1: number; y1: number; x2: number; y2: number } | null
}

export function createInteractionManager(): CanvasInteractionManager {
  return {
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    state: { type: 'idle' },
    hoverCell: null,
    previewCells: [],
    spaceHeld: false,
    dirty: true,
    marqueeRect: null,
  }
}

const MIN_ZOOM = 0.2
const MAX_ZOOM = 5

export function centerViewport(
  mgr: CanvasInteractionManager,
  rows: number,
  cols: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  // Fit grid to screen with some padding, then center
  const padding = 40
  const availW = canvasWidth - padding * 2
  const availH = canvasHeight - padding * 2
  const baseCell = 20
  const zoomX = availW / (cols * baseCell)
  const zoomY = availH / (rows * baseCell)
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)))

  const cellSize = baseCell * zoom
  const gridW = cols * cellSize
  const gridH = rows * cellSize
  mgr.viewport.zoom = zoom
  mgr.viewport.offsetX = -(canvasWidth - gridW) / 2
  mgr.viewport.offsetY = -(canvasHeight - gridH) / 2
  mgr.dirty = true
}

function cellFromEvent(
  e: { offsetX: number; offsetY: number },
  viewport: Viewport,
): CellCoord {
  const cellSize = 20 * viewport.zoom
  const col = Math.floor((e.offsetX + viewport.offsetX) / cellSize)
  const row = Math.floor((e.offsetY + viewport.offsetY) / cellSize)
  return { row, col }
}

/** Convert mouse event to world coordinates in feet */
function worldFromEvent(
  e: { offsetX: number; offsetY: number },
  viewport: Viewport,
  increment: GridIncrement,
): { worldX: number; worldZ: number } {
  const cellSize = 20 * viewport.zoom
  const cellFt = cellSizeFt(increment)
  const worldX = ((e.offsetX + viewport.offsetX) / cellSize) * cellFt
  const worldZ = ((e.offsetY + viewport.offsetY) / cellSize) * cellFt
  return { worldX, worldZ }
}

/** Hit-test placed objects (reverse order = topmost first) */
function hitTestObjects(
  e: { offsetX: number; offsetY: number },
  viewport: Viewport,
  increment: GridIncrement,
  objects: PlacedObject3D[],
): PlacedObject3D | null {
  const { worldX, worldZ } = worldFromEvent(e, viewport, increment)
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    const ox = obj.position[0]
    const oz = obj.position[2]
    const w = obj.size.widthFt
    const d = obj.size.depthFt
    const angle = obj.rotation[1]

    // Transform click point into the object's local space (rotated around its center)
    const cx = ox + w / 2
    const cz = oz + d / 2
    const dx = worldX - cx
    const dz = worldZ - cz
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const localX = dx * cos - dz * sin + w / 2
    const localZ = dx * sin + dz * cos + d / 2

    if (localX >= 0 && localX <= w && localZ >= 0 && localZ <= d) {
      return obj
    }
  }
  return null
}

/** Get the screen-space position of a rotation handle for a placed object */
export function getRotationHandle(
  obj: PlacedObject3D,
  viewport: Viewport,
  increment: GridIncrement,
): { hx: number; hy: number; cx: number; cy: number } | null {
  const cellSize = 20 * viewport.zoom
  const cellFt = cellSizeFt(increment)

  // Object center in screen coords
  const cx = ((obj.position[0] + obj.size.widthFt / 2) / cellFt) * cellSize - viewport.offsetX
  const cy = ((obj.position[2] + obj.size.depthFt / 2) / cellFt) * cellSize - viewport.offsetY

  // Handle position: above the object, rotated by the object's current rotation
  const handleDist = (Math.max(obj.size.widthFt, obj.size.depthFt) / 2 / cellFt) * cellSize + 20
  const angle = obj.rotation[1] - Math.PI / 2 // -90° so handle starts at top
  const hx = cx + Math.cos(angle) * handleDist
  const hy = cy + Math.sin(angle) * handleDist

  return { hx, hy, cx, cy }
}

/** Hit-test the rotation handle of the currently selected object */
function hitTestRotationHandle(
  e: { offsetX: number; offsetY: number },
  viewport: Viewport,
  increment: GridIncrement,
  objects: PlacedObject3D[],
  selectedId: string | null,
): PlacedObject3D | null {
  if (!selectedId) return null
  const obj = objects.find(o => o.id === selectedId)
  if (!obj) return null

  const prefab = PREFAB_CATALOG.find(p => p.type === obj.type)
  if (!prefab?.rotatable) return null

  const handle = getRotationHandle(obj, viewport, increment)
  if (!handle) return null

  const dx = e.offsetX - handle.hx
  const dy = e.offsetY - handle.hy
  if (dx * dx + dy * dy <= 10 * 10) return obj
  return null
}

/** Find all objects whose axis-aligned bounding box overlaps the given world-space rectangle */
export function objectsInRect(
  x1: number, z1: number, x2: number, z2: number,
  objects: PlacedObject3D[],
): PlacedObject3D[] {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minZ = Math.min(z1, z2)
  const maxZ = Math.max(z1, z2)

  return objects.filter(obj => {
    const ox = obj.position[0]
    const oz = obj.position[2]
    const ow = obj.size.widthFt
    const od = obj.size.depthFt
    // Check AABB overlap
    return ox + ow > minX && ox < maxX && oz + od > minZ && oz < maxZ
  })
}

export function handleWheel(
  mgr: CanvasInteractionManager,
  e: { deltaY: number; offsetX: number; offsetY: number },
) {
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, mgr.viewport.zoom * zoomFactor))

  // Zoom toward cursor (all in logical/CSS pixels)
  const mouseWorldX = e.offsetX + mgr.viewport.offsetX
  const mouseWorldY = e.offsetY + mgr.viewport.offsetY
  const scale = newZoom / mgr.viewport.zoom

  mgr.viewport.offsetX = mouseWorldX * scale - e.offsetX
  mgr.viewport.offsetY = mouseWorldY * scale - e.offsetY
  mgr.viewport.zoom = newZoom
  mgr.dirty = true
}

export function handleMouseDown(
  mgr: CanvasInteractionManager,
  e: { button: number; offsetX: number; offsetY: number; shiftKey: boolean },
  tool: ToolMode,
  activeMaterial: Material,
  fillMode: FillMode,
  rows: number,
  cols: number,
  setCellMaterial: (row: number, col: number, material: Material) => void,
  pushSnapshot: () => void,
  placedObjects: PlacedObject3D[],
  increment: GridIncrement,
  setSelectedObjectId: (id: string | null) => void,
  selectedObjectId: string | null,
  selectedObjectIds: string[],
  setSelectedObjectIds: (ids: string[]) => void,
  toggleObjectSelection: (id: string) => void,
) {
  // Right click, middle click, or space+left = pan
  if (e.button === 2 || e.button === 1 || (e.button === 0 && mgr.spaceHeld)) {
    mgr.state = {
      type: 'panning',
      startX: e.offsetX,
      startY: e.offsetY,
      startOffsetX: mgr.viewport.offsetX,
      startOffsetY: mgr.viewport.offsetY,
    }
    return
  }

  if (e.button !== 0) return

  // Check if clicking on the rotation handle of the selected object
  const rotHit = hitTestRotationHandle(e, mgr.viewport, increment, placedObjects, selectedObjectId)
  if (rotHit) {
    const handle = getRotationHandle(rotHit, mgr.viewport, increment)!
    const startAngle = Math.atan2(e.offsetY - handle.cy, e.offsetX - handle.cx)
    pushSnapshot()
    mgr.state = {
      type: 'rotating_object',
      objectId: rotHit.id,
      centerX: handle.cx,
      centerY: handle.cy,
      startAngle,
      origRotation: rotHit.rotation[1],
    }
    mgr.dirty = true
    return
  }

  // Check if clicking on a placed object
  const hitObj = hitTestObjects(e, mgr.viewport, increment, placedObjects)
  if (hitObj) {
    if (e.shiftKey) {
      // Shift+click toggles object in/out of multi-selection
      toggleObjectSelection(hitObj.id)
    } else if (selectedObjectIds.length > 1 && selectedObjectIds.includes(hitObj.id)) {
      // Clicking an already-selected object in a multi-selection → start group drag
      pushSnapshot()
      const startPositions = new Map<string, [number, number, number]>()
      for (const id of selectedObjectIds) {
        const obj = placedObjects.find(o => o.id === id)
        if (obj) startPositions.set(id, [...obj.position])
      }
      mgr.state = {
        type: 'dragging_group',
        objectIds: [...selectedObjectIds],
        startX: e.offsetX,
        startY: e.offsetY,
        startPositions,
      }
    } else {
      // Normal click — single select + start drag
      setSelectedObjectId(hitObj.id)
      pushSnapshot()
      mgr.state = {
        type: 'dragging_object',
        objectId: hitObj.id,
        startX: e.offsetX,
        startY: e.offsetY,
        startPos: [...hitObj.position],
      }
    }
    mgr.dirty = true
    return
  }

  // Clicked empty area
  if (!e.shiftKey) {
    setSelectedObjectIds([])
  }

  // Pointer tool: start marquee selection on empty space
  if (tool === ToolMode.Pointer) {
    mgr.state = {
      type: 'marquee_selecting',
      startX: e.offsetX,
      startY: e.offsetY,
      currentX: e.offsetX,
      currentY: e.offsetY,
    }
    mgr.marqueeRect = { x1: e.offsetX, y1: e.offsetY, x2: e.offsetX, y2: e.offsetY }
    mgr.dirty = true
    return
  }

  const cell = cellFromEvent(e, mgr.viewport)
  if (cell.row < 0 || cell.row >= rows || cell.col < 0 || cell.col >= cols) return

  if (tool === ToolMode.Brush || tool === ToolMode.Eraser) {
    pushSnapshot()
    const mat = tool === ToolMode.Eraser ? Material.Empty : activeMaterial
    setCellMaterial(cell.row, cell.col, mat)
    mgr.state = { type: 'painting' }
    mgr.dirty = true
  } else if (tool === ToolMode.Polygon) {
    if (mgr.state.type === 'placing_polygon') {
      // Add vertex
      mgr.state.vertices.push(cell)
      mgr.state.currentCell = cell
      mgr.previewCells = rasterizePolygon(
        [...mgr.state.vertices, cell],
        fillMode === 'outline'
      )
    } else {
      pushSnapshot()
      mgr.state = { type: 'placing_polygon', vertices: [cell], currentCell: cell }
      mgr.previewCells = []
    }
    mgr.dirty = true
  } else {
    // Rectangle, Circle, Line — start shape drawing
    pushSnapshot()
    mgr.state = { type: 'drawing_shape', startCell: cell, currentCell: cell }
    mgr.previewCells = [cell]
    mgr.dirty = true
  }
}

export function handleMouseMove(
  mgr: CanvasInteractionManager,
  e: { offsetX: number; offsetY: number },
  tool: ToolMode,
  activeMaterial: Material,
  fillMode: FillMode,
  rows: number,
  cols: number,
  setCellMaterial: (row: number, col: number, material: Material) => void,
  increment: GridIncrement,
  updatePlacedObject: (id: string, updates: Partial<PlacedObject3D>) => void,
) {
  const cell = cellFromEvent(e, mgr.viewport)
  mgr.hoverCell = (cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols) ? cell : null

  if (mgr.state.type === 'panning') {
    const dx = e.offsetX - mgr.state.startX
    const dy = e.offsetY - mgr.state.startY
    mgr.viewport.offsetX = mgr.state.startOffsetX - dx
    mgr.viewport.offsetY = mgr.state.startOffsetY - dy
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'rotating_object') {
    const angle = Math.atan2(e.offsetY - mgr.state.centerY, e.offsetX - mgr.state.centerX)
    const delta = angle - mgr.state.startAngle
    let newRot = mgr.state.origRotation + delta
    // Snap to 15° increments
    const snap = Math.PI / 12 // 15°
    newRot = Math.round(newRot / snap) * snap
    updatePlacedObject(mgr.state.objectId, {
      rotation: [0, newRot, 0],
    })
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'dragging_object') {
    const cellSize = 20 * mgr.viewport.zoom
    const cellFt = cellSizeFt(increment)
    const dx = e.offsetX - mgr.state.startX
    const dy = e.offsetY - mgr.state.startY
    const dxFt = (dx / cellSize) * cellFt
    const dyFt = (dy / cellSize) * cellFt

    // Snap to nearest cell
    const newX = Math.round((mgr.state.startPos[0] + dxFt) / cellFt) * cellFt
    const newZ = Math.round((mgr.state.startPos[2] + dyFt) / cellFt) * cellFt

    updatePlacedObject(mgr.state.objectId, {
      position: [newX, mgr.state.startPos[1], newZ],
    })
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'dragging_group') {
    const cellSize = 20 * mgr.viewport.zoom
    const cellFt = cellSizeFt(increment)
    const dx = e.offsetX - mgr.state.startX
    const dy = e.offsetY - mgr.state.startY
    const dxFt = (dx / cellSize) * cellFt
    const dyFt = (dy / cellSize) * cellFt

    // Snap the delta itself so all objects move by the same grid-aligned amount
    const snapDx = Math.round(dxFt / cellFt) * cellFt
    const snapDz = Math.round(dyFt / cellFt) * cellFt

    for (const id of mgr.state.objectIds) {
      const startPos = mgr.state.startPositions.get(id)
      if (!startPos) continue
      updatePlacedObject(id, {
        position: [startPos[0] + snapDx, startPos[1], startPos[2] + snapDz],
      })
    }
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'marquee_selecting') {
    mgr.state.currentX = e.offsetX
    mgr.state.currentY = e.offsetY
    mgr.marqueeRect = {
      x1: mgr.state.startX,
      y1: mgr.state.startY,
      x2: e.offsetX,
      y2: e.offsetY,
    }
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'painting') {
    if (cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols) {
      const mat = tool === ToolMode.Eraser ? Material.Empty : activeMaterial
      setCellMaterial(cell.row, cell.col, mat)
      mgr.dirty = true
    }
    return
  }

  if (mgr.state.type === 'drawing_shape') {
    mgr.state.currentCell = cell
    const { startCell } = mgr.state
    const outline = fillMode === 'outline'

    if (tool === ToolMode.Rectangle) {
      mgr.previewCells = rasterizeRect(startCell.row, startCell.col, cell.row, cell.col, outline)
    } else if (tool === ToolMode.Circle) {
      mgr.previewCells = rasterizeEllipse(startCell.row, startCell.col, cell.row, cell.col, outline)
    } else if (tool === ToolMode.Line) {
      mgr.previewCells = rasterizeLine(startCell.row, startCell.col, cell.row, cell.col)
    }
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'placing_polygon') {
    mgr.state.currentCell = cell
    if (mgr.state.vertices.length >= 2) {
      mgr.previewCells = rasterizePolygon(
        [...mgr.state.vertices, cell],
        fillMode === 'outline'
      )
    }
    mgr.dirty = true
    return
  }

  // Just hovering
  mgr.dirty = true
}

export function handleMouseUp(
  mgr: CanvasInteractionManager,
  tool: ToolMode,
  activeMaterial: Material,
  _fillMode: FillMode,
  fillCells: (cells: CellCoord[], material: Material) => void,
  placedObjects?: PlacedObject3D[],
  increment?: GridIncrement,
  setSelectedObjectIds?: (ids: string[]) => void,
) {
  if (mgr.state.type === 'panning') {
    mgr.state = { type: 'idle' }
    return
  }

  if (mgr.state.type === 'dragging_object' || mgr.state.type === 'rotating_object') {
    mgr.state = { type: 'idle' }
    return
  }

  if (mgr.state.type === 'dragging_group') {
    mgr.state = { type: 'idle' }
    return
  }

  if (mgr.state.type === 'marquee_selecting') {
    // Convert screen rect to world coords and find enclosed objects
    if (placedObjects && increment && setSelectedObjectIds) {
      const cellSize = 20 * mgr.viewport.zoom
      const cellFt = cellSizeFt(increment)
      const x1 = ((Math.min(mgr.state.startX, mgr.state.currentX) + mgr.viewport.offsetX) / cellSize) * cellFt
      const z1 = ((Math.min(mgr.state.startY, mgr.state.currentY) + mgr.viewport.offsetY) / cellSize) * cellFt
      const x2 = ((Math.max(mgr.state.startX, mgr.state.currentX) + mgr.viewport.offsetX) / cellSize) * cellFt
      const z2 = ((Math.max(mgr.state.startY, mgr.state.currentY) + mgr.viewport.offsetY) / cellSize) * cellFt
      const hits = objectsInRect(x1, z1, x2, z2, placedObjects)
      if (hits.length > 0) {
        setSelectedObjectIds(hits.map(o => o.id))
      }
    }
    mgr.marqueeRect = null
    mgr.state = { type: 'idle' }
    mgr.dirty = true
    return
  }

  if (mgr.state.type === 'painting') {
    mgr.state = { type: 'idle' }
    return
  }

  if (mgr.state.type === 'drawing_shape') {
    if (mgr.previewCells.length > 0) {
      const mat = tool === ToolMode.Eraser ? Material.Empty : activeMaterial
      fillCells(mgr.previewCells, mat)
    }
    mgr.previewCells = []
    mgr.state = { type: 'idle' }
    mgr.dirty = true
    return
  }

  // Polygon stays active (committed on double-click)
}

export function handleDoubleClick(
  mgr: CanvasInteractionManager,
  activeMaterial: Material,
  fillMode: FillMode,
  fillCells: (cells: CellCoord[], material: Material) => void,
) {
  if (mgr.state.type === 'placing_polygon') {
    if (mgr.state.vertices.length >= 3) {
      const cells = rasterizePolygon(mgr.state.vertices, fillMode === 'outline')
      fillCells(cells, activeMaterial)
    }
    mgr.previewCells = []
    mgr.state = { type: 'idle' }
    mgr.dirty = true
  }
}

export function handleKeyDown(mgr: CanvasInteractionManager, key: string) {
  if (key === ' ') {
    mgr.spaceHeld = true
  }
  if (key === 'Escape' && mgr.state.type === 'placing_polygon') {
    mgr.previewCells = []
    mgr.state = { type: 'idle' }
    mgr.dirty = true
  }
}

export function handleKeyUp(mgr: CanvasInteractionManager, key: string) {
  if (key === ' ') {
    mgr.spaceHeld = false
  }
}
