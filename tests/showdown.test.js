// THE LAST HAND's rules, checked in Node: SHOWDOWN (three-card poker with
// true tells), the faro bank, the slate and the purse (rake, TILT, ledger).
import { describe, it, expect } from 'vitest';
import { showdown, rank, tier, PLAYERS, TELLS, bestVerb, deck, shuffle, rng } from '../src/engines/showdown.js';
import { faro } from '../src/engines/faro.js';
import { slate } from '../src/engines/slate.js';
import { newPurse, rakeOf, win, lose, tilt, cool, isTilted, line, signMarker, bust, cashOut, ledgerLines, TILTED } from '../src/engines/purse.js';

const c = (r, s = 0) => ({ r, s });
const until = (e, phase, dt = 50, limit = 400) => {
  for (let i = 0; i < limit && e.state().phase !== phase && !e.done; i++) e.update(dt);
  return e.state();
};
// a table whose deal gives Jo (and the first player) a hand of a given kind
function tableWhere(test, opts = {}, limit = 400) {
  for (let seed = 1; seed < limit; seed++) {
    const e = showdown({ seed, lou: null, ...opts });
    if (test(e.state())) return e;
  }
  throw new Error('no seed matched');
}

describe('SHOWDOWN: the hands', () => {
  it('three of a kind beats a pair beats high card; kickers break ties', () => {
    const trips = rank([c(2), c(2, 1), c(2, 2)]);
    const pair = rank([c(14), c(14, 1), c(3)]);
    const high = rank([c(14), c(13), c(11)]);
    expect(trips.name).toBe('THREE OF A KIND');
    expect(pair.name).toBe('A PAIR');
    expect(high.name).toBe('HIGH CARD');
    expect(trips.score).toBeGreaterThan(pair.score);
    expect(pair.score).toBeGreaterThan(high.score);
    expect(rank([c(9), c(9, 1), c(14)]).score).toBeGreaterThan(rank([c(9, 2), c(9, 3), c(13)]).score);
    expect(rank([c(14), c(10), c(4)]).score).toBe(rank([c(14, 1), c(10, 2), c(4, 3)]).score);
  });

  it('a deck is 52 cards and the shuffle is seeded (the same seed, the same deal)', () => {
    expect(new Set(deck().map((x) => `${x.r}${x.s}`)).size).toBe(52);
    expect(shuffle(deck(), rng(4))).toEqual(shuffle(deck(), rng(4)));
    expect(shuffle(deck(), rng(4))).not.toEqual(shuffle(deck(), rng(5)));
  });

  it('every tell is true to the hand, every time', () => {
    const r = rng(9);
    for (let i = 0; i < 300; i++) {
      const d = shuffle(deck(), r);
      const cards = d.slice(0, 3);
      const t = tier(cards);
      // the Judge hums only when he has a pair or better
      expect(PLAYERS.judge.tell(t) === 'hum').toBe(rank(cards).cat >= 1);
      // Sorrel's hand is still only when she has nothing, and then she folds
      expect(PLAYERS.sorrel.tell(t) === 'still').toBe(t === 'weak');
      expect(PLAYERS.sorrel.calls(t)).toBe(!TELLS[PLAYERS.sorrel.tell(t)].folds);
      // Nico's collar means he folds to a raise; hands flat means he calls
      expect(PLAYERS.nico.calls(t)).toBe(PLAYERS.nico.tell(t) === 'flat');
    }
    // the Judge calls everything (never bluff the Judge)
    for (const t of ['weak', 'fair', 'strong']) expect(PLAYERS.judge.calls(t)).toBe(true);
  });

  it("Lou's right answer reads the tells", () => {
    const nothing = [c(2), c(5, 1), c(9, 2)];
    expect(bestVerb([c(4), c(4, 1), c(9)], ['hum'])).toBe('raise');
    expect(bestVerb(nothing, ['collar', 'still'])).toBe('bluff');
    expect(bestVerb(nothing, ['pinky', 'collar'])).toBe('fold');
    expect(bestVerb(nothing, ['quiet'])).toBe('call');
  });
});

