// THE MAIN SALOON: the long room down the middle of the boiler deck. Walnut
// panelling and stateroom doors with coloured transoms, a clerestory of
// stained glass, chandeliers, Brussels runners on oak; the bar forward, a
// four-piece on a riser (parlour upright, banjo, a snare with brushes, a
// clarinet) that never stops, and aft the faro bank: the dealer, the
// casekeeper at his abacus, and Mrs Odell Fenn with her one coin. The
// steward goes round with the house's whisky (a comp: it goes on Mr Pell's
// book). Lou walks at Jo's shoulder. The card room door is aft.
import { grid } from './grid.js';

const g = grid(60, 14);
g.fill(0, 0, 59, 3); // the clerestory deck overhead
g.fill(0, 12, 59, 13); // the floor
g.fill(0, 4, 1, 11); // the bulkheads
g.fill(58, 4, 59, 11);

export const FARO_X = 44;

export default {
  id: 'saloon',
  origin: { tx: 0, ty: 40 },
  grid: g.rows(),
  material: 'saloon_oak',
  regions: [
    { rect: [0, 0, 59, 3], material: 'ceiling_white' },
    { rect: [0, 4, 1, 11], material: 'walnut_panel' },
    { rect: [58, 4, 59, 11], material: 'walnut_panel' },
  ],
  decor: [],
  props: [
    { prop: 'clerestory', x: 8, y: 4, dy: -16, layer: 'back' },
    { prop: 'clerestory', x: 20, y: 4, dy: -16, layer: 'back' },
    { prop: 'clerestory', x: 32, y: 4, dy: -16, layer: 'back' },
    { prop: 'clerestory', x: 44, y: 4, dy: -16, layer: 'back' },
    { prop: 'clerestory', x: 54, y: 4, dy: -16, layer: 'back' },
    { prop: 'cabin_door', x: 3, y: 12, layer: 'back' },
    { prop: 'back_bar', x: 9, y: 12, layer: 'back' },
    { prop: 'bar_counter', x: 9, y: 12 },
    { prop: 'bandstand', x: 22, y: 12, layer: 'back' },
    { prop: 'stateroom', x: 30, y: 12, layer: 'back' },
    { prop: 'stateroom', x: 34, y: 12, layer: 'back' },
    { prop: 'stateroom', x: 38, y: 12, layer: 'back' },
    { prop: 'stateroom', x: 51, y: 12, layer: 'back' },
    { prop: 'faro_table', x: FARO_X, y: 12 },
    { prop: 'saloon_chair', x: 41, y: 12, dx: 8 },
    { prop: 'saloon_chair', x: 47, y: 12, flip: true },
    { prop: 'cabin_door', x: 56, y: 12, layer: 'back' },
    { prop: 'carpet_runner', x: 2, y: 12, layer: 'fg', dy: 2 },
    { prop: 'carpet_runner', x: 18, y: 12, layer: 'fg', dy: 2 },
    { prop: 'carpet_runner', x: 34, y: 12, layer: 'fg', dy: 2 },
    { prop: 'chandelier', x: 13, y: 4, dy: -16 },
    { prop: 'chandelier', x: 28, y: 4, dy: -16 },
    { prop: 'chandelier', x: 44, y: 4, dy: -16 },
  ],
  lights: [{ x: 22, y: 9, r: 140, color: 0xffd8a0 }],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 8, ceiling: true, pillars: true, frames: [{ x: 2, y: 9, w: 2, h: 3 }, { x: 55, y: 9, w: 2, h: 3 }], palette: { wall: 0x5a3420, wood: 0x3a1e12, accent: 0xc8a050, deep: 0x1a0e08, lit: 0xf2c890 } },
  light: { tint: 0xfff0dc },
  backdrop: null,
  ambience: 'gm_saloon',
  acoustics: 'room',
  music: { state: 'explore', key: 'saloon' },
  objective: [
    { text: 'faro' },
    { text: 'to_cards', flag: 'faro_done' },
  ],
  titleCard: 'THE MAIN SALOON',
  entities: [
    { type: 'portal', id: 'saloon>quay', kind: 'door', x: 3, y: 11, to: { room: 'quay', portal: 'quay>saloon' }, door: { prompt: 'out to the quay', fade: 260 } },
    { type: 'checkpoint', id: 'cp_saloon', label: 'THE MAIN SALOON', x: 6, y: 11 },
    { type: 'sign', text: 'BAR', x: 9, y: 5, board: 0x2a160e, scale: 2 },
    { type: 'sign', text: 'FARO BANK', x: FARO_X, y: 7, dx: -40, board: 0x1e3a2a, ink: 0xf2d580, scale: 2 },
    { type: 'sign', text: 'CARD ROOM', x: 56, y: 6, board: 0x2a160e, scale: 2 },
    { type: 'npc', id: 'barman', cast: 'npc-lq-steward', x: 11, y: 11, facing: 1, depth: 'behind', talk: [{ conv: 'barman' }] },
    { type: 'npc', id: 'pianist', cast: 'npc-lq-pianist', x: 19, y: 11, pose: 'sit', facing: -1 },
    { type: 'npc', id: 'banjo', cast: 'npc-lq-banjo', x: 22, y: 11, facing: 1, turns: false },
    { type: 'npc', id: 'clarinet', cast: 'npc-lq-clarinet', x: 24, y: 11, facing: -1, turns: false },
    { type: 'npc', id: 'drummer', cast: 'npc-lq-drummer', x: 26, y: 11, pose: 'sit', facing: -1 },
    { type: 'npc', id: 'steward', cast: 'npc-lq-steward', x: 32, y: 11, facing: 1, pace: [29, 38], talk: [{ conv: 'steward_after', if: 'steward_asked' }, { conv: 'steward' }] },
    { type: 'npc', id: 'fenn', cast: 'npc-lq-fenn', x: 41, y: 11, pose: 'sit', facing: 1, talk: [{ conv: 'fenn_after', if: 'faro_done' }, { conv: 'fenn' }] },
    { type: 'npc', id: 'dealer', cast: 'npc-lq-dealer', x: 46, y: 11, facing: -1, depth: 'behind', talk: [{ conv: 'dealer_after', if: 'dealer_asked' }, { conv: 'dealer' }] },
    { type: 'npc', id: 'casekeeper', cast: 'npc-lq-casekeeper', x: 48, y: 11, facing: -1, depth: 'behind' },
    { type: 'npc', id: 'lou_saloon', cast: 'npc-lq-lou', x: 7, y: 11, facing: 1, follow: [4, 54], talk: [{ conv: 'lou_saloon_after', if: 'faro_done' }, { conv: 'lou_saloon' }] },
    { type: 'encounter', id: 'faro', x: 43, y: 11, anchor: { x: FARO_X, y: 8 }, prompt: 'sit down at the bank', unless: 'faro_done' },
    { type: 'moment', id: 'm_fenn', x: 40, y: 11, when: 'faro_done', prompt: 'watch Mrs Fenn play her coin', beat: 'moment_fenn' },
    { type: 'portal', id: 'saloon>cards', kind: 'door', x: 56, y: 11, to: { room: 'cards', portal: 'cards>saloon' }, door: { prompt: 'into the card room', fade: 220, requires: ['faro_done'], locked: 'the bank first', lockedLine: 'The card room wants a stake. Double my forty at the faro bank first.' } },
    // half dimes: one by the bar, one by the bank, one at the card room door
    { type: 'coin', id: 'c_bar', x: 16, y: 10 },
    { type: 'coin', id: 'c_bank', x: 39, y: 10 },
    { type: 'coin', id: 'c_cards', x: 54, y: 10 },
  ],
};
