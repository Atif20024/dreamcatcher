// The season's order, and what nuts buy. Pure: tests/racerSeason.test.js.
//
// HOOKS are the four races in the story's order. `eve` is the word at the shutter the
// first time Jo takes her out for that race (dialogue.js). The Coppa's hook is not
// `race4`: a run from before the four-race season may hold done_race4 and done_race5
// for stand-ins it drove, and they must not count as the Coppa won.
export const HOOKS = [
  { id: 'race1', story: 'Pinewood hill-climb', track: 'pinewood', needs: [] },
  { id: 'race2', story: 'Harbour Night Cup', track: 'harbour', needs: ['tyres_settled'], eve: 'harbour_eve' },
  { id: 'race3', story: 'The Salt Road Cup', track: 'salt', needs: ['gloves_left', 'jars_done', 'signed'], eve: 'salt_eve' },
  { id: 'coppa', story: 'The Coppa Calvessa', track: 'coppa', needs: ['garage_again', 'chalked', 'pit_drilled'], eve: 'coppa_eve' },
];
export const doneOf = (hook) => `done_${hook}`;
// what can still owe a prize: the four, and a stand-in's from an old run (flags only: no track is needed)
export const PRIZE_TRACKS = [...HOOKS.map((h) => h.track), 'test'];

// the race due now, or null (something in Jo's life comes first)
export function nextHook(F) {
  const h = HOOKS.find((x) => !F[doneOf(x.id)]);
  return h && h.needs.every((n) => F[n]) ? h : null;
}

// the door: which track it opens, and the hook it counts for
export function atTheDoor(F) {
  const h = nextHook(F);
  return { track: h ? h.track : null, pending: h ? h.id : null };
}

// the shutter stays down, and Jo knows why (the road is not a thing to do instead)
export function notYet(F) {
  if (F.done_coppa) return 'She has done enough. So have I.';
  if (!F.done_race2) return 'Aldo wants a word first. He is not a man who asks twice.';
  if (!F.gloves_left) return 'His gloves first. The road will still be there.';
  if (!F.jars_done) return 'Not yet. There is a tin on a dresser, up the quay, and Ottavia asked.';
  if (!F.signed) return 'On what money? Sable Oil first, over the cafe.';
  if (!F.garage_again) return 'Ottavia has not stopped looking at me. Her first.';
  if (!F.chalked) return 'The Coppa is nine days off. I walk the Bend first, on foot.';
  return 'The crew has not drilled the stop. The pit lane, along the quay.';
}

// ---- the goal, wherever Jo stands (dream.objectives holds the words) ------------
export const SEASON_GOALS = [
  { text: 'tune' },
  { text: 'drive_pinewood', flag: 'tuned' },
  { text: 'aldo', flag: 'done_race1' },
  { text: 'drive_harbour', flag: 'tyres_settled' },
  { text: 'take_gloves', flag: 'done_race2' },
  { text: 'to_hospital', flag: 'item:gloves' },
  { text: 'to_kitchen', flag: 'gloves_left' },
  { text: 'to_sable', flag: 'jars_done' },
  { text: 'drive_salt', flag: 'signed' },
  { text: 'ottavia_again', flag: 'done_race3' },
  { text: 'to_sable', flag: 'done_race3', unless: 'signed' }, // (an old run drove its stand-in before Sable's door)
  { text: 'to_gull', flag: 'garage_again' },
  { text: 'to_pit', flag: 'chalked' },
  { text: 'to_gull', flag: 'pit_drilled', unless: 'chalked' },
  { text: 'coppa', flag: ['chalked', 'pit_drilled'] },
  { text: 'coppa_again', flag: ['chalked', 'pit_drilled', 'race_coppa_tries'] },
  { text: 'the_note', flag: 'done_coppa' },
];
// the season from `text` on: what a room's own goals hand over to
export const goalsFrom = (text) => SEASON_GOALS.slice(SEASON_GOALS.findIndex((g) => g.text === text));

// the slate on the garage wall: how far he has come, in chalk
export function slateRows(F) {
  const row = (name, v) => `${name.padEnd(10)}${v}`;
  const place = (id) => (F[`race_${id}_passed`] ? `P${F[`race_${id}_best`]}` : '');
  return [
    'THE SEASON',
    row('PINEWOOD', F.race_pinewood_passed ? `0:${Number(F.race_pinewood_time).toFixed(1)}` : ''),
    row('HARBOUR', F.done_race2 ? 'no finish' : ''),
    row('SALT ROAD', place('salt') || (F.done_race3 ? 'run' : '')),
    row('COPPA', place('coppa') || (F.garage_again ? 'nine days' : '')),
  ].join('\n');
}

// the ledger: the win first, then what it cost, the note last. Nothing here is a loss
export function endingLines(F) {
  const roche = F.helped_cassian ? 'He stopped for Roche, six seconds, and won by less.' : F.passed_cassian ? 'He went by Roche. Roche was on his feet. He would say so, later.' : 'Roche lost a wheel at the Gull Bend, and the road went on.';
  const home = F.rent_short ? 'The rent was late, and the Signora never said.' : 'The rent was paid.';
  const paper = F.broke_orders ? 'He passed Dante with HOLD on the board, and Sable kept his fifth.' : F.sable_whole ? "Sable's clauses stood, every one." : 'He read the paper. Almost nobody reads the paper.';
  return [
    'The Coppa Calvessa, 1958: Pereval Corse, first.',
    roche,
    `${home} ${paper}`,
    ...(F.roche_burnt ? ['The Roche letter went in the stove.'] : F.roche_kept ? ['The Roche letter stayed in his pocket, unanswered.'] : []),
    'Up the hill he asked about the tide, then who won.',
    'Ottavia heard the note before the flag. Dead on.',
    'Forty years on she hears it, and now somebody asks.',
  ];
}

// ---- what nuts buy: tyres and chalk, never speed ------------------------------
// (nuts, not worth: a nut is worth 3 in the wallet, dreams.js)
export const PRICES = { soft: 32, chalk: 20 }; // (the advance and the prizes need somewhere to go)
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
    a: { text: 'The car shall carry the name of Sable Oil on her bonnet.', short: 'The name on her bonnet', binds: 'sable_name', pays: 2 },
    b: { text: 'The driver shall hold station when the team so directs.', short: 'Hold station when directed', binds: 'sable_orders', pays: 10 },
  },
  {
    id: 'money',
    title: 'SABLE OIL: THE MONEY',
    a: { text: 'One fifth of all prize money is payable to the Company.', short: 'A fifth of all prize money', binds: 'sable_cut', pays: 10 },
    b: { text: "The driver shall attend the Company's dinners, in a clean shirt.", short: 'The dinners', binds: 'sable_dinners', pays: 2 },
  },
  {
    id: 'garage',
    title: 'SABLE OIL: THE GARAGE',
    // (the small clause with a real cost: thin oil, she runs hot at the end. race/car.js)
    a: { text: 'The car shall burn Sable oil and no other.', short: 'Sable oil and no other', binds: 'oil_sable', pays: 2 },
    b: { text: 'The Company may call in the debts of Pereval Corse at thirty days.', short: "Pereval's debts at thirty days", binds: 'sable_lien', pays: 10 },
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
