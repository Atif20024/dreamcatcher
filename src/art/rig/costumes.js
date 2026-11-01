// Who wears what (fix list items 2 and 3 of docs/redesign/advice/fresh_review_art.md):
// each character's costume layers (the rig's parts.over), a face that is not
// everybody's face, and a signature prop, keyed by the bake's texture key.
// Shape carries the era and the job, colour only helps. Pure data and small
// pure helpers: cast.js applies it.

// a face: patches on the 9×9 cast head. [row, col, letters]. Hat and hair stay.
const FACES = {
  plain: [],
  snub: [[4, 8, '.'], [5, 8, '.']],
  hook: [[4, 8, '.'], [6, 8, 's']],
  long: [[7, 2, 'tsSSSSs'], [6, 8, '.']],
  heavy: [[3, 4, 'aaaa']],
  round: [[6, 1, 'ssSSS'], [7, 1, 'tsSSSs']],
  thin: [[6, 2, '.s'], [7, 2, '.ts']],
};
const FACE_NAMES = Object.keys(FACES);
export function faceRows(rows, name) {
  let out = rows;
  for (const [r, c, str] of FACES[name] || []) out = out.map((x, i) => (i === r ? x.slice(0, c) + str + x.slice(c + str.length) : x));
  return out;
}

// ---- costume layers ----------------------------------------------------------
// Built on the character's own torso grid, so one badge fits every body. A torso
// layer has the torso's rows; `f` is the last cloth column of a row (the front
// edge), `b` the first (the back). Letters are the rig's: W/w trim, K belt,
// u brass, i white, y/r band, Z/A/x the prop's colours.
const belted = (rows) => rows.findIndex((r) => r.includes('K') || r.includes('u'));
const front = (r) => r.length - 1 - [...r].reverse().findIndex((c) => c !== '.');
const back = (r) => [...r].findIndex((c) => c !== '.');
function torsoLayer(rows, paint) {
  const px = rows.map((r) => [...r].map(() => '.'));
  const set = (row, col, ch) => {
    if (row >= 0 && row < rows.length && col >= 0 && rows[row][col] && rows[row][col] !== '.') px[row][col] = ch;
  };
  paint(set, belted(rows) < 0 ? rows.length - 2 : belted(rows));
  return { rows: px.map((r) => r.join('')), torso: true };
}
const TORSO_LAYERS = {
  // a brass badge on the chest
  badge: (R) => (set) => {
    set(3, front(R[3]) - 3, 'u');
    set(4, front(R[3]) - 3, 'u');
  },
  // epaulette: a brass pixel run on the near shoulder
  epaulette: (R) => (set) => {
    for (let c = back(R[2]) + 1; c < back(R[2]) + 4; c++) set(1, c, 'u');
  },
  // the white cross-belt, shoulder to hip
  crossbelt: (R) => (set, belt) => {
    const c0 = front(R[1]) - 1;
    const c1 = back(R[belt - 1]) + 1;
    for (let r = 0; r < belt; r++) set(r, Math.round(c0 + ((c1 - c0) * r) / (belt - 1)), 'i');
  },
  // a chain of office: the same line in brass, on both shoulders
  chain: (R) => (set, belt) => {
    const mid = Math.floor(belt / 2);
    for (let r = 0; r <= mid; r++) {
      set(r, front(R[1]) - 1 - r, 'u');
      set(r, back(R[1]) + 1 + r, 'u');
    }
  },
  // a broad white uniform belt with its buckle
  whitebelt: (R) => (set, belt) => {
    for (let c = back(R[belt]); c <= front(R[belt]); c++) set(belt, c, c === front(R[belt]) - 1 ? 'u' : 'i');
  },
  // a shirt collar and dark tie: the landmark on a black coat
  tie: (R) => (set, belt) => {
    const c = front(R[2]) - 2;
    set(0, c, 'i');
    set(0, c + 1, 'i');
    set(1, c - 1, 'i');
    set(1, c, 'i');
    set(1, c + 1, 'i');
    for (let r = 2; r < belt - 1; r++) {
      set(r, c - 1, 'i');
      set(r, c, r < 3 ? 'y' : 'r');
    }
  },
  // the same, cravat-white for the frock coats
  cravat: (R) => (set) => {
    const c = front(R[2]) - 2;
    for (let r = 0; r < 4; r++) for (const d of [-1, 0, 1]) set(r, c + d, r < 3 ? 'i' : d ? '.' : 'i');
  },
  // lapels: a lit fold down the coat's open front
  lapel: (R) => (set) => {
    const c = front(R[2]) - 2;
    set(1, c - 1, 'I');
    set(2, c - 2, 'I');
    set(3, c - 2, 'j');
    set(4, c - 1, 'j');
  },
  // a waistcoat front in the trim colour with brass buttons
  waistcoat: (R) => (set, belt) => {
    const c = front(R[2]) - 1;
    for (let r = 2; r < belt; r++) {
      set(r, c, 'W');
      set(r, c - 1, 'W');
      set(r, c - 2, r % 2 ? 'u' : 'W');
    }
  },
  // the bib of an apron and its strap
  bib: (R) => (set, belt) => {
    for (let r = 2; r <= belt; r++) for (let c = front(R[r]) - 3; c <= front(R[r]); c++) set(r, c, c === front(R[r]) ? 'w' : 'i');
    set(0, front(R[1]) - 2, 'w');
    set(1, front(R[1]) - 3, 'w');
  },
  // a towel over the shoulder
  towel: (R) => (set) => {
    const c = back(R[1]);
    for (let r = 0; r < 5; r++) {
      set(r, c + 1, 'i');
      set(r, c, r > 2 ? 'w' : 'i');
    }
  },
  // the signature colour block at the throat and chest (the band's letters)
  scarf: (R) => (set) => {
    const c = front(R[1]);
    for (let col = back(R[1]); col <= c; col++) set(1, col, col % 2 ? 'r' : 'y');
    for (let col = back(R[0]); col <= front(R[0]); col++) set(0, col, 'y');
    set(2, c - 2, 'y');
    set(2, c - 3, 'y');
    set(3, c - 3, 'r');
  },
  // a shawl: over the shoulders and down the back
  shawl: (R) => (set, belt) => {
    for (let r = 0; r < belt - 2; r++) {
      const width = Math.max(1, 7 - r);
      for (let col = back(R[r]); col < back(R[r]) + width; col++) set(r, col, col === back(R[r]) ? 'Z' : r > 2 && col % 2 ? 'x' : 'A');
    }
  },
};
// hanging layers, anchored on the hips (ox = the hip column, oy rows above it)
const HIP_LAYERS = {
  // coat tails behind the legs: they swing
  tails: { rows: ['IJJj....', 'IJJj....', 'IJj.....', 'Jjj.....', 'jj......', 'jj......'], ox: 5, oy: 1, trail: true },
  // a bustle at the small of the back
  bustle: { rows: ['.IJ', 'IJJ', 'IJj', 'jj.'], ox: 6, oy: 0, trail: true },
  // an apron's skirt, front of the thighs
  apron: { rows: ['..iiiiw', '..iiiiw', '..iiiiw', '..iiiiw', '..iiiiw', '..wwwww'], ox: 3, oy: 0, trail: true },
  // a leather apron
  leather: { rows: ['..FFFFf', '..FFFFf', '..FFFFf', '..FFFFf', '..FFFFf', '..fffff'], ox: 3, oy: 0, trail: true },
  // keys at the belt
  keys: { rows: ['.u.', 'u.u', '.u.'], ox: -1, oy: -1 },
  // a truncheon at the hip
  truncheon: { rows: ['K', 'K', 'K', 'K', 'K', 'K'], ox: 3, oy: 0 },
  // a holster
  holster: { rows: ['KK', 'KK', 'K.'], ox: 3, oy: 0 },
};
export function costumeLayers(names = [], torsoRows) {
  const out = [];
  for (const n of names) {
    if (TORSO_LAYERS[n]) out.push(torsoLayer(torsoRows, TORSO_LAYERS[n](torsoRows)));
    else if (HIP_LAYERS[n]) out.push(HIP_LAYERS[n]);
  }
  return out;
}

