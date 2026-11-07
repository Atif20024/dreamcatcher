// What the day is doing to the picture: data and arithmetic, no Phaser. A track's
// `light` runs from one of these to another with distance; RoadView asks for the
// blend, keeps the bands it paints from, and tints what stands by the road.
//   dark      0 a day's picture … 1 the road only as far as light reaches it
//   ambient   what is left of a colour in the dark; warm: under a lamp or a headlight
//   beam      m: how far the headlights carry (the plan's draw distance halved at night)
//   headlamp  how much the headlights light what they reach: a 1958 lamp is a dim yellow thing, so at night the lamp pools are the light
//   haze      what a distance fades to by day; nightHaze: by dark
import { mix } from '../../../art/paint.js';

export const mul = (c, t) => {
  const f = (s) => Math.round((((c >> s) & 255) * ((t >> s) & 255)) / 255) << s;
  return f(16) | f(8) | f(0);
};

const DAY = { dark: 0, ambient: 0xffffff, warm: 0xffffff, beam: 240, headlamp: 1, nightHaze: 0xd8d4b4, land: 0xffffff, spriteAmbient: 0xffffff };
export const LIGHTS = {
  day: { ...DAY, haze: 0xd8d4b4 },
  noon: {
    ...DAY,
    haze: 0xf8f4e4,
    land: 0xfff8f0,
    sky: { top: 0x8ebddc, mid: 0xd8e8ec, bottom: 0xfff8e8 },
  },
  dusk: {
    ...DAY,
    dark: 0.6,
    haze: 0xe0966a,
    ambient: 0x8a7078,
    spriteAmbient: 0x9c7f88,
    warm: 0xffecc8,
    beam: 180,
    headlamp: 0.8,
    nightHaze: 0x7a4e60,
    land: 0x8a6a78,
    sky: { top: 0x3a3a70, mid: 0xc06a68, bottom: 0xf0a860, bars: 0x6a3a58 },
  },
  night: {
    ...DAY,
    dark: 1,
    haze: 0x161a34,
    ambient: 0x2c3258,
    spriteAmbient: 0x3a4270,
    warm: 0xffe8c4,
    beam: 108,
    headlamp: 0.6,
    nightHaze: 0x161a34,
    land: 0x3a4468,
    sky: { top: 0x070a1c, mid: 0x0e1230, bottom: 0x20264a, stars: 90 },
  },
  dawn: {
    ...DAY,
    dark: 0.42,
    haze: 0xe8b090,
    ambient: 0x8a84a0,
    spriteAmbient: 0x9c94a8,
    warm: 0xffecd0,
    beam: 200,
    headlamp: 0.85,
    nightHaze: 0x8a6e80,
    land: 0x7a6a80,
    sky: { top: 0x2c3a6c, mid: 0xc88a88, bottom: 0xffcc90, stars: 12, bars: 0xe88a70 },
  },
};

const blend = (a, b, k) => ({
  dark: a.dark + (b.dark - a.dark) * k,
  ambient: mix(a.ambient, b.ambient, k),
  spriteAmbient: mix(a.spriteAmbient, b.spriteAmbient, k),
  warm: mix(a.warm, b.warm, k),
  beam: a.beam + (b.beam - a.beam) * k,
  headlamp: a.headlamp + (b.headlamp - a.headlamp) * k,
  haze: mix(a.haze, b.haze, k),
  nightHaze: mix(a.nightHaze, b.nightHaze, k),
  land: mix(a.land, b.land, k),
});

export const STEPS = 32;

// how far along its light a track is at d: the Harbour is night by the Gull road,
// and the Coppa's first lap is all night, the dawn coming up behind the cliffs on the second
export function lightK(track, d) {
  const L = track.length;
  if (track.id === 'coppa') return Math.max(0, Math.min(1, (d / L - 0.5) * 1.9));
  return Math.max(0, Math.min(1, d / (L * 0.72)));
}

export function lightOf(track) {
  const from = track.light?.from ?? 'day';
  const to = track.light?.to ?? from;
  const a = LIGHTS[from];
  const b = LIGHTS[to];
  const cache = new Map();
  return {
    from,
    to,
    night: a.dark > 0 || b.dark > 0,
    at(step) {
      if (!cache.has(step)) cache.set(step, blend(a, b, step / STEPS));
      return cache.get(step);
    },
  };
}

// a track's own ground, over the coast's. The Salt Road is white and hard; the quay is stone
const OWN_PAINT = {
  harbour: {
    verge: [0x6e6a60, 0x62605a],
    shoulder: [0x8a8478, 0x7e7a70],
    tuft: 0x4e4c48,
    tuftLit: 0x8a8678,
    road: [0x7c7468, 0x6c665c],
    track: 0x5e584e,
  },
  salt: {
    road: [0xb8a888, 0xa89878],
    track: 0x9a8a6c,
    verge: [0xe0d8c0, 0xd4cab0],
    shoulder: [0xece4cc, 0xe4dcc0],
    tuft: 0xb0a880,
    tuftLit: 0xf4f0dc,
    edge: 0xe8e0c8,
    stone: 0xfff8e8,
    water: [0xc8dce0, 0xc0d6dc],
  },
  coppa: { verge: [0x7e8048, 0x6a6e3e], water: [0x28405a, 0x203450] },
};
const WATER = [0x2a5a6e, 0x234e60];
export const groundOf = (track, base) => ({ water: WATER, wallStone: 0x8a8070, wallCap: 0xf0e8d8, ...base, ...(OWN_PAINT[track.id] || {}) });

