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
    id: 'painter', platform: 4, title: 'THE GALLERY WALL', propsKind: 'easels', ambientLoop: 'turps',
    coin: { name: 'tube cap', worth: 2, budget: [100, 120], pal: { c: 0x3a5a80, C: 0x88b8d8, h: 0xd8ecf8 } },
    livery: { body: 0x3a5a80, trim: 0xe86a6a, window: 0xf2d580, emblem: 'palette' },
    conductor: 'The Gallery Wall. They hang what sells.', roLine: 'Blue under the nails. Somebody painted.',
  },
  {
    id: 'founder', platform: 5, title: 'THE CORNER OFFICE', propsKind: 'boxes', ambientLoop: 'phones',
    coin: { name: 'share token', worth: 50, budget: [8, 12], pal: { c: 0x2e6a4a, C: 0x50c878, h: 0xc8f0d8 } },
    livery: { body: 0x50525e, trim: 0xb8bcc8, window: 0xd8ecf8, emblem: 'chart' },
    conductor: 'The Corner Office. Forty floors up, and the window does not open.', roLine: "New shoes. Too new. They hurt, don't they.",
  },
  {
    id: 'pilot', platform: 6, title: 'THE HIGH ROAD', propsKind: 'crates', ambientLoop: 'engines',
    coin: { name: 'wing pin', worth: 15, budget: [30, 40], pal: { c: 0x6a6e7a, C: 0xb8bcc8, h: 0xf0f4ff } },
    livery: { body: 0x88b8d8, trim: 0xf2e6cc, window: 0x2a2a34, emblem: 'wings' },
    conductor: 'The High Road. Everything looks small from up there. Including home.', roLine: 'Salt on the leather. Wind off the sea.',
  },
  {
    id: 'actor', platform: 7, title: 'THE MARQUEE', propsKind: 'lights', ambientLoop: 'applause',
    coin: { name: 'ticket stub', worth: 3, budget: [80, 100], pal: { c: 0xa8443a, C: 0xe86a6a, h: 0xf8c8c0 } },
    livery: { body: 0x1a1a20, trim: 0xf2d580, window: 0xf2c078, emblem: 'star' },
    conductor: 'The Marquee. Your name in lights, spelled almost right.', roLine: 'Stage dust. You stood in a light.',
  },
  {
    id: 'doctor', platform: 8, title: 'THE WHITE COAT', propsKind: 'lockers', ambientLoop: 'monitors',
    coin: { name: 'brass pin', worth: 25, budget: [20, 30], pal: { c: 0xb8862c, C: 0xf2d580, h: 0xfff2c8 } },
    livery: { body: 0xf6f2ea, trim: 0xc03a2a, window: 0x88b8d8, emblem: 'cross' },
    conductor: 'The White Coat. They will thank you and forget your name by morning.', roLine: 'Scrubbed raw. Long shift.',
  },
];

export const LAST_STOP = { id: 'last', platform: '??', title: 'THE LAST STOP', scene: null };

export function dreamById(id) {
  return DREAMS.find((d) => d.id === id);
}
