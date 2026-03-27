import { useTabStore, type TabDescriptor } from '@/store/tabStore'
import { useNotificationStore } from '@/store/notificationStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Home, FileText, Pencil, Plus, X } from 'lucide-react'

const TAB_ICONS: Record<string, typeof Home> = {
  start: Home,
  design: FileText,
  'template-edit': Pencil,
}

function TabItem({ tab, isActive }: { tab: TabDescriptor; isActive: boolean }) {
  const switchTab = useTabStore((s) => s.switchTab)
  const closeTab = useTabStore((s) => s.closeTab)
  const showConfirmationDialog = useNotificationStore((s) => s.showConfirmationDialog)
  const Icon = TAB_ICONS[tab.type] ?? FileText

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (tab.isDirty) {
      const confirmed = await showConfirmationDialog(
        'Unsaved Changes',
        `Save changes to "${tab.title}" before closing?`
      )
      if (!confirmed) return
      // TODO: Wire up save logic per tab type
      closeTab(tab.id)
    } else {
      closeTab(tab.id)
    }
  }

  return (
    <div
      className={`group flex h-8 shrink-0 cursor-pointer items-center gap-1.5 border-r px-3 text-sm transition-colors ${
        isActive
          ? 'bg-background border-b-2 border-b-primary text-foreground'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      onClick={() => switchTab(tab.id)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-[160px] truncate">{tab.title}</span>
      {tab.isDirty && (
        <span className="ml-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
      )}
      <button
        className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm opacity-0 hover:bg-muted-foreground/20 group-hover:opacity-100"
        onClick={handleClose}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function DocumentTabBar() {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const openDesignTab = useTabStore((s) => s.openDesignTab)

  return (
    <div className="flex h-10 items-end border-b bg-muted/50 overflow-x-auto overflow-y-hidden">
      {tabs.map(tab => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
        />
      ))}

      {/* New tab button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-none self-end"
            onClick={() => openDesignTab()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Project</TooltipContent>
      </Tooltip>
    </div>
  )
}
