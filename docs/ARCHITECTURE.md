# Architecture Overview

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build | Vite | 7.3 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York, oklch) | 4.1 / 3.8 |
| 3D | Three.js + react-three-fiber + drei | 0.182 / 9.5 / 10.7 |
| State | Zustand | 5.0 |
| Routing | React Router | 7.13 |
| Icons | Lucide React | 0.563 |

## Project Structure

```
src/
├── App.tsx                          # BrowserRouter + route definitions
├── main.tsx                         # Entry point (ReactDOM.createRoot)
├── index.css                        # Tailwind 4 theme (oklch vars) + base styles
├── components/
│   ├── auth/                        # LoginPage, RegisterPage, ProtectedRoute, UserMenu
│   ├── canvas2d/                    # 2D HTML5 Canvas editor
│   │   ├── Canvas2DView.tsx         # Main canvas component (imperative rendering)
│   │   ├── gridRenderer.ts          # Pure drawing functions (cells, grid, objects, scrollbars)
│   │   └── canvasInteraction.ts     # Mouse/keyboard state machine + event handlers
│   ├── dialogs/                     # NewDesignDialog, LoadDialog
│   ├── drawers/                     # HelpDrawer, AIAssistantDrawer
│   ├── layout/                      # AppShell, AppHeader, AppFooter, SideNav, RightDrawer
│   ├── pages/                       # DashboardPage, EditorPage
│   ├── scene3d/                     # 3D Three.js scene
│   │   ├── Scene3DView.tsx          # R3F Canvas wrapper + camera + orbit controls
│   │   ├── PrefabRenderer.tsx       # All placed object 3D meshes (~470 lines)
│   │   ├── TerrainMesh.tsx          # Grid cells → merged 3D box geometries
│   │   ├── Lighting.tsx             # Ambient + hemisphere + directional (shadow-mapped)
│   │   └── Ground.tsx               # Infinite grass plane at y=-0.01
│   ├── sidebar/                     # ToolSelector, MaterialPalette, WidgetPalette, ObjectPropertiesPanel
│   ├── toolbar/                     # EditorToolbar, FileMenu, GridSettings, ZoomControls, ViewToggle, UndoRedoControls
│   └── ui/                          # shadcn/ui primitives (accordion, button, dialog, input, toggle, etc.)
├── constants/
│   ├── defaults.ts                  # DEFAULT_GRID_SETTINGS, MAX_GRID_FT (200), MAX_UNDO_DEPTH (50)
│   ├── materials.ts                 # MATERIAL_DEFS — 15 terrain materials with color/height/sunken
│   └── prefabs.ts                   # PREFAB_CATALOG — 27 widget definitions with sizes/props
├── hooks/
│   ├── useDesignIO.ts               # Save (download JSON) / Load (parse + validate)
│   └── useKeyboardShortcuts.ts      # Global keyboard shortcuts (tools, undo, copy/paste, arrows)
├── lib/
│   └── utils.ts                     # cn() — clsx + tailwind-merge helper
├── store/
│   ├── designStore.ts               # Grid + placed objects + metadata (main state)
│   ├── uiStore.ts                   # Tool, material, zoom, selection, clipboard
│   ├── historyStore.ts              # Undo/redo snapshot stacks
│   └── authStore.ts                 # Mock authentication (no backend)
├── types/
│   ├── design.ts                    # GridSettings, PlacedObject3D, HeightOverride, CellCoord
│   ├── materials.ts                 # Material enum, MaterialDefinition, INDEX_TO_MATERIAL map
│   ├── prefabs.ts                   # PrefabDefinition, PrefabSize, PropDef, PropType
│   ├── tools.ts                     # ToolMode, ViewMode, FillMode, GridIncrement
│   ├── auth.ts                      # User interface
│   └── schema.ts                    # DesignFileV1 (JSON serialization format)
└── utils/
    ├── gridHelpers.ts               # Cell/world conversions, grid creation, pixel→cell
    ├── shapeRasterizer.ts           # Bresenham line/rect, midpoint ellipse, scanline polygon
    └── schemaValidator.ts           # JSON schema validation for design files
```

## Routing

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/` | DashboardPage | Yes |
| `/editor/:id?` | EditorPage | Yes |

Protected routes wrap children in `<AppShell>` (header + sidebar + footer).

## Data Flow

```
User Input → Canvas2DView / Scene3DView
                ↓
         canvasInteraction.ts (state machine)
                ↓
         Zustand Stores (designStore, uiStore, historyStore)
                ↓
         gridRenderer.ts (2D) / PrefabRenderer + TerrainMesh (3D)
```

### Key architectural decisions:
- **2D canvas uses imperative rendering** (`requestAnimationFrame`), not React re-renders, for performance
- **3D uses declarative R3F** (React Three Fiber) with JSX mesh components
- **Grid is a flat `Uint8Array`** (row-major) for performance; `gridVersion` counter triggers re-renders
- **Merged geometry** per material type in 3D (single draw call per material)
- **Zustand `subscribeWithSelector`** enables imperative canvas to react to store changes without React
- **2D/3D views toggle** via CSS `display: none` — only one is visible at a time
