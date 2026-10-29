// SATURDAY, BACKSTAGE: through the loading door the dream jumps to the
// festival. A long painted-block service corridor under work lights: flight
// cases, truss, roadies who will throw a stranger out, a catwalk overhead.
// Marcus is by the dock with news. Jo's laminate fell up on the catwalk (the
// key item, past the roadies and the feedback in the monitors); Mr. Tally
// waits by the stage door with his offer, Nia tuning beside him. The stage
// door opens on the laminate and an answer.
import { grid } from './grid.js';

const g = grid(64, 18);
g.fill(0, 0, 63, 1); // the ceiling
g.fill(0, 15, 63, 17); // the floor
g.fill(0, 2, 1, 14); // the walls
g.fill(62, 2, 63, 14);
g.put(13, 13, '=='); // a case stack (its top is a ledge; the cases are drawn)
g.put(24, 13, '=='); // the case stack under the catwalk
g.put(22, 9, '=======================');  // the catwalk

export default {
  id: 'backstage',
  origin: { tx: 0, ty: 60 },
  grid: g.rows(),
  material: 'dock_concrete',
  regions: [
    { rect: [0, 0, 63, 1], material: 'cellar_brick' },
    { rect: [0, 2, 1, 14], material: 'cellar_brick' },
    { rect: [62, 2, 63, 14], material: 'cellar_brick' },
  ],
  decor: [],
  props: [
    { prop: 'roller_door', x: 3, y: 15, layer: 'back' },
    { prop: 'case_stack', x: 13, y: 15 },
    { prop: 'case_stack', x: 24, y: 15 },
    { prop: 'road_case', x: 41, y: 15 },
    { prop: 'road_case', x: 17, y: 15, layer: 'back' },
    { prop: 'road_case', x: 31, y: 15, layer: 'back' },
    { prop: 'truss_tower', x: 20, y: 15, layer: 'back' },
    { prop: 'truss_tower', x: 47, y: 15, layer: 'back' },
    { prop: 'catwalk_rail', x: 22, y: 9 },
    { prop: 'catwalk_rail', x: 30, y: 9 },
    { prop: 'catwalk_rail', x: 37, y: 9 },
    { prop: 'mirror_station', x: 34, y: 12, layer: 'back' },
    { prop: 'sofa', x: 35, y: 15, layer: 'back' },
    { prop: 'double_bass', x: 50, y: 15, dx: 10 },
    { prop: 'amp', x: 52, y: 15 },
    { prop: 'fire_door', x: 60, y: 15, layer: 'back' },
    { prop: 'work_lamp', x: 8, y: 4 },
    { prop: 'work_lamp', x: 28, y: 4 },
    { prop: 'work_lamp', x: 44, y: 4 },
    { prop: 'work_lamp', x: 56, y: 4 },
  ],
  enclosure: { backWall: 'blocks', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 59, y: 11, w: 2, h: 3 }], palette: { wall: 0x4a4e5e, wood: 0x2a2a32, accent: 0x2e7d9a, deep: 0x0e0e16, lit: 0xe0e4f0 } },
  light: { tint: 0xe8ecf8 },
  backdrop: null,
  ambience: 'festival',
  acoustics: 'room',
  events: 'backstage',
  // the PA through the stage door
  music: { state: 'explore', bpm: 110, key: 'backstage', wall: 700 },
  objective: [
    { text: 'backstage' },
    { text: 'hear_tally', flag: 'laminate' },
    { text: 'get_laminate', flag: 'offer_heard' },
    { text: 'up_stairs', flag: 'stage_ready' },
  ],
  titleCard: 'SATURDAY. BACKSTAGE',
  entities: [
    { type: 'portal', id: 'backstage<alley', kind: 'door', x: 3, y: 14, to: { room: 'alley', portal: 'alley>backstage' }, door: { prompt: 'back to the alley', fade: 420 } },
    { type: 'checkpoint', id: 'cp_dock', label: 'THE LOADING DOCK', x: 6, y: 14 },
    { type: 'npc', id: 'marcus', cast: 'npc-marcus', x: 9, y: 14, facing: 1, talk: [{ conv: 'marcus_after', if: 'marcus_left' }, { conv: 'marcus_call' }] },
    { type: 'foe', id: 'roadie_a', kind: 'roadie', x: 20, y: 14, patrol: [16, 30], facing: -1 },
    { type: 'foe', id: 'wisp_cat1', kind: 'wisp', x: 30, y: 7, floats: true, patrol: [27, 34] },
    { type: 'foe', id: 'wisp_cat2', kind: 'wisp', x: 39, y: 7, floats: true, patrol: [36, 42] },
    { type: 'keyitem', id: 'laminate', x: 43, y: 8, beat: 'got_laminate' },
    { type: 'foe', id: 'roadie_b', kind: 'roadie', x: 46, y: 14, patrol: [43, 55], facing: 1 },
    { type: 'npc', id: 'nia', cast: 'npc-nia', x: 49, y: 14, facing: 1, talk: [{ conv: 'nia_backstage_after', if: 'offer_heard' }, { conv: 'nia_backstage' }] },
    { type: 'npc', id: 'tally', cast: 'npc-tally', x: 54, y: 14, facing: -1, talk: [{ conv: 'tally_after', if: 'offer_heard' }, { conv: 'tally_offer' }] },
    { type: 'gate', id: 'g_stage', x: 57, y: 9, h: 6, requires: ['laminate', 'offer_heard'], hint: "YOUR LAMINATE, AND TALLY'S ANSWER" },
    { type: 'portal', id: 'backstage>escape', kind: 'door', x: 60, y: 14, to: { room: 'escape', portal: 'escape<backstage' }, door: { prompt: 'up the fire stairs', fade: 320 } },
    // coins: on the cases (hops), the whole catwalk (past the wisps)
    { type: 'coins', id: 'c_case1', x: 13, y: 11, n: 2 },
    { type: 'coins', id: 'c_cat', x: 23, y: 7, n: 16 },
  ],
};
