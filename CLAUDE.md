# Outdoor Living Designer

## Project Overview
React 19 + TypeScript 5.9 + Vite 7 app for designing outdoor living spaces. Dual-view editor: 2D grid canvas (HTML5 Canvas, imperative rendering) and 3D scene (Three.js via react-three-fiber). State managed by Zustand. Auth + DB + Storage via Supabase. Deployed to Vercel.

## Quick Reference
- `npm run dev` — start dev server (run from `web/`)
- `npx tsc --noEmit` — type check (run after any changes)
- `npm run build` — full production build

## Architecture Rules

### State Management
- 4 Zustand stores: `designStore` (grid + objects), `uiStore` (tools/selection), `historyStore` (undo/redo), `authStore` (Supabase auth)
- Grid is a flat `Uint8Array` (row-major). Mutate in place, increment `gridVersion` to trigger re-renders.
- 2D canvas subscribes imperatively via `subscribeWithSelector` — never use React state for canvas rendering.
- Always call `historyStore.pushSnapshot()` BEFORE any destructive action (paint, move, delete).

### Authentication & Backend (Supabase)
- Supabase Auth with email/password + Google OAuth (redirect flow)
- Auth state managed via `supabase.auth.onAuthStateChange()` in `authStore.initialize()`
- User profiles in `profiles` table with `role` field ('user' | 'admin'), auto-created via DB trigger
- Templates in `templates` table with RLS policies (builtin readable by all, user templates by owner)
- Image uploads to Supabase Storage `templates` and `widgets` buckets
- `ProtectedRoute` guards authenticated routes, redirects unverified emails
- `AdminGuard` checks `user.role === 'admin'` for admin-only routes
- Supabase client in `src/lib/supabase.ts`, env vars in `.env.local` (VITE_SUPABASE_*)

### Rendering
- **2D Canvas** (`canvas2d/`): Pure functions in `gridRenderer.ts`, state machine in `canvasInteraction.ts`. Uses `requestAnimationFrame`.
- **3D Scene** (`scene3d/`): Declarative R3F JSX. `TerrainMesh` merges geometry per material. `PrefabRenderer` dispatches on `obj.type`.
- Always add `polygonOffset` to ground-adjacent materials (terrain, slabs, ground plane) to prevent z-fighting.
- Objects on concrete slabs auto-elevate via `getBaseY()` in `PrefabRenderer.tsx`.

### Adding New Widgets
1. Define in `PREFAB_CATALOG` (`src/constants/prefabs.ts`) — type, sizes, editableProps. Must include `minSize` and `maxSize` even for non-resizable widgets.
2. Add 3D mesh in `renderPrefab()` (`src/components/scene3d/PrefabRenderer.tsx`)
3. If non-resizable with custom dimensions: add auto-resize in `ObjectPropertiesPanel.tsx`
4. 2D: most use generic fallback in `drawPlacedObjects()`. Add special handling only for complex shapes.

### Styling
- Tailwind CSS 4 with `@tailwindcss/vite` plugin (NOT PostCSS)
- shadcn/ui: New York style, oklch colors, Lucide icons
- Path alias: `@/` → `src/`
- For button groups with many options, use `flex flex-wrap gap-1` (no `flex-1`) to prevent overflow

### Conventions
- Measurements: objects use feet internally. Some props use inches with "(in)" in label — convert to feet for bounding box.
- Roof pitch: in/ft of run (standard roofing convention), not total inches.
- Rotation: snaps to 15° increments, stored in radians.
- Object IDs: UUID v4 strings.
- Colors: hex strings in customProps (e.g., `"#8b7355"`).

### Common Gotchas
- `npm create vite@latest .` in current dir gets cancelled — use temp dir then copy
- shadcn v4 needs path aliases in ROOT `tsconfig.json`, not just `tsconfig.app.json`
- Zustand `subscribeWithSelector` needed for imperative canvas — plain `subscribe` won't work
- Don't duplicate `@layer base` blocks — shadcn init may create one
- TerrainMesh uses custom `mergeGeometries()` — not the three.js BufferGeometryUtils version
- Non-resizable prefab entries still require `minSize` and `maxSize` fields (set same as `defaultSize`)

## Documentation
See `docs/INDEX.md` for full documentation covering architecture, stores, grid system, all 30 prefab widgets, rendering pipelines, types, file format, and known issues.
