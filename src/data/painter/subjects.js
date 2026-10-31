// §3.6 — the subjects: what each canvas is OF. `requires` is the pair of
// colours the picture needs (two of them on the palette captures it);
// `hour` the window of the clock it can be painted in; `x`/`y` are WORLD
// tiles. The fields' ten are the day loop of Canvas 2.
export const SUBJECTS = [
  // canvas 1 — the bedroom is a puzzle of its own (walls one colour, bedding its complement)
  { id: 'bedroom', title: 'the bedroom', room: 'studio', x: 58, y: 25, requires: ['any', 'complement'], hour: [0, 24], special: 'bedroom' },
  // canvas 2 — ten in ten days
  { id: 'plane_trees', title: 'the plane trees', room: 'fields', x: 146, y: 33, requires: ['green', 'yellow'], hour: [7, 18] },
  { id: 'road', title: 'the road', room: 'fields', x: 156, y: 33, requires: ['yellow', 'violet'], hour: [15, 20] },
  { id: 'harvest', title: 'the harvest', room: 'fields', x: 163, y: 33, requires: ['yellow', 'orange'], hour: [10, 16] },
  { id: 'haystacks', title: 'the haystacks', room: 'fields', x: 171, y: 33, requires: ['yellow', 'blue'], hour: [6, 11] },
  { id: 'canal', title: 'the canal', room: 'fields', x: 184, y: 31, requires: ['blue', 'green'], hour: [8, 19] },
  { id: 'bridge', title: 'the drawbridge', room: 'fields', x: 203, y: 33, requires: ['red', 'blue'], hour: [9, 18] },
  { id: 'sunflowers', title: 'the sunflowers', room: 'fields', x: 225, y: 29, requires: ['yellow', 'green'], hour: [11, 15] },
  { id: 'sower', title: 'the sower at dusk', room: 'fields', x: 238, y: 33, requires: ['violet', 'yellow'], hour: [17, 21] },
  { id: 'cypresses', title: 'the cypresses', room: 'fields', x: 252, y: 29, requires: ['green', 'blue'], hour: [6, 22] },
  { id: 'hill', title: 'the plain from the hill', room: 'hill', x: 278, y: 23, requires: ['yellow', 'blue'], hour: [6, 22] },
  // canvas 2 — the small moment that is also a canvas
  { id: 'roulin', title: 'the postman', room: 'square', x: 128, y: 31, requires: ['blue', 'any'], hour: [0, 24], special: 'roulin' },
  // canvas 3 — the terrace: sky blue, terrace orange/yellow (the edge sings)
  { id: 'terrace', title: 'the café terrace at night', room: 'cafe', x: 322, y: 30, requires: ['blue', 'yellow'], hour: [20, 24], special: 'terrace' },
  // canvas 5 — the irises (any two, once violet has come back)
  { id: 'irises', title: 'the irises', room: 'garden', x: 552, y: 33, requires: ['violet', 'green'], hour: [0, 24] },
  // canvas 6 — the stars
  { id: 'stars', title: 'the night', room: 'sky', x: 668, y: 7, requires: ['blue', 'yellow'], hour: [0, 24] },
];

export const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
export const FIELD_SUBJECTS = SUBJECTS.filter((s) => s.room === 'fields' || s.room === 'hill').map((s) => s.id);
