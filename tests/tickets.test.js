// The ticket rail (src/engines/tickets.js) and its balance: seeded bots play
// the line at rush with the kitchen's real distances.
import { describe, it, expect } from 'vitest';
import { Service, readHands, nightLine } from '../src/engines/tickets.js';
import { LINE, PREP, PIT } from '../src/dreams/chef/services.js';

const T = 32;
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// a person: runs at px/s, stops to read, loses time at the burners
const BOTS = {
  expert: { speed: 280, read: 150, burners: 0.15, misread: 0 },
  ordinary: { speed: 240, read: 600, burners: 0.5, misread: 0.1 },
  slow: { speed: 150, read: 1400, burners: 1, misread: 0.25 },
};

// which station is worth walking to next: a plate first, then a ready pan,
// then the most urgent ticket's next stop (a misread picks another ticket)
function nextStation(sv, r, bot) {
  if (sv.hands) return sv.hands.to;
  for (const [id, sl] of Object.entries(sv.slots)) if (sl.some((s) => s && s.state !== 'cooking')) return id;
  const c = sv.rail.filter((k) => !k.firing && k.idx < k.stops.length);
  if (!c.length) return null;
  c.sort((a, b) => (a.due ? a.left : 1e9) - (b.due ? b.left : 1e9));
  const k = r() < bot.misread ? c[c.length - 1] : c[0];
  const s = k.stops[k.idx];
  if (sv.stock[s] !== undefined && sv.stock[s] <= 0) return 'reserve';
  return s;
}

function play(def, botName, { difficulty = 0, seed = 7, stock = def.stock, max = 900000 } = {}) {
  const bot = BOTS[botName];
  const r = rng(seed);
  const sv = new Service({ ...def, difficulty, stock });
  let x = 12 * T;
  let target = null;
  let wait = 0;
  let stalls = 0;
  const dt = 50;
  while (!sv.done && sv.t < max) {
    sv.update(dt);
    sv.drain();
    if (sv.working) continue;
    if (wait > 0) {
      wait -= dt;
      continue;
    }
    if (!target) {
      target = nextStation(sv, r, bot);
      if (!target) continue;
      wait = bot.read * (0.5 + r());
      continue;
    }
    const tx = def.stations[target].x * T;
    const d = tx - x;
    if (Math.abs(d) < 24) {
      sv.use(target);
      target = null;
      continue;
    }
    x += Math.sign(d) * Math.min(Math.abs(d), (bot.speed * dt) / 1000);
    // the burners between the sauce and the pass make Jo wait for a beat
    if (x > 26 * T && x < 44 * T && r() < (bot.burners * dt) / 1000) {
      wait = 500;
      stalls += 1;
      if (r() < bot.burners * 0.15) sv.spill();
    }
  }
  return { sv, t: sv.t, tally: sv.tally, stalls };
}

const fullMise = { grill: 7, sauce: 6, larder: 4 };

if (process.env.RAIL_TABLE) {
  for (const b of Object.keys(BOTS)) for (const d of [0, 1, 2]) {
    const r = play(LINE, b, { difficulty: d, stock: fullMise });
    console.log(b, `d${d}`, Math.round(r.t / 1000) + 's', JSON.stringify(r.tally));
  }
}

