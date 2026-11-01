// THE PASS, his side of the window. Small, warm, clean, every lamp where he
// wants it. The noise of the line comes through the glass and stops mattering.
// One ticket, no clock: finish the plate, wipe the rim, hold it out. "Stage. Hands."
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(26, 14);
g.fill(0, 0, 25, 3);
g.fill(0, 12, 25, 13);
g.fill(0, 4, 1, 11);
g.fill(24, 4, 25, 11);

export default {
  id: 'pass',
  origin: { tx: 260, ty: 0 },
  grid: g.rows(),
  material: 'quarry_tile',
  regions: [
    { rect: [0, 0, 25, 3], material: 'glazed_wall' },
    { rect: [0, 4, 1, 11], material: 'glazed_wall' },
    { rect: [24, 4, 25, 11], material: 'glazed_wall' },
  ],
  decor: [],
  props: [
    { prop: 'swing_door_chef', x: 3, y: 12, layer: 'back' },
    { prop: 'hot_glass', x: 8, y: 12, layer: 'back' },
    { prop: 'chef_table', x: 12, y: 12 },
    { prop: 'gold_tin', x: 10, y: 12, dy: -44 },
    { prop: 'plate_up', x: 14, y: 12, dy: -44, unless: 'hands_done' },
    { prop: 'heat_lamp', x: 12, y: 4, dy: 12 },
    { prop: 'ticket_spike', x: 18, y: 12, dy: -44 },
    { prop: 'speaking_tube', x: 18, y: 8, layer: 'back' },
    { prop: 'swing_door_salle', x: 23, y: 12, layer: 'back' },
  ],
  lights: [{ x: 12, y: 8, r: 170, color: 0xffb860 }],
  enclosure: { backWall: 'plaster', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 22, y: 9, w: 2, h: 3 }], palette: { wall: 0xc8bca0, wood: 0x6a5a44, accent: 0xc8a050, deep: 0x3a3028, lit: 0xffe8c0 } },
  light: { tint: 0xfff0d8 },
  backdrop: null,
  ambience: 'fs_pass',
  acoustics: 'room',
  events: null,
  music: { state: 'quiet', key: 'pass' },
  objective: [{ text: 'finish' }, { text: 'hands', flag: 'plate_finished' }, { text: 'carry', flag: 'carry_out' }],
  titleCard: 'THE PASS',
  service: 'pass',
  entities: [
    { type: 'portal', id: 'pass>line', kind: 'door', x: 3, y: 11, to: { room: 'line', portal: 'line>pass' }, door: { prompt: 'back to the line', fade: 220, requires: ['_never'], locked: 'he has not finished with you', lockedLine: 'Not now.' } },
    { type: 'checkpoint', id: 'cp_pass', label: 'THE PASS', x: 6, y: 11 },
    { type: 'npc', id: 'aurelio', cast: 'npc-rv-aurelio', x: 20, y: 11, facing: -1, turns: false },
    { type: 'npc', id: 'marguerite_pass', cast: 'npc-rv-marguerite', x: 7, y: 11, facing: 1, when: 'hands_done', turns: false, talk: [{ conv: 'take_it', if: 'hands_done' }] },
    { type: 'sign', text: 'SALLE', x: 20, y: 6, board: 0x3a2428, ink: 0xf2d580, rim: 0xc8a050 },
    { type: 'portal', id: 'pass>dining', kind: 'door', x: 23, y: 11, to: { room: 'dining', portal: 'dining>pass' }, door: { prompt: 'push through the door', fade: 900, requires: ['carry_out'], locked: 'the plate is not ready', lockedLine: 'Not without the plate.' } },
  ],
};
