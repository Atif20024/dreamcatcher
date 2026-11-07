// The music clock (audio pass, advice §1 "Music is setInterval"): beats are
// scheduled against the audio clock with a look-ahead, so they never drift
// or bunch. A coarse timer wakes the clock (`pump`) and every beat that
// falls inside the look-ahead window is handed to `onBeat(b, at)` with its
// exact time. The game's 'beat' event (hazards fire on it) is emitted at
// the beat's own moment.
//
// Time source: the AudioContext while it runs; the page clock otherwise (dev
// is silent and has no context at all; a browser holds a new context
// suspended until the first click). A jump in the source (a background tab,
// a resumed context) re-anchors the grid instead of firing a burst of
// catch-up beats.
export function audioNow(ctx) {
  if (ctx && ctx.state === 'running') return { t: ctx.currentTime, src: 'ctx' };
  const p = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return { t: p / 1000, src: 'page' };
}

export class BeatClock {
  // now: () → { t, src }; onBeat(b, at, now); emit(b, delayMs)
  constructor({ now, bpm = 100, onBeat, emit = null, lookahead = 0.15, interval = 50, timers = null }) {
    this.now = now;
    this.bpm = bpm;
    this.onBeat = onBeat;
    this.emit = emit;
    this.lookahead = lookahead;
    this.interval = interval;
    this.timers = timers || { setInterval: (f, ms) => setInterval(f, ms), clearInterval: (id) => clearInterval(id) };
    this.timer = null;
    this.beat = 0;
    this.anchor = null; // { beat, t, src }
    this.last = null;
  }

  get beatDur() {
    return 60 / this.bpm;
  }

  timeOf(b) {
    return this.anchor.t + (b - this.anchor.beat) * this.beatDur;
  }

  start() {
    this.stop();
    const n = this.now();
    this.anchor = { beat: this.beat, t: n.t + 0.05, src: n.src };
    this.last = n;
    this.timer = this.timers.setInterval(() => this.pump(), this.interval);
    this.pump();
  }

  stop() {
    if (this.timer) this.timers.clearInterval(this.timer);
    this.timer = null;
  }

  get running() {
    return !!this.timer;
  }

  // a new tempo keeps the next beat where it was and respaces the rest
  setBpm(bpm) {
    if (!bpm || bpm === this.bpm) return;
    if (this.anchor) this.anchor = { beat: this.beat, t: this.timeOf(this.beat), src: this.anchor.src };
    this.bpm = bpm;
  }

  pump() {
    if (!this.anchor) return;
    const n = this.now();
    const jumped = n.src !== this.anchor.src || n.t < this.last.t - 0.01 || n.t - this.last.t > 0.75;
    this.last = n;
    // a stall (background tab) or a new time source: start the grid again
    // from now rather than firing every missed beat at once
    if (jumped || this.timeOf(this.beat) < n.t - 0.25) this.anchor = { beat: this.beat, t: n.t + 0.02, src: n.src };
    let guard = 0;
    while (this.timeOf(this.beat) < n.t + this.lookahead && guard++ < 16) {
      const b = this.beat++;
      const at = this.timeOf(b);
      try {
        this.onBeat(b, at, n);
      } catch (e) {
        /* a bad voice must not stop the clock */
      }
      if (this.emit) this.emit(b, Math.max(0, (at - n.t) * 1000));
    }
  }
}
