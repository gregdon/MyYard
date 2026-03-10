import { useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Material } from '@/types/materials'
import { MATERIAL_DEFS, PALETTE_MATERIALS } from '@/constants/materials'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function MaterialPalette() {
  const activeMaterial = useUIStore((s) => s.activeMaterial)
  const setActiveMaterial = useUIStore((s) => s.setActiveMaterial)
  const customColor = useUIStore((s) => s.customColor)
  const setCustomColor = useUIStore((s) => s.setCustomColor)
  const colorInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {PALETTE_MATERIALS.map((mat) => {
        const def = MATERIAL_DEFS[mat]
        const isActive = activeMaterial === mat
        const isCustom = mat === Material.Custom
        const displayColor = isCustom ? customColor : def.color

        return (
          <Tooltip key={mat}>
            <TooltipTrigger asChild>
              <button
                className={`
                  relative flex h-12 w-full flex-col items-center justify-center rounded-md border-2
                  transition-colors hover:opacity-80
                  ${isActive ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}
                `}
                style={{ backgroundColor: displayColor }}
                onClick={() => setActiveMaterial(mat as Material)}
                onDoubleClick={() => {
                  if (isCustom) colorInputRef.current?.click()
                }}
              >
                <span
                  className="text-[9px] font-medium leading-tight"
                  style={{
                    color: isLightColor(displayColor) ? '#333' : '#fff',
                    textShadow: isLightColor(displayColor) ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {def.label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCustom ? `${def.label} (double-click to change color)` : def.label}
            </TooltipContent>
          </Tooltip>
        )
      })}

      {/* Hidden color input for the custom swatch */}
      <input
        ref={colorInputRef}
        type="color"
        value={customColor}
        onChange={(e) => setCustomColor(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  )
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
