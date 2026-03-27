import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useTemplateStore } from '@/store/templateStore'
import { useAuthStore } from '@/store/authStore'
import { useTabStore } from '@/store/tabStore'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Package, Layers, Loader2, Inbox, Image, Pencil, Trash2 } from 'lucide-react'
import type { Template, WidgetPreset, WidgetAssembly } from '@/types/templates'

function matchesSearch(template: Template, query: string): boolean {
  const q = query.toLowerCase()
  return (
    template.name.toLowerCase().includes(q) ||
    template.tags.some(t => t.toLowerCase().includes(q))
  )
}

function TemplateCard({
  template,
  dragDataType,
  onEdit,
  onDelete,
  canEdit,
}: {
  template: Template
  dragDataType: string
  onEdit: () => void
  onDelete: () => void
  canEdit: boolean
}) {
  return (
    <div
      className="group relative flex gap-2 rounded-md border bg-card p-2 text-xs hover:bg-accent
                 transition-colors cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(dragDataType, template.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
    >
      {/* Thumbnail or placeholder */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
        {template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <Image className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate font-semibold">{template.name}</span>
        </div>
        <Badge variant="secondary" className="mt-0.5 text-[9px] px-1 py-0">
          {template.category}
        </Badge>
        {template.description && (
          <p className="mt-0.5 truncate text-muted-foreground">
            {template.description}
          </p>
        )}
      </div>

      {/* Edit/Delete actions - shown on hover */}
      {canEdit && (
        <div className="absolute right-1 top-1 hidden group-hover:flex gap-0.5">
          <button
            className="flex h-5 w-5 items-center justify-center rounded bg-muted hover:bg-primary hover:text-primary-foreground"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            title="Edit in canvas"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="flex h-5 w-5 items-center justify-center rounded bg-muted hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete template"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function TemplateGallery() {
  const loading = useTemplateStore((s) => s.loading)
  const templates = useTemplateStore((s) => s.templates)
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate)
  const createFromPreset = useTemplateStore((s) => s.createFromPreset)
  const createFromAssembly = useTemplateStore((s) => s.createFromAssembly)
  const user = useAuthStore((s) => s.user)
  const presets = useMemo(() => templates.filter(t => t.kind === 'preset'), [templates])
  const assemblies = useMemo(() => templates.filter(t => t.kind === 'assembly'), [templates])

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const handleEdit = (template: Template) => {
    // Open template in a dedicated editing tab
    let objects: import('@/types/design').PlacedObject3D[]

    if (template.kind === 'preset') {
      const preset = template as WidgetPreset
      const obj = createFromPreset(preset, [5, 0, 5])
      objects = [obj]
    } else {
      const assembly = template as WidgetAssembly
      objects = createFromAssembly(assembly, [10, 0, 10])
    }

    useTabStore.getState().openTemplateEditTab(template.id, objects, template.name)
  }

  const handleDelete = async (template: Template) => {
    if (!user) return
    const isBuiltin = template.visibility === 'builtin'
    if (!isBuiltin || user.role === 'admin') {
      try {
        await deleteTemplate(template.id, user.id, isBuiltin)
        toast.success('Template deleted')
      } catch {
        toast.error('Failed to delete template')
      }
    }
  }

  // Collect unique categories from all templates
  const categories = useMemo(() => {
    const all = [...presets, ...assemblies]
    return [...new Set(all.map(t => t.category))].sort()
  }, [presets, assemblies])

  // Filter helpers
  const filterTemplates = <T extends Template>(items: T[]): T[] =>
    items.filter(t => {
      if (search && !matchesSearch(t, search)) return false
      if (activeCategory && t.category !== activeCategory) return false
      return true
    })

  const filteredPresets = useMemo(() => filterTemplates(presets), [presets, search, activeCategory])
  const filteredAssemblies = useMemo(() => filterTemplates(assemblies), [assemblies, search, activeCategory])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (presets.length === 0 && assemblies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <Inbox className="h-8 w-8" />
        <span className="text-xs">No templates yet</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <Input
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-7 text-xs"
      />

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            className="h-5 px-1.5 text-[9px]"
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              className="h-5 px-1.5 text-[9px]"
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Template sections */}
      <Accordion
        type="multiple"
        defaultValue={['presets', 'assemblies']}
        className="space-y-0"
      >
        {/* Presets */}
        {filteredPresets.length > 0 && (
          <AccordionItem value="presets" className="border-b-0">
            <AccordionTrigger className="py-1.5 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Presets ({filteredPresets.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-1.5">
                {filteredPresets.map((preset) => (
                  <TemplateCard
                    key={preset.id}
                    template={preset}
                    dragDataType="application/preset-id"
                    onEdit={() => handleEdit(preset)}
                    onDelete={() => handleDelete(preset)}
                    canEdit={preset.visibility === 'user' || user?.role === 'admin'}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Assemblies */}
        {filteredAssemblies.length > 0 && (
          <AccordionItem value="assemblies" className="border-b-0">
            <AccordionTrigger className="py-1.5 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Assemblies ({filteredAssemblies.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-1.5">
                {filteredAssemblies.map((assembly) => (
                  <TemplateCard
                    key={assembly.id}
                    template={assembly}
                    dragDataType="application/assembly-id"
                    onEdit={() => handleEdit(assembly)}
                    onDelete={() => handleDelete(assembly)}
                    canEdit={assembly.visibility === 'user' || user?.role === 'admin'}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* No results after filtering */}
      {filteredPresets.length === 0 && filteredAssemblies.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
          <span className="text-xs">No matching templates</span>
        </div>
      )}
    </div>
  )
}
