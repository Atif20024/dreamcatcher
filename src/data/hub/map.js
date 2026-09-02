// Crossroads Station: 150x34 tiles, five screens wide, two tall.
//
//  rows  0- 7  roof air; row 8 = the train-shed roof walkway
//  rows  9-25  the hall (17 rows = two screens tall)
//  rows 26-27  hall floor / platform concourse
//  rows 28-32  undercroft
//  row  33     bedrock
//
// cols   0- 29 Front Steps   30- 79 Great Hall   80-109 Platforms 1-4
//      110-139 Platforms 5-8  140-149 The Service Gate
const W = 150;
const H = 34;

const blank = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const fill = (rows, r0, r1, c0, c1, ch) => {
  for (let r = r0; r <= r1; r++) put(rows, r, c0, ch.repeat(c1 - c0 + 1));
};
const stairs = (rows, floorRow, c, steps, dir = 'r') => {
  for (let i = 0; i < steps; i++) {
    const col = dir === 'r' ? c + i : c - i;
    fill(rows, floorRow - 1 - i, floorRow - 1 - i, col, col, 'S');
  }
};

export const HUB_ROWS = { ROOF: 8, MEZZ: 18, FLOOR: 26, UNDER: 33 };

export function buildHubMap() {
  const rows = blank();

  // --- bedrock, and the earth under the steps and past the gate ---------
  fill(rows, 33, 33, 0, W - 1, '#');
  fill(rows, 31, 32, 0, 29, '#');
  fill(rows, 28, 32, 148, 149, '#');

  // --- front steps: street at row 30, four stone steps up to the hall ----
  fill(rows, 30, 30, 0, 13, '#');
  stairs(rows, 30, 10, 4, 'r'); // (29,10) (28,11) (27,12) (26,13)
  fill(rows, 29, 29, 11, 13, '#'); // solid under each step
  fill(rows, 28, 28, 12, 13, '#');
  fill(rows, 27, 29, 14, 29, '#'); // the hall's front foundation
  // hall floor / platform concourse. The way down to the undercroft is a
  // ladder under the floor tile at col 77: press DOWN on it to climb below,
  // so the concourse never drops anyone by surprise.
  fill(rows, 26, 27, 14, 147, '#');
  fill(rows, 27, 32, 77, 77, 'H');

  // --- great hall verticals ---------------------------------------------
  // iron staircase up to the mezzanine café: one-way treads, so the
  // concourse underneath stays clear -- you jump onto the first step
  for (let i = 0; i < 7; i++) fill(rows, 25 - i, 25 - i, 30 + i, 30 + i, '=');
  fill(rows, 18, 18, 36, 58, '='); // landing + mezzanine
  // a ladder up a skylight rib, through the hatch, onto the roof
  fill(rows, 8, 25, 62, 62, 'H');
  // the roof walkway (train-shed roof), open at the hatch
  fill(rows, 8, 8, 24, 61, '#');
  fill(rows, 8, 8, 63, 145, '#');
  // clock tower above the steps, a bridge from it onto the walkway, and a
  // brass canopy over the doors that catches anyone who steps off it
  fill(rows, 4, 8, 12, 17, '#');
  fill(rows, 8, 8, 18, 23, '=');
  fill(rows, 17, 17, 17, 25, '=');
  // water tower base on the roof
  fill(rows, 6, 7, 120, 125, '#');

  // (bay dividers are drawn by the scene, not built as tiles: nothing on
  // the concourse should stop a walk)

  // a two-step luggage ramp at the end of platform 8, and a step up to the
  // turnstile, so neither screen is a dead-flat corridor
  stairs(rows, 26, 136, 2, 'r'); // (25,136) (24,137)
  fill(rows, 24, 24, 138, 138, '#');
  stairs(rows, 26, 141, 1, 'r'); // (25,141)
  fill(rows, 25, 25, 142, 144, '#');

  // --- the service gate ---------------------------------------------------
  fill(rows, 12, 25, 146, 147, 'G');
  fill(rows, 9, 11, 146, 147, '#'); // lintel

  return rows;
}
