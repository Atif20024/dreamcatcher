// THE BLUE CELLAR: behind the stage door the world closes in: a low brick
// room, pipes under the ceiling, a zinc bar with Ray at the end of it (his
// back to the stage), nine chairs and a stage a foot high. Delphine signs Jo
// up at her desk; the open mic is played on that stage, in the room (the
// house lights drop, a spot finds him, the chairs turn one by one). The bar
// top and the pipes are the high road.
import { grid } from './grid.js';

const g = grid(46, 14);
g.fill(0, 0, 45, 1); // the ceiling
g.fill(0, 12, 45, 13); // the floor
g.fill(0, 2, 1, 11); // the walls
g.fill(44, 2, 45, 11);
g.fill(36, 11, 43, 11); // the stage, one step up
g.put(35, 11, '/');
g.put(12, 10, '=======');  // the bar top
g.put(14, 6, '=================');  // the pipes

export default {
  id: 'cellar',
  origin: { tx: 0, ty: 40 },
  grid: g.rows(),
  material: 'club_boards',
  regions: [
    { rect: [0, 0, 45, 1], material: 'cellar_brick' },
    { rect: [0, 2, 1, 11], material: 'cellar_brick' },
    { rect: [44, 2, 45, 11], material: 'cellar_brick' },
  ],
  decor: ['club_dust'],
  props: [
    { prop: 'pipe_run', x: 14, y: 6, layer: 'back' },
    { prop: 'pipe_run', x: 26, y: 6, dx: 8, layer: 'back' },
    { prop: 'desk_lamp_desk', x: 10, y: 12 },
    { prop: 'back_bar', x: 12, y: 9, layer: 'back' },
    { prop: 'bar_counter', x: 12, y: 12 },
    { prop: 'club_table', x: 24, y: 12 },
    { prop: 'club_table', x: 29, y: 12 },
    { prop: 'club_table', x: 33, y: 12, dx: -8 },
    { prop: 'club_chair', x: 22, y: 12 },
    { prop: 'club_chair', x: 23, y: 12, dx: 8 },
    { prop: 'club_chair', x: 25, y: 12, dx: 8 },
    { prop: 'club_chair', x: 27, y: 12 },
    { prop: 'club_chair', x: 28, y: 12, dx: 8 },
    { prop: 'club_chair', x: 30, y: 12, dx: 8 },
    { prop: 'club_chair', x: 32, y: 12 },
    { prop: 'club_chair', x: 33, y: 12, dx: 12 },
    { prop: 'club_chair', x: 34, y: 12, dx: 12 },
    { prop: 'cellar_sign', x: 39, y: 3, layer: 'back' },
    { prop: 'piano_upright', x: 42, y: 11, dx: 6 },
    { prop: 'drum_kit', x: 40, y: 11 },
    { prop: 'amp', x: 37, y: 11, dx: -6 },
    { prop: 'mic_stand', x: 38, y: 11 },
    { prop: 'monitor_wedge', x: 36, y: 11, dx: 8 },
    { prop: 'pendant_bulb', x: 7, y: 2 },
    { prop: 'pendant_bulb', x: 16, y: 2 },
    { prop: 'pendant_bulb', x: 27, y: 2 },
    { prop: 'pendant_bulb', x: 39, y: 2 },
  ],
  lights: [{ x: 39, y: 8, r: 120, color: 0xffd8a0 }],
  enclosure: { backWall: 'brick', wainscot: false, posts: 0, ceiling: true, pillars: false, frames: [{ x: 2, y: 9, w: 2, h: 3 }], palette: { wall: 0x6a2e26, wood: 0x3a2018, accent: 0x2e7d9a, deep: 0x120a0e, lit: 0xf2c890 } },
  light: { tint: 0xfff0e0 },
  backdrop: null,
  ambience: 'club_room',
  acoustics: 'club',
  events: 'cellar',
  music: { state: 'quiet', bpm: 86, key: 'cellar' },
  objective: [
    { text: 'cellar_signup' },
    { text: 'cellar_play', flag: 'signed_up' },
    { text: 'follow_ray', flag: 'ray_left' },
    { text: 'to_dock', flag: 'ray_lesson' },
  ],
  titleCard: 'THE BLUE CELLAR',
  entities: [
    { type: 'portal', id: 'cellar>alley', kind: 'door', x: 3, y: 11, to: { room: 'alley', portal: 'alley>cellar' }, door: { prompt: 'out to the alley', fade: 260 } },
    { type: 'checkpoint', id: 'cp_cellar', label: 'THE BLUE CELLAR', x: 6, y: 11 },
    { type: 'npc', id: 'delphine', cast: 'npc-delphine', x: 9, y: 11, facing: 1, talk: [{ conv: 'delphine_after', if: 'cellar_gig' }, { conv: 'delphine_wait', if: 'signed_up' }, { conv: 'delphine_first' }] },
    { type: 'npc', id: 'barkeep', cast: 'npc-sol', x: 15, y: 11, facing: 1, depth: 'behind', talk: [{ conv: 'barkeep' }] },
    { type: 'npc', id: 'ray', cast: 'npc-ray', x: 19, y: 11, dx: 8, facing: -1, turns: false, unless: 'ray_left', talk: [{ conv: 'ray_bar' }] },
    { type: 'npc', id: 'nia_bar', cast: 'npc-nia', x: 20, y: 11, dx: 6, facing: 1, when: 'cellar_gig', talk: [{ conv: 'nia_after', if: 'met_nia' }, { conv: 'nia_rush' }] },
    // the nine chairs: five taken (they turn toward the stage as Jo lands phrases)
    { type: 'audience', id: 'a1', cast: 'ev-p-fisherman', x: 22, y: 11, facing: 1 },
    { type: 'audience', id: 'a2', cast: 'ev-p-mother', x: 25, y: 11, dx: 8, facing: 1 },
    { type: 'audience', id: 'a3', cast: 'ev-p-baker', x: 28, y: 11, dx: 8, facing: 1 },
    { type: 'audience', id: 'a4', cast: 'ev-p-hamid', x: 32, y: 11, facing: 1 },
    { type: 'audience', id: 'a5', cast: 'ev-p-fereshteh', x: 34, y: 11, dx: 12, facing: 1 },
    { type: 'encounter', id: 'cellar_gig', x: 38, y: 10, anchor: { x: 39, y: 7 }, prompt: 'take the stage', when: 'signed_up', unless: 'cellar_gig' },
    { type: 'moment', id: 'm1', x: 37, y: 10, when: 'cellar_gig', prompt: 'sit on the edge of the stage', beat: 'moment_nine' },
    // the bar top (a hop) and the pipes over the room (a climb off the bar)
    { type: 'coins', id: 'c_bar', x: 13, y: 8, n: 5 },
    { type: 'coins', id: 'c_pipes', x: 16, y: 4, n: 12 },
    { type: 'coin', id: 'c_stage', x: 35, y: 9 },
  ],
};
