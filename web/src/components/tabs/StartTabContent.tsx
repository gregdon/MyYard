import { useEffect, useState } from 'react'
import { useTabStore } from '@/store/tabStore'
import { useDesignCloudStore } from '@/store/designCloudStore'
import { useAuthStore } from '@/store/authStore'
import { useDesignIO } from '@/hooks/useDesignIO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FilePlus, FileText, Trash2, Search, TreePine, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

export function StartTabContent() {
  const openDesignTab = useTabStore((s) => s.openDesignTab)
  const user = useAuthStore((s) => s.user)
  const designs = useDesignCloudStore((s) => s.designs)
  const loading = useDesignCloudStore((s) => s.loading)
  const loadDesigns = useDesignCloudStore((s) => s.loadDesigns)
  const deleteDesignCloud = useDesignCloudStore((s) => s.deleteDesign)
  const { openCloudDesign } = useDesignIO()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) {
      loadDesigns(user.id)
    }
  }, [user, loadDesigns])

  const filtered = designs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (e: React.MouseEvent, designId: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteDesignCloud(designId)
      toast.success(`Deleted: ${name}`)
    } catch {
      toast.error('Failed to delete design')
    }
  }

  return (
    <div className="flex h-full bg-background">
      <div className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-2xl px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <TreePine className="h-8 w-8 text-primary/60" />
            <div>
              <h1 className="text-xl font-semibold">MyYard</h1>
              <p className="text-sm text-muted-foreground">
                Design your outdoor living spaces
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button onClick={() => openDesignTab()} className="gap-2">
              <FilePlus className="h-4 w-4" />
              New Design
            </Button>
          </div>

          {/* My Designs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                My Designs
              </h2>
              {designs.length > 0 && (
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                {designs.length === 0
                  ? 'No saved designs yet. Create one to get started!'
                  : 'No designs match your search.'}
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-1">
                  {filtered.map(design => (
                    <button
                      key={design.id}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors group"
                      onClick={() => openCloudDesign(design.id)}
                    >
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-sm">{design.name}</div>
                        {design.description && (
                          <div className="truncate text-xs text-muted-foreground">{design.description}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(design.updatedAt)}
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={(e) => handleDelete(e, design.id, design.name)}
                        title="Delete design"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
