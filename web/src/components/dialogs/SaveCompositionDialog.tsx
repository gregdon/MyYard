import { useState, useEffect, useMemo } from 'react'
import { useDesignStore } from '@/store/designStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTemplateStore } from '@/store/templateStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORY_OPTIONS = [
  { value: 'structures', label: 'Structures' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'seating', label: 'Seating' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'full-patio', label: 'Full Patio' },
]

export function SaveCompositionDialog({ open, onOpenChange }: Props) {
  const placedObjects = useDesignStore((s) => s.placedObjects)
  const selectedObjectId = useUIStore((s) => s.selectedObjectId)
  const selectedObjectIds = useUIStore((s) => s.selectedObjectIds)
  const user = useAuthStore((s) => s.user)
  const extractPreset = useTemplateStore((s) => s.extractPreset)
  const extractAssembly = useTemplateStore((s) => s.extractAssembly)
  const saveTemplate = useTemplateStore((s) => s.saveTemplate)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('structures')
  const [tags, setTags] = useState('')
  const [saveAsBuiltin, setSaveAsBuiltin] = useState(false)
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'

  // Resolve selected objects from the store
  const selectedObjects = useMemo(() => {
    const ids = selectedObjectIds.length > 0
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : []
    return placedObjects.filter((obj) => ids.includes(obj.id))
  }, [placedObjects, selectedObjectId, selectedObjectIds])

  const objectCount = selectedObjects.length
  const compositionType = objectCount === 1 ? 'Preset' : 'Assembly'

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setCategory('structures')
      setTags('')
      setSaveAsBuiltin(false)
      setSaving(false)
    }
  }, [open])

  const handleSave = async () => {
    if (!name.trim() || objectCount === 0 || !user) return

    setSaving(true)
    try {
      const meta = {
        name: name.trim(),
        description: description.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility: (saveAsBuiltin ? 'builtin' : 'user') as 'builtin' | 'user',
        createdBy: user.id,
      }

      let template
      if (objectCount === 1) {
        template = extractPreset(selectedObjects[0], meta)
      } else {
        template = extractAssembly(selectedObjects, meta)
      }

      await saveTemplate(template, user.id)
      onOpenChange(false)
    } catch {
      // Could add error toast here in the future
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Saving {objectCount} {objectCount === 1 ? 'object' : 'objects'} as{' '}
            {compositionType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="comp-name">Name</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Corner Fire Pit Setup"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comp-description">Description</Label>
            <Textarea
              id="comp-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comp-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="comp-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comp-tags">Tags</Label>
            <Input
              id="comp-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="fire, outdoor, evening (comma-separated)"
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="comp-builtin"
                checked={saveAsBuiltin}
                onCheckedChange={(checked) => setSaveAsBuiltin(checked === true)}
              />
              <Label htmlFor="comp-builtin" className="cursor-pointer">
                Save as Built-in
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || objectCount === 0 || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
