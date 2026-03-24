import { useRef, useEffect, useCallback } from 'react'
import { useDesignStore } from '@/store/designStore'
import { useUIStore } from '@/store/uiStore'
import { useHistoryStore } from '@/store/historyStore'
import { MATERIAL_DEFS } from '@/constants/materials'
import { Material } from '@/types/materials'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import { cellSizeFt } from '@/utils/gridHelpers'
import { ToolMode } from '@/types/tools'
import {
  drawGrid,
  drawGridLines,
  drawRulerMarkers,
  drawHoverHighlight,
  drawShapePreview,
  drawSmoothEllipseOverlay,
  drawPlacedObjects,
  drawMarqueeRect,
  drawScrollbars,
  getScrollbarGeometry,
} from './gridRenderer'
import {
  createInteractionManager,
  centerViewport,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleDoubleClick,
  handleKeyDown,
  handleKeyUp,
} from './canvasInteraction'

export function Canvas2DView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mgrRef = useRef(createInteractionManager())
  const rafRef = useRef<number>(0)
  const scrollbarDrag = useRef<{ axis: 'h' | 'v'; startMouse: number; startOffset: number } | null>(null)
  const activeTool = useUIStore((s) => s.activeTool)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const mgr = mgrRef.current
    if (!mgr.dirty) {
      rafRef.current = requestAnimationFrame(render)
      return
    }

    mgr.dirty = false

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    ctx.save()
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Get store state
    const state = useDesignStore.getState()
    const uiState = useUIStore.getState()

    // Sync custom color into material defs for rendering
    MATERIAL_DEFS[Material.Custom].color = uiState.customColor

    // Draw cells
    drawGrid(ctx, state.grid, state.rows, state.cols, mgr.viewport, w, h)

    // Draw grid lines, border, and ruler markers
    drawGridLines(ctx, state.rows, state.cols, mgr.viewport, w, h, state.gridSettings.increment)
    drawRulerMarkers(ctx, state.rows, state.cols, mgr.viewport, w, h, state.gridSettings.increment)

    // Draw placed objects
    drawPlacedObjects(ctx, state.placedObjects, mgr.viewport, state.gridSettings.increment, uiState.selectedObjectId, uiState.selectedObjectIds)

    // Draw shape preview
    if (mgr.previewCells.length > 0) {
      const color = MATERIAL_DEFS[uiState.activeMaterial].color
      drawShapePreview(ctx, mgr.previewCells, color, mgr.viewport)

      // Smooth ellipse overlay while drawing circles
      if (uiState.activeTool === ToolMode.Circle && mgr.state.type === 'drawing_shape') {
        drawSmoothEllipseOverlay(
          ctx, mgr.state.startCell, mgr.state.currentCell,
          color, mgr.viewport, uiState.fillMode,
        )
      }
    }

    // Draw hover highlight (only for drawing tools, not pointer)
    if (uiState.activeTool !== ToolMode.Pointer) {
      drawHoverHighlight(ctx, mgr.hoverCell, mgr.viewport)
    }

    // Scrollbar indicators
    drawScrollbars(ctx, state.rows, state.cols, mgr.viewport, w, h)

    // Marquee selection rectangle
    if (mgr.marqueeRect) {
      drawMarqueeRect(ctx, mgr.marqueeRect)
    }

    ctx.restore()

    // Update footer info
    uiState.setCursorCell(mgr.hoverCell)
    uiState.setZoomLevel(mgr.viewport.zoom)

    rafRef.current = requestAnimationFrame(render)
  }, [])

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    mgrRef.current.dirty = true
  }, [])

  useEffect(() => {
    resizeCanvas()

    // Center grid in canvas on initial load
    const canvas = canvasRef.current
    if (canvas) {
      const dpr = window.devicePixelRatio || 1
      const { rows, cols } = useDesignStore.getState()
      centerViewport(mgrRef.current, rows, cols, canvas.width / dpr, canvas.height / dpr)
    }

    const observer = new ResizeObserver(resizeCanvas)
    if (containerRef.current) observer.observe(containerRef.current)

    // Start render loop
    rafRef.current = requestAnimationFrame(render)

    // Subscribe to store changes to mark dirty
    const unsub1 = useDesignStore.subscribe(
      (s) => s.gridVersion,
      () => { mgrRef.current.dirty = true }
    )
    const unsub2 = useUIStore.subscribe(
      (s) => s.activeMaterial,
      () => { mgrRef.current.dirty = true }
    )
    const unsub3 = useUIStore.subscribe(
      (s) => s.customColor,
      () => { mgrRef.current.dirty = true }
    )
    const unsub4 = useUIStore.subscribe(
      (s) => s.selectedObjectId,
      () => { mgrRef.current.dirty = true }
    )
    const unsub4b = useUIStore.subscribe(
      (s) => s.selectedObjectIds,
      () => { mgrRef.current.dirty = true }
    )
    // Re-center viewport when grid dimensions change (e.g. switching increment)
    const unsub5 = useDesignStore.subscribe(
      (s) => `${s.rows}:${s.cols}`,
      () => {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const { rows, cols } = useDesignStore.getState()
        centerViewport(mgrRef.current, rows, cols, rect.width, rect.height)
      }
    )

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub4b()
      unsub5()
    }
  }, [render, resizeCanvas])

  // Event handlers
  const getStoreRefs = () => {
    const ds = useDesignStore.getState()
    const ui = useUIStore.getState()
    return {
      tool: ui.activeTool,
      material: ui.activeMaterial,
      fillMode: ui.fillMode,
      rows: ds.rows,
      cols: ds.cols,
      setCellMaterial: ds.setCellMaterial,
      fillCells: ds.fillCells,
      pushSnapshot: useHistoryStore.getState().pushSnapshot,
      placedObjects: ds.placedObjects,
      increment: ds.gridSettings.increment,
      updatePlacedObject: ds.updatePlacedObject,
      setSelectedObjectId: ui.setSelectedObjectId,
      selectedObjectId: ui.selectedObjectId,
      selectedObjectIds: ui.selectedObjectIds,
      setSelectedObjectIds: ui.setSelectedObjectIds,
      toggleObjectSelection: ui.toggleObjectSelection,
    }
  }

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    handleWheel(mgrRef.current, e.nativeEvent)
  }, [])

  /** Get canvas logical dimensions */
  const getCanvasSize = () => {
    const canvas = canvasRef.current
    if (!canvas) return { w: 0, h: 0 }
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const refs = getStoreRefs()
    const { w, h } = getCanvasSize()
    const mgr = mgrRef.current

    // Check scrollbar hit first (expanded hit area for usability)
    if (e.button === 0) {
      const geo = getScrollbarGeometry(refs.rows, refs.cols, mgr.viewport, w, h)
      const mx = e.nativeEvent.offsetX
      const my = e.nativeEvent.offsetY
      const hitPad = 4

      if (geo.horizontal) {
        const hb = geo.horizontal
        if (mx >= hb.x - hitPad && mx <= hb.x + hb.width + hitPad &&
            my >= hb.y - hitPad && my <= hb.y + hb.height + hitPad) {
          scrollbarDrag.current = { axis: 'h', startMouse: mx, startOffset: mgr.viewport.offsetX }
          return
        }
        // Click on horizontal track (but not thumb) — jump to position
        if (my >= hb.y - hitPad && my <= hb.y + hb.height + hitPad) {
          const trackW = w - geo.barPadding * 2
          const ratio = Math.max(0, Math.min(1, (mx - geo.barPadding - hb.width / 2) / (trackW - hb.width)))
          const scrollRange = geo.totalW - w
          mgr.viewport.offsetX = ratio * scrollRange - geo.margin
          mgr.dirty = true
          scrollbarDrag.current = { axis: 'h', startMouse: mx, startOffset: mgr.viewport.offsetX }
          return
        }
      }

      if (geo.vertical) {
        const vb = geo.vertical
        if (mx >= vb.x - hitPad && mx <= vb.x + vb.width + hitPad &&
            my >= vb.y - hitPad && my <= vb.y + vb.height + hitPad) {
          scrollbarDrag.current = { axis: 'v', startMouse: my, startOffset: mgr.viewport.offsetY }
          return
        }
        // Click on vertical track — jump to position
        if (mx >= vb.x - hitPad && mx <= vb.x + vb.width + hitPad) {
          const trackH = h - geo.barPadding * 2
          const ratio = Math.max(0, Math.min(1, (my - geo.barPadding - vb.height / 2) / (trackH - vb.height)))
          const scrollRange = geo.totalH - h
          mgr.viewport.offsetY = ratio * scrollRange - geo.margin
          mgr.dirty = true
          scrollbarDrag.current = { axis: 'v', startMouse: my, startOffset: mgr.viewport.offsetY }
          return
        }
      }
    }

    handleMouseDown(
      mgrRef.current,
      { button: e.nativeEvent.button, offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY, shiftKey: e.shiftKey },
      refs.tool, refs.material, refs.fillMode,
      refs.rows, refs.cols,
      refs.setCellMaterial, refs.pushSnapshot,
      refs.placedObjects, refs.increment,
      refs.setSelectedObjectId,
      refs.selectedObjectId,
      refs.selectedObjectIds,
      refs.setSelectedObjectIds,
      refs.toggleObjectSelection,
    )
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle scrollbar dragging
    if (scrollbarDrag.current) {
      const refs = getStoreRefs()
      const { w, h } = getCanvasSize()
      const mgr = mgrRef.current
      const geo = getScrollbarGeometry(refs.rows, refs.cols, mgr.viewport, w, h)
      const drag = scrollbarDrag.current

      if (drag.axis === 'h' && geo.horizontal) {
        const trackW = w - geo.barPadding * 2
        const thumbW = geo.horizontal.width
        const scrollRange = geo.totalW - w
        const mouseDelta = e.nativeEvent.offsetX - drag.startMouse
        const scrollPerPx = scrollRange / (trackW - thumbW)
        mgr.viewport.offsetX = drag.startOffset + mouseDelta * scrollPerPx
        mgr.dirty = true
      } else if (drag.axis === 'v' && geo.vertical) {
        const trackH = h - geo.barPadding * 2
        const thumbH = geo.vertical.height
        const scrollRange = geo.totalH - h
        const mouseDelta = e.nativeEvent.offsetY - drag.startMouse
        const scrollPerPx = scrollRange / (trackH - thumbH)
        mgr.viewport.offsetY = drag.startOffset + mouseDelta * scrollPerPx
        mgr.dirty = true
      }
      return
    }

    const refs = getStoreRefs()
    handleMouseMove(
      mgrRef.current, e.nativeEvent,
      refs.tool, refs.material, refs.fillMode,
      refs.rows, refs.cols,
      refs.setCellMaterial,
      refs.increment, refs.updatePlacedObject,
    )
  }, [])

  const onMouseUp = useCallback(() => {
    if (scrollbarDrag.current) {
      scrollbarDrag.current = null
      return
    }
    const refs = getStoreRefs()
    handleMouseUp(
      mgrRef.current,
      refs.tool, refs.material, refs.fillMode,
      refs.fillCells,
      refs.placedObjects, refs.increment,
      refs.setSelectedObjectIds,
    )
  }, [])

  const onDblClick = useCallback(() => {
    const refs = getStoreRefs()
    handleDoubleClick(mgrRef.current, refs.material, refs.fillMode, refs.fillCells)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/prefab-type')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    const prefabType = e.dataTransfer.getData('application/prefab-type')
    if (!prefabType) return
    e.preventDefault()

    const prefab = PREFAB_CATALOG.find(p => p.type === prefabType)
    if (!prefab) return

    const mgr = mgrRef.current
    const cellSize = 20 * mgr.viewport.zoom
    const cellFt = cellSizeFt(useDesignStore.getState().gridSettings.increment)

    // Convert drop position to world coordinates (logical/CSS pixels)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top
    const worldCol = (canvasX + mgr.viewport.offsetX) / cellSize
    const worldRow = (canvasY + mgr.viewport.offsetY) / cellSize

    // Snap to grid
    const snapCol = Math.round(worldCol)
    const snapRow = Math.round(worldRow)

    useHistoryStore.getState().pushSnapshot()
    const newId = crypto.randomUUID()
    useDesignStore.getState().addPlacedObject({
      id: newId,
      type: prefabType,
      position: [snapCol * cellFt, 0, snapRow * cellFt],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      size: { ...prefab.defaultSize },
    })
    useUIStore.getState().setSelectedObjectId(newId)

    mgr.dirty = true
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => handleKeyDown(mgrRef.current, e.key)
    const onKeyU = (e: KeyboardEvent) => handleKeyUp(mgrRef.current, e.key)
    const onZoom = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const mgr = mgrRef.current
      const canvas = canvasRef.current
      if (!canvas) return

      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      // Zoom toward center (same math as handleWheel)
      const cx = w / 2
      const cy = h / 2
      const factor = detail === 'in' ? 1.25 : 0.8
      const newZoom = Math.max(0.1, Math.min(10, mgr.viewport.zoom * factor))
      const scale = newZoom / mgr.viewport.zoom

      const worldX = cx + mgr.viewport.offsetX
      const worldY = cy + mgr.viewport.offsetY
      mgr.viewport.offsetX = worldX * scale - cx
      mgr.viewport.offsetY = worldY * scale - cy
      mgr.viewport.zoom = newZoom
      mgr.dirty = true
    }
    const onCenter = () => {
      const mgr = mgrRef.current
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      // Use container rect (always current) rather than canvas.width which may be stale
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const { rows, cols } = useDesignStore.getState()
      centerViewport(mgr, rows, cols, rect.width, rect.height)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyU)
    window.addEventListener('canvas-zoom', onZoom)
    window.addEventListener('canvas-center', onCenter)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyU)
      window.removeEventListener('canvas-zoom', onZoom)
      window.removeEventListener('canvas-center', onCenter)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden bg-neutral-100"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <canvas
        ref={canvasRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDblClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`block ${activeTool === ToolMode.Pointer ? 'cursor-default' : 'cursor-crosshair'}`}
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
