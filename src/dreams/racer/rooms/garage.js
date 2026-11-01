// THE PEREVAL GARAGE: oil-brown, cream and teal, one hot bulb. The Heron stands
// at the roller shutter with her nose to the road. For now the only verb is the
// drive: the door into RaceScene is in verbs/garage.js. (The TUNE at the bench and
// the tyre rack's choice come with the later stages: design §4 A.)
import { grid } from '../../painter/rooms/grid.js';

const g = grid(34, 14);
g.fill(0, 0, 33, 1); // the roof
g.fill(0, 12, 33, 13); // the floor
g.fill(0, 2, 1, 11); // the walls
g.fill(32, 2, 33, 11);

export default {
  id: 'garage',
  origin: { tx: 0, ty: 0 },
  grid: g.rows(),
  material: 'oak_boards',
  regions: [
    { rect: [0, 0, 33, 1], material: 'plaster_wall' },
    { rect: [0, 2, 1, 11], material: 'plaster_wall' },
    { rect: [32, 2, 33, 11], material: 'plaster_wall' },
  ],
  decor: [],
  props: [
    { prop: 'garage_shutter', x: 28, y: 12, layer: 'back' },
    { prop: 'tyre_rack', x: 5, y: 12, layer: 'back' },
    { prop: 'work_bench', x: 11, y: 12, layer: 'back' },
    { prop: 'hanging_lamp', x: 17, y: 2 },
  ],
  lights: [{ x: 17, y: 5, r: 170, color: 0xffb060 }],
  enclosure: { backWall: 'blocks', wainscot: true, posts: 3, ceiling: true, pillars: false, frames: [], palette: { wall: 0x6a5240, wood: 0x3a2a20, accent: 0x1f7a78, deep: 0x1a1412, lit: 0xf2c078 } },
  light: { tint: 0xf2dcc0 },
  backdrop: null,
  ambience: 'gm_office',
  acoustics: 'room',
  events: null,
  music: { state: 'silent' },
  objective: [{ text: 'drive' }, { text: 'raced', flag: 'race_test_passed' }],
  titleCard: 'THE PEREVAL GARAGE',
  entities: [
    { type: 'spawn', id: 'start', x: 7, y: 11 },
    { type: 'checkpoint', id: 'garage', label: 'THE PEREVAL GARAGE', x: 7, y: 11 },
  ],
};
