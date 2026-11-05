// THE QUAY: the one street on this stretch of the Calvessa Coast, a sea wall and a
// row of stone fronts, each a door into a place of the season. The doors say what
// opens them, so what comes next is shown before you need it. Roofs and the awning
// pay, for the climb. (Not in the design's table: the places need a street to be on.)
import { grid } from '../../painter/rooms/grid.js';
import { SEASON_GOALS } from '../season.js';

const g = grid(112, 18);
g.fill(0, 16, 111, 17);
g.fill(0, 0, 1, 15);
g.fill(110, 0, 111, 15);
// the awning, then the cafe's roof ridge by the pine's stump, and along the Castellanes' roof
g.put(38, 12, '=======');
g.put(45, 9, '====');
g.put(24, 9, '==========');
g.put(50, 6, '======');

export default {
  id: 'quay',
  origin: { tx: 40, ty: 0 },
  grid: g.rows(),
  material: 'quay_setts',
  decor: [],
  props: [
    ...[5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105].map((x) => ({ prop: 'sea_wall', x, y: 16, layer: 'back' })),
    { prop: 'umbrella_pine', x: 16, y: 16, layer: 'back' },
    { prop: 'pereval_front', x: 7, y: 16, layer: 'back' },
    { prop: 'castellane_front', x: 26, y: 16, layer: 'back' },
    { prop: 'cafe_front', x: 44, y: 16, layer: 'back' },
    { prop: 'cafe_awning', x: 41, y: 13, layer: 'back' },
    { prop: 'telegraph_pole', x: 34, y: 16, layer: 'back' },
    { prop: 'hospital_front', x: 64, y: 16, layer: 'back' },
    { prop: 'telegraph_pole', x: 74, y: 16, layer: 'back' },
    { prop: 'umbrella_pine', x: 78, y: 16, layer: 'back' },
    { prop: 'road_arch', x: 86, y: 16, layer: 'back' },
    { prop: 'milestone', x: 91, y: 16 },
    { prop: 'straw_bales', x: 95, y: 16 },
    { prop: 'road_arch', x: 103, y: 16, layer: 'back' },
    { prop: 'fishing_boat', x: 52, y: 16, dy: -6, layer: 'back' },
    { prop: 'barrel', x: 49, y: 16 },
    { prop: 'crate', x: 50, y: 16 },
  ],
  backdrop: { set: 'coast_day', horizon: 15 },
  enclosure: { fgFoliage: [{ x: -1, w: 3 }] },
  ambience: 'pv_quay',
  acoustics: 'open',
  events: 'pv_quay',
  music: { state: 'quiet', key: 'quay' },
  objective: SEASON_GOALS,
  titleCard: 'THE QUAY',
  entities: [
    { type: 'portal', id: 'quay>garage', kind: 'door', x: 3, y: 15, to: { room: 'garage', portal: 'garage>quay' }, door: { prompt: 'in to the garage', fade: 240 } },
    { type: 'checkpoint', id: 'cp_quay', label: 'THE QUAY', x: 12, y: 15 },
    { type: 'sign', text: 'PEREVAL CORSE', x: 7, y: 9, board: 0x1f7a78, ink: 0xf2e6cc, rim: 0xe8dcc0, scale: 1 },
    { type: 'portal', id: 'quay>kitchen', kind: 'door', x: 26, y: 15, to: { room: 'kitchen', portal: 'kitchen>quay' }, door: { prompt: 'in to the Castellanes', fade: 240, requires: ['gloves_left'], locked: 'the Castellanes: shut', lockedLine: 'Nobody home. Ottavia is at the garage, and her mother goes to the market.' } },
    { type: 'sign', text: 'CASTELLANE', x: 26, y: 11, board: 0x4a3020, ink: 0xf2e6cc, scale: 1 },
    { type: 'portal', id: 'quay>sponsor', kind: 'door', x: 37, y: 15, to: { room: 'sponsor', portal: 'sponsor>quay' }, door: { prompt: 'up to Sable Oil', fade: 240, requires: ['done_race3'], locked: 'Sable Oil: by appointment', lockedLine: 'By appointment, and a garage this small does not have one yet.' } },
    { type: 'sign', text: 'SABLE OIL', x: 44, y: 5, board: 0x2e4a3a, ink: 0xf2d580, rim: 0xc8a050, scale: 1 },
    { type: 'sign', text: 'CAFE', x: 44, y: 11, board: 0x4a3020, ink: 0xf2e6cc, scale: 1 },
    { type: 'portal', id: 'quay>hospital', kind: 'door', x: 64, y: 15, to: { room: 'hospital', portal: 'hospital>quay' }, door: { prompt: 'in, quietly', fade: 300, requires: ['done_race2'], locked: 'the hospital', lockedLine: 'Nobody I know is in there. I would like it to stay that way.' } },
    { type: 'sign', text: 'OSPEDALE', x: 64, y: 10, board: 0x4a5a58, ink: 0xf2e6cc, scale: 1 },
    { type: 'portal', id: 'quay>pit', kind: 'door', x: 86, y: 15, to: { room: 'pitlane', portal: 'pit>quay' }, door: { prompt: 'through to the pit lane', fade: 240, requires: ['done_race5'], locked: 'the pit lane: shut', lockedLine: 'Shut till the Coppa. They only open it the week before.' } },
    { type: 'sign', text: 'PIT LANE', x: 86, y: 10, board: 0x2a2420, ink: 0xf2e6cc, scale: 1 },
    { type: 'portal', id: 'quay>gull', kind: 'door', x: 103, y: 15, to: { room: 'nightbefore', portal: 'gull>quay' }, door: { prompt: 'walk the Gull road', fade: 300, requires: ['done_race5'], locked: 'the Gull road: later', lockedLine: 'Not yet. You walk that road the night before, and it is not the night before.' } },
    { type: 'sign', text: 'GULL ROAD', x: 103, y: 10, board: 0x2a2420, ink: 0xf2e6cc, scale: 1 },
    { type: 'moment', id: 'm_sea', x: 50, y: 15, prompt: 'look along the coast', beat: 'moment_sea' },
    // roofs and awnings pay
    { type: 'coins', id: 'c_q1', x: 38, y: 11, n: 6, dx: 1 },
    { type: 'coins', id: 'c_q2', x: 24, y: 8, n: 7, dx: 1 },
    { type: 'coins', id: 'c_q3', x: 50, y: 5, n: 6, dx: 1 },
  ],
};