// ---- the cast ----------------------------------------------------------------
const ORANGE = { y: 0xe0802a, r: 0xb85a1e, n: 0x84401a }; // the scalper's block (X-red stays the alert's)
const RED = { y: 0xc8423a, r: 0x9a2c30, n: 0x6a2028 };
const GOLD = { y: 0xd8a840, r: 0xa87a28, n: 0x7a5820 };
export const COSTUMES = {
  // foes: a uniform reads at a glance
  'foe-bouncer': { hat: 'earpiece', hair: 'crop', face: 'heavy', over: ['tie'], pal: RED },
  'foe-lounge-bouncer': { hat: 'earpiece', hair: 'bald', face: 'heavy', over: ['tie'], pal: GOLD },
  'foe-floor-security': { face: 'heavy', over: ['badge', 'epaulette', 'whitebelt'] },
  'foe-security': { face: 'long', over: ['badge', 'epaulette', 'whitebelt'], tallBoots: true },
  'foe-guard': { face: 'snub', over: ['badge', 'epaulette', 'holster'], tallBoots: true },
  'foe-gendarme': { hat: 'kepi', face: 'long', over: ['crossbelt', 'whitebelt', 'truncheon'], tallBoots: true, pal: { y: 0xd8a840, r: 0xa87a28, n: 0x7a5820 } },
  'foe-scalper': { face: 'hook', over: ['scarf'], pal: ORANGE },
  'foe-runner': { face: 'thin', over: ['waistcoat'] },
  'foe-landlady': { face: 'hook', over: ['bib', 'apron', 'keys'] },
  'foe-collector': { face: 'thin', over: ['tie', 'tails'], pal: RED },
  'foe-manager': { face: 'round', over: ['tie', 'lapel'], pal: RED },
  'foe-proofreader': { face: 'thin', over: ['lapel'] },
  'foe-sous-chef': { hat: 'chef_toque', face: 'round', over: ['bib', 'apron', 'towel'] },
  'foe-dock-hand': { face: 'snub', over: ['scarf'], pal: RED },
  'foe-roadie': { face: 'heavy', over: ['keys'] },
  'foe-heckler': { face: 'round', over: ['scarf'], pal: GOLD },
  'foe-talker': { face: 'round', over: ['waistcoat'] },
  'foe-petitioner': { face: 'long', over: ['tie'], pal: RED },
  'foe-gardener': { face: 'thin', over: ['leather'] },
  'foe-farmer': { face: 'heavy', over: ['leather'] },
  'foe-shopkeeper': { face: 'round', over: ['bib', 'apron'] },
  'foe-cleaner': { face: 'snub', over: ['keys'] },
  'foe-pit': { face: 'long', over: ['chain'], prop: 'cane' },
  'foe-rn-foreman': { face: 'heavy', over: ['leather', 'crossbelt'] },
  'foe-rn-porter': { face: 'round', over: ['leather'] },
  'foe-rn-inspector': { face: 'long', over: ['chain'] },
  'foe-rn-rival': { face: 'thin', over: ['lapel'] },
  'foe-lq-crake': { face: 'long', over: ['cravat'] },
  // the hub
  'hub-pemberton': { face: 'long', over: ['badge', 'epaulette', 'tie'], pal: RED },
  'hub-bilal': { face: 'round', over: ['bib', 'apron'] },
  'hub-busker': { face: 'thin', over: ['waistcoat', 'tails'] },
  'hub-sweeper': { face: 'heavy', over: ['leather'] },
  'hub-flower': { over: ['shawl'] },
  // the long evening
  'ev-p-baker': { face: 'round', over: ['bib'] },
  'ev-p-marcus': { face: 'heavy', over: ['tie', 'lapel'], pal: GOLD },
  'ev-p-marguerite': { face: 'round', over: ['bib', 'shawl'] },
  'ev-p-delphine': { face: 'hook', over: ['shawl'], prop: 'cane' },
  'ev-p-ray': { face: 'long', prop: 'cane' },
  'ev-p-hamid': { face: 'round', over: ['bib', 'apron'] },
  'ev-p-gardener': { face: 'thin', over: ['leather'] },
  'ev-p-adaeze': { face: 'long', over: ['shawl'] },
  'ev-p-fereshteh': { over: ['shawl'] },
  'ev-p-bike_man': { face: 'snub', over: ['scarf'], pal: RED },
  'ev-p-bastien': { face: 'snub', over: ['lapel'] },
  // the writer's dream
  'wr-p-landlady': { face: 'hook', over: ['bib', 'keys'] },
  'wr-p-emmerich': { face: 'long', over: ['waistcoat'], prop: 'cane' },
  'wr-p-tomasz': { face: 'heavy', over: ['leather'] },
  'wr-p-isolde': { over: ['shawl'] },
  // the master's ladder
  'npc-rn-gualtiero': { face: 'long', over: ['chain'] },
  'npc-rn-bice': { face: 'snub', over: ['bib'] },
  'npc-rn-orazio': { face: 'round', over: ['bib'] },
  'npc-rn-folco': { face: 'long', over: ['chain'] },
  'npc-rn-consul': { face: 'hook', over: ['chain'] },
  'npc-rn-corso': { face: 'round', over: ['chain'] },
  'npc-rn-dori': { face: 'heavy', over: ['chain'] },
  'npc-rn-tonio': { face: 'snub', over: ['bib', 'leather'] },
  'npc-rn-friar': { face: 'round', over: ['crossbelt'] },
  'npc-rn-beggar': { face: 'thin', prop: 'cane' },
  'npc-rn-steward': { face: 'long', over: ['lapel', 'tails'] },
  'npc-rn-inspector': { face: 'long', over: ['chain'] },
  // the last hand
  'npc-sh-watch': { face: 'long', over: ['waistcoat', 'chain'] },
  'npc-sh-pie': { face: 'round', over: ['bib', 'shawl'] },
  'npc-lq-lou': { face: 'thin', over: ['waistcoat', 'cravat'] },
  'npc-lq-pell': { face: 'long', over: ['badge', 'epaulette'] },
  'npc-lq-voe': { face: 'round', over: ['waistcoat', 'cravat'], prop: 'cane' },
  'npc-lq-sorrel': { over: ['badge', 'bustle'] },
  'npc-lq-nico': { face: 'snub', over: ['tie', 'lapel'], pal: RED },
  'npc-lq-fenn': { face: 'hook', over: ['shawl'], prop: 'cane' },
  'npc-lq-dev': { face: 'snub', over: ['scarf'], pal: RED },
  'npc-lq-dealer': { face: 'thin', over: ['waistcoat'] },
  'npc-lq-casekeeper': { face: 'hook', over: ['waistcoat'] },
  'npc-lq-steward': { face: 'long', over: ['bib', 'tails'] },
  'npc-lq-pianist': { face: 'long', over: ['lapel', 'tails'] },
  'npc-lq-banjo': { face: 'round', over: ['waistcoat'] },
  'npc-lq-drummer': { face: 'snub', over: ['waistcoat'] },
  'npc-lq-clarinet': { face: 'hook', over: ['lapel'] },
  'npc-lq-pilot': { face: 'heavy', over: ['badge', 'epaulette'] },
  'npc-lq-porter': { face: 'heavy', over: ['badge', 'scarf'], pal: RED },
  'npc-lq-lady': { over: ['shawl', 'bustle'] },
  'npc-lq-clerk': { face: 'thin', over: ['tie'], pal: RED },
};

// Anyone not named still gets a face of their own: the crowd stops being one
// man. A hash, so the choice is stable from build to build.
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function costumeFor(key, body) {
  if (/^(pt-p|gm-p)-/.test(key)) return null;
  const c = COSTUMES[key] || {};
  // the old walk with something to lean on
  const prop = c.prop || (!COSTUMES[key] && body === 'elderly' ? 'cane' : null);
  return { ...c, face: c.face || FACE_NAMES[hash(key) % FACE_NAMES.length], prop };
}
