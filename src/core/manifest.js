// Character manifest validation (plan §4.6–4.7). Pure: used by the atlas
// build (a bad manifest fails the build) and by the unit tests.
//
// validateManifest(manifest, frameCounts?) → [error strings]; frameCounts
// is { anim: n } from the pose tables or the atlas, when known.

export function validateManifest(m, frameCounts = null) {
  const errs = [];
  if (!m || typeof m !== 'object') return ['manifest is not an object'];
  if (!m.id || typeof m.id !== 'string') errs.push('id: missing');
  const pair = (v) => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n));
  if (!pair(m.frame)) errs.push('frame: must be [w, h]');
  if (!pair(m.anchor)) errs.push('anchor: must be [x, y]');
  else if (pair(m.frame) && (m.anchor[0] < 0 || m.anchor[0] > m.frame[0] || m.anchor[1] < 0 || m.anchor[1] > m.frame[1])) errs.push('anchor: outside the frame');
  if (!['rig', 'imported', 'placeholder'].includes(m.source)) errs.push(`source: "${m.source}" is not rig|imported|placeholder`);
  if (m.scale != null && !(m.scale > 0)) errs.push('scale: must be > 0');
  const anims = m.animations;
  if (!anims || typeof anims !== 'object' || !Object.keys(anims).length) {
    errs.push('animations: none');
    return errs;
  }
  if (!anims.idle) errs.push('animations: every character needs idle (the end of every fallback chain)');
  for (const [name, a] of Object.entries(anims)) {
    const at = `animations.${name}`;
    if (a.mode === 'stride') {
      if (!(a.step > 0)) errs.push(`${at}: stride mode needs step > 0`);
    } else if (!(a.fps > 0)) errs.push(`${at}: needs fps > 0 or mode 'stride'`);
    for (const ref of ['next', 'fallback']) if (a[ref] != null && !anims[a[ref]]) errs.push(`${at}.${ref}: unknown animation "${a[ref]}"`);
    const n = frameCounts ? frameCounts[name] : a.frames;
    if (frameCounts && !(n > 0)) errs.push(`${at}: no frames`);
    if (a.events) {
      for (const k of Object.keys(a.events)) {
        const i = Number(k);
        if (!Number.isInteger(i) || i < 0 || (n > 0 && i >= n)) errs.push(`${at}.events: frame ${k} out of range`);
      }
    }
    // a fallback chain must end (no cycles)
    const seen = new Set([name]);
    let cur = a.fallback;
    while (cur) {
      if (seen.has(cur)) {
        errs.push(`${at}: fallback cycle through "${cur}"`);
        break;
      }
      seen.add(cur);
      cur = anims[cur] && anims[cur].fallback;
    }
  }
  return errs;
}
