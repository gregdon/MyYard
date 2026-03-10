import { useUIStore } from '@/store/uiStore'
import { useDesignStore } from '@/store/designStore'

export function AppFooter() {
  const statusMessage = useUIStore((s) => s.statusMessage)
  const cursorCell = useUIStore((s) => s.cursorCell)
  const zoomLevel = useUIStore((s) => s.zoomLevel)
  const gridSettings = useDesignStore((s) => s.gridSettings)

  return (
    <footer className="flex h-8 items-center justify-between border-t bg-muted/30 px-4 text-xs text-muted-foreground">
      <div className="min-w-0 truncate">
        {statusMessage || 'Ready'}
      </div>

      <div className="flex items-center gap-4">
        {cursorCell && (
          <span>
            Row {cursorCell.row}, Col {cursorCell.col}
            {' | '}
            {gridSettings.widthFt}ft x {gridSettings.heightFt}ft
            {' @ '}
            {gridSettings.increment === '1ft' ? "1'" : '6"'}
          </span>
        )}
        <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
      </div>
    </footer>
  )
}
