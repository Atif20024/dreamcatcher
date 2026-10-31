// THE LAST HAND's people (round 2 WP2 cast, era costume): the Lantern Queen
// on the Verrane, autumn 1884. Looks for the rig bake (scripts/lib/
// cast-bake.js → public/atlas/people*); bodies (sex, age, dress, beard,
// hat) are in src/data/scale.js CAST_BODIES under the same keys. Pure data:
// the atlas bake imports it in Node. Every name is invented.
//   pal: H hat (or hair when the hat is 'none'), h band, S skin, T coat or
//        dress, t waistcoat / shirt / trim, P trousers, B boots, A the held thing
// The river in the Gilded Age dresses in black broadcloth, claret, bottle
// green, cream linen for a planter, navy and brass for the boat's officers;
// no neon, nothing after 1884.
export const PEOPLE = {
  // Lou Verrick, the dreamer, thirty: a claret frock coat, a gold waistcoat,
  // a black planter's hat. He stands; his hands shake too much to sit
  'npc-lq-lou': { hat: 'planter', held: null, pal: { H: 0x1e1a1e, h: 0x3a2a2a, S: 0xd8b090, T: 0x6a2430, t: 0xc8a050, P: 0x3e3a40, B: 0x1a1618 } },
  // Mr Pell, the purser: navy coat, brass buttons, a peaked cap, the marker book
  'npc-lq-pell': { hat: 'peaked', held: 'ledger', pal: { H: 0x1e2440, h: 0xc8a050, S: 0xd0a888, T: 0x22284a, t: 0xc8a050, P: 0x1e2440, B: 0x14121a, A: 0x5a2a22 } },
  // Judge Harlan Voe: big and kindly in cream linen and a white planter's hat
  'npc-lq-voe': { hat: 'planter', held: 'cards', pal: { H: 0xe8e0c8, h: 0x6a4a2a, S: 0xd8a890, T: 0xe0d4b4, t: 0x8a2a2a, P: 0xd8ccac, B: 0x4a3424, A: 0xf2ead8 } },
  // Madame Sorrel: bottle-green silk, a cameo at the throat, a glass in hand
  'npc-lq-sorrel': { hat: 'none', held: 'glass', pal: { H: 0x2a1a14, S: 0xe0bca0, T: 0x1e4a3a, t: 0xe8dcc8, P: 0x163a2e, B: 0x14121a, A: 0xc8e0e8 } },
  // Nico Tarn: young and loud, a mustard check suit, a bowler pushed back
  'npc-lq-nico': { hat: 'bowler', held: 'cards', pal: { H: 0x2a2420, h: 0x5a4a3a, S: 0xd8b090, T: 0xb08a3a, t: 0xe8e0d0, P: 0x8a6a2a, B: 0x2a1e16, A: 0xf2ead8 } },
  // Mrs Odell Fenn: black bombazine, a widow's cap, one coin for the bank
  'npc-lq-fenn': { hat: 'veil', held: null, pal: { H: 0x2a2630, S: 0xd8b8a0, T: 0x26222a, t: 0xc8c0b8, P: 0x26222a, B: 0x14121a } },
  // Dev the deckhand: a striped shirt, a knitted cap, a coil of line
  'npc-lq-dev': { hat: 'beanie', held: 'coil', pal: { H: 0x8a2a2a, S: 0xa87858, T: 0x4a5a7a, t: 0xe8e0d0, P: 0x4a3e30, B: 0x2a1e16, A: 0xc8b080 } },
  // the faro dealer: shirtsleeves and garters, a green eyeshade, the box
  'npc-lq-dealer': { hat: 'peaked', held: 'cards', pal: { H: 0x2e6a4a, h: 0x1e4a32, S: 0xd0a888, T: 0xe8e0d0, t: 0x6a2430, P: 0x2a2630, B: 0x14121a, A: 0xf2ead8 } },
  // the casekeeper beside him (the abacus that counts the cards out)
  'npc-lq-casekeeper': { hat: 'none', held: null, pal: { H: 0x4a3424, S: 0xc89878, T: 0x3a3440, t: 0xe8e0d0, P: 0x2a2630, B: 0x14121a } },
  // the saloon steward: a white jacket, a tray of the house's whisky
  'npc-lq-steward': { hat: 'none', held: 'tray', pal: { H: 0x1e1a1e, S: 0x8a5a3b, T: 0xf2ead8, t: 0x2a2630, P: 0x2a2630, B: 0x14121a, A: 0xc8a050 } },
  // the band: a parlour upright, a banjo, a snare with brushes, a clarinet
  'npc-lq-pianist': { hat: 'none', held: null, pal: { H: 0x3a2a20, S: 0xd0a888, T: 0x2a2630, t: 0xe8e0d0, P: 0x2a2630, B: 0x14121a } },
  'npc-lq-banjo': { hat: 'bowler', held: 'banjo', pal: { H: 0x3a3028, h: 0x1e1a1e, S: 0x8a5a3b, T: 0x5a3a2a, t: 0xe8e0d0, P: 0x3a3028, B: 0x14121a, A: 0xd8c8a0 } },
  'npc-lq-drummer': { hat: 'none', held: null, pal: { H: 0x6a4a2a, S: 0xd8b090, T: 0x3a4a3a, t: 0xe8e0d0, P: 0x2a2630, B: 0x14121a } },
  'npc-lq-clarinet': { hat: 'none', held: 'clarinet', pal: { H: 0x2a1e18, S: 0xc89878, T: 0x2a2630, t: 0xe8e0d0, P: 0x2a2630, B: 0x14121a, A: 0x1e1a1e } },
  // the pilot at his wheel: a pea jacket and a peaked cap
  'npc-lq-pilot': { hat: 'peaked', held: null, pal: { H: 0x1e2440, h: 0x8a6a2a, S: 0xc89878, T: 0x2a2e3a, t: 0xe8e0d0, P: 0x2a2630, B: 0x14121a } },
  // the quay at dusk: a porter with a crate, a lady going aboard, the clerk
  'npc-lq-porter': { hat: 'cap', held: 'crate', pal: { H: 0x4a3e30, S: 0x8a5a3b, T: 0x6a5a48, t: 0xd8ccb0, P: 0x3e3428, B: 0x2a1e16, A: 0x8a6a42 } },
  'npc-lq-lady': { hat: 'veil', held: null, pal: { H: 0x6a3a4a, S: 0xe0bca0, T: 0x5a2a3a, t: 0xe8dcc8, P: 0x4a2230, B: 0x14121a } },
  'npc-lq-clerk': { hat: 'bowler', held: 'ledger', pal: { H: 0x2a2420, h: 0x14121a, S: 0xd0a888, T: 0x3a3440, t: 0xe8e0d0, P: 0x2a2630, B: 0x14121a, A: 0x5a2a22 } },
};

// the one foe, in foeArt's person() form: [hat for the old grid, held] + palette
// (the rig's hat comes from CAST_BODIES). Crake walks; he never runs.
export const FOE_LOOKS = {
  'foe-lq-crake': { hat: 'cap', held: null, pal: [0x14121a, 0xc8b0a0, 0x1e1a22, 0x14121a, 0x2a2630, 0x14121a, 0x8a8478] },
};
