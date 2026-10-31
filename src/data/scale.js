// The scale system as data (round 2 critique §7). One rule for the whole
// game: 1 m = 44 px on the play plane (scroll factor 1). Jo is 1.73 m, so
// 76 px of body and 82 px with his hat. A tile (32 px) is 0.727 m.
//
// Read by: the cast rig bake (scripts/build-atlas.js via src/art/rig/cast.js),
// `npm run lint:scale` (scripts/lib/scale-check.js), the `scale-<place>`
// harness scenarios, and (framework) MaterialLibrary / PropLibrary /
// BackdropDirector. Heights are the drawn, opaque height in screen px at
// scale 1 (outline included); a class's range is [min, max] and `TOL` is the
// fractional slack the lint allows outside it.

export const PX_PER_M = 44;
export const TILE = 32;
export const TOL = 0.04;

// metres → px on a layer with scroll factor s (the depth rule, §7.1.2)
export const px = (m, s = 1) => Math.round(m * PX_PER_M * s);
export const metres = (p, s = 1) => p / (PX_PER_M * s);

export const JO = { m: 1.73, body: 76, withHat: 82 };

// ---- characters (§7.2) --------------------------------------------------------
// h: drawn height range (px, hat or hair included). The rig bodies in
// src/art/rig/cast.js are built to land inside these.
export const CLASSES = {
  jo: { h: [76, 84], m: 1.73 },
  adult: { h: [70, 86], m: [1.6, 1.9] },
  big: { h: [82, 90], m: [1.9, 2.0], w: [30, 48] },
  elderly: { h: [66, 76], m: [1.55, 1.7] },
  teen: { h: [66, 78], m: [1.5, 1.75] },
  child: { h: [48, 62], m: [1.15, 1.4] },
  toddler: { h: [38, 44], m: [0.85, 1.0] },
  // creatures: real size up to ×1.5 for readability, never above 0.4 × Jo
  rat: { h: [9, 16], w: [22, 34] },
  roach: { h: [8, 14], w: [14, 24] },
  pigeon: { h: [11, 16], w: [14, 22] },
  crow: { h: [13, 20], w: [18, 34] },
  smallbird: { h: [4, 10], w: [6, 14] },
  cat: { h: [12, 22], w: [18, 32] },
  dog: { h: [20, 30], w: [32, 44] },
  heron: { h: [36, 48] },
  // dream things (a slip of paper, a wisp, a grease blob): any size up to 0.4 × Jo
  thing: { h: [8, 33] },
  trolley: { h: [34, 44], w: [40, 52] },
};

// every person texture prefix and its default class; per-id body overrides
// (sex/hair/age) live in CAST_BODIES below
export const PERSON_PREFIXES = ['hub-', 'ev-p-', 'ev-x-', 'wr-p-', 'pt-p-', 'gm-p-', 'npc-', 'foe-'];

