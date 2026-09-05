// THE QUIET ABOVE — 522x64 tiles, six phases left to right.
// gym → gate → campus → pad/station/EVA (high rows) → moon → field.
// '#' solid  '.' air  '~' water  '|' climbable  'H' ladder  'L' loose
// '^' hazard  '=' oneway  '/' '\' slopes  'S' stair  'G' gate
const W = 522;
const H = 64;
export const GROUND = 36;

const blank = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const fill = (rows, r0, r1, c0, c1, ch) => {
  for (let r = r0; r <= r1; r++) put(rows, r, c0, ch.repeat(c1 - c0 + 1));
};
const ramp = (rows, floorRow, c, len) => {
  put(rows, floorRow - 1, c, '/');
  fill(rows, floorRow - 1, floorRow - 1, c + 1, c + len, '#');
  put(rows, floorRow - 1, c + len + 1, '\\');
};
const stairs = (rows, floorRow, c, steps, dir = 'r') => {
  for (let i = 0; i < steps; i++) {
    const col = dir === 'r' ? c + i : c - i;
    fill(rows, floorRow - 1 - i, floorRow - 1 - i, col, col, 'S');
  }
};

export function buildAstroMap() {
  const rows = blank();
  // the walkable crust: 4 rows of ground, void below (pits are carved through it)
  fill(rows, GROUND, GROUND + 3, 0, W - 1, '#');

  // ---- P0 arrival (0-23): the siding kerb and the gym step
  ramp(rows, GROUND, 14, 3);

  // ---- P1 THE BODY (24-129)
  // the Track: a mezzanine loop with stairs at both ends
  stairs(rows, GROUND, 31, 4, 'r');
  fill(rows, 31, 31, 35, 55, '#'); // mezzanine deck
  stairs(rows, GROUND, 58, 4, 'l');
  fill(rows, 27, 27, 40, 44, '=');
  fill(rows, 27, 27, 48, 52, '='); // high line over the track (hard route)
  // the Pool: a basin carved through the crust; deep end to the right
  fill(rows, GROUND, 43, 63, 84, '.');
  fill(rows, 36, 41, 63, 84, '~');
  fill(rows, 42, 43, 63, 84, '#'); // pool floor
  fill(rows, 36, 39, 74, 75, '#'); // the mid-wall hangs from the surface: swim UNDER it
  fill(rows, 40, 43, 79, 80, '.'); // the deep-end shaft (lights off, the locker)
  fill(rows, 44, 49, 78, 84, '~');
  fill(rows, 40, 43, 79, 80, '~');
  fill(rows, 50, 50, 77, 85, '#');
  fill(rows, 44, 49, 77, 77, '#');
  fill(rows, 44, 49, 85, 85, '#');
  // the Wall: a climbing wall with crumbling holds, bell platform on top
  fill(rows, 22, 35, 92, 92, '|');
  // crumbling holds: staggered one-tile ledges, three rows up, two across
  put(rows, 32, 89, 'L');
  put(rows, 29, 91, 'L');
  put(rows, 26, 89, 'L');
  put(rows, 23, 91, 'L');
  fill(rows, 20, 20, 86, 89, '#'); // bell ledge, up and left of the top hold
  // the Ring: a raised canvas with ropes
  fill(rows, 32, 32, 98, 108, '#');
  stairs(rows, GROUND, 96, 3, 'r');
  stairs(rows, GROUND, 110, 3, 'l');
  // study + doctor's office: flat, quiet
  ramp(rows, GROUND, 113, 2);

  // ---- P2 THE GATE (130-152): a corridor of chairs
  // (flat on purpose — the only level ground in the dream)

  // ---- P3 THE GROUND (153-240)
  ramp(rows, GROUND, 158, 4); // centrifuge dome plinth
  // neutral-buoyancy tank: deep water with the station mock-up inside
  fill(rows, GROUND, 43, 174, 194, '.');
  fill(rows, 32, 35, 174, 194, '~');
  fill(rows, 36, 43, 174, 194, '~');
  fill(rows, 44, 44, 173, 195, '#');
  fill(rows, 32, 43, 173, 173, '#');
  fill(rows, 32, 43, 195, 195, '#');
  fill(rows, 31, 31, 168, 171, '#'); // the dive deck
  fill(rows, 32, 32, 172, 173, '#'); // waterline step: the way back OUT
  fill(rows, 32, 32, 195, 200, '#'); // right deck at the waterline: climbable exit
  // mock-up module walls inside the tank
  fill(rows, 38, 43, 180, 180, '#');
  fill(rows, 36, 38, 186, 186, '#');
  fill(rows, 41, 43, 189, 189, '#');
  // simulator building step
  ramp(rows, GROUND, 202, 3);
  // survival forest: uneven dark ground
  ramp(rows, GROUND, 215, 2);
  fill(rows, 34, 34, 222, 224, '#');
  ramp(rows, GROUND, 228, 3);
  fill(rows, 34, 34, 233, 235, '#');

  // ---- P4 THE SKY (241-331)
  // the tower: a ladder up the gantry to the hatch
  fill(rows, 18, 35, 246, 247, '#');
  fill(rows, 16, 35, 250, 250, 'H');
  fill(rows, 17, 17, 246, 249, '#'); // the white room floor; the ladder passes it
  // a full wall so nobody walks from the pad into "orbit"
  fill(rows, 8, GROUND + 3, 255, 256, '#');
  // THE STATION (zero-g): modules are boxes, floors are just walls
  fill(rows, 17, 17, 258, 300, '#'); // ceiling
  fill(rows, 29, 29, 258, 300, '#'); // deck
  fill(rows, 18, 28, 258, 258, '#');
  fill(rows, 18, 22, 272, 272, '#'); // hatch A->B: bottom half open
  fill(rows, 26, 28, 272, 272, '#');
  fill(rows, 18, 22, 286, 286, '#'); // hatch B->C
  fill(rows, 26, 28, 286, 286, '#');
  fill(rows, 18, 22, 300, 300, '#'); // airlock outer wall, hatch at 23-25
  fill(rows, 26, 28, 300, 300, '#');
  // EVA: the hull line and the array truss, nothing else
  fill(rows, 29, 29, 301, 330, '#');
  fill(rows, 25, 25, 320, 330, '#'); // the array truss overhead
  fill(rows, 8, GROUND + 3, 332, 333, '#');

  // ---- P5 THE MOON (334-470)
  // regolith field: low mounds
  ramp(rows, GROUND, 344, 3);
  ramp(rows, GROUND, 354, 4);
  // boulder ridge
  stairs(rows, GROUND, 366, 3, 'r');
  fill(rows, 33, 33, 369, 374, '#');
  stairs(rows, GROUND, 379, 3, 'l');
  // crevasse gauntlet: gaps of 6, 8, 10 — carved to the void, spikes at the bottom
  fill(rows, GROUND, GROUND + 3, 390, 395, '.');
  fill(rows, GROUND, GROUND + 3, 401, 408, '.');
  fill(rows, GROUND, GROUND + 3, 414, 423, '.');
  fill(rows, 47, 47, 389, 424, '#');
  // each crevasse is a sealed shaft: fill under the standing spans so a short
  // jump drops you onto the spikes, never under the world
  fill(rows, 40, 46, 385, 389, '#');
  fill(rows, 40, 46, 396, 400, '#');
  fill(rows, 40, 46, 409, 413, '#');
  fill(rows, 40, 46, 424, 428, '#');
  fill(rows, 46, 46, 390, 395, '^');
  fill(rows, 46, 46, 401, 408, '^');
  fill(rows, 46, 46, 414, 423, '^');
  // crumbling rim + the probe ledge
  fill(rows, 35, 35, 425, 427, 'L');
  fill(rows, 34, 34, 428, 431, '#');
  // THE CRATER: a shaft of black terraces down to Priya
  fill(rows, GROUND, GROUND + 3, 436, 460, '.');
  fill(rows, 40, 40, 437, 441, '#');
  fill(rows, 44, 44, 446, 451, '#');
  fill(rows, 48, 48, 438, 443, '#');
  fill(rows, 52, 52, 448, 454, '#');
  fill(rows, 56, 56, 436, 444, '#');
  fill(rows, 60, 60, 436, 460, '#'); // crater floor
  fill(rows, 37, 59, 435, 435, '#');
  fill(rows, 37, 59, 461, 461, '#');
  fill(rows, 8, GROUND + 3, 470, 471, '#');

  // ---- P6 THE RETURN (472-521): a green field, one long walk
  ramp(rows, GROUND, 490, 3);

  return rows;
}

