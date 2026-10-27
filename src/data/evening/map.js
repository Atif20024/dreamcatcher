// THE LONG EVENING — the town and the road as one 788x42 tile world.
//
//  rows  0-10  sky over the ridge          row 16  the hilltop
//  row  22     rooftops                    row 27  the station deck / viaduct
//  row  32     the street (GROUND)         rows 35-38 the sunken canal
//
// cols   0- 51  west meadow  (an exact copy of the east meadow: the wrap)
//       52-405  the town, eleven places west to east (PLACES)
//      406-457  east meadow under the old viaduct (the other side of the wrap)
//      458-787  the road, screens 12-22 (ROAD)
//
// The town wraps: walking west out of the west meadow puts Jo at the same
// spot in the east meadow and vice versa. Both meadows are the same tiles,
// so the one-frame jump (EveningScene.wrap) cannot be seen. The road leaves
// from the station deck, over the viaduct, once the hedge has a gap in it.
export const EV = {
  W: 788,
  H: 42,
  GROUND: 32,
  DECK: 27,
  E0: 406, // east meadow start; the wrap offset in tiles
  BUF: 52, // meadow width
  WRAP_WEST: 20, // walking west past this col (west meadow) wraps east
  WRAP_EAST: 30, // walking east past E0+this (east meadow) wraps west
  R0: 458, // the road
  HEDGE: [402, 403],
  STATION_LADDER: 386,
  ROOF_LADDER: 283,
};

// the eleven places, and the eleven screens of the road
export const PLACES = [
  { id: 'arch', name: 'the arch', c0: 52, c1: 81 },
  { id: 'orchard', name: 'the orchard', c0: 82, c1: 113 },
  { id: 'laundry', name: 'the washing', c0: 114, c1: 145 },
  { id: 'square', name: 'the square', c0: 146, c1: 183 },
  { id: 'canal', name: 'the canal', c0: 184, c1: 219 },
  { id: 'steep', name: 'the steep street', c0: 220, c1: 247 },
  { id: 'rooftops', name: 'the roofs', c0: 248, c1: 282 },
  { id: 'school', name: 'school', c0: 283, c1: 311 },
  { id: 'allotments', name: 'the gardens', c0: 312, c1: 341 },
  { id: 'hill', name: 'the hill', c0: 342, c1: 375 },
  { id: 'station', name: 'the station', c0: 376, c1: 405 },
];
export const ROAD = [
  { id: 'hedge', name: 'the gap in the hedge', c0: 458, c1: 487 },
  { id: 'orchard_road', name: 'the orchard road', c0: 488, c1: 517 },
  { id: 'fields', name: 'the fields', c0: 518, c1: 547 },
  { id: 'lake', name: 'the lake', c0: 548, c1: 577 },
  { id: 'first_stars', name: 'the first stars', c0: 578, c1: 607 },
  { id: 'foothills', name: 'the foothills', c0: 608, c1: 637 },
  { id: 'pines', name: 'the pine road', c0: 638, c1: 667 },
  { id: 'stream', name: 'the frozen stream', c0: 668, c1: 697 },
  { id: 'switchbacks', name: 'the switchbacks', c0: 698, c1: 727 },
  { id: 'treeline', name: 'the treeline', c0: 728, c1: 757 },
  { id: 'ridge', name: 'the ridge', c0: 758, c1: 787 },
];

export function placeAt(tx) {
  if (tx < 52) return { id: 'meadow', name: 'the meadow', c0: 0, c1: 51 };
  if (tx >= EV.E0 && tx < EV.R0) return { id: 'meadow', name: 'the meadow', c0: EV.E0, c1: EV.R0 - 1 };
  return PLACES.find((p) => tx >= p.c0 && tx <= p.c1) || ROAD.find((p) => tx >= p.c0 && tx <= p.c1) || ROAD[ROAD.length - 1];
}

