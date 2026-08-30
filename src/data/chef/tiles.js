// D3 — tileset description for the chef dream. Letters are grid characters;
// the palette maps them to colours. Reserved letters J (Jo blue) and X
// (hazard red) must not appear here except as the hazard colour.
export default {
  key: 'chef',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0x8a8e9a,
    D: 0x5a5e6a,
    T: 0xb8bcc8,
    M: 0x9a9ea8,
    E: 0x6a6e7a,
    K: 0x7a7e8a,
  },
  support: 'pipe',
  supportColors: [0x3a3a40, 0x6a6e7a],
  ladderColor: 0xb87333,
  climbColor: 0x6a6e7a,
  climbDeco: 0x3a3a40,
  hazardColor: 0xc0c4cc,
  liquid: 0x4a2c1a,
  liquidTop: 0x6a4028,
};
