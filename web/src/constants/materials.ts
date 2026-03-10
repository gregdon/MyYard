import { Material } from '@/types/materials'
import type { MaterialDefinition } from '@/types/materials'

export const MATERIAL_DEFS: Record<Material, MaterialDefinition> = {
  [Material.Empty]: {
    id: Material.Empty,
    label: 'Empty',
    color: '#f5f5f5',
    heightFt: 0,
    sunken: false,
  },
  [Material.GrassLight]: {
    id: Material.GrassLight,
    label: 'Grass (Light)',
    color: '#7ec850',
    heightFt: 0,
    sunken: false,
  },
  [Material.GrassDark]: {
    id: Material.GrassDark,
    label: 'Grass (Dark)',
    color: '#4a8c2a',
    heightFt: 0,
    sunken: false,
  },
  [Material.Pavers]: {
    id: Material.Pavers,
    label: 'Pavers',
    color: '#c07040',
    heightFt: 0.2,
    sunken: false,
  },
  [Material.Brick]: {
    id: Material.Brick,
    label: 'Brick',
    color: '#8b4513',
    heightFt: 0.2,
    sunken: false,
  },
  [Material.Sand]: {
    id: Material.Sand,
    label: 'Sand',
    color: '#e8d5a3',
    heightFt: 0,
    sunken: false,
  },
  [Material.Concrete]: {
    id: Material.Concrete,
    label: 'Concrete',
    color: '#b0b0b0',
    heightFt: 0.1,
    sunken: false,
  },
  [Material.StampedConcrete]: {
    id: Material.StampedConcrete,
    label: 'Stamped Concrete',
    color: '#a0a090',
    heightFt: 0.1,
    sunken: false,
  },
  [Material.Posts]: {
    id: Material.Posts,
    label: 'Posts',
    color: '#8b7355',
    heightFt: 0,
    sunken: false,
  },
  [Material.Firepit]: {
    id: Material.Firepit,
    label: 'Fire Pit',
    color: '#d44a00',
    heightFt: -0.5,
    sunken: true,
  },
  [Material.Water]: {
    id: Material.Water,
    label: 'Water / Pool',
    color: '#4a90d9',
    heightFt: -1.0,
    sunken: true,
  },
  [Material.Deck]: {
    id: Material.Deck,
    label: 'Deck / Wood',
    color: '#a0724a',
    heightFt: 0.5,
    sunken: false,
  },
  [Material.Gravel]: {
    id: Material.Gravel,
    label: 'Gravel',
    color: '#c8b898',
    heightFt: 0.05,
    sunken: false,
  },
  [Material.Stone]: {
    id: Material.Stone,
    label: 'Stone',
    color: '#888070',
    heightFt: 0.15,
    sunken: false,
  },
  [Material.Mulch]: {
    id: Material.Mulch,
    label: 'Mulch / Garden',
    color: '#6b4226',
    heightFt: 0.05,
    sunken: false,
  },
  [Material.Custom]: {
    id: Material.Custom,
    label: 'Custom',
    color: '#ff69b4',
    heightFt: 0,
    sunken: false,
  },
}

export const PALETTE_MATERIALS = Object.values(Material).filter(m => m !== Material.Empty)
