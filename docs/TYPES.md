# Type Definitions

## Design Types (`src/types/design.ts`)

```typescript
interface GridSettings {
  widthFt: number          // grid width in feet
  heightFt: number         // grid height in feet
  increment: '1ft' | '6in' // cell resolution
}

interface DesignMetadata {
  name: string
  createdAt: string        // ISO 8601 timestamp
  lastModifiedAt: string   // ISO 8601 timestamp
  schemaVersion: number    // currently 1
}

interface PlacedObject3D {
  id: string               // UUID
  type: string             // prefab type key (e.g., 'pergola', 'couch')
  position: [number, number, number]  // [x, y, z] in feet
  rotation: [number, number, number]  // Euler angles [pitch, yaw, roll] in radians
  scale: [number, number, number]     // [sx, sy, sz] — usually [1,1,1]
  size: {
    widthFt: number        // bounding box width
    depthFt: number        // bounding box depth
    heightFt: number       // bounding box height
  }
  customProps?: Record<string, unknown>  // prefab-specific properties
}

interface HeightOverride {
  row: number
  col: number
  heightFt: number         // custom elevation for this cell
}

interface CellCoord {
  row: number
  col: number
}
```

## Material Types (`src/types/materials.ts`)

```typescript
// String enum (not TypeScript enum — const object with string values)
const Material = {
  Empty: 'empty',
  GrassLight: 'grass_light',
  GrassDark: 'grass_dark',
  Pavers: 'pavers',
  Brick: 'brick',
  Sand: 'sand',
  Concrete: 'concrete',
  StampedConcrete: 'stamped_concrete',
  Posts: 'posts',
  Firepit: 'firepit',
  Water: 'water',
  Deck: 'deck',
  Gravel: 'gravel',
  Stone: 'stone',
  Mulch: 'mulch',
  Custom: 'custom',
}

interface MaterialDefinition {
  id: Material
  label: string
  color: string        // hex color
  heightFt: number     // elevation (positive = raised, negative = sunken)
  sunken: boolean      // renders below ground plane
}

// Maps for Uint8Array encoding:
// MATERIAL_TO_INDEX: Map<Material, number>
// INDEX_TO_MATERIAL: Map<number, Material>
```

## Prefab Types (`src/types/prefabs.ts`)

```typescript
interface PrefabSize {
  widthFt: number
  depthFt: number
  heightFt: number
}

type PropType = 'select' | 'number' | 'color' | 'boolean'

interface PropDef {
  key: string           // property key in customProps
  label: string         // display label
  type: PropType
  options?: { value: string; label: string }[]  // for 'select' type
  min?: number          // for 'number' type
  max?: number
  step?: number
  defaultValue: unknown
}

interface PrefabDefinition {
  type: string           // unique type ID
  label: string          // display name
  category: string       // one of: 'structures', 'cooking', 'seating', 'landscaping'
  defaultSize: PrefabSize
  minSize: PrefabSize
  maxSize: PrefabSize
  resizable: boolean
  rotatable: boolean
  color: string          // default hex color
  editableProps?: PropDef[]
}
```

## Tool Types (`src/types/tools.ts`)

```typescript
type ToolMode = 'pointer' | 'brush' | 'rectangle' | 'circle' | 'line' | 'polygon' | 'eraser'
type ViewMode = '2d' | '3d'
type FillMode = 'fill' | 'outline'
type GridIncrement = '1ft' | '6in'
type RightDrawer = 'help' | 'ai' | null
```

## Auth Types (`src/types/auth.ts`)

```typescript
interface User {
  id: string      // UUID
  name: string
  email: string
}
```

## Schema Types (`src/types/schema.ts`)

```typescript
interface DesignFileV1 {
  schemaVersion: 1
  metadata: DesignMetadata
  gridSettings: GridSettings
  grid: Material[][]              // 2D array for JSON serialization
  heightOverrides: HeightOverride[]
  placedObjects: PlacedObject3D[]
}
```

**Note**: The grid is stored as a flat `Uint8Array` in memory but serialized as a 2D array of material strings in JSON files.
