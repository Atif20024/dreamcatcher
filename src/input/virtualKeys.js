// Virtual keys: a real KeyboardEvent on window (keyCode defined), so Phaser's
// KeyboardPlugin, the InputMap adapter (src/input/InputMap.js) and the modal
// `e.code` handlers (ModalManager) all hear it exactly as they hear a key.
// One mechanism, two drivers: the dev harness (window.__dc press / hold /
// release) and the touch controls (src/ui/TouchControls.js).
//
//   dispatchKey('keydown', 'jump')        an action name …
//   dispatchKey('keyup', 'ArrowLeft')     … or a KeyboardEvent.code

export const KEYCODES = {
  left: ['ArrowLeft', 37], right: ['ArrowRight', 39], up: ['ArrowUp', 38], down: ['ArrowDown', 40],
  jump: ['Space', 32], interact: ['KeyE', 69], action: ['KeyX', 88], shove: ['KeyX', 88],
  trumpet: ['KeyQ', 81], tether: ['KeyF', 70], esc: ['Escape', 27], enter: ['Enter', 13], walk: ['ShiftLeft', 16],
  ShiftLeft: 16,
  ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Space: 32, Enter: 13, Escape: 27, Tab: 9,
};

export function codeInfo(a) {
  const v = KEYCODES[a];
  if (Array.isArray(v)) return { code: v[0], keyCode: v[1] };
  if (typeof v === 'number') return { code: a, keyCode: v };
  if (/^Key[A-Z]$/.test(a)) return { code: a, keyCode: a.charCodeAt(3) };
  if (/^Digit[0-9]$/.test(a)) return { code: a, keyCode: a.charCodeAt(5) };
  throw new Error(`virtual key: unknown action/code "${a}"`);
}

export function dispatchKey(type, a, target = typeof window !== 'undefined' ? window : null) {
  if (!target) return;
  const { code, keyCode } = codeInfo(a);
  const ev = new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { value: keyCode });
  Object.defineProperty(ev, 'which', { value: keyCode });
  target.dispatchEvent(ev);
}
