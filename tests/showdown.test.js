// THE LAST HAND's rules, checked in Node: SHOWDOWN (three-card poker with
// true tells), the faro bank, the slate and the purse (rake, TILT, ledger).
import { describe, it, expect, vi } from 'vitest';
import { showdown, rank, tier, PLAYERS, TELLS, bestVerb, deck, shuffle, rng } from '../src/engines/showdown.js';
import { faro } from '../src/engines/faro.js';
import { slate } from '../src/engines/slate.js';
import { newPurse, rakeOf, win, lose, tilt, cool, isTilted, line, signMarker, bust, lostLast, cashOut, ledgerLines, TILTED, rebase, compStake, net } from '../src/engines/purse.js';
import { infoLine, BEATEN_LINE } from '../src/dreams/gambler/table.js';

vi.mock('../src/ui/text.js', () => ({ uiText: () => null })); // table.js draws through Phaser; infoLine does not

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
    // a pair against a tell that means a pair or better is a coin flip: see it
    expect(bestVerb([c(4), c(4, 1), c(9)], ['hum'])).toBe('call');
    expect(bestVerb([c(4), c(4, 1), c(9)], ['pinky', 'flat'])).toBe('call');
    expect(bestVerb([c(4), c(4, 1), c(9)], ['quiet'])).toBe('raise');
    expect(bestVerb([c(4), c(4, 1), c(4, 2)], ['hum'])).toBe('raise');
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

  it('TILT: one lost pair-raise nudges it; a loss straight after (chasing) tips it; tilted, the bet creeps', () => {
    let seen = 0;
    for (let seed = 1; seed < 4000 && seen < 3; seed++) {
      const t = showdown({ seats: ['judge'], seed, lou: null });
      const st = until(t, 'decide');
      if (rank(st.jo).cat < 1 || !t.state().menu.find((m) => m.id === 'raise').enabled) continue;
      t.press('raise');
      const last = t.state().last;
      if (last.joWins || last.split) continue;
      seen++;
      // a bad beat, and a pot of $50 lost on top of it: a nudge, not a tilt
      expect(t.state().tilt).toBeCloseTo(0.35 + 0.1, 5);
      expect(t.state().tilted).toBe(false);
      // the next hand lost too: the streak tips it
      t.update(5000);
      until(t, 'decide');
      t.press('call');
      const l2 = t.state().last;
      if (!l2.joWins && !l2.split) expect(t.state().tilted).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
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

  // play `n` hands at a deep table, folding, and note the hands Lou got wrong
  const wrongHands = (seed, n = 24, lou = { wrongEvery: 4 }) => {
    const t = showdown({ seats: ['judge'], stack: 10000, seed, lou });
    const out = [];
    for (let h = 0; h < n; h++) {
      until(t, 'decide');
      if (!t.state().tip.right) out.push(t.state().hand);
      t.press('fold');
      t.update(5000);
    }
    return out;
  };

  it("Lou's misses follow no countable schedule (a seeded coin, not every fourth hand)", () => {
    let periodic = 0;
    let total = 0;
    let hands = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const w = wrongHands(seed);
      total += w.length;
      hands += 24;
      // every miss on the same beat of four: what a player could count
      if (w.length >= 3 && new Set(w.map((h) => h % 4)).size === 1) periodic++;
      // the same seed, the same misses (a replay is a replay)
      expect(wrongHands(seed)).toEqual(w);
    }
    expect(periodic).toBeLessThanOrEqual(1);
    expect(total / hands).toBeGreaterThan(0.15);
    expect(total / hands).toBeLessThan(0.35);
    // Lou has his own coin: the deal is the same with him or without him
    const a = showdown({ seats: ['judge'], seed: 9 });
    const b = showdown({ seats: ['judge'], seed: 9, lou: null });
    expect(a.state().jo).toEqual(b.state().jo);
  });

  it('from table 2 Lou says what he sees: a true tell at the table; wrong, the same sight misread', () => {
    let misreads = 0;
    for (let seed = 1; seed < 300; seed++) {
      const t = showdown({ seats: ['sorrel', 'nico'], seed, lou: { wrongEvery: 4, describe: true } });
      const st = t.state();
      const look = st.tip.look;
      expect(look).toBeTruthy();
      expect(look.misread).toBe(!st.tip.right);
      if (look.own) expect(st.tip.best).toBe('raise');
      else expect(st.opps.find((o) => o.id === look.id).tell).toBe(look.tell);
      if (look.misread) misreads++;
    }
    expect(misreads).toBeGreaterThan(20);
    // the first table names the verb
    expect(showdown({ seats: ['judge'], seed: 3 }).state().tip.look).toBeNull();
  });

  it('a pot won lights STAND UP: the table is beaten, and the way out is hot', () => {
    for (let seed = 1; seed < 300; seed++) {
      const t = showdown({ seats: ['judge'], seed, lou: null });
      until(t, 'decide');
      expect(t.state().menu.find((m) => m.id === 'stand').hot).toBe(false);
      t.press('call');
      const last = t.state().last;
      if (!last.joWins) continue;
      expect(last.beaten).toBe(true);
      t.update(5000);
      const st = until(t, 'decide');
      expect(st.won).toBe(true);
      expect(st.menu.find((m) => m.id === 'stand').hot).toBe(true);
      return;
    }
    throw new Error('no winning call found');
  });

  it('a short stack never goes under nothing: ALL IN with what is left, no $20 bets it cannot cover', () => {
    for (let seed = 1; seed < 60; seed++) {
      const t = showdown({ seats: ['judge'], stack: 8, seed, lou: null });
      const st = until(t, 'decide');
      expect(st.stack).toBe(3);
      const callItem = st.menu.find((m) => m.id === 'call');
      expect(callItem.label).toBe('ALL IN $3');
      expect(st.menu.find((m) => m.id === 'raise').enabled).toBe(false);
      expect(st.menu.find((m) => m.id === 'bluff').enabled).toBe(false);
      t.press('call');
      expect(t.state().stack).toBeGreaterThanOrEqual(0);
      if (!t.state().last.joWins) expect(t.state().stack).toBe(0);
    }
    // nothing at all left after the ante: there is no CALL $0
    const z = showdown({ seats: ['judge'], stack: 5, seed: 2, lou: null });
    const st = until(z, 'decide');
    expect(st.menu.find((m) => m.id === 'call').enabled).toBe(false);
    expect(st.menu[st.cursor].enabled).toBe(true);
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

  it("the Judge's hum is true at the last table too: he hums only when his third card pairs him", () => {
    let hums = 0;
    for (let seed = 1; seed < 200; seed++) {
      const e = showdown({ mode: 'final', stack: 160, buyin: 100, seed });
      const o = e.state().opps[0];
      const paired = o.cards[2].r === 13 || o.cards[2].r === 9;
      expect(o.tell === 'hum').toBe(paired);
      if (paired) hums++;
    }
    expect(hums).toBeGreaterThan(0);
    expect(hums).toBeLessThan(100);
  });

  it('the profit is net of debt, a broke night has no CALL $0, and the habit drifts RAISE back to CALL once a sitting', () => {
    // $50 of a $160 stack is a marker: the profit is $10, so CALL plays the $20 floor
    const d = showdown({ mode: 'final', stack: 160, buyin: 100, debt: 50, seed: 3 });
    let st = until(d, 'decide');
    expect(st.profit).toBe(10);
    expect(st.menu.find((m) => m.id === 'call').label).toBe('CALL $20');
    // nothing left: CALL is dark, STAND UP is the way
    const z = showdown({ mode: 'final', stack: 0, buyin: 100, seed: 3 });
    st = until(z, 'decide');
    expect(st.menu.find((m) => m.id === 'call').enabled).toBe(false);
    // no RAISE $0 either: STAND UP is what is left under the cursor
    expect(st.menu.find((m) => m.id === 'raise').enabled).toBe(false);
    expect(st.menu[st.cursor].id).toBe('stand');
    // the habit: reaching for RAISE, the hand drifts back to CALL by itself
    const h = showdown({ mode: 'final', stack: 160, buyin: 100, seed: 3, creepMs: 1000 });
    until(h, 'decide');
    const verb = () => h.state().menu[h.state().cursor].id;
    h.move('right');
    expect(verb()).toBe('raise');
    for (let i = 0; i < 12; i++) h.update(100);
    expect(verb()).toBe('call');
    expect(h.takeEvents()).toContain('creep');
    // spent: RAISE now stays where it was put
    h.move('right');
    for (let i = 0; i < 30; i++) h.update(100);
    expect(verb()).toBe('raise');
  });

  it('the habit never takes STAND UP: the cursor stays on it, and E stands up', () => {
    const h = showdown({ mode: 'final', stack: 160, buyin: 100, seed: 3, creepMs: 1000 });
    until(h, 'decide');
    h.move('left'); // wraps to STAND UP
    for (let i = 0; i < 100; i++) h.update(100);
    expect(h.state().menu[h.state().cursor].id).toBe('stand');
    h.press('act');
    expect(h.result).toMatchObject({ ok: true, stood: true });
  });

  it('tilted, the creep still drifts to RAISE but never walks off STAND UP', () => {
    const h = showdown({ mode: 'final', stack: 160, buyin: 100, tilt: 0.8, seed: 3, creepMs: 1000 });
    until(h, 'decide');
    const verb = () => h.state().menu[h.state().cursor].id;
    expect(verb()).toBe('call');
    for (let i = 0; i < 12; i++) h.update(100);
    expect(verb()).toBe('raise');
    h.move('right'); // past the dark FOLD and BLUFF
    expect(verb()).toBe('stand');
    for (let i = 0; i < 100; i++) h.update(100);
    expect(verb()).toBe('stand');
    h.press('act');
    expect(h.result).toMatchObject({ ok: true, stood: true });
  });

  it('the habit is once a sitting: a hand won does not bring it back', () => {
    for (let seed = 1; seed < 100; seed++) {
      const h = showdown({ mode: 'final', stack: 160, buyin: 100, seed, creepMs: 1000 });
      until(h, 'decide');
      h.move('right');
      for (let i = 0; i < 12; i++) h.update(100); // spent
      h.press('call');
      if (!h.state().last.joWins) continue;
      h.update(5000);
      until(h, 'decide');
      h.move('right');
      for (let i = 0; i < 30; i++) h.update(100);
      expect(h.state().menu[h.state().cursor].id).toBe('raise');
      return;
    }
    throw new Error('no winning hand found');
  });

  it('what goes across the table adds up in the engine and on the last line of the ledger', () => {
    let seen = 0;
    for (let seed = 1; seed < 100 && seen < 5; seed++) {
      const e = showdown({ mode: 'final', stack: 160, buyin: 100, seed });
      until(e, 'decide');
      e.press('raise');
      if (e.state().last.joWins) expect(e.state().ledger.across).toBe(0);
      else {
        seen++;
        expect(e.state().ledger.across).toBe(160);
      }
    }
    expect(seen).toBe(5);
    const p = newPurse({ buyin: 100 });
    expect(ledgerLines(p, 9).join(' ')).not.toMatch(/across/);
    // floored back to the buy-in: "up $0" alone would hide the $160
    Object.assign(p, { across: 160, debt: 10, comps: 1 });
    const lines = ledgerLines(p, 9);
    expect(lines.length).toBeLessThanOrEqual(4);
    expect(lines[lines.length - 1]).toBe('Owed Mr Pell $10, paid $10. The Judge took $160 across the table. Home with $90: down $10.');
  });

  it('the line under the verbs: TABLE BEATEN on the hand that beat the table, then Lou again', () => {
    for (let seed = 1; seed < 300; seed++) {
      const t = showdown({ seats: ['judge'], seed });
      until(t, 'decide');
      t.press('call');
      if (!t.state().last.joWins) continue;
      expect(infoLine(t.state()).text).toContain(BEATEN_LINE);
      t.update(5000);
      const st = until(t, 'decide');
      expect(st.menu.find((m) => m.id === 'stand').hot).toBe(true); // still gold
      expect(infoLine(st).text).not.toContain(BEATEN_LINE);
      expect(infoLine(st).text).toMatch(/^LOU: /);
      return;
    }
    throw new Error('no winning call found');
  });

  it('the last table says RAISE is gross when something is owed (the HUD stack is net)', () => {
    const d = showdown({ mode: 'final', stack: 160, buyin: 100, debt: 50, seed: 3 });
    expect(infoLine(until(d, 'decide')).text).toContain('debt too');
    expect(infoLine(d.state()).text.length).toBeLessThanOrEqual(70); // the keys row sits right under it
    const c = showdown({ mode: 'final', stack: 160, buyin: 100, seed: 3 });
    expect(infoLine(until(c, 'decide')).text).not.toContain('debt');
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
        const e = faro({ bank: 1000, target: 5000, seed, steady: null });
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

  it('the house stakes exactly the $10 it says: BET $20 opens after the first bet', () => {
    const e = faro({ bank: 40, seed: 1, freeFirst: true });
    expect(e.state().actions.map((a) => a.enabled)).toEqual([true, false, true]);
    e.move('right');
    expect(e.state().actions[e.state().pick].id).toBe('stand'); // the $20 is skipped
    e.move('left');
    e.press();
    expect(e.state().last.stake).toBe(10);
    expect(e.state().actions[1].enabled).toBe(true);
  });

  it('getting up by the back key keeps what the bank came to, a bet in play included', () => {
    // the bet is settled when it is placed: leaving in draw or show neither undoes nor repeats it
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const dt of [0, 800]) {
        const e = faro({ bank: 40, seed });
        e.press();
        e.update(dt);
        const now = e.state().now;
        expect(now).not.toBe(40); // the money has already moved
        expect(e.leave()).toMatchObject({ ok: false, left: true, bank: now, bets: 1 });
        expect(e.state().phase).toBe('done');
      }
    }
    // nothing bet: the forty comes back whole
    expect(faro({ bank: 40 }).leave()).toMatchObject({ ok: false, left: true, bank: 40, bets: 0 });
    // a bust the cards already dealt cannot be walked away from
    const b = faro({ bank: 10, seed: 1, schedule: [0], p: 0, split: 0, steady: null });
    b.press();
    expect(b.leave()).toMatchObject({ ok: false, bust: true, bank: 0 });
    // nor can a win be lost by it
    const w = faro({ bank: 75, target: 80, seed: 1, schedule: [1], split: 0 });
    w.press();
    expect(w.leave()).toMatchObject({ ok: true, bank: 84 });
    // a second call changes nothing
    expect(w.leave()).toMatchObject({ ok: true, bank: 84 });
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
  it('three numbers are chalked as a night at the tables: buy-in, down $N, up $N', () => {
    const e = slate();
    const st = e.state();
    expect(st.rows.map((r) => r.value)).toEqual([100, 30, 20]);
    expect(st.rows.map((r) => r.sign)).toEqual(['', '-', '+']);
    e.move('left'); // buy-in 80
    e.move('left'); // 60
    expect(e.state().rows[1].value).toBeLessThan(60);
    e.press();
    e.move('right'); // down $40
    e.press();
    e.press();
    e.press();
    expect(e.result).toMatchObject({ ok: true, buyin: 60, down: 40, up: 20 });
  });

  it('a default slate is not met by the faro payout alone: the lines go live at the card room door', () => {
    const r = slate();
    for (let k = 0; k < 4; k++) r.press();
    const p = newPurse(r.result);
    // the faro bank: forty to seventy, all of it in the stack
    p.stack += 30;
    win(p, 0);
    expect(line(p)).toBe('between');
    expect(p.reachedGoal).toBe(false);
    // at the card room door the lines go onto what Jo carries in
    rebase(p);
    expect(p.stop).toBe(100);
    expect(p.goal).toBe(150);
    expect(line(p)).toBe('between');
    expect(p.reachedGoal).toBe(false);
    win(p, 20);
    expect(line(p)).toBe('goal');
    lose(p, 60);
    expect(line(p)).toBe('below');
    expect(p.crossedStop).toBe(true);
    // a bust puts the lines back on the stack he walks in with next
    bust(p);
    expect(p.based).toBe(false);
  });

  it('the line reads the stack less what is owed: a marker never lights the goal; comps are debt', () => {
    const p = newPurse({ buyin: 100, down: 30, up: 20 });
    compStake(p, 10); // the dealer's free first bet: $10 on Mr Pell's book
    expect(p.comps).toBe(1);
    expect(p.debt).toBe(10);
    p.stack = 130;
    rebase(p);
    expect(p.goal).toBe(140); // 120 net + 20
    signMarker(p, 50);
    expect(net(p)).toBe(120);
    expect(line(p)).toBe('between'); // $180 in hand, $60 of it owed
    expect(p.reachedGoal).toBe(false);
    lose(p, 20);
    expect(line(p)).toBe('between');
    expect(cashOut(p)).toMatchObject({ cash: 100, paid: 60, owed: 0 });
    const lines = ledgerLines(p, 9).join(' ');
    expect(lines).toMatch(/Markers: \$60, paid \$60/);
    // a comp alone still shows on the last line
    const q = newPurse();
    compStake(q);
    expect(ledgerLines(q, 9).join(' ')).toMatch(/Owed Mr Pell \$10, paid \$10/);
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

describe('lostLast', () => {
  it('never leaves Jo better off than standing up', () => {
    const p = newPurse({ buyin: 100 });
    Object.assign(p, { stack: 40, sat: 60 });
    expect(lostLast(p).stack).toBe(60);
  });
  it('refills a big loss to the buy-in, no more', () => {
    const p = newPurse({ buyin: 100 });
    Object.assign(p, { stack: 0, sat: 150 });
    expect(lostLast(p).stack).toBe(100);
  });
});
