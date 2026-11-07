// D3 — tileset for THE SECOND DRAFT: old floorboards and plaster, the colour
// of a room lit by one lamp. Painted by levelArt (material 'board').
export default {
  key: 'wr',
  material: 'board',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0x6a5240,
    D: 0x3e2e22,
    T: 0xa88a68,
    M: 0x7e6448,
    E: 0x4a3828,
    K: 0x8a7050,
  },
  support: 'bracket',
  supportColors: [0x2e2218, 0x5a4634],
  ladderColor: 0x4a4a52,
  climbColor: 0x4a4a52,
  climbDeco: 0x2a2a30,
  hazardColor: 0xd8d0c8,
  liquid: 0x101018,
  liquidTop: 0x2a2a3a,
};
