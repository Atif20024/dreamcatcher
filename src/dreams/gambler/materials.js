// THE LAST HAND's grounds (FRAMEWORK §4.1): new palettes on the shared kinds.
// Port Merrow's quay is dressed granite, wet at the edge; the Lantern
// Queen's decks are caulked pine (oiled yellow inside, grey and salted up
// top); her saloon floors are oiled oak under the carpet runners; her
// ceilings and bulkheads are white-painted pine and walnut panelling.
export default {
  quay_granite: {
    id: 'quay_granite', kind: 'stone', surface: 'stone',
    palette: { body: 0x4a4a52, stone: 0x7a7880, mortar: 0x2e2c34, lit: 0xd8c8b0, deep: 0x14121a, moss: 0x3a4a3a, grassLit: 0x8a9078 },
    decor: [],
  },
  main_deck: {
    id: 'main_deck', kind: 'boards', surface: 'wood',
    palette: { body: 0x3a2e24, wood: 0x8a7458, lit: 0xe8d0a0, deep: 0x14100e },
    decor: [],
  },
  hull_white: {
    id: 'hull_white', kind: 'plaster', surface: 'wood',
    palette: { body: 0xb8b0a0, brick: 0xa8a090, mortar: 0x8a8478, wood: 0x6a2430, lit: 0xf2ead8, deep: 0x2a2630 },
    decor: [],
  },
  saloon_oak: {
    id: 'saloon_oak', kind: 'boards', surface: 'carpet',
    palette: { body: 0x3a2214, wood: 0x7a4a2a, lit: 0xf2c890, deep: 0x1a0e08 },
    decor: [],
  },
  walnut_panel: {
    id: 'walnut_panel', kind: 'plaster', surface: 'wood',
    palette: { body: 0x4a2a1a, brick: 0x5a3420, mortar: 0x2a160e, wood: 0xc8a050, lit: 0xd8a868, deep: 0x1a0e08 },
    decor: [],
  },
  ceiling_white: {
    id: 'ceiling_white', kind: 'plaster', surface: 'wood',
    palette: { body: 0xd8ccb0, brick: 0xc8bca0, mortar: 0xa89c80, wood: 0xc8a050, lit: 0xfff4dc, deep: 0x3a3028 },
    decor: [],
  },
  hurricane_deck: {
    id: 'hurricane_deck', kind: 'boards', surface: 'wood',
    palette: { body: 0x4a4648, wood: 0x9a9088, lit: 0xf0e0d0, deep: 0x1a181e },
    decor: [],
  },
};
