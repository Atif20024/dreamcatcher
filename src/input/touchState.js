// Are the touch controls on? Decided once at boot (main.js → initTouch),
// before any scene is created, so a scene can word its hints for a finger
// ("tap a line") instead of a key. The controls themselves live on the UI
// scene (src/ui/TouchControls.js); a scenario may switch them on and off.
import { touchWanted } from './touchLayout.js';

export const touchState = { on: false, forced: false, controls: null };

export function initTouch(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return touchState;
  const mm = (q) => {
    try {
      return !!(win.matchMedia && win.matchMedia(q).matches);
    } catch {
      return false;
    }
  };
  const query = win.location ? win.location.search : '';
  touchState.forced = new URLSearchParams(query).get('touch') === '1';
  touchState.on = touchWanted({
    query,
    coarse: mm('(pointer: coarse)'),
    hover: mm('(hover: hover)'),
    maxTouchPoints: (win.navigator && win.navigator.maxTouchPoints) || 0,
  });
  return touchState;
}
