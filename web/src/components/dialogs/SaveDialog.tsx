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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (fileName: string) => void
}

export function SaveDialog({ open, onOpenChange, onSave }: Props) {
  const currentName = useDesignStore((s) => s.metadata.name)
  const [fileName, setFileName] = useState(currentName)

  // Sync when dialog opens
  useEffect(() => {
    if (open) {
      const name = useDesignStore.getState().metadata.name
      setFileName(name === 'Untitled Project' ? 'My Backyard' : name)
    }
  }, [open])

  const handleSave = () => {
    const trimmed = fileName.trim() || 'My Backyard'
    onSave(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>File Name</Label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              autoFocus
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
