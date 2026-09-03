// Part D §D5 / motion skill §1 — a character is a paper-doll rig, not one
// grid. Rig.compose stacks parts in draw order at their anchors into one
// string grid per frame; scripts/build-atlas.js rasterizes those into the
// character's atlas. The runtime never sees a grid.
//
// Draw order (back to front): arm_b, leg_b, torso, leg_f, head, arm_f, extras.
// `hips dy` from the frame tables moves torso + head + arms, never the legs
// (the planted foot is what stays put). The head lags the hips by one frame:
// compose() is handed the previous frame's dy as `headDy`.
export const DRAW_ORDER = ['arm_b', 'leg_b', 'torso', 'leg_f', 'head', 'arm_f', 'extras'];
const HIP_PARTS = new Set(['torso', 'arm_b', 'arm_f']);

function blank(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill('.'));
}

function paint(canvas, grid, x0, y0) {
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const cx = x0 + x;
      const cy = y0 + y;
      if (cy < 0 || cy >= canvas.length || cx < 0 || cx >= canvas[0].length) return;
      canvas[cy][cx] = ch;
    });
  });
}

// resolve a part's variant: { grid, at:[x,y] }
export function partVariant(rig, partName, variantName) {
  const part = rig.parts[partName];
  if (!part) throw new Error(`rig ${rig.name}: no part "${partName}"`);
  if (!variantName || variantName === 'base') return { grid: part.base, at: part.at };
  const v = part.variants && part.variants[variantName];
  if (!v) throw new Error(`rig ${rig.name}: part "${partName}" has no variant "${variantName}"`);
  // a variant is either a bare grid (array of strings) or { grid, at?, ... }
  if (Array.isArray(v)) return { grid: v, at: part.at };
  return { grid: v.grid, at: v.at || part.at };
}

// frameSpec: { leg_f, leg_b, arm_f, arm_b, torso, head, dy, dx, headDy,
//              extras: { hat: 'base' | null, ... }, offsets: { part: [dx,dy] } }
export function compose(rig, spec = {}) {
  const [w, h] = rig.size;
  const canvas = blank(w, h);
  const dy = spec.dy || 0;
  const dx = spec.dx || 0;
  const headDy = spec.headDy === undefined ? dy : spec.headDy;
  for (const partName of DRAW_ORDER) {
    if (partName === 'extras') {
      const extras = spec.extras || rig.defaultExtras || {};
      for (const [name, variant] of Object.entries(extras)) {
        if (variant === null || variant === false) continue;
        const ex = rig.extras && rig.extras[name];
        if (!ex) continue;
        const raw = variant === true || variant === 'base' ? ex : (ex.variants && ex.variants[variant]) || ex;
        const v = Array.isArray(raw) ? { grid: raw } : raw;
        const at = v.at || ex.at;
        const off = (spec.offsets && spec.offsets[name]) || [0, 0];
        paint(canvas, v.grid || ex.grid, at[0] + off[0] + dx, at[1] + off[1] + headDy);
      }
      continue;
    }
    if (!rig.parts[partName]) continue;
    const { grid, at } = partVariant(rig, partName, spec[partName]);
    const off = (spec.offsets && spec.offsets[partName]) || [0, 0];
    let py = at[1] + off[1];
    if (HIP_PARTS.has(partName)) py += dy;
    if (partName === 'head') py += headDy;
    paint(canvas, grid, at[0] + off[0] + dx, py);
  }
  return canvas.map((r) => r.join(''));
}

// every frame of an animation, with the one-frame head lag applied
export function frames(rig, anim) {
  const specs = rig.frames[anim];
  if (!specs) throw new Error(`rig ${rig.name}: no animation "${anim}"`);
  return specs.map((spec, i) => {
    const prev = specs[(i - 1 + specs.length) % specs.length];
    const looped = rig.loops === undefined || rig.loops[anim] !== false;
    const headDy = spec.headDy !== undefined ? spec.headDy : looped || i > 0 ? prev.dy || 0 : spec.dy || 0;
    return compose(rig, { ...spec, headDy, extras: spec.extras || rig.defaultExtras });
  });
}

// the planted foot's contact x (1x px, relative to the origin) per frame —
// what the ground-speed lock is measured against
export function footContacts(rig, anim) {
  const specs = rig.frames[anim];
  return specs.map((s) => (s.contact === undefined ? null : s.contact));
}

export const Rig = { compose, frames, footContacts, partVariant, DRAW_ORDER };
export default Rig;
