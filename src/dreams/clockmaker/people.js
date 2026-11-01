// THE STOPPED HOUR's townsfolk (round 2 WP2 cast): looks for the rig bake
// (scripts/lib/cast-bake.js → public/atlas/people*); bodies are in
// src/data/scale.js CAST_BODIES under the same keys. Pure data. Every name is
// invented. A small town at dusk: browns, a good waistcoat, a clean apron.
//   pal: H hat (or hair), h band, S skin, T coat or dress, t trim, P legs, B boots, A the held thing
export const PEOPLE = {
  // a man with a pocket watch, waiting for a train that has not come
  'npc-sh-watch': { hat: 'bowler', held: 'ledger', pal: { H: 0x3a2e28, h: 0x1e1a1e, S: 0xd0a888, T: 0x4a4038, t: 0xc8a050, P: 0x3a342e, B: 0x1e1a1a, A: 0xc8a050 } },
  // a woman on the bench with a pie in a cloth, perfect and cold
  'npc-sh-pie': { hat: 'none', held: 'basket', pal: { H: 0x6a4a2a, S: 0xd8b090, T: 0x7a4a3a, t: 0xe8dcc0, P: 0x4a3028, B: 0x2a1e16, A: 0xe8dcc0 } },
};
