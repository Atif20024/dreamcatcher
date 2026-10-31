// The slice of Phaser the art modules touch at texture-creation time.
// Anything else resolves to a harmless no-op so a module can import.
class RandomDataGenerator {
  constructor(seeds = ['0']) {
    let h = 2166136261;
    for (const ch of String(seeds[0] ?? '0')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    this.s = h >>> 0 || 1;
  }
  frac() {
    this.s ^= this.s << 13;
    this.s ^= this.s >>> 17;
    this.s ^= this.s << 5;
    return ((this.s >>> 0) % 1e9) / 1e9;
  }
  between(a, b) { return Math.floor(a + this.frac() * (b - a + 1)); }
  realInRange(a, b) { return a + this.frac() * (b - a); }
  pick(arr) { return arr[Math.floor(this.frac() * arr.length)]; }
  integerInRange(a, b) { return this.between(a, b); }
  sign() { return this.frac() < 0.5 ? -1 : 1; }
  angle() { return this.realInRange(-180, 180); }
}
const noop = () => noopProxy;
const noopProxy = new Proxy(noop, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : noopProxy), apply: () => noopProxy, construct: () => ({}) });
const Clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const Phaser = {
  Math: { RandomDataGenerator, Clamp, Between: (a, b) => Math.floor(a + Math.random() * (b - a + 1)), Linear: (a, b, t) => a + (b - a) * t },
  Display: {
    Color: {
      GetColor: (r, g, b) => (r << 16) | (g << 8) | b,
      IntegerToColor: (c) => {
        const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d) h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return { red: r * 255, green: g * 255, blue: b * 255, r: r * 255, g: g * 255, b: b * 255, h: h / 6, s: max ? d / max : 0, v: max };
      },
      HSVToRGB: (h, s, v) => {
        const i = ((Math.floor(h * 6) % 6) + 6) % 6, f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
        const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), color: (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255) };
      },
    },
  },
  Textures: { FilterMode: { LINEAR: 0, NEAREST: 1 } },
  BlendModes: { ADD: 1, NORMAL: 0, MULTIPLY: 2, SCREEN: 3 },
};
export default new Proxy(Phaser, { get: (t, k) => (k in t ? t[k] : noopProxy) });
