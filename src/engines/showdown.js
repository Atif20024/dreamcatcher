// SHOWDOWN (pure logic, no Phaser): THE LAST HAND's card game. Three-card
// poker that anyone can read: three of a kind beats a pair beats high card,
// and that is the whole rule book.
//
// A hand: everyone antes, everyone gets three cards, each player at the
// table shows ONE card face up and has a TELL (true, never random). Jo picks
// one verb:
//   CALL      see it: $10 each, and the best hand takes the pot
//   RAISE     $20, with a pair or better; each player calls or folds
//   BLUFF     the same $20 with nothing: it works only if every tell at the
//             table says they will fold (scared, or weak)
//   FOLD      let the ante go; the ledger shows what calling would have cost
//   STAND UP  fold and leave the table (the only verb that ends the night)
// Every pot is raked 5 % (rounded up) by the house. The engine never touches
// the odds: cards come off a shuffled deck.
//
//   const e = showdown({ seats: ['sorrel', 'nico'], stack: 100, seed: 3 });
//   e.update(dtMs); e.move('right'); e.press('act'); e.state(); e.done; e.result
//
// mode 'final' is the last table: Judge Voe slides one more across. Two cards
// each, face up, the same two for both (kings and nines: anybody's hand); the
// third card decides. CALL plays for the night's profit, RAISE for the whole
// stack; FOLD and BLUFF are dark; STAND UP is the only way out of the room.
import { rakeOf, TILT_EVENTS, TILTED } from './purse.js';

export const RANKS = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
export const HAND_NAMES = ['HIGH CARD', 'A PAIR', 'THREE OF A KIND'];
export const RULES = 'THREE OF A KIND  >  A PAIR  >  HIGH CARD';

export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 7;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s % 1000003) / 1000003;
  };
}

export function deck() {
  const d = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s });
  return d;
}

