// FIVE-STAR DREAM's people (round 2 WP2 cast, era costume): Le Rêve's brigade,
// Saint-Orvain, October 1957. Looks for the rig bake (scripts/lib/cast-bake.js);
// bodies are in src/data/scale.js CAST_BODIES, costumes in src/art/rig/costumes.js.
// Pure data. Every name is invented.
//   pal: H hat (or hair when the hat is 'none'), h band, S skin, T jacket,
//        t shirt / trim, P trousers, B shoes, A the held thing
// A kitchen in the fifties: double-breasted whites, houndstooth trousers (a
// dark check reads as charcoal at this size), blue aprons on the commis,
// rubber on the plongeur; waiters in black. No hairnets or plastic.
export const PEOPLE = {
  // Marguerite Sallow, second de cuisine, forty-odd: whites, a blue apron, a
  // scarf over her hair, a towel on her shoulder. She runs the kitchen in all but name
  'npc-rv-marguerite': { hat: 'wrap', held: null, pal: { H: 0x3a4a6a, h: 0x2a3650, S: 0xd8b090, T: 0xf0ece2, t: 0xd8d2c4, P: 0x3a3a48, B: 0x1e1a1e } },
  // Chef Aurelio: the tall toque, a red neckerchief, a straight back
  'npc-rv-aurelio': { hat: 'chef_toque', held: null, pal: { H: 0xf6f2e8, h: 0xd8d2c4, S: 0xc89878, T: 0xf6f2e8, t: 0xd8d2c4, P: 0x24242e, B: 0x14121a } },
  // Bastien, the plongeur, seventeen: a rubber apron, rolled sleeves, a hose
  'npc-rv-bastien': { hat: 'none', held: null, pal: { H: 0x6a4a2a, S: 0xd8b090, T: 0xc8c8c0, t: 0xe8e4d8, P: 0x3a3a44, B: 0x1e1e28 } },
  // Tomé, the prep commis: a paper cap, a blue apron, red eyes
  'npc-rv-tome': { hat: 'baker', held: null, pal: { H: 0xf2ece0, h: 0xd8d2c4, S: 0xa87858, T: 0xe8e4d8, t: 0xd8d2c4, P: 0x3a3a48, B: 0x1e1a1e } },
  // Luc, the runner: a waiter's black waistcoat, a white jacket, a hot tray
  'npc-rv-luc': { hat: 'none', held: 'tray', pal: { H: 0x2a1e18, S: 0xd0a888, T: 0xf2ead8, t: 0x24242e, P: 0x24242e, B: 0x14121a, A: 0xc8a050 } },
  // the porter with the trolley: a brown warehouse coat and a flat cap
  'npc-rv-porter': { hat: 'cap', held: null, pal: { H: 0x4a3e30, S: 0xc89878, T: 0x6a5238, t: 0xd8ccb0, P: 0x3e3428, B: 0x2a1e16 } },
  // two commis at the range, working, nameless: the room looks employed
  'npc-rv-commis': { hat: 'toque', held: 'ladle', pal: { H: 0xf0ece2, h: 0xd8d2c4, S: 0xd8b090, T: 0xf0ece2, t: 0xd8d2c4, P: 0x3a3a48, B: 0x1e1a1e, A: 0xb8bcc8 } },
  'npc-rv-commis2': { hat: 'toque', held: 'ladle', pal: { H: 0xf0ece2, h: 0xd8d2c4, S: 0x8a5a3b, T: 0xf0ece2, t: 0xd8d2c4, P: 0x2e2e3a, B: 0x1e1a1e, A: 0xb8bcc8 } },
};
