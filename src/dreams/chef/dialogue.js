// FIVE-STAR DREAM's lines (docs/dream_chef.md). Marguerite's dream: forty years
// on she shells peas on a square where nobody sends anything back; in the
// dream it is October 1957, the night the Carnet comes to Le Rêve, and she is
// the second de cuisine who has never once been told "good". Jo is the stage.
// Every name is invented. Portraits are cut from the cast's rigs.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  marguerite: { name: 'MARGUERITE', portrait: 'portrait-rv-marguerite', face: 'npc-rv-marguerite', voicePitch: 1.02 },
  aurelio: { name: 'CHEF AURELIO', portrait: 'portrait-rv-aurelio', face: 'npc-rv-aurelio', voicePitch: 0.72 },
  tube: { name: 'THE SPEAKING TUBE', portrait: 'portrait-rv-aurelio', face: 'npc-rv-aurelio', voicePitch: 0.72 },
  bastien: { name: 'BASTIEN', portrait: 'portrait-rv-bastien', face: 'npc-rv-bastien', voicePitch: 1.2 },
  tome: { name: 'TOME', portrait: 'portrait-rv-tome', face: 'npc-rv-tome', voicePitch: 1.05 },
  luc: { name: 'LUC', portrait: 'portrait-rv-luc', face: 'npc-rv-luc', voicePitch: 1.15 },
  brann: { name: 'BRANN', portrait: 'portrait-rv-brann', face: 'foe-sous-chef', voicePitch: 0.85 },
};

const conv = (id, cast, nodes, extra = {}) => ({ id, channel: 'scene', camera: 'talk', cast, nodes, ...extra });

export const CONVERSATIONS = {
  door: conv('door', ['marguerite', 'jo'], {
    start: { who: 'marguerite', text: "You're the new stage? Good. We're drowning.", next: 'b' },
    b: { who: 'marguerite', text: "Madame Lisle is in tonight, from the Carnet. One table, one plate, and she can close us. Chef wants his saffron risotto on her table the moment she sits.", next: 'c' },
    c: { who: 'jo', text: 'What do I do?', next: 'd' },
    d: { who: 'marguerite', text: 'What the rail says. Every ticket, every stop, in order. The pit first. Earn an apron and I might learn your name.', next: 'e' },
    e: { who: 'marguerite', text: "And whatever you hear on the tube: Chef never says 'good'. Don't wait for it.", set: { met_m: true }, effects: [{ objective: 'pit' }], end: true },
  }),
  bastien: conv('bastien', ['bastien', 'jo'], {
    start: { who: 'bastien', text: 'New stage! Plates to the rack, coppers on the hooks. The rail tells you which. I just wash.', next: 'b' },
    b: { who: 'bastien', text: 'Mind the floor by the sink. That is not a warning, that is a promise.', end: true },
  }),
  bastien_after: conv('bastien_after', ['bastien'], {
    start: { who: 'bastien', text: 'An apron! Nobody ever comes back down here once they have an apron. You could, though.', end: true },
  }),
  apron: conv('apron', ['marguerite', 'jo'], {
    start: { who: 'marguerite', text: 'Clean rail. Here. Put it on.', next: 'b' },
    b: { who: 'marguerite', text: "It's got a pocket. Anything for Chef goes in the pocket. Your hands are for plates.", next: 'c' },
    c: { who: 'marguerite', text: "That's the tube. He'll want something. He always wants something.", set: { apron: true }, end: true },
  }),
  tome: conv('tome', ['tome', 'jo'], {
    start: { who: 'tome', text: 'Doors at half past seven. Look at the clock, then look at the rail. You will not finish.', next: 'b' },
    b: { who: 'jo', text: 'Which one first?', next: 'c' },
    c: { who: 'tome', text: 'Everyone orders the bass when the Carnet is in the room. Everyone wants to be seen eating what she eats. So: the fish. Then the shallots, for the sauce. Herbs if you are lucky.', next: 'd' },
    d: { who: 'tome', text: 'What you shelve here is what the line has at the rush. The rest you will haul up yourself, in front of everyone.', end: true },
  }),
  tome_after: conv('tome_after', ['tome'], {
    start: { who: 'tome', text: 'Go on, the line is calling. It has been calling since 1931.', end: true },
  }),
  m_line: conv('m_line', ['marguerite'], {
    start: { who: 'marguerite', text: 'Read the rail, not the room. And salt the water. I am not saying it twice. I am saying it forever.', end: true },
  }),
  finish: conv('finish', ['jo', 'aurelio'], {
    start: { who: 'jo', text: "The risotto's up. Chef's gold is in the tin. The plate is mine for about ten seconds.", next: 'pick' },
    pick: {
      who: 'jo',
      text: 'What goes on it?',
      choices: [
        { text: 'The gold, dead centre. As on the menu.', next: 'menu' },
        { text: "Tomé's onions under the rice. Then the gold.", next: 'own', if: 'onions' },
        { text: 'Nothing. Let the saffron speak.', next: 'plain' },
      ],
    },
    menu: { who: 'jo', text: 'One leaf. It takes the breath of a whole room to lay it flat.', set: { finish: 'menu' }, end: true },
    own: { who: 'jo', text: 'A spoon of the staff pot, dark and sweet, where nobody will see it. Then the gold on top.', set: { finish: 'own' }, end: true },
    plain: { who: 'jo', text: 'He is watching. Jo closes the tin.', set: { finish: 'plain' }, end: true },
  }),
  take_it: conv('take_it', ['marguerite', 'jo'], {
    // (a node whose `if` fails is skipped to its `next`)
    start: { who: 'marguerite', text: "You didn't ask him. It took me eleven years to stop asking.", if: '!asked', next: 'b' },
    b: { who: 'marguerite', text: 'You asked. Everyone asks once.', if: 'asked', next: 'c' },
    c: { who: 'marguerite', text: 'The runner is gone. Nobody else is going out there. It is your plate.', next: 'd' },
    d: { who: 'marguerite', text: 'Table one. Through the door, the far end. Walk. You do not run in that room.', set: { carry_out: true }, end: true },
  }),
};

