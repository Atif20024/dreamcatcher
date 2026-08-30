// Five-Star Dream map: 320x40 tiles, one char per 32px tile.
// '#' counter/wall  '*' ice  'I' grease  '<>' belts  '~' chocolate  '.' air
const W = 320;
const H = 40;

const blank = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const fill = (rows, r0, r1, c0, c1, ch) => {
  for (let r = r0; r <= r1; r++) put(rows, r, c0, ch.repeat(c1 - c0 + 1));
};
// D3 anti-box: a walkable ramp up onto a one-tile step, so no section is a
// perfectly flat corridor. `dir` 'r' rises rightward, 'l' leftward.
const ramp = (rows, floorRow, c, len, dir = 'r') => {
  const stepRow = floorRow - 1;
  if (dir === 'r') {
    put(rows, stepRow, c, '/');
    fill(rows, stepRow, stepRow, c + 1, c + len, '#');
    put(rows, stepRow, c + len + 1, '\\');
  } else {
    put(rows, stepRow, c, '\\');
    fill(rows, stepRow, stepRow, c + 1, c + len, '#');
    put(rows, stepRow, c + len + 1, '/');
  }
};
const stairs = (rows, floorRow, c, steps, dir = 'r') => {
  for (let i = 0; i < steps; i++) {
    const col = dir === 'r' ? c + i : c - i;
    fill(rows, floorRow - 1 - i, floorRow - 1 - i, col, col, 'S');
  }
};

export function buildChefMap() {
  const rows = blank();
  // base ground everywhere (rooftop included)
  fill(rows, 34, 39, 0, W - 1, '#');

  // S1 — alley: dumpster block, wall-jump chimney at 39/41
  fill(rows, 32, 33, 33, 34, '#');
  fill(rows, 29, 33, 39, 39, '#');
  fill(rows, 27, 33, 41, 41, '#');
  // loading dock: belts with a low pipe ceiling (crouch clearance)
  put(rows, 31, 42, '>>>>>>');
  put(rows, 31, 50, '<<<<<<');
  fill(rows, 29, 29, 42, 55, '#');
  // dry store shelves + mezzanine over the pantry
  fill(rows, 31, 31, 62, 64, '#');
  fill(rows, 28, 28, 65, 67, '#');
  fill(rows, 30, 30, 74, 80, '#');

  // S2 — freezer: ice top layer, shelves, climb shaft
  put(rows, 34, 82, '*'.repeat(43));
  fill(rows, 31, 31, 84, 88, '#');
  fill(rows, 28, 28, 90, 94, '#');
  fill(rows, 31, 31, 96, 100, '#');
  fill(rows, 31, 31, 125, 126, '#');
  fill(rows, 28, 28, 127, 128, '#');
  fill(rows, 25, 25, 125, 126, '#');
  fill(rows, 22, 22, 127, 128, '#');
  fill(rows, 19, 19, 125, 127, '#');

  // S3 — the line: burner counters, upper shelf, grease, rush stations
  fill(rows, 31, 31, 134, 158, '#');
  fill(rows, 27, 27, 148, 158, '#');
  put(rows, 34, 159, 'I'.repeat(8));
  put(rows, 31, 168, '******');
  fill(rows, 30, 30, 178, 179, '#');
  fill(rows, 27, 27, 180, 181, '#');
  fill(rows, 24, 24, 181, 183, '#');
  // oven room
  fill(rows, 29, 29, 191, 198, '#');
  fill(rows, 29, 33, 198, 198, '#');
  fill(rows, 29, 30, 191, 191, '#');

  // S4 — dumbwaiter shaft walls + loft floor with two river gaps
  fill(rows, 8, 29, 204, 204, '#');
  fill(rows, 8, 9, 210, 210, '#');
  fill(rows, 14, 29, 210, 210, '#');
  fill(rows, 14, 14, 211, 262, '#');
  put(rows, 14, 220, '.'.repeat(7));
  put(rows, 14, 232, '.'.repeat(7));
  fill(rows, 15, 16, 220, 226, '~');
  fill(rows, 15, 16, 232, 238, '~');
  fill(rows, 7, 7, 211, 262, '#'); // loft ceiling
  // loft exit drop shaft
  fill(rows, 15, 33, 262, 262, '#');
  fill(rows, 15, 33, 259, 259, '#');
  put(rows, 14, 259, '.');
  put(rows, 14, 260, '.');
  put(rows, 14, 261, '.');

  // S5 — arena: three stations + the pass counter
  fill(rows, 31, 31, 270, 272, '#');
  fill(rows, 31, 31, 278, 280, '#');
  fill(rows, 31, 31, 286, 288, '#');
  fill(rows, 31, 31, 293, 299, '#');

  // S6 — rooftop beehive
  fill(rows, 32, 33, 314, 315, '#');

  // D3 — terrain relief: one ramp or stair per section (no flat corridors)
  ramp(rows, 34, 18, 3); // arrival: kerb up to the service door
  ramp(rows, 34, 57, 3); // dock: loading ramp
  stairs(rows, 34, 118, 3); // freezer: step down from the shelving
  ramp(rows, 34, 174, 2); // the line: raised duckboard
  ramp(rows, 14, 243, 3); // loft: sugar-work rise
  stairs(rows, 34, 292, 3); // the pass: the dais
  ramp(rows, 34, 308, 3); // rooftop: planter kerb

  // D3 — catch ledges so no drop is an unbroken void
  fill(rows, 24, 24, 243, 246, '=');
  fill(rows, 24, 24, 250, 253, '=');
  fill(rows, 28, 28, 246, 250, '=');

  return rows;
}

