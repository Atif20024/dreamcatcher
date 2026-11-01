// THE WEIGHT SHAFT: up through the hatch, the tall dry throat of the clock.
// The great iron weight hangs on its chain. With the gears slipped the
// pendulums swing loose and count nothing: the first thing in the first-time
// player's dream that can hurt, slowly, on a beat you can watch before you go.
// Three of them, each a little quicker: one across the floor, one across a
// plank, one across the chain itself (a knock drops Jo to the plank he left).
// The second gear is at the top, caged, and the cage runs off a train: its big
// wheel is on the shaft floor in the first bob's swing, its small one on plank B.
// A knock drops what Jo carries to the floor under him. Off to the left a ledge for the brave.
import { grid } from '../../painter/rooms/grid.js';

const g = grid(22, 34);
g.fill(0, 0, 21, 1); // the head of the shaft
g.fill(0, 32, 21, 33); // the foot
g.fill(0, 2, 1, 31); // its walls
g.fill(20, 2, 21, 31);
g.put(6, 25, '==============');  // plank A (x 6–19)
g.ladder(17, 25, 31, [25]); // floor → A
g.put(2, 18, '=============');  // plank B (x 2–14)
g.ladder(7, 18, 24, [18]); // A → B
g.put(8, 11, '============');  // plank C (x 8–19)
g.ladder(14, 11, 17, [11]); // B → C: the weight's chain
g.put(2, 7, '====');  // the ledge (x 2–5): a full jump from C

// the loose pendulums (room tiles): pivot x, row; length; swing; period
export const PENDULUMS = [
  { x: 12, row: 26, len: 4.6, amp: 0.85, period: 3800 },
  // (clear of both ladder heads: it never meets Jo as he steps off)
  { x: 12, row: 19, len: 4.6, amp: 0.85, period: 3600 },
  // (over the foot of the chain, so he can wait there and watch; slow enough to climb between swings)
  { x: 14, row: 12, len: 2.6, amp: 0.8, period: 3400 },
];

// (room px) big to the drive, small to the ratchet: only that way round touches
const ROW = 288;
export const SHAFT_TRAIN = {
  id: 'shaft',
  flag: 'shaft_train',
  onRun: 'cage_up',
  who: 'jo',
  wrongWay: 'The pawl holds it. Wrong way round.',
  fouls: 'It won\'t go on: it fouls the next wheel. The other one.',
  drive: { x: 368, y: ROW, r: 24 },
  output: { x: 528, y: ROW, r: 24, turns: -1 },
  rod: [[528, ROW], [592, ROW], [592, 306]],
  arbors: [{ id: 'p1', x: 424, y: ROW }, { id: 'p2', x: 480, y: ROW }],
  wheels: [{ id: 'shaft_big', size: 'big', x: 13 * 32, y: 992 }, { id: 'shaft_small', size: 'small', x: 3 * 32 + 16, y: 552 }],
};

export default {
  id: 'shaft',
  origin: { tx: 40, ty: 30 },
  grid: g.rows(),
  material: 'oak_boards',
  regions: [
    { rect: [0, 0, 21, 1], material: 'plaster_wall' },
    { rect: [0, 2, 1, 31], material: 'plaster_wall' },
    { rect: [20, 2, 21, 31], material: 'plaster_wall' },
  ],
  decor: [],
  pendulums: PENDULUMS,
  trains: [SHAFT_TRAIN],
  props: [
    { prop: 'door_wood', x: 4, y: 32 },
    { prop: 'pendulum_case', x: 3, y: 18, layer: 'back' },
    { prop: 'clock_weight', x: 18, y: 18, layer: 'back' },
    { prop: 'hanging_lamp', x: 11, y: 2 },
    { prop: 'door_wood', x: 9, y: 11 },
    { prop: 'gear_cage', x: 18, y: 11, unless: 'shaft_train', live: true },
  ],
  lights: [{ x: 11, y: 10, r: 150, color: 0xffd890 }, { x: 10, y: 28, r: 130, color: 0xffd890 }],
  enclosure: { backWall: 'panelled', wainscot: false, posts: 3, ceiling: true, pillars: false, frames: [{ x: 3, y: 28, w: 2, h: 4 }], palette: { wall: 0x8a6a4c, wood: 0x4a3020, accent: 0x9a5a4a } },
  light: { tint: 0xf2e4d0 },
  backdrop: null,
  ambience: 'gm_office', // a room with a clock that does not tick (the tick comes with the music key)
  acoustics: 'room',
  events: 'clock_still',
  music: { state: 'quiet', key: 'clockhouse' },
  objective: [
    { text: 'climb_shaft' },
    { text: 'take_gear', flag: 'shaft_train' },
    { text: 'to_belfry', flag: 'gear2' },
    { text: 'back_up', flag: 'clock_wound' },
  ],
  titleCard: 'THE WEIGHT SHAFT',
  entities: [
    { type: 'portal', id: 'shaft>clock', kind: 'door', x: 4, y: 31, to: { room: 'clockhouse', portal: 'clock>shaft' }, door: { prompt: 'down to the clock house', fade: 250 } },
    { type: 'checkpoint', id: 'cp_shaft', label: 'THE WEIGHT SHAFT', x: 6, y: 31 },
    { type: 'keyitem', id: 'gear2', x: 18, y: 10, beat: 'got_gear2', when: 'shaft_train' },
    { type: 'portal', id: 'shaft>belfry', kind: 'door', x: 9, y: 10, to: { room: 'belfry', portal: 'belfry>shaft' }, door: { prompt: 'up to the bell chamber', fade: 250, requires: ['gear2'], locked: 'the gear first', lockedLine: 'The bell can wait. The second gear is along the plank.' } },
    // brass cogs: an arc over the first bob; the ledge's shard and its consolation
    { type: 'coins', id: 'c_bob', x: 11, y: 28, n: 3 },
    { type: 'shard', id: 'shard_shaft', x: 3, y: 5 },
    { type: 'coins', id: 'c_ledge', x: 4, y: 5, n: 2 },
  ],
};
