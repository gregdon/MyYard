import { useUIStore } from '@/store/uiStore'
import { ToolMode } from '@/types/tools'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
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

export function ToolSelector() {
  const activeTool = useUIStore((s) => s.activeTool)
  const setActiveTool = useUIStore((s) => s.setActiveTool)
  const fillMode = useUIStore((s) => s.fillMode)
  const setFillMode = useUIStore((s) => s.setFillMode)

  const showFillToggle = ([ToolMode.Rectangle, ToolMode.Circle, ToolMode.Polygon] as ToolMode[]).includes(activeTool)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {tools.map(({ mode, label, icon: Icon }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTool(mode)}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors',
                  activeTool === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted hover:text-muted-foreground'
                )}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {showFillToggle && (
        <div className="flex gap-1">
          <button
            onClick={() => setFillMode('fill')}
            className={cn(
              'h-7 flex-1 rounded-md text-xs transition-colors',
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
              'h-7 flex-1 rounded-md text-xs transition-colors',
              fillMode === 'outline'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted hover:text-muted-foreground'
            )}
          >
            Outline
          </button>
        </div>
      )}
    </div>
  )
}
