// THE YELLOW HOUSE — 700x40 tiles, one char per 32px tile. Seven canvases,
// left to right. '#' solid  '=' one-way  'S' stair  '/' '\' ramps  'H' ladder
// '|' climbable  '^' hazard  '~' water (a channel, a lock, a basin).
// Gates are objects. Everything else is placed by data/painter/rooms.js.
export const W = 700;
export const H = 40;
export const FLOOR = 34; // the ground

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
// a staircase that RISES to the right from the floor at c
const stairsUp = (rows, floorRow, c, steps) => {
  for (let i = 0; i < steps; i++) {
    put(rows, floorRow - 1 - i, c + i, 'S');
    if (floorRow - i <= floorRow - 1) fill(rows, floorRow - i, floorRow - 1, c + i, c + i, '#');
  }
};
// a staircase that DESCENDS to the right from (c, r)
const stairsDown = (rows, c, r, steps, base = FLOOR - 1) => {
  for (let i = 0; i < steps; i++) {
    put(rows, r + i, c + i, 'S');
    if (r + i + 1 <= base) fill(rows, r + i + 1, base, c + i, c + i, '#');
  }
};
// a slow hill: 22.5° halves rising to the right
const hill = (rows, floorRow, c, pairs) => {
  for (let i = 0; i < pairs; i++) {
    put(rows, floorRow - 1 - i, c + i * 2, ',');
    put(rows, floorRow - 1 - i, c + i * 2 + 1, ';');
    if (i > 0) fill(rows, floorRow - i, floorRow - 1, c + i * 2, c + i * 2 + 1, '#');
  }
};

