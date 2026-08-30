// D4 — the kinds registry: what each foe/NPC name looks like and how it acts.
// `human: true` means a PERSON (D6.1) — cannot be killed, grabs instead.
export const FOES = {
  chef: {
    rat: { texture: 'chef-crawler', human: false, speed: 90, tint: 0x6a5a4a, dustColors: [0x5a3a28, 0x3a2a20] },
    crawler: { texture: 'chef-crawler', human: false, speed: 70, dustColors: [0x5a3a28, 0x3a2a20] },
    grease_blob: { texture: 'chef-pot', human: false, speed: 40, splits: true, dustColors: [0x50525e, 0x2a2a30] },
    pepper_mill: { texture: 'chef-mill', human: false, speed: 50, sprays: true, dustColors: [0x6a4a32, 0x4a3222] },
    meringue: { texture: 'chef-meringue', human: false, speed: 40, floats: true, dustColors: [0xf0e8e0, 0xd8d0c8] },
    runaway_cart: { texture: 'chef-cart', human: false, speed: 150, heavy: true, dustColors: [0x8a8e9a, 0x5a5e6a] },
    dock_hand: { texture: 'npc-roadie', human: false, speed: 70, tint: 0x9a8a7a },
    sous_chef: { texture: 'npc-roadie', human: true, speed: 80, tint: 0xd8d8d0, sight: 170 },
  },
  musician: {
    heckler: { texture: 'npc-roadie', human: true, speed: 0, ranged: true, tint: 0xb08858, sight: 360 },
    bouncer: { texture: 'npc-roadie', human: true, speed: 60, big: true, tint: 0x4a4a58, sight: 150 },
    scalper: { texture: 'npc-scalper', human: true, speed: 120, steals: true, sight: 130 },
    manager: { texture: 'npc-roadie', human: true, speed: 55, cone: true, tint: 0x8a8a6a, sight: 200 },
    roadie: { texture: 'npc-roadie', human: true, speed: 50, unkillable: true, sight: 90 },
    metronome_walker: { texture: 'mus-walker', human: false, speed: 60, onBeat: true, dustColors: [0x8a8494, 0xe86a6a] },
    wisp: { texture: 'mus-wisp', human: false, speed: 55, chases: true, dustColors: [0xa0a8d8, 0x2a2a40] },
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
