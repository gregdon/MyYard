import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Crosshair, FilePlus, FolderOpen, Menu, Save } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { UndoRedoControls } from './UndoRedoControls'
import { GridSettings } from './GridSettings'
import { ViewToggle } from './ViewToggle'
import { ZoomControls } from './ZoomControls'

interface EditorToolbarProps {
  onNew: () => void
  onSave: () => void
  onLoad: () => void
}

export function EditorToolbar({ onNew, onSave, onLoad }: EditorToolbarProps) {
  const toggleSideNav = useUIStore((s) => s.toggleSideNav)

  return (
    <div className="flex h-10 items-center gap-2 border-b bg-card px-3">
      {/* Sidebar toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSideNav}>
            <Menu className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Sidebar</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="h-5" />

      {/* File actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
            <FilePlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Design</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onLoad}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSave}>
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save (Ctrl+S)</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="h-5" />

      {/* Undo / Redo */}
      <UndoRedoControls />
      <Separator orientation="vertical" className="h-5" />

      {/* Grid dimensions */}
      <GridSettings />

      <div className="flex-1" />

      {/* Zoom */}
      <ZoomControls />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => window.dispatchEvent(new Event('canvas-center'))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Center Grid</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="h-5" />

      {/* 2D / 3D toggle */}
      <ViewToggle />
    </div>
  )
}
