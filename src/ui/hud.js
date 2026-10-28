// HUD state (plan §2.11 HudGrid). Gameplay scenes publish values here; the
// UIScene's HudGrid renders them in fixed slots at zoom 1. Nothing in this
// module draws, so it works before UIScene exists and in unit tests.
//
//   hud.bind(scene)                  the scene that owns the HUD now
//   hud.set('objective', 'find the saffron')
//   hud.set('hearts', { n: 3, max: 5, texture: 'heart' })
//   hud.set('tool', ['INK ▮▮▮▯', 'DRAFT 3 PP.'])     (the dream's resource slot)
//   const p = hud.prompt(); p.setText('[E] talk').setPosition(wx, wy).setVisible(true)
//
// Slots and their layout budget (max width at 1×, max lines). A value that
// would overflow is cut with '…' and recorded in hud.overflows (dev overlay,
// scenario `hud-budget`).
import { events } from '../core/events.js';

export const SLOTS = Object.freeze({
  hearts: { x: 16, y: 12, maxW: 300, lines: 1 },
  level: { x: 16, y: 48, maxW: 300, lines: 1, font: 'small', color: 'ink-dim' },
  shards: { x: 16, y: 84, maxW: 300, lines: 1, font: 'small', color: 'calm' },
  objective: { x: 480, y: 12, maxW: 400, lines: 2, font: 'small', color: 'accent', align: 'center' },
  coins: { x: 944, y: 12, maxW: 260, lines: 1, font: 'small', color: 'accent', align: 'right' },
  // under the goal line's second row, so a two-line goal never meets it
  tool: { x: 944, y: 64, maxW: 300, lines: 4, font: 'small', color: 'ink', align: 'right' },
  context: { x: 16, y: 524, maxW: 560, lines: 2, font: 'small', color: 'ink-dim', align: 'left' },
  caption: { x: 480, y: 464, maxW: 900, lines: 2, font: 'small', color: 'ink-dim', align: 'center' },
  footer: { x: 944, y: 524, maxW: 340, lines: 1, font: 'small', color: 'ink-dim', align: 'right' },
  prompt: { maxW: 420, lines: 1, font: 'small', color: 'accent', align: 'center' },
});

// Every text slot sits on the §8 plate (line height + 4 px a side), and
// the slots keep 8 px between plates: a two-line goal pushes the level line
// down (HudGrid); the tool lines start under a two-line goal.
// the meter stack (§8): one right-aligned row per dream meter (COLD, BREATH,
// O₂, PWR, NOISE …) under the tool lines, each a label and a bar on one plate
export const TOOL_BARS = Object.freeze({ right: 944, y: 64, w: 120, h: 10, gap: 30 });

const defaults = () => ({
  profile: 'default',
  hearts: null,
  level: '',
  shards: '',
  objective: '',
  coins: null,
  tool: [],
  context: '',
  caption: '',
  footer: '',
  prompt: { text: '[E]', x: 0, y: 0, visible: false },
  meters: [],
  regions: {},
});

class HudModel {
  constructor() {
    this.owner = null;
    this.s = defaults();
    this.v = 0;
    this.overflows = [];
  }

  bind(scene, profile = 'default') {
    this.owner = scene;
    this.s = defaults();
    this._tool = [];
    this.s.profile = profile;
    this.overflows = [];
    this.v++;
    if (scene && scene.events) {
      scene.events.once('shutdown', () => {
        if (this.owner !== scene) return;
        this.owner = null;
        this.s = defaults();
        this.s.profile = 'none';
        this.v++;
      });
    }
    return this;
  }

  get(key) {
    return this.s[key];
  }

  set(key, value) {
    const prev = this.s[key];
    if (prev === value) return this;
    if (Array.isArray(value) && Array.isArray(prev) && value.length === prev.length && value.every((x, i) => x === prev[i])) return this;
    this.s[key] = value;
    this.v++;
    events.emit('hud:changed', { key, value });
    return this;
  }

  // a world-anchored interact prompt with the old Text-like API
  prompt() {
    const self = this;
    const p = {
      get visible() {
        return self.s.prompt.visible;
      },
      get text() {
        return self.s.prompt.text;
      },
      setText(text) {
        self.set('prompt', { ...self.s.prompt, text: String(text) });
        return p;
      },
      setPosition(x, y) {
        const q = self.s.prompt;
        if (q.x !== x || q.y !== y) self.s.prompt = { ...q, x, y }; // per-frame: no version bump
        return p;
      },
      setVisible(v) {
        if (self.s.prompt.visible !== !!v) self.set('prompt', { ...self.s.prompt, visible: !!v });
        return p;
      },
      setOrigin: () => p,
      setDepth: () => p,
      destroy: () => self.set('prompt', { ...self.s.prompt, visible: false }),
    };
    return p;
  }