// body: adult (m/f), big, elderly, teen, child. hair: short, long, bun, bob,
// bald, crop, tuft, grey. Anything not listed is an adult with short hair
// (or a kid if its look says kid).
export const CAST_BODIES = {
  // hub
  'hub-pemberton': { body: 'elderly', sex: 'm', hair: 'grey', beard: true },
  'hub-ro': { sex: 'f', hair: 'long' },
  'hub-bilal': { sex: 'm', beard: true },
  'hub-busker': { sex: 'm' },
  'hub-sleeper': { body: 'elderly', sex: 'm', hair: 'bald' },
  'hub-kite': { body: 'child', hair: 'tuft' },
  'hub-sweeper': { sex: 'm', body: 'elderly' },
  'hub-flower': { sex: 'f', body: 'elderly', hair: 'bun' },
  'hub-traveler': { sex: 'm' },
  // the long evening
  'ev-p-fereshteh': { sex: 'f', dress: true },
  'ev-p-bo': { sex: 'm', beard: true },
  'ev-p-adaeze': { sex: 'f', hair: 'grey' },
  'ev-p-marcus': { sex: 'm', body: 'big' },
  'ev-p-marcus_kid': { body: 'child', sex: 'f', hair: 'bun', dress: true },
  'ev-p-fisherman': { body: 'elderly', sex: 'm', beard: true },
  'ev-p-hamid': { sex: 'm', beard: true },
  'ev-p-wren': { sex: 'f', hair: 'bob' },
  'ev-p-baker': { sex: 'm', apron: true },
  'ev-p-kite': { body: 'child', hair: 'tuft' },
  'ev-p-bilal': { sex: 'm', beard: true },
  'ev-p-waiting_kid': { body: 'child', sex: 'f', hair: 'bun', dress: true },
  'ev-p-mother': { sex: 'f', dress: true },
  'ev-p-sweeper': { body: 'elderly', sex: 'm' },
  'ev-p-stones_kid': { body: 'child', hair: 'tuft' },
  'ev-p-gardener': { sex: 'm', body: 'elderly' },
  'ev-p-sleeper': { body: 'elderly', sex: 'm', hair: 'bald' },
  'ev-p-bike_man': { sex: 'm' },
  'ev-p-priya': { sex: 'f', hair: 'long' },
  'ev-p-nia': { sex: 'f', hair: 'crop' },
  'ev-p-delphine': { sex: 'f', body: 'elderly', hair: 'bun', dress: true },
  'ev-p-ray': { sex: 'm', body: 'elderly', beard: true },
  'ev-p-marguerite': { sex: 'f', body: 'elderly', hair: 'bun', apron: true },
  'ev-p-bastien': { sex: 'm', body: 'teen' },
  'ev-x-0': { sex: 'm' },
  'ev-x-1': { sex: 'f', dress: true },
  'ev-x-2': { sex: 'm' },
  'ev-x-3': { sex: 'f', hair: 'long' },
  'ev-x-4': { sex: 'm', body: 'elderly' },
  // the writer
  'wr-p-wren': { sex: 'f', hair: 'bob' },
  'wr-p-emmerich': { body: 'elderly', sex: 'm', hair: 'grey', beard: true },
  'wr-p-tomasz': { sex: 'm', body: 'big' },
  'wr-p-isolde': { sex: 'f', hair: 'bob', dress: true },
  'wr-p-hat': { sex: 'm' },
  'wr-p-landlady': { sex: 'f', dress: true },
  'wr-p-reader1': { sex: 'f', hair: 'bun' },
  'wr-p-reader2': { sex: 'm' },
  'wr-p-reader3': { sex: 'f', hair: 'long' },
  'wr-p-reader4': { sex: 'm', body: 'teen' },
  // the painter
  'pt-p-clerk': { sex: 'm' },
  'pt-p-sleeper': { sex: 'm', body: 'elderly' },
  'pt-p-roulin': { sex: 'm', body: 'big', beard: true },
  'pt-p-paul': { sex: 'm', beard: true, hair: 'crop' },
  'pt-p-rey': { sex: 'm', body: 'teen' },
  'pt-p-ginoux': { sex: 'f', hair: 'bun', dress: true },
  'pt-p-vautrin': { sex: 'm' },
  'pt-p-visitor': { sex: 'f', dress: true },
  'pt-p-isak': { sex: 'm', body: 'teen' },
  'pt-p-gardener': { sex: 'm', body: 'elderly' },
  // the gambler
  'gm-p-favour': { sex: 'f', hair: 'long', dress: true },
  'gm-p-lou': { sex: 'm', body: 'elderly', hair: 'grey' },
  'gm-p-dede': { sex: 'f', hair: 'bun', dress: true },
  'gm-p-sal': { sex: 'm', body: 'elderly', hair: 'bald' },
  'gm-p-security': { sex: 'm', body: 'big', hair: 'crop' },
  'gm-p-waiter': { sex: 'm' },
  'gm-p-pianist': { sex: 'm' },
  'gm-p-dealer': { sex: 'f', hair: 'bun' },
  'gm-p-collector': { sex: 'm' },
  'gm-p-widow': { sex: 'f', body: 'elderly', dress: true },
  'gm-p-kid': { body: 'teen', sex: 'm' },
  'gm-p-accountant': { sex: 'm', hair: 'bald' },
  // musician / astronaut NPCs (string-art keys; looks below)
  'npc-delphine': { sex: 'f', body: 'elderly', hair: 'bun', dress: true, hat: 'none' },
  'npc-nia': { sex: 'f', hair: 'crop', hat: 'none', held: 'bass' },
  'npc-marcus': { sex: 'm', body: 'big', hat: 'cap' },
  'npc-ray': { sex: 'm', body: 'elderly', beard: true, hat: 'fedora' },
  'npc-tally': { sex: 'm', hat: 'peaked' },
  'npc-sol': { sex: 'm', body: 'elderly', hair: 'grey', hat: 'none' },
  'npc-scalper': { sex: 'm', hat: 'fedora', held: 'tickets' },
  'npc-roadie': { sex: 'm', body: 'big', hat: 'beanie', held: 'coil' },
  'npc-kid': { body: 'child', hair: 'tuft', hat: 'cap' },
  'npc-priya': { sex: 'f', hair: 'long', hat: 'none' },
  'npc-adaeze': { sex: 'f', hair: 'grey', hat: 'none' },
  'npc-halvorsen': { sex: 'm', body: 'elderly', hair: 'grey', hat: 'none', beard: true },
  'npc-osei': { sex: 'm', hat: 'none', hair: 'crop' },
  'mus-critic': { sex: 'm', body: 'elderly', hair: 'grey', hat: 'none', sit: true },
  // foes (human): one silhouette each, big bodies for the bouncers
  // (phase 2 motion: silhouettes — the bouncers shaved with an earpiece, the
  // gendarme in a kepi, station security in a helmet, the guard in a peaked cap)
  'foe-bouncer': { body: 'big', hair: 'bald', hat: 'earpiece' },
  'foe-lounge-bouncer': { body: 'big', hair: 'crop', hat: 'earpiece' },
  'foe-floor-security': { body: 'big' },
  'foe-security': { body: 'big', hat: 'helmet' },
  'foe-gendarme': { hat: 'kepi' },
  'foe-guard': { hat: 'peaked' },
  'foe-roadie': { body: 'big' },
  'foe-landlady': { sex: 'f', dress: true },
  'foe-proofreader': { sex: 'f', hair: 'bun' },
  'foe-pit': { body: 'elderly', hair: 'bald' },
  'foe-gardener': { body: 'elderly' },
  'foe-sous-chef': { apron: true },
  'foe-runner': { body: 'teen' },
};