describe('the rail', () => {
  const stations = {
    a: { kind: 'quick', x: 1, label: 'A' },
    b: { kind: 'work', x: 2, work: 1000, label: 'B' },
    f: { kind: 'fire', x: 3, cook: 1000, hold: 1000, scrape: 500, slots: 1, label: 'F' },
    p: { kind: 'to', x: 4, label: 'P' },
    q: { kind: 'to', x: 5, label: 'Q' },
    res: { kind: 'reserve', x: 6, work: 100, label: 'R' },
  };
  const one = (extra) => new Service({ stations, tickets: [{ id: 'k', table: 1, dish: 'D', stops: ['a', 'b'], to: 'p', due: 5000, ...extra }] });

  it('stops happen in order and the last one fills the hands', () => {
    const s = one();
    expect(s.plan('b').act).toBe('none');
    expect(s.use('a').act).toBe('quick');
    expect(s.use('b').act).toBe('work');
    expect(s.use('a').act).toBe('none'); // busy
    s.update(1100);
    expect(s.hands.id).toBe('k');
    expect(s.use('q').act).toBe('none'); // the wrong destination says so
    expect(s.use('p').act).toBe('serve');
    expect(s.done).toBe(true);
    expect(s.tally.clean).toBe(1);
  });

  it('a late ticket is called back with its progress, then someone else takes it: never fatal', () => {
    const s = one({ due: 1000 });
    s.use('a');
    s.update(1001);
    expect(s.tally.late).toBe(1);
    expect(s.rail[0].idx).toBe(1);
    expect(s.rail[0].left).toBeGreaterThan(0);
    s.update(1200);
    expect(s.tally.bailed).toBe(1);
    expect(s.done).toBe(true);
  });

  it('a pan left on burns; scrape it, lay another', () => {
    const s = new Service({ stations, stock: { f: 2 }, tickets: [{ id: 'k', table: 1, dish: 'D', stops: ['f'], to: 'p' }] });
    expect(s.use('f').act).toBe('lay');
    s.update(1001);
    expect(s.stationState('f')[0].state).toBe('ready');
    s.update(1001);
    expect(s.tally.burnt).toBe(1);
    expect(s.use('f').act).toBe('scrape');
    s.update(600);
    expect(s.use('f').act).toBe('lay');
    expect(s.stock.f).toBe(0);
    s.update(1001);
    expect(s.use('f').act).toBe('collect');
    expect(s.hands.id).toBe('k');
  });

  it('full hands refuse the next plate but can always reach the pass (no deadlock)', () => {
    const s = new Service({ stations, tickets: [{ id: 'k', table: 1, dish: 'D', stops: ['a'], to: 'p' }, { id: 'j', table: 2, dish: 'E', stops: ['a'], to: 'q' }] });
    s.use('a');
    expect(s.hands.id).toBe('k');
    expect(s.plan('a').act).toBe('none');
    expect(s.plan('p').act).toBe('serve');
    s.use('p');
    expect(s.plan('a').act).toBe('quick');
  });

  it('a spill sends the plate back to its last stop, nothing before it is lost', () => {
    const s = one();
    s.use('a');
    s.use('b');
    s.update(1100);
    expect(s.spill().id).toBe('k');
    expect(s.hands).toBe(null);
    expect(s.rail[0].idx).toBe(1);
    expect(s.tally.spilled).toBe(1);
  });

  it('out of stock points at the reserve; the reserve tops it up', () => {
    const s = new Service({ stations, stock: { a: 0 }, tickets: [{ id: 'k', table: 1, dish: 'D', stops: ['a'], to: 'p' }] });
    expect(s.plan('a').out).toBe(true);
    expect(s.use('res').act).toBe('restock');
    s.update(200);
    expect(s.stock.a).toBe(3);
    expect(s.plan('a').act).toBe('quick');
  });

  it('a table changing its mind drops the stops it no longer wants', () => {
    const s = new Service({ stations, tickets: [{ id: 'k', table: 1, dish: 'D', stops: ['a', 'b'], to: 'p', amendAt: 100, amendStops: ['a'], amendNote: 'NO B' }] });
    s.use('a');
    s.update(150);
    expect(s.rail[0].note).toBe('NO B');
    expect(s.hands.id).toBe('k');
  });

  it('a change of mind waits for full hands instead of being lost', () => {
    const s = new Service({ stations, tickets: [
      { id: 'k', table: 1, dish: 'D', stops: ['a', 'b'], to: 'p', amendAt: 100, amendStops: ['a'], amendNote: 'NO B' },
      { id: 'j', table: 2, dish: 'E', stops: ['a'], to: 'p' },
    ] });
    s.use('a'); // k has all it will want
    s.use('a'); // and j is in his hands
    expect(s.hands.id).toBe('j');
    s.update(150);
    expect(s.rail.find((k) => k.id === 'k').note).toBe(undefined);
    s.use('p');
    s.update(50);
    expect(s.rail[0].note).toBe('NO B');
    expect(s.hands.id).toBe('k');
  });

  it('a limit ends the service with what got done (the prep clock)', () => {
    const s = new Service({ stations, limit: 1000, tickets: [{ id: 'k', table: 1, dish: 'D', stops: ['a'], to: 'p' }] });
    s.update(1001);
    expect(s.done && s.timedOut).toBe(true);
  });

  it('a key item finishes its ticket from outside', () => {
    const s = one();
    expect(s.complete('k')).toBe(true);
    expect(s.done).toBe(true);
  });
});

