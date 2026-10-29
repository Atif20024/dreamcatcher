// PlaceAudio (audio pass): the life of a place besides its music and its
// loop — the one-shot bed (src/audio/events.js) and the people talking as
// Jo passes (src/audio/chatter.js). One per scene; the scene tells it the
// room's bed (setBed) and calls update() every frame, but it only thinks
// four times a second and makes nodes only when a sound starts.
//
//   const pa = new PlaceAudio(scene, { speakers: () => [...], listener: () => player })
//   pa.setBed('rain');   pa.update(time);   pa.state()
import { SHOTS, SHOT_META, EventBed } from './events.js';
import { BEDS } from './places.js';
import { Chatter, playBabble } from './chatter.js';
import { voice, noiseVoice, busNode, PRIO } from './synth.js';

export class PlaceAudio {
  constructor(scene, { speakers = () => [], listener = () => null, bus = 'ambience' } = {}) {
    this.scene = scene;
    this.speakers = speakers;
    this.listener = listener;
    this.bus = bus;
    this.bedKey = null;
    this.bed = null;
    this.chatter = new Chatter();
    this.next = 0;
    this.fired = 0;
    this.log = [];
    this.off = false;
  }

  now() {
    return this.scene && this.scene.time ? this.scene.time.now / 1000 : 0;
  }

  // the room's bed (a key of BEDS, or null for none); a new bed waits 6 s
  setBed(key) {
    const k = key && BEDS[key] ? key : null;
    if (k === this.bedKey) return;
    this.bedKey = k;
    this.bed = k ? new EventBed(BEDS[k], { start: this.now() }) : null;
  }

  update(timeMs) {
    if (this.off) return;
    const now = (timeMs ?? this.scene.time.now) / 1000;
    if (now < this.next) return;
    this.next = now + 0.25;
    const l = this.listener();
    if (!l) return;
    if (this.bed) for (const f of this.bed.update(now, l.x)) this.fire(f);
    let sp = [];
    try {
      sp = this.speakers() || [];
    } catch {
      sp = [];
    }
    this.chatter.update(now, l, sp);
  }

  // one shot through a panner (and a sweep across the field for a pass-by)
  fire(f) {
    this.fired += 1;
    this.log.push(f.shot);
    if (this.log.length > 16) this.log.shift();
    const draw = SHOTS[f.shot];
    const out = busNode(this.bus);
    if (!draw || !out) return false;
    const ctx = out.context;
    const t = ctx.currentTime + 0.03;
    const pan = ctx.createStereoPanner();
    const g = ctx.createGain();
    g.gain.value = f.level;
    pan.connect(g).connect(out);
    const sweep = SHOT_META[f.shot] && SHOT_META[f.shot].sweep;
    if (sweep) {
      const dir = f.pan >= 0 ? 1 : -1;
      pan.pan.setValueAtTime(-0.9 * dir, t);
      pan.pan.linearRampToValueAtTime(0.9 * dir, t + sweep);
    } else pan.pan.value = f.pan;
    const p = f.pitch || 1;
    let end = t;
    const track = (v) => {
      if (v && v.end) end = Math.max(end, v.end);
      return v;
    };
    const sink = {
      tone: (o) => track(voice(ctx, pan, { ...o, freq: o.freq * p, glide: o.glide ? o.glide * p : null, at: t + (o.when || 0), prio: PRIO.event })),
      noise: (o) => track(noiseVoice(ctx, pan, { ...o, f: (o.f || 1000) * p, to: o.to ? o.to * p : null, at: t + (o.when || 0), prio: PRIO.event })),
      babble: (o) => track(playBabble(pan, t + (o.when || 0), { ...o, rate: p, prio: PRIO.event })),
    };
    try {
      draw(sink);
    } catch {
      /* a bad shot stays silent */
    }
    // unplug the panner once the last voice is done (an offline render
    // keeps its own time, so it leaves the graph alone)
    if (!ctx.offline)
      setTimeout(() => {
        try {
          g.disconnect();
          pan.disconnect();
        } catch {
          /* gone */
        }
      }, Math.max(0, (end - ctx.currentTime) * 1000) + 500);
    return true;
  }

  destroy() {
    this.off = true;
    this.bed = null;
  }

  state() {
    return { bed: this.bedKey, fired: this.fired, last: this.log.slice(-4), chatter: this.chatter.state() };
  }
}
