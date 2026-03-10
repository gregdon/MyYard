export const Material = {
  Empty: 'empty',
  GrassLight: 'grass_light',
  GrassDark: 'grass_dark',
  Pavers: 'pavers',
  Brick: 'brick',
  Sand: 'sand',
  Concrete: 'concrete',
  StampedConcrete: 'stamped_concrete',
  Posts: 'posts',
  Firepit: 'firepit',
  Water: 'water',
  Deck: 'deck',
  Gravel: 'gravel',
  Stone: 'stone',
  Mulch: 'mulch',
  Custom: 'custom',
} as const

export type Material = (typeof Material)[keyof typeof Material]

export interface MaterialDefinition {
  id: Material
  label: string
  color: string
  heightFt: number
  sunken: boolean
}

export const MATERIAL_VALUES = Object.values(Material)

export const MATERIAL_TO_INDEX = new Map<Material, number>(
  MATERIAL_VALUES.map((m, i) => [m, i])
)

export const INDEX_TO_MATERIAL = new Map<number, Material>(
  MATERIAL_VALUES.map((m, i) => [i, m])
)
