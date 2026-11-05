// THE CORRIDOR: night, pale green tile, one yellow lamp. The ward doors are shut and
// the night sister has her rounds, so it is the service stairs at the far end, iron
// and loud: walk them. Up on the landing, a chair outside a shut door, and Ottavia.
// Nobody is shown hurt, and nobody goes through that door. (Fail state: drop off the
// stairs and the whole corridor hears it; Sister Agnese sends Jo back to the foot.)
import { grid } from '../../painter/rooms/grid.js';
import { goalsFrom } from '../season.js';

const g = grid(40, 22);
g.fill(0, 0, 39, 1);
g.fill(0, 20, 39, 21);
g.fill(0, 2, 1, 19);
g.fill(38, 2, 39, 19);
// the upper landing, Ottavia's end
g.fill(2, 10, 26, 10);
// the service stairs: iron flights, a turn at each
g.put(32, 17, '=====');
g.put(27, 14, '=====');
g.put(27, 10, '=======');
// the top flight's little shelf, for nothing but a nosy man's nuts
g.put(34, 6, '====');

export const STAIR_FOOT = 34; // where a noisy man is sent back to
export const CHAIR_COL = 9;
export const OTTAVIA_COL = 14;

export default {
  id: 'hospital',
  origin: { tx: 195, ty: 0 },
  grid: g.rows(),
  material: 'ward_floor',
  regions: [
    { rect: [0, 0, 39, 1], material: 'ward_wall' },
    { rect: [0, 2, 1, 19], material: 'ward_wall' },
    { rect: [38, 2, 39, 19], material: 'ward_wall' },
    { rect: [2, 10, 26, 10], material: 'ward_floor' },
  ],
  decor: [],
  props: [
    { prop: 'door_wood', x: 3, y: 20, layer: 'back' },
    { prop: 'ward_door', x: 12, y: 20, layer: 'back' },
    { prop: 'ward_door', x: 22, y: 20, layer: 'back' },
    { prop: 'linen_trolley', x: 17, y: 20 },
    { prop: 'wall_lamp_yellow', x: 8, y: 3, dy: 8 },
    { prop: 'iron_tread', x: 34, y: 17, dy: 0, layer: 'back' },
    { prop: 'iron_tread', x: 29, y: 14, dy: 0, layer: 'back' },
    { prop: 'iron_tread', x: 31, y: 10, dy: 0, layer: 'back' },
    { prop: 'ward_door', x: 5, y: 10, layer: 'back' },
    { prop: 'wooden_chair', x: CHAIR_COL, y: 10, layer: 'back' },
    { prop: 'bench', x: OTTAVIA_COL, y: 10, layer: 'back' },
    // (the week before the Coppa, Nino comes up for them: rooms/pitlane.js)
    { prop: 'gloves_on_chair', x: CHAIR_COL, y: 8, dy: 24, when: 'gloves_left', unless: 'garage_again', live: true },
  ],
  lights: [{ x: 8, y: 5, r: 200, color: 0xf2d080 }],
  enclosure: { backWall: 'plaster', wainscot: false, posts: 0, ceiling: true, pillars: false, frames: [], palette: { wall: 0xd0e4d8, wood: 0x8aa09a, accent: 0xa0b8b0, deep: 0x5e7270, lit: 0xeaf4ee } },
  light: { tint: 0xe4ecf2 },
  backdrop: null,
  ambience: 'pv_ward',
  acoustics: 'room',
  events: null,
  music: { state: 'silent', key: 'corridor' },
  objective: [{ text: 'gloves_goal' }, { text: 'gloves_chair', flag: 'ward_told' }, ...goalsFrom('to_kitchen')],
  titleCard: 'THE CORRIDOR',
  goal: 'bring Aldo his gloves',
  walks: true, // Jo walks in here, of his own accord
  quiet: { until: 'gloves_left', foot: STAIR_FOOT, row: 19, dropTiles: 3.5, beat: 'loud' },
  entities: [
    { type: 'portal', id: 'hospital>quay', kind: 'door', x: 3, y: 19, to: { room: 'quay', portal: 'quay>hospital' }, door: { prompt: 'out to the quay', fade: 300 } },
    { type: 'checkpoint', id: 'cp_hospital', label: 'THE CORRIDOR', x: 6, y: 19 },
    { type: 'sign', text: 'VISITING 4 TILL 6', x: 12, y: 15, board: 0x2a3a38, ink: 0xdcecf4, rim: 0x8a9aa8, scale: 1, size: 'body' },
    { type: 'npc', id: 'agnese', cast: 'npc-pv-agnese', x: 15, y: 19, facing: 1, pace: [8, 26], talk: [{ conv: 'agnese_late', if: 'garage_again' }, { conv: 'agnese_up', if: 'gloves_left' }, { conv: 'agnese' }] },
    // (before the talk, her [E] is in verbs/places.js: give her the gloves)
    { type: 'npc', id: 'ottavia_ward', cast: 'npc-pv-ottavia', x: OTTAVIA_COL, y: 9, pose: 'sit', facing: -1, unless: 'jars_done', talk: [{ conv: 'corridor_after', if: 'gloves_left' }, { conv: 'corridor_after', if: 'ward_told' }] },
    { type: 'coins', id: 'c_h1', x: 34, y: 5, n: 4, dx: 1 },
  ],
};
