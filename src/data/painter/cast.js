// THE YELLOW HOUSE — who is in it and what they say.
// Outlines are Prussian blue everywhere in this dream (spec §5.2).
export const BLUE = 0x1f3a5f;
export const VIOLET = 0x5b3a7a;

// pixel people (data/evening/sprites.js `createPersonTextures`): hat, pal, held
export const PEOPLE = {
  clerk: { hat: 'peaked', held: null, pal: { H: 0x3a4a6a, S: 0xc8a080, T: 0x3a4a6a, t: 0x2a3650, P: 0x2e3440, B: 0x1f3a5f } },
  sleeper: { hat: 'cap', held: null, pal: { H: 0x6b4e2e, S: 0xb08868, T: 0x6b5a48, t: 0x4a3e30, P: 0x4a5566, B: 0x1f3a5f } },
  roulin: { hat: 'peaked', held: 'basket', pal: { H: 0x2e4a80, h: 0xd8b858, S: 0xd8a888, T: 0x2e4a80, t: 0x1f3a5f, P: 0x2e4a80, B: 0x1f3a5f, A: 0xe8e4d8 } },
  paul: { hat: 'none', held: 'brush', pal: { H: 0xc03a2a, S: 0xd8b090, T: 0x3a5a6a, t: 0x2a4450, P: 0x3a3a44, B: 0x1f3a5f, A: 0xe8c060 } },
  rey: { hat: 'none', held: 'book', pal: { H: 0x2a2230, S: 0xe0c0a8, T: 0xe8e4d8, t: 0xc8c4b8, P: 0x3a3a44, B: 0x1f3a5f, A: 0x6b4e2e } },
  ginoux: { hat: 'bun', held: 'tray', pal: { H: 0x2a1e2a, S: 0xd8b090, T: 0x2e6a4a, t: 0x1e4a34, P: 0x2a2230, B: 0x1f3a5f, A: 0xe8e4d8 } },
  vautrin: { hat: 'fedora', held: null, pal: { H: 0x4a4a52, S: 0xd8c0a8, T: 0x4a4a52, t: 0x33333d, P: 0x3a3a44, B: 0x1f3a5f } },
  visitor: { hat: 'scarf', held: null, pal: { H: 0xc03a2a, S: 0xe0c0a8, T: 0x6a4a5a, t: 0x4a3240, P: 0x3a2e3a, B: 0x1f3a5f } },
  isak: { hat: 'none', held: 'book', pal: { H: 0x8a5a3b, S: 0xd8b090, T: 0x3a3a44, t: 0x2a2a30, P: 0x2e2e3a, B: 0x1f3a5f, A: 0xe8e4d8 } },
  gardener: { hat: 'straw', held: 'can', pal: { H: 0xd8b858, S: 0xb08868, T: 0x5a7a4a, t: 0x3e5a34, P: 0x6b4e2e, B: 0x1f3a5f, A: 0x3a7a5a } },
};

export const NAMES = {
  clerk: 'THE STATION CLERK', roulin: 'ROULIN', paul: 'PAUL', rey: 'DR. REY', ginoux: 'MADAME GINOUX', vautrin: 'M. VAUTRIN', visitor: 'A VISITOR', isak: 'ISAK',
};

const say = (who, text) => ({ name: NAMES[who] || who.toUpperCase(), portrait: `portrait-${who}`, text });
const jo = (text) => ({ name: 'JO', portrait: 'portrait-jo', text });

