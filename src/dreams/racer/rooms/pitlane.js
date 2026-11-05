// THE PIT LANE: the week before the Coppa, bunting up, the Heron in her box. The stop
// itself belongs to race 6 (design §4 E), which waits; here the crew drills it. PIT
// STOP: stop, change, go, four beats on Ottavia's call (wheel, wheel, fuel, flag), on
// the one key. Every miss is three seconds on the slate. More than one and it is again.
import { grid } from '../../painter/rooms/grid.js';

const g = grid(44, 14);
g.fill(0, 12, 43, 13);
g.fill(0, 0, 1, 11);
g.fill(42, 0, 43, 11);
g.put(28, 8, '========'); // the pit counter's roof

export const BOX_COL = 22;

export default {
  id: 'pitlane',
  origin: { tx: 365, ty: 0 },
  grid: g.rows(),
  material: 'pit_road',
  decor: [],
  props: [
    { prop: 'pit_counter', x: 32, y: 12, layer: 'back' },
    { prop: 'bunting', x: 12, y: 3, layer: 'back' },
    { prop: 'bunting', x: 32, y: 3, layer: 'back' },
    { prop: 'pit_board', x: 16, y: 12, layer: 'back' },
    { prop: 'tyre_stack', x: 26, y: 12 },
    { prop: 'fuel_churn', x: 28, y: 12 },
    { prop: 'telegraph_pole', x: 8, y: 12, layer: 'back' },
    { prop: 'road_arch', x: 3, y: 12, layer: 'back' },
  ],
  backdrop: { set: 'coast_day', horizon: 11 },
  ambience: 'pv_pit',
  acoustics: 'open',
  events: 'pv_quay',
  music: { state: 'silent', key: 'pit' },
  objective: [{ text: 'pit_goal' }, { text: 'written', flag: 'pit_drilled' }],
  titleCard: 'THE PIT LANE',
  goal: 'stop, change, go: four beats on her call',
  entities: [
    { type: 'portal', id: 'pit>quay', kind: 'door', x: 3, y: 11, to: { room: 'quay', portal: 'quay>pit' }, door: { prompt: 'back to the quay', fade: 240 } },
    { type: 'checkpoint', id: 'cp_pit', label: 'THE PIT LANE', x: 7, y: 11 },
    { type: 'npc', id: 'tullio_pit', cast: 'npc-pv-tullio', x: 25, y: 11, facing: -1, talk: [{ conv: 'tullio_tyre' }] },
    { type: 'npc', id: 'nino_pit', cast: 'npc-pv-nino', x: 19, y: 11, facing: 1, turns: false, talk: [{ conv: 'nino_after' }] },
    { type: 'encounter', id: 'pitstop', x: BOX_COL, y: 11, anchor: { x: BOX_COL, y: 8 }, prompt: 'call the stop', unless: 'pit_drilled' },
    { type: 'coins', id: 'c_pl1', x: 28, y: 7, n: 7, dx: 1 },
  ],
};