export function shuffle(cards, r) {
  const d = cards.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export const cardName = (c) => `${RANKS[c.r]} of ${SUITS[c.s]}`;

// a hand's value: category (0 high card, 1 pair, 2 three of a kind) and a
// score that orders any two hands (bigger wins; equal splits the pot)
export function rank(cards) {
  const rs = cards.map((c) => c.r).sort((a, b) => b - a);
  let cat = 0;
  let key = rs;
  if (rs[0] === rs[1] && rs[1] === rs[2]) cat = 2;
  else if (rs[0] === rs[1] || rs[1] === rs[2] || rs[0] === rs[2]) {
    cat = 1;
    const pair = rs[0] === rs[1] || rs[0] === rs[2] ? rs[0] : rs[1];
    const kick = rs.find((r) => r !== pair);
    key = [pair, pair, kick];
  }
  const score = cat * 1e6 + key[0] * 225 + key[1] * 15 + key[2];
  return { cat, score, name: HAND_NAMES[cat] };
}

// a hand's strength as a player feels it: a pair or better is strong; high
// card with an ace or a king is fair; the rest is weak
export function tier(cards) {
  const h = rank(cards);
  if (h.cat >= 1) return 'strong';
  return cards.some((c) => c.r >= 13) ? 'fair' : 'weak';
}

// the players. A tell is what you can SEE (true to the hand, every time);
// calls(tier) is whether they call a raise.
export const PLAYERS = Object.freeze({
  // Judge Harlan Voe: big, kindly, loose. He hums when he is happy, and he
  // calls everything (never bluff the Judge)
  judge: {
    name: 'JUDGE VOE',
    tell: (t) => (t === 'strong' ? 'hum' : 'quiet'),
    calls: () => true,
  },
  // Madame Sorrel: dry, patient, never bluffs. Pinky off the glass: she has
  // something (and calls). Hand still: she has nothing (and folds)
  sorrel: {
    name: 'MADAME SORREL',
    tell: (t) => (t === 'weak' ? 'still' : 'pinky'),
    calls: (t) => t !== 'weak',
  },
  // Nico Tarn: young, hot. He touches his collar when he is scared (and folds
  // to a raise); hands flat on the baize when he really has it
  nico: {
    name: 'NICO TARN',
    tell: (t) => (t === 'strong' ? 'flat' : 'collar'),
    calls: (t) => t === 'strong',
  },
});

// tells in words (the panel says it as well as showing it)
export const TELLS = Object.freeze({
  hum: { word: 'HUMS', strong: true },
  quiet: { word: 'QUIET', strong: false },
  pinky: { word: 'PINKY OFF THE GLASS', strong: true },
  still: { word: 'HAND STILL', strong: false, folds: true },
  collar: { word: 'TOUCHES HIS COLLAR', strong: false, folds: true },
  flat: { word: 'HANDS FLAT', strong: true },
});

export const VERBS = ['call', 'raise', 'fold', 'bluff', 'stand'];
export const VERB_LABELS = { call: 'CALL', raise: 'RAISE', fold: 'FOLD', bluff: 'BLUFF', stand: 'STAND UP' };

// what a sharp would do, reading these tells with this hand (Lou's advice
// when he is right)
export function bestVerb(joCards, tells) {
  if (rank(joCards).cat >= 1) return 'raise';
  if (tells.length && tells.every((t) => TELLS[t].folds)) return 'bluff';
  if (tells.some((t) => TELLS[t].strong)) return 'fold';
  return 'call';
}

// Lou's habits: what he says when he is wrong
const LOU_WRONG = { fold: 'call', call: 'bluff', raise: 'call', bluff: 'call' };

export function showdown({
  seats = ['judge'],
  stack = 100,
  tilt = 0,
  ante = 5,
  call = 10,
  raise = 20,
  seed = 1,
  mode = 'table',
  buyin = 100,
  lou = { wrongEvery: 4, firstWrong: false },
  dealMs = 700,
  revealMs = 2600,
  creepMs = 1800,
} = {}) {
  const r = rng(seed);
  const final = mode === 'final';
  const s = {
    phase: 'deal',
    phaseT: 0,
    hand: 0,
    stack,
    tilt,
    jo: [],
    opps: [],
    pot: 0,
    cursor: 0,
    creepT: 0,
    won: false, // a pot won at this table (the table is beaten)
    last: null, // the last hand's outcome
    tip: null,
    events: [], // for the presenter: deal, chip, rake, fold_chime, win, lose
    done: false,
    result: null,
    ledger: { hands: 0, folds: 0, saved: 0, rake: 0, won: 0, lost: 0 },
  };
  const opps = () => s.opps;

  const menu = () => {
    const jp = rank(s.jo).cat >= 1;
    const live = s.phase === 'decide';
    if (final) {
      const prof = finalStake();
      return [
        { id: 'call', label: `CALL $${prof}`, enabled: live, cost: prof },
        { id: 'raise', label: `RAISE $${s.stack}`, enabled: live, cost: s.stack },
        { id: 'fold', label: 'FOLD', enabled: false, why: 'the cards are face up: nothing to fold' },
        { id: 'bluff', label: 'BLUFF', enabled: false, why: 'the cards are face up: nothing to hide' },
        { id: 'stand', label: 'STAND UP', enabled: live, dark: true },
      ];
    }
    return [
      { id: 'call', label: `CALL $${call}`, enabled: live, cost: call },
      { id: 'raise', label: `RAISE $${raise}`, enabled: live && jp, cost: raise, why: jp ? null : 'a raise wants a pair' },
      { id: 'fold', label: 'FOLD', enabled: live },
      { id: 'bluff', label: `BLUFF $${raise}`, enabled: live && !jp, cost: raise, why: jp ? 'you have it: raise' : null },
      { id: 'stand', label: 'STAND UP', enabled: live },
    ];
  };

  // the night's profit is what the last hand is played for (at least $20)
  const finalStake = () => Math.min(s.stack, Math.max(20, s.stack - buyin));

  const snapCursor = () => {
    const m = menu();
    if (m[s.cursor] && m[s.cursor].enabled) return;
    const i = m.findIndex((x) => x.enabled);
    s.cursor = i < 0 ? 0 : i;
  };

  const deal = () => {
    s.hand += 1;
    s.last = null;
    const d = shuffle(deck(), r);
    if (final) {
      // kings and nines for both: the third card decides
      const pick = (rr, ss) => {
        const i = d.findIndex((c) => c.r === rr && c.s === ss);
        return d.splice(i, 1)[0];
      };
      s.jo = [pick(13, 1), pick(9, 3), null];
      const voe = [pick(13, 0), pick(9, 2), null];
      s.jo[2] = d.pop();
      voe[2] = d.pop();
      s.opps = [{ id: 'judge', cards: voe, up: [voe[0], voe[1]], tell: 'hum', folded: false, inPot: 0 }];
      s.pot = 0;
    } else {
      if (s.stack < ante) return finish({ ok: s.won, bust: true });
      s.jo = [d.pop(), d.pop(), d.pop()];
      s.opps = seats.map((id) => {
        const cards = [d.pop(), d.pop(), d.pop()];
        return { id, cards, up: [cards[0]], tell: PLAYERS[id].tell(tier(cards)), folded: false, inPot: ante };
      });
      s.stack -= ante;
      s.pot = ante * (seats.length + 1);
    }
    s.ledger.hands += 1;
    s.events.push('deal');
    // Lou at Jo's shoulder: one tip a hand; about one in four is his habit talking
    if (lou && !final) {
      const right = bestVerb(s.jo, s.opps.map((o) => o.tell));
      const wrong = (lou.firstWrong && s.hand === 1) || (lou.wrongEvery && (s.hand + seed) % lou.wrongEvery === 0);
      s.tip = { say: wrong ? LOU_WRONG[right] : right, right: !wrong, best: right };
    } else s.tip = null;
    s.phase = 'deal';
    s.phaseT = 0;
    s.creepT = 0;
    s.cursor = 0;
  };

  const best = (list) => list.reduce((m, o) => Math.max(m, rank(o.cards).score), -1);

  // settle the pot among Jo (if in) and the players still in; Jo's share back
  const settle = (joIn, joPut, kind) => {
    const live = opps().filter((o) => !o.folded);
    const joScore = rank(s.jo).score;
    const top = Math.max(joIn ? joScore : -1, best(live));
    const rake = rakeOf(s.pot);
    const net = s.pot - rake;
    const winners = (joIn && joScore === top ? 1 : 0) + live.filter((o) => rank(o.cards).score === top).length;
    const joWins = joIn && joScore === top;
    const back = joWins ? Math.floor(net / winners) : 0;
    s.stack += back;
    const joRake = joWins ? Math.ceil(rake / winners) : 0;
    const out = { kind, joIn, joWins, split: joWins && winners > 1, back, put: joPut, net: back - joPut, rake: joRake, houseRake: rake, pot: s.pot, joHand: rank(s.jo).name, joCat: rank(s.jo).cat };
    if (joWins) s.ledger.rake += joRake;
    return out;
  };

  const tiltBy = (ev) => {
    s.tilt = Math.max(0, Math.min(1, s.tilt + TILT_EVENTS[ev]));
  };

  const play = (verb) => {
    const ms = menu();
    const item = ms.find((m) => m.id === verb);
    if (!item || !item.enabled) return 'nope';
    let out;
    if (final) {
      if (verb === 'stand') return finish({ ok: true, stood: true, final: true });
      const stake = item.cost;
      s.stack -= stake;
      s.pot = stake * 2;
      s.opps[0].inPot = stake;
      out = settle(true, stake, 'final');
      out.stake = stake;
      s.events.push(out.joWins ? 'win' : 'lose');
      reveal(out);
      return out.joWins ? 'win' : 'lose';
    }
    const joCards = s.jo;
    if (verb === 'fold' || verb === 'stand') {
      // what calling would have done: the best hand among everyone at $10 more
      const top = best(opps());
      const would = rank(joCards).score > top;
      const callPot = s.pot + call * (seats.length + 1);
      out = settle(false, ante, verb);
      s.ledger.folds += 1;
      if (!would) {
        out.saved = call;
        s.ledger.saved += call;
        tiltBy('good_fold');
        s.events.push('fold_chime');
      } else out.missed = callPot - rakeOf(callPot); // the pot it would have taken
      reveal(out);
      if (verb === 'stand') return finish({ ok: s.won, stood: true, won: s.won });
      return 'fold';
    }
    if (verb === 'call') {
      s.stack -= call;
      s.pot += call * (seats.length + 1);
      for (const o of opps()) o.inPot += call;
      out = settle(true, ante + call, 'call');
    } else {
      // raise or bluff: each player calls or folds by their hand (the tell said which)
      s.stack -= raise;
      s.pot += raise;
      for (const o of opps()) {
        const t = tier(o.cards);
        if (PLAYERS[o.id].calls(t)) {
          s.pot += raise;
          o.inPot += raise;
        } else o.folded = true;
      }
      const callers = opps().filter((o) => !o.folded);
      out = settle(true, ante + raise, verb);
      out.folds = opps().filter((o) => o.folded).map((o) => o.id);
      out.callers = callers.map((o) => o.id);
      if (verb === 'bluff') out.bluffWorked = callers.length === 0;
    }
    if (out.joWins) {
      s.won = true;
      s.ledger.won += 1;
      tiltBy('won');
      s.events.push('win');
    } else {
      s.ledger.lost += 1;
      if (verb === 'bluff' && out.callers && out.callers.length) tiltBy('bluff_called');
      else if (out.joCat >= 1) tiltBy('bad_beat');
      else tiltBy('lost');
      if (s.pot >= 40) tiltBy('big_loss');
      s.events.push('lose');
    }
    reveal(out);
    return out.joWins ? 'win' : 'lose';
  };

  const reveal = (out) => {
    s.last = out;
    s.phase = 'reveal';
    s.phaseT = 0;
  };

  const finish = (res) => {
    s.done = true;
    s.phase = 'done';
    s.result = { ...res, stack: s.stack, tilt: s.tilt, ledger: { ...s.ledger }, hands: s.hand };
    return 'done';
  };

  const api = {
    get done() {
      return s.done;
    },
    get result() {
      return s.result;
    },
    update(dt) {
      if (s.done) return;
      s.phaseT += dt;
      if (s.phase === 'deal' && s.phaseT >= dealMs) {
        s.phase = 'decide';
        s.phaseT = 0;
        snapCursor();
      } else if (s.phase === 'decide' && s.tilt >= TILTED) {
        // tilted, the bet creeps up by itself: the cursor drifts to the big bet
        s.creepT += dt;
        if (s.creepT >= creepMs) {
          s.creepT = 0;
          const m = menu();
          const target = m.findIndex((x) => (x.id === 'raise' || x.id === 'bluff') && x.enabled);
          if (target >= 0 && s.cursor !== target) {
            const d = Math.sign(target - s.cursor);
            let i = s.cursor + d;
            while (i !== target && !m[i].enabled) i += d;
            s.cursor = i;
            s.events.push('creep');
          }
        }
      } else if (s.phase === 'reveal' && s.phaseT >= revealMs) api.next();
    },
    // after a reveal: the next hand (a bust ends the table)
    next() {
      if (s.done || s.phase !== 'reveal') return;
      if (final) {
        if (s.last && !s.last.joWins && !s.last.split) return finish({ ok: false, lostNight: true });
        return deal();
      }
      if (s.stack < ante) return finish({ ok: false, bust: true, won: s.won });
      deal();
    },
    move(dir) {
      if (s.phase !== 'decide') return null;
      const m = menu();
      const step = dir === 'left' || dir === 'up' ? -1 : 1;
      for (let k = 1; k <= m.length; k++) {
        const i = (s.cursor + step * k + m.length * 2) % m.length;
        if (m[i].enabled) {
          s.cursor = i;
          s.creepT = 0;
          return 'move';
        }
      }
      return null;
    },
    // 'act' plays the verb under the cursor (or a named verb); in a reveal
    // it deals the next hand once the cards have been seen
    press(what = 'act') {
      if (s.done) return 'done';
      if (s.phase === 'reveal') {
        if (s.phaseT > 700) api.next();
        return 'wait';
      }
      if (s.phase !== 'decide') return 'wait';
      const verb = what === 'act' ? menu()[s.cursor].id : what;
      return play(verb);
    },
    // the presenter drains these each frame (sounds, chips, the rake coin)
    takeEvents() {
      const e = s.events;
      s.events = [];
      return e;
    },
    state() {
      const m = menu();
      const showAll = s.phase === 'reveal' || s.phase === 'done';
      return {
        phase: s.phase,
        mode,
        hand: s.hand,
        stack: s.stack,
        tilt: s.tilt,
        tilted: s.tilt >= TILTED,
        pot: s.pot,
        jo: s.jo.slice(),
        joHand: s.jo.length && s.jo.every(Boolean) ? rank(s.jo).name : '',
        opps: s.opps.map((o) => ({
          id: o.id,
          name: PLAYERS[o.id].name,
          up: o.up,
          cards: showAll || final ? o.cards : null,
          hand: showAll ? rank(o.cards).name : null,
          tell: o.tell,
          tellWord: TELLS[o.tell].word,
          folded: o.folded,
        })),
        menu: m,
        cursor: s.cursor,
        won: s.won,
        tip: s.tip,
        last: s.last,
        rules: RULES,
        ledger: { ...s.ledger },
      };
    },
  };
  deal();
  return api;
}

export default showdown;
