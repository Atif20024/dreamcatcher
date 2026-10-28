// THE BIG STAGE's grounds (FRAMEWORK §4.1): new palettes on the shared kinds.
// A city at night in the rain: wet setts that hold the lamplight, a club's
// oxblood boards, painted concrete backstage, iron grating on the fire
// stairs, the stage's black deck. Walls are brick (the plaster kind's brick).
export default {
  wet_setts: {
    id: 'wet_setts', kind: 'cobble', surface: 'stone',
    palette: { body: 0x23202e, stone: 0x4a4a5c, mortar: 0x141220, lit: 0x9ac8e0, deep: 0x0e0c16, moss: 0x2e3a3a, root: 0x2a2028 },
    decor: ['puddles', 'pebbles'],
  },
  club_boards: {
    id: 'club_boards', kind: 'boards', surface: 'wood',
    palette: { body: 0x2a1418, wood: 0x6a2a24, lit: 0xf2c890, deep: 0x100a0e },
    decor: ['dust'],
  },
  cellar_brick: {
    id: 'cellar_brick', kind: 'plaster', surface: 'stone',
    palette: { body: 0x5a2a24, brick: 0x7a3428, mortar: 0x2a1418, wood: 0x3a2018, lit: 0xf2c890, deep: 0x120a0e },
    decor: [],
  },
  dock_concrete: {
    id: 'dock_concrete', kind: 'stone', surface: 'stone',
    palette: { body: 0x3a3a44, stone: 0x5a5a66, mortar: 0x22222a, lit: 0xd8d8e0, deep: 0x14141c, moss: 0x3a3a44, grassLit: 0x6a6a74 },
    decor: [],
  },
  iron_grate: {
    id: 'iron_grate', kind: 'stone', surface: 'metal',
    palette: { body: 0x1e1c26, stone: 0x3a3846, mortar: 0x0e0c14, lit: 0x8a98b0, deep: 0x0a0a10, moss: 0x2a2a34, grassLit: 0x4a4a58 },
    decor: [],
  },
  stage_deck: {
    id: 'stage_deck', kind: 'boards', surface: 'wood',
    palette: { body: 0x141218, wood: 0x2a2630, lit: 0xd0a0f0, deep: 0x08060c },
    decor: [],
  },
};
