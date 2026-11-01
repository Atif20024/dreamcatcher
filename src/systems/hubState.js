import { DREAMS } from '../data/dreams.js';

// §4: how the station changes as dreams are caught. One table, read in one
// place, stretched over however many dreams are running (data/dreams.js has a
// scene for each), so a dream added later needs no edit here. The NPCs run the
// other way (they never desaturate), which is why they are not in here:
// HubState touches the room, never the people.
const TABLE = [
  // none of them caught
  { sat: 0, travelers: 40, fountain: 'flowing', flowers: 6, skylightBars: 4, brassGray: 0, gateLight: 0, tally: 50, music: { bass: 1, brushes: 0.9, piano: 0.7, trumpet: 0.35, pad: 0, hum: 0 }, boardIdleMs: 2600, clockStutter: false },
  { sat: 0.12, travelers: 30, fountain: 'flowing', flowers: 5, skylightBars: 4, brassGray: 0, gateLight: 0, tally: 100, music: { bass: 1, brushes: 0, piano: 0.7, trumpet: 0.35, pad: 0, hum: 0 }, boardIdleMs: 3400, clockStutter: false },
  { sat: 0.2, travelers: 22, fountain: 'trickle', flowers: 3, skylightBars: 4, brassGray: 0, gateLight: 0.35, tally: 200, music: { bass: 1, brushes: 0, piano: 0, trumpet: 0.35, pad: 0, hum: 0 }, boardIdleMs: 5000, clockStutter: false },
  { sat: 0.3, travelers: 15, fountain: 'trickle', flowers: 2, skylightBars: 2, brassGray: 0.3, gateLight: 0.5, tally: 350, music: { bass: 1, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0 }, boardIdleMs: 8000, clockStutter: false },
  { sat: 0.42, travelers: 8, fountain: 'drip', flowers: 1, skylightBars: 2, brassGray: 0.7, gateLight: 0.7, tally: 550, music: { bass: 0.8, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0 }, boardIdleMs: 13000, clockStutter: false },
  // all of them
  { sat: 0.6, travelers: 0, fountain: 'dry', flowers: 0, skylightBars: 1, brassGray: 1, gateLight: 1, tally: 900, music: { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0.45, hum: 0.6 }, boardIdleMs: 20000, clockStutter: true },
];

export const runningDreams = () => DREAMS.filter((d) => d.scene);
export const runningCount = () => runningDreams().length;
// caught dreams that still run: an old save's other ids count for nothing
export const caughtRunning = (save) => runningDreams().filter((d) => save.dreams[d.id]).length;
// how far through the running dreams, 0..1
export const progress = (n) => Math.max(0, Math.min(1, n / runningCount()));

const lerp = (a, b, t) => a + (b - a) * t;

// every catch moves the numbers; the things that come in steps (the fountain,
// the skylights) hold until their row, and the clock stutters only at the end
export function hubState(n) {
  const t = progress(n) * (TABLE.length - 1);
  const i = Math.min(TABLE.length - 2, Math.floor(t));
  const f = t - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  const row = f === 1 ? b : a;
  const music = {};
  for (const k of Object.keys(a.music)) music[k] = lerp(a.music[k], b.music[k], f);
  return {
    ...row,
    sat: lerp(a.sat, b.sat, f),
    travelers: Math.round(lerp(a.travelers, b.travelers, f)),
    flowers: Math.round(lerp(a.flowers, b.flowers, f)),
    brassGray: lerp(a.brassGray, b.brassGray, f),
    gateLight: lerp(a.gateLight, b.gateLight, f),
    tally: Math.round(lerp(a.tally, b.tally, f)),
    boardIdleMs: Math.round(lerp(a.boardIdleMs, b.boardIdleMs, f)),
    music,
  };
}

// a list authored for "none caught, ..., all caught" stretched over the running
// dreams: first and last always mean none and all, the middle shares the rest
export function stretch(list, n, running = runningCount()) {
  if (n <= 0) return list[0];
  if (n >= running) return list[list.length - 1];
  return list[1 + Math.floor(((n - 1) / (running - 1)) * (list.length - 2) + 1e-9)];
}

const WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const numberWord = (n) => WORDS[n] || String(n);
const Cap = (s) => s[0].toUpperCase() + s.slice(1);

// Newspaper headlines at the kiosk
const HEADLINES = [
  () => `${numberWord(DREAMS.length).toUpperCase()} PLATFORMS, ONE TIMETABLE — ALL ON TIME`,
  () => 'LOCAL MAN CATCHES DREAM, SAYS "FINE"',
  () => 'SERVICE GATE HEARD KNOCKING, OFFICIALS SHRUG',
  () => 'FOUNTAIN "MOSTLY DECORATIVE", COUNCIL ADMITS',
  () => 'SEATS AVAILABLE ON ALL SERVICES, BOARD INSISTS',
  () => 'STATION QUIETER THAN USUAL, SAY THE FEW',
  () => 'LAST PIGEON DECLINES TO COMMENT',
  () => 'NO PASSENGERS',
];
export const headline = (n) => stretch(HEADLINES, n)();

// Mr. Pemberton, back from a dream: the count in his own mouth
const PEMBERTON = [
  () => 'Any platform, sir. They all leave now.',
  () => 'Back already. Was it everything?',
  (w) => `${w} off the board. I haven't touched it. It does that.`,
  (w) => `${w}. You look… thinner around the eyes.`,
  (w) => `${w}. I used to announce the delays. Now there's nobody to be late.`,
  (w) => `${w}. The platforms ring when you walk them now.`,
  (w) => `${w}. You could stay, sir. I'd put it in the ledger.`,
  () => "That's the board, sir. All of it. The one train left isn't a dream. It's been warm in there all night.",
];
export const pembertonLine = (n) => stretch(PEMBERTON, n)(Cap(numberWord(n)));

// Bilal, at the mezzanine counter. The last one is his silence.
const TEA = [
  'On the house.',
  'On the house.',
  'Still on the house.',
  "You're not sleeping.",
  "Drink it here. Don't take it on the train.",
  'Fewer cups to wash. I keep washing them.',
  'Last of the good cardamom. I was keeping it for somebody.',
  null,
];
export const teaLine = (n) => stretch(TEA, n);
