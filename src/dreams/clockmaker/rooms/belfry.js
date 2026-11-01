// THE BELL CHAMBER: at the top of the shaft, the great bell in its beam and
// the third gear's seat beside it, up on the gallery. One slow pendulum across
// the floor (Jo knows it now). The gear wants a steady hand: press as the bob
// crosses the middle, off the beat and the escapement slips one back. When it
// holds the clock is going, and the little door opens on the hill.
import { grid } from '../../painter/rooms/grid.js';

const g = grid(30, 14);
g.fill(0, 0, 29, 1);
g.fill(0, 12, 29, 13);
g.fill(0, 2, 1, 11);
g.fill(28, 2, 29, 11);
g.put(13, 10, '===');  // a step of joists (x 13–15)
g.put(17, 8, '===========');  // the gallery (x 17–27)

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
  pendulums: [{ x: 9, row: 6, len: 4.6, amp: 0.85, period: 3000 }],
  props: [
    { prop: 'door_wood', x: 3, y: 12 },
    { prop: 'window_night', x: 7, y: 6 },
    { prop: 'great_bell', x: 21, y: 7, layer: 'back' },
    { prop: 'door_wood', x: 26, y: 8 },
  ],
  lights: [{ x: 21, y: 5, r: 140, color: 0xffd890 }],
  enclosure: { backWall: 'panelled', wainscot: false, posts: 5, ceiling: true, pillars: true, frames: [{ x: 2, y: 8, w: 2, h: 4 }], palette: { wall: 0x7a5c44, wood: 0x4a3020, accent: 0x9a5a4a } },
  light: { tint: 0xf2e4d0 },
  backdrop: null,
  ambience: 'gm_office', // no tick yet: the tick is the payoff
  acoustics: 'room',
  events: 'clock_still',
  music: { state: 'quiet', key: 'clockhouse' },
  objective: [
    { text: 'seat_third' },
    { text: 'strike_seven', flag: 'clock_wound' },
  ],
  titleCard: 'THE BELL CHAMBER',
  entities: [
    { type: 'portal', id: 'belfry>shaft', kind: 'door', x: 3, y: 11, to: { room: 'shaft', portal: 'shaft>belfry' }, door: { prompt: 'down the shaft', fade: 250 } },
    { type: 'checkpoint', id: 'cp_belfry', label: 'THE BELL CHAMBER', x: 5, y: 11 },
    { type: 'encounter', id: 'escapement', x: 21, y: 7, anchor: { x: 21, y: 4 }, prompt: 'seat the third gear', unless: 'clock_wound' },
    { type: 'portal', id: 'belfry>yard', kind: 'door', x: 26, y: 7, to: { room: 'yard', portal: 'yard>belfry' }, door: { prompt: 'out on the hill', fade: 300, requires: ['clock_wound'], locked: 'the gear first', lockedLine: 'Not yet. There is nothing out there to strike until the clock is going.' } },
    // brass cogs: on the joists, and along the gallery past the seat
    { type: 'coin', id: 'c_joist', x: 14, y: 8 },
    { type: 'coins', id: 'c_gallery', x: 23, y: 5, n: 2 },
  ],
};
