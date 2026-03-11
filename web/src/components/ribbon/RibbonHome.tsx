import { RibbonGroup } from './RibbonGroup'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIStore } from '@/store/uiStore'
import { useHistoryStore } from '@/store/historyStore'
import { ToolMode } from '@/types/tools'
import { cn } from '@/lib/utils'
import {
  FilePlus2,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  MousePointer2,
  Paintbrush,
  Square,
  Circle,
  Minus,
  Pentagon,
  Eraser,
} from 'lucide-react'

const tools = [
  { mode: ToolMode.Pointer, label: 'Pointer (V)', icon: MousePointer2 },
  { mode: ToolMode.Brush, label: 'Brush (B)', icon: Paintbrush },
  { mode: ToolMode.Rectangle, label: 'Rectangle (R)', icon: Square },
  { mode: ToolMode.Circle, label: 'Circle/Oval (C)', icon: Circle },
  { mode: ToolMode.Line, label: 'Line (L)', icon: Minus },
  { mode: ToolMode.Polygon, label: 'Polygon (P)', icon: Pentagon },
  { mode: ToolMode.Eraser, label: 'Eraser (E)', icon: Eraser },
]

interface RibbonHomeProps {
  onNew: () => void
  onSave: () => void
  onLoad: () => void
}

export function RibbonHome({ onNew, onSave, onLoad }: RibbonHomeProps) {
  const activeTool = useUIStore((s) => s.activeTool)
  const setActiveTool = useUIStore((s) => s.setActiveTool)
  const fillMode = useUIStore((s) => s.fillMode)
  const setFillMode = useUIStore((s) => s.setFillMode)
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)
  const undoStack = useHistoryStore((s) => s.undoStack)
  const redoStack = useHistoryStore((s) => s.redoStack)

  const showFillToggle = ([ToolMode.Rectangle, ToolMode.Circle, ToolMode.Polygon] as ToolMode[]).includes(activeTool)

  return (
    <div className="flex items-stretch">
      {/* Clipboard group */}
      <RibbonGroup label="Clipboard">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={onNew}>
              <FilePlus2 className="h-4 w-4" />
              <span className="text-xs">New</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Design (Ctrl+N)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={onLoad}>
              <FolderOpen className="h-4 w-4" />
              <span className="text-xs">Open</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open Design</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={onSave}>
              <Save className="h-4 w-4" />
              <span className="text-xs">Save</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Design (Ctrl+S)</TooltipContent>
        </Tooltip>
      </RibbonGroup>

      {/* History group */}
      <RibbonGroup label="History">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </RibbonGroup>

      {/* Drawing Tools group */}
      <RibbonGroup label="Drawing Tools">
        <div className="flex gap-0.5">
          {tools.map(({ mode, label, icon: Icon }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(mode)}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                    activeTool === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted hover:text-muted-foreground'
                  )}
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </RibbonGroup>

      {/* Fill/Outline mode */}
      {showFillToggle && (
        <RibbonGroup label="Mode" hideSeparator>
          <button
            onClick={() => setFillMode('fill')}
            className={cn(
              'h-7 rounded-md px-3 text-xs transition-colors',
              fillMode === 'fill'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted hover:text-muted-foreground'
            )}
          >
            Fill
          </button>
          <button
            onClick={() => setFillMode('outline')}
            className={cn(
              'h-7 rounded-md px-3 text-xs transition-colors',
              fillMode === 'outline'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted hover:text-muted-foreground'
            )}
          >
            Outline
          </button>
        </RibbonGroup>
      )}
    </div>
  )
}
