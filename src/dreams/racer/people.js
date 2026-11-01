// THE LONG STRAIGHT's people: Pereval Corse and its coast, spring 1958. Looks for
// the rig bake (scripts/lib/cast-bake.js); bodies and gaits are in src/data/scale.js
// CAST_BODIES and src/art/rig/gaits.js under the same keys. Pure data. Every name
// is invented.
//   pal: H hat (or hair), h band, S skin, T overalls or coat, t trim, P legs, B boots, A the held thing
export const PEOPLE = {
  // Ottavia Castellane, twenty-two, the fitter who tunes by ear: teal and cream, a scarf
  // over her hair, always a spanner on something. Quick, arms up. The dreamer
  'npc-pv-ottavia': { hat: 'wrap', held: 'spanner', pal: { H: 0x1f7a78, h: 0x165a58, S: 0xc89878, T: 0xe8dcc0, t: 0x1f7a78, P: 0x3a4a4e, B: 0x2a1e16, A: 0x8a8a92 } },
  // Aldo Pereval, fifty-two: an old grey driving jacket, a rag, tired on his feet. Plods
  'npc-pv-aldo': { hat: 'cap', held: 'rag', pal: { H: 0x4a4038, h: 0x2e2820, S: 0xc09070, T: 0x5a5a60, t: 0xd8ccb0, P: 0x3e3830, B: 0x1e1a16, A: 0xd8ccb0 } },
  // Tullio, the chief mechanic, past sixty: brown coat, a tyre on his shoulder
  'npc-pv-tullio': { hat: 'cap', held: 'tyre', pal: { H: 0x6a5238, h: 0x4a3a28, S: 0xb08868, T: 0x6a5238, t: 0xc8b890, P: 0x3a3028, B: 0x1e1a16, A: 0x1e1c22 } },
  // Nino, fifteen, who sweeps: too-big overalls, a broom taller than he wants
  'npc-pv-nino': { hat: 'none', held: 'broom', pal: { H: 0x2a1e18, S: 0xc89878, T: 0x7a8a8a, t: 0xc8c4b8, P: 0x5a6a6a, B: 0x2a1e16, A: 0x6a4a2c } },
  // Mr Sable, of Sable Oil: a good green suit, a folder, hands that keep to themselves
  'npc-pv-sable': { hat: 'bowler', held: 'ledger', pal: { H: 0x24302a, h: 0x161e1a, S: 0xd0a888, T: 0x2e4a3a, t: 0xe8e0c8, P: 0x24382c, B: 0x14121a, A: 0xc8a050 } },
  // Signora Castellane, Ottavia's mother: black, an apron, a ladle she does not put down
  'npc-pv-signora': { hat: 'wrap', held: 'ladle', pal: { H: 0x2a2428, h: 0x1a1618, S: 0xb88e70, T: 0x2e2a30, t: 0xd8ccb0, P: 0x2e2a30, B: 0x1a1618, A: 0x9a9aa2 } },
  // Sister Agnese, the night sister: a white veil, a clipboard, soft shoes, quick
  'npc-pv-agnese': { hat: 'wrap', held: 'clipboard', pal: { H: 0xf0ece2, h: 0xd8d2c4, S: 0xd8b090, T: 0xd8dcd8, t: 0xf6f2e8, P: 0xd8dcd8, B: 0x3a3430, A: 0x8a6a4a } },
};
