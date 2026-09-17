import { EV } from './map.js';

// D3 — tileset for THE LONG EVENING: warm limestone, light enough that the
// scene's zone tints (orchard green, field gold, pine blue, snow white) and
// the night's ambient colour can take it anywhere by multiplying.
export default {
  key: 'eve',
  selfPainted: true, // src/art/eveningArt.js paints these
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0xd8c4a4,
    D: 0xa8906e,
    T: 0xfff0c8,
    M: 0xe8cc98,
    E: 0x9a7e5e,
    K: 0xc8b08c,
  },
  // wooden legs under the jetty, the canal planks and the stone bridge; the
  // viaduct gets proper piers from the scene, not a picket of brackets
  support: 'leg',
  supportFilter: (tx, ty) => {
    if (ty >= EV.DECK && ty <= EV.DECK + 1 && (tx >= 376 || tx < EV.BUF)) return false;
    if (tx === EV.ROOF_LADDER) return false;
    return true;
  },
  supportColors: [0x5a4232, 0x8a6a4a],
  ladderColor: 0x6a4a32,
  climbColor: 0x8a6844,
  climbDeco: 0x4a3a2a,
  hazardColor: 0xb8bcc8,
  liquid: 0x3a6a8a,
  liquidTop: 0x9ac8d8,
};