describe('SHOWDOWN: the table', () => {
  it('antes go in on the deal; the menu offers RAISE only with a pair, BLUFF only without', () => {
    const e = showdown({ seats: ['judge'], stack: 100, seed: 3, lou: null });
    let st = until(e, 'decide');
    expect(st.stack).toBe(95);
    expect(st.pot).toBe(10);
    const pair = rank(st.jo).cat >= 1;
    expect(st.menu.find((m) => m.id === 'raise').enabled).toBe(pair);
    expect(st.menu.find((m) => m.id === 'bluff').enabled).toBe(!pair);
    expect(st.rules).toMatch(/THREE OF A KIND.*A PAIR.*HIGH CARD/);
    // each player shows one card and a tell, nothing else
    expect(st.opps[0].up.length).toBe(1);
    expect(st.opps[0].cards).toBeNull();
  });

  it('a call goes to showdown: the best hand takes the pot, less a 5 % rake rounded up', () => {
    // find a deal where Jo beats the Judge outright, then call it
    for (let seed = 1; seed < 300; seed++) {
      const t = showdown({ seats: ['judge'], seed, lou: null });
      until(t, 'decide');
      const before = t.state().stack;
      t.press('call');
      const last = t.state().last;
      if (!last.joWins || last.split) continue;
      expect(last.pot).toBe(30);
      expect(last.rake).toBe(rakeOf(30));
      expect(rakeOf(30)).toBe(2);
      expect(t.state().stack).toBe(before - 10 + 30 - 2);
      expect(t.state().won).toBe(true);
      return;
    }
    throw new Error('no winning call found');
  });

  it('a fold shows what calling would have cost: "saved $10" only when it really saved it', () => {
    let saved = 0;
    let missed = 0;
    for (let seed = 1; seed < 120; seed++) {
      const t = showdown({ seats: ['judge'], seed, lou: null });
      until(t, 'decide');
      const st = t.state();
      t.press('fold');
      const last = t.state().last;
      const opp = t.state().opps[0];
      const wouldWin = rank(st.jo).score > rank(opp.cards).score;
      if (wouldWin) {
        expect(last.saved).toBeUndefined();
        expect(last.missed).toBeGreaterThan(0);
        missed++;
      } else {
        expect(last.saved).toBe(10);
        saved++;
      }
      expect(t.state().stack).toBe(95); // only the ante
    }
    expect(saved).toBeGreaterThan(0);
    expect(missed).toBeGreaterThan(0);
  });

  it("a bluff works only when every tell at the table says fold; on Sorrel's pinky it fails", () => {
    let worked = 0;
    let failed = 0;
    for (let seed = 1; seed < 500; seed++) {
      const t = showdown({ seats: ['sorrel', 'nico'], seed, lou: null });
      const st = until(t, 'decide');
      if (rank(st.jo).cat >= 1) continue;
      const allFold = st.opps.every((o) => TELLS[o.tell].folds);
      t.press('bluff');
      const last = t.state().last;
      expect(last.bluffWorked).toBe(allFold);
      if (allFold) {
        worked++;
        expect(last.joWins).toBe(true);
      } else {
        failed++;
        const caller = st.opps.find((o) => !TELLS[o.tell].folds);
        expect(last.callers).toContain(caller.id);
      }
    }
    expect(worked).toBeGreaterThan(5);
    expect(failed).toBeGreaterThan(5);
  });

  it('STAND UP ends the table; it counts as beaten only after a pot was won there', () => {
    const t = showdown({ seats: ['judge'], seed: 2, lou: null });
    until(t, 'decide');
    t.press('stand');
    expect(t.done).toBe(true);
    expect(t.result.stood).toBe(true);
    expect(t.result.ok).toBe(false);
  });

  it('a bust ends the table when the stack cannot ante', () => {
    const t = showdown({ seats: ['judge'], stack: 7, seed: 5, lou: null });
    until(t, 'decide');
    t.press('call'); // 2 left, or more if it won
    until(t, 'done', 100, 200);
    if (t.state().stack < 5) {
      expect(t.done).toBe(true);
      expect(t.result.bust).toBe(true);
    }
  });

  it('TILT: a bad beat (a pair that lost) raises it; tilted, the bet creeps up by itself', () => {
    for (let seed = 1; seed < 2000; seed++) {
      const t = showdown({ seats: ['judge'], seed, lou: null });
      const st = until(t, 'decide');
      if (rank(st.jo).cat < 1) continue;
      t.press('raise');
      const last = t.state().last;
      if (last.joWins) continue;
      // a bad beat, and a pot of $50 lost on top of it
      expect(t.state().tilt).toBeCloseTo(0.35 + 0.15, 5);
      break;
    }
    const e = tableWhere((st) => rank(st.jo).cat === 0, { seats: ['judge'], tilt: 0.8, creepMs: 1000 });
    const st = until(e, 'decide');
    expect(st.tilted).toBe(true);
    expect(st.cursor).toBe(0); // CALL
    for (let i = 0; i < 25; i++) e.update(100);
    expect(e.state().menu[e.state().cursor].id).toBe('bluff');
    // calm, it stays where it was put
    const calm = tableWhere((x) => rank(x.jo).cat === 0, { seats: ['judge'], tilt: 0.1, creepMs: 1000 });
    until(calm, 'decide');
    for (let i = 0; i < 40; i++) calm.update(100);
    expect(calm.state().cursor).toBe(0);
  });

  it("Lou is wrong about one hand in four, and at the last table his first tip is wrong", () => {
    let right = 0;
    let wrong = 0;
    for (let seed = 1; seed < 200; seed++) {
      const t = showdown({ seats: ['judge'], seed });
      const tip = t.state().tip;
      if (tip.right) right++;
      else wrong++;
      expect(tip.right).toBe(tip.say === tip.best);
    }
    expect(wrong / (right + wrong)).toBeGreaterThan(0.15);
    expect(wrong / (right + wrong)).toBeLessThan(0.35);
    const t3 = showdown({ seats: ['judge', 'sorrel', 'nico'], seed: 4, lou: { wrongEvery: 4, firstWrong: true } });
    expect(t3.state().tip.right).toBe(false);
  });
});

