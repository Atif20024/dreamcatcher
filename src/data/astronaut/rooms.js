import { buildAstroMap } from '../astronautData.js';
import { withObjectives } from '../objectives.js';

// D2 — THE QUIET ABOVE as rooms. Terrain from the map painter; every object
// declarative. `phys` switches the motion model: undefined = 1g,
// 'zero' = the station, 'moon' = one-sixth g.
const FULL = buildAstroMap();
const slice = (x0, x1) => FULL.map((row) => row.slice(x0, x1 + 1));
const L = (worldCol, x0) => worldCol - x0;

const ROOMS = [
  {
    id: 'p0_arrival',
    section: 'arrival',
    allowNoFoes: true,
    grid: slice(0, 23),
    music: { section: 'arrival', bpm: 84, state: 'quiet' },
    bg: { far: 'dawn', mid: 'gym_wall', near: 'fence', landmark: 'adaeze_sign' },
    objects: [
      { type: 'spawn', x: 3, y: 34 },
      { type: 'mark', id: 'poster_fence', x: 9, y: 33 },
      { type: 'npc', who: 'adaeze', x: 12, y: 34, dialogue: 'd0' },
      { type: 'coin', x: 16, y: 33, breadcrumb: true },
      { type: 'checkpoint', x: 20, y: 35, id: 'CP0', label: 'ARRIVALS' },
      { type: 'gate', x: 23, y: 31, h: 5, id: 'g0', requires: ['d0'] },
    ],
  },
  {
    id: 'p1_track',
    section: 'body',
    grid: slice(24, 60),
    music: { section: 'gym', bpm: 100, state: 'explore' },
    // the LV-3 poster is no longer a drifting backdrop shape: the scene hangs
    // it on the wall by the deck (AstronautScene.buildTrack); far off, the
    // hall's pennant line
    bg: { far: 'gym_wall', mid: 'gym_kit', near: 'ropes', landmark: 'gym_pennants' },
    objects: [
      { type: 'checkpoint', x: L(40, 24), y: 35, id: 'CP1a', label: 'THE TRACK' },
      // the Track: laps on the mezzanine deck (36-54). Coach Adaeze stands
      // behind the start line and rolls the medicine balls; they run out to
      // the ball bin at the far end
      { type: 'mark', id: 'track_start', x: L(37, 24), y: 30 },
      { type: 'mark', id: 'track_far', x: L(53, 24), y: 30 },
      { type: 'mark', id: 'lv3_poster', x: L(46, 24), y: 30 },
      { type: 'foe', kind: 'gym_rat', x: L(45, 24), y: 30, human: true, patrol: [L(42, 24), L(50, 24)] },
      { type: 'foe', kind: 'cleaner', x: L(38, 24), y: 35, human: true, patrol: [L(30, 24), L(56, 24)], sight: 130 },
      { type: 'hide', x: L(33, 24), y: 35, id: 'mats' },
      // the high line pays (tier 2): one-ways over the rolling medicine balls
      { type: 'coins', x: L(41, 24), y: 26, n: 3, dx: 2 },
      { type: 'coin', x: L(58, 24), y: 32, breadcrumb: true },
      { type: 'mark', id: 'm1_door', x: L(29, 24), y: 34 },
      { type: 'moment', x: L(29, 24), y: 34, id: 'm1' },
    ],
  },
  {
    id: 'p1_pool',
    section: 'body',
    grid: slice(61, 86),
    music: { section: 'gym', bpm: 92, state: 'explore' },
    bg: { far: 'gym_wall', mid: 'pool_tiles', near: 'lane_ropes', landmark: 'lane_numbers' },
    objects: [
      { type: 'mark', id: 'pool_board', x: L(62, 61), y: 34 },
      // hoops: 2 m rings on weighted stands; swim the line without
      // surfacing, down and under the mid-wall (the third is in its gap)
      { type: 'mark', id: 'hoop', x: L(66, 61), y: 38 },
      { type: 'mark', id: 'hoop', x: L(70, 61), y: 40 },
      { type: 'mark', id: 'hoop', x: L(74, 61), y: 41 },
      { type: 'mark', id: 'hoop', x: L(78, 61), y: 40 },
      { type: 'mark', id: 'hoop', x: L(82, 61), y: 38 },
      // coins between the hoops, on the line (tier 2)
      { type: 'coins', x: L(68, 61), y: 39, n: 2, dx: 4, dy: 1 },
      { type: 'coins', x: L(76, 61), y: 41, n: 2, dx: 4, dy: -2 },
      // the deep end: lights off, the sunken locker (tier 4)
      { type: 'shard', x: L(82, 61), y: 50 },
      { type: 'coins', x: L(79, 61), y: 48, n: 2, dx: 2 },
      { type: 'checkpoint', x: L(86, 61), y: 35, id: 'CP1b', label: 'THE POOL' },
    ],
  },
  {
    id: 'p1_wall_ring',
    section: 'body',
    grid: slice(87, 110),
    music: { section: 'gym', bpm: 108, state: 'explore' },
    bg: { far: 'gym_wall', mid: 'gym_kit', near: 'ropes', landmark: 'fight_poster' },
    objects: [
      // the Wall: crumbling holds to the bell (tier 2 pays on the way up)
      { type: 'coins', x: L(89, 87), y: 32, n: 3, dx: 1, dy: -3 },
      { type: 'mark', id: 'bell', x: L(88, 87), y: 19 },
      { type: 'mark', id: 'plaque', x: L(87, 87), y: 19 },
      // the Ring
      { type: 'mark', id: 'ring', x: L(103, 87), y: 31 },
      { type: 'coins', x: L(100, 87), y: 29, n: 2, dx: 3 },
      { type: 'checkpoint', x: L(109, 87), y: 35, id: 'CP1c', label: 'THE WALL' },
    ],
  },
  {
    id: 'p1_study',
    section: 'body',
    allowNoFoes: true,
    grid: slice(111, 129),
    music: { section: 'study', bpm: 76, state: 'quiet' },
    bg: { far: 'gym_wall', mid: 'study_shelves', near: 'ropes', landmark: 'study_lamp' },
    objects: [
      { type: 'npc', who: 'priya', x: L(115, 111), y: 33 },
      { type: 'mark', id: 'flashcards', x: L(116, 111), y: 33 },
      { type: 'mark', id: 'notebook', x: L(118, 111), y: 33 },
      { type: 'coin', x: L(121, 111), y: 34, breadcrumb: true },
      { type: 'npc', who: 'halvorsen', x: L(125, 111), y: 34 },
      { type: 'mark', id: 'physical', x: L(126, 111), y: 34 },
      { type: 'checkpoint', x: L(128, 111), y: 35, id: 'CP1d', label: 'THE STUDY ROOM' },
      { type: 'gate', x: L(129, 111), y: 31, h: 5, id: 'g1', requires: ['physical'] },
    ],
  },
  {
    id: 'p2_gate',
    section: 'gate',
    allowNoFoes: true,
    grid: slice(130, 152),
    music: { section: 'gate', bpm: 60, state: 'quiet' },
    bg: { far: 'gate_grey', mid: 'chairs', near: 'fence', landmark: 'board_door' },
    objects: [
      { type: 'checkpoint', x: L(142, 130), y: 35, id: 'CP2', label: "THE BOARD'S DOOR" }, // by the Board's door, not on top of CP1d
      { type: 'coin', x: L(143, 130), y: 34, breadcrumb: true },
      { type: 'mark', id: 'board_door', x: L(145, 130), y: 34 },
      { type: 'gate', x: L(152, 130), y: 31, h: 5, id: 'g2', requires: ['selected'] },
    ],
  },
  {
    id: 'p3_centrifuge',
    section: 'ground',
    grid: slice(153, 170),
    music: { section: 'campus', bpm: 96, state: 'explore' },
    bg: { far: 'campus', mid: 'hangars', near: 'fence', landmark: 'centrifuge_dome' },
    objects: [
      { type: 'checkpoint', x: L(155, 153), y: 35, id: 'CP3a', label: 'THE CENTRIFUGE' },
      { type: 'foe', kind: 'security', x: L(164, 153), y: 35, human: true, patrol: [L(160, 153), L(168, 153)], sight: 160 },
      { type: 'hide', x: L(158, 153), y: 35, id: 'crates' },
      { type: 'coins', x: L(160, 153), y: 33, n: 2, dx: 2 },
      { type: 'mark', id: 'centrifuge', x: L(163, 153), y: 34 },
    ],
  },
  {
    id: 'p3_nbpool',
    section: 'ground',
    grid: slice(171, 197),
    music: { section: 'campus', bpm: 92, state: 'explore' },
    bg: { far: 'campus', mid: 'pool_tiles', near: 'lane_ropes', landmark: 'nb_sign' },
    objects: [
      { type: 'mark', id: 'nb_brief', x: L(172, 171), y: 29 },
      { type: 'mark', id: 'panel_rack', x: L(170, 171), y: 30 }, // on the dive deck, not over the water
      { type: 'mark', id: 'panel_slot', x: L(191, 171), y: 40 },
      { type: 'mark', id: 'tank_hatch', x: L(186, 171), y: 34 },
      // inside the mock-up maze (tier 2)
      { type: 'coins', x: L(178, 171), y: 40, n: 2, dx: 3 },
      { type: 'coins', x: L(187, 171), y: 38, n: 1, dx: 2 },
      { type: 'checkpoint', x: L(197, 171), y: 30, id: 'CP3b', label: 'THE DIVE DECK' },
    ],
  },
  {
    id: 'p3_sim',
    section: 'ground',
    allowNoFoes: true,
    grid: slice(198, 210),
    music: { section: 'campus', bpm: 96, state: 'explore' },
    bg: { far: 'campus', mid: 'hangars', near: 'fence', landmark: 'sim_shed' },
    objects: [
      { type: 'mark', id: 'simulator', x: L(205, 198), y: 33 },
      { type: 'coin', x: L(209, 198), y: 34, breadcrumb: true },
      { type: 'checkpoint', x: L(209, 198), y: 35, id: 'CP3c', label: 'THE SIMULATOR' },
    ],
  },
  {
    id: 'p3_survival',
    section: 'ground',
    grid: slice(211, 240),
    music: { section: 'forest', bpm: 72, state: 'quiet' },
    bg: { far: 'night_forest', mid: 'pines', near: 'fence', landmark: 'far_pad' },
    objects: [
      { type: 'mark', id: 'dark_zone', x: L(212, 211), y: 30, x0: L(212, 211), w: 26 },
      { type: 'mark', id: 'camp_item', x: L(217, 211), y: 34 },
      { type: 'mark', id: 'camp_item', x: L(223, 211), y: 32 },
      { type: 'mark', id: 'camp_item', x: L(229, 211), y: 34 },
      { type: 'mark', id: 'camp', x: L(226, 211), y: 34 },
      { type: 'foe', kind: 'security', x: L(220, 211), y: 35, human: true, patrol: [L(218, 211), L(226, 211)], sight: 120 },
      // the treetop line pays (tier 2, in the dark)
      { type: 'coins', x: L(222, 211), y: 31, n: 2, dx: 1 },
      { type: 'coins', x: L(233, 211), y: 31, n: 1, dx: 1 },
      { type: 'mark', id: 'priya_hurt', x: L(231, 211), y: 34 },
      { type: 'mark', id: 'beacon', x: L(237, 211), y: 34 },
      { type: 'coin', x: L(237, 211), y: 33, breadcrumb: true },
      { type: 'mark', id: 'water_tower', x: L(239, 211), y: 30 },
      { type: 'moment', x: L(239, 211), y: 30, id: 'm2' },
      { type: 'checkpoint', x: L(239, 211), y: 35, id: 'CP3d', label: 'SURVIVAL CAMP' },
      { type: 'gate', x: L(240, 211), y: 31, h: 5, id: 'g3', requires: ['survival'] },
    ],
  },
  {
    id: 'p4_pad',
    section: 'sky',
    allowNoFoes: true,
    grid: slice(241, 256),
    music: { section: 'pad', bpm: 60, state: 'quiet' },
    bg: { far: 'dawn', mid: 'gantry', near: 'fence', landmark: 'the_stack' },
    objects: [
      { type: 'coins', x: L(245, 241), y: 30, n: 2, dx: 0, dy: -4 },
      { type: 'mark', id: 'hatch', x: L(245, 241), y: 16 }, // at the ladder's head: you board from the rungs, not by stepping off
    ],
  },
  {
    id: 'p4_station',
    section: 'sky',
    phys: 'zero',
    allowNoFoes: true,
    grid: slice(257, 301),
    music: { section: 'station', bpm: 72, state: 'quiet' },
    bg: { far: 'space', mid: 'earth_glow', near: 'module_ribs', landmark: 'earth_window' },
    objects: [
      { type: 'mark', id: 'station_spawn', x: L(261, 257), y: 27 },
      // ONE emergency charge, at the node, for the long middle of the section.
      // The refill proper is the airlock (§3.3); scattering ports through the
      // modules just deleted the suit meter as a pressure.
      { type: 'mark', id: 'o2_port', x: L(277, 257), y: 28 }, // clear of the window's prompt at 281
      { type: 'checkpoint', x: L(262, 257), y: 27, id: 'CP4b', label: 'THE NODE' },
      { type: 'rail', x: L(259, 257), y: 18, len: 12 },
      { type: 'rail', x: L(266, 257), y: 28, len: 5 },
      { type: 'mark', id: 'valve', x: L(268, 257), y: 20 },
      { type: 'gate', x: L(272, 257), y: 23, h: 3, id: 'gA', requires: ['coolant'] },
      { type: 'rail', x: L(275, 257), y: 28, len: 10 },
      { type: 'rail', x: L(278, 257), y: 18, len: 6 },
      { type: 'coins', x: L(276, 257), y: 23, n: 3, dx: 3 },
      { type: 'mark', id: 'cupola', x: L(281, 257), y: 27 },
      { type: 'moment', x: L(281, 257), y: 27, id: 'm3' },
      { type: 'mark', id: 'comms', x: L(284, 257), y: 20 },
      { type: 'gate', x: L(286, 257), y: 23, h: 3, id: 'gB', requires: ['reported'] },
      { type: 'rail', x: L(289, 257), y: 18, len: 8 },
      { type: 'mark', id: 'wrench_locker', x: L(292, 257), y: 27 },
      { type: 'coin', x: L(294, 257), y: 27, breadcrumb: true },
      { type: 'mark', id: 'airlock', x: L(297, 257), y: 26 },
      { type: 'checkpoint', x: L(296, 257), y: 27, id: 'CP4c', label: 'THE AIRLOCK' },
      { type: 'gate', x: L(300, 257), y: 23, h: 3, id: 'gC', requires: ['wrench'] },
    ],
  },
  {
    id: 'p4_eva',
    section: 'sky',
    phys: 'zero',
    allowNoFoes: true,
    grid: slice(302, 331),
    music: { section: 'eva', bpm: 60, state: 'quiet' },
    bg: { far: 'space', mid: 'earth_glow', near: 'hull_plates', landmark: 'earth_window' },
    objects: [
      { type: 'hook', x: L(303, 302), y: 27 },
      { type: 'hook', x: L(309, 302), y: 27 },
      { type: 'hook', x: L(315, 302), y: 27 },
      { type: 'hook', x: L(321, 302), y: 27 },
      { type: 'hook', x: L(327, 302), y: 27 },
      // the truss line pays (tier 3: O2, tether, nothing under you)
      { type: 'coins', x: L(306, 302), y: 26, n: 4, dx: 4 },
      { type: 'mark', id: 'code_plate', x: L(322, 302), y: 24 },
      { type: 'mark', id: 'array', x: L(328, 302), y: 25 },
    ],
  },
  {
    id: 'p5_moonfield',
    section: 'moon',
    phys: 'moon',
    grid: slice(332, 384),
    music: { section: 'moon', bpm: 56, state: 'quiet' },
    bg: { far: 'moon_black', mid: 'moon_hills', near: 'regolith', landmark: 'small_earth' },
    objects: [
      { type: 'mark', id: 'lander', x: L(337, 332), y: 33 },
      { type: 'checkpoint', x: L(338, 332), y: 35, id: 'CP5a', label: 'THE MOON FIELD' },
      { type: 'mark', id: 'dust_devil', x: L(348, 332), y: 33 },
      { type: 'mark', id: 'dust_devil', x: L(371, 332), y: 33 },
      { type: 'mark', id: 'sharp_rocks', x: L(359, 332), y: 35 },
      { type: 'mark', id: 'patch_kit', x: L(362, 332), y: 34 },
      { type: 'coin', x: L(357, 332), y: 34, breadcrumb: true },
      { type: 'coin', x: L(370, 332), y: 31, breadcrumb: true },
      { type: 'mark', id: 'shadow', x: L(376, 332), y: 30, x0: L(375, 332), w: 8 },
    ],
  },
  {
    id: 'p5_crevasse',
    section: 'moon',
    phys: 'moon',
    allowNoFoes: true,
    grid: slice(385, 431),
    music: { section: 'moon', bpm: 56, state: 'quiet' },
    bg: { far: 'moon_black', mid: 'moon_hills', near: 'regolith', landmark: 'small_earth' },
    objects: [
      { type: 'checkpoint', x: L(387, 385), y: 35, id: 'CP5b', label: 'THE CREVASSE' },
      // the bound-jump arcs: 6, 8, 10 tiles — the coins ARE the arc
      { type: 'coins', x: L(391, 385), y: 33, n: 3, dx: 2, dy: 0 },
      { type: 'coins', x: L(402, 385), y: 32, n: 4, dx: 2, dy: 0 },
      { type: 'coins', x: L(415, 385), y: 31, n: 4, dx: 2, dy: 0 },
      { type: 'mark', id: 'probe', x: L(429, 385), y: 32 },
    ],
  },
  {
    id: 'p5_crater',
    section: 'moon',
    phys: 'moon',
    allowNoFoes: true,
    grid: slice(432, 470),
    music: { section: 'crater', bpm: 48, state: 'quiet' },
    bg: { far: 'moon_black', mid: 'crater_wall', near: 'regolith', landmark: 'small_earth' },
    objects: [
      { type: 'mark', id: 'winch', x: L(463, 432), y: 34 },
      { type: 'mark', id: 'flare', x: L(441, 432), y: 55 },
      { type: 'mark', id: 'shadow', x: L(436, 432), y: 48, x0: L(436, 432), w: 25 },
      // the side terrace: shard + consolation (tier 4, off the rescue line)
      { type: 'shard', x: L(453, 432), y: 51 },
      { type: 'coins', x: L(450, 432), y: 51, n: 2, dx: 1 },
      { type: 'checkpoint', x: L(440, 432), y: 55, id: 'CP5c', label: 'THE CRATER RIM' },
      { type: 'mark', id: 'priya_down', x: L(457, 432), y: 59 },
      { type: 'coin', x: L(466, 432), y: 34, breadcrumb: true },
    ],
  },
  {
    id: 'p6_field',
    section: 'return',
    allowNoFoes: true,
    grid: slice(471, 521),
    music: { section: 'field', bpm: 60, state: 'quiet' },
    bg: { far: 'dawn', mid: 'grass_far', near: 'grass_near', landmark: 'capsule' },
    objects: [
      { type: 'mark', id: 'capsule', x: L(477, 471), y: 33 },
      { type: 'coin', x: L(481, 471), y: 34, breadcrumb: true },
      { type: 'mark', id: 'truck', x: L(510, 471), y: 33 },
      { type: 'npc', who: 'adaeze', x: L(514, 471), y: 34 },
      { type: 'mark', id: 'orb', x: L(516, 471), y: 34 },
    ],
  },
];