export function buildEveningMap() {
  const { W, H } = EV;
  const rows = Array.from({ length: H }, () => new Array(W).fill('.'));
  const put = (r, c, ch) => {
    if (r >= 0 && r < H && c >= 0 && c < W) rows[r][c] = ch;
  };
  const fill = (r0, r1, c0, c1, ch) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) put(r, c, ch);
  };
  // solid from `top` to the bottom of the world
  const ground = (c0, c1, top) => fill(top, H - 1, c0, c1, '#');
  // a ramp rising to the right: the surface at `base` becomes base-n
  const rampUp = (c, n, base) => {
    for (let i = 0; i < n; i++) {
      put(base - 1 - i, c + i, '/');
      fill(base - i, H - 1, c + i, c + i, '#');
    }
  };
  // a ramp falling to the right: the surface at `top` becomes top+n
  const rampDown = (c, n, top) => {
    for (let i = 0; i < n; i++) {
      put(top + i, c + i, '\\');
      fill(top + i + 1, H - 1, c + i, c + i, '#');
    }
  };

  // --- the arch: where the dark door lets out, a little hump with a bench
  ground(52, 65, 32);
  rampUp(66, 1, 32);
  ground(67, 73, 31);
  rampDown(74, 1, 31);
  ground(75, 81, 32);

  // --- the orchard slope: up onto a knoll of long grass, three trees ------
  ground(82, 83, 32);
  rampUp(84, 4, 32);
  ground(88, 101, 28);
  rampDown(102, 4, 28);
  ground(106, 113, 32);

  // --- the laundry lines: a raised courtyard of warm stone ----------------
  ground(114, 118, 32);
  rampUp(119, 1, 32);
  ground(120, 134, 31);
  rampDown(135, 1, 31);
  ground(136, 145, 32);

  // --- the square: flat and wide, made for standing about in -------------
  ground(146, 187, 32);

  // --- the canal: steps down to a sandy towpath (the shallows: the sea
  // reaches this far), a plank footbridge over the water, steps back up
  rampDown(188, 3, 32);
  ground(191, 195, 35);
  ground(196, 207, 38);
  fill(36, 37, 196, 207, '~');
  fill(35, 35, 196, 207, '=');
  ground(208, 211, 35);
  rampUp(212, 3, 35);
  ground(215, 221, 32);

  // --- the steep street: two flights to the roofs, a landing between ------
  rampUp(222, 5, 32);
  ground(227, 232, 27);
  rampUp(233, 5, 27);
  ground(238, 259, 22);

  // --- the rooftops: a higher run for the kite, a chimney for the goat ----
  rampUp(260, 2, 22);
  ground(262, 270, 20);
  rampDown(271, 2, 20);
  ground(273, 283, 22);
  fill(19, 21, 279, 279, '#');
  // the fire ladder down to the school yard, under the last roof tile (press
  // down on the tile to climb; step off the roof instead and Jo rolls)
  fill(23, 31, EV.ROOF_LADDER, EV.ROOF_LADDER, 'H');
  ground(283, 283, 32);

  // --- the school yard ------------------------------------------------------
  ground(284, 311, 32);

  // --- the allotments: up one bank to the plots ---------------------------
  rampUp(312, 2, 32);
  ground(314, 341, 30);

  // --- the hill: two climbs to the top, a long walk down to the station ---
  rampUp(342, 8, 30);
  ground(350, 351, 22);
  rampUp(352, 6, 22);
  ground(358, 364, 16);
  rampDown(365, 11, 16);

  // --- the station that isn't: a raised platform with no rails. It runs on
  // east as the old viaduct, over the meadow. Under it, the grass.
  fill(27, 28, 376, EV.R0 - 1, '#');
  ground(376, EV.R0 - 1, 32);
  fill(28, 31, EV.STATION_LADDER, EV.STATION_LADDER, 'H');
  // the hedge at the platform's end: taller than any jump, until it isn't
  fill(21, 26, EV.HEDGE[0], EV.HEDGE[1], 'B');

  // --- the road -------------------------------------------------------------
  ground(458, 489, 27); // 12 the gap in the hedge
  rampDown(490, 2, 27); // 13 the orchard road
  ground(492, 547, 29); //    ... and 14 the fields
  fill(28, 28, 499, 499, '#'); // a step up onto the wall
  fill(26, 28, 500, 507, '#'); // the wall to walk on top of
  ground(548, 551, 29); // 15 the lake
  rampDown(552, 2, 29);
  ground(554, 557, 31);
  ground(558, 569, 35);
  fill(32, 34, 558, 569, '~');
  fill(31, 31, 558, 569, '=');
  ground(570, 573, 31);
  rampUp(574, 2, 31);
  ground(576, 586, 29); // 16 the first stars
  rampUp(587, 1, 29);
  fill(28, 28, 588, 595, '#'); // the stone bridge
  fill(30, 31, 588, 595, '~');
  ground(588, 595, 32);
  rampDown(596, 1, 28);
  ground(597, 609, 29); // 17 the foothills
  rampUp(610, 3, 29);
  ground(613, 645, 26); // 18 the pine road
  rampUp(646, 3, 26);
  ground(649, 675, 23); // 19 the frozen stream
  fill(23, 23, 676, 686, '*');
  ground(676, 686, 24);
  ground(687, 699, 23); // 20 the switchbacks
  rampUp(700, 6, 23);
  ground(706, 709, 17);
  rampUp(710, 5, 17);
  ground(715, 739, 12); // 21 the treeline
  rampUp(740, 1, 12);
  ground(741, 745, 11);
  rampDown(746, 1, 11);
  ground(747, 759, 12); // 22 the ridge
  rampUp(760, 1, 12);
  ground(761, 787, 11);
  fill(5, 10, 785, 787, '#'); // the rock at the end of everything

  // --- the west meadow is the east meadow, tile for tile -------------------
  for (let r = 0; r < H; r++) for (let c = 0; c < EV.BUF; c++) rows[r][c] = rows[r][EV.E0 + c];

  return rows.map((r) => r.join(''));
}