describe('SHOWDOWN: the last table', () => {
  it('kings and nines face up for both; STAND UP catches the dream and costs nothing', () => {
    const e = showdown({ mode: 'final', stack: 160, buyin: 100, seed: 3 });
    const st = until(e, 'decide');
    expect(st.jo.slice(0, 2).map((x) => x.r)).toEqual([13, 9]);
    expect(st.opps[0].cards.slice(0, 2).map((x) => x.r)).toEqual([13, 9]);
    expect(st.menu.find((m) => m.id === 'fold').enabled).toBe(false);
    expect(st.menu.find((m) => m.id === 'call').label).toBe('CALL $60'); // the night's profit
    e.press('stand');
    expect(e.done).toBe(true);
    expect(e.result).toMatchObject({ ok: true, stood: true, stack: 160 });
  });

  it('taking the hand is a fair coin with the night on it: a loss ends the night, a win slides another', () => {
    let wins = 0;
    let losses = 0;
    for (let seed = 1; seed < 400; seed++) {
      const e = showdown({ mode: 'final', stack: 160, buyin: 100, seed });
      until(e, 'decide');
      e.press('call');
      const last = e.state().last;
      if (last.split) continue;
      if (last.joWins) {
        wins++;
        expect(e.state().stack).toBe(100 + 120 - rakeOf(120));
        e.update(5000);
        expect(e.done).toBe(false);
        expect(e.state().phase === 'deal' || e.state().phase === 'decide').toBe(true);
      } else {
        losses++;
        expect(e.state().stack).toBe(100);
        e.update(5000);
        expect(e.done).toBe(true);
        expect(e.result).toMatchObject({ ok: false, lostNight: true });
      }
    }
    expect(Math.abs(wins - losses) / (wins + losses)).toBeLessThan(0.15);
  });
});

