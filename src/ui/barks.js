// Barks (round 2 §8): one bubble at a time. A new bark hides any other
// visible bark within 300 px (the newer line is the one being said); a bark
// whose speaker is off screen is not drawn. Barks are body ×1 in sentence
// case on the §8 plate, for 0.9 s + 60 ms a character.
export const BARK = Object.freeze({ near: 300, baseMs: 900, perCharMs: 60, maxMs: 6000 });

export function barkMs(text) {
  return Math.min(BARK.maxMs, BARK.baseMs + String(text || '').length * BARK.perCharMs);
}

function live(scene) {
  const set = (scene.__barks ||= new Set());
  for (const b of set) if (!b.active) set.delete(b);
  return set;
}

// is a world point inside the camera's view (with a margin)?
export function onCamera(scene, x, y, margin = 40) {
  const v = scene.cameras && scene.cameras.main && scene.cameras.main.worldView;
  if (!v || !v.width) return true;
  return x > v.x - margin && x < v.right + margin && y > v.y - margin && y < v.bottom + margin;
}

// register a freshly made bark object (a DCText or a container); older barks
// near it are hidden
export function claimBark(scene, obj) {
  const set = live(scene);
  for (const b of set) {
    if (b !== obj && b.visible && Math.abs(b.x - obj.x) < BARK.near && Math.abs(b.y - obj.y) < BARK.near) b.setVisible(false);
  }
  set.add(obj);
  obj.once('destroy', () => set.delete(obj));
  return obj;
}

// is another bark showing within reach of (x, y)? (for barks that wait)
export function barkNear(scene, x, y, except = null) {
  for (const b of live(scene)) if (b !== except && b.visible && b.alpha > 0.05 && Math.abs(b.x - x) < BARK.near && Math.abs(b.y - y) < BARK.near) return true;
  return false;
}
