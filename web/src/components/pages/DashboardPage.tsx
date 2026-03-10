import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus, TreePine } from 'lucide-react'

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <TreePine className="h-16 w-16 text-primary/30" />
      <div className="text-center">
        <h2 className="text-2xl font-bold">My Designs</h2>
        <p className="mt-1 text-muted-foreground">
          Create and manage your outdoor living designs
        </p>
      </div>
      <Button onClick={() => navigate('/editor')} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        New Design
      </Button>
    </div>
  )
}
