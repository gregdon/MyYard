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
import { Paintbrush, Palette, Box, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEffect } from 'react'

const COLLAPSE_BREAKPOINT = 768

export function SideNav() {
  const collapsed = useUIStore((s) => s.sideNavCollapsed)
  const toggleSideNav = useUIStore((s) => s.toggleSideNav)
  const setSideNavCollapsed = useUIStore((s) => s.setSideNavCollapsed)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COLLAPSE_BREAKPOINT}px)`)
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSideNavCollapsed(e.matches)
    }
    handleChange(mq)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [setSideNavCollapsed])

  return (
    <div
      className="relative flex h-full shrink-0 flex-col border-r bg-card transition-all duration-200"
      style={{ width: collapsed ? '40px' : '260px' }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={toggleSideNav}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronsRight className="h-3 w-3" />
          : <ChevronsLeft className="h-3 w-3" />}
      </button>

      {/* Collapsed icon strip with flyout popovers */}
      {collapsed && (
        <div className="flex flex-col items-center gap-3 pt-3 px-1">
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
      )}
    </div>
  )
}
