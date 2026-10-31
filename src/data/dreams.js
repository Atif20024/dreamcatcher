// The dreams the station sells tickets to. Order = platform number.
// `coin` is the dream's PAY (collectibles skill §1): every dream has one
// coin sprite and one worth. Some dreams pay, some don't — the player
// feels it at Bilal's stall, where prices are in worth.
// `scene` is the Phaser scene key that plays the dream; a dream without one
// is a line on the board that isn't running yet (see HubScene.board()).
// livery: [body, trim, window] colours + an emblem, so no two trains match.
// conductor: the question asked at the door before Jo commits to the journey.
// Phase 3b: THE BIG STAGE plays on the framework (DreamScene, src/dreams/
// musician/). ?legacy=1 boards the old MusicianScene instead, for comparison.
export const LEGACY_MUSICIAN = typeof window !== 'undefined' && !!window.location && new URLSearchParams(window.location.search).get('legacy') === '1';
// the painter likewise: THE MASTER'S LADDER, or with ?legacy=1 THE YELLOW HOUSE
export const LEGACY_PAINTER = LEGACY_MUSICIAN;
// and the gambler: THE LAST HAND aboard the Lantern Queen, or with ?legacy=1 the neon casino
export const LEGACY_GAMBLER = LEGACY_MUSICIAN;

