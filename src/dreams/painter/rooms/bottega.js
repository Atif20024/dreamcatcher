// THE BOTTEGA: Maestro Gualtiero's workshop, where the dream starts. A low
// beamed room, north light falling on panels and the altarpiece on its
// trestle, the porphyry slab by the window, the hearth with the glue pot,
// a loft at the back where Bice draws at night. Errand boy → apprentice
// (grind the colours), then apprentice → assistant (the drapery, once the
// lapis is in the house).
import { grid } from './grid.js';
import { ALTAR } from '../props.js';

const g = grid(50, 14);
g.fill(0, 0, 49, 1); // the beams
g.fill(0, 12, 49, 13); // the tiled floor
g.fill(0, 2, 1, 11); // the walls
g.fill(48, 2, 49, 11);
g.put(36, 8, '============'); // the loft at the back
for (let y = 7; y <= 11; y++) g.put(35, y, 'H'); // its ladder
g.put(20, 8, '=====');  // the pattern-book shelf (a high reach)

export const BOTTEGA_ALTAR_X = 17;

export default {
  id: 'bottega',
  origin: { tx: 0, ty: 40 },
  grid: g.rows(),
  material: 'cotto_floor',
  regions: [
    { rect: [0, 0, 49, 1], material: 'lime_wall' },
    { rect: [0, 2, 1, 11], material: 'lime_wall' },
    { rect: [48, 2, 49, 11], material: 'lime_wall' },
    { rect: [36, 8, 47, 8], material: 'oak_floor' },
    { rect: [20, 8, 24, 8], material: 'oak_floor' },
  ],
  decor: [],
  props: [
    { prop: 'hearth', x: 8, y: 12 },
    { prop: 'altarpiece', x: BOTTEGA_ALTAR_X, y: 12, unless: 'drapery_done' },
    { prop: 'altarpiece_done', x: BOTTEGA_ALTAR_X, y: 12, when: 'drapery_done' },
    { prop: 'cast_hand', x: 21, y: 5, layer: 'back' },
    { prop: 'north_window', x: 27, y: 5, layer: 'back' },
    { prop: 'pigment_table', x: 26, y: 12 },
    { prop: 'trestle', x: 31, y: 12 },
    { prop: 'panel_rack', x: 41, y: 12, layer: 'back' },
    { prop: 'bench', x: 44, y: 8 },
  ],
  lights: [{ x: 26, y: 8, r: 160, color: 0xe8f0ff }],
  enclosure: { backWall: 'plaster', wainscot: true, posts: 8, ceiling: true, pillars: false, frames: [{ x: 2, y: 9, w: 2, h: 3 }], palette: { wall: 0xc8b490, wood: 0x5a3a24, accent: 0xd8a840, deep: 0x2a1e18, lit: 0xfff0d0 } },
  light: { tint: 0xfff4e4 },
  backdrop: null,
  ambience: 'rn_bottega',
  acoustics: 'room',
  music: { state: 'quiet', bpm: 72, key: 'bottega' },
  objective: [
    { text: 'meet_master' },
    { text: 'grind', flag: 'met_master' },
    { text: 'fetch_lapis', flag: 'ground' },
    { text: 'drapery', flag: 'lapis' },
    { text: 'to_guild', flag: 'assistant' },
  ],
  titleCard: 'THE BOTTEGA',
  entities: [
    { type: 'spawn', id: 'start', x: 6, y: 11 },
    { type: 'portal', id: 'bottega>via', kind: 'door', x: 3, y: 11, to: { room: 'via', portal: 'via>bottega' }, door: { prompt: 'out to the street', fade: 260 } },
    { type: 'checkpoint', id: 'cp_bottega', label: 'THE BOTTEGA', x: 11, y: 11 },
    {
      type: 'npc', id: 'gualtiero', cast: 'npc-rn-gualtiero', x: 14, y: 11, facing: 1,
      talk: [
        { conv: 'gualtiero_after', if: 'assistant' },
        { conv: 'gualtiero_drapery', if: 'lapis' },
        { conv: 'gualtiero_lapis_wait', if: 'apprentice' },
        { conv: 'gualtiero_wait', if: 'met_master' },
        { conv: 'gualtiero_first' },
      ],
    },
    { type: 'npc', id: 'tonio', cast: 'npc-rn-tonio', x: 32, y: 11, dx: 10, facing: -1, talk: [{ conv: 'tonio' }] },
    { type: 'npc', id: 'bice', cast: 'npc-rn-bice', x: 45, y: 7, facing: -1, talk: [{ conv: 'bice_after', if: 'drapery_done' }, { conv: 'bice_wait', if: 'met_bice' }, { conv: 'bice_first' }] },
    // the jobs: the slab by the window, then the altarpiece (once there is lapis)
    { type: 'encounter', id: 'grind', x: 25, y: 11, anchor: { x: 26, y: 5 }, prompt: 'grind the colours', when: 'met_master', unless: 'ground' },
    { type: 'encounter', id: 'drapery', x: BOTTEGA_ALTAR_X + 1, y: 11, anchor: { x: BOTTEGA_ALTAR_X, y: 4 }, prompt: 'paint the drapery', when: 'lapis', unless: 'drapery_done' },
    { type: 'moment', id: 'm_bice', x: 42, y: 7, when: 'drapery_done', prompt: 'watch Bice draw', beat: 'moment_bice' },
    // giglio coins: the pattern-book shelf, along the loft's beams
    { type: 'coins', id: 'c_shelf', x: 20, y: 6, n: 5 },
    { type: 'coins', id: 'c_loft', x: 37, y: 5, n: 5 },
    { type: 'coin', id: 'c_ladder', x: 35, y: 6 },
  ],
};

// where the drapery job's panel is drawn (the altarpiece prop's panel, in
// room px), for its encounter's def.work offset
export function altarWorkOffset() {
  const K = 44;
  const w = 2.0 * K;
  const h = 3.3 * K;
  const px = (BOTTEGA_ALTAR_X + 0.5) * 32;
  const top = 12 * 32 - h;
  const cx = px - w / 2 + ALTAR.x + ALTAR.w / 2;
  const cy = top + ALTAR.y + ALTAR.h / 2;
  const ax = BOTTEGA_ALTAR_X * 32 + 16;
  const ay = 4 * 32 + 16;
  return { dx: cx - ax, dy: cy - ay, w: ALTAR.w, h: ALTAR.h };
}
