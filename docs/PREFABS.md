# Prefab Widget Catalog

All prefab definitions live in `src/constants/prefabs.ts`. The `PREFAB_CATALOG` array defines every placeable object.

## Categories

4 categories defined in `PREFAB_CATEGORIES`:
- **Structures** — pergola, patio_cover, wall, post, roof, concrete_slab, fence_section, fireplace
- **Cooking & Kitchen** — kitchen_straight, kitchen_l_shaped, grill_builtin_small, grill_builtin_large, smoker
- **Seating & Furniture** — dining_table, chair, club_chair, lounge_set, couch, sectional, end_table, coffee_table
- **Landscaping** — fire_pit, planter_box, tree_small, shrub, flower_bed, retaining_wall

## PrefabDefinition Interface

```typescript
interface PrefabDefinition {
  type: string              // unique ID (e.g., 'pergola')
  label: string             // display name
  category: string          // category ID
  defaultSize: PrefabSize   // { widthFt, depthFt, heightFt }
  minSize: PrefabSize
  maxSize: PrefabSize
  resizable: boolean        // can user drag size sliders?
  rotatable: boolean        // can user rotate in 15° increments?
  color: string             // default hex color
  editableProps?: PropDef[] // custom properties shown in properties panel
}
```

### PropDef Types

| Type | Renders As | Example |
|------|-----------|---------|
| `select` | Button group (flex-wrap) | Shape: Round / Square / Rectangle |
| `number` | Slider + number input | Diameter: 24–96 in |
| `color` | Color picker input | Foliage Color: #2d5a27 |
| `boolean` | Checkbox toggle | Green Egg Stand: on/off |

Number props with "(in)" in the label show a feet conversion display (e.g., "48 in = 4.0 ft").

---

## Complete Widget Reference

### Structures

#### Pergola
- **Default**: 12×10×9 ft | **Min**: 6×6×7 | **Max**: 60×20×12
- **Props**: postShape (square/round), postDiameter (3–8 in), postCount (2–10 per side), color
- **3D**: Corner posts + header beams + slat array across width

#### Patio Cover
- **Default**: 12×10×9 ft | **Min**: 6×6×7 | **Max**: 60×20×12
- **Props**: roofStyle (flat/tilt/gabled), roofPitch (0.5–4 in/ft), postShape, postDiameter, postCount, overhang (0–24 in), color, roofColor
- **3D**: Posts + header beams + rafters + fascia boards + roof panels. Tilt: front-to-back slope. Gabled: ridge peak with two slopes.
- **Note**: Roof pitch is in/ft of run (standard roofing convention). A 15ft deep patio with 1 in/ft pitch drops 15 inches.

