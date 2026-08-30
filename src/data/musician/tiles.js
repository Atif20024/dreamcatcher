// D3 — tileset description for the musician dream: stage boards and brick.
export default {
  key: 'mus',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0x6a4a32,
    D: 0x3f2c1e,
    T: 0x8a6844,
    M: 0x6f5236,
    E: 0x4a3222,
    K: 0x59402b,
  },
  support: 'chain',
  supportColors: [0x2a2230, 0x5a4a3a],
  ladderColor: 0x8a8aa8,
  climbColor: 0x5a4a5a,
  climbDeco: 0x2a2230,
  hazardColor: 0x9a9ab8,
  liquid: 0x203040,
  liquidTop: 0x35506a,
};
