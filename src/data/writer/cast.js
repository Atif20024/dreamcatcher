// THE SECOND DRAFT — who is in it, what they say, and the words of the book.

// pixel people (data/evening/sprites.js `createPersonTextures`): hat, pal, held
export const PEOPLE = {
  wren: { hat: 'beanie', held: 'book', pal: { H: 0x8a4a5a, S: 0xc09070, T: 0x5a6a4a, t: 0x3e4a34, P: 0x2e2e3a, B: 0x1e1e28, A: 0xe8e4d8 } },
  emmerich: { hat: 'none', held: 'book', pal: { H: 0xd8d0c0, S: 0xd8b8a0, T: 0x6a6a72, t: 0x4a4a52, P: 0x3a3a44, B: 0x1e1e28, A: 0xc03a2a } },
  tomasz: { hat: 'cap', held: null, pal: { H: 0x3a5a80, S: 0xc8a080, T: 0x88b8d8, t: 0x5a7a90, P: 0x2e3440, B: 0x1e1e28 } },
  isolde: { hat: 'bob', held: null, pal: { H: 0x2a2230, S: 0xe0c0a8, T: 0xc03a2a, t: 0x86281c, P: 0x22222c, B: 0x14141a } },
  hat: { hat: 'peaked', held: null, pal: { H: 0x4a3a2a, S: 0xb08868, T: 0x8a7a5a, t: 0x5a4e3a, P: 0x3a3a44, B: 0x1e1e28 } },
  landlady: { hat: 'scarf', held: null, pal: { H: 0xc86a90, S: 0x8a5a3b, T: 0x6a4a5a, t: 0x4a3240, P: 0x3a2e3a, B: 0x1e1e28 } },
  reader1: { hat: 'bun', held: null, pal: { H: 0x8a6a3a, S: 0xd8b8a0, T: 0x4a6a6a, t: 0x34504e, P: 0x2e2e3a, B: 0x1e1e28 } },
  reader2: { hat: 'none', held: null, pal: { H: 0x3a2a20, S: 0x9a6a48, T: 0x7a5a6a, t: 0x5a4050, P: 0x2e2e3a, B: 0x1e1e28 } },
  reader3: { hat: 'straw', held: null, pal: { H: 0xd8b858, S: 0xc09070, T: 0x5a5a8a, t: 0x404060, P: 0x3a3a44, B: 0x1e1e28 } },
  reader4: { hat: 'cap', held: null, pal: { H: 0x2e6a4a, S: 0x8a5a3b, T: 0x9a8a5a, t: 0x6e6240, P: 0x2e2e3a, B: 0x1e1e28 } },
};

export const NAMES = { wren: 'WREN', emmerich: 'OLD EMMERICH', tomasz: 'TOMASZ', isolde: 'ISOLDE MARR', landlady: 'MRS. ADESANYA', hat: 'THE MAN IN THE HAT' };

const say = (who, text) => ({ name: NAMES[who] || who.toUpperCase(), portrait: `portrait-${who}`, text });

