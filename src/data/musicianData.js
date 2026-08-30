// THE BIG STAGE — 400x44 tiles. Seven "days" left to right.
// '#' solid  '.' air  (everything else is objects placed by the scene)
const W = 400;
const H = 44;
export const GROUND = 36;

const blank = () => Array.from({ length: H }, () => '.'.repeat(W));
const put = (rows, r, c, s) => {
  rows[r] = rows[r].slice(0, c) + s + rows[r].slice(c + s.length);
};
const fill = (rows, r0, r1, c0, c1, ch) => {
  for (let r = r0; r <= r1; r++) put(rows, r, c0, ch.repeat(c1 - c0 + 1));
};

export function buildMusicianMap() {
  const rows = blank();
  fill(rows, GROUND, H - 1, 0, W - 1, '#');

  // D1 street: dumpster, balconies, fire escape
  fill(rows, 34, 35, 34, 35, '#');
  fill(rows, 28, 28, 35, 37, '#');
  fill(rows, 28, 28, 42, 44, '#');
  fill(rows, 29, 29, 40, 48, '#'); // fire-escape walkway into backstage
  // boom-mic corridor ceiling
  fill(rows, 27, 27, 46, 58, '#');
  // cellar stage
  fill(rows, 34, 35, 70, 74, '#');

  // D2 rooftops
  fill(rows, 33, 33, 106, 107, '#');
  fill(rows, 30, 30, 107, 108, '#');
  fill(rows, 27, 27, 108, 109, '#');
  fill(rows, 26, 26, 110, 120, '#');
  fill(rows, 26, 26, 124, 128, '#');
  fill(rows, 26, 26, 132, 137, '#');
  fill(rows, 30, 30, 138, 139, '#');
  fill(rows, 33, 33, 139, 140, '#');

  // D3 basement cymbal risers + boiler climb
  fill(rows, 33, 33, 160, 161, '#');
  fill(rows, 31, 31, 163, 164, '#');
  fill(rows, 33, 33, 166, 167, '#');
  fill(rows, 33, 33, 181, 182, '#');
  fill(rows, 30, 30, 184, 185, '#');
  fill(rows, 27, 27, 182, 183, '#');
  fill(rows, 24, 24, 185, 186, '#');
  fill(rows, 22, 22, 187, 189, '#');

  // D4 highway guardrail gap (a real pit)
  fill(rows, GROUND, H - 1, 264, 267, '.');

  // D6 backstage catwalk + elevated stage with crowd pit in front
  fill(rows, 33, 33, 328, 329, '#');
  fill(rows, 30, 30, 330, 331, '#');
  fill(rows, 28, 28, 332, 344, '#');
  fill(rows, 32, 32, 346, 380, '#'); // the stage deck
  // risers live above the deck as moving platforms (objects)

  return rows;
}

export const M_GATES = [
  { id: 'g0', col: 25, rows: [31, 35], requires: ['d0'] },
  { id: 'g1', col: 85, rows: [31, 35], requires: ['cellar_gig'] },
  { id: 'g2', col: 105, rows: [31, 35], requires: ['busking_done'] },
  { id: 'g3', col: 150, rows: [31, 35], requires: ['met_nia'] },
  { id: 'g3b', col: 178, rows: [31, 35], requires: ['rehearsal'] },
  { id: 'g4', col: 210, rows: [31, 35], requires: ['ray_lesson'] },
  { id: 'g5', col: 290, rows: [31, 35], requires: ['tour_done'] },
  { id: 'g6', col: 325, rows: [31, 35], requires: ['choice_made'] },
  { id: 'g7', col: 345, rows: [26, 35], requires: ['choice_final'] },
  { id: 'g8', col: 381, rows: [26, 35], requires: ['set_done'] },
];

export const SONGS = {
  gig1: [
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ],
  gig2: [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ],
  pavilion: [
    [1, 1, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
  ],
  studio: [
    [1, 1, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 1],
    [0, 1, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 1, 0],
    [1, 1, 1, 1],
  ],
  stage1: [
    [1, 1, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 1, 1],
    [1, 0, 1, 0],
    [1, 1, 0, 1],
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 1],
  ],
  stage2: [
    [1, 1, 1, 1],
    [1, 0, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 1],
  ],
  stage3: [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1],
    [0, 1, 1, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 1, 1, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 1, 1, 1],
  ],
  blind: [
    [1, 1, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 0],
    [1, 1, 0, 1],
    [1, 1, 1, 1],
  ],
};

// strip rests for the pre-lesson mechanic or the tally branch
export const noRests = (phrases) => phrases.map((p) => p.map(() => 1).slice(0, p.length));

