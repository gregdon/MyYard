import { useDesignStore } from '@/store/designStore'
import { useUIStore } from '@/store/uiStore'
import { useHistoryStore } from '@/store/historyStore'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import type { PropDef } from '@/types/prefabs'
import { cn } from '@/lib/utils'
import { Trash2, Pencil, Check } from 'lucide-react'
import { useState } from 'react'

export function ObjectPropertiesPanel() {
  const selectedObjectId = useUIStore((s) => s.selectedObjectId)
  const setSelectedObjectId = useUIStore((s) => s.setSelectedObjectId)
  const placedObjects = useDesignStore((s) => s.placedObjects)
  const updatePlacedObject = useDesignStore((s) => s.updatePlacedObject)
  const removePlacedObject = useDesignStore((s) => s.removePlacedObject)
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const obj = placedObjects.find(o => o.id === selectedObjectId)
  const prefab = obj ? PREFAB_CATALOG.find(p => p.type === obj.type) : null

  // Build display label for an object — custom name > prefab label + index
  const getObjectLabel = (o: typeof placedObjects[number]) => {
    if (o.name) return o.name
    const p = PREFAB_CATALOG.find(c => c.type === o.type)
    const sameType = placedObjects.filter(x => x.type === o.type)
    const idx = sameType.findIndex(x => x.id === o.id)
    return sameType.length > 1 ? `${p?.label ?? o.type} ${idx + 1}` : (p?.label ?? o.type)
  }

  const startEditing = () => {
    setNameInput(obj?.name ?? '')
    setEditingName(true)
  }

  const commitName = () => {
    if (obj) {
      updatePlacedObject(obj.id, { name: nameInput.trim() || undefined })
    }
    setEditingName(false)
  }

  // Object selector dropdown — always shown when objects exist
  const objectSelector = placedObjects.length > 0 && (
    <div className="space-y-1">
      <label className="text-[10px] font-medium uppercase text-muted-foreground">Select Object</label>
      <select
        value={selectedObjectId ?? ''}
        onChange={(e) => setSelectedObjectId(e.target.value || null)}
        className="h-8 w-full rounded-md border bg-background px-2 text-xs"
      >
        <option value="">— None —</option>
        {placedObjects.map((o) => (
          <option key={o.id} value={o.id}>
            {getObjectLabel(o)}
          </option>
        ))}
      </select>
    </div>
  )

  if (!obj || !prefab) return <div className="space-y-3">{objectSelector}</div>

  const handleSizeChange = (key: 'widthFt' | 'depthFt' | 'heightFt', value: number) => {
    const clamped = Math.max(
      prefab.minSize[key],
      Math.min(prefab.maxSize[key], value)
    )
    updatePlacedObject(obj.id, {
      size: { ...obj.size, [key]: clamped },
    })
  }

  const handlePropChange = (key: string, value: unknown) => {
    const updates: Parameters<typeof updatePlacedObject>[1] = {
      customProps: { [key]: value },
    }

    if (obj.type === 'dining_table' || obj.type === 'end_table' || obj.type === 'coffee_table') {
      const defaults = obj.type === 'end_table'
        ? { shape: 'round', diameter: 20, tableLength: 24, tableWidth: 18, sideLength: 20 }
        : obj.type === 'coffee_table'
          ? { shape: 'rectangle', diameter: 36, tableLength: 48, tableWidth: 24, sideLength: 36 }
          : { shape: 'rectangle', diameter: 48, tableLength: 72, tableWidth: 36, sideLength: 42 }
      const shape = key === 'shape' ? (value as string) : (obj.customProps?.shape as string) ?? defaults.shape
      const diameter = key === 'diameter' ? (value as number) : (obj.customProps?.diameter as number) ?? defaults.diameter
      const tableLength = key === 'tableLength' ? (value as number) : (obj.customProps?.tableLength as number) ?? defaults.tableLength
      const tableWidth = key === 'tableWidth' ? (value as number) : (obj.customProps?.tableWidth as number) ?? defaults.tableWidth
      const sideLength = key === 'sideLength' ? (value as number) : (obj.customProps?.sideLength as number) ?? defaults.sideLength

      if (shape === 'round') {
        const d = diameter / 12
        updates.size = { ...obj.size, widthFt: d, depthFt: d }
      } else if (shape === 'square') {
        const s = sideLength / 12
        updates.size = { ...obj.size, widthFt: s, depthFt: s }
      } else {
        updates.size = { ...obj.size, widthFt: tableLength / 12, depthFt: tableWidth / 12 }
      }
    }

    if (obj.type === 'fire_pit') {
      const shape = key === 'shape' ? (value as string) : (obj.customProps?.shape as string) ?? 'round'
      const diameter = key === 'diameter' ? (value as number) : (obj.customProps?.diameter as number) ?? 48
      const pitLength = key === 'pitLength' ? (value as number) : (obj.customProps?.pitLength as number) ?? 60
      const pitWidth = key === 'pitWidth' ? (value as number) : (obj.customProps?.pitWidth as number) ?? 36
      const sideLength = key === 'sideLength' ? (value as number) : (obj.customProps?.sideLength as number) ?? 48
      const pitHeight = key === 'pitHeight' ? (value as number) : (obj.customProps?.pitHeight as number) ?? 18

      const h = pitHeight / 12
      if (shape === 'round') {
        const d = diameter / 12
        updates.size = { widthFt: d, depthFt: d, heightFt: h }
      } else if (shape === 'square') {
        const s = sideLength / 12
        updates.size = { widthFt: s, depthFt: s, heightFt: h }
      } else {
        updates.size = { widthFt: pitLength / 12, depthFt: pitWidth / 12, heightFt: h }
      }
    }

    if (obj.type === 'post') {
      const postSize = key === 'postSize' ? (value as number) : (obj.customProps?.postSize as number) ?? 6
      const postHeight = key === 'postHeight' ? (value as number) : (obj.customProps?.postHeight as number) ?? 8
      const s = postSize / 12
      updates.size = { widthFt: s, depthFt: s, heightFt: postHeight }
    }

    if (obj.type === 'tree_small' && key === 'treeSize') {
      const sizes: Record<string, { w: number; h: number }> = {
        small: { w: 3, h: 8 },
        medium: { w: 6, h: 15 },
        large: { w: 10, h: 25 },
      }
      const s = sizes[value as string] ?? sizes.small
      updates.size = { widthFt: s.w, depthFt: s.w, heightFt: s.h }
    }

    if (obj.type === 'turf' && key === 'grassHeight') {
      updates.size = { ...obj.size, heightFt: (value as number) / 12 }
    }

    if (obj.type === 'retaining_wall') {
      const wallLength = key === 'wallLength' ? (value as number) : (obj.customProps?.wallLength as number) ?? 120
      const wallHeight = key === 'wallHeight' ? (value as number) : (obj.customProps?.wallHeight as number) ?? 24
      const wallThickness = key === 'wallThickness' ? (value as number) : (obj.customProps?.wallThickness as number) ?? 4
      updates.size = { widthFt: wallLength / 12, depthFt: wallThickness / 12, heightFt: wallHeight / 12 }
    }

    if (obj.type === 'wall' && key === 'shape') {
      const thickness = (obj.customProps?.thickness as number) ?? 1
      if (value === 'straight') {
        updates.size = { ...obj.size, depthFt: thickness }
      } else if (value === 'l_shape' || value === 'u_shape') {
        if (obj.size.depthFt < 4) {
          updates.size = { ...obj.size, depthFt: Math.max(obj.size.widthFt, 8) }
        }
      }
    }

    if ((obj.type === 'planter_box' || obj.type === 'planter_l_shaped') && key === 'planterHeight') {
      updates.size = { ...obj.size, heightFt: (value as number) / 12 }
    }

    if (obj.type === 'rock_bed' && key === 'bedHeight') {
      updates.size = { ...obj.size, heightFt: (value as number) / 12 }
    }

    updatePlacedObject(obj.id, updates)
  }

  const handleDelete = () => {
    pushSnapshot()
    removePlacedObject(obj.id)
    setSelectedObjectId(null)
  }

  const getPropValue = (prop: PropDef) => {
    return obj.customProps?.[prop.key] ?? prop.defaultValue
  }

  return (
    <div className="space-y-4">
      {objectSelector}

      {/* Object header: name + delete */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium uppercase text-muted-foreground">Name</label>
        <div className="flex items-center gap-1.5">
          {editingName ? (
            <>
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
                placeholder={prefab.label}
                className="h-7 flex-1 rounded-md border bg-background px-2 text-xs"
              />
              <button
                onClick={commitName}
                className="rounded p-1 text-primary hover:bg-primary/10"
                aria-label="Save name"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 truncate text-sm font-semibold">
                {getObjectLabel(obj)}
              </span>
              <button
                onClick={startEditing}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                aria-label="Edit name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded p-1 text-destructive hover:bg-destructive/10"
                aria-label="Delete object"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Size controls */}
      {prefab.resizable && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">Size (ft)</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(() => {
              const isKitchen = obj.type === 'kitchen_straight' || obj.type === 'kitchen_l_shaped'
              const isWall = obj.type === 'wall' || obj.type === 'pony_wall' || obj.type === 'tv_wall'
              const hideH = obj.type === 'planter_box' || obj.type === 'planter_l_shaped' || obj.type === 'rock_bed' // height controlled by inch prop
              const wLabel = isKitchen ? 'Hz' : isWall ? 'L' : 'W'
              const dLabel = isKitchen ? 'Vt' : isWall ? 'D' : 'D'
              const hLabel = isKitchen ? 'Ht' : 'H'
              return (
                <>
                  <SizeInput label={wLabel} value={obj.size.widthFt} min={prefab.minSize.widthFt} max={prefab.maxSize.widthFt} onChange={(v) => handleSizeChange('widthFt', v)} />
                  <SizeInput label={dLabel} value={obj.size.depthFt} min={prefab.minSize.depthFt} max={prefab.maxSize.depthFt} onChange={(v) => handleSizeChange('depthFt', v)} />
                  {!hideH && <SizeInput label={hLabel} value={obj.size.heightFt} min={prefab.minSize.heightFt} max={prefab.maxSize.heightFt} onChange={(v) => handleSizeChange('heightFt', v)} />}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Rotation */}
      {prefab.rotatable && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">Rotation</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={360}
              step={15}
              value={((Math.round((obj.rotation[1] * 180) / Math.PI) % 360) + 360) % 360}
              onChange={(e) => {
                const deg = ((Number(e.target.value) % 360) + 360) % 360
                updatePlacedObject(obj.id, { rotation: [0, (deg * Math.PI) / 180, 0] })
              }}
              className="h-7 w-16 rounded-md border bg-background px-1.5 text-center text-xs"
            />
            <span className="text-xs text-muted-foreground">° (or drag on canvas)</span>
          </div>
        </div>
      )}

      {/* Custom props */}
      {prefab.editableProps?.filter((prop) => {
        if ((obj.type === 'kitchen_straight' || obj.type === 'kitchen_l_shaped') &&
          (prop.key === 'eggMounting' || prop.key === 'eggStandSide' || prop.key === 'eggStandHeight' || prop.key === 'eggStandWidth')) {
          return (obj.customProps?.hasEggStand as boolean) ?? false
        }
        if (obj.type === 'dining_table' || obj.type === 'end_table' || obj.type === 'coffee_table') {
          const tableShape = (obj.customProps?.shape as string) ?? 'rectangle'
          if (prop.key === 'diameter') return tableShape === 'round'
          if (prop.key === 'tableLength' || prop.key === 'tableWidth') return tableShape === 'rectangle'
          if (prop.key === 'sideLength') return tableShape === 'square'
          return true
        }
        if (obj.type === 'fire_pit') {
          const pitShape = (obj.customProps?.shape as string) ?? 'round'
          if (prop.key === 'diameter') return pitShape === 'round'
          if (prop.key === 'pitLength' || prop.key === 'pitWidth') return pitShape === 'rectangle'
          if (prop.key === 'sideLength') return pitShape === 'square'
          return true
        }
        if (obj.type === 'tv_wall') {
          if (prop.key === 'tvSize' || prop.key === 'tvVertical' || prop.key === 'tvHorizontal') return (obj.customProps?.hasTV as boolean) ?? true
          return true
        }
        if (obj.type === 'rock_bed') {
          if (prop.key === 'borderColor') return (obj.customProps?.bordered as boolean) ?? false
          return true
        }
        if (obj.type === 'pony_wall' || obj.type === 'planter_box' || obj.type === 'planter_l_shaped') {
          if (prop.key === 'capColor') return (obj.customProps?.capstone as boolean) ?? true
          if (prop.key === 'rockSize' || prop.key === 'rockColor') return (obj.customProps?.fillType as string) === 'river_rock'
          return true
        }
        if (obj.type === 'roof') {
          if (prop.key === 'pitch') return (obj.customProps?.style as string) !== 'flat'
          return true
        }
        if (obj.type === 'fireplace') return true
        if (obj.type === 'patio_cover') {
          if (prop.key === 'roofPitch') return (obj.customProps?.roofStyle as string) !== 'flat'
          if (prop.key === 'ceilingColor') return (obj.customProps?.ceiling as string) === 'tongue_groove'
          if (prop.key === 'fanDiameter') return parseInt((obj.customProps?.fans as string) ?? '0', 10) > 0
          const fanCt = parseInt((obj.customProps?.fans as string) ?? '0', 10)
          if (prop.key === 'fan1Pos') return fanCt >= 1
          if (prop.key === 'fan2Pos') return fanCt >= 2
          if (prop.key === 'fan3Pos') return fanCt >= 3
          return true
        }
        if (obj.type !== 'wall') return true
        const shape = (obj.customProps?.shape as string) ?? 'straight'
        const winCount = (obj.customProps?.windowCount as number) ?? 0
        if (prop.key === 'thickness') return shape !== 'straight'
        if (prop.key === 'lSide') return shape === 'l_shape'
        if (prop.key === 'windowCount') return true
        if (prop.key === 'windowLayout') return winCount > 0
        if (prop.key === 'windowWall1') return winCount > 0 && shape !== 'straight'
        if (prop.key === 'windowWall2') return winCount > 0 && (shape === 'l_shape' || shape === 'u_shape')
        if (prop.key === 'windowWall3') return winCount > 0 && shape === 'u_shape'
        const hasDoor = (obj.customProps?.hasDoor as boolean) ?? false
        if (prop.key === 'doorType' || prop.key === 'doorPosition') return hasDoor
        if (prop.key === 'doorWall') return hasDoor && shape !== 'straight'
        const hasTV = (obj.customProps?.hasTV as boolean) ?? false
        if (prop.key === 'tvSize') return hasTV
        return true
      }).map((prop) => {
        let label = prop.label
        if (obj.type === 'fireplace' && prop.key === 'hearthHeight') {
          const hasHearth = (obj.customProps?.hasHearth as boolean) ?? true
          label = hasHearth ? 'Hearth Height (in)' : 'Opening Height from Ground (in)'
        }
        if (obj.type === 'wall') {
          const shape = (obj.customProps?.shape as string) ?? 'straight'
          if (shape === 'l_shape') {
            if (prop.key === 'windowWall1') label = 'Windows: Top Wall'
            if (prop.key === 'windowWall2') {
              const side = (obj.customProps?.lSide as string) ?? 'left'
              label = `Windows: ${side === 'left' ? 'Left' : 'Right'} Wall`
            }
          } else if (shape === 'u_shape') {
            if (prop.key === 'windowWall1') label = 'Windows: Left Wall'
            if (prop.key === 'windowWall2') label = 'Windows: Back Wall'
            if (prop.key === 'windowWall3') label = 'Windows: Right Wall'
          }
          if (prop.key === 'doorWall') {
            if (shape === 'l_shape') {
              const side = (obj.customProps?.lSide as string) ?? 'left'
              label = `Door Wall (1=Top, 2=${side === 'left' ? 'Left' : 'Right'})`
            } else if (shape === 'u_shape') {
              label = 'Door Wall (1=Left, 2=Back, 3=Right)'
            }
          }
        }

        return (
          <div key={prop.key} className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase text-muted-foreground">
              {label}
            </label>

            {prop.type === 'select' && prop.options && (
              <div className="flex flex-wrap gap-1">
                {prop.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePropChange(prop.key, opt.value)}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs transition-colors',
                      getPropValue(prop) === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {prop.type === 'number' && (() => {
              const numVal = getPropValue(prop) as number
              const isInchProp = prop.label?.toLowerCase().includes('(in)')
              const ftDisplay = isInchProp ? `${Math.floor(numVal / 12)}'${numVal % 12}"` : null
              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={prop.min}
                      max={prop.max}
                      step={prop.step}
                      value={numVal}
                      onChange={(e) => handlePropChange(prop.key, Number(e.target.value))}
                      className="h-1.5 flex-1"
                    />
                    <input
                      type="number"
                      min={prop.min}
                      max={prop.max}
                      step={prop.step}
                      value={numVal}
                      onChange={(e) => handlePropChange(prop.key, Number(e.target.value))}
                      className="h-6 w-14 rounded border bg-background px-1 text-center text-xs"
                    />
                  </div>
                  {ftDisplay && (
                    <span className="text-[10px] text-muted-foreground">{ftDisplay}</span>
                  )}
                </div>
              )
            })()}

            {prop.type === 'color' && (
              <input
                type="color"
                value={getPropValue(prop) as string}
                onChange={(e) => handlePropChange(prop.key, e.target.value)}
                className="h-7 w-full cursor-pointer rounded-md border"
              />
            )}

            {prop.type === 'boolean' && (
              <button
                onClick={() => handlePropChange(prop.key, !(getPropValue(prop) as boolean))}
                className={cn(
                  'rounded-md px-3 py-1 text-xs transition-colors',
                  getPropValue(prop)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {getPropValue(prop) ? 'On' : 'Off'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SizeInput({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={0.5}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-7 w-full rounded-md border bg-background px-1.5 text-center text-xs"
      />
    </div>
  )
}