describe('the faro bank', () => {
  it("the beginner's run is 55 %, then 47 %; splits go to the bank (half the stake)", () => {
    const tally = (k) => {
      let w = 0;
      let n = 0;
      for (let seed = 1; seed < 3000; seed++) {
        const e = faro({ bank: 1000, target: 5000, seed });
        for (let b = 0; b < k; b++) {
          e.press();
          e.update(5000);
          e.update(5000);
        }
        const last = e.state().last;
        if (last.kind === 'split') continue;
        n++;
        if (last.kind === 'win') w++;
      }
      return w / n;
    };
    expect(tally(1)).toBeGreaterThan(0.5);
    expect(tally(1)).toBeLessThan(0.6);
    expect(tally(3)).toBeGreaterThan(0.42);
    expect(tally(3)).toBeLessThan(0.52);
  });

  it('a win pays the stake less the rake; a split costs half; reaching the target ends it', () => {
    for (let seed = 1; seed < 200; seed++) {
      const e = faro({ bank: 40, target: 80, seed });
      e.move('right'); // BET $20
      e.press();
      const l = e.state().last;
      if (l.kind === 'win') expect(e.state().now).toBe(40 + 20 - rakeOf(20));
      if (l.kind === 'lose') expect(e.state().now).toBe(20);
      if (l.kind === 'split') expect(e.state().now).toBe(30);
    }
    const e = faro({ bank: 75, target: 80, seed: 1, schedule: [1], split: 0 });
    e.press();
    e.update(2000);
    e.update(2000);
    expect(e.done).toBe(true);
    expect(e.result).toMatchObject({ ok: true, bank: 84 });
  });

  it('the house can stake the first bet (a comp): a first loss costs nothing', () => {
    const e = faro({ bank: 40, seed: 1, schedule: [0], split: 0, freeFirst: true });
    e.press();
    expect(e.state().last).toMatchObject({ kind: 'lose', free: true, net: 0 });
    expect(e.state().now).toBe(40);
  });

  it('a busted bank ends it; STAND UP walks away with what is left', () => {
    const e = faro({ bank: 10, seed: 1, schedule: [0], p: 0, split: 0 });
    e.press();
    e.update(2000);
    e.update(2000);
    expect(e.result).toMatchObject({ ok: false, bust: true, bank: 0 });
    const f = faro({ bank: 40 });
    f.move('right');
    f.move('right');
    f.press();
    expect(f.result).toMatchObject({ ok: false, left: true, bank: 40 });
  });
});

describe('the slate and the purse', () => {
  it('three numbers are chalked; the stop-loss always sits under the buy-in', () => {
    const e = slate();
    expect(e.state().rows.map((r) => r.value)).toEqual([100, 60, 140]);
    e.move('left'); // buy-in 80
    e.move('left'); // 60: the stop drops under it
    expect(e.state().rows[1].value).toBeLessThan(60);
    e.press();
    e.press();
    e.press();
    e.press();
    expect(e.result).toMatchObject({ ok: true, buyin: 60, goal: 140 });
  });

  it('the line: below the stop-loss, between, at the goal; markers are debt', () => {
    const p = newPurse({ buyin: 100, stop: 60, goal: 140 });
    expect(line(p)).toBe('between');
    lose(p, 50);
    expect(line(p)).toBe('below');
    expect(p.crossedStop).toBe(true);
    win(p, 100, { rake: 5 });
    expect(line(p)).toBe('goal');
    expect(p.rake).toBe(5);
    signMarker(p, 50);
    expect(cashOut(p)).toMatchObject({ cash: 150, paid: 50, owed: 0 });
    bust(p);
    expect(p.stack).toBe(100);
    expect(p.busts).toBe(1);
  });

  it('TILT rises on the bad things and comes down only in the air (ten seconds walking)', () => {
    const p = newPurse();
    tilt(p, 'bad_beat');
    tilt(p, 'comp');
    tilt(p, 'bluff_called');
    expect(isTilted(p)).toBe(true);
    cool(p, 3000, false);
    expect(p.tilt).toBeGreaterThan(TILTED); // standing still barely helps
    p.tilt = 1;
    cool(p, 10000, true);
    expect(p.tilt).toBe(0);
    expect(() => tilt(p, 'nonsense')).toThrow();
  });

  it('the ledger is honest: rake, comps, the folds that saved money, home with what', () => {
    const p = newPurse({ buyin: 100 });
    Object.assign(p, { hands: 14, turns: 9, rake: 7, comps: 2, folds: 5, saved: 30, stack: 118 });
    const lines = ledgerLines(p, 9);
    expect(lines.join(' ')).toMatch(/14 hands/);
    expect(lines.join(' ')).toMatch(/\$7 in rake/);
    expect(lines.join(' ')).toMatch(/2 comps/);
    expect(lines.join(' ')).toMatch(/kept \$30/);
    expect(lines.join(' ')).toMatch(/up \$18/);
    expect(lines.length).toBeLessThanOrEqual(4);
  });
});
