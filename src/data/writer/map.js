// THE SECOND DRAFT — 640x40 tiles, one char per 32px tile. Seven chapters,
// left to right. '#' solid  '=' one-way  'S' stair  '/' '\' ramps  'H' ladder
// '|' climbable  '>' '<' paper webs and belts  '~' ink  '^' rollers  'I' spill
// Gates, plates and levers are objects. Everything else is an object placed by data/writer/rooms.js.
export const W = 640;
export const H = 40;
export const FLOOR = 34; // the street

const blank = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const fill = (rows, r0, r1, c0, c1, ch) => {
  for (let r = r0; r <= r1; r++) put(rows, r, c0, ch.repeat(c1 - c0 + 1));
};
// D3 anti-box: a walkable ramp up onto a one-tile step
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
// a staircase that DESCENDS to the right from (c, r): one step per column,
// solid underneath so it reads as a stair and not a floating diagonal
const stairsDown = (rows, c, r, steps) => {
  for (let i = 0; i < steps; i++) {
    put(rows, r + i, c + i, 'S');
    if (r + i + 1 <= FLOOR - 1) fill(rows, r + i + 1, FLOOR - 1, c + i, c + i, '#');
  }
};
// a staircase that RISES to the right from the floor at c: step i at row floor-1-i
const stairsUp = (rows, floorRow, c, steps) => {
  for (let i = 0; i < steps; i++) {
    put(rows, floorRow - 1 - i, c + i, 'S');
    if (floorRow - i <= floorRow - 1) fill(rows, floorRow - i, floorRow - 1, c + i, c + i, '#');
  }
};

