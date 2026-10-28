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
    hint: 'only on ribbed walls. jump into one, then jump again off it',
    key: '↑ / SPACE',
    staged: 'chef chimney: the shaft floor is solid, a missed jump just lands you back at its foot',
    triggers: [
      { dream: 'chef', zone: { room: 'alley_dock', x0: 11, x1: 15 } },
      { dream: '*', event: 'Player first touch of a ribbed wall in the air' },
    ],
  },
  plate_gate: {
    name: 'PRESSURE PLATE',
    hint: 'weight holds it open: stand on it, or leave something heavy',
    key: '',
    triggers: [
      { dream: 'chef', zone: { room: 'alley_dock', x0: 44, x1: 48 } },
      { dream: 'musician', zone: { room: 'd3_basement', x0: 8, x1: 13 } },
      { dream: 'writer', zone: { room: 'postoffice', x0: 1, x1: 6 } },
    ],
  },
  distract: { name: 'DISTRACT', hint: 'make a noise elsewhere: they turn to look', key: 'Q', triggers: [{ dream: 'painter', event: 'PainterScene first person in sight' }] },
  // ---- the big stage ------------------------------------------------------
  sound_bridge: { name: 'SOUND BRIDGE', hint: 'jump, then play while airborne: the note holds you', key: 'Q', triggers: [{ dream: 'musician', event: 'MusicianScene near a bridge anchor' }] },
  call_response: { name: 'CALL & RESPONSE', hint: 'listen to the bar, then answer it note for note', key: 'Q', triggers: [{ dream: 'musician', event: 'MusicianScene first gig' }] },
  rest_note: { name: 'THE REST', hint: 'hollow means silence: do not play', key: '', triggers: [{ dream: 'musician', event: 'MusicianScene Ray\'s lesson' }] },
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
  // ---- the last hand --------------------------------------------------------
  bet: { name: 'BET', hint: 'chips or hearts. the odds are printed. the house wins ties', key: 'E', triggers: [{ dream: 'gambler', event: 'GamblerScene stake' }] },
  deal: { name: 'THE DEAL', hint: 'numbers hold. faces flip you. aces pay. the room shows the deck', key: '', triggers: [{ dream: 'gambler', event: 'GamblerScene deal' }] },
  reel: { name: 'THE REELS', hint: 'land on one to spin it. read the symbols before you jump', key: '', triggers: [{ dream: 'gambler', event: 'GamblerScene reels' }] },
  wheel: { name: 'THE WHEEL', hint: 'stop the ball on the marked colour. it slows the same way every time', key: 'E', triggers: [{ dream: 'gambler', event: 'GamblerScene wheel' }] },
  dice: { name: 'DICE BRIDGE', hint: 'the roll is the bridge. the gap is twelve minus the roll', key: 'E', triggers: [{ dream: 'gambler', event: 'GamblerScene dice' }] },
  marker: { name: 'THE MARKER', hint: 'ten chips, no paperwork. it never goes away', key: '', triggers: [{ dream: 'gambler', event: 'GamblerScene marker' }] },
  no_trumpet: { name: 'NO HORN', hint: 'no shove, no noise. checkpoints by touch', key: '', triggers: [{ dream: 'gambler', event: 'GamblerScene pawned' }] },
  cage: { name: 'THE CAGE', hint: 'pending chips become real only here. the marker comes off first', key: 'E', triggers: [{ dream: 'gambler', event: 'GamblerScene cage' }] },
  face: { name: 'POKER FACE', hint: 'hold down while they decide, or they read your eyebrow', key: '↓', triggers: [{ dream: 'gambler', event: 'GamblerScene poker' }] },
  // ---- the yellow house -------------------------------------------------------
  brush: { name: 'THE BRUSH', hint: 'stand at a surface and paint it the colour on the brush', key: 'E', triggers: [{ dream: 'painter', event: 'PainterScene brush' }] },
  stroke: { name: 'THE STROKE', hint: 'hold while moving: a ribbon of paint you can stand on. six tiles. it dries.', key: 'X', triggers: [{ dream: 'painter', event: 'PainterScene stroke' }] },
  wells: { name: 'THE PALETTE', hint: 'three wells, twelve strokes each. hits spill one. [1] [2] [3] choose', key: '1 2 3', triggers: [{ dream: 'painter', event: 'PainterScene wells' }] },
  mixing: { name: 'MIXING', hint: 'the brush takes the next well too: yellow+blue=green', key: 'V', triggers: [{ dream: 'painter', event: 'painter/beats mixing' }] },
  vibrato: { name: 'COMPLEMENTARIES', hint: 'a colour beside its complement shimmers. jump from it: triple height', key: '', triggers: [{ dream: 'painter', event: 'PainterScene vibrato' }] },
  clock: { name: 'THE LIGHT', hint: 'every stroke moves the clock a minute. some colours only at some hours', key: '', triggers: [{ dream: 'painter', event: 'PainterScene clock' }] },
  easel: { name: 'THE EASEL', hint: 'two of the right colours on the palette, in the right light', key: 'E', triggers: [{ dream: 'painter', event: 'painter/beats easel' }] },
  sleep: { name: 'NIGHT', hint: 'sleep at the easel. a new day; ten canvases in ten', key: 'E', triggers: [{ dream: 'painter', event: 'painter/world sleep' }] },
  paul: { name: 'PAUL', hint: 'he paints one stroke of what you lack. then you owe him', key: 'F', triggers: [{ dream: 'painter', event: 'painter/beats paul' }] },
  currents: { name: 'THE CURRENTS', hint: 'the sky carries you. jump to leave it', key: 'SPACE', triggers: [{ dream: 'painter', event: 'painter/world currents' }] },
};

export const cardIds = () => Object.keys(CARDS);
