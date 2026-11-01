// Teaching cards as data (plan §2.9, §4.9). Each card says WHAT it teaches
// and WHERE / WHEN it fires; src/play/Teach.js runs the triggers and
// scripts/lint-content.js fails the build on a card with no trigger.
//
//   scope    'perDream' (default): seen once per dream, shown again in the
//            next dream that uses the verb. 'once': once per save.
//   triggers [{ dream, zone: { room, x0?, x1? } }]  fires when Jo stands in
//              that room (room-local tile columns x0..x1, inclusive)
//            [{ dream, event: '<where in code>' }]   fired from code by
//              showTutorial(scene, id); the lint checks the call exists.
//            dream '*' = any dream.
//   staged   the first success cannot fail (notes for the lint report; the
//            safety itself lives with the verb, e.g. the EVA push-off block).
//
// Removed in phase 1.4 (no mechanic in any dream): ledge_grab, hang_drop,
// careful_step, loose_tile ('L' tiles are plain solids; nothing crumbles).

export const CARDS = {
  // ---- movement, every dream ----------------------------------------------
  slide_under: { name: 'SLIDE UNDER', hint: 'duck through the grab', key: '↓', triggers: [{ dream: '*', event: 'Foe grab wind-up' }] },
  shove: { name: 'SHOVE', hint: 'stagger, never hurt', key: 'X', triggers: [{ dream: '*', event: 'Foe first notice' }] },
  hide: { name: 'HIDE', hint: 'wait for them to pass', key: '↓', triggers: [{ dream: '*', event: 'BaseLevel hide spot' }] },
  wall_jump: {
    name: 'WALL JUMP',
    hint: 'only on ribbed walls. jump into one, hold toward the wall, then jump again off it',
    key: '↑ / SPACE',
    triggers: [
      { dream: '*', event: 'Player first touch of a ribbed wall in the air' },
    ],
  },
  plate_gate: {
    name: 'PRESSURE PLATE',
    hint: 'weight holds it open: stand on it, or leave something heavy',
    key: '',
    triggers: [
      { dream: 'writer', zone: { room: 'postoffice', x0: 1, x1: 6 } },
    ],
  },
  // ---- the quiet above: three gravities, each taught the moment it starts --
  zero_g: { name: 'NO FLOOR HERE', hint: 'aim with the arrows, then shove off a surface', key: 'SPACE', triggers: [{ dream: 'astronaut', event: 'AstronautScene gravity model zero' }] },
  zero_g_rail: { name: 'HANDRAILS', hint: 'the yellow lines are the ground now', key: 'E', triggers: [{ dream: 'astronaut', event: 'AstronautScene first rail in reach' }] },
  eva_tether: {
    name: 'THE TETHER IS LIFE',
    hint: 'clip on before you push. hold to reel in',
    key: 'F',
    staged: 'the first unclipped push-off is refused, and the first drift after that is reeled back',
    triggers: [{ dream: 'astronaut', zone: { room: 'p4_eva' } }, { dream: 'astronaut', event: 'AstronautScene unclipped push-off' }],
  },
  moon_bound: { name: 'ONE-SIXTH', hint: 'you rise slowly and you keep going', key: '', triggers: [{ dream: 'astronaut', event: 'AstronautScene gravity model moon' }] },
  // ---- the second draft ---------------------------------------------------
  pen: { name: 'THE PEN', hint: 'stand under a label and strike its adjective', key: 'E', triggers: [{ dream: 'writer', event: 'WriterScene first word "working"' }] },
  typing: { name: 'THE TYPING RHYTHM', hint: 'press each letter as it reaches the line', key: 'A–Z', triggers: [{ dream: 'writer', event: 'WriterScene typing' }] },
  editor: { name: 'THE INNER EDITOR', hint: 'keep moving. it erases what you have crossed', key: '', triggers: [{ dream: 'writer', event: 'WriterScene rain' }] },
  glass: { name: 'FRAGILE', hint: 'crouch-walk across, or it goes', key: '↓', triggers: [{ dream: 'writer', event: 'WriterScene glass' }] },
  talker: { name: 'A WALL OF SOUND', hint: 'duck under, come up behind, jump for the word', key: '↓', triggers: [{ dream: 'writer', event: 'WriterScene talker' }] },
  press: { name: 'THE PRESS', hint: 'ride the paper down. ink, press, fold', key: 'E', triggers: [{ dream: 'writer', event: 'WriterScene press' }] },
};

export const cardIds = () => Object.keys(CARDS);
