import { buildChefMap } from '../chefMap.js';

// D2 — rooms = grid + objects. Terrain comes from the section painter (the
// grid chars are already legend-compliant: # solid, ~ liquid, <> conveyor,
// * ice and I grease as documented EXTRAS); every object is declarative.
const FULL = buildChefMap();
const slice = (x0, x1) => FULL.map((row) => row.slice(x0, x1 + 1));
const L = (worldCol, x0) => worldCol - x0;

export default [
  {
    id: 'arrival',
    section: 'arrival',
    grid: slice(0, 25),
    music: { section: 'arrival', bpm: 96, state: 'quiet' },
    bg: { far: 'city', mid: 'brick', near: 'fence', landmark: 'meridian_sign' },
    objects: [
      { type: 'spawn', x: 3, y: 32 },
      { type: 'dialogue', x: 6, y: 33, id: 'd0', auto: true },
      { type: 'foe', kind: 'rat', x: 12, y: 33, human: false },
      { type: 'foe', kind: 'rat', x: 15, y: 33, human: false },
      // coins (tier 1): the kerb ramp is optional height — the pay is up there
      { type: 'coins', x: 19, y: 31, n: 3 },
      { type: 'coin', x: 24, y: 32, breadcrumb: true }, // marks the gate
      { type: 'checkpoint', x: 23, y: 33, id: 'CP0' },
      { type: 'gate', x: 25, y: 29, h: 5, id: 'g0', requires: ['d0'] },
    ],
  },
  {
    id: 'alley_dock',
    section: 'delivery',
    grid: slice(26, 81),
    music: { section: 'delivery', bpm: 100, state: 'explore' },
    bg: { far: 'city', mid: 'brick', near: 'crates', landmark: 'loading_dock' },
    objects: [
      { type: 'foe', kind: 'runaway_cart', x: L(31, 26), y: 33, patrol: [L(27, 26), L(32, 26)], human: false }, // charges the open alley; the crate stack at 33-34 pens it in
      { type: 'foe', kind: 'crawler', x: L(44, 26), y: 33, human: false },
      { type: 'foe', kind: 'crawler', x: L(48, 26), y: 33, human: false },
      { type: 'foe', kind: 'crawler', x: L(52, 26), y: 33, human: false },
      // The dock hand works the dock under a low canopy; the crates the
      // hatch plate needs are BEHIND you, among the roaches, so you carry
      // them past him -- and a grab costs you the crate.
      { type: 'foe', kind: 'dock_hand', x: L(64, 26), y: 33, human: true, patrol: [L(62, 26), L(67, 26)] },
      { type: 'hide', x: L(60, 26), y: 32, id: 'crate_stack' },
      { type: 'carryable', kind: 'crate', x: L(45, 26), y: 33, id: 'crate1', height: 1 },
      { type: 'carryable', kind: 'crate', x: L(49, 26), y: 33, id: 'crate2', height: 2 },
      { type: 'carryable', kind: 'crate', x: L(51, 26), y: 33, id: 'crate3', height: 3 },
      // P1 fork — the safe floor (crawlers) pays nothing; the conveyor run
      // above pays 6, with the gap jump mid-line (tier 3: belts + a drop)
      { type: 'coins', x: L(42, 26), y: 30, n: 3 },
      { type: 'coins', x: L(51, 26), y: 30, n: 3 },
      // tier 2: on top of the dock beam, a jump up from the conveyor's end
      { type: 'coins', x: L(63, 26), y: 25, n: 3 },
      // P7 — the dock hand's beat; the pay is past him, under the beam
      { type: 'coins', x: L(65, 26), y: 32, n: 3 },
      { type: 'coin', x: L(72, 26), y: 31, breadcrumb: true }, // the plate
      { type: 'plate', x: L(72, 26), y: 33, id: 'dry_plate', needs: 2, opens: 'hatch' },
      { type: 'moment', x: L(77, 26), y: 33, id: 'm1' },
      { type: 'checkpoint', x: L(79, 26), y: 29, id: 'CP1' },
      { type: 'gate', x: L(81, 26), y: 29, h: 5, id: 'g1', requires: ['crates'] },
    ],
  },
  {
    id: 'freezer',
    section: 'freezer',
    allowNoFoes: true, // chef spec: "Enemies: none (isolation)"
    grid: slice(82, 131),
    music: { section: 'freezer', bpm: 88, state: 'quiet' },
    bg: { far: 'frost', mid: 'shelving', near: 'carcasses', landmark: 'compressor' },
    objects: [
      { type: 'hazard', kind: 'icicle', x: L(86, 82), y: 28 },
      { type: 'hazard', kind: 'icicle', x: L(94, 82), y: 28 },
      { type: 'hazard', kind: 'icicle', x: L(102, 82), y: 28 },
      { type: 'hazard', kind: 'icicle', x: L(110, 82), y: 28 },
      { type: 'moment', x: L(91, 82), y: 33, id: 'm2' },
      { type: 'hazard', kind: 'cold_jet', x: L(97, 82), y: 32, period: 3000, offset: 0 },
      { type: 'hazard', kind: 'cold_jet', x: L(101, 82), y: 32, period: 3000, offset: 750 },
      { type: 'hazard', kind: 'cold_jet', x: L(105, 82), y: 32, period: 3000, offset: 1500 },
      { type: 'hazard', kind: 'cold_jet', x: L(109, 82), y: 32, period: 3000, offset: 2250 },
      { type: 'heatlamp', x: L(105, 82), y: 30, id: 'lamp1', removeAtDifficulty: 3 },
      { type: 'panel', x: L(115, 82), y: 32, id: 'freezer_valve', puzzle: 'freezerValve', sets: 'freezer_valve' },
      { type: 'hazard', kind: 'pan_pendulum', x: L(126, 82), y: 20, len: 58, phase: 0 },
      { type: 'hazard', kind: 'pan_pendulum', x: L(128, 82), y: 24, len: 58, phase: 1.5 },
      { type: 'carryable', kind: 'saffron', x: L(127, 82), y: 18, id: 'saffron', story: true, sets: 'has_saffron', dialogue: 'd2' },
      { type: 'checkpoint', x: L(129, 82), y: 33, id: 'CP2' },
      // tier 2: the shelf hop line under the icicles — visible from the door
      { type: 'coin', x: L(86, 82), y: 30 },
      { type: 'coins', x: L(91, 82), y: 27, n: 3 },
      { type: 'coin', x: L(98, 82), y: 30 },
      // shard (§4): above the icicle shelf, between the two drop columns —
      // the section's hardest optional jump, with consolation pay beside it
      { type: 'shard', x: L(92, 82), y: 24 },
      { type: 'coins', x: L(90, 82), y: 24, n: 2, dx: 4 },
      // tier 3: the saffron climb — the stairs, then the high shelves
      { type: 'coins', x: L(118, 82), y: 30, n: 3, dy: -1 },
      { type: 'coin', x: L(125, 82), y: 24 },
      { type: 'coin', x: L(127, 82), y: 21 },
      { type: 'gate', x: L(131, 82), y: 29, h: 5, id: 'g2', requires: ['freezer_valve', 'has_saffron'] },
    ],
  },
  {
    id: 'the_line',
    section: 'the_line',
    grid: slice(132, 203),
    music: { section: 'the_line', bpm: 110, state: 'danger' },
    bg: { far: 'pans', mid: 'kitchen_wall', near: 'cooks', landmark: 'pass_window' },
    objects: [
      { type: 'checkpoint', x: L(132, 132), y: 33, id: 'CP3' },
      { type: 'hazard', kind: 'burner', x: L(136, 132), y: 30, period: 2000, offset: 0 },
      { type: 'hazard', kind: 'burner', x: L(139, 132), y: 30, period: 2000, offset: 500 },
      { type: 'hazard', kind: 'burner', x: L(143, 132), y: 30, period: 2000, offset: 1000 },
      { type: 'hazard', kind: 'burner', x: L(147, 132), y: 30, period: 2000, offset: 0 },
      { type: 'hazard', kind: 'burner', x: L(151, 132), y: 30, period: 2000, offset: 500 },
      { type: 'hazard', kind: 'burner', x: L(155, 132), y: 30, period: 2000, offset: 1000 },
      { type: 'station', x: L(140, 132), y: 30, id: 'risotto', accepts: 'saffron', dialogue: 'd3', sets: 'saffron_delivered' },
      { type: 'npc', who: 'marguerite', x: L(142, 132), y: 30 },
      { type: 'hazard', kind: 'vent', x: L(149, 132), y: 33, period: 1800, offset: 0 },
      { type: 'hazard', kind: 'vent', x: L(152, 132), y: 33, period: 1800, offset: 600 },
      { type: 'hazard', kind: 'vent', x: L(155, 132), y: 33, period: 1800, offset: 1200 },
      { type: 'panel', x: L(150, 132), y: 26, id: 'ticket_rail', puzzle: 'ticketRail', sets: 'ticket_rail', requires: ['saffron_delivered'] },
      { type: 'station', x: L(158, 132), y: 33, id: 'pass', accepts: 'rush', rush: true },
      { type: 'foe', kind: 'grease_blob', x: L(162, 132), y: 33, human: false },
      { type: 'foe', kind: 'grease_blob', x: L(165, 132), y: 33, human: false },
      { type: 'foe', kind: 'pepper_mill', x: L(170, 132), y: 29, patrol: [L(168, 132), L(173, 132)], human: false },
      { type: 'foe', kind: 'sous_chef', x: L(160, 132), y: 33, human: true, patrol: [L(157, 132), L(166, 132)] },
      { type: 'hide', x: L(163, 132), y: 33, id: 'under_counter' },
      { type: 'foe', kind: 'pepper_mill', x: L(145, 132), y: 30, patrol: [L(140, 132), L(155, 132)], human: false, minDifficulty: 1 },
      { type: 'source', x: L(170, 132), y: 30, id: 'fish' },
      { type: 'hazard', kind: 'vent', x: L(177, 132), y: 33, period: 1800, offset: 300 },
      { type: 'hazard', kind: 'vent', x: L(179, 132), y: 33, period: 1800, offset: 900 },
      { type: 'source', x: L(182, 132), y: 23, id: 'herbs' },
      { type: 'source', x: L(195, 132), y: 32, id: 'bread' },
      { type: 'oven_door', x: L(191, 132), y: 31, h: 3, period: 12000, open: 4000 },
      { type: 'checkpoint', x: L(200, 132), y: 33, id: 'CP3b' },
      { type: 'moment', x: L(201, 132), y: 33, id: 'm3' },
      // P2 — the arc over the grease slick traces the running jump
      { type: 'coin', x: L(160, 132), y: 32 },
      { type: 'coins', x: L(162, 132), y: 31, n: 3 },
      { type: 'coin', x: L(166, 132), y: 32 },
      // tier 3: the counter top belongs to the pepper mills
      { type: 'coins', x: L(140, 132), y: 30, n: 3, dx: 2 },
      // tier 2: the shelf over the pass line
      { type: 'coins', x: L(148, 132), y: 26, n: 4, dx: 2 },
      { type: 'coin', x: L(203, 132), y: 32, breadcrumb: true }, // the dumbwaiter door
      { type: 'lift', x: L(207, 132), y: 33, id: 'dumbwaiter', dialogue: 'd4', requires: ['rush_done'] },
      { type: 'gate', x: L(203, 132), y: 29, h: 5, id: 'g3', requires: ['rush_done'] },
    ],
  },
  {
    id: 'loft',
    section: 'loft',
    grid: slice(204, 262),
    music: { section: 'loft', bpm: 104, state: 'explore' },
    bg: { far: 'sugar', mid: 'bowls', near: 'chandelier', landmark: 'chocolate_river' },
    objects: [
      { type: 'hazard', kind: 'counterweight', x: L(207, 204), y: 24, phase: 0 },
      { type: 'hazard', kind: 'counterweight', x: L(207, 204), y: 16, phase: 2 },
      { type: 'plate', x: L(218, 204), y: 13, id: 'yeast_pedal', needs: 1, opens: 'dough' },
      { type: 'dough', x: L(223, 204), y: 14, id: 'dough' },
      { type: 'sugar_bridge', x: L(232, 204), y: 14, len: 7 },
      { type: 'hazard', kind: 'piping_bag', x: L(228, 204), y: 8, period: 2500, offset: 0 },
      { type: 'hazard', kind: 'piping_bag', x: L(240, 204), y: 8, period: 2500, offset: 1200 },
      { type: 'foe', kind: 'meringue', x: L(245, 204), y: 10, human: false },
      { type: 'foe', kind: 'meringue', x: L(250, 204), y: 11, human: false },
      { type: 'foe', kind: 'meringue', x: L(255, 204), y: 12, human: false },
      { type: 'panel', x: L(252, 204), y: 13, id: 'piping', puzzle: 'piping', sets: 'piping' },
      { type: 'carryable', kind: 'gold_leaf', x: L(254, 204), y: 13, id: 'gold leaf', story: true, sets: 'has_gold_leaf', dialogue: 'd5', requires: ['piping'] },
      { type: 'checkpoint', x: L(258, 204), y: 13, id: 'CP4' },
      // tier 3: across the sugar bridges — the coins sit over the gaps
      { type: 'coins', x: L(221, 204), y: 13, n: 3, dx: 3 },
      { type: 'coins', x: L(233, 204), y: 13, n: 3, dx: 3 },
      // tier 3: meringue territory, up in the rafters
      { type: 'coins', x: L(248, 204), y: 11, n: 4, dx: 2 },
      // shard: the high ramp the meringues guard, with its consolation pay
      { type: 'shard', x: L(245, 204), y: 11 },
      { type: 'coins', x: L(249, 204), y: 22, n: 2, dx: 3 },
      { type: 'gate', x: L(260, 204), y: 8, h: 6, id: 'g4', requires: ['piping', 'has_gold_leaf'] },
    ],
  },
  {
    id: 'the_pass',
    section: 'the_pass',
    grid: slice(263, 304),
    music: { section: 'the_pass', bpm: 120, state: 'setpiece' },
    bg: { far: 'dining_room', mid: 'chandeliers', near: 'heat_lamps', landmark: 'the_pass' },
    objects: [
      { type: 'checkpoint', x: L(266, 263), y: 33, id: 'CP5' },
      { type: 'station', x: L(271, 263), y: 30, id: 'hot', service: true },
      { type: 'station', x: L(279, 263), y: 30, id: 'cold', service: true },
      { type: 'station', x: L(287, 263), y: 30, id: 'dessert', service: true },
      { type: 'foe', kind: 'pepper_mill', x: L(274, 263), y: 33, human: false, wave: 2, patrol: [L(268, 263), L(292, 263)] },
      { type: 'foe', kind: 'pepper_mill', x: L(282, 263), y: 33, human: false, wave: 2, patrol: [L(268, 263), L(292, 263)] },
      { type: 'foe', kind: 'crawler', x: L(270, 263), y: 33, human: false, wave: 3 },
      { type: 'foe', kind: 'crawler', x: L(280, 263), y: 33, human: false, wave: 3 },
      { type: 'foe', kind: 'crawler', x: L(290, 263), y: 33, human: false, wave: 3 },
      { type: 'npc', who: 'aurelio', x: L(297, 263), y: 29 },
      { type: 'station', x: L(296, 263), y: 30, id: 'the_pass', service: true, deliver: true },
      // P5 — inside the pans' swing: two coins per platform, on the beat
      { type: 'coins', x: L(270, 263), y: 29, n: 2 },
      { type: 'coins', x: L(278, 263), y: 29, n: 2 },
      { type: 'coins', x: L(286, 263), y: 29, n: 2 },
      { type: 'coins', x: L(297, 263), y: 29, n: 3 },
      { type: 'gate', x: L(304, 263), y: 29, h: 5, id: 'g5', requires: ['service_survived'] },
    ],
  },
  {
    id: 'rooftop',
    section: 'rooftop',
    allowNoFoes: true, // chef spec: "No hazards"
    grid: slice(305, 319),
    music: { section: 'rooftop', bpm: 72, state: 'quiet' },
    bg: { far: 'dawn', mid: 'herb_beds', near: 'beehive', landmark: 'sunrise' },
    vista: true,
    objects: [
      { type: 'coins', x: L(310, 305), y: 31, n: 3 }, // the kerb up to the orb
      { type: 'orb', x: L(314, 305), y: 29 },
    ],
  },
];
