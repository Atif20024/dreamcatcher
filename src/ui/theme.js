// Colour tokens (ui-type skill): the single source of truth for UI colour.
// Scene code passes a token name ('accent') or a legacy '#rrggbb' string to
// uiText; both resolve here.
export const THEME = Object.freeze({
  ink: 0xf2e9d8,
  'ink-dim': 0x9c8f7a,
  'ink-shadow': 0x14122a, // §9: no pure black; the darkest is the night indigo
  accent: 0xe9b84a,
  danger: 0xd5443c,
  calm: 0x7fb7c9,
  good: 0x7ec87e,
  'brass-light': 0xf6d98a,
  'brass-dark': 0x6b4a1f,
  panel: 0x14122a, // §9 frame: ink-dark fill
  'panel-edge': 0xc8a24a, // §9 frame: one 1 px brass line
  dim: 0x14122a,
});

// ---- round 2 WP6: the identity ("Nine o'clock at Crossroads: count the
// lamps", critique §9). Every place is a station at night, lit by lamps you
// can count: 70 % the place's cool indigo, 25 % warm practicals, 5 % the
// dream's accent (the Evening inverts it). No pure black, no pure white.
export const IDENTITY = Object.freeze({
  night: 0x14122a, // the darkest colour anywhere (fills, dims, shadows, fades)
  cream: 0xf2e6cc, // the lightest (body text, the board's glyphs)
  gold: 0xf2d580, // names, titles
  warn: 0xd06050, // warnings
  brass: 0xc8a24a, // the frame's one line, the board's rim
  lamp: 0xffc870, // a lit lamp
  rim: 0xffd890, // the warm rim on Jo's lit side
});

// per place: the shadow field's indigo, the warm practicals, the one accent
// (the train livery, the wipe, CAUGHT, the strand on the hall's dreamcatcher)
export const PLACES = Object.freeze({
  hub: { name: 'CROSSROADS', shadow: 0x1c1a3a, warm: 0xf2c078, accent: 0xc8a24a, grade: 0x9894c8, halo: 0.7 },
  chef: { name: 'FIVE-STAR DREAM', shadow: 0x1e1832, warm: 0xf2a860, accent: 0xc0392b, grade: 0xdcd6ee, halo: 0.6 },
  musician: { name: 'THE BIG STAGE', shadow: 0x161c3a, warm: 0xf2c078, accent: 0x2e7d9a, grade: 0xe2def2, halo: 0.65 },
  astronaut: { name: 'THE QUIET ABOVE', shadow: 0x16203a, warm: 0xf0c890, accent: 0xbfe6ef, grade: 0xdcdcf0, halo: 0.65 },
  writer: { name: 'THE SECOND DRAFT', shadow: 0x1a1a36, warm: 0xf2d590, accent: 0x2c3e75, grade: 0xd8d6ec, halo: 0.75 },
  painter: { name: "THE MASTER'S LADDER", shadow: 0x1e2040, warm: 0xf2c070, accent: 0xe8b830, grade: 0xe4dff0, halo: 0.5 },
  gambler: { name: 'THE LAST HAND', shadow: 0x1c1430, warm: 0xf2b868, accent: 0x2f7a4a, grade: 0xe0d8ec, halo: 1 },
  clockmaker: { name: 'THE STOPPED HOUR', shadow: 0x1a1c3a, warm: 0xffc870, accent: 0x6fae8c, grade: 0xd4d2ec, halo: 0.55 },
  evening: { name: 'THE LONG EVENING', shadow: 0x2a1e30, warm: 0xf0b45a, accent: 0xf0b45a, inverted: true },
});

// the scene (or a dream id) → its place in PLACES
const SCENE_PLACE = { Hub: 'hub', Title: 'hub', Boot: 'hub', Chef: 'chef', Musician: 'musician', Astronaut: 'astronaut', Writer: 'writer', Painter: 'painter', Gambler: 'gambler', Evening: 'evening' };
export function placeOf(sceneOrId) {
  if (!sceneOrId) return 'hub';
  if (typeof sceneOrId === 'string') return PLACES[sceneOrId] ? sceneOrId : SCENE_PLACE[sceneOrId] || 'hub';
  const s = sceneOrId;
  const key = s.sys && s.sys.settings ? s.sys.settings.key : '';
  if (key === 'Dream') return PLACES[s.dreamId] ? s.dreamId : 'hub';
  if (key === 'Intro') return PLACES[s.levelKey] ? s.levelKey : 'hub';
  return SCENE_PLACE[key] || 'hub';
}
export const accentOf = (sceneOrId) => PLACES[placeOf(sceneOrId)].accent;

// Jo's rim in a place: its warm practical, lifted halfway to cream
export function rimOf(place) {
  const w = (PLACES[place] || PLACES.hub).warm;
  const c = IDENTITY.cream;
  const m = (s) => Math.round((((w >> s) & 255) + ((c >> s) & 255)) / 2);
  return (m(16) << 16) | (m(8) << 8) | m(0);
}

// the §9 frame: ink-dark fill at 88 %
export const PANEL_ALPHA = 0.88;

// '#abc', '#aabbcc', '#aabbccdd', 0xaabbcc or a token → 0xaabbcc
export function toColor(c, fallback = THEME.ink) {
  if (c === undefined || c === null || c === '') return fallback;
  if (typeof c === 'number') return c;
  if (THEME[c] !== undefined) return THEME[c];
  let s = String(c).trim();
  if (s[0] === '#') s = s.slice(1);
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('');
  if (s.length === 8) s = s.slice(0, 6);
  const n = parseInt(s, 16);
  return Number.isFinite(n) ? n : fallback;
}

// the alpha of an 8-digit '#rrggbbaa' (1 otherwise)
export function toAlpha(c) {
  if (typeof c !== 'string') return 1;
  const s = c.replace('#', '');
  return s.length === 8 ? parseInt(s.slice(6), 16) / 255 : 1;
}
