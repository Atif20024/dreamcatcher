// Headless capture of the runtime string-art (placeholder atlases).
//
// The game's art modules draw characters with Phaser Graphics (fillStyle +
// fillRect → generateTexture) or a 2D canvas (fillStyle/fillRect/drawImage,
// globalAlpha, a vertical gradient). A fake scene records exactly those
// calls into RGBA images keyed by texture key, so the build can pack them
// under the SAME names the code already uses. Anything a fake cannot draw
// faithfully marks its texture unsupported (it stays runtime-painted).
import { image } from './raster.js';

// a universal no-op (returned by any call a fake cannot draw)
const NOOP = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : NOOP), apply: () => NOOP, set: () => true });

function parseColor(s) {
  if (typeof s === 'number') return [(s >> 16) & 255, (s >> 8) & 255, s & 255, 1];
  if (typeof s !== 'string') return null;
  let m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  m = s.match(/^#([0-9a-f]{3})$/i);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)).concat(1);
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  return null;
}

function over(img, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height || a <= 0) return;
  const o = (y * img.width + x) * 4;
  const da = img.data[o + 3] / 255;
  const oa = a + da * (1 - a);
  if (oa <= 0) return;
  img.data[o] = Math.round((r * a + img.data[o] * da * (1 - a)) / oa);
  img.data[o + 1] = Math.round((g * a + img.data[o + 1] * da * (1 - a)) / oa);
  img.data[o + 2] = Math.round((b * a + img.data[o + 2] * da * (1 - a)) / oa);
  img.data[o + 3] = Math.round(oa * 255);
}
function eraseAlpha(img, x, y, a) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const o = (y * img.width + x) * 4;
  img.data[o + 3] = Math.round(img.data[o + 3] * (1 - a));
}

function makeCtx(rec) {
  const img = rec.img;
  const st = { fill: [0, 0, 0, 1], alpha: 1, op: 'source-over', grad: null };
  const target = {
    get canvas() {
      return { width: img.width, height: img.height, __rec: rec };
    },
    set fillStyle(v) {
      if (v && v.__grad) {
        st.grad = v;
        return;
      }
      st.grad = null;
      const c = parseColor(v);
      if (c) st.fill = c;
      else rec.unsupported = `fillStyle ${v}`;
    },
    get fillStyle() {
      return st.fill;
    },
    set globalAlpha(v) {
      st.alpha = v;
    },
    get globalAlpha() {
      return st.alpha;
    },
    set globalCompositeOperation(v) {
      if (v !== 'source-over' && v !== 'destination-out') rec.unsupported = `composite ${v}`;
      st.op = v;
    },
    set imageSmoothingEnabled(v) {},
    fillRect(x, y, w, h) {
      const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
      const x1 = Math.min(img.width, Math.round(x + w)), y1 = Math.min(img.height, Math.round(y + h));
      for (let yy = y0; yy < y1; yy++) {
        let c = st.fill;
        if (st.grad) c = st.grad.at(yy + 0.5);
        for (let xx = x0; xx < x1; xx++) {
          if (st.op === 'destination-out') eraseAlpha(img, xx, yy, c[3] * st.alpha);
          else over(img, xx, yy, c[0], c[1], c[2], c[3] * st.alpha);
        }
      }
    },
    clearRect(x, y, w, h) {
      for (let yy = Math.max(0, y); yy < Math.min(img.height, y + h); yy++)
        for (let xx = Math.max(0, x); xx < Math.min(img.width, x + w); xx++) img.data.fill(0, (yy * img.width + xx) * 4, (yy * img.width + xx) * 4 + 4);
    },
    createLinearGradient(x0, y0, x1, y1) {
      if (x0 !== x1) rec.unsupported = 'horizontal gradient';
      const stops = [];
      return {
        __grad: true,
        addColorStop(t, c) {
          stops.push([t, parseColor(c)]);
          stops.sort((a, b) => a[0] - b[0]);
        },
        at(y) {
          const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0 || 1)));
          let a = stops[0], b = stops[stops.length - 1];
          for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) [a, b] = [stops[i], stops[i + 1]];
          const k = (t - a[0]) / (b[0] - a[0] || 1);
          return a[1].map((v, i) => v + (b[1][i] - v) * k);
        },
      };
    },
    drawImage(src, dx, dy) {
      const s = src && (src.__rec || (src.canvas && src.canvas.__rec));
      if (!s || arguments.length > 3) {
        rec.unsupported = 'drawImage';
        return;
      }
      for (let y = 0; y < s.img.height; y++)
        for (let x = 0; x < s.img.width; x++) {
          const o = (y * s.img.width + x) * 4;
          const a = (s.img.data[o + 3] / 255) * st.alpha;
          if (a) over(img, x + Math.round(dx), y + Math.round(dy), s.img.data[o], s.img.data[o + 1], s.img.data[o + 2], a);
        }
    },
    save() {},
    restore() {},
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      return () => {
        rec.unsupported = `ctx.${String(k)}`;
        return NOOP;
      };
    },
    set(t, k, v) {
      if (Object.getOwnPropertyDescriptor(t, k) || k in t) {
        t[k] = v;
        return true;
      }
      if (k === 'lineWidth' || k === 'strokeStyle' || k === 'font' || k === 'textAlign' || k === 'textBaseline' || k === 'shadowBlur' || k === 'shadowColor' || k === 'filter' || k === 'lineCap' || k === 'lineJoin') rec.unsupported = `ctx.${String(k)}`;
      return true;
    },
  });
}

