import { buildWriterMap } from './map.js';

// D2 — rooms = grid + objects. Objects are written in WORLD columns and
// shifted to room-local ones here, so a thing can be moved without
// re-deriving offsets. Anything with a `noun` carries a typewriter label the
// pen can edit (systems/labels.js): `adj` is the word on it, `bound` means it
// is underlined and cannot be changed, `to` is the adjective the puzzle wants.
const FULL = buildWriterMap();
const slice = (x0, x1) => FULL.map((row) => row.slice(x0, x1 + 1));

function room(def, x0, x1, objects) {
  return {
    ...def,
    grid: slice(x0, x1),
    objects: objects.map((o) => ({
      ...o,
      x: o.x - x0,
      patrol: o.patrol ? o.patrol.map((c) => c - x0) : undefined,
      x1: o.x1 !== undefined ? o.x1 - x0 : undefined,
    })),
  };
}

// Chapter 5: the flat is built from Jo's own paragraphs. `w` is the pages
// the paragraph weighs; `on` is the paragraph it rests on (cut that and this
// one drops a second later). Scaffolding = a dead end with coins on it.
export const PARAGRAPHS = [
  { id: 'p_attic', name: 'the attic', w: 5, x0: 426, x1: 430, y: 26 },
  { id: 'p_tomasz', name: 'tomasz', w: 4, x0: 428, x1: 431, y: 23, on: 'p_attic', scaffold: true },
  { id: 'p_copyshop', name: 'the copy shop', w: 5, x0: 432, x1: 436, y: 25 },
  { id: 'p_pigeon', name: 'the pigeon', w: 4, x0: 434, x1: 437, y: 21, on: 'p_copyshop', scaffold: true },
  { id: 'p_three', name: 'page three', w: 6, x0: 438, x1: 445, y: 24, three: true },
  { id: 'p_cafe', name: 'the café', w: 5, x0: 440, x1: 444, y: 20, on: 'p_three' },
  { id: 'p_hat', name: 'the man in the hat', w: 4, x0: 446, x1: 449, y: 18, on: 'p_cafe', scaffold: true },
  { id: 'p_necessary', name: 'necessary', w: 5, x0: 447, x1: 451, y: 23, bound: true },
  { id: 'p_stacks', name: 'the stacks', w: 5, x0: 452, x1: 456, y: 22 },
  { id: 'p_rain', name: 'the rain', w: 5, x0: 451, x1: 455, y: 26, scaffold: true },
  { id: 'p_forty', name: 'forty envelopes', w: 4, x0: 453, x1: 456, y: 25, on: 'p_rain', scaffold: true },
  { id: 'p_soup', name: 'the soup', w: 4, x0: 428, x1: 431, y: 19, on: 'p_tomasz', scaffold: true },
  { id: 'p_wren', name: 'wren', w: 4, x0: 456, x1: 458, y: 20 },
];

