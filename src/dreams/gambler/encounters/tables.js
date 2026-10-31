// THE LAST HAND's encounters: the slate on the quay, the faro bank in the
// saloon, the three card tables and the last table in the pilot house. The
// engines are pure (src/engines/slate.js, faro.js, showdown.js); the
// presenters are this dream's own (../table.js, registered in
// src/play/encounterPresenters.js as lq_slate, lq_faro and lq_cards). The
// purse lives in the run's flags (F.purse) and every table starts from it.
//   t1  the Judge alone: one loud tell (he hums)
//   t2  Madame Sorrel and Nico Tarn: a subtle tell and a decoy
//   t3  all three, and Lou's first tip there is wrong
//   lasthand  kings and nines for both; STAND UP is the only way out
import { slate } from '../../../engines/slate.js';
import { faro } from '../../../engines/faro.js';
import { showdown } from '../../../engines/showdown.js';
import { newPurse } from '../../../engines/purse.js';

const KEYS = ['act1', 'confirm'];
// a seed per sitting: the deal differs each time Jo sits down, the same run
// replays the same (the harness can name one: F._seed)
let sittings = 0;
const seedOf = (F, base) => (F._seed ?? 0) * 101 + base + (sittings += 1) * 17;

const purse = (F) => F.purse || (F.purse = newPurse());

export const slateEnc = {
  id: 'slate',
  title: 'THE SLATE',
  engine: slate,
  params: {},
  view: 'lq_slate',
  camera: { zoom: 1.35 },
  keys: KEYS,
  pose: 'interact',
  // the three numbers become the night's purse (a fresh $100 of Lou's)
  onResult(scene, r) {
    const old = scene.F.purse || {};
    scene.F.purse = { ...newPurse({ buyin: r.buyin, stop: r.stop, goal: r.goal }), comps: old.comps || 0 };
    scene.F._t0 = scene.time.now;
  },
  onWin: 'slate_done',
};

export const faroEnc = {
  id: 'faro',
  title: 'THE FARO BANK',
  engine: faro,
  // forty of the stack goes to the bank; a comp may stake the first bet
  params: (F) => ({ bank: 40, target: 80, seed: seedOf(F, 3), freeFirst: !!F.faro_free && !F.faro_free_used }),
  view: 'lq_faro',
  camera: { zoom: 1.3 },
  keys: KEYS,
  pose: 'sit',
  onResult(scene, r) {
    const p = purse(scene.F);
    const st = r;
    p.stack += (st.bank ?? 40) - 40;
    p.turns += st.turns || 0;
    p.rake += st.rake || 0;
    if (scene.F.faro_free && (st.bets || 0) > 0) scene.F.faro_free_used = true;
  },
  onWin: 'faro_done',
  onFail: (r) => (r.bust ? 'faro_bust' : null),
};

function table(id, seats, { params: more = {}, ...extra } = {}) {
  return {
    id,
    title: 'SHOWDOWN',
    engine: showdown,
    params: (F) => {
      const p = purse(F);
      return { seats, stack: p.stack, tilt: p.tilt, buyin: p.buyin, seed: seedOf(F, seats.length * 7 + 1), ...more };
    },
    view: 'lq_cards',
    flag: `${id}_won`,
    camera: { zoom: 1.25 },
    keys: KEYS,
    pose: 'sit',
    onWin: 'table_won',
    onFail: (r) => (r.bust ? 'bust' : null),
    ...extra,
  };
}

export const t1 = table('t1', ['judge']);
export const t2 = table('t2', ['sorrel', 'nico']);
export const t3 = table('t3', ['judge', 'sorrel', 'nico'], { params: { lou: { wrongEvery: 4, firstWrong: true } } });

export const lasthand = {
  ...table('lasthand', ['judge'], { params: { mode: 'final', lou: null } }),
  title: 'THE LAST TABLE',
  flag: null,
  camera: { zoom: 1.3 },
  canLeave: false, // up, or play: there is no walking off this one
  onWin: 'stood_up',
  onFail: (r) => (r.lostNight ? 'lost_night' : null),
};
