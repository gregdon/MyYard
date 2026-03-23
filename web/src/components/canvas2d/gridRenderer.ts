import { Material, INDEX_TO_MATERIAL } from '@/types/materials'
import { MATERIAL_DEFS } from '@/constants/materials'
import type { CellCoord, PlacedObject3D } from '@/types/design'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import { cellSizeFt } from '@/utils/gridHelpers'
import type { GridIncrement } from '@/types/tools'

export interface Viewport {
  offsetX: number
  offsetY: number
  zoom: number
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  rows: number,
  cols: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cellSize = 20 * viewport.zoom

  // Calculate visible cell range
  const startCol = Math.max(0, Math.floor(viewport.offsetX / cellSize))
  const startRow = Math.max(0, Math.floor(viewport.offsetY / cellSize))
  const endCol = Math.min(cols - 1, Math.ceil((viewport.offsetX + canvasWidth) / cellSize))
  const endRow = Math.min(rows - 1, Math.ceil((viewport.offsetY + canvasHeight) / cellSize))

  // Draw cells
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const matIdx = grid[r * cols + c]
      const material = INDEX_TO_MATERIAL.get(matIdx) ?? Material.Empty
      const def = MATERIAL_DEFS[material]

      const x = c * cellSize - viewport.offsetX
      const y = r * cellSize - viewport.offsetY

      ctx.fillStyle = def.color
      ctx.fillRect(x, y, cellSize, cellSize)

      // Stamped concrete pattern
      if (material === Material.StampedConcrete) {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + cellSize, y + cellSize)
        ctx.moveTo(x + cellSize, y)
        ctx.lineTo(x, y + cellSize)
        ctx.stroke()
      }

      // Posts marker
      if (material === Material.Posts) {
        ctx.fillStyle = '#5a4a35'
        ctx.beginPath()
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

export function drawGridLines(
  ctx: CanvasRenderingContext2D,
  rows: number,
  cols: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
  increment: GridIncrement,
) {
  const cellSize = 20 * viewport.zoom
  const cellFt = cellSizeFt(increment)
  const cellsPer5Ft = Math.round(5 / cellFt)

  const startCol = Math.max(0, Math.floor(viewport.offsetX / cellSize))
  const startRow = Math.max(0, Math.floor(viewport.offsetY / cellSize))
  const endCol = Math.min(cols, Math.ceil((viewport.offsetX + canvasWidth) / cellSize))
  const endRow = Math.min(rows, Math.ceil((viewport.offsetY + canvasHeight) / cellSize))

  const gridTop = Math.max(0, startRow * cellSize - viewport.offsetY)
  const gridBottom = Math.min(canvasHeight, rows * cellSize - viewport.offsetY)
  const gridLeft = Math.max(0, startCol * cellSize - viewport.offsetX)
  const gridRight = Math.min(canvasWidth, cols * cellSize - viewport.offsetX)

  // Regular grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 0.5
  ctx.beginPath()

  for (let c = startCol; c <= endCol; c++) {
    if (c % cellsPer5Ft === 0) continue // skip 5' lines, drawn separately
    const x = Math.round(c * cellSize - viewport.offsetX) + 0.5
    ctx.moveTo(x, gridTop)
    ctx.lineTo(x, gridBottom)
  }

  for (let r = startRow; r <= endRow; r++) {
    if (r % cellsPer5Ft === 0) continue
    const y = Math.round(r * cellSize - viewport.offsetY) + 0.5
    ctx.moveTo(gridLeft, y)
    ctx.lineTo(gridRight, y)
  }

  ctx.stroke()

  // 5-foot marker lines (darker, thicker)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()

  for (let c = startCol; c <= endCol; c++) {
    if (c % cellsPer5Ft !== 0) continue
    const x = Math.round(c * cellSize - viewport.offsetX) + 0.5
    ctx.moveTo(x, gridTop)
    ctx.lineTo(x, gridBottom)
  }

  for (let r = startRow; r <= endRow; r++) {
    if (r % cellsPer5Ft !== 0) continue
    const y = Math.round(r * cellSize - viewport.offsetY) + 0.5
    ctx.moveTo(gridLeft, y)
    ctx.lineTo(gridRight, y)
  }

  ctx.stroke()

  // Grid border (solid, prominent)
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = 2
  const bx = -viewport.offsetX
  const by = -viewport.offsetY
  const bw = cols * cellSize
  const bh = rows * cellSize
  ctx.strokeRect(bx, by, bw, bh)
}

export function drawRulerMarkers(
  ctx: CanvasRenderingContext2D,
  rows: number,
  cols: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
  increment: GridIncrement,
) {
  const cellSize = 20 * viewport.zoom
  const cellFt = cellSizeFt(increment)
  const cellsPer5Ft = Math.round(5 / cellFt)

  const startCol = Math.max(0, Math.floor(viewport.offsetX / cellSize))
  const startRow = Math.max(0, Math.floor(viewport.offsetY / cellSize))
  const endCol = Math.min(cols, Math.ceil((viewport.offsetX + canvasWidth) / cellSize))
  const endRow = Math.min(rows, Math.ceil((viewport.offsetY + canvasHeight) / cellSize))

  const fontSize = Math.max(9, Math.min(12, 10 * viewport.zoom))
  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = 'rgba(0,0,0,0.5)'

  const gridTopY = -viewport.offsetY
  const gridLeftX = -viewport.offsetX

  // Top ruler (along columns)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  for (let c = startCol; c <= endCol; c++) {
    if (c % cellsPer5Ft !== 0) continue
    const ft = c * cellFt
    const x = c * cellSize - viewport.offsetX
    const labelY = gridTopY - 4
    if (labelY > -fontSize && labelY < canvasHeight) {
      ctx.fillText(`${ft}'`, x, labelY)
    }
  }

  // Left ruler (along rows)
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let r = startRow; r <= endRow; r++) {
    if (r % cellsPer5Ft !== 0) continue
    const ft = r * cellFt
    const y = r * cellSize - viewport.offsetY
    const labelX = gridLeftX - 4
    if (labelX > -40 && labelX < canvasWidth) {
      ctx.fillText(`${ft}'`, labelX, y)
    }
  }
}