// ---- props and interactables on the play plane (§7.2) ------------------------
// h/w: drawn size range at the scale the game shows them (texture px ×
// `scale`). `scale` defaults to 1. Hero allowance: an interactable may be up
// to 1.5 × real; pickups are icons (16–24) and exempt from real size.
export const PROP_CLASSES = {
  door: { h: [88, 120], m: 2.1 },
  doubleDoor: { h: [100, 120], m: 2.6 },
  lampStreet: { h: [180, 210], m: 4.5 },
  lampPlatform: { h: [140, 170], m: 3.5 },
  bench: { h: [30, 44], w: [70, 96], m: 0.85 },
  desk: { h: [30, 40], w: [56, 90], m: 0.75 },
  table: { h: [30, 40], m: 0.75 },
  counter: { h: [40, 54], m: 1.05 },
  chair: { h: [36, 46], m: 0.9 },
  typewriter: { h: [12, 22], w: [24, 36] },
  crateKitchen: { h: [18, 26] },
  cratePush: { h: [44, 54] },
  crateStack: { h: [48, 58] },
  postbox: { h: [62, 72] },
  phoneBooth: { h: [94, 110] },
  fountainTown: { h: [80, 100], w: [150, 200] },
  fountainDrink: { h: [40, 48] },
  clock: { h: [48, 58] },
  lever: { h: [30, 48] },
  plate: { h: [4, 10], w: [26, 44] },
  gatePost: { h: [88, 140] },
  sign: { h: [20, 60] },
  car: { h: [58, 72], w: [170, 210] },
  van: { h: [80, 96], w: [200, 240] },
  bicycle: { h: [40, 50], w: [66, 84] },
  tractor: { h: [96, 120] },
  rowboat: { h: [20, 32] },
  shrub: { h: [26, 60] },
  hedge: { h: [50, 90] },
  treeYoung: { h: [260, 360] },
  treePlay: { h: [260, 9999] }, // any tree on the play plane: never shorter than 260
  machine: { h: [56, 180] },
  window: { h: [56, 76] },
  pickup: { h: [12, 28] },
  coin: { h: [12, 22] },
  keyItem: { h: [14, 40] },
  held: { h: [6, 26] },
};

