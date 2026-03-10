import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useDesignStore } from '@/store/designStore'
import { useHistoryStore } from '@/store/historyStore'
import { useDesignIO } from './useDesignIO'
import { ToolMode } from '@/types/tools'
import { cellSizeFt } from '@/utils/gridHelpers'

export function useKeyboardShortcuts() {
  const { saveDesign } = useDesignIO()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const ctrl = e.ctrlKey || e.metaKey

      // Undo
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        useHistoryStore.getState().undo()
        return
      }

      // Redo
      if (ctrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        useHistoryStore.getState().redo()
        return
      }

      // Save
      if (ctrl && e.key === 's') {
        e.preventDefault()
        saveDesign()
        return
      }

      // Copy selected object
      if (ctrl && e.key === 'c') {
        const selectedId = useUIStore.getState().selectedObjectId
        if (selectedId) {
          const obj = useDesignStore.getState().placedObjects.find(o => o.id === selectedId)
          if (obj) {
            e.preventDefault()
            useUIStore.getState().copyObject(obj)
            useUIStore.getState().setStatusMessage('Copied ' + (obj.type))
          }
        }
        return
      }

      // Paste copied object (offset 2ft from original)
      if (ctrl && e.key === 'v') {
        const clip = useUIStore.getState().clipboard
        if (clip) {
          e.preventDefault()
          const ds = useDesignStore.getState()
          const step = cellSizeFt(ds.gridSettings.increment)
          // Place offset from the selected object, or at a default position
          const selectedId = useUIStore.getState().selectedObjectId
          const selected = selectedId ? ds.placedObjects.find(o => o.id === selectedId) : null
          const baseX = selected ? selected.position[0] + step * 2 : step * 2
          const baseZ = selected ? selected.position[2] + step * 2 : step * 2

          const newId = crypto.randomUUID()
          useHistoryStore.getState().pushSnapshot()
          ds.addPlacedObject({
            id: newId,
            type: clip.type,
            position: [baseX, 0, baseZ],
            rotation: [...clip.rotation],
            scale: [...clip.scale],
            size: { ...clip.size },
            customProps: clip.customProps ? { ...clip.customProps } : undefined,
          })
          useUIStore.getState().setSelectedObjectId(newId)
          useUIStore.getState().setStatusMessage('Pasted ' + clip.type)
        }
        return
      }

      // Tool shortcuts
      const toolMap: Record<string, ToolMode> = {
        v: ToolMode.Pointer,
        b: ToolMode.Brush,
        r: ToolMode.Rectangle,
        c: ToolMode.Circle,
        l: ToolMode.Line,
        p: ToolMode.Polygon,
        e: ToolMode.Eraser,
      }

      if (!ctrl && toolMap[e.key.toLowerCase()]) {
        useUIStore.getState().setActiveTool(toolMap[e.key.toLowerCase()])
        return
      }

      // Delete selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrl) {
        const selectedId = useUIStore.getState().selectedObjectId
        if (selectedId) {
          e.preventDefault()
          useHistoryStore.getState().pushSnapshot()
          useDesignStore.getState().removePlacedObject(selectedId)
          useUIStore.getState().setSelectedObjectId(null)
          return
        }
      }

      // Arrow keys to move selected object
      if (!ctrl && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const selectedId = useUIStore.getState().selectedObjectId
        if (selectedId) {
          e.preventDefault()
          const ds = useDesignStore.getState()
          const obj = ds.placedObjects.find(o => o.id === selectedId)
          if (obj) {
            const step = cellSizeFt(ds.gridSettings.increment)
            const [x, y, z] = obj.position
            let nx = x, nz = z
            if (e.key === 'ArrowLeft') nx -= step
            if (e.key === 'ArrowRight') nx += step
            if (e.key === 'ArrowUp') nz -= step
            if (e.key === 'ArrowDown') nz += step
            useHistoryStore.getState().pushSnapshot()
            ds.updatePlacedObject(selectedId, { position: [nx, y, nz] })
          }
          return
        }
      }

      // Fill mode toggle
      if (!ctrl && e.key.toLowerCase() === 'f') {
        const current = useUIStore.getState().fillMode
        useUIStore.getState().setFillMode(current === 'fill' ? 'outline' : 'fill')
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveDesign])
}
