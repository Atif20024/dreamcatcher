// THE ALLEY: the narrow canyon behind the Blue Cellar. The stage door is
// dark under a dead neon sign: Jo plays it back to life (a short call and
// response: the first time the dream asks him to listen, then answer), and
// the door lets him in. After his set Ray is out here with a cigarette, by
// the iron gate to the loading dock; the gate opens when Jo has played the
// Cellar and heard Ray out. The fire escape climbing the left wall is the
// optional high road: coins on every landing, feedback wisps on two of them,
// a heart shard at the top.
import { grid } from './grid.js';

const g = grid(56, 26);
g.fill(0, 22, 55, 25); // the alley floor
g.put(8, 20, '==='); // the dumpster's lid: the first step up
g.put(11, 17, '========'); // landing A
g.put(5, 13, '========'); // landing B
g.put(12, 9, '=========');  // landing C
g.put(4, 5, '=======');  // landing D (the top: the shard)
g.put(33, 21, '=='); // crates by the poster wall

export default {
  id: 'alley',
  origin: { tx: 72, ty: -6 },
  grid: g.rows(),
  material: 'wet_setts',
  decor: ['wet_puddles'],
  props: [
    { prop: 'dumpster', x: 9, y: 22 },
    { prop: 'escape_landing', x: 11, y: 17 },
    { prop: 'escape_landing', x: 5, y: 13 },
    { prop: 'escape_landing', x: 12, y: 9 },
    { prop: 'escape_landing', x: 4, y: 5 },
    { prop: 'stage_door', x: 28, y: 22, layer: 'back' },
    { prop: 'neon_dead', x: 28, y: 15, unless: 'neon_lit', live: true },
    { prop: 'neon_lit', x: 28, y: 15, when: 'neon_lit', live: true },
    { prop: 'poster_board', x: 37, y: 18, layer: 'back' },
    { prop: 'crate', x: 33, y: 21, dx: 16 },
    { prop: 'barrel', x: 36, y: 22 },
    { prop: 'street_lamp', x: 41, y: 22 },
    { prop: 'roller_door', x: 51, y: 22, layer: 'back' },
  ],
  enclosure: { fgFoliage: [] },
  light: { tint: 0xd8dcf2 },
  backdrop: { set: 'alley_night', horizon: 22 },
  ambience: 'rain_street',
  acoustics: 'open',
  events: 'rain',
  // the Blue Cellar's trio, through the wall
  music: { state: 'explore', bpm: 86, key: 'cellar', wall: true },
  objective: [
    { text: 'alley_neon' },
    { text: 'alley_in', flag: 'neon_lit' },
    { text: 'follow_ray', flag: 'ray_left' },
    { text: 'to_dock', flag: 'ray_lesson' },
  ],
  titleCard: 'THE ALLEY',
  entities: [
    { type: 'portal', id: 'alley<street', kind: 'seam', x: 0, y: 21, to: { room: 'street', portal: 'street>alley' }, seam: { prop: 'alley_arch' } },
    { type: 'checkpoint', id: 'cp_alley', label: 'THE ALLEY', x: 4, y: 21 },
    // the dead neon: play it back (a two-phrase call and response)
    { type: 'encounter', id: 'neon', x: 25, y: 21, anchor: { x: 20, y: 16 }, prompt: 'play the dead neon', unless: 'neon_lit' },
    { type: 'portal', id: 'alley>cellar', kind: 'door', x: 28, y: 21, to: { room: 'cellar', portal: 'cellar>alley' }, door: { prompt: 'go in', fade: 260, requires: ['neon_lit'], locked: 'the stage door is dark', lockedLine: "Locked, and dark. The neon over it is dead." } },
    // after the set: Ray, out back, lighting a cigarette
    { type: 'npc', id: 'ray_alley', cast: 'npc-ray', x: 39, y: 21, facing: -1, when: 'ray_left', talk: [{ conv: 'ray_after', if: 'ray_lesson' }, { conv: 'ray_lesson' }] },
    { type: 'gate', id: 'g_dock', x: 45, y: 16, h: 6, requires: ['cellar_gig', 'ray_lesson'], hint: 'PLAY THE CELLAR, THEN HEAR RAY OUT' },
    { type: 'portal', id: 'alley>backstage', kind: 'door', x: 51, y: 21, to: { room: 'backstage', portal: 'backstage<alley' }, door: { prompt: 'through the loading door', fade: 420 } },
    // the fire escape: breadcrumbs up, the landings pay, the top keeps a shard
    { type: 'coins', id: 'c_bin', x: 8, y: 18, n: 3 },
    { type: 'coins', id: 'c_landA', x: 12, y: 15, n: 6 },
    { type: 'coins', id: 'c_landB', x: 5, y: 11, n: 6 },
    { type: 'coins', id: 'c_landC', x: 13, y: 7, n: 7 },
    { type: 'coins', id: 'c_landD', x: 6, y: 3, n: 4 },
    { type: 'shard', id: 's_alley', x: 4, y: 3 },
    { type: 'foe', id: 'wisp_b', kind: 'wisp', x: 8, y: 11, floats: true, patrol: [5, 12] },
    { type: 'foe', id: 'wisp_c', kind: 'wisp', x: 16, y: 7, floats: true, patrol: [12, 20] },
    { type: 'coin', id: 'c_door', x: 32, y: 19 },
    { type: 'coins', id: 'c_crates', x: 33, y: 18, n: 2 },
  ],
};
