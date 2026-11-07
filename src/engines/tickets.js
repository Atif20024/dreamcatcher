// The ticket rail (FIVE-STAR DREAM, docs/dream_chef.md): pure rules, no Phaser.
// Tickets come in; each lists its stops in order and where the plate goes.
// Jo stands at a station and uses it; the station does the next stop of the
// most urgent ticket that wants it. Station kinds:
//   quick    done at once
//   work     Jo's body is busy for `work` ms (the caller holds him still)
//   fire     lay it on and walk away: cooks `cook` ms, ready for `hold` ms,
//            then burnt (scrape the pan: `scrape` ms; the ticket lays again)
//   to       a destination: takes the plate in Jo's hands
//   reserve  work, then tops up the stations that are out of stock
// Hands hold one finished plate. A ticket's last stop needs them empty, and
// every plate has somewhere to go, so hands can never deadlock the service.
// A late ticket is called back (refire) with its progress; after `bailAfter`
// refires someone else takes it. The service always ends.

export const SCALE = { due: [1, 0.9, 0.8], limit: [1, 0.9, 0.8] };
const tier = (d) => Math.max(0, Math.min(2, d | 0));

export class Service {
  // stations: { id: { kind, label, cook, hold, slots, scrape, work, verb, stock } }
  // tickets:  [{ id, at?, after?: 'clear', sitting?, table, dish, stops, to, due?, gives?, minDifficulty?,
  //              amendAt?, amendStops?, amendNote?, inHand? }]
  constructor({ stations, tickets, difficulty = 0, stock = {}, limit = 0, maxRail = 3, bailAfter = 2, reserveGives = 3 }) {
    const d = tier(difficulty);
    this.stations = stations;
    this.stock = { ...stock };
    this.dueScale = SCALE.due[d];
    this.limit = limit * SCALE.limit[d];
    this.maxRail = maxRail;
    this.bailAfter = bailAfter;
    this.reserveGives = reserveGives;
    this.t = 0;
    this.queue = tickets
      .filter((k) => (k.minDifficulty || 0) <= (difficulty | 0))
      .map((k) => ({ ...k, stops: [...(k.stops || [])], at: (k.at || 0) * this.dueScale, due: (k.due || 0) * this.dueScale, idx: 0, left: 0, refires: 0, firing: false, amended: false }));
    this.rail = [];
    this.hands = null; // the ticket whose plate Jo is holding
    this.working = null; // { station, ticket, left, total, what }
    this.slots = {};
    for (const [id, s] of Object.entries(stations)) if (s.kind === 'fire') this.slots[id] = Array.from({ length: s.slots || 1 }, () => null);
    this.tally = { served: 0, clean: 0, late: 0, bailed: 0, burnt: 0, spilled: 0, out: 0, trips: 0 };
    this.servedTables = [];
    this.sitting = 0;
    this.done = false;
    this.timedOut = false;
    this.events = [];
    this.arrive();
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  // what happened since the last call
  drain() {
    const e = this.events;
    this.events = [];
    return e;
  }

  arrive() {
    const blocked = (k) => k.after === 'clear' && (this.rail.length || this.hands || this.queue[0] !== k);
    // an empty rail with a gap ahead: the next ticket comes early, nobody stands idle
    if (!this.rail.length && !this.hands && this.queue.length && !this.queue[0].after && this.queue[0].at > this.t + 2000) this.queue[0].at = this.t + 2000;
    while (this.queue.length && this.rail.length < this.maxRail && this.queue[0].at <= this.t && !blocked(this.queue[0])) {
      const k = this.queue.shift();
      k.left = k.due;
      this.rail.push(k);
      if (k.sitting && k.sitting !== this.sitting) {
        this.sitting = k.sitting;
        this.emit('sitting', { sitting: k.sitting });
      }
      this.emit('arrive', { ticket: k });
      if (k.inHand && !this.hands) {
        k.idx = k.stops.length;
        this.hands = k;
      }
    }
  }

  update(dt) {
    if (this.done) return;
    this.t += dt;
    this.arrive();
    // the cooks
    for (const [id, slots] of Object.entries(this.slots)) {
      const st = this.stations[id];
      slots.forEach((sl) => {
        if (!sl || sl.state === 'burnt') return;
        sl.t += dt;
        if (sl.state === 'cooking' && sl.t >= st.cook) {
          sl.state = 'ready';
          sl.t = 0;
          this.emit('ready', { station: id, ticket: sl.ticket });
        } else if (sl.state === 'ready' && sl.t >= st.hold) {
          sl.state = 'burnt';
          this.tally.burnt += 1;
          this.emit('burnt', { station: id, ticket: sl.ticket });
        }
      });
    }
    // Jo's hands at work
    if (this.working) {
      this.working.left -= dt;
      if (this.working.left <= 0) this.finishWork();
    }
    // the clocks
    for (const k of [...this.rail]) {
      if (k.amendAt !== undefined && !k.amended && this.t >= k.amendAt * this.dueScale) this.amend(k);
      if (!k.due || k === this.hands) continue;
      k.left -= dt;
      if (k.left <= 0) this.late(k);
    }
    if (this.limit && this.t >= this.limit) {
      this.done = true;
      this.timedOut = true;
      this.emit('timeup');
      return;
    }
    this.checkDone();
  }

  checkDone() {
    if (!this.queue.length && !this.rail.length && !this.hands && !this.working) {
      this.done = true;
      this.emit('done');
    }
  }

  // a table changes its mind: the stops already done stand, the rest change
  amend(k) {
    if (this.hands === k) return; // it's already plated: too late to change it
    const doneStops = k.stops.slice(0, k.idx);
    const stops = [...doneStops, ...k.amendStops.filter((s) => !doneStops.includes(s))];
    // every stop it still wants is done: the plate is up, if Jo's hands are free
    const up = k.idx >= stops.length && !k.firing;
    if (up && this.hands) return; // his hands are full: it waits, the next update asks again
    k.amended = true;
    k.stops = stops;
    k.note = k.amendNote;
    this.emit('amend', { ticket: k });
    if (up) {
      this.hands = k;
      this.emit('plated', { ticket: k });
    }
  }

  late(k) {
    k.refires += 1;
    this.tally.late += 1;
    if (k.refires >= this.bailAfter) {
      this.remove(k);
      this.tally.bailed += 1;
      this.servedTables.push(k.table);
      this.emit('bail', { ticket: k });
      return;
    }
    k.left = k.due * 1.1;
    this.emit('refire', { ticket: k });
  }

  remove(k) {
    this.rail = this.rail.filter((x) => x !== k);
    if (this.hands === k) this.hands = null;
    if (this.working && this.working.ticket === k) this.working = null;
    for (const slots of Object.values(this.slots)) slots.forEach((sl, i) => {
      if (sl && sl.ticket === k) slots[i] = null;
    });
  }

  // a ticket done by something other than a station (a key item picked up)
  complete(id) {
    const k = this.rail.find((x) => x.id === id);
    if (!k) return false;
    this.remove(k);
    this.tally.served += 1;
    this.emit('served', { ticket: k, clean: true });
    this.checkDone();
    return true;
  }

  // the most urgent ticket whose next stop is this station (no clock = last)
  wanting(id) {
    const c = this.rail.filter((k) => k.stops[k.idx] === id && !k.firing);
    c.sort((a, b) => (a.due ? a.left : Infinity) - (b.due ? b.left : Infinity));
    return c[0] || null;
  }

  // what a use of this station would do now. Pure: the prompt reads it.
  plan(id) {
    const st = this.stations[id];
    if (!st) return { act: 'none', line: 'nothing here' };
    if (this.done) return { act: 'none', line: '' };
    if (this.working) return { act: 'none', line: 'busy' };
    if (st.kind === 'to') {
      if (!this.hands) return { act: 'none', line: st.empty || 'Nothing in your hands.' };
      if (this.hands.to !== id) return { act: 'none', line: `That goes to ${this.stations[this.hands.to].label}.` };
      return { act: 'serve', ticket: this.hands };
    }
    if (st.kind === 'reserve') {
      const low = Object.keys(this.stock).filter((s) => this.stock[s] <= 0);
      if (!low.length) return { act: 'none', line: st.full || 'Nothing is out yet.' };
      return { act: 'restock', low };
    }
    if (st.kind === 'fire') {
      const sl = this.slots[id];
      const ready = sl.find((s) => s && s.state === 'ready');
      if (ready) {
        const last = ready.ticket.idx === ready.ticket.stops.length - 1;
        if (last && this.hands) return { act: 'none', line: `Hands full: table ${this.hands.table} first.` };
        return { act: 'collect', ticket: ready.ticket };
      }
      const burnt = sl.find((s) => s && s.state === 'burnt');
      if (burnt) return { act: 'scrape', ticket: burnt.ticket };
      const k = this.wanting(id);
      if (!k) return { act: 'none', line: this.idleLine(id) };
      if (!sl.includes(null)) return { act: 'none', line: 'Every pan is on.' };
      if (this.outOf(id)) return { act: 'none', line: st.out || `Out of it. The reserve shelf.`, out: true };
      return { act: 'lay', ticket: k };
    }
    const k = this.wanting(id);
    if (!k) return { act: 'none', line: this.idleLine(id) };
    if (this.outOf(id)) return { act: 'none', line: st.out || `Out of it. The reserve shelf.`, out: true };
    const last = k.idx === k.stops.length - 1;
    if (last && this.hands) return { act: 'none', line: `Hands full: table ${this.hands.table} first.` };
    return { act: st.kind === 'work' ? 'work' : 'quick', ticket: k };
  }

  outOf(id) {
    return this.stock[id] !== undefined && this.stock[id] <= 0;
  }

  idleLine(id) {
    const later = this.rail.find((k) => k.stops.indexOf(id) > k.idx);
    if (later) {
      const next = this.stations[later.stops[later.idx]];
      return `Not yet: ${later.dish} wants ${next ? next.label : 'something else'} first.`;
    }
    return this.stations[id].idle || 'Nothing on the rail wants this.';
  }

  // Jo pressed [E] here
  use(id) {
    const p = this.plan(id);
    const st = this.stations[id];
    const take = () => {
      if (this.stock[id] !== undefined) this.stock[id] -= 1;
    };
    switch (p.act) {
      case 'serve': {
        const k = p.ticket;
        const clean = k.refires === 0 && (!k.due || k.left / k.due >= 0.35);
        this.remove(k);
        this.tally.served += 1;
        if (clean) this.tally.clean += 1;
        this.servedTables.push(k.table);
        this.emit('served', { ticket: k, clean, station: id });
        this.checkDone();
        return { ...p, clean };
      }
      case 'lay': {
        take();
        const sl = this.slots[id];
        const i = sl.indexOf(null);
        sl[i] = { ticket: p.ticket, state: 'cooking', t: 0 };
        p.ticket.firing = true;
        this.emit('laid', { station: id, ticket: p.ticket });
        return p;
      }
      case 'collect': {
        const sl = this.slots[id];
        const i = sl.findIndex((s) => s && s.ticket === p.ticket);
        sl[i] = null;
        p.ticket.firing = false;
        this.advance(p.ticket, id);
        return p;
      }
      case 'scrape':
        this.working = { station: id, ticket: p.ticket, left: st.scrape || 1500, total: st.scrape || 1500, what: 'scrape' };
        return { ...p, work: this.working.total };
      case 'restock':
        this.working = { station: id, ticket: null, left: st.work || 2500, total: st.work || 2500, what: 'restock' };
        this.tally.trips += 1;
        return { ...p, work: this.working.total };
      case 'work':
        take();
        this.working = { station: id, ticket: p.ticket, left: st.work, total: st.work, what: 'work' };
        return { ...p, work: st.work };
      case 'quick':
        take();
        this.advance(p.ticket, id);
        return p;
      default:
        if (p.out) this.tally.out += 1;
        return p;
    }
  }

  finishWork() {
    const w = this.working;
    this.working = null;
    if (!w) return;
    if (w.what === 'scrape') {
      const sl = this.slots[w.station];
      const i = sl.findIndex((s) => s && s.ticket === w.ticket);
      if (i >= 0) sl[i] = null;
      w.ticket.firing = false;
      this.emit('scraped', { station: w.station, ticket: w.ticket });
      return;
    }
    if (w.what === 'restock') {
      for (const s of Object.keys(this.stock)) if (this.stock[s] <= 0) this.stock[s] += this.reserveGives;
      this.emit('restocked', { station: w.station });
      return;
    }
    this.advance(w.ticket, w.station);
  }

  advance(k, station) {
    k.idx += 1;
    this.emit('stop', { ticket: k, station });
    if (k.idx >= k.stops.length) {
      this.hands = k;
      this.emit('plated', { ticket: k, station });
    }
  }

  // Jo was hit with a plate in his hands: it goes back to its last stop, and
  // the ticket keeps everything before that. Returns the ticket, or null.
  spill() {
    const k = this.hands;
    if (!k || k.inHand) return null;
    this.hands = null;
    k.idx = Math.max(0, k.stops.length - 1);
    this.tally.spilled += 1;
    this.emit('spilled', { ticket: k });
    return k;
  }

  // a plain view for the rail on screen and the tests
  view() {
    return this.rail.map((k) => ({
      id: k.id,
      table: k.table,
      dish: k.dish,
      note: k.note || null,
      to: k.to,
      toLabel: this.stations[k.to] ? this.stations[k.to].short || this.stations[k.to].label : k.to,
      frac: k.due ? Math.max(0, k.left / k.due) : 1,
      timed: !!k.due,
      refires: k.refires,
      held: this.hands === k,
      stops: k.stops.map((s, i) => {
        const sl = this.slots[s] ? this.slots[s].find((x) => x && x.ticket === k) : null;
        return { id: s, label: (this.stations[s] && (this.stations[s].short || this.stations[s].label)) || s, done: i < k.idx, now: i === k.idx, state: sl ? sl.state : null };
      }),
    }));
  }

  stationState(id) {
    const sl = this.slots[id];
    if (!sl) return null;
    return sl.map((s) => (s ? { state: s.state, frac: Math.min(1, s.t / (s.state === 'cooking' ? this.stations[id].cook : this.stations[id].hold)) } : null));
  }
}

// What Aurelio reads on Jo's hands (the "show me your hands" payoff), from
// what the run actually did. Marks draw the painted hands; lines are spoken.
export function readHands(F = {}) {
  const marks = {
    burn: (F.burns || 0) > 0,
    burns: F.burns || 0,
    frost: !!F.frost,
    flour: (F.mise || 0) > 0,
    onion: !!F.onions,
    soap: !!F.pit_done,
  };
  const lines = [];
  const keys = []; // lines[i] is about this mark (the thumb, the cuffs...), or null
  const read = (key, text) => {
    lines.push(text);
    keys.push(key);
  };
  if (marks.burn) read('burn', marks.burns > 2 ? 'Three burns. You keep going back to the same fire.' : 'A burn on the left thumb.');
  if (marks.frost) read('frost', 'Frost still on the cuff.');
  if (marks.flour) read('flour', 'Flour in the nails.');
  if (marks.onion) read('onion', 'Onion. That is not from my station.');
  if (!marks.burn) read('burn', 'No burns. You went round the fire all night.');
  const bails = F.bails || 0;
  if (bails > 4) read(null, "And Marguerite's on half your plates. I can smell her butter.");
  else if (bails > 1) read(null, 'And Marguerite has put her hands on a few of them.');
  else if (bails === 1) read(null, 'And one plate has her butter on it. I can smell it.');
  return { marks, lines, keys };
}

// the night's plates, for the ending's lines (the room shows one plate a table)
export function nightLine(F = {}) {
  const sent = F.plates || 0;
  const tables = Object.keys(F).filter((k) => /^sent\d+$/.test(k) && F[k]).length;
  return `${sent} plate${sent === 1 ? '' : 's'}, ${tables} table${tables === 1 ? '' : 's'}. Nobody sent one back.`;
}
