import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Save, XCircle, SaveAll, Crosshair } from 'lucide-react'
import { UndoRedoControls } from '@/components/toolbar/UndoRedoControls'
import { ViewToggle } from '@/components/toolbar/ViewToggle'
import { ZoomControls } from '@/components/toolbar/ZoomControls'

interface RibbonTemplateTabProps {
  onCancel: () => void
  onSave: () => void
  onSaveAndClose: () => void
}

export function RibbonTemplateTab({ onCancel, onSave, onSaveAndClose }: RibbonTemplateTabProps) {
  return (
    <>
      {/* Undo/Redo */}
      <UndoRedoControls />

      <Separator orientation="vertical" className="h-5" />

      {/* Template actions */}
      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onCancel}>
        <XCircle className="h-3.5 w-3.5" />
        Cancel
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onSave}>
        <Save className="h-3.5 w-3.5" />
        Save
      </Button>
      <Button variant="default" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onSaveAndClose}>
        <SaveAll className="h-3.5 w-3.5" />
        Save &amp; Close
      </Button>

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
    </>
  )
}
