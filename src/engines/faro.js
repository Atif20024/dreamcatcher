// The faro bank (pure logic, no Phaser): THE LAST HAND's saloon game, the
// river sharp's truth-teller. Jo puts his money on a rank on the enamelled
// layout; the dealer draws two cards from the box, the bank's card and then
// the player's. His rank as the player's card: he wins the stake (less the
// house's 5 %). As the bank's card: he loses it. Both at once (a split): the
// bank takes half. That split is the house's edge, and it is real.
//
// The beginner's run is real too, and honest about it: the first two bets
// go the player's way 55 % of the time; after that 47 %.
//
//   const e = faro({ bank: 40, target: 80, seed: 2 });
//   e.move('right'); e.press('act'); e.update(dt); e.state(); e.done; e.result
//
// Rows: the card (← A … K →) and the bet (BET $10 · BET $20 · STAND UP);
// [up]/[down] change rows, [left]/[right] change the choice, [E] takes it.
import { rng } from './showdown.js';
import { rakeOf } from './purse.js';

export const FARO_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function faro({ bank = 40, target = 80, stakes = [10, 20], schedule = [0.55, 0.55], p = 0.47, split = 0.06, seed = 1, drawMs = 900, showMs = 1500, freeFirst = false } = {}) {
  const r = rng(seed + 101);
  const s = {
    bank,
    row: 1,
    card: 6, // the seven: where most people put it
    pick: 0, // BET $10
    phase: 'choose',
    phaseT: 0,
    bets: 0,
    turns: 0,
    wins: 0,
    losses: 0,
    splits: 0,
    rake: 0,
    houseMoney: freeFirst, // a comp: the house stakes the first bet
    last: null,
    events: [],
    done: false,
    result: null,
  };
  const actions = () => [...stakes.map((v) => ({ id: `bet${v}`, label: `BET $${v}`, stake: v, enabled: s.bank >= v })), { id: 'stand', label: 'STAND UP', enabled: true }];

  const finish = (res) => {
    s.done = true;
    s.phase = 'done';
    s.result = { ...res, bank: s.bank, bets: s.bets, turns: s.turns, wins: s.wins, losses: s.losses, splits: s.splits, rake: s.rake };
  };

  // one bet: the dealer draws pairs from the box until the rank shows
  const bet = (stake) => {
    s.bets += 1;
    const pWin = s.bets <= schedule.length ? schedule[s.bets - 1] : p;
    const x = r();
    const kind = x < split ? 'split' : x < split + (1 - split) * pWin ? 'win' : 'lose';
    // the cards the box gave up (the other rank is whatever came off with it)
    let other = Math.floor(r() * 12);
    if (other >= s.card) other += 1;
    const draws = 1 + Math.floor(r() * 3); // turns with no action first
    s.turns += draws;
    const free = s.houseMoney;
    s.houseMoney = false;
    let net = 0;
    let rake = 0;
    if (kind === 'win') {
      rake = rakeOf(stake);
      net = stake - rake;
      s.wins += 1;
      s.rake += rake;
    } else if (kind === 'lose') {
      net = free ? 0 : -stake;
      s.losses += 1;
    } else {
      net = free ? 0 : -Math.ceil(stake / 2);
      s.splits += 1;
    }
    s.bank += net;
    s.last = { kind, stake, net, rake, free, draws, banker: kind === 'win' ? other : s.card, player: kind === 'lose' ? other : s.card };
    s.events.push(kind);
    if (rake) s.events.push('rake');
    s.phase = 'draw';
    s.phaseT = 0;
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
      if (s.phase === 'draw' && s.phaseT >= drawMs) {
        s.phase = 'show';
        s.phaseT = 0;
      } else if (s.phase === 'show' && s.phaseT >= showMs) {
        s.phase = 'choose';
        s.phaseT = 0;
        if (s.bank >= target) finish({ ok: true });
        else if (s.bank < Math.min(...stakes)) finish({ ok: false, bust: true });
        else if (!actions()[s.pick].enabled) s.pick = 0;
      }
    },
    move(dir) {
      if (s.phase !== 'choose') return null;
      if (dir === 'up' || dir === 'down') {
        s.row = dir === 'up' ? 0 : 1;
        return 'move';
      }
      const d = dir === 'left' ? -1 : 1;
      if (s.row === 0) s.card = (s.card + d + 13) % 13;
      else {
        const a = actions();
        for (let k = 1; k <= a.length; k++) {
          const i = (s.pick + d * k + a.length * 2) % a.length;
          if (a[i].enabled) {
            s.pick = i;
            break;
          }
        }
      }
      return 'move';
    },
    press() {
      if (s.done) return 'done';
      if (s.phase === 'show' && s.phaseT > 500) {
        s.phaseT = showMs;
        return 'wait';
      }
      if (s.phase !== 'choose') return 'wait';
      if (s.row === 0) {
        s.row = 1;
        return 'move';
      }
      const a = actions()[s.pick];
      if (!a.enabled) return 'nope';
      if (a.id === 'stand') {
        finish({ ok: false, left: true });
        return 'done';
      }
      bet(a.stake);
      return s.last.kind;
    },
    takeEvents() {
      const e = s.events;
      s.events = [];
      return e;
    },
    state() {
      return {
        phase: s.phase,
        bank,
        now: s.bank,
        target,
        row: s.row,
        card: s.card,
        cardLabel: FARO_RANKS[s.card],
        actions: actions(),
        pick: s.pick,
        last: s.last,
        bets: s.bets,
        turns: s.turns,
        rake: s.rake,
        houseMoney: s.houseMoney,
      };
    },
  };
  return api;
}

export default faro;