describe('balance (seeded bots on the real line)', () => {
  it('every kind of player finishes at every difficulty', () => {
    for (const b of Object.keys(BOTS)) {
      for (const difficulty of [0, 1, 2]) {
        for (const seed of [3, 11, 29]) {
          const { sv, t } = play(LINE, b, { difficulty, seed, stock: fullMise });
          expect(sv.done, `${b} d${difficulty} s${seed}`).toBe(true);
          expect(t).toBeLessThan(480000);
        }
      }
    }
  });

  it('the rush runs two to four minutes for an ordinary player', () => {
    const { t } = play(LINE, 'ordinary', { stock: fullMise });
    expect(t).toBeGreaterThan(130000);
    expect(t).toBeLessThan(240000);
  });

  it('skill shows: an expert clean, a slow player late and bailed out, never stuck', () => {
    const ex = play(LINE, 'expert', { stock: fullMise }).tally;
    const sl = play(LINE, 'slow', { stock: fullMise }).tally;
    expect(ex.late).toBeLessThanOrEqual(1);
    expect(ex.clean).toBeGreaterThan(sl.clean);
    expect(sl.late).toBeGreaterThan(ex.late);
    expect(sl.served + sl.bailed).toBeGreaterThanOrEqual(12);
  });

  it('difficulty bites: more late tickets for the same player', () => {
    const late = (d) => [3, 11, 29, 41].reduce((n, seed) => n + play(LINE, 'ordinary', { difficulty: d, seed, stock: fullMise }).tally.late, 0);
    expect(late(2)).toBeGreaterThan(late(0));
  });

  it('the mise matters: no prep means trips to the reserve shelf', () => {
    const none = play(LINE, 'ordinary', { stock: LINE.stock }).tally.trips;
    const full = play(LINE, 'ordinary', { stock: fullMise }).tally.trips;
    expect(none).toBeGreaterThan(full);
  });

  it('the prep clock: an expert finishes the mise, a first-timer has to choose', () => {
    const served = (b, seed = 5) => play(PREP, b, { seed, stock: {} }).tally.served;
    expect(served('expert')).toBe(3);
    expect(served('slow')).toBeLessThan(3);
  });

  it('the pit always clears, no clock can stop it', () => {
    expect(play(PIT, 'slow', { stock: {} }).sv.done).toBe(true);
  });
});

describe('the hands', () => {
  it('reads the night: burns, frost, flour, onion', () => {
    const r = readHands({ burns: 1, frost: true, mise: 2, onions: true });
    expect(r.marks).toMatchObject({ burn: true, frost: true, flour: true, onion: true });
    expect(r.lines.join(' ')).toMatch(/left thumb/);
    expect(r.lines.join(' ')).toMatch(/Onion/);
  });
  it('what she took is said true to the count', () => {
    const last = (bails) => readHands({ bails }).lines.at(-1);
    expect(last(1)).toMatch(/one plate/);
    expect(last(2)).toMatch(/a few/);
    expect(last(5)).toMatch(/half/);
    expect(readHands({ bails: 1 }).lines.length).toBe(readHands({ bails: 1 }).keys.length);
  });
  it('the card counts plates and tables', () => {
    expect(nightLine({ plates: 11, sent2: true, sent3: true })).toBe('11 plates, 2 tables. Nobody sent one back.');
  });
  it('clean hands read differently', () => {
    const r = readHands({});
    expect(r.marks.burn).toBe(false);
    expect(r.lines.join(' ')).toMatch(/round the fire/);
  });
});
