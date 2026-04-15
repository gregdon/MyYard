import { useState, useEffect, useCallback, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useDesignStore } from '@/store/designStore'
import { useTabStore } from '@/store/tabStore'
import { useDesignIO } from '@/hooks/useDesignIO'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { SideNav } from '@/components/layout/SideNav'
import { DocumentTabBar } from '@/components/layout/DocumentTabBar'
import { RibbonBar } from '@/components/ribbon/RibbonBar'
import { Canvas2DView } from '@/components/canvas2d/Canvas2DView'
import { Scene3DView } from '@/components/scene3d/Scene3DView'
import { StartTabContent } from '@/components/tabs/StartTabContent'
import { NewDesignDialog } from '@/components/dialogs/NewDesignDialog'
import { LoadDialog } from '@/components/dialogs/LoadDialog'
import { SaveDialog } from '@/components/dialogs/SaveDialog'
import { SaveCompositionDialog } from '@/components/dialogs/SaveCompositionDialog'
import { ObjectPropertiesPanel } from '@/components/sidebar/ObjectPropertiesPanel'
import { ScrollArea } from '@/components/ui/scroll-area'

const MD_BREAKPOINT = 768

export function EditorPage() {
  const viewMode = useUIStore((s) => s.viewMode)
  const placedObjects = useDesignStore((s) => s.placedObjects)
  const sideNavCollapsed = useUIStore((s) => s.sideNavCollapsed)
  const setSideNavCollapsed = useUIStore((s) => s.setSideNavCollapsed)
  const sideNavWidth = useUIStore((s) => s.sideNavWidth)
  const setSideNavWidth = useUIStore((s) => s.setSideNavWidth)
  const resizingRef = useRef(false)

  const activeTab = useTabStore((s) => s.getActiveTab())
  const openStartTab = useTabStore((s) => s.openStartTab)
  const openDesignTab = useTabStore((s) => s.openDesignTab)
  const closeTab = useTabStore((s) => s.closeTab)
  const tabs = useTabStore((s) => s.tabs)

  const { saveDesign, saveToCloud, saveAsCloud, exportDesign } = useDesignIO()
  useKeyboardShortcuts()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [closeTabAfterTemplateSave, setCloseTabAfterTemplateSave] = useState(false)

  // Initialize tabs on first render — Start tab + empty design
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current && tabs.length === 0) {
      initialized.current = true
      openStartTab()
      openDesignTab()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    const saved = await saveDesign()
    if (!saved) setShowSaveDialog(true)
  }, [saveDesign])

  const handleSaveDialogConfirm = useCallback(async (name: string, description: string) => {
    await saveToCloud(name, description)
  }, [saveToCloud])

  const handleSaveAsDialogConfirm = useCallback(async (name: string, description: string) => {
    await saveAsCloud(name, description)
  }, [saveAsCloud])

  const handleExport = useCallback(() => {
    exportDesign()
  }, [exportDesign])

  // Template editing handlers
  const handleTemplateCancel = useCallback(() => {
    if (!activeTab || activeTab.type !== 'template-edit') return
    if (activeTab.cleanSnapshot) {
      useDesignStore.getState().restoreSnapshot(activeTab.cleanSnapshot)
    }
    closeTab(activeTab.id)
  }, [activeTab, closeTab])

  const handleTemplateSave = useCallback(() => {
    setShowSaveTemplateDialog(true)
  }, [])

  const handleTemplateSaveAndClose = useCallback(() => {
    setCloseTabAfterTemplateSave(true)
    setShowSaveTemplateDialog(true)
  }, [])

  // Listen for save-as event from keyboard shortcuts
  useEffect(() => {
    const handler = () => setShowSaveDialog(true)
    window.addEventListener('save-as', handler)
    return () => window.removeEventListener('save-as', handler)
  }, [])

  // Sidebar resize drag handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX
    const startWidth = sideNavWidth

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = ev.clientX - startX
      setSideNavWidth(startWidth + delta)
    }
    const onUp = () => {
      resizingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sideNavWidth, setSideNavWidth])

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MD_BREAKPOINT}px)`)
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSideNavCollapsed(true)
    }
    handleChange(mq)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [setSideNavCollapsed])

  const isCanvasTab = activeTab?.type === 'design' || activeTab?.type === 'template-edit'

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Ribbon — always visible */}
      <RibbonBar
        onSave={handleSave}
        onSaveAs={() => setShowSaveAsDialog(true)}
        onExport={handleExport}
        onImport={() => setShowImportDialog(true)}
        onNewDesign={() => setShowNewDialog(true)}
        onNewTemplate={() => {
          useTabStore.getState().openNewTemplateTab()
        }}
        onSaveTemplate={() => setShowSaveTemplateDialog(true)}
        onTemplateCancel={handleTemplateCancel}
        onTemplateSave={handleTemplateSave}
        onTemplateSaveAndClose={handleTemplateSaveAndClose}
      />

      {/* Main content area — sidebar always visible */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className="shrink-0 overflow-hidden border-r"
          style={{ width: sideNavCollapsed ? 41 : sideNavWidth }}
        >
          <SideNav />
        </div>

        {/* Resize handle */}
        {!sideNavCollapsed && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-primary/20 active:bg-primary/40 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}

        {/* Content column: tab bar + active content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Document tab bar — right of sidebar */}
          <DocumentTabBar />

          {/* Tab content */}
          {activeTab?.type === 'start' ? (
            <StartTabContent />
          ) : isCanvasTab ? (
            <div className="relative flex-1 overflow-hidden">
              {/* 2D Canvas */}
              <div
                className="absolute inset-0"
                style={{ display: viewMode === '2d' ? 'block' : 'none' }}
              >
                <Canvas2DView />
              </div>

              {/* 3D Scene */}
              <div
                className="absolute inset-0"
                style={{ display: viewMode === '3d' ? 'block' : 'none' }}
              >
                <Scene3DView />
              </div>
            </div>
          ) : null}
        </div>

        {/* Right properties panel — shows when objects exist */}
        {isCanvasTab && placedObjects.length > 0 && (
          <div className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-l bg-card">
            <div className="border-b px-3 py-2 text-sm font-semibold">Properties</div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-3">
                <ObjectPropertiesPanel />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <NewDesignDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
      <LoadDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
      <SaveDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} onSave={handleSaveDialogConfirm} />
      <SaveDialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog} onSave={handleSaveAsDialogConfirm} title="Save As Copy" />
      <SaveCompositionDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        onSaved={() => {
          if (closeTabAfterTemplateSave && activeTab) {
            closeTab(activeTab.id)
            setCloseTabAfterTemplateSave(false)
          }
        }}
      />
    </div>
  )
}
