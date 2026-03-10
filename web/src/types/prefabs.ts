export interface PrefabSize {
  widthFt: number
  depthFt: number
  heightFt: number
}

export type PropType = 'select' | 'number' | 'color' | 'boolean'

export interface PropDef {
  key: string
  label: string
  type: PropType
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  defaultValue: unknown
}

export interface PrefabDefinition {
  type: string
  label: string
  category: string
  defaultSize: PrefabSize
  minSize: PrefabSize
  maxSize: PrefabSize
  resizable: boolean
  rotatable: boolean
  color: string
  editableProps?: PropDef[]
}
