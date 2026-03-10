import { PREFAB_CATALOG, PREFAB_CATEGORIES } from '@/constants/prefabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function WidgetPalette() {
  return (
    <Accordion
      type="multiple"
      defaultValue={PREFAB_CATEGORIES.map(c => c.id)}
      className="space-y-0"
    >
      {PREFAB_CATEGORIES.map((cat) => {
        const items = PREFAB_CATALOG.filter(p => p.category === cat.id)
        if (items.length === 0) return null

        return (
          <AccordionItem key={cat.id} value={cat.id} className="border-b-0">
            <AccordionTrigger className="py-1.5 text-xs font-semibold">
              {cat.label}
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((prefab) => (
                  <Tooltip key={prefab.type}>
                    <TooltipTrigger asChild>
                      <button
                        className="flex h-14 flex-col items-center justify-center gap-1 rounded-md border bg-card
                                   text-xs hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/prefab-type', prefab.type)
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                      >
                        <div
                          className="h-5 w-5 rounded"
                          style={{ backgroundColor: prefab.color }}
                        />
                        <span className="text-[9px] leading-tight text-muted-foreground">
                          {prefab.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {prefab.label} ({prefab.defaultSize.widthFt}x{prefab.defaultSize.depthFt}ft)
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
