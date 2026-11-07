// PALAZZO BARDELLI: a banker's house. The cortile's arcade on slender
// columns, a lemon tree in a pot, stairs up to the gallery where the
// tapestries hang, and at its end the study with the strongbox. Messer Corso
// receives masters of the guild upstairs; Maestro Anselmo Dori, the
// celebrated rival, is in the courtyard already, pitching. Bruno's porters
// are carrying the gold for the chapel along the gallery.
import { grid } from './grid.js';

const g = grid(50, 22);
g.fill(0, 0, 49, 1); // the roof beams over the gallery
g.fill(0, 20, 49, 21); // the courtyard paving
g.fill(0, 2, 1, 19); // the walls
g.fill(48, 2, 49, 19);
for (let i = 0; i <= 6; i++) g.fill(5 + i, 19 - i, 5 + i, 19); // the stairs up
g.put(12, 13, '====================================');  // the gallery (x 12–47)

export default {
  id: 'palazzo',
  origin: { tx: 0, ty: 70 },
  grid: g.rows(),
  material: 'cotto_floor',
  regions: [
    { rect: [0, 0, 49, 1], material: 'lime_wall' },
    { rect: [0, 2, 1, 19], material: 'lime_wall' },
    { rect: [48, 2, 49, 19], material: 'lime_wall' },
    { rect: [5, 13, 11, 19], material: 'piazza_stone' },
    { rect: [12, 13, 47, 13], material: 'oak_floor' },
  ],
  decor: [],
  props: [
    { prop: 'courtyard_arcade', x: 14, y: 20, dx: -16, layer: 'back' },
    { prop: 'courtyard_arcade', x: 28, y: 20, dx: -16, layer: 'back' },
    { prop: 'lemon_pot', x: 13, y: 20 },
    { prop: 'lemon_pot', x: 44, y: 20 },
    { prop: 'well', x: 26, y: 20 },
    { prop: 'tapestry', x: 24, y: 8, layer: 'back' },
    { prop: 'tapestry', x: 34, y: 8, layer: 'back' },
    { prop: 'strongbox', x: 45, y: 13 },
  ],
  lights: [{ x: 26, y: 16, r: 200, color: 0xfff4d8 }, { x: 42, y: 9, r: 120, color: 0xffd8a0 }],
  enclosure: { backWall: 'plaster', wainscot: true, posts: 7, ceiling: true, pillars: false, frames: [{ x: 2, y: 17, w: 2, h: 3 }], palette: { wall: 0xd8c8a0, wood: 0x4a3020, accent: 0x22408a, deep: 0x2a2220, lit: 0xfff4d8 } },
  light: { tint: 0xfff6ec },
  backdrop: null,
  ambience: 'rn_palazzo',
  acoustics: 'room',
  music: { state: 'quiet', bpm: 66, key: 'palazzo' },
  objective: [
    { text: 'see_corso' },
    { text: 'get_gold', flag: 'commission' },
    { text: 'to_chapel', flag: 'gold_leaf' },
  ],
  titleCard: 'PALAZZO BARDELLI',
  entities: [
    { type: 'portal', id: 'palazzo>piazza', kind: 'door', x: 3, y: 19, to: { room: 'piazza', portal: 'piazza>palazzo' }, door: { prompt: 'out to the square', fade: 260 } },
    { type: 'checkpoint', id: 'cp_palazzo', label: 'PALAZZO BARDELLI', x: 15, y: 19 },
    { type: 'npc', id: 'steward', cast: 'npc-rn-steward', x: 19, y: 19, facing: -1, talk: [{ conv: 'steward' }] },
    { type: 'npc', id: 'dori', cast: 'npc-rn-dori', x: 33, y: 19, facing: -1, talk: [{ conv: 'dori_after', if: 'met_dori' }, { conv: 'dori_first' }] },
    { type: 'npc', id: 'corso', cast: 'npc-rn-corso', x: 40, y: 12, facing: -1, talk: [{ conv: 'corso_after', if: 'commission' }, { conv: 'corso' }] },
    // Bruno's porters on the gallery, carrying the chapel's gold
    { type: 'foe', kind: 'porter', x: 22, y: 12, patrol: [14, 30] },
    { type: 'foe', kind: 'porter', x: 34, y: 19, patrol: [36, 46] },
    { type: 'keyitem', id: 'gold_leaf', x: 46, y: 12, when: 'commission', beat: 'got_gold' },
    // giglio coins: the arcade's capitals (a run over the porters' heads)
    { type: 'coins', id: 'c_stairs', x: 8, y: 14, n: 3 },
    { type: 'coins', id: 'c_gal', x: 16, y: 10, n: 6 },
    { type: 'coin', id: 'c_well', x: 26, y: 16 },
  ],
};
