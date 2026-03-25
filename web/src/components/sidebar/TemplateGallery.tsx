import { useState, useMemo } from 'react'
import { useTemplateStore } from '@/store/templateStore'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Package, Layers, Loader2, Inbox, Image } from 'lucide-react'
import type { Template } from '@/types/templates'

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
}: {
  template: Template
  dragDataType: string
}) {
  return (
    <div
      className="flex gap-2 rounded-md border bg-card p-2 text-xs hover:bg-accent
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
    </div>
  )
}

export function TemplateGallery() {
  const loading = useTemplateStore((s) => s.loading)
  const presets = useTemplateStore((s) => s.presets())
  const assemblies = useTemplateStore((s) => s.assemblies())

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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
