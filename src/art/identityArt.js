// Round 2 WP6, the identity's two objects (critique §9 "Motifs"), painted in
// code and shared by every place that shows them:
//   - the dreamcatcher: the title emblem, the boot loader (the web filling
//     strand by strand) and the big one in the station hall that gains one
//     round of web, in that dream's accent, for every dream caught
//   - the platform lamp: every checkpoint is a lamp, not a flag (the textures
//     keep the old 'flag' / 'flag-lit' keys, so every scene gets lamps)
import { hex, rgba, mix, stamp } from './paint.js';
import { IDENTITY, PLACES } from '../ui/theme.js';

// the seven running dreams, in board order: the hall web's rounds, outside in
export const WEB_ORDER = ['chef', 'musician', 'writer', 'painter', 'astronaut', 'gambler', 'clockmaker'];
export const WEB_SPOKES = 7;

// the web's rounds: each round's points are the midpoints of the last
// round's chords, pulled in so the thread sags toward the centre
export function webRounds(cx, cy, r, n = WEB_ORDER.length, spokes = WEB_SPOKES) {
  const rounds = [];
  let pts = [];
  for (let i = 0; i < spokes; i++) {
    const a = -Math.PI / 2 + (i / spokes) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  rounds.push(pts);
  for (let j = 0; j < n; j++) {
    const next = pts.map((p, i) => {
      const q = pts[(i + 1) % spokes];
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      return { x: cx + (mx - cx) * 0.9, y: cy + (my - cy) * 0.9 };
    });
    rounds.push(next);
    pts = next;
  }
  return rounds;
}

// Draw a dreamcatcher on a 2D canvas.
//   rounds:  colours of the rounds already woven (outside in)
//   partial: 0..1 of the next round, drawn in `partialColor` (the loader)
//   ghost:   the rounds still to come, as a faint guide (the hall's)
export function drawDreamcatcher(ctx, cx, cy, r, { rounds = [], partial = 0, partialColor = IDENTITY.cream, ghost = 0, feathers = true, sway = 0, line = 1.4, hoop = IDENTITY.brass } = {}) {
  const total = Math.max(rounds.length + (partial > 0 ? 1 : 0) + ghost, 1);
  const geo = webRounds(cx, cy, r - line * 2, Math.max(total, 1));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // the hanging threads, beads and feathers (behind the hoop)
  if (feathers) {
    const hang = [
      { dx: -r * 0.55, len: r * 0.62, c: PLACES.evening.accent },
      { dx: 0, len: r * 0.95, c: IDENTITY.cream },
      { dx: r * 0.55, len: r * 0.62, c: PLACES.musician.accent },
    ];
    for (const h of hang) {
      const x0 = cx + h.dx;
      const y0 = cy + Math.sqrt(Math.max(0, r * r - h.dx * h.dx)) - 1;
      const x1 = x0 + sway * h.len * 0.08;
      const y1 = y0 + h.len;
      ctx.strokeStyle = rgba(IDENTITY.cream, 0.75);
      ctx.lineWidth = Math.max(1, line * 0.7);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      // a bead, then the feather
      ctx.fillStyle = hex(h.c);
      ctx.beginPath();
      ctx.arc(x0 + (x1 - x0) * 0.35, y0 + (y1 - y0) * 0.35, Math.max(1.5, r * 0.045), 0, Math.PI * 2);
      ctx.fill();
      feather(ctx, x1, y1, r * 0.13, r * 0.42, sway * 0.12, h.c);
    }
  }
  // the web: woven rounds, the one being woven, the ghost of the rest
  const thread = (a, b, col, alpha, w) => {
    ctx.strokeStyle = rgba(col, alpha);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const roundAt = (j, col, alpha, frac = 1, w = line) => {
    const outer = geo[j];
    const inner = geo[j + 1];
    const segs = outer.length * 2;
    const draw = Math.floor(segs * frac + 1e-6);
    for (let s = 0; s < draw; s++) {
      const i = Math.floor(s / 2);
      // out → in → out: the thread hooks the last round's chord, then on
      if (s % 2 === 0) thread(outer[i], inner[i], col, alpha, w);
      else thread(inner[i], outer[(i + 1) % outer.length], col, alpha, w);
    }
  };
  for (let j = 0; j < total; j++) {
    if (j < rounds.length) roundAt(j, rounds[j], 0.95);
    else if (j === rounds.length && partial > 0) roundAt(j, partialColor, 0.95, partial);
    else roundAt(j, IDENTITY.cream, 0.14, 1, Math.max(0.8, line * 0.6));
  }
  // the centre bead: lit once the web is whole
  const whole = rounds.length >= WEB_ORDER.length;
  const c = geo[geo.length - 1];
  const bx = c.reduce((s, p) => s + p.x, 0) / c.length;
  const by = c.reduce((s, p) => s + p.y, 0) / c.length;
  if (whole) stamp(ctx, bx, by, r * 0.18, IDENTITY.lamp, 0.55);
  ctx.fillStyle = hex(whole ? IDENTITY.lamp : mix(IDENTITY.brass, IDENTITY.night, 0.35));
  ctx.beginPath();
  ctx.arc(bx, by, Math.max(2, r * 0.06), 0, Math.PI * 2);
  ctx.fill();
  // the hoop: brass, wrapped in thread
  ctx.strokeStyle = hex(mix(hoop, IDENTITY.night, 0.45));
  ctx.lineWidth = line * 3.4;
  ctx.beginPath();
  ctx.arc(cx, cy + 0.6, r - line, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = hex(hoop);
  ctx.lineWidth = line * 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - line, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rgba(mix(hoop, IDENTITY.night, 0.5), 0.8);
  ctx.lineWidth = Math.max(1, line * 0.6);
  const wraps = Math.round(r * 0.9);
  for (let k = 0; k < wraps; k++) {
    const a = (k / wraps) * Math.PI * 2;
    const ri = r - line * 2.2;
    const ro = r + line * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri);
    ctx.lineTo(cx + Math.cos(a + 0.05) * ro, cy + Math.sin(a + 0.05) * ro);
    ctx.stroke();
  }
  // the light catches the top-left of the ring
  ctx.strokeStyle = rgba(IDENTITY.gold, 0.75);
  ctx.lineWidth = Math.max(1, line * 0.7);
  ctx.beginPath();
  ctx.arc(cx, cy, r - line * 1.6, Math.PI * 1.05, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}

// a feather hanging from (x, y): a quill and two vanes, its tip in `col`
function feather(ctx, x, y, w, h, tilt, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const body = IDENTITY.cream;
  ctx.fillStyle = hex(mix(body, IDENTITY.night, 0.12));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w, h * 0.35, w * 0.35, h);
  ctx.quadraticCurveTo(0, h * 1.08, -w * 0.35, h);
  ctx.quadraticCurveTo(-w, h * 0.35, 0, 0);
  ctx.fill();
  // the tip, dyed
  ctx.fillStyle = rgba(col, 0.85);
  ctx.beginPath();
  ctx.moveTo(-w * 0.62, h * 0.72);
  ctx.quadraticCurveTo(0, h * 1.12, w * 0.62, h * 0.72);
  ctx.quadraticCurveTo(w * 0.35, h * 1.0, 0, h * 1.04);
  ctx.quadraticCurveTo(-w * 0.35, h * 1.0, -w * 0.62, h * 0.72);
  ctx.fill();
  // the quill and the barbs
  ctx.strokeStyle = rgba(mix(body, IDENTITY.night, 0.5), 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, h);
  ctx.stroke();
  ctx.strokeStyle = rgba(mix(body, IDENTITY.night, 0.35), 0.45);
  for (let k = 1; k < 6; k++) {
    const yy = (h * k) / 6;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(-w * 0.6, yy + h * 0.08);
    ctx.moveTo(0, yy);
    ctx.lineTo(w * 0.6, yy + h * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

// a canvas texture of a dreamcatcher (re-painted in place when it changes)
export function dreamcatcherTexture(scene, key, size, opts = {}) {
  const W = size;
  const H = Math.round(size * (opts.feathers === false ? 1 : 1.62));
  let ct = scene.textures.exists(key) ? scene.textures.get(key) : null;
  if (ct && (!ct.getContext || ct.width !== W || ct.height !== H)) {
    scene.textures.remove(key);
    ct = null;
  }
  if (!ct) ct = scene.textures.createCanvas(key, W, H);
  const ctx = ct.getContext();
  ctx.clearRect(0, 0, W, H);
  const r = size / 2 - 3;
  drawDreamcatcher(ctx, W / 2, size / 2, r, { line: Math.max(1, size / 110), ...opts });
  ct.refresh();
  return key;
}

// the caught dreams as web colours, in WEB_ORDER
export function caughtRounds(dreams = {}) {
  return WEB_ORDER.filter((id) => dreams[id]).map((id) => PLACES[id].accent);
}

// ---- the platform lamp (a checkpoint) -------------------------------------------
export const LAMP = Object.freeze({ w: 30, h: 84, head: 14 }); // 1.9 m at 44 px/m; the lantern's centre 14 px down

function paintLamp(ctx, w, h, lit) {
  const iron = 0x2a2838;
  const ironLit = 0x4a4660;
  const cx = Math.round(w / 2);
  // plinth, post, collar
  ctx.fillStyle = hex(iron);
  ctx.fillRect(cx - 7, h - 6, 14, 6);
  ctx.fillRect(cx - 5, h - 9, 10, 3);
  ctx.fillRect(cx - 2, 26, 4, h - 34);
  ctx.fillStyle = hex(ironLit);
  ctx.fillRect(cx - 2, 26, 1, h - 34); // the light from the left
  ctx.fillRect(cx - 7, h - 6, 1, 6);
  ctx.fillStyle = hex(iron);
  ctx.fillRect(cx - 4, 24, 8, 3);
  ctx.fillRect(cx - 4, 50, 8, 2);
  // the lantern: a cap, four panes, a finial
  ctx.fillRect(cx - 1, 0, 2, 3);
  ctx.beginPath();
  ctx.moveTo(cx - 9, 7);
  ctx.lineTo(cx, 2);
  ctx.lineTo(cx + 9, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - 8, 7, 16, 2);
  const glass = lit ? IDENTITY.lamp : 0x3a4258;
  ctx.fillStyle = hex(glass);
  ctx.fillRect(cx - 6, 9, 12, 13);
  if (lit) {
    ctx.fillStyle = hex(0xfff4d8);
    ctx.fillRect(cx - 2, 12, 4, 7); // the flame
    stamp(ctx, cx, 15, 13, IDENTITY.lamp, 0.35);
  } else {
    ctx.fillStyle = rgba(IDENTITY.cream, 0.18);
    ctx.fillRect(cx - 5, 10, 2, 10); // a cold reflection
  }
  ctx.fillStyle = hex(iron);
  ctx.fillRect(cx - 7, 9, 1, 13);
  ctx.fillRect(cx + 6, 9, 1, 13);
  ctx.fillRect(cx - 1, 9, 2, 13);
  ctx.fillRect(cx - 7, 22, 14, 3);
}

// the 'flag' (dark) and 'flag-lit' textures, painted once per game
export function createLampTextures(scene) {
  for (const [key, lit] of [
    ['flag', false],
    ['flag-lit', true],
  ]) {
    if (scene.textures.exists(key)) {
      const t = scene.textures.get(key);
      if (t.dcLamp) continue;
      scene.textures.remove(key);
    }
    const ct = scene.textures.createCanvas(key, LAMP.w, LAMP.h);
    paintLamp(ct.getContext(), LAMP.w, LAMP.h, lit);
    ct.refresh();
    ct.dcLamp = true;
  }
  glowTexture(scene);
}

// a soft white disc for additive light (lamps, the room warming)
export function glowTexture(scene, key = 'dc-id-glow') {
  if (scene.textures.exists(key)) return key;
  const ct = scene.textures.createCanvas(key, 128, 128);
  const ctx = ct.getContext();
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ct.refresh();
  return key;
}
