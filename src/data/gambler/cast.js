// THE LAST HAND — who is in it and what they say. Placeholders per the spec.

// pixel people (data/evening/sprites.js `createPersonTextures`): hat, pal, held
export const PEOPLE = {
  favour: { hat: 'none', held: null, pal: { H: 0x1a1a22, S: 0xd8b8a0, T: 0x1c1c26, t: 0x101016, P: 0x1c1c26, B: 0x0e0e14, A: 0xe9b84a } },
  lou: { hat: 'none', held: null, pal: { H: 0x8a8a90, S: 0x6a4630, T: 0x3a2a3a, t: 0x241a26, P: 0x22222c, B: 0x14141a, A: 0xe9b84a } },
  dede: { hat: 'bun', held: 'tray', pal: { H: 0x2a1a1a, S: 0xc09070, T: 0x6e1e2c, t: 0x4a1220, P: 0x1e1e28, B: 0x14141a, A: 0xd8d0c0 } },
  sal: { hat: 'none', held: null, pal: { H: 0xd8d0c0, S: 0xc8a888, T: 0x8a6a3a, t: 0x5a4628, P: 0x5a5a62, B: 0x3a2a1e, A: 0xe8e4d8 } },
  security: { hat: 'cap', held: null, pal: { H: 0x1e1e2a, S: 0x9a6a48, T: 0x2a2a36, t: 0x1a1a22, P: 0x22222c, B: 0x14141a } },
  waiter: { hat: 'none', held: 'tray', pal: { H: 0x1a1a20, S: 0xb08868, T: 0xe8e4d8, t: 0xb8b4a8, P: 0x1e1e28, B: 0x14141a, A: 0xe9b84a } },
  pianist: { hat: 'none', held: null, pal: { H: 0x3a2a20, S: 0x8a5a3b, T: 0x2a2230, t: 0x1a1620, P: 0x22222c, B: 0x14141a } },
  dealer: { hat: 'none', held: null, pal: { H: 0x4a3a2a, S: 0xc09070, T: 0x3a4a3a, t: 0x263226, P: 0x22222c, B: 0x14141a } },
  collector: { hat: 'fedora', held: null, pal: { H: 0x2a2a30, S: 0xb08868, T: 0x4a4a56, t: 0x32323c, P: 0x2e2e38, B: 0x14141a } },
  widow: { hat: 'veil', held: null, pal: { H: 0x1a1a20, S: 0xe0c0a8, T: 0x1a1a20, t: 0x101014, P: 0x1a1a20, B: 0x0e0e14 } },
  kid: { hat: 'cap', held: null, pal: { H: 0xd5443c, S: 0xc8a080, T: 0x88b8d8, t: 0x5a7a90, P: 0x3a3a44, B: 0xe8e4d8 } },
  accountant: { hat: 'none', held: null, pal: { H: 0x6a6a72, S: 0xd8b8a0, T: 0x8a8a96, t: 0x5a5a66, P: 0x4a4a56, B: 0x1e1e28 } },
};

export const NAMES = {
  favour: 'MR. FAVOUR',
  lou: 'LOU',
  dede: 'DEDE',
  sal: 'SAL',
  security: 'FLOOR SECURITY',
  collector: 'THE COLLECTOR',
  pawn: 'THE PAWN WINDOW',
  cashier: 'THE CASHIER',
  dealer: 'THE DEALER',
  widow: 'THE WIDOW',
  kid: 'THE KID',
  accountant: 'THE ACCOUNTANT',
  gate: '…',
};

const say = (who, text) => ({ name: NAMES[who] || who.toUpperCase(), portrait: who === 'gate' ? undefined : `portrait-${who}`, text });
const jo = (text) => ({ name: 'JO', portrait: 'portrait-jo', text });