const POOL = [0, 0, 0, 0.5, 1]; // the rows: 0..2 the day's own shades, 3 and 4 half and full under a lamp

// spread: how much of the light gets this far off the road (a lamp and a headlight both light the road, not the country)
const litAt = (L, z, level, reflect = 0, spread = 1) => {
  const beam = Math.max(0, Math.min(1, 1 - (z - 18) / Math.max(1, L.beam - 18))) ** 1.3;
  return Math.max(beam * L.headlamp * spread, POOL[level] * (1 - 0.3 * Math.min(1, z / 240)) * spread, reflect * (1 - (Math.min(1, z / 230)) ** 2));
};

// the bands the road is painted in: [16 distances][5 rows] of each colour, at this light
export function paintBands(paint, L) {
  const K = 16;
  const shadeOf = (c, s) => (s === 1 ? mix(c, paint.shade, 0.2) : s === 2 ? mix(c, paint.lit, 0.16) : c);
  const out = [];
  for (let k = 0; k < K; k++) {
    const hazeK = (k / (K - 1)) ** 1.4 * 0.72;
    const z = (k / (K - 1)) * 240;
    const flat = Math.min(1, z / 110) ** 2; // the road's light and dark bands blur together by here (they would shimmer)
    const grade = (c, s, reflect = 0, spread = 1) => {
      const sh = shadeOf(c, s);
      const day = mix(sh, L.haze, hazeK);
      if (!L.dark) return day;
      const l = litAt(L, z, s, reflect, spread);
      const n = mix(mix(mul(sh, L.ambient), mul(sh, L.warm), l), L.nightHaze, (1 - l) * (1 - reflect) * Math.min(1, z / (L.beam * 1.5)) * 0.92);
      return mix(day, n, L.dark);
    };
    const set = (a, b, s, reflect, spread) => {
      const m = mix(a, b, 0.5);
      return [grade(mix(a, m, flat), s, reflect, spread), grade(mix(b, m, flat), s, reflect, spread)];
    };
    out.push(
      [0, 1, 2, 3, 4].map((s) => ({
        road: set(paint.road[0], paint.road[1], s),
        verge: set(paint.verge[0], paint.verge[1], s, 0, 0.3),
        shoulder: set(paint.shoulder[0], paint.shoulder[1], s, 0, 0.75),
        kerb: set(paint.kerb[0], paint.kerb[1], s, 0.62), // (whitewash: the bend must read at night before the headlights get there)
        water: set(paint.water[0], paint.water[1], s, 0, 0.18),
        track: grade(paint.track, s),
        tuft: grade(paint.tuft, s, 0, 0.3),
        tuftLit: grade(paint.tuftLit, s, 0, 0.3),
        edge: grade(paint.edge, s, 0.5),
        stone: grade(paint.stone, s, 0.7),
        wallStone: [grade(paint.wallStone, s, 0.25), grade(mix(paint.wallStone, 0x1a1420, 0.22), s, 0.25)],
        wallCap: grade(paint.wallCap, s, 0.7),
      })),
    );
  }
  return out;
}

// what a thing standing at z, on a strip of this row, is multiplied by
export function spriteTint(L, z, level, reflect = 0, spread = 1) {
  if (!L.dark) return 0xffffff;
  const n = mix(L.spriteAmbient, L.warm, litAt(L, z, level, reflect, spread));
  return mix(0xffffff, n, L.dark);
}

// a small sky of the race's own: the gradient, the first stars, the bars of cloud at a dusk
export function paintLightSky(def) {
  const W = 256;
  const H = 270;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const css = (v) => `#${v.toString(16).padStart(6, '0')}`;
  g.addColorStop(0, css(def.top));
  g.addColorStop(0.55, css(def.mid));
  g.addColorStop(1, css(def.bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  let s = 77;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < (def.stars || 0); i++) {
    const y = r() * H * 0.72;
    ctx.fillStyle = `rgba(255,246,224,${(0.35 + r() * 0.6) * (1 - y / H)})`;
    ctx.fillRect(Math.floor(r() * W), Math.floor(y), 1, 1);
  }
  if (def.bars) {
    ctx.fillStyle = css(def.bars);
    for (let i = 0; i < 16; i++) {
      const y = H * 0.55 + r() * H * 0.36;
      ctx.globalAlpha = 0.25 + r() * 0.4;
      ctx.fillRect(Math.floor(r() * W) - 30, Math.floor(y), 40 + Math.floor(r() * 90), 2);
    }
    ctx.globalAlpha = 1;
  }
  return c;
}
