import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useDesignStore } from './designStore'
import type { DesignSnapshot } from './designStore'
import { useHistoryStore } from './historyStore'
import { useUIStore } from './uiStore'
import { Material } from '@/types/materials'
import { ToolMode } from '@/types/tools'
import type { ViewMode, FillMode } from '@/types/tools'
import type { DesignMetadata, PlacedObject3D } from '@/types/design'
import type { DesignFile } from '@/types/schema'
import { DEFAULT_GRID_SETTINGS } from '@/constants/defaults'

// ── Types ───────────────────────────────────────────────────────────

export type TabType = 'start' | 'design' | 'template-edit'

export interface PerTabUIState {
  viewMode: ViewMode
  activeTool: ToolMode
  activeMaterial: Material
  fillMode: FillMode
  zoomLevel: number
  selectedObjectId: string | null
  selectedObjectIds: string[]
  editingTemplateId: string | null
}

export interface TabDescriptor {
  id: string
  type: TabType
  title: string
  isDirty: boolean
  // Serialized state for inactive tabs (null = active tab, state lives in live stores)
  designSnapshot: DesignSnapshot | null
  metadata: DesignMetadata | null
  historySnapshot: { undoStack: DesignSnapshot[]; redoStack: DesignSnapshot[] } | null
  uiSnapshot: PerTabUIState | null
  // Template editing
  templateId?: string
  cleanSnapshot?: DesignSnapshot
}

interface TabState {
  tabs: TabDescriptor[]
  activeTabId: string | null

  // Tab lifecycle
  openStartTab: () => void
  openDesignTab: (designFile?: DesignFile, title?: string) => string
  openTemplateEditTab: (templateId: string, objects: PlacedObject3D[], title: string) => string
  openNewTemplateTab: () => string
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void

  // State management
  setTabDirty: (tabId: string, dirty: boolean) => void
  setTabTitle: (tabId: string, title: string) => void
  getActiveTab: () => TabDescriptor | null
  markActiveSaved: () => void
}

// ── Helpers ─────────────────────────────────────────────────────────

const DEFAULT_PER_TAB_UI: PerTabUIState = {
  viewMode: '2d',
  activeTool: ToolMode.Pointer,
  activeMaterial: Material.GrassLight,
  fillMode: 'fill',
  zoomLevel: 1,
  selectedObjectId: null,
  selectedObjectIds: [],
  editingTemplateId: null,
}

/** Capture per-tab UI fields from the live uiStore */
function captureUISnapshot(): PerTabUIState {
  const ui = useUIStore.getState()
  return {
    viewMode: ui.viewMode,
    activeTool: ui.activeTool,
    activeMaterial: ui.activeMaterial,
    fillMode: ui.fillMode,
    zoomLevel: ui.zoomLevel,
    selectedObjectId: ui.selectedObjectId,
    selectedObjectIds: [...ui.selectedObjectIds],
    editingTemplateId: ui.editingTemplateId,
  }
}

/** Restore per-tab UI fields into the live uiStore */
function restoreUISnapshot(snap: PerTabUIState) {
  const ui = useUIStore.getState()
  ui.setViewMode(snap.viewMode)
  ui.setActiveTool(snap.activeTool)
  ui.setActiveMaterial(snap.activeMaterial)
  ui.setFillMode(snap.fillMode)
  ui.setZoomLevel(snap.zoomLevel)
  ui.setSelectedObjectIds(snap.selectedObjectIds)
  ui.setEditingTemplateId(snap.editingTemplateId)
}

/** Snapshot the active design tab's state from live stores */
function snapshotActiveDesignTab(): {
  designSnapshot: DesignSnapshot
  metadata: DesignMetadata
  historySnapshot: { undoStack: DesignSnapshot[]; redoStack: DesignSnapshot[] }
  uiSnapshot: PerTabUIState
} {
  const ds = useDesignStore.getState()
  const hs = useHistoryStore.getState()
  return {
    designSnapshot: ds.getSnapshot(),
    metadata: { ...ds.metadata },
    historySnapshot: {
      undoStack: [...hs.undoStack],
      redoStack: [...hs.redoStack],
    },
    uiSnapshot: captureUISnapshot(),
  }
}

/** Restore a tab's serialized state into the live stores */
function restoreTabState(tab: TabDescriptor) {
  if (tab.designSnapshot) {
    useDesignStore.getState().restoreSnapshot(tab.designSnapshot)
  }
  if (tab.metadata) {
    useDesignStore.getState().setMetadata(tab.metadata)
  }
  if (tab.historySnapshot) {
    useHistoryStore.setState({
      undoStack: tab.historySnapshot.undoStack,
      redoStack: tab.historySnapshot.redoStack,
    })
  } else {
    useHistoryStore.getState().clear()
  }
  if (tab.uiSnapshot) {
    restoreUISnapshot(tab.uiSnapshot)
  } else {
    restoreUISnapshot(DEFAULT_PER_TAB_UI)
  }
}

