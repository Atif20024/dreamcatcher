// THE NIGHT BEFORE: the Gull Bend on foot, a lamp and a chalk stick. Stand at the
// braking board, the turn-in and the apex, and press [E] at each, in that order: the
// marks are for the finale (flags mark_brake, mark_turn, mark_apex; race 6 reads them
// when it exists). The road is washed out before the apex: miss the jump in the dark
// and it is back to the lamp. Leave without the marks if you like; the finale knows.
import { grid } from '../../painter/rooms/grid.js';

const g = grid(76, 18);
g.fill(0, 14, 76, 17);
g.fill(0, 0, 1, 13);
g.fill(74, 0, 75, 13);
g.clear(50, 14, 53, 17); // the washout
// the cliff wall above the road pays
g.put(30, 11, '======');
g.put(60, 11, '======');

export const MARKS = [
  { flag: 'mark_brake', col: 16, prompt: 'chalk the braking board' },
  { flag: 'mark_turn', col: 40, prompt: 'chalk the turn-in' },
  { flag: 'mark_apex', col: 66, prompt: 'chalk the apex' },
];

export default {
  id: 'nightbefore',
  origin: { tx: 280, ty: 0 },
  grid: g.rows(),
  material: 'road_dust',
  decor: [],
  props: [
    ...[8, 18, 28, 38, 48, 58, 68].map((x) => ({ prop: 'cliff_wall', x, y: 14, layer: 'back' })),
    { prop: 'telegraph_pole', x: 24, y: 14, layer: 'back' },
    { prop: 'telegraph_pole', x: 48, y: 14, layer: 'back' },
    { prop: 'brake_board', x: 16, y: 14, layer: 'back' },
    { prop: 'brake_board', x: 40, y: 14, layer: 'back' },
    { prop: 'brake_board', x: 66, y: 14, layer: 'back' },
    { prop: 'straw_bales', x: 46, y: 14 },
    { prop: 'straw_bales', x: 58, y: 14 },
    ...[16, 40, 66].map((x, i) => ({ prop: 'chalk_mark', x, y: 14, dy: 2, layer: 'fg', when: ['mark_brake', 'mark_turn', 'mark_apex'][i], live: true })),
  ],
  backdrop: { set: 'coast_night', horizon: 13 },
  ambience: 'pv_gull',
  acoustics: 'open',
  events: null,
  music: { state: 'silent', key: 'gull' },
  objective: [{ text: 'chalk' }, { text: 'to_pit', flag: 'chalked' }],
  titleCard: 'THE NIGHT BEFORE',
  goal: 'walk the corner: chalk your marks',
  light: { tint: 0xa0a8d0 },
  entities: [
    { type: 'portal', id: 'gull>quay', kind: 'door', x: 3, y: 13, to: { room: 'quay', portal: 'quay>gull' }, door: { prompt: 'back to the quay', fade: 300 } },
    { type: 'checkpoint', id: 'cp_gull', label: 'THE NIGHT BEFORE', x: 6, y: 13 },
    { type: 'checkpoint', id: 'cp_gull2', label: 'THE GULL BEND', x: 44, y: 13 },
    { type: 'sign', text: 'GULL BEND', x: 44, y: 9, board: 0x2a2420, ink: 0xf2e6cc, scale: 1 },
    { type: 'coins', id: 'c_n1', x: 30, y: 10, n: 6, dx: 1 },
    { type: 'coins', id: 'c_n2', x: 60, y: 10, n: 6, dx: 1 },
  ],
};