export const DIALOGUES = {
  d0: [{ name: 'JO', portrait: 'portrait-jo', text: 'Morning.' }],
  d1: [
    say('wren', "You're stealing lines. Good. Everyone in here is somebody's chapter."),
    say('wren', "Take that one — the man in the hat's been saying 'it was never about the money' for a year and it's *always* about the money."),
    say('wren', 'Here. A napkin. There\'s one honest word on it. Keep it.'),
  ],
  d2: [
    say('emmerich', 'Page three. Cut it.'),
    { name: 'JO', portrait: 'portrait-jo', text: 'Which part?' },
    say('emmerich', 'Page three.'),
  ],
  d2b: [say('emmerich', "Thirty pages. Lay them out. A story has a shape before it has a sentence.")],
  d3: [say('wren', "Forty. That's… that's a good number. Mine was a hundred and ten.")],
  d3b: [say('wren', 'Soup. And a word. The only one that ever mattered to me.'), say('wren', 'Again.')],
  d4: [say('emmerich', 'Sixty pages. Forty of them are the book. Find them.'), say('emmerich', 'The pencil. It does not write. It only takes away.')],
  d4_cut: [say('emmerich', 'Page three. You cut it.'), say('emmerich', 'It was the best thing in there. That is why.')],
  d4_kept: [say('emmerich', 'You kept page three.'), say('emmerich', 'Good. Somebody should.')],
  d5: [
    say('isolde', "I love it. I've sold it. It's due Friday."),
    say('isolde', "It's Wednesday."),
  ],
  d6: [say('wren', 'Page three?'), { name: 'JO', portrait: 'portrait-jo', text: '{page_three}' }, say('wren', 'Good.')],
  rent_no: [say('landlady', 'The rent, Mr. Jo. Thursday was the rent.'), say('landlady', "I'm not asking about the book. I'm asking about the rent.")],
  rent_yes: [say('landlady', 'The rent.'), say('landlady', "…Well. I'll not ask what it's about.")],
  tomasz: [say('tomasz', 'Six machines, four jammed, one queue. Fix what you can, kid. It pays in pennies.'), say('tomasz', 'Desk in the back is yours between shifts. Nobody goes back there.')],
  tomasz2: [say('tomasz', "Rent's covered. Go write the thing.")],
  guard: [{ name: 'A GUARD', portrait: 'portrait-guard', text: 'Quiet. This is a library.' }],
  isolde_late: [say('isolde', "Friday's Friday.")],
};

export const MOMENTS = {
  m1: { sub: 'Behind the shop, Tomasz eats a sandwich and reads a page Jo left in the machine.', text: '"He\'d never told him it was funny."' },
  m2: { sub: 'The man in the hat, at the bar, alone, not saying anything for once.', text: '"It was never about the money."' },
  m3: { sub: 'The landlady on the stairs, at night, reading a page that blew under her door.', text: '"She\'d stopped asking about the rent."' },
};

// P1 — the napkin: eight overheard fragments that make one paragraph.
export const NAPKIN = [
  'It was never',
  'about the money,',
  'he said, and paid',
  'for both coffees,',
  'and the quiet one',
  'by the window',
  'wrote it down',
  'before he forgot.',
];

// P2/P3 — the twelve scenes of the book, with their tension. Two red
// herrings belong to Wren's book.
export const SCENES = [
  { id: 's1', name: 'the attic', t: 1 },
  { id: 's2', name: 'the copy shop', t: 2 },
  { id: 's3', name: 'the café', t: 2 },
  { id: 's4', name: 'the napkin', t: 3 },
  { id: 's5', name: 'the stacks', t: 3 },
  { id: 's6', name: 'forty envelopes', t: 4 },
  { id: 's7', name: 'the bus', t: 5 },
  { id: 's8', name: 'the rain', t: 2 },
  { id: 's9', name: 'the rewrite', t: 3 },
  { id: 's10', name: 'the red pencil', t: 4 },
  { id: 's11', name: 'friday', t: 4 },
  { id: 's12', name: 'nine chairs', t: 5 },
];
export const HERRINGS = [
  { id: 'h1', name: 'the lighthouse', t: 3, wren: true },
  { id: 'h2', name: 'her sister', t: 4, wren: true },
];

// P4 — page three, in full. It is good. It is scaffolding.
export const PAGE_THREE = [
  'The copy shop opened at six and the light in it was the colour',
  'of skimmed milk. Tomasz had already been there an hour; you',
  'could tell by the coffee ring on the counter, which he wiped',
  'each morning and which came back each morning like a tide.',
  'He said the machines had moods. Jo believed him. Number four',
  'sulked on Mondays. Number two only jammed when it was watched.',
  'Nobody who came in wanted a copy of anything. They wanted the',
  'thing itself, and settled. Jo made the copies. He made them',
  'well. He put the good ones on top.',
];

// Chapter 7 — the first paragraph, typed by any key
export const FIRST_PARAGRAPH =
  'He got up at five because the page was there, and it was the only hour nobody wanted from him. The typewriter had a stuck key and a coffee tin of pens beside it, and he never used the pens.';

export const CARD_LINES = {
  kept: 'He kept page three. Nobody noticed but him.',
  cut: 'He cut page three. He still knows it by heart.',
  attentive: "The second draft was the one he'd been paying attention for.",
};