export const DREAMS = [
  {
    id: 'chef', platform: 1, title: 'FIVE-STAR DREAM', scene: 'Chef', propsKind: 'produce', ambientLoop: 'sizzle',
    coin: { name: 'brass tip', worth: 5, budget: [60, 80], pal: { c: 0xb8862c, C: 0xf2d580, h: 0xfff2c8 } },
    livery: { body: 0xb83a34, trim: 0xf2e6cc, window: 0xf2c078, emblem: 'cloche' },
    conductor: 'Five-Star Dream, sir. The kitchen at Le Rêve, and the critics are in tonight.\nAre you ready to cook for people who came to be disappointed?',
    roLine: "Kitchen grease. You've been somewhere hot. Sit, I'll get it off.",
  },
  {
    id: 'musician', platform: 2, title: 'THE BIG STAGE', scene: LEGACY_MUSICIAN ? 'Musician' : 'Dream', propsKind: 'posters', ambientLoop: 'tuning',
    coin: { name: 'busker coin', worth: 1, budget: [120, 150], pal: { c: 0x8a5a34, C: 0xc08a50, h: 0xe8c090 } },
    livery: { body: 0x1e2a4a, trim: 0xc4a25c, window: 0x88b8d8, emblem: 'trumpet' },
    conductor: 'The Big Stage. A cellar on a Tuesday, a festival on Saturday, eleven minutes in the lights.\nDo you still want to be heard that badly?',
    roLine: 'Your fingers are shaking. Big room?',
  },
  {
    id: 'athlete', platform: 3, title: 'THE FINISH LINE', propsKind: 'blocks', ambientLoop: 'pistol',
    coin: { name: 'medal chip', worth: 20, budget: [25, 35], pal: { c: 0x9a9aa8, C: 0xd8d8e0, h: 0xffffff } },
    livery: { body: 0xf2e6cc, trim: 0x2e6a4a, window: 0x88b8d8, emblem: 'stripe' },
    conductor: 'The Finish Line. Nobody remembers second.', roLine: 'Cinder on the soles. You ran somewhere.',
  },
  {
    id: 'writer', platform: 4, title: 'THE SECOND DRAFT', scene: 'Writer', propsKind: 'pages', ambientLoop: 'typewriter',
    coin: { name: 'penny', worth: 2, budget: [100, 120], pal: { c: 0x8a5a34, C: 0xb87333, h: 0xe8c090 } },
    livery: { body: 0x3a3a44, trim: 0xe8e4d8, window: 0xf2d580, emblem: 'quill' },
    conductor: 'The Second Draft. Nothing in it is done the first time.\nAre you ready to write it, lose it, and write it again worse?',
    roLine: 'Ink on your fingers. And you look like you slept at a desk.',
  },
  {
    // THE MASTER'S LADDER (src/dreams/painter/, DreamScene) replaced THE
    // YELLOW HOUSE; ?legacy=1 boards the old PainterScene. The save flag
    // (dreams.painter) is the same id.
    id: 'painter', platform: 5, title: LEGACY_PAINTER ? 'THE YELLOW HOUSE' : "THE MASTER'S LADDER", scene: LEGACY_PAINTER ? 'Painter' : 'Dream', propsKind: 'easels', ambientLoop: LEGACY_PAINTER ? 'cicadas' : 'rn_street',
    coin: LEGACY_PAINTER ? { name: 'tube cap', worth: 2, budget: [100, 120], pal: { c: 0xb8862c, C: 0xf2d060, h: 0xfff2a0 } } : { name: 'giglio', worth: 3, budget: [80, 100], pal: { c: 0xa87a24, C: 0xe8c050, h: 0xfff0b0 } },
    livery: { body: 0x22408a, trim: 0xd8a840, window: 0xf2d8a0, emblem: 'lily' },
    conductor: "The Master's Ladder. A city of workshops, one chapel, and a contest at the bell.\nYou start by sweeping the floor, sir. Are you ready to climb?",
    roLine: 'Gold under your nails. And lime. You were up a scaffold somewhere.',
  },
  {
    id: 'astronaut', platform: 6, title: 'THE QUIET ABOVE', scene: 'Astronaut', propsKind: 'crates', ambientLoop: 'engines',
    coin: { name: 'mission patch', worth: 10, budget: [45, 55], pal: { c: 0x3a5a80, C: 0x88b8d8, h: 0xf0f4ff } },
    livery: { body: 0xf0f2f6, trim: 0x2a2a34, window: 0x88b8d8, emblem: 'wings' },
    conductor: 'The Quiet Above. A year on the ground for eleven days in the sky.\nEvery mile up is a mile away from everyone you know. Still going?',
    roLine: 'You keep looking up, love. The tea is down here.',
  },
  {
    // THE LAST HAND (src/dreams/gambler/, DreamScene): the Lantern Queen on
    // the Verrane, 1884, Lou Verrick's dream. ?legacy=1 boards the old neon
    // casino (GamblerScene). The save flag (dreams.gambler) is the same id.
    id: 'gambler', platform: 7, title: 'THE LAST HAND', scene: LEGACY_GAMBLER ? 'Gambler' : 'Dream', propsKind: 'chips', ambientLoop: LEGACY_GAMBLER ? 'slots' : 'gm_quay',
    coin: LEGACY_GAMBLER ? { name: 'chip', worth: 25, budget: [40, 50], pal: { c: 0xa8243a, C: 0xe84a5a, h: 0xf8d0c0 } } : { name: 'half dime', worth: 5, budget: [40, 55], pal: { c: 0x8a8a92, C: 0xd0d0d8, h: 0xf4f4f8 } },
    livery: LEGACY_GAMBLER ? { body: 0x12101a, trim: 0xe03a8a, window: 0xf2c078, emblem: 'spade' } : { body: 0x5a1e26, trim: 0xd8c8a0, window: 0xf2c078, emblem: 'spade' },
    conductor: LEGACY_GAMBLER ? 'The Last Hand. A casino that never closes, and one chip in your pocket.\nTonight is the night, sir. It always is. Still boarding?' : "The Last Hand. A riverboat, a hundred dollars, and a night that ends at the landing.\nThe hard part, sir, is getting up from the table. Still boarding?",
    roLine: LEGACY_GAMBLER ? 'Cigar smoke and carpet. And your horn case is light. Sit.' : 'River fog on your coat, and lamp oil. Sit. Did you get up in time?',
  },
  {
    id: 'doctor', platform: 8, title: 'THE WHITE COAT', propsKind: 'lockers', ambientLoop: 'monitors',
    coin: { name: 'brass pin', worth: 25, budget: [20, 30], pal: { c: 0xb8862c, C: 0xf2d580, h: 0xfff2c8 } },
    livery: { body: 0xf6f2ea, trim: 0xc03a2a, window: 0x88b8d8, emblem: 'cross' },
    conductor: 'The White Coat. They will thank you and forget your name by morning.', roLine: 'Scrubbed raw. Long shift.',
  },
  {
    // the clockmaker's dream: to keep a whole town's time, and be noticed
    // only on the evening it stops (src/dreams/clockmaker/, DreamScene)
    id: 'clockmaker', platform: 9, title: 'THE STOPPED HOUR', scene: 'Dream', propsKind: 'clocks', ambientLoop: 'dusk_lane',
    coin: { name: 'brass cog', worth: 3, budget: [30, 40], pal: { c: 0x8a6a2c, C: 0xc8a050, h: 0xf2e0a0 } },
    livery: { body: 0x2e4a3a, trim: 0xc8a050, window: 0xffc870, emblem: 'clock' },
    conductor: "The Stopped Hour. A little town where every lamp went out at six, and the clock with them.\nKeep its time, sir, and nobody will ever know your name. Still boarding?",
    roLine: 'Brass dust on your cuffs. You fixed something nobody thanked you for.',
  },
];

// the last stop: THE LONG EVENING is a train like any other, open from the
// first visit, no count to clear. It stands at platform G beside platform 9
// (the turnstile and the service gate past it still lead there too).
export const LAST_STOP = {
  id: 'last', platform: 'G', title: 'THE LAST STOP', scene: 'Evening',
  livery: { body: 0x3a2a24, trim: 0xf2c078, window: 0xffd890, emblem: 'star' },
  conductor: 'The Last Stop, sir. No ticket, no count to clear.\nIt is warm on the other side. Are you going through?',
};

export function dreamById(id) {
  return DREAMS.find((d) => d.id === id);
}
