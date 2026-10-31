// Jo's dialogue portrait (32×32, drawn 3× → 96×96): the art-source proof
// point for code-drawn faces (plan §3.1). One face, expression patches on
// top: brows, eyes, mouth. Same palette as the rig (src/data/rigs/jo.js).

const NEUTRAL = [
  '................................',
  '................................',
  '...........kkkkkkkkkk...........',
  '..........kUUUHHHHHHhk..........',
  '.........kUUHHHHHHHHHhk.........',
  '.........kUHHHHHHHHHHhk.........',
  '.........kHHHHHHHHHHHhk.........',
  '.........kyyrrrrrrrrrnk.........',
  '.........kyrrrrrrrrrrnk.........',
  '.....kkkkkHHHHHHHHHHHhkkkkk.....',
  '....kUUHHHHHHHHHHHHHHHHHHhhk....',
  '.....kkhhhhhhhhhhhhhhhhhhkk.....',
  '.......kaaRRRSSSSSSSSsaak.......',
  '.......kaRRSSSSSSSSSSSsak.......',
  '......kkaRaaaaSSSSaaaasak.......',
  '......ksRGGGGGGSSGGGGGGsk.......',
  '......kRRGLlLLGGGGLlLLGsk.......',
  '......ksSGLeeLGSSGLeeLGsk.......',
  '......kkSGGGGGGSSGGGGGGsk.......',
  '.......kSSSSSSSRSsSSSSsk........',
  '.......kSSSSSSSRSssSSSsk........',
  '.......ksSSSSSssssSSSssk........',
  '........kSSSSmmmmmmSSsk.........',
  '........ksSSSSSSSSSSssk.........',
  '.........ksSSSSSSSSssk..........',
  '..........kksssssstkk...........',
  '...........kssSSsstk............',
  '......kkkkkJWWWWWWJjkkkk........',
  '....kkIIJJJJWwWWwWJJJjjjkk......',
  '...kIIJJJJJJJWwwWJJJJJjjjjk.....',
  '..kIIJJJJJJJJJWWJJJJJJJjjjjk....',
  '..kIJJJJJJJJJJWWJJJJJJJjjjjk....',
];

// patches: [row, col, string] written over the neutral face
const PATCH = {
  neutral: [],
  smile: [
    [21, 12, 'SmSSSSSm'],
    [22, 13, 'SmmmmmmS'],
    [23, 13, 'SSssssSS'],
    [14, 9, 'RaaaSSSSSaaas'],
  ],
  doubt: [
    [13, 9, 'RaaSSSSSSSSa'],
    [14, 9, 'RSSSaaSSaaaas'],
    [22, 13, 'SSSmmmmmS'],
    [17, 10, 'LLee'],
    [17, 19, 'LLee'],
  ],
  tired: [
    [14, 9, 'RaaaSSSSSSaaas'.slice(0, 13)],
    [16, 10, 'kkkk'],
    [16, 19, 'kkkk'],
    [17, 10, 'LeeL'],
    [17, 19, 'LeeL'],
    [22, 13, 'SSmmmmSS'],
    [19, 9, 'sSSSSS'],
    [19, 18, 'SSSs'],
  ],
};

export const PORTRAIT_EXPRESSIONS = Object.keys(PATCH);

export function portraitRows(expr = 'neutral') {
  const rows = NEUTRAL.map((r) => [...r]);
  for (const [y, x, s] of PATCH[expr] || []) [...s].forEach((ch, i) => (rows[y][x + i] = ch));
  return rows.map((r) => r.join(''));
}

export const PORTRAIT_SCALE = 3;