export function buildWriterMap() {
  const rows = blank();
  // the street runs under everything
  fill(rows, FLOOR, H - 1, 0, W - 1, '#');

  // ---- CHAPTER 0 — arrival (0-29): a kerb, the fire escape ----------------
  ramp(rows, FLOOR, 8, 3, 'r');
  fill(rows, 18, 33, 28, 28, 'H'); // the fire escape

  // ---- CHAPTER 1 — the attic (29-58) and the copy shop (60-119) ----------
  fill(rows, 21, 21, 29, 58, '#'); // attic floor
  fill(rows, 22, 33, 30, 46, '#'); // the house
  fill(rows, 14, 14, 29, 59, '#'); // roof
  fill(rows, 15, 17, 29, 29, '#'); // wall above the window
  fill(rows, 15, 17, 47, 47, '#'); // the beam over the stair door
  put(rows, 19, 41, '==='); // the shelf with the cereal box
  put(rows, 16, 46, '====='); // roof beam under the skylight
  stairsDown(rows, 48, 22, 12); // down to the street at col 60
  // the street: a low wall the pigeon walks (72-76)
  fill(rows, 32, 33, 72, 76, '#');
  ramp(rows, FLOOR, 66, 2, 'r');
  // the copy shop (80-118): belts on a raised run, the mezzanine
  fill(rows, 30, 30, 84, 100, '>'); // the belt runs above the machine bay
  put(rows, 33, 101, '^^'); // the fuser rollers
  put(rows, FLOOR, 103, 'IIII'); // the toner spill
  stairsUp(rows, FLOOR, 104, 5); // up to the mezzanine
  fill(rows, 28, 28, 109, 118, '#');
  fill(rows, 29, 33, 118, 118, '#');
  put(rows, 27, 112, '=='); // the desk's shelf

  // ---- CHAPTER 2 — the café (120-179) ------------------------------------
  fill(rows, 26, 26, 120, 141, '#'); // the low front room's ceiling
  put(rows, 31, 133, '=='); // shelves up to the mezzanine
  put(rows, 29, 136, '==');
  fill(rows, 27, 27, 139, 152, '='); // the mezzanine
  put(rows, 24, 143, '======'); // the picture rail
  fill(rows, 28, 29, 153, 153, '#'); // a short hanger under the mezzanine's end
  fill(rows, 32, 32, 148, 153, '#'); // the piano's low stage
  ramp(rows, FLOOR, 162, 3, 'r'); // the garden step

  // ---- CHAPTER 3 — the library (180-249) ---------------------------------
  fill(rows, 12, 12, 200, 249, '#'); // the stacks' roof
  fill(rows, 13, 33, 200, 200, '#'); // the wall between the reading room and the stacks
  fill(rows, 30, 33, 200, 200, '.'); // ...with a doorway
  ramp(rows, FLOOR, 186, 3, 'l');
  for (const [row, c0, c1] of [
    [30, 203, 218], [30, 222, 236],
    [26, 202, 213], [26, 217, 233], [26, 237, 247],
    [22, 202, 213], [22, 222, 247], // 214-221 is the glass floor (runtime)
    [18, 202, 224], [18, 228, 247],
    [14, 202, 216], [14, 220, 247],
  ]) fill(rows, row, row, c0, c1, '=');
  fill(rows, 31, 33, 209, 209, 'H'); // ladders between the floors
  fill(rows, 27, 29, 230, 230, 'H');
  fill(rows, 23, 25, 205, 205, 'H');
  fill(rows, 19, 21, 244, 244, 'H');
  fill(rows, 15, 17, 210, 210, 'H');
  stairsUp(rows, FLOOR, 244, 4); // iron stairs at the far end (the word 'lit')
  fill(rows, 13, 33, 249, 249, '#'); // the stacks' far wall
  put(rows, 13, 235, '===');
  fill(rows, 13, 33, 240, 240, '.'); // the dumbwaiter shaft is clear

  // ---- CHAPTER 4 — post office (250-289), bus (290-319), rain (320-369), rewrite (370-399)
  for (const c of [256, 264, 272, 280]) fill(rows, 31, 33, c, c + 3, '#'); // the counters
  ramp(rows, FLOOR, 283, 2, 'r');
  // the bus: pages as platforms
  for (const [row, c0, c1] of [[31, 294, 296], [28, 299, 301], [25, 304, 306], [28, 309, 311], [31, 314, 316]]) fill(rows, row, row, c0, c1, '=');
  ramp(rows, FLOOR, 291, 1, 'r');
  // the rain walk: kerbs, a puddle, the house at the end
  ramp(rows, FLOOR, 330, 3, 'r');
  ramp(rows, FLOOR, 352, 2, 'l');
  fill(rows, 18, 33, 368, 368, 'H'); // the fire escape, again
  // the attic, again (369-393), then the trapdoor and the stairs
  fill(rows, 21, 21, 369, 394, '#');
  fill(rows, 22, 33, 370, 394, '#');
  fill(rows, 14, 14, 369, 399, '#');
  fill(rows, 15, 17, 369, 369, '#');
  stairsDown(rows, 395, 22, 12); // down to the laundrette street (col 407)

  // ---- CHAPTER 5 — the editor (400-459) ----------------------------------
  stairsUp(rows, FLOOR, 419, 6); // up to the flat
  fill(rows, 28, 33, 425, 459, '#'); // the flat's floor slab
  fill(rows, 15, 15, 425, 459, '#'); // its ceiling
  fill(rows, 16, 27, 459, 459, '#'); // far wall...
  fill(rows, 16, 18, 459, 459, '.'); // ...with the door (a gate object; opens at <= 40 pages)
  fill(rows, 19, 19, 454, 458, '#'); // the door's ledge

  // ---- CHAPTER 6 — the agent (460-489), the city (490-539), the press (540-599)
  fill(rows, 20, 33, 460, 500, '#'); // the 14th floor and the first rooftop
  fill(rows, 13, 13, 460, 489, '#');
  ramp(rows, 20, 493, 2, 'r'); // a skylight housing on the first roof
  fill(rows, 22, 33, 503, 511, '#'); // rooftop B
  fill(rows, 21, 33, 516, 524, '#'); // rooftop C
  fill(rows, 22, 33, 534, 539, '#'); // the printworks roof
  fill(rows, 23, 33, 537, 537, 'H'); // ladder down into the lobby
  fill(rows, 23, 33, 538, 539, '.');
  fill(rows, 22, 22, 537, 539, '.'); // the ladder's hatch
  // the press: ladders up the left, four storeys of paper
  fill(rows, 14, 33, 555, 555, 'H');
  fill(rows, 13, 13, 554, 599, '#');
  fill(rows, 17, 17, 557, 561, '#'); // the feed platform
  fill(rows, 18, 18, 562, 590, '>'); // web 1
  put(rows, 18, 591, '^');
  fill(rows, 23, 23, 560, 588, '<'); // web 2
  put(rows, 23, 559, '^');
  fill(rows, 28, 28, 562, 590, '>'); // web 3
  put(rows, 28, 591, '^');
  put(rows, 27, 580, '.'); // the folder sits here (runtime)
  fill(rows, FLOOR, FLOOR, 560, 585, '<'); // the delivery belt into the tray
  put(rows, 33, 586, '~~~~'); // the ink trough
  fill(rows, 32, 33, 590, 590, '#'); // a step past the trough
  fill(rows, 14, 33, 599, 599, '#');
  fill(rows, 29, 33, 599, 599, '.');

  // ---- CHAPTER 7 — the bookshop (600-639) --------------------------------
  ramp(rows, FLOOR, 602, 2, 'r');
  fill(rows, 30, 33, 630, 630, '#'); // the shelf the book stands on
  put(rows, 27, 629, '===');

  return rows;
}
