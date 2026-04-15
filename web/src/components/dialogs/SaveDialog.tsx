import { useState, useEffect } from 'react'
import { useDesignStore } from '@/store/designStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, description: string) => void
}

export function SaveDialog({ open, onOpenChange, onSave }: Props) {
  const currentName = useDesignStore((s) => s.metadata.name)
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      const metaName = useDesignStore.getState().metadata.name
      setName(metaName === 'Untitled Design' ? 'My Backyard' : metaName)
      setDescription('')
    }
  }, [open])

  const handleSave = () => {
    const trimmed = name.trim() || 'My Backyard'
    onSave(trimmed, description.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of this design"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
