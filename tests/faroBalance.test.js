// The faro bank's balance, by seeded simulation: a sensible player ($10 a
// bet) rarely busts on the way from $40 to $80; one who always bets $20
// plays the true odds and busts most of the time. The house edge is still
// there in every bet (splits and the rake).
import { describe, it, expect } from 'vitest';
import { faro, STEADY } from '../src/engines/faro.js';

// play one sitting to the end; strat(state) → the index of the bet to take
function sit(seed, strat, opts = {}) {
  const e = faro({ bank: 40, target: 80, seed, ...opts });
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
    expect(bustRate(flat20)).toBeGreaterThan(0.45);
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

  it('a careful run is reasonable in length (not a grind)', () => {
    let bets = 0;
    for (let seed = 1; seed <= 500; seed++) bets += sit(seed, flat10).bets;
    expect(bets / 500).toBeLessThan(18);
  });
});
