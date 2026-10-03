// The dreams the station sells tickets to. Order = platform number.
// `coin` is the dream's PAY (collectibles skill §1): every dream has one
// coin sprite and one worth. Some dreams pay, some don't — the player
// feels it at Bilal's stall, where prices are in worth.
// `scene` is the Phaser scene key that plays the dream; a dream without one
// is a line on the board that isn't running yet (see HubScene.board()).
// livery: [body, trim, window] colours + an emblem, so no two trains match.
// conductor: the question asked at the door before Jo commits to the journey.
export const DREAMS = [
  {
    id: 'chef', platform: 1, title: 'FIVE-STAR DREAM', scene: 'Chef', propsKind: 'produce', ambientLoop: 'sizzle',
    coin: { name: 'brass tip', worth: 5, budget: [60, 80], pal: { c: 0xb8862c, C: 0xf2d580, h: 0xfff2c8 } },
    livery: { body: 0xb83a34, trim: 0xf2e6cc, window: 0xf2c078, emblem: 'cloche' },
    conductor: 'Five-Star Dream, sir. The kitchen at Le Rêve, and the critics are in tonight.\nAre you ready to cook for people who came to be disappointed?',
    roLine: "Kitchen grease. You've been somewhere hot. Sit, I'll get it off.",
  },
  {
    id: 'musician', platform: 2, title: 'THE BIG STAGE', scene: 'Musician', propsKind: 'posters', ambientLoop: 'tuning',
    coin: { name: 'busker coin', worth: 1, budget: [120, 150], pal: { c: 0x8a5a34, C: 0xc08a50, h: 0xe8c090 } },
    livery: { body: 0x1e2a4a, trim: 0xc4a25c, window: 0x88b8d8, emblem: 'trumpet' },
    conductor: 'The Big Stage. Seven days, one half door, a room that listens once.\nDo you still want to be heard that badly?',
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
    livery: { body: 0x3a3a44, trim: 0xe8e4d8, window: 0xf2d580, emblem: 'palette' },
    conductor: 'The Second Draft. Nothing in it is done the first time.\nAre you ready to write it, lose it, and write it again worse?',
    roLine: 'Ink on your fingers. And you look like you slept at a desk.',
  },
  {
    id: 'painter', platform: 5, title: 'THE YELLOW HOUSE', scene: 'Painter', propsKind: 'easels', ambientLoop: 'cicadas',
    coin: { name: 'tube cap', worth: 2, budget: [100, 120], pal: { c: 0xb8862c, C: 0xf2d060, h: 0xfff2a0 } },
    livery: { body: 0xe8b830, trim: 0x1f3a5f, window: 0x5b3a7a, emblem: 'sun' },
    conductor: 'The Yellow House. South, where the light is. Nobody there sees what you see.\nAre you ready to paint it anyway, and sell none of it?',
    roLine: 'Paint under your nails. Yellow. You went somewhere bright.',
  },
  {
    id: 'astronaut', platform: 6, title: 'THE QUIET ABOVE', scene: 'Astronaut', propsKind: 'crates', ambientLoop: 'engines',
    coin: { name: 'mission patch', worth: 10, budget: [45, 55], pal: { c: 0x3a5a80, C: 0x88b8d8, h: 0xf0f4ff } },
    livery: { body: 0xf0f2f6, trim: 0x2a2a34, window: 0x88b8d8, emblem: 'wings' },
    conductor: 'The Quiet Above. A year on the ground for eleven days in the sky.\nEvery mile up is a mile away from everyone you know. Still going?',
    roLine: 'You keep looking up, love. The tea is down here.',
  },
  {
    id: 'gambler', platform: 7, title: 'THE LAST HAND', scene: 'Gambler', propsKind: 'chips', ambientLoop: 'slots',
    coin: { name: 'chip', worth: 25, budget: [40, 50], pal: { c: 0xa8243a, C: 0xe84a5a, h: 0xf8d0c0 } },
    livery: { body: 0x12101a, trim: 0xe03a8a, window: 0xf2c078, emblem: 'spade' },
    conductor: 'The Last Hand. A casino that never closes, and one chip in your pocket.\nTonight is the night, sir. It always is. Still boarding?',
    roLine: 'Cigar smoke and carpet. And your horn case is light. Sit.',
  },
  {
    id: 'doctor', platform: 8, title: 'THE WHITE COAT', propsKind: 'lockers', ambientLoop: 'monitors',
    coin: { name: 'brass pin', worth: 25, budget: [20, 30], pal: { c: 0xb8862c, C: 0xf2d580, h: 0xfff2c8 } },
    livery: { body: 0xf6f2ea, trim: 0xc03a2a, window: 0x88b8d8, emblem: 'cross' },
    conductor: 'The White Coat. They will thank you and forget your name by morning.', roLine: 'Scrubbed raw. Long shift.',
  },
];

// the last stop: the gate past the turnstile, open from the first visit —
// THE LONG EVENING is a train like any other, no count to clear
export const LAST_STOP = { id: 'last', platform: 'G', title: 'THE LAST STOP', scene: 'Evening' };

export function dreamById(id) {
  return DREAMS.find((d) => d.id === id);
}