  // one line of the dream's tool slot (top-right), with its own colour.
  // Lines are ordered by index; empty or hidden lines take no room.
  toolLine(i, color = null) {
    const self = this;
    self._tool = self._tool || [];
    self._tool[i] = self._tool[i] || { text: '', color, visible: true };
    const push = () => self.set('tool', self._tool.filter((l) => l && l.visible && l.text).map((l) => ({ text: l.text, color: l.color })));
    const h = {
      get text() {
        return self._tool[i].text;
      },
      setText(t) {
        if (self._tool[i].text === String(t ?? '')) return h;
        self._tool[i] = { ...self._tool[i], text: String(t ?? '') };
        push();
        return h;
      },
      setColor(c) {
        if (self._tool[i].color === c) return h;
        self._tool[i] = { ...self._tool[i], color: c };
        push();
        return h;
      },
      setVisible(v) {
        if (self._tool[i].visible === !!v) return h;
        self._tool[i] = { ...self._tool[i], visible: !!v };
        push();
        return h;
      },
      setOrigin: () => h,
      setDepth: () => h,
      setScrollFactor: () => h,
      setPosition: () => h,
      destroy: () => h.setVisible(false),
    };
    return h;
  }

  // the y (1×) just under the tool slot's text lines
  toolBottom() {
    const n = (this.s.tool || []).length;
    return (this.s.coins ? SLOTS.tool.y : SLOTS.coins.y) + n * 20 + 6;
  }

  // a widget a dream draws itself (the Painter's palette) claims a HUD grid
  // region, so the grid's overlap rule covers it: { x, y, w, h } or null
  region(id, rect) {
    const prev = this.s.regions[id];
    if (JSON.stringify(prev || null) === JSON.stringify(rect || null)) return this;
    this.s.regions = { ...this.s.regions, [id]: rect || undefined };
    if (!rect) delete this.s.regions[id];
    this.v++;
    return this;
  }

  // a dream meter in the HUD grid's meter stack (§8): HudGrid draws it.
  //   const cold = hud.meter('cold', { label: 'COLD', color: '#88b8d8' });
  //   cold.set(0.4).setVisible(true)
  // The fill changes every frame without bumping the HUD version.
  meter(id, { label = '', color = '#88b8d8', order = 0, visible = true } = {}) {
    const self = this;
    let m = self.s.meters.find((x) => x.id === id);
    if (!m) {
      m = { id, label, color, order, visible, frac: 1 };
      self.s.meters = [...self.s.meters, m].sort((a, b) => a.order - b.order);
      self.v++;
    }
    const h = {
      get frac() {
        return m.frac;
      },
      set(f) {
        m.frac = Math.max(0, Math.min(1, Number(f) || 0));
        return h;
      },
      setLabel(t) {
        if (m.label !== t) {
          m.label = t;
          self.v++;
        }
        return h;
      },
      setColor(c) {
        m.color = c;
        return h;
      },
      setVisible(v) {
        if (m.visible !== !!v) {
          m.visible = !!v;
          self.v++;
        }
        return h;
      },
      get visible() {
        return m.visible;
      },
      destroy() {
        self.s.meters = self.s.meters.filter((x) => x !== m);
        self.v++;
      },
    };
    return h;
  }

  // a Text-like handle on a text slot (old code calls `.setText` on HUD lines)
  line(key) {
    const self = this;
    const h = {
      get text() {
        const v = self.s[key];
        return Array.isArray(v) ? v.join('\n') : v || '';
      },
      setText(t) {
        self.set(key, t);
        return h;
      },
      setColor: () => h,
      setVisible: () => h,
    };
    return h;
  }
}

export const hud = new HudModel();

// cut a value to a slot's budget: measure(text) → px width at 1× scale
export function fitToBudget(key, text, measureLine) {
  const slot = SLOTS[key];
  if (!slot || !text) return text;
  const lines = String(text).split('\n');
  let out = lines.slice(0, slot.lines);
  let over = lines.length > slot.lines;
  out = out.map((l) => {
    if (measureLine(l) <= slot.maxW) return l;
    over = true;
    let s = l;
    while (s.length > 1 && measureLine(`${s}…`) > slot.maxW) s = s.slice(0, -1);
    return `${s}…`;
  });
  if (over) hud.overflows.push({ key, text: String(text) });
  return out.join('\n');
}
