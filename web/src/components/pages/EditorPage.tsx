import { useState } from 'react'
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
import { ObjectPropertiesPanel } from '@/components/sidebar/ObjectPropertiesPanel'
import { ScrollArea } from '@/components/ui/scroll-area'

export function EditorPage() {
  const viewMode = useUIStore((s) => s.viewMode)
  const selectedObjectId = useUIStore((s) => s.selectedObjectId)
  const placedObjects = useDesignStore((s) => s.placedObjects)
  const { saveDesign } = useDesignIO()
  useKeyboardShortcuts()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  return (
    <div className="flex flex-1 overflow-hidden">
      <SideNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <EditorToolbar
          onNew={() => setShowNewDialog(true)}
          onSave={saveDesign}
          onLoad={() => setShowLoadDialog(true)}
        />
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
      </div>

      {/* Right properties panel — shows when objects exist */}
      {placedObjects.length > 0 && (
        <div className="flex h-full w-[280px] shrink-0 flex-col border-l bg-card">
          <div className="border-b px-3 py-2 text-sm font-semibold">Properties</div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              <ObjectPropertiesPanel />
            </div>
          </ScrollArea>
        </div>
      )}

      <NewDesignDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
      <LoadDialog open={showLoadDialog} onOpenChange={setShowLoadDialog} />
    </div>
  )
}
