// THE MASTER'S LADDER's four jobs: one engine (src/engines/craft.js: a brush
// sweeps a bar, press on the gold mark; plaster may be the clock) and one
// presenter ('craft' in src/play/craftPresenter.js), staged at the work.
// The craft grows across the dream, rung by rung:
// Each job plays its own way (the step modes in src/engines/craft.js):
//   grind        errand boy → apprentice: crush (mash), grind (hold), wash,
//                temper (hold): slow and wide; a miss is gravel in the flour
//   drapery      apprentice → assistant: gesso, gold ground, the mantle in
//                ultramarine, then two-mark folds: from the knee, then it
//                breaks (Bice's lesson widens the second mark); a slack fold
//                is rope at the hem
//   masterpiece  assistant → master: a head and a hand before the consuls;
//                Jo carries two of three materials, a miss on its step spends
//                it, and Folco's verdict says what the panel lacks
//   giornata     the contest: the vault bay in one day of wet plaster,
//                against Maestro Dori's bay; Bice paints the face
import { craft } from '../../../engines/craft.js';
import { paintAltarpiece, paintPanel, paintVault } from '../works.js';
import { altarWorkOffset } from '../rooms/bottega.js';
import { VAULT } from '../rooms/chapel.js';
import { GIORNATA_STEPS, showContract, contractLeft, showKit } from '../contract.js';
import { TEST_STEPS, testStock, trialLost, KITS, MATERIAL_NAMES } from '../logic.js';

const KEYS = ['act1'];

export const grind = {
  id: 'grind',
  title: 'THE SLAB',
  engine: craft,
  params: {
    speed: 0.55,
    zone: 0.24,
    steps: [
      { label: 'crush the green earth', mode: 'mash', need: 5, at: 0.5, zone: 0.5, speed: 0.4 },
      { label: 'grind it fine', mode: 'hold', at: 0.62, zone: 0.24, speed: 0.45 },
      { label: 'wash it in the bowl', at: 0.35 },
      { label: 'temper with yolk', mode: 'hold', at: 0.78, zone: 0.2, speed: 0.45 },
    ],
  },
  presenter: 'world',
  view: 'craft',
  camera: { zoom: 1.3 },
  keys: KEYS,
  pose: 'interact',
  onWin: 'ground_done',
};

const altar = altarWorkOffset();
export const drapery = {
  id: 'drapery',
  title: 'THE ALTARPIECE',
  engine: craft,
  // Bice told Jo where it breaks: the second mark is wider if he went up to the loft
  params: (F) => {
    const zone2 = F.met_bice ? 0.26 : 0.16;
    return {
      speed: 0.65,
      zone: 0.2,
      steps: [
        { label: 'a last coat of gesso' },
        { label: 'the gold ground, over red bole' },
        { label: 'the mantle, in ultramarine' },
        { label: 'the fold', mode: 'double', at: 0.3, at2: 0.68, zone2, hint: 'from the knee [E], then it breaks [E]' },
        { label: 'the light', mode: 'double', at: 0.24, at2: 0.76, zone2, hint: 'along the ridge [E], and off it [E]' },
      ],
    };
  },
  presenter: 'world',
  view: 'craft',
  camera: { zoom: 1.2 },
  keys: KEYS,
  pose: 'brush_hold',
  // the panel on the altarpiece fills in as the steps are done
  work: { w: Math.round(altar.w), h: Math.round(altar.h), dx: altar.dx, dy: altar.dy, depth: -10.5, paint: (ctx, w, h, k) => paintAltarpiece(ctx, 0, 0, w, h, k) },
  onWin: 'drapery_done',
};

// what the panel lacks, for its painter (set when the job starts and as it is played)
let panelLost = [];
export const masterpiece = {
  id: 'masterpiece',
  title: 'THE TEST PIECE',
  engine: craft,
  params: (F) => {
    panelLost = trialLost(F.test_kit);
    return { speed: 0.75, zone: 0.17, steps: TEST_STEPS, stock: testStock(F.test_kit) };
  },
  presenter: 'world',
  view: 'craft',
  camera: { zoom: 1.25 },
  keys: KEYS,
  pose: 'brush_hold',
  // the panel stands on its trestle on the dais (guild.js)
  work: { w: 96, h: 120, dx: 0, dy: 143, depth: -10.5, paint: (ctx, w, h, k) => paintPanel(ctx, w, h, k, panelLost) },
  // the store on the HUD; what is wasted is remembered for Folco's verdict
  onRender(scene, st) {
    const kit = scene.F.test_kit;
    scene.F.test_wasted = st.wasted;
    panelLost = trialLost(kit, st.wasted);
    showKit((KITS[kit] || KITS.ug).map((m) => `${MATERIAL_NAMES[m]} ${st.stock[m] > 0 ? 'I' : 'SPENT'}`));
  },
  onWin: 'master_done',
};

// the vault bay: sections of plaster laid one at a time (the clock refills
// for each); the contract's ultramarine and gold are spent on their steps
const vw = VAULT.w * 32;
const vh = VAULT.h * 32;
export { GIORNATA_STEPS };
export const giornata = {
  id: 'giornata',
  title: 'THE GIORNATA',
  engine: craft,
  params: (F) => {
    F.dori_done = false; // each attempt is a new day of plaster
    return { speed: 0.8, zone: 0.16, clock: 9000, rival: { ms: 52000 }, steps: GIORNATA_STEPS };
  },
  presenter: 'world',
  view: 'craft',
  camera: { zoom: 0.95 },
  keys: KEYS,
  pose: 'brush_hold',
  rivalLabel: "DORI'S BAY",
  // the bay is painted over the bare vault, exactly where the prop is
  work: { w: vw, h: vh, dx: VAULT.x * 32 + vw / 2 - (28 * 32 + 16), dy: VAULT.y * 32 + vh / 2 - (10 * 32 + 16), depth: -10.5, paint: (ctx, w, h, k, n) => paintVault(ctx, w, h, k, n) },
  canLeave: false,
  // every frame of the contest: the contract is spent stroke by stroke, the
  // lute pulse comes in and the tempo climbs from 60 to 84
  onRender(scene, st) {
    showContract(contractLeft(st.idx));
    if (scene.music) {
      scene.music.setState('setpiece');
      scene.music.setBpm(60 + Math.round((24 * st.idx) / Math.max(1, st.n)));
    }
    // his bar means something: he finishes, and says so
    if (st.rival >= 1 && !scene.F.dori_done) {
      scene.F.dori_done = true;
      scene.caption.say('dori', 'Done, boy. Take your time.', { ms: 3000 });
    }
  },
  onWin: 'contest_done',
};
