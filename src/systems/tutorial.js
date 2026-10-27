import { getSave, markSeen } from '../utils/save.js';
import ModalManager from '../ui/ModalManager.js';
import { uiText } from '../ui/text.js';
import { panel, dim } from '../ui/Panel.js';

// D8 — just-in-time tutorials. The first time a save meets a mechanic,
// freeze for a card; dismiss on the key. Never shown twice.
const CARDS = {
  ledge_grab: { name: 'LEDGE GRAB', hint: 'hold toward the edge', key: '←/→' },
  hang_drop: { name: 'HANG & DROP', hint: 'let go to fall', key: '↓' },
  careful_step: { name: 'QUIET LANDING', hint: 'land while crouching', key: '↓' },
  slide_under: { name: 'SLIDE UNDER', hint: 'duck through the grab', key: '↓' },
  shove: { name: 'SHOVE', hint: 'stagger, never hurt', key: 'X' },
  distract: { name: 'DISTRACT', hint: 'make a noise elsewhere', key: 'Q / E' },
  hide: { name: 'HIDE', hint: 'wait for them to pass', key: '↓' },
  plate_gate: { name: 'PRESSURE PLATE', hint: 'weight holds it open', key: 'E' },
  loose_tile: { name: 'LOOSE TILE', hint: 'it will not hold', key: '' },
  sound_bridge: { name: 'SOUND BRIDGE', hint: 'play while airborne', key: 'Q' },
  call_response: { name: 'CALL & RESPONSE', hint: 'listen, then answer', key: 'Q' },
  rest_note: { name: 'THE REST', hint: 'hollow means silence', key: '' },
  wall_jump: { name: 'WALL JUMP', hint: 'only on ribbed walls', key: '↑' },
  slope: { name: 'SLOPES', hint: 'walk, do not jump', key: '' },
  // the quiet above: three gravities, each taught the moment it starts
  zero_g: { name: 'NO FLOOR HERE', hint: 'aim with the arrows, then shove off a surface', key: 'SPACE' },
  zero_g_rail: { name: 'HANDRAILS', hint: 'the yellow lines are the ground now', key: 'E' },
  eva_tether: { name: 'THE TETHER IS LIFE', hint: 'clip on before you push. hold to reel in', key: 'F' },
  moon_bound: { name: 'ONE-SIXTH', hint: 'you rise slowly and you keep going', key: '' },
  // the second draft
  pen: { name: 'THE PEN', hint: 'stand under a label and strike its adjective', key: 'E' },
  typing: { name: 'THE TYPING RHYTHM', hint: 'press each letter as it reaches the line', key: 'A–Z' },
  editor: { name: 'THE INNER EDITOR', hint: 'keep moving. it erases what you have crossed', key: '' },
  glass: { name: 'FRAGILE', hint: 'crouch-walk across, or it goes', key: '↓' },
  talker: { name: 'A WALL OF SOUND', hint: 'duck under, come up behind, jump for the word', key: '↓' },
  press: { name: 'THE PRESS', hint: 'ride the paper down. ink, press, fold', key: 'E' },
  // the last hand
  bet: { name: 'BET', hint: 'chips or hearts. the odds are printed. the house wins ties', key: 'E' },
  deal: { name: 'THE DEAL', hint: 'numbers hold. faces flip you. aces pay. the room shows the deck', key: '' },
  reel: { name: 'THE REELS', hint: 'land on one to spin it. read the symbols before you jump', key: '' },
  wheel: { name: 'THE WHEEL', hint: 'stop the ball on the marked colour. it slows the same way every time', key: 'E' },
  dice: { name: 'DICE BRIDGE', hint: 'the roll is the bridge. the gap is twelve minus the roll', key: 'E' },
  marker: { name: 'THE MARKER', hint: 'ten chips, no paperwork. it never goes away', key: '' },
  no_trumpet: { name: 'NO HORN', hint: 'no shove, no noise. checkpoints by touch', key: '' },
  cage: { name: 'THE CAGE', hint: 'pending chips become real only here. the marker comes off first', key: 'E' },
  face: { name: 'POKER FACE', hint: 'hold down while they decide, or they read your eyebrow', key: '↓' },
  // the yellow house
  brush: { name: 'THE BRUSH', hint: 'stand at a surface and paint it the colour on the brush', key: 'E' },
  stroke: { name: 'THE STROKE', hint: 'hold while moving: a ribbon of paint you can stand on. six tiles. it dries.', key: 'X' },
  wells: { name: 'THE PALETTE', hint: 'three wells, twelve strokes each. hits spill one. [1] [2] [3] choose', key: '1 2 3' },
  mixing: { name: 'MIXING', hint: 'the brush takes the next well too: yellow+blue=green', key: 'V' },
  vibrato: { name: 'COMPLEMENTARIES', hint: 'a colour beside its complement shimmers. jump from it: triple height', key: '' },
  clock: { name: 'THE LIGHT', hint: 'every stroke moves the clock a minute. some colours only at some hours', key: '' },
  easel: { name: 'THE EASEL', hint: 'two of the right colours on the palette, in the right light', key: 'E' },
  sleep: { name: 'NIGHT', hint: 'sleep at the easel. a new day; ten canvases in ten', key: 'E' },
  paul: { name: 'PAUL', hint: 'he paints one stroke of what you lack. then you owe him', key: 'F' },
  currents: { name: 'THE CURRENTS', hint: 'the sky carries you. jump to leave it', key: 'SPACE' },
};

// The card is a ModalManager modal ('tutorial'): it goes on top of an
// encounter panel that opened with it (the BET card over the stake
// selector), waits under a death or pause card, and is cleared by the death
// card. It sizes itself to its text, so a long hint never spills out.
export function showTutorial(scene, id) {
  if (!CARDS[id]) return false;
  const save = getSave();
  if ((save.seen || []).includes(id)) return false;
  markSeen(id);

  const c = CARDS[id];
  const cam = scene.cameras.main;
  const cx = cam.width / 2;
  const cy = cam.height / 2;
  scene.tutorialActive = true;
  const depth = 240;
  const h = ModalManager.for(scene).open({
    kind: 'tutorial',
    name: `tutorial:${id}`,
    freeze: 'physics',
    guardMs: 250,
    onKey: () => h.close(),
    onClose: () => {
      scene.tutorialActive = !!(scene.modals && scene.modals.has('tutorial'));
    },
  });
  h.cardId = id;
  const t = (y, str, opts) => h.add(uiText(scene, cx, y, str, { align: 'center', ...opts }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 2));
  const name = t(0, c.name, { size: 'display', color: 'accent' });
  name.name = 'tutorial-name';
  const hint = t(0, c.hint, { size: 'body', color: 'ink', wrap: 520 });
  const key = t(0, c.key ? `[ ${c.key} ]` : '[ any key ]', { size: 'small', color: 'calm' });
  const W = Math.max(360, Math.min(600, Math.max(name.width, hint.width, key.width) + 64));
  const H = 24 + name.height + 14 + hint.height + 16 + key.height + 22;
  let y = Math.round(cy - H / 2) + 24;
  for (const o of [name, hint, key]) {
    o.setY(y);
    y += o.height + (o === name ? 14 : 16);
  }
  h.add(dim(scene, 0.55, depth));
  h.add(panel(scene, cx, cy, W, H, { depth: depth + 1, accent: 0xe9b84a }));
  return true;
}