export const DIALOGUES = {
  d0: [say('security', 'Chip?'), jo('…One.'), say('security', "Then you're a guest. Welcome home.")],
  d0b: [say('security', 'Door game, sir. Higher or lower, three in a row. The deck is on the counter. Nobody reads it.')],
  d1: [say('dede', 'Cash it. Nobody does. Cash it.')],
  d2: [say('lou', "Sir. The table's always open. That's the problem with it.")],
  lou_open: [say('lou', 'Sir. Six hands. I stand on seventeen, ties go to the house, it says so on the felt.'), say('lou', 'Three of six takes the lounge ticket. Watch the shoe. Watch me, if you like.')],
  d3: [
    say('favour', 'Jo. Of course. Let me take your coat —'),
    { ...say('favour', "— and the horn, you won't need it up here. I'll keep it safe."), choices: [{ label: 'Hand it over', value: 'hand' }, { label: 'Keep it', value: 'keep' }] },
  ],
  d3_hand: [say('favour', 'Perfect. It will be right here when you want it.'), say('favour', 'Everything is comped tonight, sir. Everything.')],
  d3_keep: [say('favour', 'Of course. A man and his instrument.'), say('favour', "Only — the lounge is a quiet room, sir. The boys don't like noise. Everything is comped. Enjoy.")],
  favour_game: [say('favour', 'The high-roller room, sir? A small game first. Memory. Six pairs, eight turns.'), say('favour', 'I never touch the cards. Well. Hardly ever.')],
  favour_again: [say('favour', 'Again? Of course.')],
  favour_key: [say('favour', 'The key, sir. The lift is past the billiards room. Mind the boys.')],
  d4: [say('collector', 'Light tonight, sir? Ten. No paperwork.')],
  marker_more: [say('collector', 'Another ten, sir? The first one hasn\'t gone anywhere.')],
  d5: [say('pawn', "Horn's worth twenty. Twenty-five with the case."), say('pawn', 'Door takes twenty-five, sir. Chips, a marker, or the horn. Your choice is my favourite part.')],
  d5_ticket: [say('pawn', "A cloakroom ticket. For a horn. Mr. Favour's stock, is it? Twenty-five. Same as the horn.")],
  lou_vent: [say('lou', "Sir, I'd go.")],
  poker_open: [say('kid', 'Trumpet guy! Sit down, sit down. Nobody here bluffs, honest.'), say('widow', 'He bluffs.'), say('accountant', 'Ante is one. The horn is in the pot already, I believe.')],
  bust: [say('collector', 'A word outside, sir.')],
  d6: [say('cashier', "Cash it. I'll say it once more. Cash it.")],
  d6_marker: [say('cashier', 'Marker comes off the top, sir. House rule. Then whatever is left is yours.')],
  d7: [
    say('sal', "Ah, you're the trumpet guy. Lou told me. You up or down?"),
    jo('Down.'),
    say('sal', "Everybody's down, son. I've been down since 'eighty-seven. I come for the coffee and the carpet."),
    { ...say('sal', 'You want the chip?'), choices: [{ label: 'Keep it.', value: 'keep' }, { label: '…Yeah.', value: 'take' }] },
  ],
  d7_take: [say('sal', "There you go. Go on, then. Bus is mine anyway.")],
  d7_keep: [say('sal', "Suit yourself. One more for me, then.")],
  d8: [say('favour', 'One hand. For everything — the marker, the horn, the night. Sit.')],
  stood: [say('favour', "Suit yourself. Lost and found's past the booth.")],
  bet: [say('favour', 'Marker, then? Of course.')],
  count: [say('gate', 'One.'), say('gate', 'Two.'), say('gate', 'Three.'), say('gate', 'Four. Five. Six.'), say('gate', 'Keep going, sir. I can count for both of us.')],
};

export const MOMENTS = {
  m1: { sub: 'The staff corridor. Dede on a crate, shoes off, rubbing her feet, laughing at something on her phone.', text: '"Twenty years of carpet."' },
  m2: { sub: 'The piano bar at three in the morning. He plays alone, and then not alone.', text: '"He wasn\'t playing for the room either."' },
  m3: { sub: 'A side room. Sal, one chip, a small pair. "There we go," to nobody. The next chip goes in.', text: '"He\'d been winning like that for thirty-nine years."' },
};

export const CARD_LINES = {
  stood_up: 'He left with the horn and nothing else. It was the most he\'d had all night.',
  took_marker: 'He left with everything. Somebody\'s still counting it.',
  sal_took: "Sal walked home. He didn't mind.",
  sal_kept: 'Sal played one more. He hit a pair.',
};

// Lou's note, in the box
export const LOU_NOTE = 'Told you. — L.';