// ---------------------------------------------------------------------------
// The clues. Every Gate answer is on a wall in Phase 1 or in Priya's notebook.
// ---------------------------------------------------------------------------
export const CLUES = {
  vehicle: 'MERIDIAN LV-3',
  stages: '3',
  year: '1974',
  crew: 'OKONKWO · VANCE · LIU',
  record: '31 and 2',
  depress: 'mask on, then seal the hatch',
  modules: ['HAB', 'NODE', 'LAB', 'AIRLOCK'],
};

// P1 "Systems" — ten flashcards in the study. [prompt, right, wrong x3]
export const FLASHCARDS = [
  ['The module you sleep in', 'HAB', 'NODE', 'LAB', 'AIRLOCK'],
  ['The module that joins the others', 'NODE', 'HAB', 'LAB', 'AIRLOCK'],
  ['Where the science lives', 'LAB', 'HAB', 'NODE', 'AIRLOCK'],
  ['The door to outside', 'AIRLOCK', 'NODE', 'HAB', 'LAB'],
  ['The launch vehicle', 'MERIDIAN LV-3', 'MERIDIAN IV', 'LV-2 HEAVY', 'KESTREL'],
  ['Stages on the stack', '3', '2', '4', '5'],
  ['The program was founded in', '1974', '1969', '1981', '1961'],
  ['First Meridian crew', 'OKONKWO · VANCE · LIU', 'VANCE · OKONKWO · RAY', 'LIU · HALVORSEN · VANCE', 'OSEI · LIU · ADAEZE'],
  ['Cabin depress: first action', 'mask on, then seal the hatch', 'seal the hatch, then mask', 'call the ground first', 'check the gauge twice'],
  ['Speed is velocity plus', 'a direction', 'a distance', 'an altitude', 'thrust'],
];

