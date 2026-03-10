import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolSelector } from '@/components/sidebar/ToolSelector'
import { MaterialPalette } from '@/components/sidebar/MaterialPalette'
import { WidgetPalette } from '@/components/sidebar/WidgetPalette'
import { Paintbrush, Palette, Box } from 'lucide-react'

export function SideNav() {
  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col border-r bg-card">
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={['tools', 'materials']} className="px-3 py-2">
          <AccordionItem value="tools">
            <AccordionTrigger className="py-2 text-sm">
              <span className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4" />
                Drawing Tools
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ToolSelector />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="materials">
            <AccordionTrigger className="py-2 text-sm">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Materials
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <MaterialPalette />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="widgets">
            <AccordionTrigger className="py-2 text-sm">
              <span className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Widgets
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <WidgetPalette />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  )
}
