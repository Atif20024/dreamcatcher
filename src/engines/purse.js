// The purse (pure logic, no Phaser): THE LAST HAND's money and nerve. Lou's
// last stake, the three numbers chalked on the slate, the TILT meter and the
// honest ledger the ending reads. Every table, the faro bank and the purser
// read and write one purse (it lives in the run's flags, F.purse).
//
//   const p = newPurse({ buyin: 100, stop: 60, goal: 140 });
//   win(p, 30, { rake: 2 }); lose(p, 10); tilt(p, 'bad_beat'); cool(p, 1000, true)
//   line(p) → 'below' | 'between' | 'goal'
//
// TILT is 0..1. It rises after a bad beat (a pair or better that lost), a
// called bluff, a big pot lost, a comp taken; it falls a little on a good
// fold or a won pot, and only really comes down in the air: walking the
// rail (or any open deck) for ten seconds takes it from full to nothing.
// Tilted (≥ TILTED) the tells blur, Lou is drowned out and the bet creeps up.

export const TILTED = 0.5;
export const COOL_PER_S = 0.1; // ten seconds on the rail, full to nothing
export const RAKE = 0.05; // the house's slice of every pot, rounded up

// what each thing does to the meter
export const TILT_EVENTS = Object.freeze({
  bad_beat: 0.35, // a pair or better, beaten
  lost: 0.1, // a showdown lost
  big_loss: 0.15, // a pot of $40 or more lost (on top of the above)
  bluff_called: 0.15,
  comp: 0.08, // a drink on the house
  won: -0.05,
  good_fold: -0.03,
  marker: 0.1,
});

export const SLATE_DEFAULT = Object.freeze({ buyin: 100, stop: 60, goal: 140 });

export function newPurse({ buyin = 100, stop = 60, goal = 140 } = {}) {
  return {
    stack: buyin,
    buyin,
    stop,
    goal,
    tilt: 0,
    rake: 0, // paid to the house, all night
    comps: 0, // drinks and stakes on the house
    folds: 0,
    saved: 0, // what the good folds kept in the stack
    hands: 0, // poker hands dealt to Jo
    turns: 0, // faro turns
    won: 0, // pots won
    lost: 0,
    markers: 0, // signed at the purser's cage
    debt: 0,
    busts: 0,
    crossedStop: false, // the stack went under the stop-loss line
    reachedGoal: false,
    peak: buyin,
  };
}

// the rake on a pot: 5 %, the house rounds up (a pot of 10 pays 1)
export function rakeOf(pot) {
  return pot > 0 ? Math.ceil(pot * RAKE) : 0;
}

function after(p) {
  p.stack = Math.max(0, Math.round(p.stack));
  p.peak = Math.max(p.peak, p.stack);
  if (p.stack < p.stop) p.crossedStop = true;
  if (p.stack >= p.goal) p.reachedGoal = true;
  return p;
}

// money in (net of the rake already taken) / money out
export function win(p, net, { rake = 0 } = {}) {
  p.stack += net;
  p.rake += rake;
  return after(p);
}

export function lose(p, amount) {
  p.stack -= amount;
  return after(p);
}

export function tilt(p, event, k = 1) {
  const d = TILT_EVENTS[event];
  if (d === undefined) throw new Error(`purse: no tilt event "${event}"`);
  p.tilt = Math.max(0, Math.min(1, p.tilt + d * k));
  return p.tilt;
}

// the air: walking an open deck cools the head; standing still barely does
export function cool(p, dtMs, walking) {
  const k = walking ? 1 : 0.15;
  p.tilt = Math.max(0, p.tilt - (COOL_PER_S * k * dtMs) / 1000);
  return p.tilt;
}

export const isTilted = (p) => p.tilt >= TILTED;

// where the stack sits against the slate: the table dims below the stop-loss
// and brightens at the goal (the slate speaks; nobody tells Jo to leave)
export function line(p) {
  if (p.stack < p.stop) return 'below';
  if (p.stack >= p.goal) return 'goal';
  return 'between';
}

// the purser's marker: fifty on Jo's word, a debt that comes off the top
export function signMarker(p, amount = 50) {
  p.stack += amount;
  p.debt += amount;
  p.markers += 1;
  tilt(p, 'marker');
  return after(p);
}

// a bust: Lou's bar is reset on the quay (the dream is not); the ledger keeps
// what the night cost
export function bust(p) {
  p.busts += 1;
  p.stack = p.buyin;
  p.tilt = 0;
  return p;
}

// the night's result: what Jo walks down the gangway with, the debt paid
export function cashOut(p) {
  const paid = Math.min(p.debt, p.stack);
  return { cash: p.stack - paid, paid, owed: p.debt - paid, net: p.stack - paid - p.buyin };
}

// the honest ledger, in words, for the ending (≤ 4 lines)
export function ledgerLines(p, minutes = 0) {
  const c = cashOut(p);
  // the dream's night runs dusk to dawn: a minute of play is about 45 of the night's
  const hrs = Math.max(1, Math.round(minutes * 0.75));
  const out = [];
  out.push(`${hrs} hour${hrs === 1 ? '' : 's'} at the tables. ${p.hands} hands, ${p.turns} turns at the bank.`);
  out.push(`The house took $${p.rake} in rake.${p.comps ? ` ${p.comps} comp${p.comps === 1 ? '' : 's'} on Mr Pell's book.` : ' No comps.'}`);
  out.push(p.saved ? `${p.folds} fold${p.folds === 1 ? '' : 's'}; the good ones kept $${p.saved}.` : `${p.folds} fold${p.folds === 1 ? '' : 's'}. None of them saved a thing.`);
  const net = c.net >= 0 ? `up $${c.net}` : `down $${-c.net}`;
  out.push(`${p.markers ? `Markers: $${p.debt}, paid $${c.paid}. ` : ''}Home with $${c.cash}: ${net}.`);
  return out;
}

export default { newPurse, rakeOf, win, lose, tilt, cool, isTilted, line, signMarker, bust, cashOut, ledgerLines };
