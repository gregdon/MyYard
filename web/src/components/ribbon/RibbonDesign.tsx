import { RibbonGroup } from './RibbonGroup'
import { MaterialPalette } from '@/components/sidebar/MaterialPalette'
import { GridSettings } from '@/components/toolbar/GridSettings'

export function RibbonDesign() {
  return (
    <div className="flex items-stretch">
      <RibbonGroup label="Materials">
        <div className="max-w-[280px]">
          <MaterialPalette />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Grid">
        <GridSettings />
      </RibbonGroup>

      <RibbonGroup label="Terrain" hideSeparator>
        <span className="px-2 text-xs text-muted-foreground italic">Coming soon</span>
      </RibbonGroup>
    </div>
  )
}
