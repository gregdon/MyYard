import { useUIStore } from '@/store/uiStore'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TreePine, HelpCircle, Bot } from 'lucide-react'

export function AppHeader() {
  const activeRightDrawer = useUIStore((s) => s.activeRightDrawer)
  const toggleRightDrawer = useUIStore((s) => s.toggleRightDrawer)

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <TreePine className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Outdoor Living Designer</span>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeRightDrawer === 'help' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => toggleRightDrawer('help')}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Help</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeRightDrawer === 'ai' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => toggleRightDrawer('ai')}
            >
              <Bot className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>AI Assistant</TooltipContent>
        </Tooltip>

        <div className="ml-2">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
