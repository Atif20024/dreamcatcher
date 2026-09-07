// D4 — the kinds registry: what each foe/NPC name looks like and how it acts.
// `human: true` means a PERSON (D6.1) — cannot be killed, grabs instead.
// Textures come from entities/foeArt.js: every kind has its own silhouette and
// its own walk frames.
export const FOES = {
  chef: {
    rat: { texture: 'foe-rat', human: false, speed: 90, dustColors: [0x5a3a28, 0x3a2a20] },
    crawler: { texture: 'foe-crawler', human: false, speed: 70, dustColors: [0x5a3a28, 0x3a2a20] },
    grease_blob: { texture: 'foe-grease', human: false, speed: 40, splits: true, dustColors: [0x50525e, 0x2a2a30] },
    pepper_mill: { texture: 'foe-mill', human: false, speed: 50, sprays: true, dustColors: [0x6a4a32, 0x4a3222] },
    meringue: { texture: 'foe-meringue', human: false, speed: 40, floats: true, dustColors: [0xf0e8e0, 0xd8d0c8] },
    runaway_cart: { texture: 'foe-cart', human: false, speed: 150, heavy: true, dustColors: [0x8a8e9a, 0x5a5e6a] },
    dock_hand: { texture: 'foe-dock-hand', human: false, speed: 70 },
    sous_chef: { texture: 'foe-sous-chef', human: true, speed: 80, sight: 170 },
  },
  astronaut: {
    gym_rat: { texture: 'foe-gym-rat', human: true, speed: 55, sight: 110 },
    cleaner: { texture: 'foe-cleaner', human: true, speed: 60, sight: 130 },
    security: { texture: 'foe-security', human: true, speed: 70, sight: 160 },
  },
  musician: {
    heckler: { texture: 'foe-heckler', human: true, speed: 0, ranged: true, sight: 360 },
    bouncer: { texture: 'foe-bouncer', human: true, speed: 60, big: true, sight: 150 },
    scalper: { texture: 'foe-scalper', human: true, speed: 120, steals: true, sight: 130 },
    manager: { texture: 'foe-manager', human: true, speed: 55, cone: true, sight: 200 },
    roadie: { texture: 'foe-roadie', human: true, speed: 50, unkillable: true, sight: 90 },
    metronome_walker: { texture: 'foe-walker', human: false, speed: 60, onBeat: true, dustColors: [0x8a8494, 0xe86a6a] },
    wisp: { texture: 'foe-wisp', human: false, speed: 55, chases: true, dustColors: [0xa0a8d8, 0x2a2a40] },
  },
};

export const NPCS = {
  chef: { marguerite: 'portrait-marguerite', aurelio: 'portrait-aurelio' },
  musician: {
    delphine: 'npc-delphine',
    nia: 'npc-nia',
    marcus: 'npc-marcus',
    ray: 'npc-ray',
    tally: 'npc-tally',
    sol: 'npc-sol',
  },
};
