// THE MASTER'S LADDER's grounds (FRAMEWORK §4.1): new palettes on the shared
// kinds. Fioralba is paved in grey-gold sandstone and river cobbles; floors
// inside are terracotta tiles and oak; walls are lime plaster over brick;
// the chapel is dressed stone; the scaffold planks are raw poplar.
export default {
  via_cobble: {
    id: 'via_cobble', kind: 'cobble', surface: 'stone',
    palette: { body: 0x6a5a48, stone: 0xb8a888, mortar: 0x4a3e32, lit: 0xfff0c8, deep: 0x2a2026, moss: 0x6a7a4a, root: 0x4a3a2a },
    decor: ['pebbles', 'weeds'],
  },
  piazza_stone: {
    id: 'piazza_stone', kind: 'stone', surface: 'stone',
    palette: { body: 0x9a8a70, stone: 0xd0c4a4, mortar: 0x6a5e4c, lit: 0xfff4d8, deep: 0x3a3028, moss: 0x8a8a5a, grassLit: 0xd8d0a0 },
    decor: [],
  },
  cotto_floor: {
    id: 'cotto_floor', kind: 'stone', surface: 'tile',
    palette: { body: 0x8a4a2e, stone: 0xb8643e, mortar: 0x5a2e1e, lit: 0xf2c098, deep: 0x2a1614, moss: 0x8a5a3a, grassLit: 0xd88a5a },
    decor: [],
  },
  oak_floor: {
    id: 'oak_floor', kind: 'boards', surface: 'wood',
    palette: { body: 0x3a2618, wood: 0x7a5232, lit: 0xf2c890, deep: 0x1a100c },
    decor: ['dust'],
  },
  lime_wall: {
    id: 'lime_wall', kind: 'plaster', surface: 'stone',
    palette: { body: 0xd8c8a8, brick: 0xc8b494, mortar: 0xb0a080, wood: 0x6a4a2e, lit: 0xfff0d0, deep: 0x3a2e28 },
    decor: [],
  },
  chapel_stone: {
    id: 'chapel_stone', kind: 'stone', surface: 'stone',
    palette: { body: 0x8a8070, stone: 0xc8bca0, mortar: 0x5a5244, lit: 0xf8ecd0, deep: 0x2a2428, moss: 0x7a7a5a, grassLit: 0xc8c0a0 },
    decor: [],
  },
  scaffold: {
    id: 'scaffold', kind: 'boards', surface: 'wood',
    palette: { body: 0x5a4028, wood: 0xa8885a, lit: 0xfff0c8, deep: 0x2a1c12 },
    decor: [],
  },
};
