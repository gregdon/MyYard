import { ScrollArea } from '@/components/ui/scroll-area'
import { useTabStore } from '@/store/tabStore'
import { FileText, Megaphone, Clock } from 'lucide-react'

export function StartSidebar() {
  const openDesignTab = useTabStore((s) => s.openDesignTab)

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3 space-y-4">
          {/* Recent Documents */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Clock className="h-3.5 w-3.5" />
              Recent Documents
            </h3>
            <div className="space-y-1">
              {/* Placeholder items */}
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => openDesignTab(undefined, 'My Backyard')}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">My Backyard</div>
                  <div className="text-xs text-muted-foreground">2 days ago</div>
                </div>
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => openDesignTab(undefined, 'Front Patio')}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">Front Patio</div>
                  <div className="text-xs text-muted-foreground">5 days ago</div>
                </div>
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => openDesignTab(undefined, 'Pool Area')}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">Pool Area</div>
                  <div className="text-xs text-muted-foreground">Last week</div>
                </div>
              </button>
            </div>
          </div>

          {/* Announcements */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Megaphone className="h-3.5 w-3.5" />
              Announcements
            </h3>
            <div className="space-y-2">
              <div className="rounded-md border bg-background p-2.5">
                <div className="text-xs font-medium">Tabbed Interface</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can now open multiple designs in tabs. Try the + button to create a new design.
                </p>
                <div className="mt-1 text-[10px] text-muted-foreground/60">March 2026</div>
              </div>
              <div className="rounded-md border bg-background p-2.5">
                <div className="text-xs font-medium">Template System</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save and reuse widget presets and assemblies from the Templates panel.
                </p>
                <div className="mt-1 text-[10px] text-muted-foreground/60">March 2026</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
