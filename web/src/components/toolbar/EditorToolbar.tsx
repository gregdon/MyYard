import { Separator } from '@/components/ui/separator'
import { Crosshair } from 'lucide-react'
import { FileMenu } from './FileMenu'
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
  return (
    <div className="flex h-10 items-center gap-2 border-b bg-card px-3">
      <FileMenu onNew={onNew} onSave={onSave} onLoad={onLoad} />
      <Separator orientation="vertical" className="h-5" />
      <UndoRedoControls />
      <Separator orientation="vertical" className="h-5" />
      <GridSettings />
      <div className="flex-1" />
      <ZoomControls />
      <button
        onClick={() => window.dispatchEvent(new Event('canvas-center'))}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Center Grid"
      >
        <Crosshair className="h-4 w-4" />
      </button>
      <Separator orientation="vertical" className="h-5" />
      <ViewToggle />
    </div>
  )
}
