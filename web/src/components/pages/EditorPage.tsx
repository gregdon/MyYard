import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useDesignStore } from '@/store/designStore'
import { useDesignIO } from '@/hooks/useDesignIO'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { SideNav } from '@/components/layout/SideNav'
import { EditorToolbar } from '@/components/toolbar/EditorToolbar'
import { Canvas2DView } from '@/components/canvas2d/Canvas2DView'
import { Scene3DView } from '@/components/scene3d/Scene3DView'
import { NewDesignDialog } from '@/components/dialogs/NewDesignDialog'
import { LoadDialog } from '@/components/dialogs/LoadDialog'
import { SaveDialog } from '@/components/dialogs/SaveDialog'
import { ObjectPropertiesPanel } from '@/components/sidebar/ObjectPropertiesPanel'
import { ScrollArea } from '@/components/ui/scroll-area'

const MD_BREAKPOINT = 768

export function EditorPage() {
  const viewMode = useUIStore((s) => s.viewMode)
  const placedObjects = useDesignStore((s) => s.placedObjects)
  const sideNavCollapsed = useUIStore((s) => s.sideNavCollapsed)
  const setSideNavCollapsed = useUIStore((s) => s.setSideNavCollapsed)

  const { saveDesign, saveAsDesign } = useDesignIO()
  useKeyboardShortcuts()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleSave = useCallback(() => {
    const saved = saveDesign()
    if (!saved) setShowSaveDialog(true)
  }, [saveDesign])

  const handleSaveAs = useCallback(() => {
    setShowSaveDialog(true)
  }, [])

  const handleSaveDialogConfirm = useCallback((fileName: string) => {
    saveAsDesign(fileName)
  }, [saveAsDesign])

  // Listen for save-as event from keyboard shortcuts
  useEffect(() => {
    const handler = () => setShowSaveDialog(true)
    window.addEventListener('save-as', handler)
    return () => window.removeEventListener('save-as', handler)
  }, [])

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EditorToolbar
        onNew={() => setShowNewDialog(true)}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onLoad={() => setShowLoadDialog(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`shrink-0 overflow-hidden border-r transition-[width] duration-200 ${
            sideNavCollapsed ? 'w-12' : 'w-64'
          }`}
        >
          <SideNav />
        </div>

        {/* Canvas area */}
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

        {/* Right properties panel — shows when objects exist */}
        {placedObjects.length > 0 && (
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
      <LoadDialog open={showLoadDialog} onOpenChange={setShowLoadDialog} />
      <SaveDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} onSave={handleSaveDialogConfirm} />
    </div>
  )
}
