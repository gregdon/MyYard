import { useDesignStore } from '@/store/designStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { GridIncrement } from '@/types/tools'
import { MAX_GRID_FT } from '@/constants/defaults'

export function GridSettings() {
  const gridSettings = useDesignStore((s) => s.gridSettings)
  const setGridSettings = useDesignStore((s) => s.setGridSettings)

  const handleDimensionChange = (field: 'widthFt' | 'heightFt', value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > MAX_GRID_FT) return
    setGridSettings({ [field]: num })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Label className="text-xs text-muted-foreground">W:</Label>
        <Input
          type="number"
          min={1}
          max={MAX_GRID_FT}
          value={gridSettings.widthFt}
          onChange={(e) => handleDimensionChange('widthFt', e.target.value)}
          className="h-7 w-16 text-xs"
        />
      </div>
      <div className="flex items-center gap-1">
        <Label className="text-xs text-muted-foreground">H:</Label>
        <Input
          type="number"
          min={1}
          max={MAX_GRID_FT}
          value={gridSettings.heightFt}
          onChange={(e) => handleDimensionChange('heightFt', e.target.value)}
          className="h-7 w-16 text-xs"
        />
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        value={gridSettings.increment}
        onValueChange={(val) => { if (val) setGridSettings({ increment: val as GridIncrement }) }}
        className="flex"
      >
        <ToggleGroupItem value="3in" className="h-7 px-2 text-xs">
          3"
        </ToggleGroupItem>
        <ToggleGroupItem value="6in" className="h-7 px-2 text-xs">
          6"
        </ToggleGroupItem>
        <ToggleGroupItem value="1ft" className="h-7 px-2 text-xs">
          1'
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
