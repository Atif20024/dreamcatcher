// D4 — the kinds registry: what each foe/NPC name looks like and how it acts.
// `human: true` means a PERSON (D6.1) — cannot be killed, grabs instead.
// Textures come from entities/foeArt.js: every kind has its own silhouette and
// its own walk frames.
export const FOES = {
  chef: {
    // Brann: walks the prep floor; his grab sends Jo back to the door
    sous_chef: { texture: 'foe-sous-chef', human: true, speed: 80, sight: 170 },
  },
  astronaut: {
    gym_rat: { texture: 'foe-gym-rat', human: true, speed: 55, sight: 110 },
    cleaner: { texture: 'foe-cleaner', human: true, speed: 60, sight: 130 },
    security: { texture: 'foe-security', human: true, speed: 70, sight: 160 },
  },
  writer: {
    landlady: { texture: 'foe-landlady', human: true, speed: 85, sight: 150 },
    pigeon: { texture: 'foe-pigeon', human: false, speed: 40, dustColors: [0x7a7a88, 0xc8c8d0] },
    talker: { texture: 'foe-talker', human: true, speed: 0, sight: 0, pushes: true },
    guard: { texture: 'foe-guard', human: true, speed: 65, sight: 170, hears: true },
    slip: { texture: 'foe-slip', human: false, speed: 110, floats: true, chases: true, dustColors: [0xe8e4d8, 0xc03a2a] },
    proofreader: { texture: 'foe-proofreader', human: true, speed: 95, sight: 200, homing: true },
  },
  painter: {
    crow: { texture: 'foe-crow', human: false, speed: 120, floats: true, steals: true, dustColors: [0x1f3a5f, 0x2a2a44] },
    petitioner: { texture: 'foe-petitioner', human: true, speed: 45, sight: 120 },
    gendarme: { texture: 'foe-gendarme', human: true, speed: 75, sight: 170 },
    gardener: { texture: 'foe-gardener', human: true, speed: 50, sight: 110, gentle: true },
    farmer: { texture: 'foe-farmer', human: true, speed: 100, sight: 180 },
    shopkeeper: { texture: 'foe-shopkeeper', human: true, speed: 70, sight: 140 },
    // THE MASTER'S LADDER (the framework painter): the Dori workshop's
    // apprentices, the guild's inspectors, Bruno the foreman and his
    // porters, and the pigeons that get into every chapel (they hurt on
    // contact and can be stomped; a boy drawing does not frighten them)
    rival: { texture: 'foe-rn-rival', human: true, speed: 85, sight: 150 },
    inspector: { texture: 'foe-rn-inspector', human: true, speed: 55, sight: 190, cone: true },
    foreman: { texture: 'foe-rn-foreman', human: true, speed: 50, big: true, sight: 130 },
    porter: { texture: 'foe-rn-porter', human: true, speed: 45, big: true, sight: 110 },
    pigeon: { texture: 'foe-pigeon', human: false, speed: 40, silenced: false, dustColors: [0x8a8a98, 0xd8d8e0] },
  },
  gambler: {
    security: { texture: 'foe-floor-security', human: true, speed: 70, sight: 160 },
    collector: { texture: 'foe-collector', human: true, speed: 80, sight: 170 },
    runner: { texture: 'foe-runner', human: true, speed: 130, steals: true, sight: 120 },
    bouncer: { texture: 'foe-lounge-bouncer', human: true, speed: 45, big: true, sight: 140 },
    pit: { texture: 'foe-pit', human: true, speed: 50, sight: 400, passive: true },
    // THE LAST HAND (the framework gambler): Crake, the debt man. He walks;
    // he never runs. He comes when there is a marker in Mr Pell's book
    crake: { texture: 'foe-lq-crake', human: true, speed: 38, sight: 260 },
  },
  musician: {
    heckler: { texture: 'foe-heckler', human: true, speed: 0, ranged: true, sight: 360 },
    bouncer: { texture: 'foe-bouncer', human: true, speed: 60, big: true, sight: 150 },
    scalper: { texture: 'foe-scalper', human: true, speed: 120, steals: true, sight: 130 },
    manager: { texture: 'foe-manager', human: true, speed: 55, cone: true, sight: 200 },
    roadie: { texture: 'foe-roadie', human: true, speed: 50, unkillable: true, sight: 90 },
    wisp: { texture: 'foe-wisp', human: false, speed: 55, chases: true, dustColors: [0xa0a8d8, 0x2a2a40] },
  },
};

export const NPCS = {
  musician: {
    delphine: 'npc-delphine',
    nia: 'npc-nia',
    marcus: 'npc-marcus',
    ray: 'npc-ray',
    tally: 'npc-tally',
    sol: 'npc-sol',
  },
};
