# Known Issues & Technical Debt

## Resolved Issues (for reference)

These were encountered and fixed during development:

### Z-Fighting Flicker
- **Symptom**: Gray splotches/flicker when panning 3D camera, especially at base of objects on slabs/terrain
- **Root cause**: GPU depth buffer can't resolve coplanar surfaces (object bottom at same Y as terrain top)
- **Fix**: `polygonOffset` on ground plane (factor=2), terrain (factor=1), and concrete slabs (factor=1)
- **Files**: `Ground.tsx`, `TerrainMesh.tsx`, `PrefabRenderer.tsx`

### Objects on Slabs Rendering at Ground Level
- **Symptom**: Furniture/walls placed on concrete slabs render at y=0 instead of on top of slab
- **Fix**: `getBaseY()` function checks if object center overlaps any slab bounds, wraps in elevation group
- **File**: `PrefabRenderer.tsx`

### Windows Not Rendering with Doors
- **Symptom**: Adding a door to a wall caused windows to disappear
- **Root cause**: Overlap detection margin (0.3ft) was too aggressive
- **Fix**: Compute available spans around doors, distribute windows proportionally within spans

### Patio Cover Pitch Not Visible
- **Symptom**: Roof pitch was set to 12" total, invisible on large patios
- **Fix**: Changed from total-inches to per-foot-of-run (standard roofing convention)

### Fire Pit Not Rendering
- **Symptom**: Fire pit invisible — positioned underground
- **Fix**: Redesigned as above-ground rim with dark interior and cap/lip

### Properties Panel Button Overflow
- **Symptom**: Material buttons (5 options) chopped off at panel edge
- **Fix**: Changed `flex` with `flex-1` children to `flex flex-wrap` without `flex-1`

## Current Limitations

### Authentication
- Mock only — no backend, no persistence
- User ID is randomly generated each session
- Design files saved to local filesystem only (browser download)

### Performance
- Large grids (200×200 at 6in = 400×400 cells) may slow 2D canvas rendering
- Each placed object is a separate draw call in 3D (no batching)
- No level-of-detail for distant objects in 3D

### 3D Rendering
- No texture support — all materials are flat colors
- No ambient occlusion
- Shadow map is fixed size (2048×2048) covering ±100 units

### Grid
- Changing increment (1ft ↔ 6in) only preserves top-left quadrant of design
- No per-cell custom colors (only Material.Custom with a single color)
- Height overrides exist in schema but may not be fully utilized in rendering

### Objects
- No multi-select (can only select/edit one object at a time)
- No alignment/snap-to-other-object features
- Copy/paste offsets by fixed 2ft (no visual placement)
- No object grouping or nesting

### File Format
- Schema v1 only, no migration support yet
- No auto-save or cloud storage
- Grid serialized as 2D string array (could be more compact)
