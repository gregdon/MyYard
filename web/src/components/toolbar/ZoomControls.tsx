import { useUIStore } from '@/store/uiStore'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ZoomControls() {
  const zoomLevel = useUIStore((s) => s.zoomLevel)

  const zoomPercent = Math.round(zoomLevel * 100)

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: 'out' }))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>

      <span className="w-10 text-center text-xs text-muted-foreground">{zoomPercent}%</span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: 'in' }))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
    </div>
  )
}
