// InputMap (plan 2.15): actions, not raw keys. Keyboard and the standard
// gamepad layout feed the same action states; contexts let a scene say what
// is listening (play, dialogue, encounter). The core is pure (unit-tested):
// `update(raw)` takes { keys: Set<code>, pad: { buttons: [bool], axes: [n] } | null }.
// `attachInput(map, target)` is the browser adapter (window key events +
// navigator.getGamepads()), so the harness's synthetic KeyboardEvents work.
//
//   const input = new InputMap();            // default bindings
//   input.update(raw)                        // once per frame
//   input.isDown('jump'); input.justDown('act1'); input.justUp('left')
//   input.suspend(true)                      // beats lock control (all false)
//   input.setContext('dialogue')

export const ACTIONS = Object.freeze(['left', 'right', 'up', 'down', 'jump', 'crouch', 'act1', 'act2', 'confirm', 'back', 'pause', 'walk']);

// standard gamepad: 0 A, 1 B, 2 X, 3 Y, 9 start, 12 up, 13 down, 14 left, 15 right
export const DEFAULT_BINDINGS = Object.freeze({
  keyboard: {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'KeyW'],
    crouch: ['ArrowDown', 'KeyS'],
    act1: ['KeyE'],
    act2: ['KeyQ'],
    confirm: ['KeyX', 'KeyE', 'Space', 'Enter'],
    back: ['Escape', 'Backspace'],
    pause: ['Escape'],
    walk: ['ShiftLeft', 'ShiftRight'],
  },
  gamepad: {
    left: ['b14', 'ax0-'],
    right: ['b15', 'ax0+'],
    up: ['b12', 'ax1-'],
    down: ['b13', 'ax1+'],
    jump: ['b0'],
    crouch: ['b13', 'ax1+'],
    act1: ['b2'],
    act2: ['b3'],
    confirm: ['b0', 'b2'],
    back: ['b1'],
    pause: ['b9'],
    walk: ['b4'],
  },
});

export const DEADZONE = 0.45;

export class InputMap {
  constructor(bindings = DEFAULT_BINDINGS) {
    this.bindings = { keyboard: { ...bindings.keyboard }, gamepad: { ...bindings.gamepad } };
    this.now = new Map();
    this.prev = new Map();
    this.context = 'play';
    this.suspended = false;
    this.lastDevice = 'keyboard';
    for (const a of ACTIONS) {
      this.now.set(a, false);
      this.prev.set(a, false);
    }
  }

  // remap one action on one device (settings screen)
  bind(action, device, codes) {
    if (!ACTIONS.includes(action)) throw new Error(`InputMap: unknown action "${action}"`);
    this.bindings[device][action] = [...codes];
  }

  padActive(pad, code) {
    if (!pad) return false;
    if (code[0] === 'b') {
      const b = pad.buttons && pad.buttons[Number(code.slice(1))];
      return !!(b && (b === true || b.pressed || b.value > 0.5));
    }
    const m = code.match(/^ax(\d+)([+-])$/);
    if (!m) return false;
    const v = (pad.axes && pad.axes[Number(m[1])]) || 0;
    return m[2] === '+' ? v > DEADZONE : v < -DEADZONE;
  }

  update(raw = {}) {
    const keys = raw.keys || new Set();
    const pad = raw.pad || null;
    for (const a of ACTIONS) {
      this.prev.set(a, this.now.get(a));
      const kb = (this.bindings.keyboard[a] || []).some((c) => keys.has(c));
      const gp = (this.bindings.gamepad[a] || []).some((c) => this.padActive(pad, c));
      if (gp && !kb) this.lastDevice = 'gamepad';
      else if (kb) this.lastDevice = 'keyboard';
      this.now.set(a, !this.suspended && (kb || gp));
    }
  }

  isDown(a) {
    return !!this.now.get(a);
  }

  justDown(a) {
    return !!this.now.get(a) && !this.prev.get(a);
  }

  justUp(a) {
    return !this.now.get(a) && !!this.prev.get(a);
  }

  // x axis as -1/0/1
  axisX() {
    return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
  }

  suspend(on = true) {
    this.suspended = !!on;
    if (on) for (const a of ACTIONS) this.now.set(a, false);
  }

  setContext(c) {
    this.context = c;
  }

  // the label a prompt shows for an action on the device last used
  label(a) {
    const code = (this.lastDevice === 'gamepad' ? this.bindings.gamepad : this.bindings.keyboard)[a];
    if (!code || !code.length) return '?';
    const c = code[0];
    const PAD = { b0: 'A', b1: 'B', b2: 'X', b3: 'Y', b9: 'START' };
    if (this.lastDevice === 'gamepad') return PAD[c] || c;
    return c.replace(/^Key/, '').replace(/^Arrow/, '').replace('Escape', 'Esc');
  }
}

// ---- the browser adapter -------------------------------------------------------
// One listener set per page; every InputMap attached reads the same raw state.
const RAW = { keys: new Set(), installed: false };

function install(target) {
  if (RAW.installed || !target) return;
  RAW.installed = true;
  target.addEventListener('keydown', (e) => RAW.keys.add(e.code));
  target.addEventListener('keyup', (e) => RAW.keys.delete(e.code));
  target.addEventListener('blur', () => RAW.keys.clear());
}

export function rawInput() {
  let pad = null;
  try {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    pad = [...(pads || [])].find((p) => p && p.connected && p.mapping === 'standard') || [...(pads || [])].find((p) => p && p.connected) || null;
  } catch {
    pad = null;
  }
  return { keys: RAW.keys, pad };
}

// a map that polls the page's keyboard + first gamepad: call map.poll() each frame
export function attachInput(map, target = typeof window !== 'undefined' ? window : null) {
  install(target);
  map.poll = () => map.update(rawInput());
  return map;
}

export default InputMap;
