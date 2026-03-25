import type { Template } from '@/types/templates'

/**
 * Built-in seed templates extracted from the reference design (template.json).
 * These serve as the initial library of presets and assemblies.
 */
export const SEED_TEMPLATES: Template[] = [
  // ─── Presets (single widgets) ───────────────────────────────────────

  {
    id: 'b1a2c3d4-0001-4000-8000-000000000001',
    kind: 'preset',
    name: 'Stone L-Kitchen with Egg Stand',
    description: 'L-shaped outdoor kitchen in stone with a Big Green Egg stand on the vertical leg.',
    category: 'Kitchens',
    tags: ['kitchen', 'l-shaped', 'egg', 'stone', 'outdoor cooking'],
    baseType: 'kitchen_l_shaped',
    size: { widthFt: 8.5, depthFt: 11, heightFt: 3 },
    customProps: {
      hasEggStand: true,
      eggStandSide: 'vertical',
      eggStandHeight: 18,
      eggMounting: 'on_top',
      color: '#888070',
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0002-4000-8000-000000000002',
    kind: 'preset',
    name: 'Patio Cover with T&G Ceiling',
    description: 'Large patio cover with tongue-and-groove ceiling, 2 fans, and 6 lights.',
    category: 'Structures',
    tags: ['patio cover', 'ceiling', 'fans', 'lights', 'tongue and groove'],
    baseType: 'patio_cover',
    size: { widthFt: 25, depthFt: 14.5, heightFt: 9 },
    customProps: {
      postDiameter: 6,
      color: '#1a1c1e',
      overhang: 24,
      roofColor: '#74716d',
      roofPitch: 0.5,
      postCount: 4,
      fans: '2',
      lights: '6',
      ceiling: 'tongue_groove',
      fanDiameter: '60',
      fan1Pos: 25,
      fan2Pos: 75,
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0003-4000-8000-000000000003',
    kind: 'preset',
    name: 'Stone TV Wall 75in',
    description: 'Stone accent wall with a mounted 75-inch TV.',
    category: 'Entertainment',
    tags: ['tv', 'wall', 'stone', '75 inch', 'entertainment'],
    baseType: 'tv_wall',
    size: { widthFt: 11, depthFt: 0.5, heightFt: 9.5 },
    customProps: {
      color: '#8b7355',
      tvSize: 75,
      hasTV: true,
      tvOffset: 0,
      tvVertical: 6,
      tvHorizontal: 0,
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0004-4000-8000-000000000004',
    kind: 'preset',
    name: 'Rod Iron Fence 6ft',
    description: '60-foot wide, 6-foot tall rod iron fence section.',
    category: 'Fencing',
    tags: ['fence', 'rod iron', '6ft', 'perimeter'],
    baseType: 'fence_section',
    size: { widthFt: 60, depthFt: 0.5, heightFt: 6 },
    customProps: {
      fenceType: 'rod_iron',
      color: '#160e09',
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0005-4000-8000-000000000005',
    kind: 'preset',
    name: 'Stone Pony Wall',
    description: 'Low stone pony wall for defining patio edges.',
    category: 'Walls',
    tags: ['pony wall', 'stone', 'divider', 'patio'],
    baseType: 'pony_wall',
    size: { widthFt: 9.5, depthFt: 1.5, heightFt: 1.5 },
    customProps: {
      color: '#888070',
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0006-4000-8000-000000000006',
    kind: 'preset',
    name: 'Stone Bar',
    description: 'Stone bar counter with 2-inch countertop and 8-inch overhang.',
    category: 'Kitchens',
    tags: ['bar', 'stone', 'counter', 'outdoor cooking'],
    baseType: 'bar',
    size: { widthFt: 9, depthFt: 2, heightFt: 3.5 },
    customProps: {
      color: '#888070',
      countertopThickness: 2,
      countertopOverhang: 8,
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0007-4000-8000-000000000007',
    kind: 'preset',
    name: 'Red Maple Tree',
    description: 'Medium red maple tree for accent planting.',
    category: 'Plants',
    tags: ['tree', 'red maple', 'shade', 'landscaping'],
    baseType: 'tree_small',
    size: { widthFt: 6, depthFt: 6, heightFt: 15 },
    customProps: {
      species: 'red_maple',
      treeSize: 'medium',
    },
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  // ─── Assemblies (groups of objects) ─────────────────────────────────

  {
    id: 'b1a2c3d4-0008-4000-8000-000000000008',
    kind: 'assembly',
    name: 'Outdoor Kitchen with Bar',
    description: 'L-shaped kitchen, built-in grill, and bar counter arranged as a cooking station.',
    category: 'Kitchens',
    tags: ['kitchen', 'bar', 'grill', 'outdoor cooking', 'assembly'],
    // Bounding box: x [17.25..22], z [14.5..18] → 4.75 x 3.5
    // Heights: kitchen 3, grill 3, bar 3.5 → max 3.5
    // Center: [19.625, 0, 16.25]
    boundingBox: { widthFt: 4.75, depthFt: 3.5, heightFt: 3.5 },
    objects: [
      {
        type: 'kitchen_l_shaped',
        relativePosition: [17.25 - 19.625, 0, 14.5 - 16.25],   // [-2.375, 0, -1.75]
        rotation: [0, 0, 0],
        size: { widthFt: 8.5, depthFt: 11, heightFt: 3 },
        customProps: {
          hasEggStand: true,
          eggStandSide: 'vertical',
          eggStandHeight: 18,
          eggMounting: 'on_top',
          color: '#888070',
        },
      },
      {
        type: 'bar',
        relativePosition: [22 - 19.625, 0, 18 - 16.25],         // [2.375, 0, 1.75]
        rotation: [0, 4.71238898038469, 0],
        size: { widthFt: 9, depthFt: 2, heightFt: 3.5 },
        customProps: {
          color: '#888070',
          countertopThickness: 2,
          countertopOverhang: 8,
        },
      },
      {
        type: 'grill_builtin_small',
        relativePosition: [21.25 - 19.625, 0, 15 - 16.25],     // [1.625, 0, -1.25]
        rotation: [0, 0, 0],
        size: { widthFt: 2.708, depthFt: 2.146, heightFt: 3 },
        customProps: {},
      },
    ],
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-0009-4000-8000-000000000009',
    kind: 'assembly',
    name: 'Dining Set',
    description: 'Dining table surrounded by 7 chairs for outdoor entertaining.',
    category: 'Furniture',
    tags: ['dining', 'table', 'chairs', 'seating', 'assembly'],
    // Objects: table [33.75,0,20.5] + 7 chairs
    // All positions: x [18.25..39], z [15.25..25.25]
    // Center: [28.625, 0, 20.25]
    boundingBox: { widthFt: 20.75, depthFt: 10, heightFt: 3 },
    objects: [
      {
        type: 'dining_table',
        relativePosition: [33.75 - 28.625, 0, 20.5 - 20.25],   // [5.125, 0, 0.25]
        rotation: [0, -1.5707963267948966, 0],
        size: { widthFt: 6, depthFt: 3, heightFt: 2.5 },
        customProps: {},
      },
      {
        type: 'chair',
        relativePosition: [32.5 - 28.625, 0, 19.75 - 20.25],   // [3.875, 0, -0.5]
        rotation: [0, 1.5707963267948966, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
      {
        type: 'chair',
        relativePosition: [39 - 28.625, 0, 22 - 20.25],         // [10.375, 0, 1.75]
        rotation: [0, -1.5707963267948966, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
      {
        type: 'chair',
        relativePosition: [39 - 28.625, 0, 19.75 - 20.25],     // [10.375, 0, -0.5]
        rotation: [0, -1.5707963267948966, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
      {
        type: 'chair',
        relativePosition: [35.75 - 28.625, 0, 16.75 - 20.25],  // [7.125, 0, -3.5]
        rotation: [0, 0, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
      {
        type: 'chair',
        relativePosition: [35.75 - 28.625, 0, 25.25 - 20.25],  // [7.125, 0, 5]
        rotation: [0, 3.141592653589793, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
      {
        type: 'chair',
        relativePosition: [18.25 - 28.625, 0, 15.25 - 20.25],  // [-10.375, 0, -5]
        rotation: [0, 1.5707963267948966, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
      {
        type: 'chair',
        relativePosition: [32.5 - 28.625, 0, 22 - 20.25],      // [3.875, 0, 1.75]
        rotation: [0, 1.5707963267948966, 0],
        size: { widthFt: 2, depthFt: 2, heightFt: 3 },
        customProps: { color: '#6d4b2c' },
      },
    ],
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },

  {
    id: 'b1a2c3d4-000a-4000-8000-00000000000a',
    kind: 'assembly',
    name: 'Covered Patio',
    description: 'Large concrete slab with patio cover and stone pony walls on three sides.',
    category: 'Structures',
    tags: ['patio', 'covered', 'concrete', 'pony wall', 'assembly'],
    // Objects: slab [17.25,0,14.5], cover [17.75,0,14.75], 4 pony walls
    // x range: [17.25..36.5], z range: [14.5..28]
    // Center: [26.875, 0, 21.25]
    boundingBox: { widthFt: 19.25, depthFt: 13.5, heightFt: 9 },
    objects: [
      {
        type: 'concrete_slab',
        relativePosition: [17.25 - 26.875, 0, 14.5 - 21.25],   // [-9.625, 0, -6.75]
        rotation: [0, 0, 0],
        size: { widthFt: 26, depthFt: 15, heightFt: 0.33 },
        customProps: {},
      },
      {
        type: 'patio_cover',
        relativePosition: [17.75 - 26.875, 0, 14.75 - 21.25],  // [-9.125, 0, -6.5]
        rotation: [0, 0, 0],
        size: { widthFt: 25, depthFt: 14.5, heightFt: 9 },
        customProps: {
          postDiameter: 6,
          color: '#1a1c1e',
          overhang: 24,
          roofColor: '#74716d',
          roofPitch: 0.5,
          postCount: 4,
          fans: '2',
          lights: '6',
          ceiling: 'tongue_groove',
          fanDiameter: '60',
          fan1Pos: 25,
          fan2Pos: 75,
        },
      },
      {
        type: 'pony_wall',
        relativePosition: [17.25 - 26.875, 0, 28 - 21.25],     // [-9.625, 0, 6.75]
        rotation: [0, 0, 0],
        size: { widthFt: 9.5, depthFt: 1.5, heightFt: 1.5 },
        customProps: { color: '#888070' },
      },
      {
        type: 'pony_wall',
        relativePosition: [33.75 - 26.875, 0, 28 - 21.25],     // [6.875, 0, 6.75]
        rotation: [0, 0, 0],
        size: { widthFt: 9.5, depthFt: 1.5, heightFt: 1.5 },
        customProps: { color: '#888070' },
      },
      {
        type: 'pony_wall',
        relativePosition: [33.75 - 26.875, 0, 14.5 - 21.25],   // [6.875, 0, -6.75]
        rotation: [0, 0, 0],
        size: { widthFt: 9.5, depthFt: 1.5, heightFt: 1.5 },
        customProps: { color: '#888070' },
      },
      {
        type: 'pony_wall',
        relativePosition: [36.5 - 26.875, 0, 21.25 - 21.25],   // [9.625, 0, 0]
        rotation: [0, 1.5707963267948966, 0],
        size: { widthFt: 12, depthFt: 1.5, heightFt: 1.5 },
        customProps: { color: '#888070' },
      },
    ],
    visibility: 'builtin',
    createdBy: 'system',
    createdAt: '2026-03-25T00:00:00.000Z',
  },
]
