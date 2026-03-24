import { MATERIAL_VALUES } from '@/types/materials'
import { MAX_GRID_FT } from '@/constants/defaults'
import type { DesignFile } from '@/types/schema'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateDesignFile(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['File is not a valid JSON object'] }
  }

  const file = data as Record<string, unknown>

  // Schema version
  if (file.schemaVersion !== 1) {
    errors.push(`Unsupported schema version: ${file.schemaVersion}`)
  }

  // Metadata
  if (!file.metadata || typeof file.metadata !== 'object') {
    errors.push('Missing metadata')
  }

  // Grid settings
  const gs = file.gridSettings as Record<string, unknown> | undefined
  if (!gs || typeof gs !== 'object') {
    errors.push('Missing gridSettings')
  } else {
    if (typeof gs.widthFt !== 'number' || gs.widthFt < 1 || gs.widthFt > MAX_GRID_FT) {
      errors.push(`gridSettings.widthFt must be 1-${MAX_GRID_FT}`)
    }
    if (typeof gs.heightFt !== 'number' || gs.heightFt < 1 || gs.heightFt > MAX_GRID_FT) {
      errors.push(`gridSettings.heightFt must be 1-${MAX_GRID_FT}`)
    }
    if (gs.increment !== '1ft' && gs.increment !== '6in' && gs.increment !== '3in') {
      errors.push('gridSettings.increment must be "1ft", "6in", or "3in"')
    }
  }

  // Grid
  if (!Array.isArray(file.grid)) {
    errors.push('Missing grid array')
  } else {
    const grid = file.grid as unknown[][]
    const matSet = new Set(MATERIAL_VALUES)
    for (let r = 0; r < grid.length; r++) {
      if (!Array.isArray(grid[r])) {
        errors.push(`grid[${r}] is not an array`)
        break
      }
      for (let c = 0; c < grid[r].length; c++) {
        if (!matSet.has(grid[r][c] as typeof MATERIAL_VALUES[number])) {
          errors.push(`Invalid material "${grid[r][c]}" at [${r}][${c}]`)
          if (errors.length > 10) return { valid: false, errors }
        }
      }
    }
  }

  // Height overrides
  if (file.heightOverrides !== undefined && !Array.isArray(file.heightOverrides)) {
    errors.push('heightOverrides must be an array')
  }

  // Placed objects
  if (file.placedObjects !== undefined && !Array.isArray(file.placedObjects)) {
    errors.push('placedObjects must be an array')
  }

  return { valid: errors.length === 0, errors }
}

export function parseDesignFile(json: string): { file: DesignFile | null; errors: string[] } {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { file: null, errors: ['Invalid JSON'] }
  }

  const result = validateDesignFile(parsed)
  if (!result.valid) {
    return { file: null, errors: result.errors }
  }

  return { file: parsed as DesignFile, errors: [] }
}
