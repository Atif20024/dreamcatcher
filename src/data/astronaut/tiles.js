// D3 — tileset for THE QUIET ABOVE: painted concrete and bolted panel.
// One material for the whole dream; the zone tints recolour it per phase
// (gym fluorescents → campus dusk → station white → moon grey → field green).
export default {
  key: 'astro',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0x6e7076,
    D: 0x4a4c54,
    T: 0x9a9ca6,
    M: 0x7a7c86,
    E: 0x3a3c44,
    K: 0x5a5c64,
  },
  support: 'bracket',
  // nothing hangs off a spacecraft or a crater: supports only on Earth
  supportFilter: (tx) => tx < 245 || tx > 471,
  supportColors: [0x3a3c44, 0x6a6e7a],
  ladderColor: 0xb8bcc8,
  climbColor: 0x8a6844,
  climbDeco: 0x4a3a2a,
  hazardColor: 0xb8bcc8,
  liquid: 0x1e4a66,
  liquidTop: 0x3a7a9a,
};