#### Wall
- **Default**: 8×8×4 ft | **Min**: 2×0.5×2 | **Max**: 30×30×20
- **Props**: shape (straight/l_shape/u_shape), lSide (left/right), thickness (0.5–3 ft), wallType (brick/stone/wood/stucco/paver), color, windowCount (0–3), windowLayout (spread/centered), windowWall1/2/3 (boolean), hasDoor, doorType (regular/sliding_glass), doorPosition (left/center/right), doorWall (1/2/3), hasTV, tvSize (40/55/65/75")
- **3D**: Extruded wall segments with CSG-style window/door cutouts. Windows distributed in available spans around doors.

#### Post
- **Default**: 0.5×0.5×8 ft | **Resizable**: No
- **Props**: shape (square/round), postSize (3–12 in), postHeight (2–20 ft), color
- **3D**: Cylinder or box geometry. Auto-resizes bounding box when postSize/postHeight change.

#### Roof
- **Default**: 20×14×9 ft | **Min**: 4×4×3 | **Max**: 80×40×20
- **Props**: style (flat/shed/gabled/hip), pitch (1–12 in/ft), overhang (0–24 in), thickness (4–12 in), color

#### Concrete Slab
- **Default**: 10×8×0.33 ft | **Min**: 2×2×0.25 | **Max**: 100×100×1
- **Props**: finish (smooth/textured/stamped), color
- **3D**: Simple box geometry with polygonOffset. Objects placed on slabs auto-elevate.

#### Fence Section
- **Default**: 6×0.5×6 ft | **Min**: 3×0.5×3 | **Max**: 12×0.5×8
- **Props**: None

#### Fireplace
- **Default**: 5×2×4 ft | **Min**: 4×1×3 | **Max**: 12×3×10
- **Props**: openingWidth (40/48/60/72"), openingHeight (8–24 in), openingPosition (left/center/right), hasHearth (bool), hearthHeight (0–24 in), material (stone/brick/stucco/concrete), color

### Cooking & Kitchen

#### Kitchen (Straight)
- **Default**: 8×3×3 ft | **Min**: 2×1.5×1.5 | **Max**: 16×4×3.5
- **Props**: material (stone/brick/stucco/concrete), color, countertopColor, hasEggStand (bool), eggMounting (inset/on_top), eggStandSide (left/right), eggStandWidth (24–48 in), eggStandHeight (12–24 in)
- **3D**: Base cabinet + darker countertop slab + optional egg stand extension

#### Kitchen (L-Shape)
- **Default**: 8×8×3 ft | **Min**: 5×5×3 | **Max**: 14×14×3.5
- **Props**: legWidth (2–4 ft), + same as straight kitchen
- **3D**: L-shaped cabinet with configurable leg width

#### Grill (Small) / Grill (Large)
- **Sizes**: 3×2×3 / 5×3×3.5 | **Resizable**: No
- **3D**: Simple box with darker grill top

#### Smoker / Green Egg
- **Default**: 2.5×2.5×3 ft | **Min**: 1.5×1.5×2.5 | **Max**: 4×4×4
- **Props**: style (egg/barrel), color
- **3D**: Egg = sphere on cylinder base. Barrel = horizontal cylinder on legs.

### Seating & Furniture

#### Dining Table
- **Default**: 6×3×2.5 ft | **Resizable**: No
- **Props**: shape (round/square/rectangle), diameter (36–84 in), tableLength (36–120 in), tableWidth (24–60 in), sideLength (24–72 in), color
- **3D**: Cylindrical top (round) or box top (square/rect) with 4 legs. Auto-resizes based on shape/dimensions.

#### Chair
- **Default**: 2×2×3 ft | **Min**: 1.5×1.5×3 | **Max**: 3×3×3
- **Props**: style (standard/adirondack/rocking), hasArmrests (bool), color
- **3D**: Seat + backrest + optional armrests + leg detail per style

#### Club Chair
- **Default**: 3×3×2.5 ft | **Min**: 2.5×2.5×2 | **Max**: 4×4×3.5
- **Props**: color
- **3D**: Reuses CouchMesh component — cushioned seat + backrest + arms

#### Couch
- **Default**: 7×3×2.5 ft | **Min**: 4×2.5×2 | **Max**: 10×4×3.5
- **Props**: color
- **3D**: Seat cushion + backrest + two arms + legs. Frame color auto-darkened from upholstery color.

#### Sectional
- **Default**: 10×8×2.5 ft | **Min**: 6×6×2 | **Max**: 14×14×3.5
- **Props**: lSide (left/right chaise), color
- **3D**: L-shaped sofa + chaise extension. Chaise side configurable.

#### End Table
- **Default**: 2×2×1.75 ft | **Resizable**: No
- **Props**: shape (round/square/rectangle, default round), diameter (12–30 in), tableLength/tableWidth/sideLength, color
- **3D**: Reuses DiningTableMesh

#### Coffee Table
- **Default**: 4×2×1.33 ft | **Resizable**: No
- **Props**: shape (default rectangle), diameter (24–48 in), tableLength (30–72 in), tableWidth (18–36 in), sideLength (24–48 in), color
- **3D**: Reuses DiningTableMesh

### Landscaping

#### Fire Pit
- **Default**: 4×4×1.5 ft | **Resizable**: No
- **Props**: shape (round/square/rectangle), diameter (24–96 in), sideLength (24–96 in), pitLength/pitWidth (rectangular), pitHeight (6–36 in), color
- **3D**: Above-ground rim with dark interior. Round = cylinder + torus cap. Square = box walls. Auto-resizes based on shape/dimensions.

#### Planter Box
- **Default**: 4×2×2 ft | **Min**: 2×1×1 | **Max**: 10×4×4
- **3D**: Simple box

#### Tree
- **Type**: `tree_small` | **Default**: 3×3×8 ft | **Resizable**: No
- **Props**: treeType (deciduous/evergreen/palm/ornamental), treeSize (small/medium/large), color (foliage)
- **Size presets**: Small 3×3×8, Medium 6×6×15, Large 10×10×25
- **3D by type**:
  - **Deciduous**: Cylinder trunk + sphere foliage
  - **Evergreen**: Trunk + 3 stacked cones (largest at bottom)
  - **Palm**: Tall thin trunk + cluster of elongated ellipsoid fronds
  - **Ornamental**: Smaller sphere foliage + pink flower accent sphere on top

#### Shrub
- **Default**: 3×3×3 ft | **Min**: 1×1×1 | **Max**: 8×8×6
- **Props**: style (round/boxwood/natural), color
- **3D**: Round = sphere. Boxwood = box. Natural = flattened sphere (Y scale 0.7).

#### Flower Bed
- **Default**: 4×2×1.5 ft | **Min**: 1×1×0.5 | **Max**: 12×8×3
- **Props**: style (mixed/roses/grasses/tropical), color (flowers), bedColor (mulch)
- **3D**: Mulch base box + deterministic scatter of plant shapes on top. Shape varies by style (spheres for roses, boxes for grasses, cones for tropical).

#### Retaining Wall
- **Default**: 10×0.33×2 ft | **Resizable**: No (uses inch inputs)
- **Props**: wallLength (24–720 in), wallHeight (6–72 in), wallThickness (4–24 in), material (block/stone/timber/concrete/brick), capStyle (none/flat/bullnose), color
- **3D**: Box geometry + optional cap on top. Auto-resizes bounding box from inch values.

---

## Object Elevation on Slabs

Objects placed on top of a `concrete_slab` are automatically elevated in 3D. The `getBaseY()` function in `PrefabRenderer.tsx` checks if an object's center point falls within any slab's bounds, and if so, wraps it in a `<group position={[0, slabHeight, 0]}>`.

Concrete slabs themselves always render at y=0.

## Adding a New Prefab

1. Add definition to `PREFAB_CATALOG` in `src/constants/prefabs.ts`
2. Add 3D rendering in `renderPrefab()` in `src/components/scene3d/PrefabRenderer.tsx`
3. If non-resizable with custom dimensions: add auto-resize logic in `ObjectPropertiesPanel.tsx`
4. 2D rendering: check `drawPlacedObjects()` in `gridRenderer.ts` — most objects use generic rect/circle fallback. Add special handling only if needed (like L-shaped kitchens).
