// THE YELLOW HOUSE §3 — pigment, the palette, complementaries and the clock.
// Pure data and small state machines; the scene draws them.

export const PIGMENTS = {
  yellow: { hex: 0xf2d060, complement: 'violet', wet: 5000, primary: true, name: 'yellow' },
  blue: { hex: 0x2e4a80, complement: 'orange', wet: 4000, primary: true, name: 'blue' },
  red: { hex: 0xc03a2a, complement: 'green', wet: 3500, primary: true, name: 'red' },
  green: { hex: 0x4a8a4a, complement: 'red', wet: 8000, name: 'green' },
  orange: { hex: 0xe8762a, complement: 'blue', wet: 2000, name: 'orange' },
  violet: { hex: 0x5b3a7a, complement: 'yellow', wet: 4500, name: 'violet' },
  white: { hex: 0xf2ece0, complement: null, wet: 0, name: 'white' },
};
export const PRIMARIES = ['yellow', 'blue', 'red'];
export const SECONDARIES = ['green', 'orange', 'violet'];

// what two wells on the brush make
export function mixPigments(a, b) {
  const s = [a, b].sort().join('+');
  return { 'blue+yellow': 'green', 'red+yellow': 'orange', 'blue+red': 'violet' }[s] || null;
}
export function complementOf(c) {
  return PIGMENTS[c] ? PIGMENTS[c].complement : null;
}
export function areComplements(a, b) {
  return !!a && !!b && complementOf(a) === b;
}
// the tint a painted tile takes (the base tiles are cream, so the pigment
// multiplies in almost pure)
export function tintFor(colour) {
  const p = PIGMENTS[colour];
  if (!p) return 0xffffff;
  const c = p.hex;
  // lift it a touch so the stroke texture's ridges still read
  const r = Math.min(255, ((c >> 16) & 255) + 50);
  const g = Math.min(255, ((c >> 8) & 255) + 50);
  const b = Math.min(255, (c & 255) + 50);
  return (r << 16) | (g << 8) | b;
}
// the underpainting: umber and grey-blue only, 70% contrast (§5.8)
export const UNDER_UMBER = 0x8a7458;
export const UNDER_GREY = 0x6a7484;
export function underTint(tx, ty) {
  // patches, not a checker: a cheap hash-noise over 3-tile cells
  const h = (x, y) => {
    let v = (x | 0) * 374761393 + (y | 0) * 668265263;
    v = (v ^ (v >>> 13)) * 1274126177;
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  };
  const cx = Math.floor(tx / 3);
  const cy = Math.floor(ty / 2);
  const n = h(cx, cy) * 0.7 + h(tx, ty) * 0.3;
  return n > 0.6 ? UNDER_GREY : n > 0.45 ? 0x7e6e5a : UNDER_UMBER;
}

