// THE MASTER'S LADDER's people (round 2 WP2 cast, era costume): looks for the
// rig bake (scripts/lib/cast-bake.js → public/atlas/people*). Bodies (sex,
// age, robe, beard, hat) are in src/data/scale.js CAST_BODIES under the same
// keys. Pure data: the atlas bake imports it in Node.
//   pal: H hat (or hair when the hat is 'none'), h band, S skin, T tunic or
//        robe, t trim (collar, fur, shirt), P hose, B shoes, A the held thing
// Fioralba dresses in earths and one precious colour each: the master's
// red lucco, the banker's ultramarine gown, the rival's green, the consul's
// scarlet. Tunics to the thigh over coloured hose, soft caps, rolled hats.
export const PEOPLE = {
  // the master of the bottega: a red lucco to the shin, a black berretta
  'npc-rn-gualtiero': { hat: 'berretta', held: 'brush', pal: { H: 0x2a2028, S: 0xd0a888, T: 0x8a2a2a, t: 0xd8c8a8, P: 0x3a2a2a, B: 0x2a1e1a, A: 0xd8a840 } },
  // Bice, the dreamer at sixteen: auburn hair, an ochre-green gown, charcoal
  'npc-rn-bice': { hat: 'none', held: 'brush', pal: { H: 0x8a3a1e, S: 0xe0b898, T: 0x5a6a3a, t: 0xe8dcc0, P: 0x4a4a2a, B: 0x3a2a1e, A: 0x2a2228 } },
  // the colour-seller: an apron over a plum tunic, his ledger of prices
  'npc-rn-orazio': { hat: 'cap', held: 'ledger', pal: { H: 0x4a2a3a, S: 0xc89878, T: 0x5a3a5a, t: 0xe8e0c8, P: 0x3a3040, B: 0x2a1e1a, A: 0x8a5a3a } },
  // the consul of the guild: scarlet robe, a tall red hat, the book of members
  'npc-rn-folco': { hat: 'toque', held: 'book', pal: { H: 0xa02a2a, S: 0xd8b498, T: 0xa82e2a, t: 0xe8d8b0, P: 0x4a1e1e, B: 0x2a1e1a, A: 0x6a3a2a } },
  'npc-rn-consul': { hat: 'toque', held: null, pal: { H: 0x2a3a6a, S: 0xc89878, T: 0x2e3e6e, t: 0xd8c8a0, P: 0x1e2440, B: 0x1e1a1a } },
  // the banker: an ultramarine gown trimmed with fur, a rolled hat
  'npc-rn-corso': { hat: 'mazzocchio', held: null, pal: { H: 0x3a1a2a, h: 0x5a2a3a, S: 0xd8b090, T: 0x22347a, t: 0xc8b090, P: 0x1e1e3a, B: 0x1a1618 } },
  // the celebrated rival: big, bearded, green velvet, a rolled hat
  'npc-rn-dori': { hat: 'mazzocchio', held: 'brush', pal: { H: 0x1e3a2a, h: 0x2e5a3a, S: 0xc89878, T: 0x2e5a3a, t: 0xd8c890, P: 0x1e2a1e, B: 0x1a1618, A: 0xd8a840 } },
  // Tonio, the other apprentice: a short tunic, red hose, a broom
  'npc-rn-tonio': { hat: 'berretta', held: 'broom', pal: { H: 0x5a3a22, S: 0xd0a080, T: 0x8a6a3a, t: 0xe8dcc0, P: 0x8a2a2a, B: 0x3a2a1e, A: 0xc8a050 } },
  // the square: a woman with her basket, a friar, a beggar (Jo's study of hands)
  'npc-rn-woman': { hat: 'veil', held: 'basket', pal: { H: 0xe8dcc0, S: 0xd8b090, T: 0x8a4a3a, t: 0xe8dcc0, P: 0x5a3a2a, B: 0x3a2a1e, A: 0xc8a060 } },
  'npc-rn-friar': { hat: 'veil', held: 'book', pal: { H: 0x5a4632, S: 0xc89878, T: 0x5a4632, t: 0x4a3a28, P: 0x4a3a28, B: 0x2a1e1a, A: 0x6a3a2a } },
  'npc-rn-beggar': { hat: 'none', held: null, pal: { H: 0x8a8478, S: 0xb08868, T: 0x6a5a48, t: 0x8a7a62, P: 0x5a4a3a, B: 0x3a2e24 } },
  // the guild's men at the dais and the palazzo's steward
  'npc-rn-steward': { hat: 'berretta', held: 'ledger', pal: { H: 0x1e1a2a, S: 0xd8b498, T: 0x3a3a4a, t: 0xd8d0c0, P: 0x8a6a2a, B: 0x1a1618, A: 0x8a5a3a } },
};

// the foes, in foeArt's person() form: [hat for the old grid, held] + palette
// (the rig's hat comes from CAST_BODIES)
export const FOE_LOOKS = {
  // the Dori workshop's apprentices: green caps, green-and-ochre tunics
  'foe-rn-rival': { hat: 'cap', held: null, pal: [0x2e6a3a, 0xd0a080, 0x3a6a3a, 0x2a4a2a, 0xb8a050, 0x2a1e1a, 0xd8d0c0] },
  // the guild's inspectors: scarlet robes, tall hats, the ledger of fines
  'foe-rn-inspector': { hat: 'cap', held: 'clipboard', pal: [0x8a1e22, 0xd8b498, 0x9a2a2a, 0x6a1a1e, 0x3a1a1a, 0x1e1a1a, 0x6a4a32] },
  // Bruno, the jealous foreman: big, a rope coil, a work scarf
  'foe-rn-foreman': { hat: 'bandana', held: 'coil', pal: [0x6a3a22, 0xb08060, 0x6a5a42, 0x4a3e2e, 0x4a3a2a, 0x2a1e1a, 0xc8b080] },
};
