// The device keyboard on a phone (the Writer's typing rhythm): a hidden
// <input> takes the focus and every letter typed into it is pressed as a
// virtual key (src/input/virtualKeys.js), so the game hears KeyA … KeyZ as
// it hears a real keyboard. A phone's keyboard does not send real key codes
// (Android sends 229), so the letters are read from the `input` event.
//
// iOS opens the keyboard only from a user gesture: open() is called from
// the touch handler of the ABC context button (src/ui/TouchControls.js).
//
//   openSoftKeyboard(); closeSoftKeyboard(); softKeyboardOpen()
import { dispatchKey } from './virtualKeys.js';

let field = null;

function make() {
  if (field || typeof document === 'undefined') return field;
  field = document.createElement('input');
  field.type = 'text';
  field.setAttribute('autocapitalize', 'off');
  field.setAttribute('autocomplete', 'off');
  field.setAttribute('autocorrect', 'off');
  field.setAttribute('spellcheck', 'false');
  field.setAttribute('aria-label', 'type the letters');
  // on screen (an off-screen field may not get the keyboard), but invisible;
  // 16 px so iOS does not zoom the page in
  Object.assign(field.style, { position: 'fixed', left: '0', bottom: '0', width: '1px', height: '1px', opacity: '0', fontSize: '16px', border: '0', padding: '0', zIndex: '-1' });
  field.addEventListener('input', () => {
    for (const ch of field.value) {
      if (!/[a-z]/i.test(ch)) continue;
      const code = `Key${ch.toUpperCase()}`;
      dispatchKey('keydown', code);
      dispatchKey('keyup', code);
    }
    field.value = '';
  });
  // a key that does carry its code (a hardware keyboard) would be heard twice:
  // the letters come from the input event only
  field.addEventListener('keydown', (e) => e.stopPropagation());
  field.addEventListener('keyup', (e) => e.stopPropagation());
  document.body.appendChild(field);
  return field;
}

export function openSoftKeyboard() {
  const f = make();
  if (!f) return false;
  try {
    f.focus({ preventScroll: true });
  } catch {
    f.focus();
  }
  return document.activeElement === f;
}

export function closeSoftKeyboard() {
  if (field && typeof document !== 'undefined' && document.activeElement === field) field.blur();
}

export const softKeyboardOpen = () => !!field && typeof document !== 'undefined' && document.activeElement === field;