// texture key → class, for every prop the kit redraws (src/art/propKit.js)
// and the creatures. The lint measures each against its class range.
export const PROP_TABLE = {
  'ev-bench': 'bench', 'wr-bench': 'bench', 'pt-bench': 'bench', 'hub-bench': 'bench',
  'ev-postbox': 'postbox',
  'ev-fountain': 'fountainTown', 'pt-fountain': 'fountainTown', 'gm-fountain': 'fountainTown',
  'hub-fountain': 'fountainDrink',
  'ev-chess': 'table', 'wr-table': 'table', 'pt-table': 'table',
  'wr-desk': 'desk', 'wr-desk-big': 'desk', 'pt-desk': 'desk', 'astro-desk': 'desk', 'hub-desk': 'counter',
  'ev-chair': 'chair', 'wr-chair': 'chair', 'pt-chair': 'chair', 'mus-chair': 'chair',
  'wr-lamp-post': 'lampStreet', 'pt-lamp': 'lampStreet', 'gm-lamp-post': 'lampStreet',
  'wr-shop-door': 'door', 'wr-fire-door': 'door', 'gm-staffdoor': 'door', 'gm-firedoor': 'door', 'gm-door': 'doubleDoor',
  'wr-machine': 'furnitureTall', 'wr-cabinet': 'table', 'wr-piano': 'furnitureTall', 'gm-piano': 'furnitureTall', 'gm-videopoker': 'machine', 'wr-washer': 'appliance',
  'wr-lectern': 'furnitureTall', 'gm-valet': 'furnitureTall',
  'ev-cart': 'cart', 'pt-cart': 'cart', 'hub-cart': 'trolleyLuggage',
  'ev-charpoy': 'bed', 'pt-bed': 'bed', 'pt-cot': 'bed',
  'pt-easel': 'easel', 'pt-stove': 'stove', 'pt-stove_north': 'stove',
  'gm-car': 'car',
  'hub-suitcase': 'luggage',
};
Object.assign(PROP_CLASSES, {
  cart: { h: [34, 46] },
  furnitureTall: { h: [48, 60], m: [1.1, 1.3] },
  appliance: { h: [34, 44], m: 0.85 },
  trolleyLuggage: { h: [38, 50] },
  bed: { h: [18, 28] },
  easel: { h: [62, 76] },
  stove: { h: [34, 46] },
  luggage: { h: [18, 30] },
});

// creatures and dream things (texture key or prefix → CLASSES entry)
export const CREATURE_TABLE = {
  'foe-rat': 'rat', 'foe-crawler': 'roach', 'foe-pigeon': 'pigeon', 'foe-crow': 'crow', 'ev-pigeon': 'pigeon',
  'chef-cat': 'cat', 'ev-cat': 'cat', 'ev-dog': 'dog', 'ev-heron': 'heron', 'ev-swallow': 'smallbird',
  'foe-slip': 'thing', 'foe-wisp': 'thing', 'foe-grease': 'thing', 'foe-mill': 'thing', 'foe-meringue': 'thing', 'foe-walker': 'thing',
};

// known out-of-scale things this pass does not own, with the package that
// does: the lint lists them (WARN) instead of failing
export const SCALE_EXCEPTIONS = {
  'gm-van': 'WP2 room rebuild: a moving platform Jo rides (27 px); a 2 m van is out of jump reach until the carpark is rebuilt',
  'foe-cart': 'framework: the kitchen trolley foe becomes trolley + cook (a two-part foe)',
  'chef-crate': 'framework room rebuild: 1-tile crates are puzzle geometry (push/stack); 22 / 48 px crates need the chef rooms rebuilt',
  'hub-door': 'WP3 (hub presentation)', 'hub-booth': 'WP3', 'hub-kiosk': 'WP3', 'hub-lamp': 'WP3 (platform lamps with the head-on terminus)', 'hub-pigeon': 'WP3 (hub painter)',
  'pt-plane_tree': 'WP4 (trees: cropped on the play plane or whole on a parallax layer)', 'pt-cypress': 'WP4', 'pt-tree_grey': 'WP4',
  'ev-tree': 'WP4', 'ev-tree-apple': 'WP4', 'ev-pine': 'WP4', 'ev-hilltree': 'WP4',
  'ev-door': 'WP4 (house rows: doors scale with their buildings)', 'ev-lamp': 'WP4 (house rows)', 'ev-bakery': 'WP4',
  'pt-house_front': 'WP4', 'pt-cafe_front': 'WP4', 'pt-train': 'WP3', 'hub-train': 'WP3',
};

