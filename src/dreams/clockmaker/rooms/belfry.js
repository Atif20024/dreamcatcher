// THE BELL CHAMBER: at the top of the shaft, the great bell in its beam and
// the third gear's seat beside it, up on the gallery. One slow pendulum across
// the floor (Jo knows it now). The gear wants a steady hand: press as the bob
// crosses the middle, off the beat and the escapement slips one back. When it
// holds the clock is going, and the little door opens on the hill.
// Ansel Dunmarrow sits under the bell with that gear in his hand. Under the gallery
// is the going train he took down: four wheels to hang, and an even count to find.
// Then he says why.
import { grid } from '../../painter/rooms/grid.js';

const g = grid(30, 14);
g.fill(0, 0, 29, 1);
g.fill(0, 12, 29, 13);
g.fill(0, 2, 1, 11);
g.fill(28, 2, 29, 11);
g.put(13, 10, '===');  // a step of joists (x 13–15)
g.put(17, 7, '===========');  // the gallery (x 17–27)

// seven pegs on a big-wheel triangle (room px). Four steps from the drive to the
// ratchet, and the pawl wants an even count: four wheels, not the three on the top row
const TOP = 288;
const LOW = TOP + 55.43;
export const BELFRY_TRAIN = {
  id: 'belfry',
  flag: 'belfry_train',
  onRun: 'going_train',
  who: 'keeper',
  wrongWay: 'That pawl is older than you are. Count again.',
  bound: 'Three that all touch cannot turn. Lift one off.',
  drive: { x: 560, y: TOP, r: 32 },
  output: { x: 816, y: TOP, r: 32, turns: -1 },
  arbors: [[624, TOP], [688, TOP], [752, TOP], [592, LOW], [656, LOW], [720, LOW], [784, LOW]].map(([x, y], i) => ({ id: `s${i}`, x, y })),
  wheels: [
    { id: 'bell1', size: 'big', x: 9 * 32, y: 352 }, // in the bob's swing
    { id: 'bell2', size: 'big', x: 14 * 32 + 16, y: 288 }, // on the joists
    { id: 'bell3', size: 'big', x: 18 * 32, y: 192 }, // up on the gallery
    { id: 'bell4', size: 'big', x: 20 * 32, y: 192 }, // (clear of the door at 26: [E] takes the nearest)
  ],
};

export default {
  id: 'belfry',
  origin: { tx: 70, ty: 30 },
  grid: g.rows(),
  material: 'oak_boards',
  regions: [
    { rect: [0, 0, 29, 1], material: 'plaster_wall' },
    { rect: [0, 2, 1, 11], material: 'plaster_wall' },
    { rect: [28, 2, 29, 11], material: 'plaster_wall' },
  ],
  decor: [],
  trains: [BELFRY_TRAIN],
  pendulums: [{ x: 9, row: 6, len: 4.6, amp: 0.85, period: 3000 }],
  props: [
    { prop: 'door_wood', x: 3, y: 12 },
    { prop: 'window_night', x: 7, y: 6 },
    { prop: 'great_bell', x: 21, y: 6, layer: 'back' },
    { prop: 'door_wood', x: 26, y: 7 },
    { prop: 'chair', x: 24, y: 7, unless: 'keeper_up', live: true },
  ],
  lights: [{ x: 21, y: 4, r: 140, color: 0xffd890 }],
  enclosure: { backWall: 'panelled', wainscot: false, posts: 5, ceiling: true, pillars: true, frames: [{ x: 2, y: 8, w: 2, h: 4 }], palette: { wall: 0x7a5c44, wood: 0x4a3020, accent: 0x9a5a4a } },
  light: { tint: 0xf2e4d0 },
  backdrop: null,
  ambience: 'gm_office', // no tick yet: the tick is the payoff
  acoustics: 'room',
  events: 'clock_still',
  music: { state: 'quiet', key: 'clockhouse' },
  objective: [
    { text: 'belfry_wheels' },
    { text: 'hear_keeper', flag: 'belfry_train' },
    { text: 'seat_third', flag: 'gear3_given' },
    { text: 'strike_seven', flag: 'clock_wound' },
  ],
  titleCard: 'THE BELL CHAMBER',
  entities: [
    { type: 'portal', id: 'belfry>shaft', kind: 'door', x: 3, y: 11, to: { room: 'shaft', portal: 'shaft>belfry' }, door: { prompt: 'down the shaft', fade: 250 } },
    { type: 'checkpoint', id: 'cp_belfry', label: 'THE BELL CHAMBER', x: 5, y: 11 },
    { type: 'npc', id: 'keeper_sat', cast: 'npc-sh-keeper', x: 24, y: 6, pose: 'sit', facing: -1, unless: 'keeper_up', talk: [{ conv: 'keeper_given', if: 'gear3_given' }, { conv: 'keeper_why', if: 'belfry_train' }, { conv: 'keeper_up_here' }] },
    { type: 'npc', id: 'keeper_rise', cast: 'npc-sh-keeper', x: 24, y: 6, walks: true, facing: 1, when: 'keeper_up', unless: 'keeper_out' },
    { type: 'encounter', id: 'escapement', x: 21, y: 6, anchor: { x: 21, y: 3 }, prompt: 'seat the third gear', when: 'gear3_given', unless: 'clock_wound' },
    { type: 'portal', id: 'belfry>yard', kind: 'door', x: 26, y: 6, to: { room: 'yard', portal: 'yard>belfry' }, door: { prompt: 'out on the hill', fade: 300, requires: ['clock_wound'], locked: 'the gear first', lockedLine: 'Not yet. There is nothing out there to strike until the clock is going.' } },
    // brass cogs: on the joists, and along the gallery past the seat
    { type: 'coin', id: 'c_joist', x: 14, y: 8 },
    { type: 'coins', id: 'c_gallery', x: 23, y: 4, n: 2 },
  ],
};
