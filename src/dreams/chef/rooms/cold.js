// THE COLD STORE: three floors of galvanised rack in the hotel's cellar, the
// compressor's hum, sides of beef that slide on an overhead rail with a rattle
// first. The saffron is on the top shelf, under its own lamp, because Chef
// keeps it where nobody will take it. The COLD meter is the only clock: at zero
// the hands let go. Halfway up, one warm pipe, and the cat that found it first.
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(28, 30);
g.fill(0, 0, 27, 3);
g.fill(0, 28, 27, 29);
g.fill(0, 4, 1, 27);
g.fill(26, 4, 27, 27);
const deck = (y, x0, x1) => g.put(x0, y, '='.repeat(x1 - x0 + 1));
deck(24, 2, 15);
deck(20, 10, 25);
deck(16, 3, 18);
deck(12, 2, 14);
deck(8, 10, 25);
g.ladder(5, 24, 27, [24]);
g.ladder(14, 20, 23, [20]);
g.ladder(17, 16, 19, [16]);
g.ladder(4, 12, 15, [12]);
g.ladder(13, 8, 11, [8]);

export default {
  id: 'cold',
  origin: { tx: 90, ty: 0 },
  grid: g.rows(),
  material: 'cold_steel',
  regions: [
    { rect: [0, 0, 27, 3], material: 'cold_wall' },
    { rect: [0, 4, 1, 27], material: 'cold_wall' },
    { rect: [26, 4, 27, 27], material: 'cold_wall' },
    { rect: [2, 8, 25, 24], material: 'rack_plank' },
  ],
  decor: [],
  props: [
    { prop: 'swing_door_cold', x: 3, y: 28, layer: 'back' },
    { prop: 'swing_door_cold', x: 24, y: 28, layer: 'back' },
    { prop: 'compressor', x: 12, y: 28, layer: 'back' },
    { prop: 'cold_rack', x: 8, y: 24, layer: 'back' },
    { prop: 'cold_rack', x: 19, y: 28, layer: 'back' },
    { prop: 'cold_rack', x: 10, y: 20, layer: 'back' },
    { prop: 'cold_rack', x: 7, y: 16, layer: 'back' },
    { prop: 'cold_rack', x: 18, y: 8, layer: 'back' },
    { prop: 'beef_rail', x: 14, y: 16, dy: -68, layer: 'back' },
    { prop: 'beef_rail', x: 9, y: 12, dy: -68, layer: 'back' },
    { prop: 'beef_rail', x: 14, y: 20, dy: -68, layer: 'back' },
    { prop: 'beef_rail', x: 17, y: 8, dy: -68, layer: 'back' },
    { prop: 'warm_pipe', x: 22, y: 20, dy: -10, layer: 'back' },
    { prop: 'curled_cat', x: 22, y: 20, dy: -34 },
    { prop: 'speaking_tube', x: 8, y: 25, layer: 'back' },
    { prop: 'hanging_bulb', x: 23, y: 4, layer: 'back' },
  ],
  lights: [{ x: 22, y: 17, r: 110, color: 0xffb060 }, { x: 23, y: 5, r: 120, color: 0xfff0c0 }],
  enclosure: { backWall: 'blocks', wainscot: false, posts: 0, ceiling: true, pillars: false, frames: [], palette: { wall: 0x4a5866, wood: 0x2a3440, accent: 0x6a7a8a, deep: 0x141a22, lit: 0xb8d0e0 } },
  light: { tint: 0xc8dcf0 },
  backdrop: null,
  ambience: 'fs_cold',
  acoustics: 'room',
  events: null,
  music: { state: 'silent', key: 'cold', wall: 400 },
  objective: [{ text: 'saffron' }, { text: 'out_cold', flag: 'saffron' }],
  titleCard: 'THE COLD STORE',
  service: 'cold',
  cold: true,
  warm: [[19, 16, 24, 19]],
  beef: [
    { y: 19, x0: 11, x1: 18, speed: 60, wait: 1800 },
    { y: 15, x0: 6, x1: 16, speed: 70, wait: 1600 },
    { y: 11, x0: 5, x1: 13, speed: 70, wait: 1500 },
    { y: 7, x0: 14, x1: 21, speed: 80, wait: 1400 },
  ],
  entities: [
    { type: 'portal', id: 'cold>pit', kind: 'door', x: 3, y: 27, to: { room: 'pit', portal: 'pit>cold' }, door: { prompt: 'back to the pit', fade: 220 } },
    { type: 'checkpoint', id: 'cp_cold', label: 'THE COLD STORE', x: 8, y: 27 },
    { type: 'sign', text: 'PREP', x: 24, y: 22, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'SAFFRON UP TOP, CHEF SAYS', x: 13, y: 25, board: 0x2a3440, ink: 0xdcecf4, rim: 0x8a9aa8, scale: 1, size: 'body' },
    { type: 'portal', id: 'cold>prep', kind: 'door', x: 24, y: 27, to: { room: 'prep', portal: 'prep>cold' }, door: { prompt: 'through to prep', fade: 220, requires: ['saffron'], locked: 'not without the saffron', lockedLine: "Not without the tin. He'd only send me back." } },
    { type: 'moment', id: 'm2', x: 21, y: 19, prompt: 'sit with the cat', beat: 'moment_cat' },
    { type: 'keyitem', id: 'saffron', x: 23, y: 7, beat: 'saffron_got' },
    // the top of each rack pays, away from the ladders
    { type: 'coins', id: 'c_c1', x: 16, y: 18, n: 4, dx: 1 },
    { type: 'coins', id: 'c_c2', x: 6, y: 14, n: 4, dx: 1 },
    { type: 'coins', id: 'c_c3', x: 15, y: 6, n: 5, dx: 1 },
    { type: 'shard', x: 3, y: 10 },
    { type: 'coins', id: 'c_c4', x: 7, y: 10, n: 3, dx: 1 },
  ],
};