// ---- round 2 WP3: the train kit and the station's big furniture -------------
// Painted in code (src/art/trainArt.js) from the metres in src/art/trainKit.js;
// `lint:scale` measures TRAIN_KIT_SIZES against these.
Object.assign(PROP_CLASSES, {
  carriageEnd: { h: [165, 180], w: [116, 130], m: 3.9 }, // a coach end-on: 2.8 × 3.9 m
  carriageSide: { h: [165, 180], w: [860, 900], m: 3.9 }, // 20 m side-on (cropped by the screen)
  carriageDoor: { h: [84, 96], m: 2.0 }, // >= 1.15 × Jo
  bufferStop: { h: [52, 66], m: 1.35 },
  platformGate: { h: [44, 54], m: 1.1 },
  ticketBooth: { h: [108, 120], m: 2.6 },
  kiosk: { h: [104, 116], m: 2.5 },
  revolvingDoor: { h: [100, 112], m: 2.4 },
});
// the hub's doors, booths, kiosk, lamps, pigeons and every train are drawn
// at scale now (WP3): they are no longer exceptions
for (const k of ['hub-door', 'hub-booth', 'hub-kiosk', 'hub-lamp', 'hub-pigeon', 'hub-train', 'pt-train']) delete SCALE_EXCEPTIONS[k];

// ---- round 2 WP4: trees, building rows and backdrop depth (§7.1.2, §7.2) -----
// Every backdrop generator takes metres and the layer's scroll factor s and
// draws at m × 44 × s. A storey is 3 m (132 px on the play plane, 66 at
// s 0.5), a shop's ground floor 4 m, a door 2.2 m, a window 1.0 × 1.5 m on a
// 0.9 m sill. `lint:scale` checks the rows every generator declares here
// (BACKDROP_ROWS), the trees (TREE_TABLE) and the fronts (FRONT_TABLE).
export const STOREY_M = 3;
export const SHOP_M = 4;
export const DOOR_M = 2.2;
export const WINDOW_M = [1.0, 1.5];
export const SILL_M = 0.9;
export const ROOF_M = 2.4; // a pitched roof's rise over the eaves
export const storeyPx = (s = 1) => STOREY_M * PX_PER_M * s;
// one facade's measures at scroll factor s, in px (floats: painters round
// per edge, never per storey, so ten storeys don't drift)
export function facadeMetrics(s = 1) {
  const k = PX_PER_M * s;
  return { s, k, storey: STOREY_M * k, shop: SHOP_M * k, door: DOOR_M * k, doorW: 1.0 * k, winW: WINDOW_M[0] * k, winH: WINDOW_M[1] * k, sill: SILL_M * k, roof: ROOF_M * k, bay: 2.6 * k, cornice: 0.35 * k };
}
// the drawn height of a front: ground floor + storeys + roof (or parapet)
export function frontPx(spec, s = 1) {
  const f = facadeMetrics(s);
  if (spec.door) return Math.round((DOOR_M + 0.25) * f.k); // leaf + frame
  return Math.round((spec.ground === 'shop' ? f.shop : f.storey) + spec.storeys * f.storey + f.cornice + (spec.roof === false ? 0.9 * f.k : f.roof));
}

