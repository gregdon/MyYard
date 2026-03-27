import { useState, useEffect, useMemo, useRef } from 'react'
import { useDesignStore } from '@/store/designStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTemplateStore } from '@/store/templateStore'
import { capture3DScreenshot } from '@/components/scene3d/Scene3DView'
import { uploadAndSaveTemplateImage } from '@/services/storageService'
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
import { Camera, ImagePlus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

const CATEGORY_OPTIONS = [
  { value: 'structures', label: 'Structures' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'seating', label: 'Seating' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'full-patio', label: 'Full Patio' },
]

export function SaveCompositionDialog({ open, onOpenChange, onSaved }: Props) {
  const placedObjects = useDesignStore((s) => s.placedObjects)
  const selectedObjectId = useUIStore((s) => s.selectedObjectId)
  const selectedObjectIds = useUIStore((s) => s.selectedObjectIds)
  const user = useAuthStore((s) => s.user)
  const templates = useTemplateStore((s) => s.templates)
  const extractPreset = useTemplateStore((s) => s.extractPreset)
  const extractAssembly = useTemplateStore((s) => s.extractAssembly)
  const saveTemplate = useTemplateStore((s) => s.saveTemplate)
  const editingTemplateId = useUIStore((s) => s.editingTemplateId)
  const setEditingTemplateId = useUIStore((s) => s.setEditingTemplateId)
  const editingTemplate = editingTemplateId ? templates.find(t => t.id === editingTemplateId) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('structures')
  const [tags, setTags] = useState('')
  const [saveAsBuiltin, setSaveAsBuiltin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = user?.role === 'admin'

  const selectedObjects = useMemo(() => {
    const ids = selectedObjectIds.length > 0
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : []
    const selected = placedObjects.filter((obj) => ids.includes(obj.id))
    // When editing a template with no active selection, use all placed objects
    if (selected.length === 0 && editingTemplateId) {
      return placedObjects
    }
    return selected
  }, [placedObjects, selectedObjectId, selectedObjectIds, editingTemplateId])

  const objectCount = selectedObjects.length
  const compositionType = objectCount === 1 ? 'Preset' : 'Assembly'

  // Reset form and auto-capture when dialog opens
  useEffect(() => {
    if (open) {
      setName(editingTemplate?.name ?? '')
      setDescription(editingTemplate?.description ?? '')
      setCategory(editingTemplate?.category ?? 'structures')
      setTags(editingTemplate?.tags.join(', ') ?? '')
      setSaveAsBuiltin(editingTemplate?.visibility === 'builtin')
      setSaving(false)
      setScreenshots([])
      setPrimaryIndex(0)
      setCapturing(false)
      // Auto-capture initial screenshot from 3D view
      capture3DScreenshot()
        .then((dataUrl) => setScreenshots([dataUrl]))
        .catch(() => {
          // 3D view may not be active — screenshot skipped
        })
    }
  }, [open, editingTemplate])

  const handleCapture = async () => {
    setCapturing(true)
    try {
      const dataUrl = await capture3DScreenshot()
      setScreenshots((prev) => [...prev, dataUrl])
    } catch {
      // 3D view may not be active
    } finally {
      setCapturing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScreenshots((prev) => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index))
    if (primaryIndex >= index && primaryIndex > 0) {
      setPrimaryIndex(primaryIndex - 1)
    }
  }

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

      // If editing an existing template, preserve its ID
      if (editingTemplateId) {
        template.id = editingTemplateId
      }

      // Upload screenshots to Supabase Storage + save to template_images table
      if (screenshots.length > 0) {
        try {
          // Upload primary first
          const primary = await uploadAndSaveTemplateImage(
            template.id, screenshots[primaryIndex], true, 0,
          )
          template.thumbnailUrl = primary.url

          // Upload remaining screenshots
          let sortOrder = 1
          for (let i = 0; i < screenshots.length; i++) {
            if (i !== primaryIndex) {
              await uploadAndSaveTemplateImage(
                template.id, screenshots[i], false, sortOrder++,
              )
            }
          }
        } catch {
          // Storage may not be enabled - save without images
          console.warn('Failed to upload screenshots - saving without images')
        }
      }

      await saveTemplate(template, user.id)
      setEditingTemplateId(null)
      onOpenChange(false)
      toast.success('Template saved')
      onSaved?.()
    } catch (err) {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTemplateId ? 'Save Template' : 'Save as Template'}</DialogTitle>
          <DialogDescription>
            Saving {objectCount} {objectCount === 1 ? 'object' : 'objects'} as{' '}
            {compositionType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Screenshot gallery */}
          <div className="space-y-2">
            <Label>Screenshots</Label>
            <div className="flex gap-2 flex-wrap">
              {screenshots.map((src, i) => (
                <div
                  key={i}
                  className={`relative group cursor-pointer rounded border-2 overflow-hidden ${
                    i === primaryIndex ? 'border-primary' : 'border-muted'
                  }`}
                  onClick={() => setPrimaryIndex(i)}
                >
                  <img src={src} alt={`Screenshot ${i + 1}`} className="w-20 h-14 object-cover" />
                  {i === primaryIndex && (
                    <div className="absolute top-0.5 left-0.5">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                    </div>
                  )}
                  <button
                    className="absolute top-0.5 right-0.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    onClick={(e) => { e.stopPropagation(); handleRemoveScreenshot(i) }}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-14 w-10"
                onClick={handleCapture}
                disabled={capturing}
                title="Capture from 3D view"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-14 w-10"
                onClick={() => fileInputRef.current?.click()}
                title="Upload image file"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            {screenshots.length > 1 && (
              <p className="text-xs text-muted-foreground">Click to set primary thumbnail</p>
            )}
          </div>

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