function makeGraphics(store) {
  let ops = [];
  let cur = [0xffffff, 1];
  let bad = null;
  const g = {
    fillStyle(c, a = 1) {
      cur = [c, a];
      return proxy;
    },
    fillRect(x, y, w, h) {
      ops.push([x, y, w, h, cur[0], cur[1]]);
      return proxy;
    },
    clear() {
      ops = [];
      bad = null;
      return proxy;
    },
    destroy() {},
    generateTexture(key, w, h) {
      if (store.has(key)) return proxy;
      const rec = { key, img: image(Math.max(1, w), Math.max(1, h)), unsupported: bad };
      for (const [x, y, ww, hh, c, a] of ops)
        for (let yy = Math.max(0, y); yy < Math.min(h, y + hh); yy++)
          for (let xx = Math.max(0, x); xx < Math.min(w, x + ww); xx++) over(rec.img, xx, yy, (c >> 16) & 255, (c >> 8) & 255, c & 255, a);
      store.set(key, rec);
      return proxy;
    },
  };
  const proxy = new Proxy(g, {
    get(t, k) {
      if (k in t) return t[k];
      return () => {
        bad = `graphics.${String(k)}`;
        return proxy;
      };
    },
  });
  return proxy;
}

// a fake Phaser scene whose texture manager records into `store`
export function fakeScene(store = new Map()) {
  const texRef = (key) => {
    const rec = store.get(key);
    return {
      key,
      getSourceImage: () => ({ tagName: 'CANVAS', __rec: rec, width: rec?.img.width, height: rec?.img.height }),
      setFilter() {},
      get: () => ({ width: rec?.img.width, height: rec?.img.height }),
      source: [{ width: rec?.img.width, height: rec?.img.height }],
    };
  };
  const scene = {
    store,
    textures: {
      exists: (k) => store.has(k),
      get: (k) => texRef(k),
      remove: (k) => store.delete(k),
      createCanvas: (key, w, h) => {
        const rec = { key, img: image(Math.max(1, w), Math.max(1, h)), unsupported: null };
        store.set(key, rec);
        const ctx = makeCtx(rec);
        rec.canvas = { __rec: rec, width: w, height: h };
        return { key, getContext: () => ctx, context: ctx, refresh() {}, setFilter() {}, getSourceImage: () => rec.canvas, canvas: rec.canvas };
      },
      addCanvas: () => {},
      on() {},
      once() {},
    },
    make: { graphics: () => makeGraphics(store) },
    add: new Proxy({}, { get: () => () => new Proxy({}, { get: () => () => ({}) }) }),
    sys: { game: { config: {} } },
  };
  return scene;
}
