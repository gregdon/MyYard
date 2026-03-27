import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Crosshair, Home, Clock, Megaphone } from 'lucide-react'
import { useTabStore } from '@/store/tabStore'
import { ZoomControls } from '@/components/toolbar/ZoomControls'

export function RibbonViewTab() {
  const openStartTab = useTabStore((s) => s.openStartTab)
  const activeTab = useTabStore((s) => {
    const id = s.activeTabId
    return s.tabs.find(t => t.id === id)
  })
  const isCanvasTab = activeTab?.type === 'design' || activeTab?.type === 'template-edit'

  return (
    <>
      {/* Zoom & Center — only for canvas tabs */}
      {isCanvasTab && (
        <>
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
        </>
      )}

      {/* Start, Recent, Announcements */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs"
            onClick={openStartTab}
          >
            <Home className="h-4 w-4" />
            Start
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open Start</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs"
            onClick={openStartTab}
          >
            <Clock className="h-4 w-4" />
            Recent
          </Button>
        </TooltipTrigger>
        <TooltipContent>Recent Documents</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs"
            onClick={openStartTab}
          >
            <Megaphone className="h-4 w-4" />
            Announcements
          </Button>
        </TooltipTrigger>
        <TooltipContent>Announcements</TooltipContent>
      </Tooltip>
    </>
  )
}
