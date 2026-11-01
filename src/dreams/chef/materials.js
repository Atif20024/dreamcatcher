// FIVE-STAR DREAM's grounds (FRAMEWORK 4.1): new palettes on the shared kinds.
// The yard is wet setts; the kitchen floor is red quarry tile under white
// glazed walls; the cold store is galvanised and frosted; the dining room is
// a dark parquet that swallows a footstep.
export default {
  wet_setts: {
    id: 'wet_setts', kind: 'cobble', surface: 'stone',
    palette: { body: 0x2a2a34, stone: 0x565664, mortar: 0x1a1a22, lit: 0xb8b8c8, deep: 0x0e0c16, moss: 0x2a3430, root: 0x1a1a22 },
    decor: ['puddles'],
  },
  quarry_tile: {
    id: 'quarry_tile', kind: 'stone', surface: 'tile',
    palette: { body: 0x5a2a22, stone: 0x8a4434, mortar: 0x3a1a16, lit: 0xd88a6a, deep: 0x1e0e0c, moss: 0x5a3a2a, grassLit: 0xc88a6a },
    decor: [],
  },
  glazed_wall: {
    id: 'glazed_wall', kind: 'plaster', surface: 'tile',
    palette: { body: 0xc8c4b4, brick: 0xbab6a6, mortar: 0x8a8678, wood: 0x6a6a64, lit: 0xf6f2e4, deep: 0x3a3830 },
    decor: [],
  },
  cold_steel: {
    id: 'cold_steel', kind: 'stone', surface: 'metal',
    palette: { body: 0x3e4a58, stone: 0x6a7a8a, mortar: 0x2a3440, lit: 0xd0e4f0, deep: 0x141a22, moss: 0x4a5a68, grassLit: 0xb8d0e0 },
    decor: [],
  },
  cold_wall: {
    id: 'cold_wall', kind: 'plaster', surface: 'metal',
    palette: { body: 0x4a5866, brick: 0x445260, mortar: 0x2a3440, wood: 0x6a7a8a, lit: 0xc0d8e8, deep: 0x141a22 },
    decor: [],
  },
  rack_plank: {
    id: 'rack_plank', kind: 'boards', surface: 'metal',
    palette: { body: 0x3a4652, wood: 0x8a9aa8, lit: 0xdcecf4, deep: 0x141a22 },
    decor: [],
  },
  kitchen_plank: {
    id: 'kitchen_plank', kind: 'boards', surface: 'wood',
    palette: { body: 0x3a2a1e, wood: 0x8a6a48, lit: 0xe8c898, deep: 0x1a100c },
    decor: [],
  },
  parquet: {
    id: 'parquet', kind: 'boards', surface: 'carpet',
    palette: { body: 0x2e1a10, wood: 0x5a3820, lit: 0xb88a58, deep: 0x140a06 },
    decor: [],
  },
  salle_wall: {
    id: 'salle_wall', kind: 'plaster', surface: 'wood',
    palette: { body: 0x3a2428, brick: 0x34201f, mortar: 0x1e1214, wood: 0xa88a48, lit: 0x8a6a58, deep: 0x140a0c },
    decor: [],
  },
};
