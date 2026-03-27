import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Save, BookmarkPlus, Crosshair } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { UndoRedoControls } from '@/components/toolbar/UndoRedoControls'
import { ViewToggle } from '@/components/toolbar/ViewToggle'
import { ZoomControls } from '@/components/toolbar/ZoomControls'
import { GridSettings } from '@/components/toolbar/GridSettings'

interface RibbonDesignTabProps {
  onSave: () => void
  onSaveTemplate?: () => void
}

export function RibbonDesignTab({ onSave, onSaveTemplate }: RibbonDesignTabProps) {
  const selectedId = useUIStore((s) => s.selectedObjectId)
  const selectedIds = useUIStore((s) => s.selectedObjectIds)
  const hasSelection = !!selectedId || selectedIds.length > 0

  return (
    <>
      {/* Undo/Redo */}
      <UndoRedoControls />

      <Separator orientation="vertical" className="h-5" />

      {/* Save */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSave}>
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save (Ctrl+S)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5" />

      {/* 2D/3D Toggle */}
      <ViewToggle />

      <Separator orientation="vertical" className="h-5" />

      {/* Zoom */}
      <ZoomControls />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => window.dispatchEvent(new Event('canvas-center'))}
          >
            <Crosshair className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Center Grid</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5" />

      {/* Grid Settings */}
      <GridSettings />

      <Separator orientation="vertical" className="h-5" />

      {/* Save as Template */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={onSaveTemplate}
            disabled={!hasSelection}
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save Selection as Template</TooltipContent>
      </Tooltip>
    </>
  )
}
