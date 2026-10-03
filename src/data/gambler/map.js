// THE LAST HAND — 520x40 tiles, one char per 32px tile. Seven hands, left to
// right. '#' solid  '=' one-way  'S' stair  '/' '\' ramps  'H' ladder
// '|' climbable (the slot reels)  '^' bare wire  'I' a wet ramp.
// Gates, tables, cards, reels, wheels and dice are objects (data/gambler/rooms.js).
export const W = 520;
export const H = 40;
export const FLOOR = 34; // the street, the back rooms, the car park's ground deck
export const MEZZ = 26; // the casino floor proper, eight tiles up
export const LOUNGE = 18; // the velvet room, eight more

const blank = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const fill = (rows, r0, r1, c0, c1, ch) => {
  for (let r = r0; r <= r1; r++) put(rows, r, c0, ch.repeat(c1 - c0 + 1));
};
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
// a staircase RISING to the right from floorRow at c: step i at row floorRow-1-i
const stairsUp = (rows, floorRow, c, steps) => {
  for (let i = 0; i < steps; i++) {
    put(rows, floorRow - 1 - i, c + i, 'S');
    if (floorRow - i <= floorRow - 1) fill(rows, floorRow - i, floorRow - 1, c + i, c + i, '#');
  }
};
// a staircase DESCENDING to the right from (c, r)
const stairsDown = (rows, c, r, steps) => {
  for (let i = 0; i < steps; i++) {
    put(rows, r + i, c + i, 'S');
    if (r + i + 1 <= FLOOR - 1) fill(rows, r + i + 1, FLOOR - 1, c + i, c + i, '#');
  }
};

// where things are, in world columns — rooms.js reads these too
export const COLS = {
  // the pit: twelve face-down cards over the roulette floor
  pitCards: { x0: 88, x1: 121, step: 3, y: MEZZ - 2 },
  terraceCards: { x0: 181, x1: 193, step: 3, y: LOUNGE - 1 },
  corridorCards: { x0: 261, x1: 279, step: 3, y: 31 },
  // each reel a tile-and-a-bit taller than the last: a staircase you spin
  reels: [
    { x: 63, top: 23 },
    { x: 68, top: 20 },
    { x: 73, top: 17 },
  ],
  diceBridge: { x0: 397, x1: 407, y: MEZZ }, // the tiles the roll fills; 408 is the ladder's head
  liftShaft: { x0: 225, x1: 227, top: LOUNGE, bottom: FLOOR },
};

export function buildGamblerMap() {
  const rows = blank();
  fill(rows, FLOOR, H - 1, 0, W - 1, '#'); // the ground, everywhere

  // ---- HAND 0 — arrival (0-39): a kerb under the sign ---------------------
  ramp(rows, FLOOR, 6, 2, 'r');

  // ---- HAND 1 — the floor (40-159) ----------------------------------------
  stairsUp(rows, FLOOR, 41, 8); // eight brass steps up to the casino floor
  fill(rows, MEZZ, FLOOR - 1, 49, 85, '#'); // the mezzanine's mass
  // the slots canyon: three reels, climbable, each taller than the last
  for (const r of COLS.reels) fill(rows, r.top, MEZZ - 1, r.x, r.x, '|');
  fill(rows, 17, 17, 75, 85, '#'); // the ledge off reel three (a one-tile gap first: the way down)
  fill(rows, 13, 13, 74, 85, '#'); // its ceiling: the service corridor is a box
  fill(rows, 14, 16, 85, 85, '#'); // closed at the far end
  // the pit (86-123): nothing under the cards but the roulette floor
  fill(rows, 27, FLOOR - 1, 123, 123, 'H'); // the long climb back up
  put(rows, MEZZ, 123, '='); // the ladder's head: a lip to stand on
  fill(rows, MEZZ, FLOOR - 1, 124, 159, '#'); // the floor resumes: the cage, Lou

  // ---- HAND 2 — the lounge (160-229) --------------------------------------
  fill(rows, MEZZ, FLOOR - 1, 160, 229, '#'); // the plinth the lounge sits on
  stairsUp(rows, MEZZ, 160, 8); // the curved stair
  fill(rows, LOUNGE, MEZZ - 1, 168, 178, '#'); // Favour's landing
  // the cigar terrace (179-195) drops to the plinth; the cards cross it
  fill(rows, 19, MEZZ - 1, 195, 195, 'H'); // back up from the terrace floor
  put(rows, LOUNGE, 195, '=');
  fill(rows, LOUNGE, MEZZ - 1, 196, 224, '#'); // piano bar, billiards
  fill(rows, LOUNGE, MEZZ - 1, 228, 229, '#'); // the wall past the lift
  // the private lift's shaft, and the corridor it opens on at the bottom
  fill(rows, LOUNGE, FLOOR - 1, COLS.liftShaft.x0, COLS.liftShaft.x1, '.');
  fill(rows, 29, FLOOR - 1, 225, 229, '.');
  put(rows, 15, 170, '====='); // the picture rail over Favour's landing
  put(rows, 14, 206, '===='); // a shelf of bottles over the piano

  // ---- HAND 3 — the back rooms (230-329) ----------------------------------
  fill(rows, 22, 22, 230, 329, '#'); // a low concrete ceiling, bare bulbs under it
  ramp(rows, FLOOR, 234, 1, 'r'); // a step down into the corridor
  put(rows, FLOOR - 1, 262, '^'.repeat(17)); // bare wire along the corridor floor (262-278)

  // ---- HAND 4 — the car park (330-439): dawn --------------------------------
  // the up ramp: a 45° slope with the deck's mass under it
  for (let i = 0; i < 8; i++) {
    put(rows, FLOOR - 1 - i, 352 + i, '/');
    if (FLOOR - i <= FLOOR - 1) fill(rows, FLOOR - i, FLOOR - 1, 352 + i, 352 + i, '#');
  }
  fill(rows, MEZZ, MEZZ, 360, 396, '#'); // deck two
  put(rows, MEZZ, 372, 'IIIIII'); // the wet patch (372-377)
  fill(rows, MEZZ, MEZZ, 409, 418, '#'); // the far side of the dice gap: the cage
  fill(rows, MEZZ + 1, FLOOR - 1, 408, 408, 'H'); // the long way up if the roll was bad
  put(rows, MEZZ, 408, '=');
  stairsDown(rows, 419, MEZZ + 1, 7); // down to the bus stop

  // ---- HAND 5 — the last hand (440-479) -----------------------------------
  ramp(rows, FLOOR, 443, 1, 'r');

  // ---- HAND 6 — lost and found (480-519) ----------------------------------
  put(rows, 30, 488, '====='); // a shelf of umbrellas
  put(rows, 27, 494, '===');

  return rows;
}
