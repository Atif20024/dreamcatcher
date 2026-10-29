// The Settings items shared by the title menu and the pause menu (feedback
// 3): music on/off, and a Music and an Ambience volume, each a fraction of
// its bus's default level (src/audio/AudioBus.js), persisted in the save's
// global settings (settings.volumes). Left/Right (A/D) step a slider by
// 10 %; choosing it steps it up and wraps from 100 % to 0 %.
import { getSettings, updateSettings } from '../utils/save.js';
import { isMusicOff, toggleMusic } from '../systems/audio.js';
import { buses, VOLUME_KEYS, VOLUME_STEP } from '../audio/AudioBus.js';

const NAMES = { music: 'Music volume', ambience: 'Ambience volume' };

export function getVolume(key) {
  try {
    const v = ((getSettings() || {}).volumes || {})[key];
    return typeof v === 'number' ? Math.max(0, Math.min(1, v)) : 1;
  } catch {
    return 1;
  }
}

export function setVolume(key, v) {
  const val = Math.round(Math.max(0, Math.min(1, v)) / VOLUME_STEP) * VOLUME_STEP;
  const out = +val.toFixed(2);
  updateSettings((st) => {
    st.volumes = { ...(st.volumes || {}), [key]: out };
  });
  buses.apply();
  return out;
}

// step a slider: dir -1 / +1; wrap only when chosen (dir 0)
export function stepVolume(key, dir) {
  const v = getVolume(key);
  if (dir === 0) return setVolume(key, v >= 1 - 1e-6 ? 0 : v + VOLUME_STEP);
  return setVolume(key, v + dir * VOLUME_STEP);
}

export function volumeLabel(key) {
  const v = getVolume(key);
  const n = Math.round(v * 10);
  return `${NAMES[key]}: ← ${'▮'.repeat(n)}${'▯'.repeat(10 - n)} ${Math.round(v * 100)}% →`;
}

// the items; `back` is the host's Back item; `onMusic(off)` lets a level
// update its footer
export function settingsItems({ back, onMusic = null } = {}) {
  const refresh = (m) => m.setItems(settingsItems({ back, onMusic }), { keepIndex: true });
  const items = [
    {
      id: 'music',
      label: `Music: ${isMusicOff() ? 'off' : 'on'}`,
      action: (m) => {
        const off = toggleMusic();
        buses.apply();
        if (onMusic) onMusic(off);
        refresh(m);
      },
    },
    ...VOLUME_KEYS.map((key) => ({
      id: `vol:${key}`,
      label: volumeLabel(key),
      action: (m) => {
        stepVolume(key, 0);
        refresh(m);
      },
      adjust: (dir, m) => {
        stepVolume(key, dir);
        refresh(m);
      },
    })),
  ];
  if (back) items.push(back);
  return items;
}