// Phase 1.4 (plan §2.7): each room's objective, each gate's sign
const OBJECTIVES = {
  "p0_arrival": "the intake. then train.",
  "p1_track": [
    "run 3 laps for Coach Adaeze — dodge the medicine balls",
    {
      "flag": "track_done",
      "text": "three laps. the pool is next door"
    }
  ],
  "p1_pool": "swim through 5 hoops on one breath",
  "p1_wall_ring": "climb to the bell · box in the ring",
  "p1_study": [
    "read the notebook. 3 pips in every stat",
    {
      "flag": "physical",
      "text": "the numbers are there. the Board."
    }
  ],
  "p2_gate": [
    "the Board. Thursday.",
    {
      "flag": "selected",
      "text": "the bus is waiting — training campus"
    }
  ],
  "p3_centrifuge": "the centrifuge",
  "p3_nbpool": "the tank — seat the spare panel",
  "p3_sim": "the simulator — dock it",
  "p3_survival": [
    "the survival course — night, rain",
    {
      "flag": "shelter",
      "text": "the shelter holds. the beacon. Priya."
    },
    {
      "flag": "survival",
      "text": "the pad, before dawn"
    }
  ],
  "p4_pad": "the pad, before dawn",
  "p4_station": [
    "the coolant leak — follow the droplets",
    {
      "flag": "coolant",
      "text": "the node — report to the ground"
    },
    {
      "flag": "reported",
      "text": "the airlock — the array is stuck"
    }
  ],
  "p4_eva": [
    "the array — [F] clip on, then push",
    {
      "flag": "array_fixed",
      "text": "back to the airlock — the moon is next"
    }
  ],
  "p5_moonfield": "the dead probe — cross the crevasse field",
  "p5_crevasse": "the crevasse field — bound across",
  "p5_crater": "the crater. her signal is one pip.",
  "p6_field": "walk."
};

const GATE_HINTS = {
  "g0": "INTAKE · talk to Coach Adaeze first",
  "g1": "needs 3 pips in every stat",
  "g2": "THE BOARD · be selected",
  "g3": "finish the survival course",
  "gA": "seal the coolant leak",
  "gB": "report to the ground",
  "gC": "needs: the wrench"
};

export default withObjectives(ROOMS, OBJECTIVES, GATE_HINTS);
