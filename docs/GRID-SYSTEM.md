# Grid System

## Storage

The grid is stored as a flat `Uint8Array` in row-major order:

```
index = row * cols + col
```

Each byte represents a material index (0–15). The `MATERIAL_TO_INDEX` / `INDEX_TO_MATERIAL` maps in `src/types/materials.ts` handle conversion.

## Increments

| Increment | Cell Size | 50ft grid → cells |
|-----------|-----------|-------------------|
| `'1ft'` | 1.0 ft | 50 × 50 |
| `'6in'` | 0.5 ft | 100 × 100 |

Max grid size: 200 × 200 ft (configurable via `MAX_GRID_FT` in `src/constants/defaults.ts`).

## Coordinate Systems

### Grid Cells (row, col)
- 0-indexed, row-major
- Row increases downward (top to bottom)
- Col increases rightward (left to right)

### Canvas Pixels (px, py)
- `px = col * cellPixelSize * zoom - viewport.offsetX`
- `py = row * cellPixelSize * zoom - viewport.offsetY`
- Base cell pixel size: 20px at zoom=1

### 3D World (x, y, z)
- **X-axis**: left → right (maps to col)
- **Y-axis**: up (elevation)
- **Z-axis**: top → bottom (maps to row)
- `x = col * cellSizeFt`, `z = row * cellSizeFt`
- Objects positioned in feet: `position: [x, y, z]`

## Materials (15 types)

| Material | Index | Color | Height (ft) | Sunken |
|----------|-------|-------|-------------|--------|
| Empty | 0 | #f5f5f5 | 0 | No |
| GrassLight | 1 | #7ec850 | 0 | No |
| GrassDark | 2 | #4a8c2a | 0 | No |
| Pavers | 3 | #c07040 | +0.2 | No |
| Brick | 4 | #8b4513 | +0.2 | No |
| Sand | 5 | #e8d5a3 | 0 | No |
| Concrete | 6 | #b0b0b0 | +0.1 | No |
| StampedConcrete | 7 | #a0a090 | +0.1 | No |
| Posts | 8 | #8b7355 | 0 | No |
| Firepit | 9 | #d44a00 | -0.5 | Yes |
| Water | 10 | #4a90d9 | -1.0 | Yes |
| Deck | 11 | #a0724a | +0.5 | No |
| Gravel | 12 | #c8b898 | +0.05 | No |
| Stone | 13 | #888070 | +0.15 | No |
| Mulch | 14 | #6b4226 | +0.05 | No |
| Custom | 15 | user-defined | 0 | No |

### Height behavior in 3D
- **Raised materials** (Pavers, Deck, etc.): rendered as boxes above y=0 at `y = heightFt / 2`
- **Sunken materials** (Water, Firepit): rendered below y=0 at `y = -heightFt / 2`
- **Minimum height**: 0.02 ft for flat materials (prevents z-fighting)

## Drawing Tools

Tools rasterize shapes into `CellCoord[]` arrays, then commit via `fillCells()`:

| Tool | Algorithm | Fill/Outline |
|------|-----------|--------------|
| Brush | Single cell per move | N/A |
| Rectangle | Bresenham rect | Both |
| Circle/Ellipse | Midpoint ellipse + scanline fill | Both |
| Line | Bresenham line | N/A |
| Polygon | Scanline fill | Both |
| Eraser | Single cell → Empty | N/A |

Shape preview shows semi-transparent overlay before committing on mouse-up (or double-click for polygon).

## Performance

### 2D Canvas
- Imperative rendering via `requestAnimationFrame`
- Only redraws when dirty flag is set
- Culls off-screen cells (visible range calculation)

### 3D TerrainMesh
- Groups cells by material type
- Merges all geometries of same material into single `BufferGeometry`
- One draw call per material type
- Memoized on `gridVersion` + `gridSettings.increment`
- `polygonOffset` on material to avoid z-fighting with objects sitting on terrain