export const GATES = [
  { id: 'g0', col: 25, rows: [29, 33], requires: ['d0'] },
  { id: 'g1', col: 81, rows: [29, 33], requires: ['crates'] },
  { id: 'g2', col: 131, rows: [29, 33], requires: ['freezer_valve', 'has_saffron'] },
  { id: 'g3', col: 203, rows: [29, 33], requires: ['rush_done'] },
  { id: 'g4', col: 260, rows: [8, 13], requires: ['piping', 'has_gold_leaf'] },
  { id: 'g5', col: 304, rows: [29, 33], requires: ['service_survived'] },
];

export const DIALOGUES = {
  d0: [
    { name: 'MARGUERITE', portrait: 'portrait-marguerite', text: "You're the new stage? Good, we're drowning. Grab a ladle — Chef wants saffron risotto on the pass by the time the critic sits." },
    { name: 'MARGUERITE', portrait: 'portrait-marguerite', text: "Kitchen's through there. Freezer's… complicated tonight. Don't touch the red burners. And whatever you hear on the intercom — Chef never says 'good.' Don't wait for it." },
  ],
  d1: [{ name: 'INTERCOM — CHEF AURELIO', portrait: 'portrait-aurelio', text: 'SAFFRON. Where is my saffron. Freezer. NOW.' }],
  d2: [{ name: 'MARGUERITE (radio)', portrait: 'portrait-marguerite', text: "You found it? Oh thank God. Ok — through the line. It's rush. Stay low, stay quick." }],
  d3: [{ name: 'MARGUERITE', portrait: 'portrait-marguerite', text: "Saffron in. Now I need the rest of the order fired in sequence or it all dies under the lamp. Ticket rail's a mess — sort it." }],
  d4: [{ name: 'MARGUERITE', portrait: 'portrait-marguerite', text: "Pastry's upstairs. Chef needs the gold leaf for the plate. Don't look down — the shaft's older than the hotel." }],
  d5: [
    { name: 'INTERCOM — CHEF AURELIO', portrait: 'portrait-aurelio', text: 'Stage. Bring it to the pass. Yourself. I want to see your hands.' },
    { name: 'MARGUERITE (radio, quieter)', portrait: 'portrait-marguerite', text: "…he's never asked to see anyone's hands." },
  ],
  d6: [
    { name: 'CHEF AURELIO', portrait: 'portrait-aurelio', text: "The risotto. The saffron. The gold. It's… correct." },
    { name: 'JO', text: 'Is it good?' },
    { name: 'CHEF AURELIO', portrait: 'portrait-aurelio', text: '…Next.' },
    { name: '', text: 'He turns away. The lamps click off, one by one. The dining room is empty — it was always empty.' },
  ],
};

export const MOMENTS = {
  m1: { text: '"He wasn\'t crying about anything."', sub: 'A prep cook chops onions, crying, laughing at the radio.' },
  m2: { text: '"It found the only warm place, and stayed."', sub: 'A cat sleeps curled on the one warm pipe in the freezer.' },
  m3: { text: '"Nobody was listening. He didn\'t need them to."', sub: 'Bastien sprays dishes and sings, terribly, with all his heart.' },
};
