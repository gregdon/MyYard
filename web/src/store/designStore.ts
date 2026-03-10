import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Material, MATERIAL_TO_INDEX, INDEX_TO_MATERIAL } from '@/types/materials'
import type { GridSettings, DesignMetadata, HeightOverride, PlacedObject3D, CellCoord } from '@/types/design'
import type { DesignFile } from '@/types/schema'
import { DEFAULT_GRID_SETTINGS } from '@/constants/defaults'
import { gridDimensions, cellIndex, createEmptyGrid } from '@/utils/gridHelpers'

interface DesignState {
  metadata: DesignMetadata
  gridSettings: GridSettings
  grid: Uint8Array
  rows: number
  cols: number
  heightOverrides: HeightOverride[]
  placedObjects: PlacedObject3D[]
  gridVersion: number

  newDesign: (settings: GridSettings, name?: string) => void
  loadDesign: (file: DesignFile) => void
  setCellMaterial: (row: number, col: number, material: Material) => void
  fillCells: (cells: CellCoord[], material: Material) => void
  fillRect: (r1: number, c1: number, r2: number, c2: number, material: Material) => void
  setGridSettings: (settings: Partial<GridSettings>) => void
  setMetadata: (metadata: Partial<DesignMetadata>) => void
  addPlacedObject: (obj: PlacedObject3D) => void
  updatePlacedObject: (id: string, updates: Partial<PlacedObject3D>) => void
  removePlacedObject: (id: string) => void
  getCellMaterial: (row: number, col: number) => Material
  toDesignFile: () => DesignFile
  getSnapshot: () => DesignSnapshot
  restoreSnapshot: (snapshot: DesignSnapshot) => void
}

export interface DesignSnapshot {
  grid: Uint8Array
  gridSettings: GridSettings
  heightOverrides: HeightOverride[]
  placedObjects: PlacedObject3D[]
}

function createInitialGrid(settings: GridSettings): { grid: Uint8Array; rows: number; cols: number } {
  const { rows, cols } = gridDimensions(settings)
  return { grid: createEmptyGrid(rows, cols), rows, cols }
}

const initialSettings = { ...DEFAULT_GRID_SETTINGS }
const { grid: initialGrid, rows: initialRows, cols: initialCols } = createInitialGrid(initialSettings)