export function drawHoverHighlight(
  ctx: CanvasRenderingContext2D,
  cell: CellCoord | null,
  viewport: Viewport,
) {
  if (!cell) return
  const cellSize = 20 * viewport.zoom
  const x = cell.col * cellSize - viewport.offsetX
  const y = cell.row * cellSize - viewport.offsetY

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
}

export function drawShapePreview(
  ctx: CanvasRenderingContext2D,
  cells: CellCoord[],
  color: string,
  viewport: Viewport,
) {
  const cellSize = 20 * viewport.zoom
  ctx.fillStyle = color + '60' // 60 = ~37% alpha

  for (const { row, col } of cells) {
    const x = col * cellSize - viewport.offsetX
    const y = row * cellSize - viewport.offsetY
    ctx.fillRect(x, y, cellSize, cellSize)
  }
}

export function drawSmoothEllipseOverlay(
  ctx: CanvasRenderingContext2D,
  startCell: CellCoord,
  currentCell: CellCoord,
  color: string,
  viewport: Viewport,
  fillMode: 'fill' | 'outline',
) {
  const cellSize = 20 * viewport.zoom

  // Bounding box in pixel space (cell centers define the ellipse bounds)
  const r1 = Math.min(startCell.row, currentCell.row)
  const r2 = Math.max(startCell.row, currentCell.row)
  const c1 = Math.min(startCell.col, currentCell.col)
  const c2 = Math.max(startCell.col, currentCell.col)

  // Ellipse spans from top-left of first cell to bottom-right of last cell
  const x1 = c1 * cellSize - viewport.offsetX
  const y1 = r1 * cellSize - viewport.offsetY
  const x2 = (c2 + 1) * cellSize - viewport.offsetX
  const y2 = (r2 + 1) * cellSize - viewport.offsetY

  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const rx = (x2 - x1) / 2
  const ry = (y2 - y1) / 2

  if (rx < 1 || ry < 1) return

  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)

  if (fillMode === 'fill') {
    ctx.fillStyle = color + '30'
    ctx.fill()
  }

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

export function drawMarqueeRect(
  ctx: CanvasRenderingContext2D,
  rect: { x1: number; y1: number; x2: number; y2: number },
) {
  const x = Math.min(rect.x1, rect.x2)
  const y = Math.min(rect.y1, rect.y2)
  const w = Math.abs(rect.x2 - rect.x1)
  const h = Math.abs(rect.y2 - rect.y1)

  ctx.save()
  ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 3])
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([])
  ctx.restore()
}

