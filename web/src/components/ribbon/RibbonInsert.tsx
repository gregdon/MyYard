import { RibbonGroup } from './RibbonGroup'
import { PREFAB_CATALOG, PREFAB_CATEGORIES } from '@/constants/prefabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function RibbonInsert() {
  return (
    <div className="flex items-stretch">
      {PREFAB_CATEGORIES.map((cat, i) => {
        const items = PREFAB_CATALOG.filter((p) => p.category === cat.id)
        if (items.length === 0) return null

        return (
          <RibbonGroup
            key={cat.id}
            label={cat.label}
            hideSeparator={i === PREFAB_CATEGORIES.length - 1}
          >
            <div className="flex flex-wrap gap-1 max-w-[300px]">
              {items.map((prefab) => (
                <Tooltip key={prefab.type}>
                  <TooltipTrigger asChild>
                    <button
                      className="flex h-10 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-md border bg-card
                                 px-1.5 text-xs hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/prefab-type', prefab.type)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                    >
                      <div
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: prefab.color }}
                      />
                      <span className="text-[9px] leading-tight text-muted-foreground whitespace-nowrap">
                        {prefab.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {prefab.label} ({prefab.defaultSize.widthFt}&times;{prefab.defaultSize.depthFt}ft)
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </RibbonGroup>
        )
      })}
    </div>
  )
}