// ── Store ───────────────────────────────────────────────────────────

export const useTabStore = create<TabState>()(subscribeWithSelector((set, get) => ({
  tabs: [],
  activeTabId: null,

  openStartTab: () => {
    const state = get()
    // If Start tab already exists, just switch to it
    const existing = state.tabs.find(t => t.type === 'start')
    if (existing) {
      get().switchTab(existing.id)
      return
    }

    const tab: TabDescriptor = {
      id: 'start',
      type: 'start',
      title: 'Start',
      isDirty: false,
      designSnapshot: null,
      metadata: null,
      historySnapshot: null,
      uiSnapshot: null,
    }

    // Start tab always sorts to position 0
    set({ tabs: [tab, ...state.tabs] })

    // If no active tab, make Start active
    if (!state.activeTabId) {
      set({ activeTabId: tab.id })
    }
  },

  openDesignTab: (designFile, title) => {
    const state = get()
    const id = crypto.randomUUID()

    // Snapshot current active tab if it's a design/template tab
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    if (activeTab && (activeTab.type === 'design' || activeTab.type === 'template-edit')) {
      const snap = snapshotActiveDesignTab()
      const updatedTabs = state.tabs.map(t =>
        t.id === activeTab.id
          ? { ...t, ...snap }
          : t
      )
      set({ tabs: updatedTabs })
    }

    // Create new design in live stores
    if (designFile) {
      useDesignStore.getState().loadDesign(designFile)
    } else {
      useDesignStore.getState().newDesign(DEFAULT_GRID_SETTINGS, title ?? 'Untitled Project')
    }
    useHistoryStore.getState().clear()
    restoreUISnapshot(DEFAULT_PER_TAB_UI)

    const tab: TabDescriptor = {
      id,
      type: 'design',
      title: title ?? designFile?.metadata?.name ?? 'Untitled Project',
      isDirty: false,
      // Active tab: state lives in live stores
      designSnapshot: null,
      metadata: null,
      historySnapshot: null,
      uiSnapshot: null,
    }

    // Always append new tabs at the end
    const tabs = [...get().tabs, tab] // re-read after potential snapshot update

    console.log('[tabStore] openDesignTab:', { id, title: tab.title, tabCount: tabs.length })
    set({ tabs, activeTabId: id })
    return id
  },

  openTemplateEditTab: (templateId, objects, title) => {
    const state = get()
    const id = crypto.randomUUID()

    // Snapshot current active tab
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    if (activeTab && (activeTab.type === 'design' || activeTab.type === 'template-edit')) {
      const snap = snapshotActiveDesignTab()
      const updatedTabs = state.tabs.map(t =>
        t.id === activeTab.id ? { ...t, ...snap } : t
      )
      set({ tabs: updatedTabs })
    }

    // Set up a fresh design with just the template objects
    useDesignStore.getState().newDesign(DEFAULT_GRID_SETTINGS, title)
    for (const obj of objects) {
      useDesignStore.getState().addPlacedObject(obj)
    }
    useHistoryStore.getState().clear()
    const cleanSnapshot = useDesignStore.getState().getSnapshot()

    restoreUISnapshot({
      ...DEFAULT_PER_TAB_UI,
      editingTemplateId: templateId,
      selectedObjectIds: objects.map(o => o.id),
      selectedObjectId: objects[0]?.id ?? null,
    })

    const tab: TabDescriptor = {
      id,
      type: 'template-edit',
      title: `Template: ${title}`,
      isDirty: false,
      designSnapshot: null,
      metadata: null,
      historySnapshot: null,
      uiSnapshot: null,
      templateId,
      cleanSnapshot,
    }

    const tabs = [...get().tabs]
    tabs.push(tab)
    set({ tabs, activeTabId: id })
    return id
  },

  openNewTemplateTab: () => {
    const state = get()
    const id = crypto.randomUUID()
    const templateId = crypto.randomUUID()

    // Snapshot current active tab if it's a design/template tab
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    if (activeTab && (activeTab.type === 'design' || activeTab.type === 'template-edit')) {
      const snap = snapshotActiveDesignTab()
      const updatedTabs = state.tabs.map(t =>
        t.id === activeTab.id ? { ...t, ...snap } : t
      )
      set({ tabs: updatedTabs })
    }

    // Create a small blank canvas for template building
    useDesignStore.getState().newDesign(
      { widthFt: 20, heightFt: 20, cellSizeInches: 3 },
      'Untitled Template'
    )
    useHistoryStore.getState().clear()
    const cleanSnapshot = useDesignStore.getState().getSnapshot()

    restoreUISnapshot({
      ...DEFAULT_PER_TAB_UI,
      editingTemplateId: templateId,
    })

    const tab: TabDescriptor = {
      id,
      type: 'template-edit',
      title: 'Untitled Template',
      isDirty: false,
      designSnapshot: null,
      metadata: null,
      historySnapshot: null,
      uiSnapshot: null,
      templateId,
      cleanSnapshot,
    }

    const tabs = [...get().tabs]
    tabs.push(tab)
    set({ tabs, activeTabId: id })
    return id
  },

  closeTab: (tabId) => {
    const state = get()
    const idx = state.tabs.findIndex(t => t.id === tabId)
    if (idx === -1) return

    const tabs = state.tabs.filter(t => t.id !== tabId)
    let nextActiveId = state.activeTabId

    // If closing the active tab, switch to an adjacent tab
    if (state.activeTabId === tabId) {
      if (tabs.length === 0) {
        nextActiveId = null
      } else {
        // Prefer the tab to the right, then left
        const nextIdx = Math.min(idx, tabs.length - 1)
        const nextTab = tabs[nextIdx]
        nextActiveId = nextTab.id

        // Restore the next tab's state into live stores
        if (nextTab.type === 'design' || nextTab.type === 'template-edit') {
          restoreTabState(nextTab)
          // Clear stored snapshots since this tab is now active
          tabs[nextIdx] = {
            ...nextTab,
            designSnapshot: null,
            metadata: null,
            historySnapshot: null,
            uiSnapshot: null,
          }
        }
      }
    }

    set({ tabs, activeTabId: nextActiveId })
  },

  switchTab: (tabId) => {
    const state = get()
    if (tabId === state.activeTabId) return

    const targetTab = state.tabs.find(t => t.id === tabId)
    if (!targetTab) return

    // Snapshot the current active tab
    const currentTab = state.tabs.find(t => t.id === state.activeTabId)
    let updatedTabs = [...state.tabs]

    if (currentTab && (currentTab.type === 'design' || currentTab.type === 'template-edit')) {
      const snap = snapshotActiveDesignTab()
      updatedTabs = updatedTabs.map(t =>
        t.id === currentTab.id ? { ...t, ...snap } : t
      )
    }

    // Restore the target tab's state
    if (targetTab.type === 'design' || targetTab.type === 'template-edit') {
      restoreTabState(targetTab)
      // Clear stored snapshots since this tab is now active
      updatedTabs = updatedTabs.map(t =>
        t.id === tabId
          ? { ...t, designSnapshot: null, metadata: null, historySnapshot: null, uiSnapshot: null }
          : t
      )
    }

    set({ tabs: updatedTabs, activeTabId: tabId })
  },

  setTabDirty: (tabId, dirty) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, isDirty: dirty } : t),
    }))
  },

  setTabTitle: (tabId, title) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, title } : t),
    }))
  },

  getActiveTab: () => {
    const state = get()
    return state.tabs.find(t => t.id === state.activeTabId) ?? null
  },

  markActiveSaved: () => {
    const state = get()
    if (!state.activeTabId) return
    set({
      tabs: state.tabs.map(t =>
        t.id === state.activeTabId ? { ...t, isDirty: false } : t
      ),
    })
  },
})))

// ── Auto-dirty: mark active tab dirty when design changes ──────────

let initialGridVersion: number | null = null

// Track gridVersion changes (grid painting, terrain changes)
useDesignStore.subscribe(
  (state) => state.gridVersion,
  (gridVersion) => {
    // Skip the first change after tab switch (that's the restore, not a user edit)
    if (initialGridVersion === null) {
      initialGridVersion = gridVersion
      return
    }
    const { activeTabId } = useTabStore.getState()
    if (activeTabId) {
      useTabStore.getState().setTabDirty(activeTabId, true)
    }
  }
)

// Track object changes (add, move, delete, resize)
useDesignStore.subscribe(
  (state) => state.placedObjects,
  () => {
    const { activeTabId } = useTabStore.getState()
    if (activeTabId) {
      useTabStore.getState().setTabDirty(activeTabId, true)
    }
  }
)

// Reset initial version tracking on tab switch
useTabStore.subscribe(
  (state) => state.activeTabId,
  () => {
    initialGridVersion = null
  }
)
