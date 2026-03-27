import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolSelector } from '@/components/sidebar/ToolSelector'
import { WidgetPalette } from '@/components/sidebar/WidgetPalette'
import { TemplateGallery } from '@/components/sidebar/TemplateGallery'
import { StartSidebar } from '@/components/sidebar/StartSidebar'
import { Paintbrush, Box, Library, Clock, Megaphone } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useTabStore } from '@/store/tabStore'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type SideTab = 'tools' | 'widgets' | 'templates'

const TABS: { id: SideTab; label: string; icon: typeof Paintbrush }[] = [
  { id: 'tools', label: 'Tools', icon: Paintbrush },
  { id: 'widgets', label: 'Widgets', icon: Box },
  { id: 'templates', label: 'Templates', icon: Library },
]

export function SideNav() {
  const collapsed = useUIStore((s) => s.sideNavCollapsed)
  const activeDocTab = useTabStore((s) => s.getActiveTab())
  const [activeTab, setActiveTab] = useState<SideTab>('widgets')
  const isStartTab = activeDocTab?.type === 'start'

  // Start tab: show StartSidebar
  if (isStartTab) {
    if (collapsed) {
      return (
        <div className="flex h-full flex-col items-center gap-1 bg-card pt-2 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Recent Documents</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Announcements</TooltipContent>
          </Tooltip>
        </div>
      )
    }
    return <StartSidebar />
  }

  // Collapsed: icon strip with flyout popovers
  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center gap-1 bg-card pt-2 px-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className={id === 'templates' ? 'w-72 p-2' : 'w-56 p-2'}>
              <p className="mb-2 text-sm font-medium">{label}</p>
              {id === 'tools' && <ToolSelector />}
              {id === 'widgets' && <WidgetPalette />}
              {id === 'templates' && <TemplateGallery />}
            </PopoverContent>
          </Popover>
        ))}
      </div>
    )
  }

  // Expanded: tab content + bottom tab bar
  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Tab content area */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {activeTab === 'tools' && <ToolSelector />}
          {activeTab === 'widgets' && <WidgetPalette />}
          {activeTab === 'templates' && <TemplateGallery />}
        </div>
      </ScrollArea>

      {/* Bottom tab bar */}
      <div className="flex border-t bg-card">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors cursor-pointer ${
                  activeTab === id
                    ? 'text-primary bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