// Trees: a street tree is 6–12 m, a mature plane, pine or cypress 15–25 m.
// On the play plane they are drawn whole at real height and the camera crops
// them; on a backdrop layer at s they are drawn at m × 44 × s.
//   m      height, ground to crown top
//   crown  [width, height] of the crown as fractions of m
//   trunk  trunk diameter at the foot (m)
export const TREE_SPECS = {
  plane: { m: 15, crown: [0.78, 0.62], trunk: 0.75 },
  street: { m: 9, crown: [0.62, 0.66], trunk: 0.4 },
  apple: { m: 6, crown: [0.95, 0.6], trunk: 0.32 },
  hill: { m: 12, crown: [0.95, 0.62], trunk: 0.7 },
  pine: { m: 16, crown: [0.34, 0.84], trunk: 0.45 },
  cypress: { m: 13, crown: [0.2, 0.92], trunk: 0.35 },
  grey: { m: 10, crown: [0.7, 0.6], trunk: 0.45 },
  olive: { m: 6, crown: [1.0, 0.55], trunk: 0.45 },
};
// a tree's canvas at scroll factor s (the crown top touches the top edge)
export const treePx = (kind, s = 1, m = null) => {
  const t = TREE_SPECS[kind];
  const h = Math.max(4, Math.round((m || t.m) * PX_PER_M * s));
  return { h, w: Math.max(4, Math.round(t.crown[0] * h * 1.08) + 8) };
};
// play-plane tree textures → kind; the lint measures each against its class
export const TREE_TABLE = {
  'pt-plane_tree': 'plane', 'pt-cypress': 'cypress', 'pt-tree_grey': 'grey',
  'ev-tree': 'street', 'ev-tree-apple': 'apple', 'ev-pine': 'pine', 'ev-hilltree': 'hill',
};
Object.assign(PROP_CLASSES, {
  treeStreet: { h: [264, 580] },
  treeMature: { h: [540, 1100] },
  frontHouse: { h: [360, 520] }, // two or three storeys and a roof, at 132 px a storey
  frontShop: { h: [280, 420] }, // a 4 m shopfront and one storey over it
  doorHouse: { h: [96, 120] },
});
export const TREE_CLASS = { plane: 'treeMature', pine: 'treeMature', cypress: 'treeStreet', hill: 'treeStreet', street: 'treeStreet', apple: 'treePlay', grey: 'treeStreet', olive: 'treePlay' };

// play-plane fronts painted by src/art/buildingKit.js
export const FRONT_TABLE = {
  'pt-house_front': { storeys: 1, ground: 'house', bays: 3, cls: 'frontHouse' },
  'pt-cafe_front': { storeys: 1, ground: 'shop', bays: 4, cls: 'frontShop', roof: false },
  'ev-bakery': { storeys: 1, ground: 'shop', bays: 2, cls: 'frontShop', roof: false },
  'ev-door': { door: true, cls: 'doorHouse' },
};

// Every building row a backdrop paints, and the scroll factor of the layer it
// is painted for. The painters take their storey from facadeMetrics(s) of
// the entry; lint:scale checks storey = 132·s (± 10 %) and that a row nearer
// than the far skyline paints a ground line in front of it (the depth cue
// between Jo's street and the buildings behind it).
export const BACKDROP_ROWS = {
  'parallax.skyline': { s: 0.12, groundLine: false },
  'parallax.facade.mid': { s: 0.34, groundLine: true },
  'parallax.facade.near': { s: 0.62, groundLine: true },
  'evening.town': { s: 0.18, groundLine: false },
  'evening.near': { s: 0.25, groundLine: true },
};

// WP4 owns these now: measured by lint:scale (trees, fronts, the Evening's
// doors and lamps), so they are no longer exceptions
PROP_TABLE['ev-lamp'] = 'lampStreet';
for (const k of ['pt-plane_tree', 'pt-cypress', 'pt-tree_grey', 'ev-tree', 'ev-tree-apple', 'ev-pine', 'ev-hilltree', 'ev-door', 'ev-lamp', 'ev-bakery', 'pt-house_front', 'pt-cafe_front']) delete SCALE_EXCEPTIONS[k];

// Phase 3b (the Musician on the framework): the city rows ported into
// src/art/backdrops/painted.js, at the s their layers are placed at (ROW_S)
Object.assign(BACKDROP_ROWS, {
  'painted.city': { s: 0.12, groundLine: false },
  'painted.rain_city': { s: 0.12, groundLine: false },
  'painted.theatre': { s: 0.3, groundLine: true },
  'painted.fire_escape': { s: 0.5, groundLine: true },
});

