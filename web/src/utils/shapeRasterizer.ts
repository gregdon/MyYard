import type { CellCoord } from '@/types/design'

export function rasterizeRect(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  outline: boolean
): CellCoord[] {
  const minR = Math.min(r1, r2)
  const maxR = Math.max(r1, r2)
  const minC = Math.min(c1, c2)
  const maxC = Math.max(c1, c2)
  const cells: CellCoord[] = []

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (outline) {
        if (r === minR || r === maxR || c === minC || c === maxC) {
          cells.push({ row: r, col: c })
        }
      } else {
        cells.push({ row: r, col: c })
      }
    }
  }
  return cells
}

export function rasterizeLine(
  r1: number,
  c1: number,
  r2: number,
  c2: number
): CellCoord[] {
  const cells: CellCoord[] = []
  let x0 = c1, y0 = r1, x1 = c2, y1 = r2
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    cells.push({ row: y0, col: x0 })
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
  return cells
}

export function rasterizeEllipse(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  outline: boolean
): CellCoord[] {
  const minR = Math.min(r1, r2)
  const maxR = Math.max(r1, r2)
  const minC = Math.min(c1, c2)
  const maxC = Math.max(c1, c2)

  const cx = (minC + maxC) / 2
  const cy = (minR + maxR) / 2
  const rx = (maxC - minC) / 2
  const ry = (maxR - minR) / 2

  if (rx <= 0 || ry <= 0) return []

  const cells: CellCoord[] = []

  if (outline) {
    // Midpoint ellipse algorithm for border cells
    const borderSet = new Set<string>()
    const addBorderPoint = (r: number, c: number) => {
      const rr = Math.round(r)
      const cc = Math.round(c)
      const key = `${rr},${cc}`
      if (!borderSet.has(key)) {
        borderSet.add(key)
        cells.push({ row: rr, col: cc })
      }
    }

    // Sample points along the ellipse
    const steps = Math.max(Math.ceil(2 * Math.PI * Math.max(rx, ry)), 100)
    for (let i = 0; i <= steps; i++) {
      const angle = (2 * Math.PI * i) / steps
      const pr = cy + ry * Math.sin(angle)
      const pc = cx + rx * Math.cos(angle)
      addBorderPoint(pr, pc)
    }
  } else {
    // Scanline fill for filled ellipse
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const dx = (c + 0.5 - cx) / rx
        const dy = (r + 0.5 - cy) / ry
        if (dx * dx + dy * dy <= 1.0) {
          cells.push({ row: r, col: c })
        }
      }
    }
  }

  return cells
}

export function rasterizePolygon(
  vertices: CellCoord[],
  outline: boolean
): CellCoord[] {
  if (vertices.length < 3) return []

  if (outline) {
    const cells: CellCoord[] = []
    const seen = new Set<string>()
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i]
      const v2 = vertices[(i + 1) % vertices.length]
      const lineCells = rasterizeLine(v1.row, v1.col, v2.row, v2.col)
      for (const cell of lineCells) {
        const key = `${cell.row},${cell.col}`
        if (!seen.has(key)) {
          seen.add(key)
          cells.push(cell)
        }
      }
    }
    return cells
  }

  // Scanline fill
  let minR = Infinity, maxR = -Infinity
  let minC = Infinity, maxC = -Infinity
  for (const v of vertices) {
    minR = Math.min(minR, v.row)
    maxR = Math.max(maxR, v.row)
    minC = Math.min(minC, v.col)
    maxC = Math.max(maxC, v.col)
  }

  const cells: CellCoord[] = []
  for (let r = minR; r <= maxR; r++) {
    const intersections: number[] = []
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i]
      const v2 = vertices[(i + 1) % vertices.length]
      const y1 = v1.row, y2 = v2.row
      const x1 = v1.col, x2 = v2.col

      if ((y1 <= r && y2 > r) || (y2 <= r && y1 > r)) {
        const x = x1 + ((r - y1) / (y2 - y1)) * (x2 - x1)
        intersections.push(x)
      }
    }

    intersections.sort((a, b) => a - b)
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const startC = Math.ceil(intersections[i])
      const endC = Math.floor(intersections[i + 1])
      for (let c = Math.max(startC, minC); c <= Math.min(endC, maxC); c++) {
        cells.push({ row: r, col: c })
      }
    }
  }
  return cells
}