// P2 "Selection" — seven questions. `src` says where the answer was.
export const BOARD_QUESTIONS = [
  { q: 'Name the vehicle you would ride.', a: 'MERIDIAN LV-3', o: ['MERIDIAN IV', 'KESTREL', 'LV-2 HEAVY'], src: 'the poster over the track' },
  { q: 'How many stages does it burn?', a: '3', o: ['2', '4', '5'], src: 'the poster over the track' },
  { q: 'The year this program was founded.', a: '1974', o: ['1969', '1981', '1961'], src: 'the lane numbers in the pool' },
  { q: 'Name the first Meridian crew.', a: 'OKONKWO · VANCE · LIU', o: ['VANCE · OKONKWO · RAY', 'LIU · HALVORSEN · VANCE', 'OSEI · LIU · ADAEZE'], src: 'the plaque under the bell' },
  { q: "Dr. Halvorsen's old sparring partner runs your gym. Her record?", a: '31 and 2', o: ['28 and 0', '31 and 5', '40 and 2'], src: "Adaeze's fight poster by the ring" },
  { q: 'The cabin loses pressure. First action.', a: 'mask on, then seal the hatch', o: ['seal the hatch, then mask', 'call the ground first', 'check the gauge twice'], src: "Priya's notebook, page four" },
  { q: 'One seat left. You may give it away. To whom?', a: 'Priya Raman', o: ['Yourself. Obviously.', 'Whoever tests best', 'Nobody gives away a seat'], src: 'you know this one' },
];

// Priya's notebook — five pages, sixty seconds of honest reading.
export const NOTEBOOK = [
  'PAGE 1 — the stack.\nMeridian LV-3. Three stages.\nFirst stage lights, you are\nalready committed.\n(she has drawn a small rocket\nwith a face on it)',
  'PAGE 2 — the station.\nHAB you sleep. NODE joins.\nLAB works. AIRLOCK leaves.\nLearn them in the dark.\n(the modules are labelled twice,\nthe second time neater)',
  'PAGE 3 — history.\nFounded 1974. First crew:\nOkonkwo, Vance, Liu.\nLiu never flew again and\nnever said why.',
  'PAGE 4 — emergencies.\nDepress: MASK FIRST, then seal.\nYou have more time than you\nthink and less than you want.\nBolt order on the truss:\nread it off the code plate,\nnever from memory.',
  'PAGE 5 — (the last page)\nthings that are true at altitude:\nyour hands are slower.\nyour heart is louder.\neverybody you have ever met\nis in the window.\n— P.',
];

// ---------------------------------------------------------------------------
export const A_DIALOGUES = {
  d0: [
    { name: 'Coach Adaeze', text: "Selection's in nine weeks, champion. Everybody in here's trying.\nSign the sheet. Don't touch the good bag." },
    { name: 'Coach Adaeze', text: 'Board wants three pips in everything — lungs, grip, legs, nerve.\nThe rooms are open. The pool is cold. Go be somebody.' },
  ],
  d1: [
    { name: 'Dr. Halvorsen', text: 'Numbers are numbers. Your numbers are your numbers.' },
    { name: 'Dr. Halvorsen', text: "Board's Thursday. Don't argue with the board." },
  ],
  d_rejected: [
    { name: 'The Board', text: 'Thank you, candidate. Not this intake.' },
    { name: 'The letter', text: '"…we encourage you to reapply\nin twelve months."' },
  ],
  d2: [
    { name: 'Priya', text: "I got it. I'm sorry." },
    { name: 'Jo', text: "Don't be. Who else." },
    { name: 'Priya', text: 'You. Next year.\nRead the notebook again — I left it.' },
  ],
  d_selected: [
    { name: 'The Board', text: 'Candidate Jo. Welcome to the Meridian Orbital Program.' },
    { name: 'Dr. Halvorsen', text: '…Your numbers were your numbers.\nGood numbers, this time.' },
  ],
  d3: [
    { name: 'Priya', text: 'You carried me for a kilometre.' },
    { name: 'Jo', text: 'You carried me for a year.' },
    { name: 'Flight Director Osei', text: "Copy. You're on the manifest." },
  ],
  d4: [
    { name: 'Priya', text: 'Did you get it?' },
    { name: 'Jo', text: 'Got what?' },
    { name: 'Priya', text: 'The core.' },
    { name: 'Jo', text: '…Yeah.' },
    { name: 'Priya', text: 'Look up.' },
  ],
  d_osei_dock: [{ name: 'Osei', text: 'Copy.' }],
};

// Small moments (postcard-visible places).
export const A_MOMENTS = {
  m1: { sub: 'the empty hall, before six', text: '"She\'d stopped competing thirty years ago."' },
  m2: { sub: 'the water tower', text: '"They didn\'t talk about the sky at all."' },
  m3: { sub: 'the cupola', text: '"Everyone he\'d ever met was in the window."' },
};
