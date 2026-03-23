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
import { useUIStore } from '@/store/uiStore'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function SideNav() {
  const collapsed = useUIStore((s) => s.sideNavCollapsed)

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Collapsed icon strip with flyout popovers */}
      {collapsed && (
        <div className="flex flex-col items-center gap-1 pt-2 px-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <Paintbrush className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-2">
              <p className="mb-2 text-sm font-medium">Drawing Tools</p>
              <ToolSelector />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-2">
              <p className="mb-2 text-sm font-medium">Materials</p>
              <MaterialPalette />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <Box className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-2">
              <p className="mb-2 text-sm font-medium">Widgets</p>
              <WidgetPalette />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Expanded content */}
      {!collapsed && (
        <>
          {/* Sidebar header */}
          <div className="border-b px-3 py-2">
            <span className="text-sm font-semibold">Tools</span>
          </div>
          <ScrollArea className="min-h-0 flex-1">
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
        </>
      )}
    </div>
  )
}