// ---- the palette: three wells, twelve strokes each, and it is the health bar
export class Palette {
  constructor({ wells = 3, capacity = 12 } = {}) {
    this.max = wells;
    this.capacity = capacity;
    this.wells = Array.from({ length: wells }, () => ({ colour: null, strokes: 0 }));
    this.sel = 0;
    this.mixing = false; // mixing unlocked by P1
    this.lastLost = null;
  }
  get selected() {
    return this.wells[this.sel];
  }
  colours() {
    return this.wells.filter((w) => w.colour && w.strokes > 0).map((w) => w.colour);
  }
  has(colour) {
    return this.wells.some((w) => w.colour === colour && w.strokes > 0);
  }
  empty() {
    return this.wells.every((w) => !w.colour || w.strokes <= 0);
  }
  filled() {
    return this.wells.filter((w) => w.colour && w.strokes > 0).length;
  }
  // the brush's colour: the selected well, or the mix of it and the next one
  brush() {
    const a = this.selected;
    if (!a.colour || a.strokes <= 0) return null;
    if (this.mixing && this.max > 1) {
      const b = this.wells[(this.sel + 1) % this.max];
      if (b.colour && b.strokes > 0 && b.colour !== a.colour) {
        const m = mixPigments(a.colour, b.colour);
        if (m) return m;
      }
    }
    return a.colour;
  }
  // a tube goes in: refill a well of that colour, fill an empty one, or
  // replace the selected one (dropping one to take another is a real decision)
  take(colour, { capacity = this.capacity } = {}) {
    let w = this.wells.find((x) => x.colour === colour);
    if (!w) w = this.wells.find((x) => !x.colour || x.strokes <= 0);
    let dropped = null;
    if (!w) {
      w = this.selected;
      dropped = w.colour;
    }
    w.colour = colour;
    w.strokes = capacity;
    return dropped;
  }
  // spend one stroke of whatever is on the brush (two wells when mixing)
  spend(n = 1) {
    const a = this.selected;
    if (!a.colour || a.strokes <= 0) return false;
    const brush = this.brush();
    if (this.mixing && brush !== a.colour) {
      const b = this.wells[(this.sel + 1) % this.max];
      a.strokes = Math.max(0, a.strokes - n);
      b.strokes = Math.max(0, b.strokes - n);
    } else a.strokes = Math.max(0, a.strokes - n);
    return true;
  }
  spendColour(colour, n = 1) {
    const w = this.wells.find((x) => x.colour === colour && x.strokes > 0);
    if (!w) return false;
    w.strokes = Math.max(0, w.strokes - n);
    return true;
  }
  // a hit: one well spills. Returns the colour lost (or null if nothing to lose)
  spill() {
    const order = [this.sel, (this.sel + 1) % this.max, (this.sel + 2) % this.max];
    for (const i of order) {
      const w = this.wells[i];
      if (w && w.colour && w.strokes > 0) {
        this.lastLost = w.colour;
        w.strokes = 0;
        return w.colour;
      }
    }
    return null;
  }
  clear() {
    for (const w of this.wells) {
      if (w.colour) this.lastLost = w.colour;
      w.colour = null;
      w.strokes = 0;
    }
  }
  select(i) {
    this.sel = ((i % this.max) + this.max) % this.max;
  }
}

// ---- the clock: moves only when Jo paints -----------------------------------
export class Clock {
  constructor({ perStroke = 1 } = {}) {
    this.hour = 7; // dawn
    this.day = 1;
    this.perStroke = perStroke; // minutes
    this.locked = null; // a section can lock it ('night')
  }
  get h() {
    return this.locked === 'night' ? 22 : this.hour;
  }
  stroke(n = 1) {
    if (this.locked) return;
    this.hour = Math.min(23, this.hour + (this.perStroke * n) / 60);
  }
  set(h) {
    this.hour = h;
  }
  sleep() {
    this.day += 1;
    this.hour = 6;
  }
  get phase() {
    const h = this.h;
    if (h < 8) return 'dawn';
    if (h < 16) return 'noon';
    if (h < 20) return 'evening';
    return 'night';
  }
  // the sun's angle: shadows lie west in the morning, east in the evening; long at both ends
  shadow() {
    const t = (this.h - 6) / 15; // 0 dawn .. 1 nine at night
    const k = Math.min(1, Math.max(0, t));
    const len = 0.5 + Math.abs(k - 0.5) * 1.6; // long at dawn and dusk
    const dir = k < 0.5 ? -1 : 1;
    return { len, dir, night: this.phase === 'night' };
  }
  // the wash over the whole screen by hour: [colour, alpha]
  tint() {
    const h = this.h;
    if (this.phase === 'night') return [0x1f3a5f, 0.42];
    if (h < 8) return [0xe8a070, 0.16];
    if (h < 16) return [0xfff2a0, 0.04];
    if (h < 18) return [0xe8762a, 0.14];
    return [0x5b3a7a, 0.28];
  }
  within([a, b]) {
    return this.h >= a && this.h <= b;
  }
}

// ---- complementaries: which painted edges vibrate -------------------------------
// painted: Map 'tx,ty' -> colour. Returns a list of {tx,ty,colour,other} tiles
// that sit beside their complement.
export function vibratingTiles(painted) {
  const out = [];
  for (const [k, colour] of painted) {
    const [tx, ty] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const o = painted.get(`${tx + dx},${ty + dy}`);
      if (o && areComplements(colour, o)) {
        out.push({ tx, ty, colour, other: o });
        break;
      }
    }
  }
  return out;
}
