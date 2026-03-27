import { useTabStore } from '@/store/tabStore'
import { Button } from '@/components/ui/button'
import { FilePlus, FolderOpen, TreePine } from 'lucide-react'

export function StartTabContent() {
  const openDesignTab = useTabStore((s) => s.openDesignTab)

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <TreePine className="h-16 w-16 text-primary/60" />
        <div>
          <h1 className="text-2xl font-semibold">Welcome to MyYard</h1>
          <p className="mt-2 text-muted-foreground">
            Design your outdoor living spaces with our intuitive 2D/3D editor.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => openDesignTab()} className="gap-2">
            <FilePlus className="h-4 w-4" />
            New Project
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <FolderOpen className="h-4 w-4" />
            Open Project
          </Button>
        </div>

        <div className="mt-8 w-full rounded-lg border bg-card p-4">
          <h2 className="text-sm font-medium">Announcements</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No announcements at this time.
          </p>
        </div>
      </div>
    </div>
  )
}
