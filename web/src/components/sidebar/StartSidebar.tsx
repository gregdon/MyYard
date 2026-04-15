import { useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDesignCloudStore } from '@/store/designCloudStore'
import { useAuthStore } from '@/store/authStore'
import { useDesignIO } from '@/hooks/useDesignIO'
import { FileText, Megaphone, Clock, Loader2 } from 'lucide-react'

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return date.toLocaleDateString()
}

export function StartSidebar() {
  const user = useAuthStore((s) => s.user)
  const designs = useDesignCloudStore((s) => s.designs)
  const loading = useDesignCloudStore((s) => s.loading)
  const loadDesigns = useDesignCloudStore((s) => s.loadDesigns)
  const { openCloudDesign } = useDesignIO()

  useEffect(() => {
    if (user) {
      loadDesigns(user.id)
    }
  }, [user, loadDesigns])

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3 space-y-4">
          {/* Recent Designs */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Clock className="h-3.5 w-3.5" />
              Recent Designs
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : designs.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2">
                No saved designs yet.
              </p>
            ) : (
              <div className="space-y-1">
                {designs.slice(0, 10).map(design => (
                  <button
                    key={design.id}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                    onClick={() => openCloudDesign(design.id)}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{design.name}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(design.updatedAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Megaphone className="h-3.5 w-3.5" />
              Announcements
            </h3>
            <div className="space-y-2">
              <div className="rounded-md border bg-background p-2.5">
                <div className="text-xs font-medium">Cloud Save</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your designs are now saved to the cloud. Press Ctrl+S to save.
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
