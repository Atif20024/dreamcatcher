// The faro bank's balance, by seeded simulation: a sensible player ($10 a
// bet) rarely busts on the way from $40 to $70; one who always bets $20
// plays the true odds and busts most of the time. The house edge is still
// there in every bet (splits and the rake).
import { describe, it, expect } from 'vitest';
import { faro, STEADY, FARO_TARGET } from '../src/engines/faro.js';
import { faroEnc } from '../src/dreams/gambler/encounters/tables.js';
import { newPurse } from '../src/engines/purse.js';

// play one sitting to the end; strat(state) → the index of the bet to take
function sit(seed, strat, opts = {}) {
  const e = faro({ bank: 40, target: FARO_TARGET, seed, ...opts });
  for (let guard = 0; !e.done && guard < 400; guard++) {
    const want = strat(e.state());
    for (let k = 0; k < 4 && e.state().pick !== want; k++) e.move('right');
    e.press();
    e.update(5000);
    e.update(5000);
  }
  return e.result;
}

function bustRate(strat, n = 3000, opts) {
  let busts = 0;
  for (let seed = 1; seed <= n; seed++) if (sit(seed, strat, opts).bust) busts++;
  return busts / n;
}

const flat10 = () => 0;
const flat20 = (s) => (s.actions[1].enabled ? 1 : 0);
// the free stake on the first bet (a comp), then $10
const comped = flat10;

describe('faro balance (seeded)', () => {
  it('a sensible player ($10 a bet) busts well under 15 % of the time', () => {
    expect(bustRate(flat10)).toBeLessThan(0.15);
  });

  it('the house comp on the first bet only helps a careful player', () => {
    expect(bustRate(comped, 3000, { freeFirst: true })).toBeLessThan(0.15);
  });

  it('always betting $20 plays the true odds: the bank wins most nights', () => {
    expect(FARO_TARGET).toBe(70);
    expect(bustRate(flat20)).toBeGreaterThan(0.35);
  });

  it('the edge is still real at the small stake: splits and the rake cost every sitting', () => {
    let rake = 0;
    let splits = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const r = sit(seed, flat10);
      rake += r.rake;
      splits += r.splits;
    }
    expect(rake / 500).toBeGreaterThan(5);
    expect(splits).toBeGreaterThan(0);
    expect(STEADY.p).toBeLessThan(0.75);
  });

  it('a careful run is reasonable in length (not a grind: about ten bets)', () => {
    let bets = 0;
    for (let seed = 1; seed <= 500; seed++) bets += sit(seed, flat10).bets;
    expect(bets / 500).toBeLessThan(12);
  });
});

describe('the stake (A7)', () => {
  const sitWith = (stack) => ({ F: { purse: { ...newPurse(), stack } } });
  const stakeOf = (sc) => faroEnc.params(sc.F).bank;

  it('stakes forty, or what he has if less', () => {
    expect(stakeOf(sitWith(100))).toBe(40);
    expect(stakeOf(sitWith(40))).toBe(40);
    expect(stakeOf(sitWith(30))).toBe(30);
  });

  it('the bank coming back pays the stack by what moved: never below nothing, no money from nowhere', () => {
    for (const [stack, bank, after] of [[100, 70, 130], [100, 25, 85], [30, 0, 0], [30, 8, 8], [30, 70, 70]]) {
      const sc = sitWith(stack);
      faroEnc.onResult(sc, { bank });
      expect(sc.F.purse.stack).toBe(after);
    }
    // the back key before any result: what he sat down with
    const sc = sitWith(30);
    faroEnc.onResult(sc, {});
    expect(sc.F.purse.stack).toBe(30);
  });

  it('a short stake plays the same box: same seed, same cards', () => {
    const cards = (bank) => {
      const e = faro({ bank, target: FARO_TARGET, seed: 7 });
      e.press();
      return e.state().last.kind + e.state().last.banker;
    };
    expect(cards(30)).toBe(cards(40));
  });
});
