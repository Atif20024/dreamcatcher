// §4 — how the station changes with dreamsCaught, 0 → 5. One table, read in
// one place. The NPCs run the other way (they never desaturate), which is
// why they are not in here: HubState touches the room, never the people.
const TABLE = [
  // N: 0
  { sat: 0, travelers: 40, fountain: 'flowing', flowers: 6, skylightBars: 4, brassGray: 0, gateLight: 0, tally: 50, music: { bass: 1, brushes: 0.9, piano: 0.7, trumpet: 0.35, pad: 0, hum: 0 }, boardIdleMs: 2600, clockStutter: false },
  // 1
  { sat: 0.12, travelers: 30, fountain: 'flowing', flowers: 5, skylightBars: 4, brassGray: 0, gateLight: 0, tally: 100, music: { bass: 1, brushes: 0, piano: 0.7, trumpet: 0.35, pad: 0, hum: 0 }, boardIdleMs: 3400, clockStutter: false },
  // 2
  { sat: 0.2, travelers: 22, fountain: 'trickle', flowers: 3, skylightBars: 4, brassGray: 0, gateLight: 0.35, tally: 200, music: { bass: 1, brushes: 0, piano: 0, trumpet: 0.35, pad: 0, hum: 0 }, boardIdleMs: 5000, clockStutter: false },
  // 3
  { sat: 0.3, travelers: 15, fountain: 'trickle', flowers: 2, skylightBars: 2, brassGray: 0.3, gateLight: 0.5, tally: 350, music: { bass: 1, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0 }, boardIdleMs: 8000, clockStutter: false },
  // 4
  { sat: 0.42, travelers: 8, fountain: 'drip', flowers: 1, skylightBars: 2, brassGray: 0.7, gateLight: 0.7, tally: 550, music: { bass: 0.8, brushes: 0, piano: 0, trumpet: 0, pad: 0, hum: 0 }, boardIdleMs: 13000, clockStutter: false },
  // 5
  { sat: 0.6, travelers: 0, fountain: 'dry', flowers: 0, skylightBars: 1, brassGray: 1, gateLight: 1, tally: 900, music: { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0.45, hum: 0.6 }, boardIdleMs: 20000, clockStutter: true },
];

export function hubState(n) {
  return TABLE[Math.max(0, Math.min(5, n))];
}

// Newspaper headlines at the kiosk, one per state
export const HEADLINES = [
  'EIGHT TRAINS, EIGHT DREAMS — ALL ON TIME',
  'LOCAL MAN CATCHES DREAM, SAYS "FINE"',
  'SERVICE GATE HEARD KNOCKING, OFFICIALS SHRUG',
  'FOUNTAIN "MOSTLY DECORATIVE", COUNCIL ADMITS',
  'STATION QUIETER THAN USUAL, SAY THE FEW',
  'NO PASSENGERS',
];