export const M_DIALOGUES = {
  d0: [{ name: 'JO', portrait: 'portrait-jo', text: "Saturday. Big stage. That's… that's the whole thing. Everything before that is just waiting." }],
  d1: [
    { name: 'DELPHINE', portrait: 'portrait-delphine', text: 'Open mic. Two songs. If the bartender stops washing glasses, you were good.' },
    { name: 'DELPHINE', portrait: 'portrait-delphine', text: 'If Ray looks up, you were *very* good.' },
  ],
  d2: [
    { name: 'DELPHINE', portrait: 'portrait-delphine', text: 'Come back Tuesday.' },
    { name: 'JO', portrait: 'portrait-jo', text: "That's it?" },
    { name: 'DELPHINE', portrait: 'portrait-delphine', text: "That's *everything*, honey. Tuesday's the whole job." },
  ],
  d3: [
    { name: 'OLD SOL', portrait: 'portrait-sol', text: "Twelve coins. That's four hours of your life for a spring the size of a fingernail. Worth it?" },
    { name: 'JO', portrait: 'portrait-jo', text: '…Yes.' },
    { name: 'OLD SOL', portrait: 'portrait-sol', text: "Good answer. Wrong reason. You'll learn." },
  ],
  d4: [
    { name: 'NIA', portrait: 'portrait-nia', text: 'You rush the third bar.' },
    { name: 'JO', portrait: 'portrait-jo', text: 'Who are you?' },
    { name: 'NIA', portrait: 'portrait-nia', text: "Someone who's going to keep telling you that. Basement, Thursday. Bring the horn, not the ego." },
  ],
  d5: [
    { name: 'MARCUS', portrait: 'portrait-marcus', text: "Jo! Nia says you rush. Everybody rushes. Rushing's just wanting it too bad." },
  ],
  d6: [
    { name: 'RAY', portrait: 'portrait-ray', text: 'You played every note right.' },
    { name: 'JO', portrait: 'portrait-jo', text: '…Thank you?' },
    { name: 'RAY', portrait: 'portrait-ray', text: "Wasn't a compliment. A player piano plays every note right. You're playing *notes*, son. Play the *room*." },
    { name: 'JO', portrait: 'portrait-jo', text: "I don't know what that means." },
    { name: 'RAY', portrait: 'portrait-ray', text: 'Then stop playing until you do.' },
  ],
  d7: [
    { name: 'MARCUS', portrait: 'portrait-marcus', text: "That's it. That's the feeling. I could do this forever." },
    { name: 'NIA', portrait: 'portrait-nia', text: "You can't do it for free forever." },
    { name: 'MARCUS', portrait: 'portrait-marcus', text: '…Yeah.' },
  ],
  d8: [
    { name: 'MARCUS', portrait: 'portrait-marcus', text: 'Jo. I got the call. The warehouse job. Days, benefits. Starts Monday.' },
    { name: 'JO', portrait: 'portrait-jo', text: "We've got the festival in—" },
    { name: 'MARCUS', portrait: 'portrait-marcus', text: "You've got the festival. I've got a kid who thinks daddy's a drummer because he saw a napkin." },
    { name: 'MARCUS', portrait: 'portrait-marcus', text: "Play the room, right? Well, I *am* the room, man. I'm telling you what I need.", choices: [
      { label: '"Then go."', value: 'go' },
      { label: '"Stay one more week."', value: 'stay' },
      { label: '[say nothing]', value: 'silent' },
    ] },
  ],
  d8_go: [{ name: '', text: 'Marcus hugs him, hard, and walks into the rain.' }],
  d8_stay: [{ name: 'MARCUS', portrait: 'portrait-marcus', text: "I'll stay till the festival. Then I'm gone." }],
  d8_silent: [{ name: '', text: 'Marcus waits. And waits. Then he walks.' }],
  d9: [
    { name: 'MR. TALLY', portrait: 'portrait-tally', text: "Nine people at the Cellar. Ninety at the pavilion. Zero at the Saltbox. I count. It's what I'm for." },
    { name: 'MR. TALLY', portrait: 'portrait-tally', text: 'I book the Big Stage. Saturday. Eleven minutes, four-thirty slot, right before the headliner. Eight thousand people.' },
    { name: 'MR. TALLY', portrait: 'portrait-tally', text: "Two conditions. One: the set list is mine — crowd-pleasers, no rests, no… *silences*. Two: the bass player. She's not television. I've got a session guy.", choices: [
      { label: '"Deal."', value: 'tally' },
      { label: '"Nia plays or I don\'t."', value: 'nia' },
      { label: '"Let me think."', value: 'think' },
    ] },
  ],
  d9_nia: [{ name: 'MR. TALLY', portrait: 'portrait-tally', text: 'Four-forty-five then. After the headliner. Half the crowd will have left.' }],
  d9_think: [{ name: 'MR. TALLY', portrait: 'portrait-tally', text: 'Sure. Think till Friday.' }],
  d9_dock: [
    { name: 'MR. TALLY', portrait: 'portrait-tally', text: "It's Friday, Jo. The stage doesn't wait.", choices: [
      { label: '"Deal."', value: 'tally' },
      { label: '"Nia plays or I don\'t."', value: 'nia' },
    ] },
  ],
  d_wing_nia: [{ name: 'NIA', portrait: 'portrait-nia', text: "Rush the third bar and I'll end you." }],
  d_after: [
    { name: 'STAGEHAND', text: 'Who was that?' },
    { name: 'OTHER STAGEHAND', text: 'Dunno. Trumpet guy.' },
  ],
};

export const M_MOMENTS = {
  m1: { text: '"She\'d stayed for the second song."', sub: 'A woman with her coat on, eyes closed, still in her chair.' },
  m2: { text: '"She didn\'t have any money. She had time."', sub: 'The kid with the backpack stays through the whole phrase.' },
  m3: { text: '"Three stick figures. One had a hat."', sub: "Marcus's daughter drew the band on a napkin." },
};

// palette overlays per day: [c0, c1, color, alpha]
export const ZONES = [
  [0, 26, 0x1a1440, 0.16], // D0 night rain
  [26, 86, 0x3a2810, 0.12], // D1 amber/indigo
  [86, 151, 0x18243a, 0.2], // D2 cold blue
  [151, 211, 0x3a2410, 0.16], // D3 warm brown
  [211, 231, 0x3a2a10, 0.08], // D4 pavilion gold
  [231, 291, 0x101418, 0.34], // D4 rain-slate
  [291, 326, 0x9ab8c0, 0.1], // D5 clinical teal
  [326, 381, 0x200a2a, 0.14], // D6 stage magenta
  [381, 400, 0x3a3010, 0.1], // D7 dawn
];
