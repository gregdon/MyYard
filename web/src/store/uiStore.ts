import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Material } from '@/types/materials'
import { ToolMode } from '@/types/tools'
import type { ViewMode, FillMode, RightDrawer } from '@/types/tools'
import type { PlacedObject3D } from '@/types/design'

/** Clipboard entry — a snapshot of a placed object (without id/position, assigned on paste) */
export interface ClipboardObject {
  type: string
  rotation: [number, number, number]
  scale: [number, number, number]
  size: { widthFt: number; depthFt: number; heightFt: number }
  customProps?: Record<string, unknown>
}

interface UIState {
  viewMode: ViewMode
  activeTool: ToolMode
  activeMaterial: Material
  fillMode: FillMode
  activeRightDrawer: RightDrawer
  statusMessage: string
  cursorCell: { row: number; col: number } | null
  zoomLevel: number
  customColor: string
  selectedObjectId: string | null
  clipboard: ClipboardObject | null

  setViewMode: (mode: ViewMode) => void
  setActiveTool: (tool: ToolMode) => void
  setActiveMaterial: (material: Material) => void
  setFillMode: (mode: FillMode) => void
  setActiveRightDrawer: (drawer: RightDrawer) => void
  toggleRightDrawer: (drawer: 'help' | 'ai') => void
  setStatusMessage: (msg: string) => void
  setCursorCell: (cell: { row: number; col: number } | null) => void
  setZoomLevel: (zoom: number) => void
  setCustomColor: (color: string) => void
  setSelectedObjectId: (id: string | null) => void
  copyObject: (obj: PlacedObject3D) => void
}

export const useUIStore = create<UIState>()(subscribeWithSelector((set, get) => ({
  viewMode: '2d',
  activeTool: ToolMode.Pointer,
  activeMaterial: Material.GrassLight,
  fillMode: 'fill',
  activeRightDrawer: null,
  statusMessage: '',
  cursorCell: null,
  zoomLevel: 1,
  customColor: '#ff69b4',
  selectedObjectId: null,
  clipboard: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveMaterial: (material) => set({ activeMaterial: material }),
  setFillMode: (mode) => set({ fillMode: mode }),
  setActiveRightDrawer: (drawer) => set({ activeRightDrawer: drawer }),
  toggleRightDrawer: (drawer) => {
    const current = get().activeRightDrawer
    set({ activeRightDrawer: current === drawer ? null : drawer })
  },
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setCursorCell: (cell) => set({ cursorCell: cell }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setCustomColor: (color) => set({ customColor: color }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  copyObject: (obj) => set({
    clipboard: {
      type: obj.type,
      rotation: [...obj.rotation],
      scale: [...obj.scale],
      size: { ...obj.size },
      customProps: obj.customProps ? { ...obj.customProps } : undefined,
    },
  }),
})))
