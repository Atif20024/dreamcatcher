// THE PEREVAL GARAGE: oil-brown, cream and teal, one hot bulb. The carburettor is on
// the bench (TUNE), the tyres on the rack, the Heron at the roller shutter with her
// nose to the road: the door into RaceScene, in verbs/garage.js. Aldo's car stands
// beside her until the Harbour Night Cup, and under a sheet after it. The rafters pay.
import { grid } from '../../painter/rooms/grid.js';
import { SEASON_GOALS } from '../season.js';

const g = grid(34, 14);
g.fill(0, 0, 33, 1); // the roof
g.fill(0, 12, 33, 13); // the floor
g.fill(0, 2, 1, 11); // the walls
g.fill(32, 2, 33, 11);
g.put(15, 9, '=====');
g.put(8, 7, '=====');
g.put(20, 6, '=======');

export default {
  id: 'garage',
  origin: { tx: 0, ty: 0 },
  grid: g.rows(),
  material: 'garage_floor',
  regions: [
    { rect: [0, 0, 33, 1], material: 'garage_wall' },
    { rect: [0, 2, 1, 11], material: 'garage_wall' },
    { rect: [32, 2, 33, 11], material: 'garage_wall' },
  ],
  decor: [],
  props: [
    { prop: 'garage_shutter', x: 28, y: 12, layer: 'back' },
    { prop: 'door_wood', x: 3, y: 12, layer: 'back' },
    { prop: 'tyre_rack', x: 6, y: 12, layer: 'back' },
    { prop: 'tool_board', x: 13, y: 9, layer: 'back' },
    { prop: 'work_bench', x: 12, y: 12, layer: 'back' },
    { prop: 'wireless_shelf', x: 18, y: 8, layer: 'back' },
    { prop: 'oil_drum', x: 16, y: 12 },
    { prop: 'oil_drum', x: 17, y: 12, dx: 8 },
    { prop: 'hanging_lamp', x: 17, y: 2 },
    { prop: 'sheeted_car', x: 21, y: 12, when: 'done_race2', live: true },
    // his gloves on his own car's cowl, until the Cup: Nino's line and the chair have something to remember
    { prop: 'gloves_on_chair', x: 19, y: 11, dy: -17, unless: 'done_race2', live: true },
  ],
  lights: [{ x: 17, y: 5, r: 170, color: 0xffb060 }],
  enclosure: { backWall: 'blocks', wainscot: true, posts: 3, ceiling: true, pillars: false, frames: [], palette: { wall: 0x6a5240, wood: 0x3a2a20, accent: 0x1f7a78, deep: 0x1a1412, lit: 0xf2c078 } },
  light: { tint: 0xf2dcc0 },
  backdrop: null,
  ambience: (F) => (F.tuned ? 'pv_garage_tuned' : 'pv_garage'), // she stops beating, and the room hears it
  acoustics: 'room',
  events: null,
  music: { state: 'explore', key: 'garage', wall: 900 },
  objective: SEASON_GOALS,
  titleCard: 'THE PEREVAL GARAGE',
  goal: 'get her singing: tune the carburettor by ear',
  entities: [
    { type: 'spawn', id: 'start', x: 7, y: 11 },
    { type: 'checkpoint', id: 'garage', label: 'THE PEREVAL GARAGE', x: 7, y: 11 },
    { type: 'portal', id: 'garage>quay', kind: 'door', x: 3, y: 11, to: { room: 'quay', portal: 'quay>garage' }, door: { prompt: 'out to the quay', fade: 240 } },
    { type: 'npc', id: 'ottavia', cast: 'npc-pv-ottavia', x: 14, y: 11, facing: -1, turns: true, unless: 'done_race2', talk: [{ conv: 'ottavia_after', if: 'tuned' }, { conv: 'ottavia_first' }] },
    // back from the corridor she has the bench again, and her question
    { type: 'npc', id: 'ottavia_back', cast: 'npc-pv-ottavia', x: 14, y: 11, facing: -1, when: 'jars_done', talk: [{ conv: 'ottavia_quiet', if: 'garage_again' }, { conv: 'ottavia_again', if: 'done_race4' }, { conv: 'ottavia_quiet' }] },
    { type: 'npc', id: 'aldo', cast: 'npc-pv-aldo', x: 22, y: 11, facing: 1, unless: 'done_race2', talk: [{ conv: 'aldo_settled', if: 'tyres_settled' }, { conv: 'aldo_tyres', if: 'done_race1' }, { conv: 'aldo_first' }] },
    { type: 'npc', id: 'tullio', cast: 'npc-pv-tullio', x: 18, y: 11, facing: 1, pace: [16, 24], talk: [{ conv: 'tullio_after', if: 'done_race2' }, { conv: 'tullio_tyre' }] },
    { type: 'npc', id: 'nino', cast: 'npc-pv-nino', x: 9, y: 11, facing: 1, turns: false, talk: [{ conv: 'nino_after', if: 'done_race2' }, { conv: 'nino_sweep' }] },
    { type: 'moment', id: 'm_radio', x: 19, y: 11, prompt: 'listen to the wireless', beat: 'moment_radio' },
    // his gloves, on the bench end, from the morning after the Cup
    { type: 'keyitem', id: 'gloves', x: 10, y: 11, when: 'cup_told', beat: 'got_gloves' },
    // the rafters pay: a hop from the drums, then along the beams
    { type: 'coins', id: 'c_g1', x: 15, y: 8, n: 4, dx: 1 },
    { type: 'coins', id: 'c_g2', x: 8, y: 6, n: 5, dx: 1 },
    { type: 'coins', id: 'c_g3', x: 20, y: 5, n: 7, dx: 1 },
  ],
};