// THE MASTER'S LADDER (the painter's dream on the framework): its people in
// era costume (looks in src/dreams/painter/people.js). A lucco or a gown is
// the skirt layer (dress); tunics stop at the thigh over coloured hose. And
// Fioralba's rows: the far roofs and towers, the near street of workshops.
Object.assign(CAST_BODIES, {
  'npc-rn-gualtiero': { body: 'elderly', sex: 'm', hair: 'grey', beard: true, dress: true },
  'npc-rn-bice': { sex: 'f', hair: 'long', dress: true },
  'npc-rn-orazio': { sex: 'm', beard: true, apron: true },
  'npc-rn-folco': { body: 'elderly', sex: 'm', hair: 'grey', dress: true },
  'npc-rn-consul': { body: 'elderly', sex: 'm', hair: 'bald', dress: true, beard: true },
  'npc-rn-corso': { sex: 'm', dress: true },
  'npc-rn-dori': { body: 'big', sex: 'm', beard: true, dress: true },
  'npc-rn-tonio': { body: 'teen', sex: 'm' },
  'npc-rn-woman': { sex: 'f', dress: true },
  'npc-rn-friar': { sex: 'm', dress: true, hair: 'bald' },
  'npc-rn-beggar': { body: 'elderly', sex: 'm', hair: 'grey', beard: true },
  'npc-rn-steward': { sex: 'm' },
  'foe-rn-rival': { body: 'teen', hat: 'berretta' },
  'foe-rn-inspector': { hat: 'toque', held: 'ledger', dress: true },
  'foe-rn-foreman': { body: 'big', hat: 'bandana' },
});
Object.assign(BACKDROP_ROWS, {
  'painted.rn_skyline': { s: 0.12, groundLine: false },
  'painted.rn_row': { s: 0.3, groundLine: true },
});

// THE LAST HAND (the gambler's dream on the framework): the Lantern Queen's
// people in 1884 costume (looks in src/dreams/gambler/people.js). A frock
// coat to the knee is the skirt layer (dress) on a man; Crake's long black
// coat too. Lou stands; the Judge is big; Mrs Fenn is old.
Object.assign(CAST_BODIES, {
  'npc-lq-lou': { sex: 'm', hat: 'planter', dress: true },
  'npc-lq-pell': { sex: 'm', hair: 'grey', beard: 'moustache', hat: 'peaked' },
  'npc-lq-voe': { body: 'big', sex: 'm', beard: true, hat: 'planter' },
  'npc-lq-sorrel': { sex: 'f', hair: 'bun', dress: true, hat: 'none' },
  'npc-lq-nico': { body: 'teen', sex: 'm', hat: 'bowler' },
  'npc-lq-fenn': { body: 'elderly', sex: 'f', dress: true, hat: 'veil' },
  'npc-lq-dev': { body: 'teen', sex: 'm', hat: 'beanie' },
  'npc-lq-dealer': { sex: 'm', beard: 'moustache', hat: 'peaked' },
  'npc-lq-casekeeper': { body: 'elderly', sex: 'm', hair: 'bald', hat: 'none' },
  'npc-lq-steward': { sex: 'm', hat: 'none', hair: 'crop' },
  'npc-lq-pianist': { sex: 'm', hat: 'none' },
  'npc-lq-banjo': { sex: 'm', hat: 'bowler' },
  'npc-lq-drummer': { body: 'teen', sex: 'm', hat: 'none' },
  'npc-lq-clarinet': { body: 'elderly', sex: 'm', hair: 'grey', hat: 'none' },
  'npc-lq-pilot': { sex: 'm', beard: true, hat: 'peaked' },
  'npc-lq-porter': { body: 'big', sex: 'm', hat: 'cap' },
  'npc-lq-lady': { sex: 'f', dress: true, hat: 'veil' },
  'npc-lq-clerk': { sex: 'm', hat: 'bowler' },
  'foe-lq-crake': { sex: 'm', hat: 'silk', dress: true },
});