export const DIALOGUES = {
  d0: [say('clerk', "The yellow house? Two streets. It's the one with no curtains. Nobody's lived there since—"), say('clerk', '(he shrugs)')],
  d1: [
    say('roulin', 'Letters every week from the north. He must think you\'re a good investment.'),
    jo("He's my brother."),
    say('roulin', 'Same thing, in a good family.'),
    say('roulin', 'He sent this one mixed already. Green. Says you never get it right.'),
  ],
  d2: [say('vautrin', 'Who would hang this?')],
  d2_door: [say('vautrin', 'The door is behind you.')],
  d3: [say('ginoux', "Paint it. Pay me in the painting."), say('ginoux', "Not because it's worth anything. Because I like the lamp.")],
  d4: [
    say('paul', "Your brother wrote. I'm to share the house and cost nothing."),
    say('paul', 'I cost something.'),
    say('paul', 'Call me when you want a colour you haven\'t got. [F]. Once. Then you owe me one.'),
  ],
  d4_over: [say('paul', 'Green? A ladder? No. Red. It *launches*.'), say('paul', "See? Better. Don't sulk.")],
  d4_owe: [say('paul', 'You owe me one.')],
  d4_agree: [say('paul', '…Good. You can see it.'), say('paul', "I'll stay one more day."), say('paul', "(He didn't.)")],
  d4_disagree: [
    say('paul', "It's a *chair*. It doesn't need to be *felt*, it needs to be *sat on* —"),
    jo("It's my chair —"),
    say('paul', "— and nobody will buy it, and nobody will buy *mine* either, and at least mine is —"),
    jo('Then go.'),
    say('paul', 'The night train.'),
  ],
  d5: [say('roulin', "They're sending a doctor. Not a bad one."), say('roulin', "Go with him. I'll mind the letters.")],
  d5_yellow: [say('roulin', 'One tube. Yellow. Your brother sent it. It\'s the last thing in the bag.'), say('roulin', 'Go home, painter. Carefully.')],
  d6: [
    say('rey', "You see colour other people don't. That's not the illness."),
    say('rey', "The not-sleeping is. Paint one thing a day. I'll find you tubes."),
  ],
  d6_tree: [say('rey', 'The tree in the yard. What colour is it?'), say('rey', "Don't tell me what it *is*. Tell me what you *see*.")],
  d7: [
    say('rey', "A letter. From the north. I'll read it, your hands are—"),
    say('rey', '"The paintings are in my flat. Facing the wall, but all there."'),
    say('rey', '"He is called Jo. He has your eyes. Come north when you\'re well."'),
    say('rey', 'There\'s a tube in it. White.'),
  ],
  d8: [
    say('visitor', 'How much?'),
    say('isak', "…It isn't—"),
    say('visitor', 'How much.'),
    say('isak', '(He names a number.)'),
    say('visitor', '(She pays.)'),
  ],
  shop: [{ name: 'THE SHOPKEEPER', portrait: 'portrait-shopkeeper', text: 'Pigments are for people who pay for pigments.' }],
  farmer: [{ name: 'A FARMER', portrait: 'portrait-farmer', text: 'Off the wheat! Off it!' }],
  gendarme: [{ name: 'THE GENDARME', portrait: 'portrait-gendarme', text: 'Go home, painter.' }],
};

export const MOMENTS = {
  m1: { sub: 'The kitchen, dawn. A chair painted yellow, and a man sitting on it while the light crosses the floor.', text: '"He\'d never had a chair that was his."' },
  m2: { sub: 'Roulin, on a crate at the end of his round, in uniform, too proud to admit he likes it.', text: '"He sat for an hour and said it was for the letters."' },
  m3: { sub: 'After hours. Madame Ginoux under the one lamp, the painting propped on a chair, a drink in her hand.', text: '"She hung it where the lamp hit it."' },
  m4: { sub: 'The stone bench at dusk. Dr. Rey on the other end, not writing, for once.', text: '"The doctor didn\'t say anything either."' },
};

export const CARD_LINES = {
  sold: 'One sold.',
  enough: 'Was it enough?',
  ten: 'Ten in ten days. The wind took two. Eight went north.',
  agreed: 'He painted the chair Paul\'s way. He still thinks about his own.',
  disagreed: 'He painted the chair his way. Paul\'s was better. He\'d do it again.',
  irises: 'The irises were the point.',
};

// Isak's letters, in his hand (handwritten variant: blue ink, a slant)
export const LETTERS = {
  letter1: ['Jo —', 'Money for the month, and two tubes. Blue and red; the yellow', 'you took with you. It snowed here. The gallery sold a Dutch', 'thing to a man who wanted something for over a sofa.', 'Paint the south. Nobody here has seen it.', '— Isak'],
  letter2: ['Jo —', 'The postman says you have no furniture. Buy a chair.', 'I mixed you a green. You never get it right; too much blue.', 'There is a painter from the north with nowhere to go.', 'I told him about the house. Be kind to him; he is not kind.', '— Isak'],
  letter3: ['Jo —', 'A white. Use it for nothing. Keep it for the moment', 'you want to take something back.', '— Isak'],
};
