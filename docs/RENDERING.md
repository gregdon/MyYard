# Rendering Pipeline

## 2D Canvas Rendering

### Component: `Canvas2DView.tsx`

The 2D editor uses HTML5 Canvas with imperative rendering — no React re-renders for drawing.

### Viewport

```typescript
interface Viewport {
  offsetX: number  // pan offset in pixels
  offsetY: number
  zoom: number     // 0.2–5.0
}
```

### Render Pipeline (per frame)

1. **Clear canvas** — full rectangle clear
2. **Draw grid cells** — iterate visible cells, fill with material color
   - Special patterns: Stamped Concrete (diagonal lines), Posts (circles)
3. **Draw grid lines** — 1ft/6in minor lines, 5ft major lines, border
4. **Draw ruler markers** — foot labels along top/left edges
5. **Draw placed objects** — 2D outlines/fills for each PlacedObject3D
6. **Draw shape preview** — semi-transparent cells during active drawing
7. **Draw hover highlight** — blue outline on cell under cursor (non-Pointer tool)
8. **Draw scrollbars** — horizontal/vertical scroll indicators

### Special 2D Object Rendering

| Object Type | 2D Rendering |
|-------------|-------------|
| Wall (L/U shape) | Path-based polygon showing thickness + corners |
| Kitchen (L-shaped) | L-shape with arm layout + egg stand extension |
| Roof | Overhang boundary + inner footprint + ridge/slope indicator |
| Pergola/Patio Cover | Post grid with varying fill opacity |
| Fire Pit | Round/square shape from customProps |
| Windows/Doors/TV | Rendered on wall segments based on customProps |
| Most others | Generic rectangle or circle (based on `customProps.shape`) |

### Dirty Flag System

Canvas only redraws when `dirty = true`. Triggers:
- Grid cell change (material paint)
- Tool/material selection change
- Zoom or pan
- Cursor cell change
- Object placement/move/rotate
- Window resize

---

## 3D Scene Rendering

### Component: `Scene3DView.tsx`

Uses react-three-fiber (R3F) — declarative Three.js via React JSX.

### Scene Setup

```
Canvas (R3F)
├── Lighting
│   ├── ambientLight (0.4 intensity)
│   ├── hemisphereLight (sky #87ceeb / ground #4a7c59, 0.5)
│   └── directionalLight (position [50,80,50], 1.0, shadow-mapped 2048×2048)
├── Ground (500×500 plane at y=-0.01, grass green)
├── TerrainMesh (merged geometry per material)
├── PrefabRenderer (individual meshes per placed object)
└── OrbitControls (pan/rotate/zoom with damping)
```

### TerrainMesh Pipeline

1. Group all grid cells by material type
2. For each material group:
   - Create `BoxGeometry(cellFt, heightFt, cellFt)` per cell
   - Translate to cell's world position
   - Apply height offset (raised = +heightFt/2, sunken = -heightFt/2)
   - Merge all geometries into single `BufferGeometry`
3. Render one `<mesh>` per material with `meshStandardMaterial`
4. `polygonOffset` on all terrain materials (factor=1, units=1)

### PrefabRenderer Pipeline

1. Filter `placedObjects` to find all `concrete_slab` objects
2. For each placed object:
   - Look up `PrefabDefinition` from catalog
   - Compute `baseY` via `getBaseY()` — checks slab overlap
   - Call `renderPrefab()` to generate JSX mesh
   - If `baseY > 0`, wrap in elevation `<group>`
3. `renderPrefab()` dispatches on `obj.type` to type-specific mesh components

### Z-Fighting Prevention

Three layers of `polygonOffset` to prevent flickering:

| Layer | Factor | Units | Component |
|-------|--------|-------|-----------|
| Ground plane | 2 | 2 | Ground.tsx |
| Terrain cells | 1 | 1 | TerrainMesh.tsx |
| Concrete slabs | 1 | 1 | PrefabRenderer.tsx |

Higher factor = rendered further behind. Objects sitting on these surfaces render on top without z-fighting.

### Shadow Configuration

- **Shadow map**: 2048 × 2048 pixels
- **Camera frustum**: ±100 units, far=200
- **Light position**: [50, 80, 50]
- Objects with `castShadow` prop cast shadows
- Ground + terrain have `receiveShadow`

---

## Interaction System

### Component: `canvasInteraction.ts`

State machine managing all 2D canvas interactions.

### States

```typescript
type InteractionState =
  | { type: 'idle' }
  | { type: 'panning'; startX, startY, startOffsetX, startOffsetY }
  | { type: 'painting' }                                    // brush/eraser
  | { type: 'drawing_shape'; startCell, currentCell }        // rect/circle/line
  | { type: 'placing_polygon'; vertices, currentCell }
  | { type: 'dragging_object'; objectId, startX, startY, startPos }
  | { type: 'rotating_object'; objectId, centerX, centerY, startAngle, origRotation }
```

### Mouse Down Resolution

1. Right-click / middle-click / Space+left-click → **Pan**
2. Check rotation handle hit (10px radius circle on selected rotatable object) → **Rotate**
3. Check object hit (rotated AABB in local space) → **Drag** or **Select**
4. Start drawing tool → **Paint/Draw shape/Place polygon**

### Rotation Snapping

Rotation snaps to 15° increments during drag. Computed via:
```
angle = Math.atan2(dy, dx)
snapped = Math.round(angle / (Math.PI / 12)) * (Math.PI / 12)
```

### Object Movement Snapping

Objects snap to nearest cell boundary during drag.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V / B / R / C / L / P / E | Select tool |
| F | Toggle fill/outline mode |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save design |
| Ctrl+C | Copy selected object |
| Ctrl+V | Paste (offset +2ft) |
| Delete / Backspace | Delete selected |
| Arrow keys | Move selected object by 1 grid unit |
| Space (hold) | Enable pan mode |
| Escape | Cancel polygon drawing |
