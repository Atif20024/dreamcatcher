// The dreams the station sells tickets to. Order = platform number.
// `scene` is the Phaser scene key that plays the dream; a dream without one
// is a line on the board that isn't running yet (see HubScene.board()).
// livery: [body, trim, window] colours + an emblem, so no two trains match.
// conductor: the question asked at the door before Jo commits to the journey.
export const DREAMS = [
  {
    id: 'chef', platform: 1, title: 'FIVE-STAR DREAM', scene: 'Chef', propsKind: 'produce', ambientLoop: 'sizzle',
    livery: { body: 0xb83a34, trim: 0xf2e6cc, window: 0xf2c078, emblem: 'cloche' },
    conductor: 'Five-Star Dream, sir. The kitchen at Le Rêve, and the critics are in tonight.\nAre you ready to cook for people who came to be disappointed?',
    roLine: "Kitchen grease. You've been somewhere hot. Sit, I'll get it off.",
  },
  {
    id: 'musician', platform: 2, title: 'THE BIG STAGE', scene: 'Musician', propsKind: 'posters', ambientLoop: 'tuning',
    livery: { body: 0x1e2a4a, trim: 0xc4a25c, window: 0x88b8d8, emblem: 'trumpet' },
    conductor: 'The Big Stage. Seven days, one half door, a room that listens once.\nDo you still want to be heard that badly?',
    roLine: 'Your fingers are shaking. Big room?',
  },
  {
    id: 'athlete', platform: 3, title: 'THE FINISH LINE', propsKind: 'blocks', ambientLoop: 'pistol',
    livery: { body: 0xf2e6cc, trim: 0x2e6a4a, window: 0x88b8d8, emblem: 'stripe' },
    conductor: 'The Finish Line. Nobody remembers second.', roLine: 'Cinder on the soles. You ran somewhere.',
  },
  {
    id: 'painter', platform: 4, title: 'THE GALLERY WALL', propsKind: 'easels', ambientLoop: 'turps',
    livery: { body: 0x3a5a80, trim: 0xe86a6a, window: 0xf2d580, emblem: 'palette' },
    conductor: 'The Gallery Wall. They hang what sells.', roLine: 'Blue under the nails. Somebody painted.',
  },
  {
    id: 'founder', platform: 5, title: 'THE CORNER OFFICE', propsKind: 'boxes', ambientLoop: 'phones',
    livery: { body: 0x50525e, trim: 0xb8bcc8, window: 0xd8ecf8, emblem: 'chart' },
    conductor: 'The Corner Office. Forty floors up, and the window does not open.', roLine: "New shoes. Too new. They hurt, don't they.",
  },
  {
    id: 'pilot', platform: 6, title: 'THE HIGH ROAD', propsKind: 'crates', ambientLoop: 'engines',
    livery: { body: 0x88b8d8, trim: 0xf2e6cc, window: 0x2a2a34, emblem: 'wings' },
    conductor: 'The High Road. Everything looks small from up there. Including home.', roLine: 'Salt on the leather. Wind off the sea.',
  },
  {
    id: 'actor', platform: 7, title: 'THE MARQUEE', propsKind: 'lights', ambientLoop: 'applause',
    livery: { body: 0x1a1a20, trim: 0xf2d580, window: 0xf2c078, emblem: 'star' },
    conductor: 'The Marquee. Your name in lights, spelled almost right.', roLine: 'Stage dust. You stood in a light.',
  },
  {
    id: 'doctor', platform: 8, title: 'THE WHITE COAT', propsKind: 'lockers', ambientLoop: 'monitors',
    livery: { body: 0xf6f2ea, trim: 0xc03a2a, window: 0x88b8d8, emblem: 'cross' },
    conductor: 'The White Coat. They will thank you and forget your name by morning.', roLine: 'Scrubbed raw. Long shift.',
  },
];

export const LAST_STOP = { id: 'last', platform: '??', title: 'THE LAST STOP', scene: null };

export function dreamById(id) {
  return DREAMS.find((d) => d.id === id);
}