export function drawPlacedObjects(
  ctx: CanvasRenderingContext2D,
  objects: PlacedObject3D[],
  viewport: Viewport,
  increment: GridIncrement,
  selectedObjectId: string | null,
  selectedObjectIds?: string[],
) {
  const cellSize = 20 * viewport.zoom
  const cellFt = cellSizeFt(increment)
  const selectedSet = new Set(selectedObjectIds ?? (selectedObjectId ? [selectedObjectId] : []))

  for (const obj of objects) {
    const prefab = PREFAB_CATALOG.find(p => p.type === obj.type)
    if (!prefab) continue

    const widthPx = (obj.size.widthFt / cellFt) * cellSize
    const depthPx = (obj.size.depthFt / cellFt) * cellSize
    const isSelected = selectedSet.has(obj.id)
    const objColor = (obj.customProps?.color as string) ?? prefab.color
    const strokeColor = isSelected ? '#3b82f6' : objColor

    // Center of the object in screen coords
    const cx = ((obj.position[0] + obj.size.widthFt / 2) / cellFt) * cellSize - viewport.offsetX
    const cy = ((obj.position[2] + obj.size.depthFt / 2) / cellFt) * cellSize - viewport.offsetY

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(obj.rotation[1])

    // Draw relative to center (so -w/2, -h/2)
    const hw = widthPx / 2
    const hd = depthPx / 2

    if (obj.type === 'wall' && (obj.customProps?.shape as string) === 'l_shape') {
      const t = ((obj.customProps?.thickness as number) ?? 1)
      const tPx = (t / cellFt) * cellSize
      const side = (obj.customProps?.lSide as string) ?? 'left'

      ctx.beginPath()
      if (side === 'left') {
        // L-shape: wall along top, leg down left
        ctx.moveTo(-hw, -hd)
        ctx.lineTo(hw, -hd)
        ctx.lineTo(hw, -hd + tPx)
        ctx.lineTo(-hw + tPx, -hd + tPx)
        ctx.lineTo(-hw + tPx, hd)
        ctx.lineTo(-hw, hd)
      } else {
        // L-shape: wall along top, leg down right
        ctx.moveTo(-hw, -hd)
        ctx.lineTo(hw, -hd)
        ctx.lineTo(hw, hd)
        ctx.lineTo(hw - tPx, hd)
        ctx.lineTo(hw - tPx, -hd + tPx)
        ctx.lineTo(-hw, -hd + tPx)
      }
      ctx.closePath()

      ctx.fillStyle = objColor + '60'
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.setLineDash(isSelected ? [] : [4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    } else if (obj.type === 'wall' && (obj.customProps?.shape as string) === 'u_shape') {
      const t = ((obj.customProps?.thickness as number) ?? 1)
      const tPx = (t / cellFt) * cellSize

      // U-shape: left wall down, back wall across bottom, right wall up
      ctx.beginPath()
      ctx.moveTo(-hw, -hd)
      ctx.lineTo(-hw + tPx, -hd)
      ctx.lineTo(-hw + tPx, hd - tPx)
      ctx.lineTo(hw - tPx, hd - tPx)
      ctx.lineTo(hw - tPx, -hd)
      ctx.lineTo(hw, -hd)
      ctx.lineTo(hw, hd)
      ctx.lineTo(-hw, hd)
      ctx.closePath()

      ctx.fillStyle = objColor + '60'
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.setLineDash(isSelected ? [] : [4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    } else if (obj.type === 'kitchen_l_shaped') {
      const legW = ((obj.customProps?.legWidth as number) ?? 3)
      const legPx = (legW / cellFt) * cellSize

      // Draw L-shape as a single path to avoid double-alpha in the corner
      ctx.beginPath()
      ctx.moveTo(-hw, -hd)
      ctx.lineTo(-hw + widthPx, -hd)
      ctx.lineTo(-hw + widthPx, -hd + legPx)
      ctx.lineTo(-hw + legPx, -hd + legPx)
      ctx.lineTo(-hw + legPx, -hd + depthPx)
      ctx.lineTo(-hw, -hd + depthPx)
      ctx.closePath()

      ctx.fillStyle = objColor + '40'
      ctx.fill()

      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.setLineDash(isSelected ? [] : [4, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Egg stand extension for L-shaped kitchen
      const hasLEggStand = (obj.customProps?.hasEggStand as boolean) ?? false
      if (hasLEggStand) {
        const standSide = (obj.customProps?.eggStandSide as string) ?? 'horizontal'
        const standWIn = (obj.customProps?.eggStandWidth as number) ?? 30
        const standWPx = (standWIn / 12 / cellFt) * cellSize

        // Horizontal arm: extends from right end of top arm
        // Vertical arm: extends from bottom of left arm
        let sx: number, standY: number, standH: number
        if (standSide === 'vertical') {
          // Attach to bottom of vertical arm
          sx = -hw
          standY = hd
          standH = standWPx
          // Swap: standWPx becomes height, legPx becomes width
          const tempW = legPx
          ctx.fillStyle = objColor + '30'
          ctx.fillRect(sx, standY, tempW, standH)
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = isSelected ? 2 : 1
          ctx.setLineDash(isSelected ? [] : [4, 4])
          ctx.strokeRect(sx, standY, tempW, standH)
          ctx.setLineDash([])

          // Egg
          const eggMountingV = (obj.customProps?.eggMounting as string) ?? 'inset'
          const eggCxV = sx + tempW / 2
          const eggCyV = standY + standH / 2
          const eggRV = Math.min(tempW, standH) * (eggMountingV === 'on_top' ? 0.38 : 0.3)
          ctx.beginPath()
          ctx.arc(eggCxV, eggCyV, eggRV, 0, Math.PI * 2)
          ctx.fillStyle = eggMountingV === 'on_top' ? '#2d5a27a0' : '#2d5a2780'
          ctx.fill()
          ctx.strokeStyle = eggMountingV === 'on_top' ? '#1a4a1a' : '#2d5a27'
          ctx.lineWidth = eggMountingV === 'on_top' ? 1.5 : 1
          ctx.setLineDash([])
          ctx.stroke()
          if (eggMountingV === 'on_top') {
            ctx.beginPath()
            ctx.arc(eggCxV, eggCyV, eggRV * 0.65, 0, Math.PI * 2)
            ctx.strokeStyle = '#1a4a1a80'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        } else {
          sx = hw
          standY = -hd
          standH = legPx
        ctx.fillStyle = objColor + '30'
        ctx.fillRect(sx, standY, standWPx, standH)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.setLineDash(isSelected ? [] : [4, 4])
        ctx.strokeRect(sx, standY, standWPx, standH)
        ctx.setLineDash([])

        // Egg
        const eggMountingL = (obj.customProps?.eggMounting as string) ?? 'inset'
        const eggCxL = sx + standWPx / 2
        const eggCyL = standY + standH / 2
        if (eggMountingL === 'on_top') {
          const eggR = Math.min(standWPx, standH) * 0.38
          ctx.beginPath()
          ctx.arc(eggCxL, eggCyL, eggR, 0, Math.PI * 2)
          ctx.fillStyle = '#2d5a27' + 'a0'
          ctx.fill()
          ctx.strokeStyle = '#1a4a1a'
          ctx.lineWidth = 1.5
          ctx.setLineDash([])
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(eggCxL, eggCyL, eggR * 0.65, 0, Math.PI * 2)
          ctx.strokeStyle = '#1a4a1a' + '80'
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          const eggR = Math.min(standWPx, standH) * 0.3
          ctx.beginPath()
          ctx.arc(eggCxL, eggCyL, eggR, 0, Math.PI * 2)
          ctx.fillStyle = '#2d5a27' + '80'
          ctx.fill()
          ctx.strokeStyle = '#2d5a27'
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.stroke()
        }
        } // close horizontal else
      }
    } else if (obj.type === 'kitchen_straight') {
      // Main kitchen body
      ctx.fillStyle = objColor + '40'
      ctx.fillRect(-hw, -hd, widthPx, depthPx)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.setLineDash(isSelected ? [] : [4, 4])
      ctx.strokeRect(-hw, -hd, widthPx, depthPx)
      ctx.setLineDash([])

      // Egg stand extension
      const hasEggStand = (obj.customProps?.hasEggStand as boolean) ?? false
      if (hasEggStand) {
        const standSide = (obj.customProps?.eggStandSide as string) ?? 'left'
        const standWIn = (obj.customProps?.eggStandWidth as number) ?? 30
        const standWPx = (standWIn / 12 / cellFt) * cellSize

        const sx = standSide === 'left' ? -hw - standWPx : hw
        ctx.fillStyle = objColor + '30'
        ctx.fillRect(sx, -hd, standWPx, depthPx)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.setLineDash(isSelected ? [] : [4, 4])
        ctx.strokeRect(sx, -hd, standWPx, depthPx)
        ctx.setLineDash([])

        // Draw the egg
        const eggMounting = (obj.customProps?.eggMounting as string) ?? 'inset'
        const eggCx = sx + standWPx / 2
        if (eggMounting === 'on_top') {
          // Full egg: larger circle with lid seam ring
          const eggR = Math.min(standWPx, depthPx) * 0.38
          ctx.beginPath()
          ctx.arc(eggCx, 0, eggR, 0, Math.PI * 2)
          ctx.fillStyle = '#2d5a27' + 'a0'
          ctx.fill()
          ctx.strokeStyle = '#1a4a1a'
          ctx.lineWidth = 1.5
          ctx.setLineDash([])
          ctx.stroke()
          // Inner lid seam
          ctx.beginPath()
          ctx.arc(eggCx, 0, eggR * 0.65, 0, Math.PI * 2)
          ctx.strokeStyle = '#1a4a1a' + '80'
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          // Inset: smaller circle partially in counter
          const eggR = Math.min(standWPx, depthPx) * 0.3
          ctx.beginPath()
          ctx.arc(eggCx, 0, eggR, 0, Math.PI * 2)
          ctx.fillStyle = '#2d5a27' + '80'
          ctx.fill()
          ctx.strokeStyle = '#2d5a27'
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.stroke()
        }
      }
    } else if (obj.type === 'roof') {
      const overhangIn = (obj.customProps?.overhang as number) ?? 12
      const ovhPx = (overhangIn / 12 / cellFt) * cellSize
      const style = (obj.customProps?.style as string) ?? 'flat'

      // Outer boundary (with overhang)
      const ox = -hw - ovhPx
      const oy = -hd - ovhPx
      const ow = widthPx + ovhPx * 2
      const oh = depthPx + ovhPx * 2

      ctx.fillStyle = objColor + '25'
      ctx.fillRect(ox, oy, ow, oh)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.setLineDash(isSelected ? [] : [4, 4])
      ctx.strokeRect(ox, oy, ow, oh)

      // Inner footprint outline (dashed, lighter)
      ctx.strokeStyle = objColor + '60'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.strokeRect(-hw, -hd, widthPx, depthPx)
      ctx.setLineDash([])

      // Ridge line indicator for gabled/hip/shed
      if (style === 'gabled' || style === 'hip') {
        ctx.strokeStyle = objColor + 'a0'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        const ridgeInset = style === 'hip' ? Math.min(ow, oh) / 2 : 0
        ctx.beginPath()
        ctx.moveTo(ox + ridgeInset, 0)
        ctx.lineTo(ox + ow - ridgeInset, 0)
        ctx.stroke()
      } else if (style === 'shed') {
        // Arrow indicating slope direction
        ctx.strokeStyle = objColor + 'a0'
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(0, -hd - ovhPx + 4)
        ctx.lineTo(0, hd + ovhPx - 4)
        ctx.stroke()
        // Arrowhead
        ctx.beginPath()
        ctx.moveTo(-4, hd + ovhPx - 10)
        ctx.lineTo(0, hd + ovhPx - 4)
        ctx.lineTo(4, hd + ovhPx - 10)
        ctx.stroke()
      }
    } else if (obj.type === 'pergola' || obj.type === 'patio_cover') {
      const postPx = Math.max(3, 4 * viewport.zoom)
      const postCount = Math.max(2, (obj.customProps?.postCount as number) ?? 2)
      // Patio cover has solid fill, pergola is transparent
      ctx.fillStyle = obj.type === 'patio_cover' ? objColor + '40' : objColor + '20'
      ctx.fillRect(-hw, -hd, widthPx, depthPx)
      ctx.fillStyle = objColor + '80'
      // Draw posts evenly spaced along width, on front and back edges
      for (let i = 0; i < postCount; i++) {
        const px = postCount === 1
          ? 0
          : -hw + (widthPx - postPx) * (i / (postCount - 1))
        ctx.fillRect(px, -hd, postPx, postPx)             // front edge
        ctx.fillRect(px, hd - postPx, postPx, postPx)     // back edge
      }
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.setLineDash(isSelected ? [] : [4, 4])
      ctx.strokeRect(-hw, -hd, widthPx, depthPx)
      ctx.setLineDash([])
    } else {
      // Check if this object has a round shape (fire pit, dining table, etc.)
      const objShape = obj.customProps?.shape as string | undefined
      const isRound = objShape === 'round'

      if (isRound) {
        const rx = hw
        const ry = hd
        ctx.beginPath()
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
        ctx.fillStyle = objColor + '40'
        ctx.fill()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.setLineDash(isSelected ? [] : [4, 4])
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        ctx.fillStyle = objColor + '40'
        ctx.fillRect(-hw, -hd, widthPx, depthPx)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.setLineDash(isSelected ? [] : [4, 4])
        ctx.strokeRect(-hw, -hd, widthPx, depthPx)
        ctx.setLineDash([])
      }
    }

    // Draw window indicators on walls
    if (obj.type === 'wall') {
      const winCount = (obj.customProps?.windowCount as number) ?? 0
      if (winCount > 0) {
        const shape = (obj.customProps?.shape as string) ?? 'straight'
        const layout = (obj.customProps?.windowLayout as string) ?? 'spread'

        // Helper to draw windows along a line segment
        const drawWins = (x1: number, y1: number, x2: number, y2: number) => {
          const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const winW = Math.min(segLen * 0.15, (segLen * 0.6) / winCount)
          const winH = Math.min(8 * viewport.zoom, segLen * 0.3)

          const positions: number[] = []
          if (layout === 'centered') {
            const gap = winW * 0.2
            const totalSpan = winCount * winW + (winCount - 1) * gap
            const start = (segLen - totalSpan) / 2 + winW / 2
            for (let i = 0; i < winCount; i++) positions.push(start + i * (winW + gap))
          } else {
            const spacing = segLen / (winCount + 1)
            for (let i = 0; i < winCount; i++) positions.push(spacing * (i + 1))
          }

          ctx.save()
          ctx.translate(x1, y1)
          ctx.rotate(angle)
          ctx.fillStyle = 'rgba(135, 206, 235, 0.5)'
          ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)'
          ctx.lineWidth = 1
          ctx.setLineDash([])
          for (const wx of positions) {
            ctx.fillRect(wx - winW / 2, -winH / 2, winW, winH)
            ctx.strokeRect(wx - winW / 2, -winH / 2, winW, winH)
            ctx.beginPath()
            ctx.moveTo(wx, -winH / 2)
            ctx.lineTo(wx, winH / 2)
            ctx.moveTo(wx - winW / 2, 0)
            ctx.lineTo(wx + winW / 2, 0)
            ctx.stroke()
          }
          ctx.restore()
        }

        if (shape === 'straight') {
          drawWins(-hw, 0, hw, 0)
        } else if (shape === 'l_shape') {
          const tPx = (((obj.customProps?.thickness as number) ?? 1) / cellFt) * cellSize
          const side = (obj.customProps?.lSide as string) ?? 'left'
          const win1 = (obj.customProps?.windowWall1 as boolean) ?? true
          const win2 = (obj.customProps?.windowWall2 as boolean) ?? false
          // Wall 1: top wall (along X)
          if (win1) drawWins(-hw, -hd + tPx / 2, hw, -hd + tPx / 2)
          // Wall 2: side leg (along Y/depth)
          if (win2) {
            if (side === 'left') {
              drawWins(-hw + tPx / 2, -hd + tPx, -hw + tPx / 2, hd)
            } else {
              drawWins(hw - tPx / 2, -hd + tPx, hw - tPx / 2, hd)
            }
          }
        } else if (shape === 'u_shape') {
          const tPx = (((obj.customProps?.thickness as number) ?? 1) / cellFt) * cellSize
          const win1 = (obj.customProps?.windowWall1 as boolean) ?? true
          const win2 = (obj.customProps?.windowWall2 as boolean) ?? false
          const win3 = (obj.customProps?.windowWall3 as boolean) ?? false
          // Wall 1: left (along Z/depth)
          if (win1) drawWins(-hw + tPx / 2, -hd, -hw + tPx / 2, hd)
          // Wall 2: back (along X)
          if (win2) drawWins(-hw + tPx, hd - tPx / 2, hw - tPx, hd - tPx / 2)
          // Wall 3: right (along Z/depth)
          if (win3) drawWins(hw - tPx / 2, -hd, hw - tPx / 2, hd)
        }
      }
    }

    // Draw door indicators on walls
    if (obj.type === 'wall') {
      const hasDoor = (obj.customProps?.hasDoor as boolean) ?? false
      if (hasDoor) {
        const shape = (obj.customProps?.shape as string) ?? 'straight'
        const doorType = (obj.customProps?.doorType as string) ?? 'regular'
        const doorPos = (obj.customProps?.doorPosition as string) ?? 'center'
        const doorWall = (obj.customProps?.doorWall as string) ?? '1'
        const doorW = doorType === 'sliding_glass' ? 6 : 3
        const doorWPx = (doorW / cellFt) * cellSize

        // Compute door center X along the wall segment
        const drawDoor = (segStartX: number, segStartY: number, segLen: number, isVertical: boolean) => {
          let doorCX: number
          const margin = doorWPx / 2 + 3
          if (doorPos === 'left') doorCX = margin
          else if (doorPos === 'right') doorCX = segLen - margin
          else doorCX = segLen / 2

          ctx.save()
          ctx.translate(segStartX, segStartY)
          if (isVertical) ctx.rotate(Math.PI / 2)

          if (doorType === 'sliding_glass') {
            // Sliding glass: two overlapping rectangles
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)'
            ctx.fillStyle = 'rgba(135, 206, 235, 0.3)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([])
            const panelW = doorWPx * 0.55
            ctx.fillRect(doorCX - doorWPx / 2, -4, panelW, 8)
            ctx.strokeRect(doorCX - doorWPx / 2, -4, panelW, 8)
            ctx.fillRect(doorCX + doorWPx / 2 - panelW, -4, panelW, 8)
            ctx.strokeRect(doorCX + doorWPx / 2 - panelW, -4, panelW, 8)
          } else {
            // Regular door: rectangle with swing arc
            ctx.fillStyle = 'rgba(139, 69, 19, 0.4)'
            ctx.fillRect(doorCX - doorWPx / 2, -3, doorWPx, 6)
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.7)'
            ctx.lineWidth = 1
            ctx.setLineDash([2, 2])
            ctx.beginPath()
            ctx.arc(doorCX - doorWPx / 2, 0, doorWPx, -Math.PI / 4, 0)
            ctx.stroke()
            ctx.setLineDash([])
          }
          ctx.restore()
        }

        if (shape === 'straight') {
          drawDoor(-hw, 0, widthPx, false)
        } else if (shape === 'l_shape') {
          const tPx = (((obj.customProps?.thickness as number) ?? 1) / cellFt) * cellSize
          const side = (obj.customProps?.lSide as string) ?? 'left'
          if (doorWall === '1') drawDoor(-hw, -hd + tPx / 2, widthPx, false)
          else if (doorWall === '2') {
            if (side === 'left') drawDoor(-hw + tPx / 2, -hd + tPx, depthPx - tPx, true)
            else drawDoor(hw - tPx / 2, -hd + tPx, depthPx - tPx, true)
          }
        } else if (shape === 'u_shape') {
          const tPx = (((obj.customProps?.thickness as number) ?? 1) / cellFt) * cellSize
          if (doorWall === '1') drawDoor(-hw + tPx / 2, -hd, depthPx, true)
          else if (doorWall === '2') drawDoor(-hw + tPx, hd - tPx / 2, widthPx - tPx * 2, false)
          else if (doorWall === '3') drawDoor(hw - tPx / 2, -hd, depthPx, true)
        }
      }
    }

    // Draw TV indicator on walls
    if (obj.type === 'wall') {
      const hasTV = (obj.customProps?.hasTV as boolean) ?? false
      if (hasTV) {
        const tvSizeIn = Number(obj.customProps?.tvSize ?? 55)
        const tvWidths: Record<number, number> = { 40: 2.9, 55: 4.0, 65: 4.75, 75: 5.4 }
        const tvW = (tvWidths[tvSizeIn] ?? 4.0)
        const tvWPx = (tvW / cellFt) * cellSize
        const tvHPx = Math.min(8 * viewport.zoom, tvWPx * 0.4)

        ctx.fillStyle = 'rgba(20, 20, 20, 0.7)'
        ctx.fillRect(-tvWPx / 2, -tvHPx / 2, tvWPx, tvHPx)
        ctx.strokeStyle = 'rgba(60, 60, 60, 0.9)'
        ctx.lineWidth = 1
        ctx.setLineDash([])
        ctx.strokeRect(-tvWPx / 2, -tvHPx / 2, tvWPx, tvHPx)
      }
    }

    // Label — counter-rotate if the object rotation would make text upside down
    const rot = ((obj.rotation[1] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const isUpsideDown = rot > Math.PI / 2 && rot < Math.PI * 1.5
    if (isUpsideDown) {
      ctx.rotate(Math.PI)
    }
    ctx.fillStyle = '#333'
    ctx.font = `${Math.max(10, 11 * viewport.zoom)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(prefab.label, 0, 0)

    ctx.restore()

    // Draw rotation handle for selected rotatable objects (in un-rotated screen space)
    if (isSelected && prefab.rotatable) {
      const handleDist = Math.max(hw, hd) + 20
      const angle = obj.rotation[1] - Math.PI / 2
      const hx = cx + Math.cos(angle) * handleDist
      const hy = cy + Math.sin(angle) * handleDist

      // Stalk line
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.setLineDash([])

      // Handle circle
      ctx.beginPath()
      ctx.arc(hx, hy, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.stroke()

      // Rotation arrow icon inside handle
      ctx.beginPath()
      ctx.arc(hx, hy, 4, -Math.PI * 0.8, Math.PI * 0.5)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

export interface ScrollbarThumb {
  x: number
  y: number
  width: number
  height: number
}

export interface ScrollbarGeometry {
  horizontal: ScrollbarThumb | null
  vertical: ScrollbarThumb | null
  /** Total scrollable width (grid + margins) */
  totalW: number
  /** Total scrollable height (grid + margins) */
  totalH: number
  margin: number
  barPadding: number
  barThickness: number
}

export function getScrollbarGeometry(
  rows: number,
  cols: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
): ScrollbarGeometry {
  const cellSize = 20 * viewport.zoom
  const gridW = cols * cellSize
  const gridH = rows * cellSize

  const margin = 200
  const totalW = gridW + margin * 2
  const totalH = gridH + margin * 2

  const viewLeft = viewport.offsetX + margin
  const viewTop = viewport.offsetY + margin

  const barThickness = 8
  const barPadding = 3
  const minThumbSize = 30

  let horizontal: ScrollbarThumb | null = null
  let vertical: ScrollbarThumb | null = null

  if (totalW > canvasWidth) {
    const trackW = canvasWidth - barPadding * 2
    const thumbW = Math.max(minThumbSize, (canvasWidth / totalW) * trackW)
    const scrollRange = totalW - canvasWidth
    const ratio = Math.max(0, Math.min(1, viewLeft / scrollRange))
    horizontal = {
      x: barPadding + ratio * (trackW - thumbW),
      y: canvasHeight - barThickness - barPadding,
      width: thumbW,
      height: barThickness,
    }
  }

  if (totalH > canvasHeight) {
    const trackH = canvasHeight - barPadding * 2
    const thumbH = Math.max(minThumbSize, (canvasHeight / totalH) * trackH)
    const scrollRange = totalH - canvasHeight
    const ratio = Math.max(0, Math.min(1, viewTop / scrollRange))
    vertical = {
      x: canvasWidth - barThickness - barPadding,
      y: barPadding + ratio * (trackH - thumbH),
      width: barThickness,
      height: thumbH,
    }
  }

  return { horizontal, vertical, totalW, totalH, margin, barPadding, barThickness }
}

export function drawScrollbars(
  ctx: CanvasRenderingContext2D,
  rows: number,
  cols: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
) {
  const geo = getScrollbarGeometry(rows, cols, viewport, canvasWidth, canvasHeight)

  if (geo.horizontal) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.roundRect(geo.horizontal.x, geo.horizontal.y, geo.horizontal.width, geo.horizontal.height, geo.barThickness / 2)
    ctx.fill()
  }

  if (geo.vertical) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.roundRect(geo.vertical.x, geo.vertical.y, geo.vertical.width, geo.vertical.height, geo.barThickness / 2)
    ctx.fill()
  }
}
