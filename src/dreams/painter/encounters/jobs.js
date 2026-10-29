// THE MASTER'S LADDER's four jobs: one engine (src/engines/craft.js: a brush
// sweeps a bar, press on the gold mark; plaster may be the clock) and one
// presenter ('craft' in src/play/craftPresenter.js), staged at the work.
// The craft grows across the dream, rung by rung:
//   grind        errand boy → apprentice: crush, grind, wash, temper (slow, wide)
//   drapery      apprentice → assistant: gesso, gold ground, the mantle in
//                ultramarine, the fold, the light (the altarpiece fills in)
//   masterpiece  assistant → master: a head and a hand before the consuls
//   giornata     the contest: the vault bay in one day of wet plaster,
//                against Maestro Dori's bay; Bice paints the face
import { craft } from '../../../engines/craft.js';
import { paintAltarpiece, paintPanel, paintVault } from '../works.js';
import { altarWorkOffset } from '../rooms/bottega.js';
import { VAULT } from '../rooms/chapel.js';
import { GIORNATA_STEPS, showContract, contractLeft } from '../contract.js';

const KEYS = ['act1'];

export const grind = {
  id: 'grind',
  title: 'THE SLAB',
  engine: craft,
  params: {
    speed: 0.55,
    zone: 0.24,
    steps: [{ label: 'crush the green earth' }, { label: 'grind it fine as flour' }, { label: 'wash it in the bowl' }, { label: 'temper it with the yolk' }],
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
  params: {
    speed: 0.65,
    zone: 0.2,
    steps: [{ label: 'a last coat of gesso' }, { label: 'the gold ground, over red bole' }, { label: 'the mantle, in ultramarine' }, { label: 'the fold, from the knee' }, { label: 'the light, along the ridges' }],
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

export const masterpiece = {
  id: 'masterpiece',
  title: 'THE TEST PIECE',
  engine: craft,
  params: {
    speed: 0.75,
    zone: 0.17,
    steps: [{ label: 'gesso the panel' }, { label: 'the drawing, in silverpoint' }, { label: 'green earth under the flesh' }, { label: 'the flesh, warm over cool' }, { label: 'the mantle, in ultramarine' }, { label: 'the halo, in gold' }],
  },
  presenter: 'world',
  view: 'craft',
  camera: { zoom: 1.25 },
  keys: KEYS,
  pose: 'brush_hold',
  // the panel stands on its trestle on the dais (guild.js)
  work: { w: 96, h: 120, dx: 0, dy: 143, depth: -10.5, paint: (ctx, w, h, k) => paintPanel(ctx, w, h, k) },
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
  params: { speed: 0.8, zone: 0.16, clock: 9000, rival: { ms: 52000 }, steps: GIORNATA_STEPS },
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
  },
  onWin: 'contest_done',
};
