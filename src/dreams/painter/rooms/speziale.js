// THE COLOUR-SELLER: Orazio's shop under the sign of the mortar. The world
// goes dark and glittering: jars to the beams, a copper still glowing on its
// brazier, a balance on the counter, a cut of lapis under a glass bell. The
// lapis Jo needs is on the top shelf, up the rolling ladders, past a Dori
// apprentice who has been sniffing round it all morning and a pigeon that
// got in. Over the still, the hardest shelf run hides a heart shard.
import { grid } from './grid.js';

const g = grid(40, 20);
g.fill(0, 0, 39, 1); // the beams
g.fill(0, 18, 39, 19); // the floor
g.fill(0, 2, 1, 17); // the walls
g.fill(38, 2, 39, 17);
g.put(14, 14, '===========');  // the low shelf (x 14–24)
g.put(25, 10, '============');  // the middle shelf (x 25–36)
g.put(4, 6, '===================');  // the long top shelf over the still (x 4–22)
g.put(28, 6, '=========');  // the top shelf with the lapis (x 28–36)
for (let y = 13; y <= 17; y++) g.put(13, y, 'H'); // floor → low shelf
for (let y = 9; y <= 13; y++) g.put(24, y, 'H'); // low → middle
for (let y = 5; y <= 9; y++) g.put(27, y, 'H'); // middle → top

export default {
  id: 'speziale',
  origin: { tx: 60, ty: 40 },
  grid: g.rows(),
  material: 'cotto_floor',
  regions: [
    { rect: [0, 0, 39, 1], material: 'lime_wall' },
    { rect: [0, 2, 1, 17], material: 'lime_wall' },
    { rect: [38, 2, 39, 17], material: 'lime_wall' },
    { rect: [2, 3, 37, 15], material: 'oak_floor' },
  ],
  decor: [],
  props: [
    { prop: 'jar_wall', x: 14, y: 14, layer: 'back' },
    { prop: 'jar_wall', x: 26, y: 10, layer: 'back' },
    { prop: 'jar_wall', x: 4, y: 6, layer: 'back' },
    { prop: 'jar_wall', x: 12, y: 6, layer: 'back' },
    { prop: 'jar_wall', x: 27, y: 6, layer: 'back' },
    { prop: 'jar_wall', x: 26, y: 18, layer: 'back' },
    { prop: 'alembic', x: 7, y: 18 },
    { prop: 'counter', x: 11, y: 18 },
    { prop: 'sacks', x: 20, y: 18 },
    { prop: 'sacks', x: 35, y: 18 },
  ],
  lights: [{ x: 7, y: 15, r: 140, color: 0xffa860 }, { x: 33, y: 4, r: 110, color: 0x8aa8f0 }],
  enclosure: { backWall: 'plaster', wainscot: false, posts: 0, ceiling: true, pillars: false, frames: [{ x: 2, y: 15, w: 2, h: 3 }], palette: { wall: 0x8a6a52, wood: 0x4a3020, accent: 0x22408a, deep: 0x1e1418, lit: 0xf2c890 } },
  light: { tint: 0xf2e4d8 },
  backdrop: null,
  ambience: 'rn_speziale',
  acoustics: 'room',
  music: { state: 'quiet', bpm: 60, key: 'speziale' },
  objective: [{ text: 'climb_lapis' }, { text: 'back_bottega', flag: 'lapis' }],
  titleCard: 'THE COLOUR-SELLER',
  entities: [
    { type: 'portal', id: 'speziale>via', kind: 'door', x: 3, y: 17, to: { room: 'via', portal: 'via>speziale' }, door: { prompt: 'out to the street', fade: 260 } },
    { type: 'checkpoint', id: 'cp_speziale', label: 'THE COLOUR-SELLER', x: 17, y: 17 },
    { type: 'npc', id: 'orazio', cast: 'npc-rn-orazio', x: 11, y: 17, dx: 8, facing: 1, depth: 'behind', talk: [{ conv: 'orazio_after', if: 'lapis' }, { conv: 'orazio' }] },
    { type: 'foe', kind: 'rival', x: 30, y: 9, patrol: [26, 35] },
    { type: 'foe', kind: 'pigeon', x: 32, y: 5, patrol: [29, 35] },
    { type: 'keyitem', id: 'lapis', x: 35, y: 5, beat: 'got_lapis' },
    // the shard over the still, at the far end of the top shelf; its coins
    { type: 'shard', id: 'shard_still', x: 5, y: 4 },
    { type: 'coins', id: 'c_top', x: 9, y: 4, n: 8 },
    { type: 'coins', id: 'c_mid', x: 29, y: 8, n: 4 },
    { type: 'coin', id: 'c_low', x: 18, y: 12 },
  ],
};