export const useDesignStore = create<DesignState>()(
  subscribeWithSelector((set, get) => ({
    metadata: {
      name: 'Untitled Design',
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    gridSettings: initialSettings,
    grid: initialGrid,
    rows: initialRows,
    cols: initialCols,
    heightOverrides: [],
    placedObjects: [],
    gridVersion: 0,

    newDesign: (settings, name = 'Untitled Design') => {
      const { rows, cols } = gridDimensions(settings)
      const grid = createEmptyGrid(rows, cols)
      set({
        metadata: {
          name,
          createdAt: new Date().toISOString(),
          lastModifiedAt: new Date().toISOString(),
          schemaVersion: 1,
        },
        gridSettings: { ...settings },
        grid,
        rows,
        cols,
        heightOverrides: [],
        placedObjects: [],
        gridVersion: get().gridVersion + 1,
      })
    },

    loadDesign: (file) => {
      const { rows, cols } = gridDimensions(file.gridSettings)
      const grid = new Uint8Array(rows * cols)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const mat = file.grid[r]?.[c] ?? Material.Empty
          grid[cellIndex(r, c, cols)] = MATERIAL_TO_INDEX.get(mat) ?? 0
        }
      }
      set({
        metadata: { ...file.metadata },
        gridSettings: { ...file.gridSettings },
        grid,
        rows,
        cols,
        heightOverrides: [...file.heightOverrides],
        placedObjects: file.placedObjects.map(o => ({ ...o })),
        gridVersion: get().gridVersion + 1,
      })
    },

    setCellMaterial: (row, col, material) => {
      const state = get()
      if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return
      const idx = cellIndex(row, col, state.cols)
      const matIdx = MATERIAL_TO_INDEX.get(material) ?? 0
      if (state.grid[idx] === matIdx) return
      state.grid[idx] = matIdx
      set({
        gridVersion: state.gridVersion + 1,
        metadata: { ...state.metadata, lastModifiedAt: new Date().toISOString() },
      })
    },

    fillCells: (cells, material) => {
      const state = get()
      const matIdx = MATERIAL_TO_INDEX.get(material) ?? 0
      let changed = false
      for (const { row, col } of cells) {
        if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) continue
        const idx = cellIndex(row, col, state.cols)
        if (state.grid[idx] !== matIdx) {
          state.grid[idx] = matIdx
          changed = true
        }
      }
      if (changed) {
        set({
          gridVersion: state.gridVersion + 1,
          metadata: { ...state.metadata, lastModifiedAt: new Date().toISOString() },
        })
      }
    },

    fillRect: (r1, c1, r2, c2, material) => {
      const state = get()
      const minR = Math.max(0, Math.min(r1, r2))
      const maxR = Math.min(state.rows - 1, Math.max(r1, r2))
      const minC = Math.max(0, Math.min(c1, c2))
      const maxC = Math.min(state.cols - 1, Math.max(c1, c2))
      const matIdx = MATERIAL_TO_INDEX.get(material) ?? 0
      let changed = false
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const idx = cellIndex(r, c, state.cols)
          if (state.grid[idx] !== matIdx) {
            state.grid[idx] = matIdx
            changed = true
          }
        }
      }
      if (changed) {
        set({
          gridVersion: state.gridVersion + 1,
          metadata: { ...state.metadata, lastModifiedAt: new Date().toISOString() },
        })
      }
    },

    setGridSettings: (partial) => {
      const state = get()
      const newSettings = { ...state.gridSettings, ...partial }
      const { rows: newRows, cols: newCols } = gridDimensions(newSettings)
      if (newRows === state.rows && newCols === state.cols) {
        set({ gridSettings: newSettings })
        return
      }
      const newGrid = createEmptyGrid(newRows, newCols)
      const copyRows = Math.min(state.rows, newRows)
      const copyCols = Math.min(state.cols, newCols)
      for (let r = 0; r < copyRows; r++) {
        for (let c = 0; c < copyCols; c++) {
          newGrid[cellIndex(r, c, newCols)] = state.grid[cellIndex(r, c, state.cols)]
        }
      }
      set({
        gridSettings: newSettings,
        grid: newGrid,
        rows: newRows,
        cols: newCols,
        gridVersion: state.gridVersion + 1,
      })
    },

    setMetadata: (partial) => {
      set((state) => ({
        metadata: { ...state.metadata, ...partial },
      }))
    },

    addPlacedObject: (obj) => {
      set((state) => ({
        placedObjects: [...state.placedObjects, obj],
        gridVersion: state.gridVersion + 1,
      }))
    },

    updatePlacedObject: (id, updates) => {
      set((state) => ({
        placedObjects: state.placedObjects.map(o =>
          o.id === id
            ? {
                ...o,
                ...updates,
                customProps: updates.customProps
                  ? { ...o.customProps, ...updates.customProps }
                  : o.customProps,
              }
            : o
        ),
        gridVersion: state.gridVersion + 1,
      }))
    },

    removePlacedObject: (id) => {
      set((state) => ({
        placedObjects: state.placedObjects.filter(o => o.id !== id),
        gridVersion: state.gridVersion + 1,
      }))
    },

    getCellMaterial: (row, col) => {
      const state = get()
      if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return Material.Empty
      const idx = state.grid[cellIndex(row, col, state.cols)]
      return INDEX_TO_MATERIAL.get(idx) ?? Material.Empty
    },

    toDesignFile: (): DesignFile => {
      const state = get()
      const grid: Material[][] = []
      for (let r = 0; r < state.rows; r++) {
        const row: Material[] = []
        for (let c = 0; c < state.cols; c++) {
          const idx = state.grid[cellIndex(r, c, state.cols)]
          row.push(INDEX_TO_MATERIAL.get(idx) ?? Material.Empty)
        }
        grid.push(row)
      }
      return {
        schemaVersion: 1,
        metadata: { ...state.metadata },
        gridSettings: { ...state.gridSettings },
        grid,
        heightOverrides: [...state.heightOverrides],
        placedObjects: state.placedObjects.map(o => ({ ...o })),
      }
    },

    getSnapshot: (): DesignSnapshot => {
      const state = get()
      return {
        grid: new Uint8Array(state.grid),
        gridSettings: { ...state.gridSettings },
        heightOverrides: state.heightOverrides.map(h => ({ ...h })),
        placedObjects: state.placedObjects.map(o => ({ ...o })),
      }
    },

    restoreSnapshot: (snapshot) => {
      const { rows, cols } = gridDimensions(snapshot.gridSettings)
      set((state) => ({
        grid: snapshot.grid,
        gridSettings: snapshot.gridSettings,
        rows,
        cols,
        heightOverrides: snapshot.heightOverrides,
        placedObjects: snapshot.placedObjects,
        gridVersion: state.gridVersion + 1,
      }))
    },
  }))
)
