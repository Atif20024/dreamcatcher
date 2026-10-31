// THE FIRE STAIRS: out of the fire door and onto the theatre's flank, in the
// rain, nine storeys of iron landings bolted to the brick. The city falls
// away to the right as Jo climbs; the crowd's roar comes up from the far side
// of the roof. Feedback wisps drift on three landings; a ledge off to the
// right pays the brave. The stage door is at the top.
import { grid } from './grid.js';

const g = grid(32, 48);
g.fill(0, 46, 31, 47); // the yard at the foot of the stairs
g.fill(0, 0, 0, 45); // the theatre's corner pier (left)
g.fill(31, 0, 31, 45); // the next building's corner (right)
const landings = [
  [42, 10, 18],
  [38, 18, 27],
  [34, 8, 17],
  [30, 2, 10],
  [26, 9, 20],
  [22, 19, 29],
  [18, 10, 20],
  [14, 2, 11],
  [10, 9, 18],
  [6, 17, 29],
];
for (const [row, x0, x1] of landings) g.put(x0, row, '='.repeat(x1 - x0 + 1));
g.put(24, 14, '=====');  // the brave ledge (coins)

export const LANDINGS = landings;

export default {
  id: 'escape',
  origin: { tx: 140, ty: -30 },
  grid: g.rows(),
  material: 'iron_grate',
  regions: [{ rect: [0, 46, 31, 47], material: 'wet_setts' }],
  decor: [],
  props: [
    { prop: 'building_face', x: 1, y: 46, layer: 'back' },
    ...landings.map(([row, x0, x1]) => ({ prop: 'escape_landing', x: x0, y: row, scale: (x1 - x0 + 1) / 7 })),
    { prop: 'escape_landing', x: 24, y: 14, scale: 5 / 7 },
    { prop: 'fire_door', x: 4, y: 46, layer: 'back' },
    { prop: 'stage_door', x: 27, y: 6, layer: 'back' },
    { prop: 'work_lamp', x: 6, y: 41 },
    { prop: 'work_lamp', x: 15, y: 25 },
    { prop: 'work_lamp', x: 25, y: 3 },
  ],
  enclosure: { fgFoliage: [] },
  light: { tint: 0xdce0f4 },
  backdrop: { set: 'roofs_night', horizon: 40 },
  ambience: 'rain_street',
  acoustics: 'hall',
  events: 'rain',
  music: { state: 'tense', bpm: 110, key: 'backstage', wall: 900 },
  objective: 'climb',
  titleCard: 'THE FIRE STAIRS',
  entities: [
    { type: 'portal', id: 'escape<backstage', kind: 'door', x: 4, y: 45, to: { room: 'backstage', portal: 'backstage>escape' }, door: { prompt: 'back inside', fade: 320 } },
    { type: 'checkpoint', id: 'cp_stairs', label: 'THE FIRE STAIRS', x: 7, y: 45 },
    { type: 'checkpoint', id: 'cp_halfway', label: 'HALFWAY UP', x: 14, y: 25 },
    { type: 'portal', id: 'escape>stage', kind: 'door', x: 27, y: 5, to: { room: 'stage', portal: 'stage<escape' }, door: { prompt: 'onto the stage', fade: 600 } },
    { type: 'foe', id: 'wisp_s1', kind: 'wisp', x: 12, y: 32, floats: true, patrol: [8, 17] },
    { type: 'foe', id: 'wisp_s2', kind: 'wisp', x: 24, y: 20, floats: true, patrol: [19, 29] },
    { type: 'foe', id: 'wisp_s3', kind: 'wisp', x: 6, y: 12, floats: true, patrol: [2, 11] },
    // breadcrumbs mark each next landing; the ledge and the far ends pay
    { type: 'coin', id: 'c_l1', x: 18, y: 39 },
    { type: 'coin', id: 'c_l2', x: 17, y: 35 },
    { type: 'coins', id: 'c_l3', x: 2, y: 28, n: 3 },
    { type: 'coin', id: 'c_l4', x: 10, y: 27 },
    { type: 'coins', id: 'c_l6', x: 26, y: 20, n: 4 },
    { type: 'coins', id: 'c_ledge', x: 24, y: 12, n: 5 },
    { type: 'coins', id: 'c_l8', x: 2, y: 12, n: 3 },
    { type: 'coins', id: 'c_top', x: 18, y: 4, n: 4 },
  ],
};