export function buildPainterMap() {
  const rows = blank();
  fill(rows, FLOOR, H - 1, 0, W - 1, '#'); // the ground, everywhere

  // ---- CANVAS 0 — arrival (0-39): the platform, a kerb, the far wall ------
  fill(rows, 32, 33, 4, 22, '#'); // the platform
  put(rows, 33, 3, 'S');
  put(rows, 33, 23, 'S');
  fill(rows, 25, 30, 34, 35, '#'); // the far wall where the sun hits: a porch, the door-to-be under it
  put(rows, 27, 29, '===');

  // ---- CANVAS 1 — the studio (40-99): the yellow house -----------------------
  // the house: x 42-80. Ground floor rows 27-33, first floor rows 19-25, attic 13-17.
  fill(rows, 26, 26, 42, 80, '#'); // first floor slab
  fill(rows, 18, 18, 42, 68, '#'); // attic floor
  fill(rows, 12, 12, 42, 80, '#'); // the roof ridge
  fill(rows, 13, 25, 42, 42, '#'); // west wall
  fill(rows, 13, 17, 68, 68, '#'); // attic east wall
  fill(rows, 19, 25, 80, 80, '#'); // east wall upstairs (the door below is open)
  fill(rows, 27, 27, 80, 80, '.');
  fill(rows, 28, 33, 80, 80, '.');
  // the dry channel in the front room floor
  fill(rows, FLOOR, 36, 48, 52, '.');
  put(rows, 36, 48, '^^^^^');
  put(rows, 37, 48, '#####');
  // the stair: four steps, then the missing ones (a stroke bridges 64-71),
  // then the landing and a ladder through the slab
  stairsUp(rows, FLOOR, 60, 4); // steps at 60-63 up to row 30
  fill(rows, 28, 30, 72, 74, '#'); // the landing (the kitchen passes under it)
  fill(rows, 23, 27, 74, 74, 'H'); // up through the slab
  fill(rows, 26, 26, 74, 74, 'H');
  // the bedroom (44-64) sits on the slab; a ladder to the attic at 66
  fill(rows, 15, 25, 66, 66, 'H');
  fill(rows, 18, 18, 66, 66, 'H'); // the hatch
  put(rows, 22, 46, '===='); // the window ledge
  // the attic: a one-way beam under the skylight
  put(rows, 15, 54, '=====');
  // the kitchen (71-79) is under the landing, on the ground floor
  // outside: the house front, the street to the square
  ramp(rows, FLOOR, 90, 2, 'l');

  // ---- the square (100-139) ----------------------------------------------------
  fill(rows, 32, 33, 104, 110, '#'); // the café's raised terrace (shuttered by day)
  put(rows, 33, 103, 'S');
  put(rows, 33, 111, 'S');
  put(rows, 30, 112, '====='); // the shop's awning
  fill(rows, 32, 33, 127, 129, '#'); // Roulin's crate step
  put(rows, 31, 126, '/');
  put(rows, 31, 130, '\\');
  put(rows, 27, 134, '====');

  // ---- CANVAS 2 — the fields (140-259) -----------------------------------------
  ramp(rows, FLOOR, 142, 2, 'r');
  // the road with plane trees; haystacks are one-ways
  put(rows, 31, 150, '==');
  put(rows, 30, 166, '===');
  put(rows, 31, 172, '==');
  // the canal and its dry lock (180-187): a pit until it is blue
  fill(rows, FLOOR, 36, 180, 187, '.');
  put(rows, 36, 180, '^^^^^^^^');
  put(rows, 37, 180, '########');
  fill(rows, 32, 33, 176, 179, '#'); // the near bank
  put(rows, 33, 175, 'S');
  fill(rows, 32, 33, 188, 191, '#'); // the far bank
  put(rows, 33, 192, 'S');
  put(rows, 28, 183, '=='); // the lock gate's beam
  // the drawbridge (198-203): raised, it is a wall; red burns the rope
  fill(rows, 27, 33, 200, 201, '#');
  // (205: the counterweight tower's bare wall — green grows a vine ladder at runtime)
  fill(rows, 19, 19, 204, 207, '#');
  put(rows, 24, 207, '===');
  // the sunflower field (214-236): a ditch under the buds
  fill(rows, FLOOR, 35, 216, 234, '.');
  put(rows, 36, 216, '^^^^^^^^^^^^^^^^^^^');
  put(rows, 33, 215, 'S');
  fill(rows, 33, 33, 235, 235, 'S');
  // the cypress line (240-258): a rise
  hill(rows, FLOOR, 240, 4);
  fill(rows, 30, 33, 248, 258, '#');
  put(rows, 29, 251, '===');
  put(rows, 26, 255, '==');

  // ---- the hill (260-289): the vista ---------------------------------------------
  fill(rows, 30, 33, 259, 274, '#');
  hill(rows, 30, 263, 6); // 22.5° up to row 24
  fill(rows, 24, 33, 275, 284, '#'); // the hilltop with the easel
  stairsDown(rows, 285, 25, 4); // down to the cart

  // ---- Vautrin's office (290-309): one grey screen -----------------------------
  ramp(rows, FLOOR, 292, 2, 'r');
  put(rows, 30, 300, '====');

  // ---- CANVAS 3 — the café at night (310-349) ---------------------------------
  stairsUp(rows, FLOOR, 313, 3); // up to the terrace
  fill(rows, 31, 33, 316, 329, '#'); // the terrace, raised
  stairsDown(rows, 330, 31, 3);
  put(rows, 22, 332, '====='); // the balconies
  put(rows, 19, 339, '====');
  fill(rows, 17, 17, 343, 348, '#'); // the roofline with the windowsill
  fill(rows, 18, 24, 348, 348, '#');
  put(rows, 25, 345, '===');

  // ---- the rooftops (350-389) -----------------------------------------------------
  fill(rows, 24, 33, 350, 358, '#'); // roof A
  put(rows, 23, 352, '/');
  put(rows, 23, 353, '#####');
  put(rows, 23, 358, '\\');
  fill(rows, 26, 33, 362, 366, '#'); // the lower roof: a stroke is needed up to roof B
  fill(rows, 20, 33, 367, 376, '#'); // roof B with the bell
  put(rows, 19, 371, '==');
  fill(rows, 25, 33, 378, 383, '#'); // roof C
  fill(rows, 8, 33, 385, 385, '|'); // the bell tower's climbable face
  fill(rows, 7, 7, 384, 389, '#'); // its top
  fill(rows, 11, 33, 389, 389, '#'); // the tower wall, the door at the top (a gate object)
  for (const r of [27, 23, 19, 15, 11]) put(rows, r, 386, '==');

  // ---- CANVAS 4 — the quarrel (390-419): the kitchen, two easels -------------
  fill(rows, 11, 33, 390, 390, 'H'); // down from the tower door
  fill(rows, 26, 26, 392, 418, '#'); // the ceiling
  ramp(rows, FLOOR, 410, 1, 'r');

  // ---- the wind (420-499): the fields in underpainting --------------------------
  fill(rows, 32, 33, 424, 430, '#'); // the station platform
  put(rows, 33, 423, 'S');
  put(rows, 33, 431, 'S');
  // broken fences and haystacks: one-ways to hop in the wind
  put(rows, 31, 438, '==');
  put(rows, 29, 444, '===');
  put(rows, 31, 450, '==');
  fill(rows, FLOOR, 36, 454, 461, '.'); // the canal, dry again
  put(rows, 37, 454, '########');
  fill(rows, 32, 33, 452, 453, '#');
  put(rows, 31, 451, '/');
  put(rows, 29, 456, '=='); // the bank's one plank
  put(rows, 30, 460, '==');
  fill(rows, 32, 33, 462, 464, '#');
  put(rows, 31, 465, '\\');
  fill(rows, FLOOR, 35, 470, 484, '.'); // the dead sunflowers over the ditch
  put(rows, 36, 470, '^^^^^^^^^^^^^^^');
  put(rows, 33, 469, 'S');
  put(rows, 31, 472, '='); // tilted heads: single tiles
  put(rows, 29, 475, '=');
  put(rows, 30, 478, '=');
  put(rows, 28, 481, '=');
  put(rows, 33, 485, 'S');
  ramp(rows, FLOOR, 490, 2, 'r');

  // ---- the petition (500-539): the square, the house boarded -------------------
  fill(rows, 32, 33, 504, 508, '#'); // the café terrace
  put(rows, 33, 503, 'S');
  put(rows, 33, 509, 'S');
  fill(rows, 14, 33, 517, 517, 'H'); // the bare tree by the wall
  fill(rows, 19, 19, 521, 536, '#'); // the house roof
  fill(rows, 19, 19, 530, 531, '.'); // the skylight hole
  fill(rows, 20, 25, 536, 536, '#'); // east wall upstairs
  fill(rows, 26, 26, 521, 536, '#'); // the bedroom floor
  fill(rows, 23, 32, 532, 533, 'H'); // the hatch and ladder to the ground floor
  fill(rows, 20, 25, 521, 521, '#'); // west wall upstairs
  fill(rows, 27, 33, 521, 521, '#'); // the boarded front door (a gate object)
  fill(rows, 27, 29, 521, 521, '.');
  fill(rows, 27, 33, 536, 536, '#'); // the kitchen window wall
  fill(rows, 31, 32, 536, 536, '.');

  // ---- CANVAS 5 — the garden (540-599) --------------------------------------------
  fill(rows, 22, 33, 541, 541, '#'); // the garden wall, west
  fill(rows, 29, 33, 541, 541, '.'); // ...with the gate (a gate object)
  put(rows, 21, 540, '==='); // the wall top
  fill(rows, FLOOR, 35, 558, 562, '.'); // the fountain basin
  put(rows, 36, 558, '#####');
  fill(rows, 32, 33, 556, 557, '#');
  put(rows, 33, 555, 'S');
  fill(rows, 32, 33, 563, 564, '#');
  put(rows, 33, 565, 'S');
  // the corridor of arches (570-585): a colonnade on a step
  fill(rows, 32, 33, 570, 585, '#');
  put(rows, 33, 569, 'S');
  for (const c of [572, 576, 580, 584]) fill(rows, 24, 31, c, c, '#');
  fill(rows, 23, 23, 570, 585, '#'); // the arcade roof
  // the east wall with the ivy, the poppies on top
  fill(rows, 20, 33, 586, 586, 'H'); // the ivy
  fill(rows, 23, 23, 587, 598, '#');
  fill(rows, 24, 31, 592, 592, '#'); // the office's wall...
  fill(rows, 29, 31, 592, 592, '.'); // ...with its door
  put(rows, 27, 594, '===');

  // ---- CANVAS 6 — the cypress (600-629): three screens tall ----------------------
  stairsUp(rows, FLOOR, 600, 4); // up the garden wall's foot
  fill(rows, 30, 33, 604, 608, '#');
  fill(rows, 2, 33, 614, 614, 'H'); // the trunk's dark side
  // branches: one-ways alternating sides
  for (let i = 0; i < 7; i++) {
    const r = 30 - i * 4;
    if (i % 2 === 0) put(rows, r, 609, '====');
    else put(rows, r, 615, '====');
  }
  fill(rows, 4, 4, 608, 612, '#'); // the top of the tree: the platform into the sky
  fill(rows, 4, 4, 616, 622, '#');

  // ---- the night sky (630-679): stars, the moon, the currents --------------------
  // (the ground here is the village: windows with shutters)
  fill(rows, 28, 33, 630, 679, '#');
  // the star platforms are objects; a few one-ways as the first footholds
  put(rows, 6, 632, '===');
  put(rows, 10, 640, '==');
  // the moon: a solid disc's upper rim
  fill(rows, 14, 14, 652, 659, '#');
  fill(rows, 15, 17, 651, 660, '#');
  put(rows, 8, 666, '===');
  put(rows, 4, 672, '====');

  // ---- CANVAS 7 — Isak's room (680-699) -----------------------------------------
  fill(rows, 26, 26, 681, 699, '#'); // a low ceiling
  ramp(rows, FLOOR, 684, 1, 'r');

  return rows;
}
