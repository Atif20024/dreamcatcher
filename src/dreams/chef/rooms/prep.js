// THE PREP KITCHEN: butcher block, marble, sacks on a mezzanine, herbs in the
// window box because nobody has ever given them anywhere else to grow. A wall
// clock, and the doors at half past seven: three mise tickets, not time for
// three. What gets shelved is what the line has at the rush. Tomé chops onions
// and cries and laughs at the wireless. Brann walks the floor; his grab puts
// you back at the door, and a shelf runs over his head for those who look up.
import { grid } from '../../gambler/rooms/grid.js';

const g = grid(48, 14);
g.fill(0, 0, 47, 3);
g.fill(0, 12, 47, 13);
g.fill(0, 4, 1, 11);
g.fill(46, 4, 47, 11);
g.put(2, 7, '=========');
g.ladder(11, 7, 11, [7]);
g.put(14, 8, '='.repeat(20));
g.put(34, 9, '=====');

export default {
  id: 'prep',
  origin: { tx: 130, ty: 0 },
  grid: g.rows(),
  material: 'quarry_tile',
  regions: [
    { rect: [0, 0, 47, 3], material: 'glazed_wall' },
    { rect: [0, 4, 1, 11], material: 'glazed_wall' },
    { rect: [46, 4, 47, 11], material: 'glazed_wall' },
    { rect: [2, 7, 38, 9], material: 'kitchen_plank' },
  ],
  decor: [],
  props: [
    ...[7, 16, 25, 34, 43].map((x) => ({ prop: 'tile_band', x, y: 12, layer: 'back' })),
    { prop: 'swing_door_cold', x: 3, y: 12, layer: 'back' },
    { prop: 'swing_door', x: 45, y: 12, layer: 'back' },
    { prop: 'sack_pile', x: 6, y: 7, layer: 'back' },
    { prop: 'ice_chest', x: 14, y: 12 },
    { prop: 'chop_block', x: 19, y: 12 },
    { prop: 'chop_block', x: 24, y: 12 },
    { prop: 'fish_slab', x: 30, y: 12 },
    { prop: 'wall_oven', x: 17, y: 12, layer: 'back' },
    { prop: 'wall_oven', x: 33, y: 12, layer: 'back' },
    { prop: 'window_herbs', x: 36, y: 9, layer: 'back' },
    { prop: 'line_shelf', x: 42, y: 12, layer: 'back' },
    { prop: 'wireless', x: 19, y: 7, layer: 'back' },
    { prop: 'hanging_pans', x: 26, y: 4, dy: 4, layer: 'back' },
    { prop: 'hanging_bulb', x: 22, y: 4, dy: 4 },
    { prop: 'hanging_bulb', x: 38, y: 4, dy: 4 },
    { prop: 'wall_clock', x: 40, y: 6, scale: 0.5, layer: 'back' },
  ],
  lights: [{ x: 22, y: 6, r: 170, color: 0xfff0d0 }, { x: 38, y: 6, r: 150, color: 0xfff0d0 }],
  enclosure: { backWall: 'plaster', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 44, y: 9, w: 2, h: 3 }], palette: { wall: 0xd8d4c4, wood: 0x6a6a64, accent: 0x8a8678, deep: 0x4a4a48, lit: 0xfff4e0 } },
  light: { tint: 0xfff4e8 },
  backdrop: null,
  ambience: 'fs_prep',
  acoustics: 'room',
  events: 'kitchen',
  music: { state: 'explore', key: 'prep' },
  objective: [{ text: 'mise' }, { text: 'to_line', flag: 'mise_done' }],
  titleCard: 'THE PREP KITCHEN',
  service: 'prep',
  ovens: [{ x: 17, every: 8, off: 0 }, { x: 33, every: 8, off: 4 }],
  life: [{ npc: 'tome', kind: 'knife' }],
  entities: [
    { type: 'portal', id: 'prep>cold', kind: 'door', x: 3, y: 11, to: { room: 'cold', portal: 'cold>prep' }, door: { prompt: 'back to the cold store', fade: 220 } },
    { type: 'checkpoint', id: 'cp_prep', label: 'THE PREP KITCHEN', x: 8, y: 11 },
    { type: 'sign', text: 'SACKS', x: 6, y: 4, dy: 36, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'ICE', x: 14, y: 9, dy: 8, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'BOARD', x: 24, y: 9, dy: 8, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'SLAB', x: 30, y: 9, dy: 8, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'HERBS', x: 32, y: 4, dy: 36, dx: -8, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    { type: 'sign', text: 'SHELF', x: 42, y: 6, dy: 24, board: 0x2a2a34, ink: 0xf2e6cc, rim: 0x8a8678 },
    // over the bulb's glow (depth 14), and at the size of the room's other signs
    { type: 'sign', text: 'THE LINE:\nDOORS 7:30', x: 42, y: 4, dy: 32, dx: 10, board: 0x2a1c16, ink: 0xf2d580, size: 'small', depth: 14.5 },
    { type: 'npc', id: 'tome', cast: 'npc-rv-tome', x: 20, y: 11, facing: -1, depth: 'behind', turns: false, talk: [{ conv: 'tome_after', if: 'mise_done' }, { conv: 'tome' }] },
    { type: 'moment', id: 'm1', x: 18, y: 11, prompt: 'watch Tome chop', beat: 'moment_tome' },
    { type: 'foe', kind: 'sous_chef', x: 27, y: 11, patrol: [15, 39] },
    { type: 'portal', id: 'prep>line', kind: 'door', x: 45, y: 11, to: { room: 'line', portal: 'line>prep' }, door: { prompt: 'through to the line', fade: 240, requires: ['mise_done'], locked: 'the doors are not open', lockedLine: 'Not till half past. Every minute here is a minute less on the line.' } },
    { type: 'coins', id: 'c_r1', x: 16, y: 6, n: 8, dx: 2 },
    { type: 'coins', id: 'c_r3', x: 35, y: 7, n: 4, dx: 1 },
    { type: 'coins', id: 'c_r2', x: 3, y: 5, n: 3, dx: 1 },
  ],
};