export default [
  room(
    { id: 'arrival', section: 'arrival', allowNoFoes: true, music: { bpm: 84, state: 'quiet' }, bg: { far: 'thin_houses', mid: 'dawn_terrace', near: 'railings', landmark: 'attic_window' } },
    0, 28,
    [
      { type: 'spawn', x: 3, y: 33 },
      { type: 'prop', kind: 'lamp_post', x: 14, y: 33 },
      { type: 'coin', x: 10, y: 31, breadcrumb: true },
      { type: 'coins', x: 22, y: 31, n: 2 },
      { type: 'checkpoint', x: 24, y: 33, id: 'CP0' },
    ]
  ),
  room(
    { id: 'attic', section: 'blank_page', allowNoFoes: true, music: { bpm: 84, state: 'quiet' }, bg: { far: 'attic_wall', mid: 'index_cards', near: 'rafters', landmark: 'skylight' } },
    29, 59,
    [
      { type: 'prop', kind: 'mattress', x: 32, y: 20 },
      { type: 'coin', x: 32, y: 19 },
      { type: 'prop', kind: 'typewriter', x: 36, y: 20, id: 'typewriter', noun: 'typewriter', adj: 'jammed', to: 'working' },
      { type: 'desk', x: 36, y: 20, id: 'desk1', pages: 4, bars: 8, needs: 'typewriter' },
      { type: 'word', x: 33, y: 20, word: 'working', on: 'a coffee tin' },
      { type: 'word', x: 42, y: 18, word: 'light', on: 'a cereal box' },
      { type: 'coins', x: 46, y: 15, n: 3 },
      { type: 'prop', kind: 'trunk', x: 47, y: 19, id: 'trunk', noun: 'trunk', adj: 'heavy', to: 'light' },
      { type: 'inkwell', x: 39, y: 20, id: 'ink1' },
      { type: 'checkpoint', x: 44, y: 20, id: 'CP1a' },
      { type: 'coin', x: 54, y: 27, breadcrumb: true },
    ]
  ),
  room(
    { id: 'copyshop', section: 'blank_page', music: { bpm: 100, state: 'explore' }, bg: { far: 'copy_wall', mid: 'copiers', near: 'paper_stacks', landmark: 'copy_sign' } },
    60, 119,
    [
      { type: 'foe', kind: 'landlady', x: 63, y: 33, patrol: [61, 69], human: true },
      { type: 'hide', x: 71, y: 32, id: 'water_tank' },
      { type: 'foe', kind: 'pigeon', x: 74, y: 31, patrol: [72, 76], human: false },
      { type: 'coins', x: 73, y: 30, n: 3 },
      { type: 'prop', kind: 'shop_door', x: 80, y: 33 },
      { type: 'npc', who: 'tomasz', x: 82, y: 33 },
      { type: 'inkwell', x: 81, y: 33, id: 'ink2' },
      { type: 'prop', kind: 'toner', x: 86, y: 33, id: 'toner', noun: 'toner', adj: 'heavy', to: 'light', carry: true },
      { type: 'prop', kind: 'machine', x: 88, y: 33, id: 'machine1', noun: 'machine', adj: 'jammed', to: 'working' },
      { type: 'prop', kind: 'machine', x: 92, y: 33, id: 'machine2', noun: 'machine', adj: 'jammed', to: 'working' },
      { type: 'prop', kind: 'machine', x: 96, y: 33, id: 'machine3', noun: 'machine', adj: 'jammed', to: 'working' },
      { type: 'prop', kind: 'machine', x: 99, y: 33, id: 'machine4', noun: 'machine', adj: 'jammed', to: 'working' },
      { type: 'coins', x: 87, y: 29, n: 3 },
      { type: 'coins', x: 95, y: 29, n: 3 },
      { type: 'label', x: 101, y: 32, id: 'rollers', noun: 'rollers', adj: 'hot', to: 'cold' },
      { type: 'label', x: 104, y: 33, id: 'spill', noun: 'spill', adj: 'slippery', to: 'dry' },
      { type: 'prop', kind: 'machine', x: 110, y: 27, id: 'machine5', noun: 'machine', adj: 'jammed', bound: true },
      { type: 'lever', x: 108, y: 27, id: 'lever5', fixes: 'machine5' },
      { type: 'prop', kind: 'machine', x: 115, y: 27, id: 'machine6', noun: 'machine', adj: 'empty', bound: true, accepts: 'toner' },
      { type: 'coins', x: 111, y: 25, n: 2 },
      { type: 'desk', x: 113, y: 26, id: 'desk2', pages: 8, bars: 10 },
      { type: 'moment', x: 116, y: 33, id: 'm1' },
      { type: 'checkpoint', x: 83, y: 33, id: 'CP1b' },
      { type: 'coin', x: 118, y: 27, breadcrumb: true },
      { type: 'gate', x: 119, y: 29, h: 5, id: 'g1', requires: ['rent_paid', 'pages12'] },
    ]
  ),
  room(
    { id: 'cafe', section: 'cafe', music: { bpm: 96, state: 'explore' }, bg: { far: 'cafe_wall', mid: 'brass', near: 'cafe_tables', landmark: 'espresso_sign' } },
    120, 179,
    [
      { type: 'foe', kind: 'talker', x: 123, y: 33, human: true, word: 'wide', line: 'a *wide* berth, that\'s all I asked' },
      { type: 'label', x: 127, y: 32, id: 'gap', noun: 'gap', adj: 'narrow', to: 'wide' },
      { type: 'gate', x: 127, y: 27, h: 7, id: 'g_gap', requires: ['gap_wide'] },
      { type: 'checkpoint', x: 129, y: 33, id: 'CP2a' },
      { type: 'prop', kind: 'espresso', x: 131, y: 33, id: 'espresso', noun: 'machine', adj: 'loud', to: 'quiet', noisy: true },
      { type: 'moment', x: 129, y: 33, id: 'm2' },
      { type: 'foe', kind: 'talker', x: 135, y: 33, human: true, word: 'quiet', line: 'the *quiet* ones, every time' },
      { type: 'coins', x: 133, y: 30, n: 2 },
      { type: 'coin', x: 136, y: 28 },
      { type: 'foe', kind: 'talker', x: 147, y: 26, human: true, word: 'fixed', line: 'it was *fixed* from the start, the whole thing' },
      { type: 'label', x: 141, y: 28, id: 'ladder', noun: 'ladder', adj: 'broken', to: 'fixed' },
      { type: 'coins', x: 144, y: 23, n: 3 },
      { type: 'foe', kind: 'talker', x: 155, y: 33, human: true, word: 'awake', line: 'I lay *awake* with it for a week' },
      { type: 'npc', who: 'wren', x: 150, y: 31 },
      { type: 'prop', kind: 'piano', x: 152, y: 31 },
      { type: 'npc', who: 'emmerich', x: 158, y: 33 },
      { type: 'prop', kind: 'table', x: 158, y: 33 },
      { type: 'foe', kind: 'talker', x: 168, y: 33, human: true, word: 'dry', line: 'bone *dry* by the time I got there' },
      { type: 'prop', kind: 'bench', x: 166, y: 33, id: 'bench', noun: 'bench', adj: 'wet', to: 'dry' },
      { type: 'desk', x: 166, y: 33, id: 'desk3', pages: 12, bars: 12, needs: 'bench', cat: true },
      { type: 'inkwell', x: 161, y: 33, id: 'ink3' },
      { type: 'prop', kind: 'dog', x: 175, y: 33, id: 'dog', noun: 'dog', adj: 'sleeping', bound: true },
      { type: 'gate', x: 176, y: 31, h: 3, id: 'g_dog', requires: ['dog_awake'] },
      { type: 'coin', x: 174, y: 30 },
      { type: 'checkpoint', x: 177, y: 33, id: 'CP2b' },
      { type: 'gate', x: 179, y: 29, h: 5, id: 'g2', requires: ['lines', 'pages30'] },
    ]
  ),
  room(
    { id: 'library', section: 'library', music: { bpm: 80, state: 'quiet' }, bg: { far: 'oak_stacks', mid: 'green_lamps', near: 'book_carts', landmark: 'reading_lamp' } },
    180, 249,
    [
      { type: 'checkpoint', x: 183, y: 33, id: 'CP3a' },
      { type: 'inkwell', x: 184, y: 33, id: 'ink4' },
      { type: 'desk', x: 189, y: 33, id: 'desk4', pages: 30, bars: 14 },
      { type: 'npc', who: 'emmerich', x: 195, y: 33, id: 'emmerich2' },
      { type: 'prop', kind: 'table', x: 195, y: 33 },
      { type: 'panel', x: 195, y: 33, id: 'structure', puzzle: 'structure' },
      // the stacks
      { type: 'foe', kind: 'guard', x: 212, y: 33, patrol: [204, 236], human: true, floor: 34 },
      { type: 'foe', kind: 'guard', x: 226, y: 24, patrol: [218, 232], human: true, floor: 26 },
      { type: 'foe', kind: 'guard', x: 232, y: 12, patrol: [222, 236], human: true, floor: 14 },
      { type: 'hide', x: 216, y: 32, id: 'cart_a' },
      { type: 'hide', x: 242, y: 25, id: 'cart_b' },
      { type: 'word', x: 246, y: 30, word: 'lit', on: 'the stairs' },
      { type: 'word', x: 208, y: 17, word: 'low', on: 'a spine' },
      { type: 'label', x: 205, y: 24, id: 'alcove', noun: 'alcove', adj: 'dark', to: 'lit' },
      { type: 'source', x: 205, y: 25, id: 'weather', name: 'WEATHER', word: 'cold', hidden: 'alcove' },
      { type: 'label', x: 236, y: 12, id: 'shelf', noun: 'shelf', adj: 'high', to: 'low' },
      { type: 'source', x: 236, y: 12, id: 'history', name: 'HISTORY', word: 'old', shelf: true },
      { type: 'glass', x: 214, y: 22, x1: 221, id: 'glass', noun: 'floor', adj: 'fragile', bound: true },
      { type: 'source', x: 223, y: 21, id: 'letters', name: 'LETTERS', word: 'kind' },
      { type: 'prop', kind: 'cart', x: 234, y: 33, id: 'cart', noun: 'cart', adj: 'heavy', to: 'light', push: true },
      { type: 'dumbwaiter', x: 240, y: 33, id: 'dumbwaiter', noun: 'dumbwaiter', adj: 'loud', to: 'quiet', top: 13 },
      { type: 'foe', kind: 'guard', x: 237, y: 12, human: true, asleep: true, floor: 14, id: 'sleeper' },
      { type: 'prop', kind: 'key', x: 243, y: 13, id: 'key', carry: true },
      { type: 'prop', kind: 'cabinet', x: 246, y: 33, id: 'cabinet', noun: 'cabinet', adj: 'locked', bound: true, accepts: 'key' },
      { type: 'source', x: 246, y: 33, id: 'maps', name: 'MAPS', word: 'far', hidden: 'cabinet' },
      { type: 'source', x: 195, y: 33, id: 'grief', name: 'GRIEF', word: 'gone', hidden: 'structure' },
      { type: 'coins', x: 206, y: 29, n: 3 },
      { type: 'coins', x: 226, y: 29, n: 2 },
      { type: 'coins', x: 210, y: 25, n: 3 },
      { type: 'coins', x: 240, y: 25, n: 2 },
      { type: 'coins', x: 228, y: 21, n: 3 },
      { type: 'coins', x: 204, y: 17, n: 3 },
      { type: 'coins', x: 216, y: 13, n: 2 },
      { type: 'coins', x: 242, y: 17, n: 3 },
      { type: 'shard', x: 218, y: 13 },
      { type: 'coins', x: 214, y: 13, n: 2, dx: 6 },
      { type: 'checkpoint', x: 247, y: 21, id: 'CP3b' },
      { type: 'checkpoint', x: 203, y: 13, id: 'CP3c' },
      { type: 'coin', x: 248, y: 32, breadcrumb: true },
      { type: 'gate', x: 249, y: 29, h: 5, id: 'g3', requires: ['research', 'structure', 'pages60'] },
    ]
  ),
  room(
    { id: 'postoffice', section: 'rejections', music: { bpm: 92, state: 'explore' }, bg: { far: 'brass_boxes', mid: 'post_counters', near: 'railings', landmark: 'post_clock' } },
    250, 289,
    [
      { type: 'checkpoint', x: 252, y: 33, id: 'CP4a' },
      ...[254, 258, 262, 266, 270, 274, 278, 282].map((c, i) => ({ type: 'plate', x: c, y: i % 2 ? 30 : 33, id: `box${i}` })),
      { type: 'foe', kind: 'slip', x: 260, y: 20, human: false, wave: true },
      { type: 'coins', x: 265, y: 28, n: 3 },
      { type: 'coins', x: 273, y: 28, n: 3 },
      { type: 'npc', who: 'wren', x: 285, y: 32, id: 'wren2' },
      { type: 'dialogue', x: 284, y: 32, id: 'd3' },
      { type: 'gate', x: 289, y: 29, h: 5, id: 'g4a', requires: ['rejected'] },
    ]
  ),
  room(
    { id: 'bus', section: 'rejections', allowNoFoes: true, music: { bpm: 70, state: 'quiet' }, bg: { far: 'rain_night', mid: 'bus_windows', near: 'railings', landmark: 'bus_stop' } },
    290, 319,
    [
      { type: 'prop', kind: 'bag', x: 292, y: 32, id: 'bag' },
      { type: 'coins', x: 300, y: 26, n: 2 },
      { type: 'coins', x: 305, y: 23, n: 3 },
      { type: 'coin', x: 310, y: 26 },
      { type: 'wake', x: 317, y: 33 },
      { type: 'checkpoint', x: 318, y: 33, id: 'CP4b' },
    ]
  ),
  room(
    { id: 'rain', section: 'rain', allowNoFoes: true, finale: true, music: { bpm: 60, state: 'quiet' }, bg: { far: 'rain_night', mid: 'sodium_street', near: 'railings', landmark: 'lit_window' } },
    320, 369,
    [
      { type: 'editor', x: 322, y: 33, from: 326 },
      { type: 'prop', kind: 'lamp_post', x: 338, y: 33 },
      { type: 'prop', kind: 'lamp_post', x: 358, y: 33 },
    ]
  ),
  room(
    { id: 'rewrite', section: 'rewrite', allowNoFoes: true, music: { bpm: 84, state: 'quiet' }, bg: { far: 'attic_wall', mid: 'index_cards', near: 'rafters', landmark: 'skylight' } },
    370, 399,
    [
      { type: 'prop', kind: 'mattress', x: 373, y: 20 },
      { type: 'panel', x: 377, y: 20, id: 'memory', puzzle: 'memory' },
      { type: 'prop', kind: 'cards', x: 377, y: 20 },
      { type: 'prop', kind: 'typewriter', x: 381, y: 20 },
      { type: 'checkpoint', x: 385, y: 20, id: 'CP4c' },
      { type: 'inkwell', x: 388, y: 20, id: 'ink5' },
      { type: 'editor_wait', x: 391, y: 20 },
      { type: 'gate', x: 393, y: 15, h: 6, id: 'g4', requires: ['rewritten'] },
      { type: 'moment', x: 398, y: 24, id: 'm3' },
      { type: 'coin', x: 396, y: 22 },
    ]
  ),
  room(
    { id: 'editor', section: 'editor', allowNoFoes: true, music: { bpm: 76, state: 'quiet' }, bg: { far: 'paper_wall', mid: 'laundrette', near: 'red_pencils', landmark: 'red_pencil' } },
    400, 459,
    [
      { type: 'checkpoint', x: 410, y: 33, id: 'CP5a' },
      { type: 'prop', kind: 'washer', x: 412, y: 33 },
      { type: 'prop', kind: 'washer', x: 415, y: 33 },
      { type: 'coin', x: 424, y: 27, breadcrumb: true },
      { type: 'npc', who: 'emmerich', x: 428, y: 27, id: 'emmerich3' },
      { type: 'pencil', x: 426, y: 27 },
      { type: 'editor', x: 426, y: 27, from: 432, slow: true },
      { type: 'coins', x: 429, y: 22, n: 2 },
      { type: 'coins', x: 435, y: 20, n: 2 },
      { type: 'coins', x: 440, y: 23, n: 4 },
      { type: 'coins', x: 447, y: 17, n: 2 },
      { type: 'coins', x: 453, y: 24, n: 2 },
      { type: 'coins', x: 429, y: 18, n: 2 },
      { type: 'checkpoint', x: 449, y: 22, id: 'CP5b' },
      { type: 'gate', x: 459, y: 16, h: 3, id: 'g5', requires: ['cut_done'] },
    ]
  ),
  room(
    { id: 'agent', section: 'deadline', allowNoFoes: true, music: { bpm: 112, state: 'explore' }, bg: { far: 'glass_city', mid: 'office_glass', near: 'office_desks', landmark: 'office_clock' } },
    460, 489,
    [
      { type: 'inkwell', x: 465, y: 19, id: 'ink6' },
      { type: 'npc', who: 'isolde', x: 472, y: 19 },
      { type: 'prop', kind: 'desk_big', x: 473, y: 19 },
      { type: 'dialogue', x: 470, y: 19, id: 'd5', auto: true, sets: 'deadline' },
      { type: 'editor', x: 462, y: 19, from: 476, stop: 598, follow: true },
      { type: 'coins', x: 480, y: 17, n: 3 },
      { type: 'prop', kind: 'fire_door', x: 488, y: 19 },
    ]
  ),
  room(
    { id: 'city', section: 'deadline', music: { bpm: 120, state: 'danger' }, bg: { far: 'glass_city', mid: 'rooftops', near: 'fire_escape', landmark: 'water_tower_sign' } },
    490, 539,
    [
      { type: 'coins', x: 496, y: 18, n: 2 },
      { type: 'coins', x: 507, y: 20, n: 3 },
      { type: 'label', x: 513, y: 22, id: 'ledge', noun: 'ledge', adj: 'narrow', to: 'wide' },
      { type: 'ledge', x: 512, y: 23, x1: 515, id: 'ledge_tiles' },
      { type: 'coins', x: 519, y: 19, n: 3 },
      { type: 'crane', x: 525, y: 20, x1: 533, id: 'crane', noun: 'crane', adj: 'slow', to: 'fast' },
      { type: 'coin', x: 529, y: 18 },
      { type: 'coins', x: 536, y: 20, n: 2 },
    ]
  ),
  room(
    { id: 'press', section: 'deadline', music: { bpm: 124, state: 'setpiece' }, bg: { far: 'iron_hall', mid: 'press_rollers', near: 'paper_webs', landmark: 'press_wheel' } },
    540, 599,
    [
      { type: 'foe', kind: 'proofreader', x: 545, y: 33, patrol: [542, 552], human: true },
      { type: 'foe', kind: 'proofreader', x: 550, y: 33, patrol: [546, 553], human: true },
      { type: 'desk', x: 543, y: 33, id: 'typo_desk', fixTypos: true },
      { type: 'checkpoint', x: 544, y: 33, id: 'CP6a' },
      { type: 'coins', x: 556, y: 24, n: 3 },
      { type: 'checkpoint', x: 558, y: 16, id: 'CP6b' },
      { type: 'plate', x: 560, y: 16, id: 'feed', feed: true },
      { type: 'lever', x: 566, y: 17, id: 'lever_ink', order: 0, name: 'INK' },
      { type: 'hazard', kind: 'roller', x: 575, y: 17, period: 2400, offset: 0 },
      { type: 'coins', x: 580, y: 16, n: 3 },
      { type: 'lever', x: 584, y: 22, id: 'lever_press', order: 1, name: 'PRESS' },
      { type: 'hazard', kind: 'roller', x: 570, y: 22, period: 2400, offset: 1200 },
      { type: 'coins', x: 566, y: 21, n: 3 },
      { type: 'lever', x: 566, y: 27, id: 'lever_fold', order: 2, name: 'FOLD' },
      { type: 'hazard', kind: 'folder', x: 580, y: 27, period: 2000, offset: 0 },
      { type: 'coins', x: 586, y: 26, n: 2 },
      { type: 'prop', kind: 'tray', x: 593, y: 33, id: 'tray' },
      { type: 'coin', x: 597, y: 32, breadcrumb: true },
      { type: 'gate', x: 599, y: 29, h: 5, id: 'g6', requires: ['printed'] },
    ]
  ),
  room(
    { id: 'bookshop', section: 'reading', allowNoFoes: true, music: { bpm: 72, state: 'quiet' }, bg: { far: 'bookshop_wall', mid: 'book_shelves', near: 'bookshop_tables', landmark: 'one_lamp' } },
    600, 639,
    [
      ...['wren', 'tomasz', 'hat', 'emmerich', 'reader1', 'reader2', 'reader3', 'reader4', 'landlady'].map((who, i) => ({ type: 'chair', who, x: 606 + i * 2, y: 33 })),
      { type: 'lectern', x: 627, y: 33 },
      { type: 'orb', x: 630, y: 29 },
      { type: 'coin', x: 604, y: 31, breadcrumb: true },
    ]
  ),
];
