import { useState } from 'react'
import { useDesignStore } from '@/store/designStore'
import { useHistoryStore } from '@/store/historyStore'
import { useUIStore } from '@/store/uiStore'
import { DEFAULT_GRID_SETTINGS } from '@/constants/defaults'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { GridIncrement } from '@/types/tools'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewDesignDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('My Backyard')
  const [widthFt, setWidthFt] = useState(DEFAULT_GRID_SETTINGS.widthFt)
  const [heightFt, setHeightFt] = useState(DEFAULT_GRID_SETTINGS.heightFt)
  const [increment, setIncrement] = useState<GridIncrement>(DEFAULT_GRID_SETTINGS.increment)

  const newDesign = useDesignStore((s) => s.newDesign)

  const handleCreate = () => {
    useHistoryStore.getState().clear()
    newDesign({ widthFt, heightFt, increment }, name)
    useUIStore.getState().setHasBeenSaved(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Design Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Width (ft)</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={widthFt}
                onChange={(e) => setWidthFt(parseInt(e.target.value) || 50)}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (ft)</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={heightFt}
                onChange={(e) => setHeightFt(parseInt(e.target.value) || 50)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grid Increment</Label>
            <ToggleGroup
              type="single"
              value={increment}
              onValueChange={(v) => { if (v) setIncrement(v as GridIncrement) }}
            >
              <ToggleGroupItem value="1ft" className="flex-1">1 foot</ToggleGroupItem>
              <ToggleGroupItem value="6in" className="flex-1">6 inches</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