// Aurelio reads Jo's hands: built from the run (src/engines/tickets.js readHands)
export function handsConversation(lines, finish) {
  const nodes = { start: { who: 'aurelio', text: 'Stage. Hands.', next: 'r0' } };
  lines.forEach((text, i) => {
    nodes[`r${i}`] = { who: 'aurelio', text, next: i === lines.length - 1 ? 'verdict' : `r${i + 1}` };
  });
  const said = {
    menu: "The risotto. The saffron. The gold. It's... correct.",
    own: "The risotto. The saffron. Onion, from the staff pot, under my gold. ... It's correct.",
    plain: "The risotto. The saffron. No gold. ... It's correct.",
  };
  nodes.verdict = {
    who: 'aurelio',
    text: said[finish] || said.menu,
    choices: [
      { text: 'Is it good?', next: 'asked', set: { asked: true } },
      { text: '(Say nothing.)', next: 'silent' },
    ],
  };
  nodes.asked = { who: 'jo', text: 'Is it good?', next: 'next' };
  nodes.silent = { who: 'aurelio', text: '...', next: 'next' };
  nodes.next = { who: 'aurelio', text: '...Next.', end: true };
  return conv('hands_read', ['aurelio', 'jo'], nodes, { replayable: true });
}

export const BARKS = [
  { id: 'luc_warn', channel: 'caption', who: 'marguerite', text: 'Luc runs the aisle. When he says behind, you hop or you wear it.', when: { room: 'line', near: 'npc:marguerite_line', r: 260 }, once: true },
];

// the rail's voices (the rail verb says these)
export const CALLS = {
  next: ['Next.', 'Next.', 'Next.', '...Next.', 'Next.'],
  clean: ['Next.', 'Hm. Next.', 'Next.'],
  refire: (t) => `Refire, table ${t}!`,
  bail: (t) => `I've got table ${t}. Go.`,
  order: (t, d) => `Table ${t}, ${d.toLowerCase()}!`,
  spill: 'On the floor. Again.',
  sitting: { 1: 'First sitting. Doors are open.', 2: 'Second sitting. They are all here.', 3: "Third sitting. Don't look up." },
};
