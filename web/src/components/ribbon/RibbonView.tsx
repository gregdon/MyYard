import { RibbonGroup } from './RibbonGroup'
import { ViewToggle } from '@/components/toolbar/ViewToggle'
import { ZoomControls } from '@/components/toolbar/ZoomControls'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Maximize,
  HelpCircle,
  Bot,
} from 'lucide-react'

export function RibbonView() {
  const sideNavCollapsed = useUIStore((s) => s.sideNavCollapsed)
  const toggleSideNav = useUIStore((s) => s.toggleSideNav)
  const activeRightDrawer = useUIStore((s) => s.activeRightDrawer)
  const toggleRightDrawer = useUIStore((s) => s.toggleRightDrawer)

  return (
    <div className="flex items-stretch">
      <RibbonGroup label="Perspective">
        <ViewToggle />
      </RibbonGroup>

      <RibbonGroup label="Zoom">
        <ZoomControls />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.dispatchEvent(new Event('canvas-center'))}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Center Grid</TooltipContent>
        </Tooltip>
      </RibbonGroup>

      <RibbonGroup label="Panels">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={sideNavCollapsed ? 'ghost' : 'secondary'}
              size="icon"
              className="h-8 w-8"
              onClick={toggleSideNav}
            >
              {sideNavCollapsed
                ? <PanelLeftOpen className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sideNavCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}</TooltipContent>
        </Tooltip>
      </RibbonGroup>

      <RibbonGroup label="Assist" hideSeparator>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeRightDrawer === 'help' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleRightDrawer('help')}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Help</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeRightDrawer === 'ai' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleRightDrawer('ai')}
            >
              <Bot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>AI Assistant</TooltipContent>
        </Tooltip>
      </RibbonGroup>
    </div>
  )
}
