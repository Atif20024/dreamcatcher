// The season's order, and what nuts buy. Pure: tests/racerSeason.test.js.
//
// HOOKS are where a race belongs in the story (design §5). The six races wait for
// the owner's first drive, so every hook is a STAND-IN: the door runs the existing
// test road, and finishing it opens what comes next. To hook a real race: give the
// entry its own track id in place of STAND_IN, and a gate if it has one.
// The Coppa (race 6) has no hook: the dream stops before it, and stays `unfinished`.
export const STAND_IN = 'test';
export const HOOKS = [
  { id: 'race1', story: 'Pinewood hill-climb', track: 'pinewood', needs: [] },
  { id: 'race2', story: 'Harbour Night Cup', track: STAND_IN, needs: ['tyres_settled'] },
  { id: 'race3', story: 'Gull Bend return', track: STAND_IN, needs: ['gloves_left', 'jars_done'] },
  { id: 'race4', story: 'The Salt Road', track: STAND_IN, needs: ['signed'] },
  { id: 'race5', story: 'The Terraces in rain', track: STAND_IN, needs: ['garage_again'] },
];
export const doneOf = (hook) => `done_${hook}`;

// the race the door would count for now, or null (nothing due: the road is only a road)
export function nextHook(F) {
  const h = HOOKS.find((x) => !F[doneOf(x.id)]);
  return h && h.needs.every((n) => F[n]) ? h : null;
}

// the door: which track it opens, and the hook it would count for
export function atTheDoor(F) {
  const h = nextHook(F);
  return { track: h ? h.track : STAND_IN, pending: h ? h.id : null };
}

// ---- the goal, wherever Jo stands (dream.objectives holds the words) ------------
export const SEASON_GOALS = [
  { text: 'tune' },
  { text: 'drive', flag: 'tuned' },
  { text: 'aldo', flag: 'done_race1' },
  { text: 'drive', flag: 'tyres_settled' },
  { text: 'take_gloves', flag: 'done_race2' },
  { text: 'to_hospital', flag: 'item:gloves' },
  { text: 'to_kitchen', flag: 'gloves_left' },
  { text: 'drive', flag: 'jars_done' },
  { text: 'to_sable', flag: 'done_race3' },
  { text: 'drive', flag: 'signed' },
  { text: 'ottavia_again', flag: 'done_race4' },
  { text: 'drive', flag: 'garage_again' },
  { text: 'to_gull', flag: 'done_race5' },
  { text: 'to_pit', flag: 'chalked' },
  { text: 'written', flag: 'pit_drilled' },
];

// ---- what nuts buy: tyres and chalk, never speed ------------------------------
// (nuts, not worth: a nut is worth 3 in the wallet, dreams.js)
export const PRICES = { soft: 24, chalk: 16 };
const TYRE_JAR_OFF = 2; // each coin in the kitchen's tyre jar takes this off the soft set …
const SOFT_FLOOR = 12; // … down to this

export const softPrice = (F) => Math.max(SOFT_FLOOR, PRICES.soft - (F.jar_tyres || 0) * TYRE_JAR_OFF);

// ---- the kitchen's tin ---------------------------------------------------------
// twelve coins and three jars that want sixteen: something goes short
export const TIN = 12;
export const JARS = [
  { id: 'rent', label: 'RENT', wants: 6 },
  { id: 'tyres', label: 'TYRES', wants: 6 },
  { id: 'medicine', label: 'MEDICINE', wants: 4 },
];
export const tinLeft = (F) => TIN - JARS.reduce((n, j) => n + (F[`jar_${j.id}`] || 0), 0);
export const short = (F, id) => (F[`jar_${id}`] || 0) < JARS.find((j) => j.id === id).wants;

// ---- Mr Sable's three papers ---------------------------------------------------
// strike one clause on each. What a clause left standing pays now is what it costs later
export const PAPERS = [
  {
    id: 'team',
    title: 'SABLE OIL: THE TEAM',
    a: { text: 'The driver shall hold station when the team so directs.', short: 'Hold station when directed', binds: 'sable_orders', pays: 10 },
    b: { text: 'The car shall carry the name of Sable Oil on her bonnet.', short: 'The name on her bonnet', pays: 2 },
  },
  {
    id: 'money',
    title: 'SABLE OIL: THE MONEY',
    a: { text: 'One fifth of all prize money is payable to the Company.', short: 'A fifth of all prize money', binds: 'sable_cut', pays: 10 },
    b: { text: "The driver shall attend the Company's dinners, in a clean shirt.", short: 'The dinners', pays: 2 },
  },
  {
    id: 'garage',
    title: 'SABLE OIL: THE GARAGE',
    a: { text: 'The Company may call in the debts of Pereval Corse at thirty days.', short: "Pereval's debts at thirty days", binds: 'sable_lien', pays: 10 },
    b: { text: 'The car shall burn Sable oil and no other.', short: 'Sable oil and no other', pays: 2 },
  },
];

// what the papers do, from the strikes: F.strike_<paper> is 'a', 'b' or 'none'.
// The clause struck pays nothing; every clause left standing pays, and binds.
export function signPapers(F) {
  const out = { advance: 0, binds: [] };
  for (const p of PAPERS) {
    for (const c of ['a', 'b']) {
      if (F[`strike_${p.id}`] === c) continue;
      out.advance += p[c].pays;
      if (p[c].binds) out.binds.push(p[c].binds);
    }
  }
  return out;
}
