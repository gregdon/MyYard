# Development Setup

## Prerequisites

- Node.js (v18+)
- npm

## Quick Start

```bash
npm install
npm run dev
```

App runs on `http://localhost:5173` (Vite default).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Build Verification

```bash
npx tsc --noEmit     # Type check without emitting
npm run build        # Full build (includes tsc)
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite plugins (React + Tailwind), path alias `@/` → `src/` |
| `tsconfig.json` | Base TypeScript config with path aliases |
| `tsconfig.app.json` | App-specific TS config (ES2022, strict, react-jsx) |
| `tsconfig.node.json` | Node/build tool TS config |
| `components.json` | shadcn/ui config (New York style, oklch colors, Lucide icons) |
| `eslint.config.js` | ESLint with React Hooks + React Refresh plugins |

## Technology Gotchas

### Tailwind CSS 4
- Uses `@tailwindcss/vite` plugin (NOT PostCSS plugin)
- Colors use oklch format (not hsl)
- Theme defined with `@theme inline` block in `src/index.css`

### shadcn/ui
- Style: New York
- Base color: Neutral (oklch)
- Path aliases MUST be in root `tsconfig.json` (not just `tsconfig.app.json`)
- To add new components: `npx shadcn@latest add <component>`

### Path Aliases
- `@/` resolves to `src/` directory
- Configured in both `tsconfig.json` (for TS) and `vite.config.ts` (for Vite bundler)

### React Three Fiber
- Requires `@react-three/fiber` + `three` + `@types/three`
- `@react-three/drei` provides helpers (OrbitControls, etc.)
- Canvas component creates its own React reconciler — don't mix HTML and R3F JSX

### Zustand
- Uses `subscribeWithSelector` middleware for imperative canvas subscriptions
- Stores are standalone (no Provider needed)
- Import pattern: `useDesignStore((s) => s.fieldName)` for selective subscriptions
