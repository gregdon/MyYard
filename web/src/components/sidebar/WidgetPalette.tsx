import { PREFAB_CATALOG, PREFAB_CATEGORIES } from '@/constants/prefabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Grid3x3,
  Warehouse,
  PanelTop,
  Tv,
  PanelLeft,
  Columns3,
  Home,
  Square,
  Fence,
  BrickWallFire,
  CookingPot,
  UtensilsCrossed,
  FlameKindling,
  Egg,
  Beef,
  Table,
  Armchair,
  Sofa,
  RockingChair,
  Coffee,
  Lamp,
  TreeDeciduous,
  Shrub,
  Flower2,
  Flower,
  Mountain,
  Layers,
  Leaf,
  Flame,
  Droplets,
  Box,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const WIDGET_ICONS: Record<string, LucideIcon> = {
  pergola: Grid3x3,
  patio_cover: Warehouse,
  pony_wall: PanelTop,
  tv_wall: Tv,
  wall: PanelLeft,
  post: Columns3,
  roof: Home,
  concrete_slab: Square,
  fence_section: Fence,
  fireplace: BrickWallFire,
  kitchen_straight: CookingPot,
  kitchen_l_shaped: UtensilsCrossed,
  bar: Coffee,
  grill_builtin_small: FlameKindling,
  grill_builtin_large: FlameKindling,
  smoker: Egg,
  dining_table: Table,
  chair: Armchair,
  club_chair: RockingChair,
  lounge_set: Sofa,
  couch: Sofa,
  sectional: Sofa,
  end_table: Lamp,
  coffee_table: Coffee,
  fire_pit: Flame,
  planter_box: Flower,
  planter_l_shaped: Flower2,
  rock_bed: Mountain,
  tree_small: TreeDeciduous,
  shrub: Shrub,
  flower_bed: Droplets,
  retaining_wall: Layers,
  turf: Leaf,
}

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
                {items.map((prefab) => {
                  const Icon = WIDGET_ICONS[prefab.type] ?? Box
                  const isSmoker = prefab.type === 'smoker'
                  const iconColor = isSmoker ? '#2d7a2d' : prefab.color
                  return (
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
                          <Icon
                            className="h-5 w-5"
                            style={{ color: iconColor }}
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
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
