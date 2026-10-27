// Feature flags for half-built services (plan §6). Everything new ships off.
// Override at runtime with ?flags=a,b (on) / ?flags=-a (off) or setFlag().

const DEFAULTS = {
  eventBus: false, // scenes emit on the shared bus
  uiScene: true, // UI on its own scene (phase 1.2: always on)
  bitmapText: true, // bitmap fonts replace Phaser default text (phase 1.2: always on)
  teach: false, // new tutorial/Teach service
  roomStreamer: false, // new room graph + streaming
};

let current = { ...DEFAULTS };

export function parseFlags(str) {
  const out = {};
  for (const raw of String(str || '').split(',')) {
    const s = raw.trim();
    if (!s) continue;
    if (s.startsWith('-')) out[s.slice(1)] = false;
    else out[s] = true;
  }
  return out;
}

export function initFlags(search = '') {
  current = { ...DEFAULTS };
  const p = new URLSearchParams(search).get('flags');
  Object.assign(current, parseFlags(p));
  return current;
}

export const flag = (name) => !!current[name];
export const setFlag = (name, on = true) => {
  current[name] = !!on;
};
export const allFlags = () => ({ ...current });
export const resetFlags = () => {
  current = { ...DEFAULTS };
};
