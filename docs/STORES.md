# Zustand Stores

## Design Store (`src/store/designStore.ts`)

The primary data store for the design.

### State

```typescript
{
  metadata: DesignMetadata          // name, createdAt, lastModifiedAt, schemaVersion
  gridSettings: GridSettings        // widthFt, heightFt, increment ('1ft' | '6in')
  grid: Uint8Array                  // flat row-major array of material indices
  rows: number                      // derived from gridSettings
  cols: number                      // derived from gridSettings
  heightOverrides: HeightOverride[] // per-cell height overrides (sparse)
  placedObjects: PlacedObject3D[]   // all placed 3D objects (furniture, structures, etc.)
  gridVersion: number               // monotonically increasing, triggers re-renders
}
```

### Actions

| Action | Description |
|--------|-------------|
| `newDesign(settings, name)` | Create blank design with given grid dimensions |
| `loadDesign(file)` | Load from DesignFileV1 format |
| `setCellMaterial(row, col, material)` | Paint a single grid cell |
| `fillCells(cells[], material)` | Paint multiple cells at once |
| `fillRect(r1, c1, r2, c2, material)` | Fill rectangular region |
| `setGridSettings(partial)` | Update grid dimensions/increment (resizes grid array) |
| `setMetadata(partial)` | Update design name/timestamps |
| `addPlacedObject(obj)` | Add a 3D widget/object |
| `updatePlacedObject(id, updates)` | Modify object position, size, or customProps |
| `removePlacedObject(id)` | Delete an object |
| `getCellMaterial(row, col)` | Query material at a cell |
| `toDesignFile()` | Export to JSON-serializable DesignFileV1 |
| `getSnapshot()` | Capture current state for undo |
| `restoreSnapshot(snapshot)` | Restore a previous state |

### Notes
- Grid is mutated in place; increment `gridVersion` to trigger UI updates
- Changing `gridSettings.increment` resizes the grid array, preserving the top-left quadrant
- `subscribeWithSelector` middleware enables imperative canvas subscriptions

---

## UI Store (`src/store/uiStore.ts`)

Transient UI state — tool selection, zoom, view mode.

### State

```typescript
{
  viewMode: '2d' | '3d'
  activeTool: ToolMode              // pointer, brush, rectangle, circle, line, polygon, eraser
  activeMaterial: Material          // selected painting material
  fillMode: 'fill' | 'outline'     // shape drawing mode
  activeRightDrawer: 'help' | 'ai' | null
  statusMessage: string
  cursorCell: { row, col } | null
  zoomLevel: number                 // 0.1–10
  customColor: string               // hex for Material.Custom
  selectedObjectId: string | null   // currently selected placed object
  clipboard: ClipboardObject | null // for copy/paste (type, rotation, scale, size, customProps)
}
```

---

## History Store (`src/store/historyStore.ts`)

Undo/redo with snapshot-based approach.

### State

```typescript
{
  undoStack: DesignSnapshot[]   // max 50 entries (MAX_UNDO_DEPTH)
  redoStack: DesignSnapshot[]
}
```

### Actions

| Action | Description |
|--------|-------------|
| `pushSnapshot()` | Save current design state before a destructive action |
| `undo()` | Restore previous snapshot, push current to redo stack |
| `redo()` | Restore next snapshot from redo stack |
| `canUndo()` / `canRedo()` | Check stack availability |
| `clear()` | Reset both stacks (called on design load) |

Snapshots store: grid, gridSettings, heightOverrides, placedObjects.

---

## Auth Store (`src/store/authStore.ts`)

Mock authentication — no real backend.

### State

```typescript
{
  user: User | null           // { id: UUID, name, email }
  isAuthenticated: boolean
}
```

### Actions
- `login(email, password)` — generates random UUID, ignores password
- `register(name, email, password)` — same as login with name
- `logout()` — clears user state
