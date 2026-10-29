// THE GUILD HALL: the stone chamber of the guild the painters share with
// the physicians and the colour-sellers (they all buy and sell pigments).
// The banners of the arts hang from the beams, high windows throw the light
// across the flags, and the consuls sit on their dais at the far end with
// the book of members. Inspectors walk the floor and the gallery; their eyes
// decide when Jo can cross. On the dais he paints his test piece, a head and
// a hand on a panel, in front of the men who will trust him with their walls.
import { grid } from './grid.js';

const g = grid(46, 16);
g.fill(0, 0, 45, 1); // the vault
g.fill(0, 14, 45, 15); // the flags
g.fill(0, 2, 1, 13); // the walls
g.fill(44, 2, 45, 13);
g.fill(34, 13, 43, 13); // the dais, one step up
g.put(33, 13, '/');
g.put(10, 9, '=====================');  // the gallery (x 10–30)
for (let y = 8; y <= 13; y++) g.put(9, y, 'H'); // its ladder

export default {
  id: 'guild',
  origin: { tx: 110, ty: 40 },
  grid: g.rows(),
  material: 'piazza_stone',
  regions: [
    { rect: [0, 0, 45, 1], material: 'chapel_stone' },
    { rect: [0, 2, 1, 13], material: 'chapel_stone' },
    { rect: [44, 2, 45, 13], material: 'chapel_stone' },
    { rect: [10, 9, 30, 9], material: 'oak_floor' },
    { rect: [33, 13, 43, 13], material: 'oak_floor' },
  ],
  decor: [],
  props: [
    { prop: 'banner', x: 6, y: 2, layer: 'back', palette: { a: 0xc83a2a, b: 0xd8a840, e: 'lily' } },
    { prop: 'banner', x: 13, y: 2, layer: 'back', palette: { a: 0x22408a, b: 0xf0e8d8, e: 'tower' } },
    { prop: 'banner', x: 20, y: 2, layer: 'back', palette: { a: 0x2e6a4a, b: 0xd8a840, e: 'wheel' } },
    { prop: 'banner', x: 27, y: 2, layer: 'back', palette: { a: 0xf0e8d8, b: 0xc83a2a, e: 'key' } },
    { prop: 'banner', x: 36, y: 2, layer: 'back', palette: { a: 0x8a2a5a, b: 0xd8a840, e: 'star' } },
    { prop: 'high_window', x: 16, y: 5, layer: 'back' },
    { prop: 'high_window', x: 24, y: 5, layer: 'back' },
    { prop: 'stone_bench', x: 20, y: 14 },
    { prop: 'dais_table', x: 40, y: 13 },
    { prop: 'trestle', x: 37, y: 13 },
  ],
  lights: [{ x: 38, y: 10, r: 150, color: 0xffd8a0 }],
  enclosure: { backWall: 'blocks', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 2, y: 11, w: 2, h: 3 }], palette: { wall: 0xb0a488, wood: 0x4a3020, accent: 0xa82e2a, deep: 0x241e1c, lit: 0xfff0d0 } },
  light: { tint: 0xf8f0e4 },
  backdrop: null,
  ambience: 'rn_hall',
  acoustics: 'hall',
  music: { state: 'quiet', bpm: 60, key: 'hall' },
  objective: [
    { text: 'meet_consul' },
    { text: 'trial', flag: 'trial_set' },
    { text: 'take_seal', flag: 'guild_master' },
    { text: 'to_palazzo', flag: 'seal' },
  ],
  titleCard: 'THE GUILD HALL',
  entities: [
    { type: 'portal', id: 'guild>piazza', kind: 'door', x: 3, y: 13, to: { room: 'piazza', portal: 'piazza>guild' }, door: { prompt: 'out to the square', fade: 260 } },
    { type: 'checkpoint', id: 'cp_guild', label: 'THE GUILD HALL', x: 6, y: 13 },
    { type: 'foe', kind: 'inspector', x: 18, y: 13, patrol: [12, 31] },
    { type: 'foe', kind: 'inspector', x: 24, y: 8, patrol: [13, 29] },
    { type: 'npc', id: 'folco', cast: 'npc-rn-folco', x: 40, y: 12, facing: -1, talk: [{ conv: 'folco_after', if: 'guild_master' }, { conv: 'folco_wait', if: 'trial_set' }, { conv: 'folco_first' }] },
    { type: 'npc', id: 'consul', cast: 'npc-rn-consul', x: 42, y: 12, facing: -1, talk: [{ conv: 'consul' }] },
    { type: 'encounter', id: 'masterpiece', x: 36, y: 12, anchor: { x: 37, y: 5 }, prompt: 'paint the test piece', when: 'trial_set', unless: 'guild_master' },
    { type: 'keyitem', id: 'seal', x: 38, y: 12, when: 'guild_master', beat: 'got_seal' },
    // giglio coins: along the gallery, over the inspectors' heads
    { type: 'coins', id: 'c_gallery', x: 12, y: 7, n: 7 },
    { type: 'coin', id: 'c_dais', x: 34, y: 11 },
  ],
};
