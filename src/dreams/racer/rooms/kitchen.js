// THE CASTELLANE KITCHEN: terracotta, cream, an evening window. Carry the tin from the
// dresser to the table, and SPLIT it: twelve coins, three jars that want sixteen.
// Something goes short, and the Signora notices which (verbs/places.js, season.js).
// (Fail state: short the rent and she says nothing about it, ever.) The roof pays.
import { grid } from '../../painter/rooms/grid.js';

const g = grid(32, 14);
g.fill(0, 0, 31, 1);
g.fill(0, 12, 31, 13);
g.fill(0, 2, 1, 11);
g.fill(30, 2, 31, 11);
g.put(5, 8, '=====');

export const JAR_COLS = [13, 16, 19];
export const TIN_COL = 7;
export const CLOSE_COL = 11; // where the empty tin is shut, the table's near end

export default {
  id: 'kitchen',
  origin: { tx: 240, ty: 0 },
  grid: g.rows(),
  material: 'kitchen_tile',
  regions: [
    { rect: [0, 0, 31, 1], material: 'kitchen_wall' },
    { rect: [0, 2, 1, 11], material: 'kitchen_wall' },
    { rect: [30, 2, 31, 11], material: 'kitchen_wall' },
  ],
  decor: [],
  props: [
    { prop: 'door_wood', x: 3, y: 12, layer: 'back' },
    { prop: 'dresser', x: TIN_COL, y: 12, layer: 'back' },
    { prop: 'prize_tin', x: TIN_COL, y: 7, dy: 2, unless: 'tin_taken', live: true },
    { prop: 'evening_window', x: 16, y: 7, layer: 'back' },
    { prop: 'kitchen_clock', x: 22, y: 5, layer: 'back' },
    { prop: 'kitchen_table', x: 16, y: 12, layer: 'back' },
    { prop: 'chair', x: 11, y: 12, layer: 'back' },
    { prop: 'chair', x: 21, y: 12, layer: 'back' },
    { prop: 'iron_stove', x: 26, y: 12, layer: 'back' },
    ...JAR_COLS.map((x) => ({ prop: 'jar', x, y: 10, dy: 8, layer: 'back' })),
    { prop: 'hanging_lamp', x: 16, y: 2 },
  ],
  lights: [{ x: 16, y: 4, r: 170, color: 0xffb060 }, { x: 26, y: 9, r: 90, color: 0xff7a3a }],
  enclosure: { backWall: 'plaster', wainscot: true, posts: 0, ceiling: true, pillars: false, frames: [], palette: { wall: 0xd8c8a4, wood: 0x6a4a2c, accent: 0xb86a4a, deep: 0x5a4a34, lit: 0xf2e6cc } },
  light: { tint: 0xffe8c8 },
  backdrop: null,
  ambience: 'pv_kitchen',
  acoustics: 'room',
  events: null,
  music: { state: 'quiet', key: 'kitchen' },
  objective: [{ text: 'carry_tin' }, { text: 'split', flag: 'tin_taken' }, { text: 'close_tin', flag: 'tin_empty' }, { text: 'drive', flag: 'jars_done' }],
  titleCard: 'THE CASTELLANE KITCHEN',
  goal: 'carry the prize tin to the table',
  entities: [
    { type: 'portal', id: 'kitchen>quay', kind: 'door', x: 3, y: 11, to: { room: 'quay', portal: 'quay>kitchen' }, door: { prompt: 'out to the quay', fade: 240 } },
    { type: 'spawn', id: 'start', x: 11, y: 11 },
    { type: 'checkpoint', id: 'cp_kitchen', label: 'THE CASTELLANE KITCHEN', x: 5, y: 11 },
    { type: 'npc', id: 'signora', cast: 'npc-pv-signora', x: 25, y: 11, facing: 1, turns: false, talk: [{ conv: 'signora_after', if: 'jars_done' }, { conv: 'signora' }] },
    { type: 'moment', id: 'm_letter', x: 21, y: 11, prompt: 'read the letter by the clock', beat: 'moment_letter' },
    // on top of the dresser, for a boy who still climbs kitchens
    { type: 'coins', id: 'c_k1', x: 5, y: 7, n: 5, dx: 1 },
  ],
};
