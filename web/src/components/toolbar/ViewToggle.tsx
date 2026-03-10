import { useUIStore } from '@/store/uiStore'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ViewMode } from '@/types/tools'

export function ViewToggle() {
  const viewMode = useUIStore((s) => s.viewMode)
  const setViewMode = useUIStore((s) => s.setViewMode)

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={viewMode}
      onValueChange={(val) => {
        if (!val) return
        setViewMode(val as ViewMode)
        if (val === '2d') {
          // Re-center the 2D canvas when switching back from 3D
          // Delay to allow the canvas container to become visible and resize
          requestAnimationFrame(() => {
            setTimeout(() => window.dispatchEvent(new Event('canvas-center')), 100)
          })
        }
      }}
      className="flex"
    >
      <ToggleGroupItem value="2d" className="h-7 px-3 text-xs">
        2D
      </ToggleGroupItem>
      <ToggleGroupItem value="3d" className="h-7 px-3 text-xs">
        3D
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
