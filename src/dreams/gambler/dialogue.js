// THE LAST HAND's lines (the design: docs/redesign/advice/
// gambler_champion_critique.md). Lou Verrick's dream: seventy-eight on the
// train, a retired river gambler ground down by a thousand "one more hands";
// in the dream he is thirty, on the one night he almost did it right. His
// hands shake; he cannot sit. Jo sits in Lou's chair and Lou stands at his
// shoulder. Every name is invented. Scene conversations open on [E] or from
// a beat; barks ride the caption bar. Portraits are cut from the cast's rigs.
// Nobody here says gambling is a plan. The best night is a small one.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  lou: { name: 'LOU VERRICK', portrait: 'portrait-lq-lou', face: 'npc-lq-lou', voicePitch: 0.85 },
  pell: { name: 'MR PELL', portrait: 'portrait-lq-pell', face: 'npc-lq-pell', voicePitch: 0.95 },
  voe: { name: 'JUDGE VOE', portrait: 'portrait-lq-voe', face: 'npc-lq-voe', voicePitch: 0.65 },
  sorrel: { name: 'MADAME SORREL', portrait: 'portrait-lq-sorrel', face: 'npc-lq-sorrel', voicePitch: 1.05 },
  nico: { name: 'NICO TARN', portrait: 'portrait-lq-nico', face: 'npc-lq-nico', voicePitch: 1.2 },
  fenn: { name: 'MRS FENN', portrait: 'portrait-lq-fenn', face: 'npc-lq-fenn', voicePitch: 1.1 },
  dev: { name: 'DEV', portrait: 'portrait-lq-dev', face: 'npc-lq-dev', voicePitch: 1.25 },
  dealer: { name: 'THE DEALER', portrait: 'portrait-lq-dealer', face: 'npc-lq-dealer', voicePitch: 0.9 },
  steward: { name: 'THE STEWARD', portrait: 'portrait-lq-steward', face: 'npc-lq-steward', voicePitch: 0.9 },
  clerk: { name: 'THE CLERK', portrait: 'portrait-lq-clerk', face: 'npc-lq-clerk', voicePitch: 1 },
  porter: { name: 'A PORTER', portrait: 'portrait-lq-porter', face: 'npc-lq-porter', voicePitch: 0.7 },
  lady: { name: 'A PASSENGER', portrait: 'portrait-lq-lady', face: 'npc-lq-lady', voicePitch: 1.15 },
  pilot: { name: 'THE PILOT', portrait: 'portrait-lq-pilot', face: 'npc-lq-pilot', voicePitch: 0.75 },
};

const conv = (id, cast, nodes, extra = {}) => ({ id, channel: 'scene', camera: 'talk', cast, nodes, ...extra });
const once = (id, who, text) => conv(id, [who], { start: { who, text, end: true } }, { replayable: true });

// Lou's whispers at the table (src/dreams/gambler/table.js shows them): what
// he says for each verb, right or wrong. One hand in four his habit talks.
export const LOU_TIPS = {
  fold: 'Let it go, kid. That tell says they have it.',
  call: "See it. Nobody's showing me anything.",
  raise: 'You have them. Make them pay to look.',
  bluff: "They're scared. Push. They'll fold.",
};

export const CONVERSATIONS = {
  // ---- the quay ----
  lou_quay: conv('lou_quay', ['lou', 'jo'], {
    start: { who: 'lou', text: "You're the kid on the train. Good. Look at my hands. I can't hold a card like this.", next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: 'This is your dream?', next: 'l2' },
    l2: { who: 'lou', text: "Eighteen eighty-four. The Lantern Queen. The one night I nearly did it right. I'm thirty, look at me.", next: 'l3' },
    l3: { who: 'lou', text: "A hundred dollars, my last. You sit in my chair. I stand at your shoulder and tell you what I see.", next: 'l4' },
    l4: { who: 'lou', text: "First the slate, by the gangway. Chalk what you'll bring, where you stop, and what's enough. Before the first card.", next: 'j2' },
    j2: { who: 'jo', text: 'And if I hit the number?', next: 'l5' },
    l5: { who: 'lou', expr: 'smile', text: "Then you'd be a better man than me. Go on. Chalk it.", set: { met_lou: true }, effects: [{ objective: 'slate' }], end: true },
  }),
  lou_quay_wait: once('lou_quay_wait', 'lou', 'The slate, kid. A pro picks the exit before the entrance.'),
  lou_after_slate: once('lou_after_slate', 'lou', "Now it's chalk. It'll be on you all night. Nobody makes you look at it."),
  clerk: once('clerk', 'clerk', "Slate's for gentlemen who want to remember the evening, sir. Most of them don't."),
  porter: once('porter', 'porter', 'Cotton for Calder Bend. She sails when the purser says. Mind the line, sir.'),
  lady: once('lady', 'lady', "My husband's aboard already. He said he'd only watch. He always only watches."),
  dev_quay: once('dev_quay', 'dev', "Dev, deckhand. If you're for the card room, the guard's out back. Folk go out there to cool off. Or don't, and wish they had."),

  // ---- the saloon ----
  lou_saloon: conv('lou_saloon', ['lou', 'jo'], {
    start: { who: 'lou', text: "Faro. The dealer turns two cards a time: the bank's, then yours. Put forty on a rank and get it to eighty.", next: 'l2' },
    l2: { who: 'lou', text: "When both come the same, the bank takes half. That's the edge. It's small. It's always there.", next: 'l3' },
    l3: { who: 'lou', text: "The first couple of bets will go your way. They do. Don't let them tell you anything.", end: true },
  }, { replayable: true }),
  lou_saloon_after: once('lou_saloon_after', 'lou', 'Eighty. Now the card room. That is where I used to make my money. And lose it.'),
  steward: conv('steward', ['steward', 'jo'], {
    start: { who: 'steward', text: "Compliments of Mr Pell, sir. A whisky for a gentleman at the bank. On the house.", next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'Thank you. (take it)', next: 's_take' },
        { text: 'No, thank you.', next: 's_no' },
      ],
    },
    s_take: { who: 'steward', text: "Very good, sir. Mr Pell likes his guests comfortable.", set: { steward_asked: true }, effects: [{ beat: 'comp_drink' }], end: true },
    s_no: { who: 'steward', text: 'As you like, sir. The offer stands.', set: { steward_asked: true }, end: true },
  }),
  steward_after: once('steward_after', 'steward', 'Another, sir? No? Mr Pell will be sorry.'),
  dealer: conv('dealer', ['dealer', 'jo'], {
    start: { who: 'dealer', text: "New at the bank? The house will stake your first bet, sir. Lose it and you've lost nothing.", next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "I'll take the house's money.", next: 'd_take' },
        { text: "I'll bet my own.", next: 'd_no' },
      ],
    },
    d_take: { who: 'dealer', text: "Mr Pell's compliments. It goes in his book; it's only a courtesy.", set: { dealer_asked: true, faro_free: true }, effects: [{ beat: 'comp_stake' }], end: true },
    d_no: { who: 'dealer', text: 'Suit yourself, sir. The box is honest. Pick a card.', set: { dealer_asked: true }, end: true },
  }),
  dealer_after: once('dealer_after', 'dealer', 'Pick a card, sir. Any card. They all come out of the box the same.'),
  barman: once('barman', 'steward', "Mr Pell's whisky, sir? Ask the steward. I'm only the bar."),
  fenn: conv('fenn', ['fenn', 'jo'], {
    start: { who: 'fenn', text: "Eleven years I've ridden the Queen. I'm up tomorrow, you know. I can feel it.", next: 'j1' },
    j1: { who: 'jo', text: 'What do you play?', next: 'f2' },
    f2: { who: 'fenn', text: 'One coin. On the queen. Every night. It came once, in seventy-nine. It will again.', end: true },
  }),
  fenn_after: once('fenn_after', 'fenn', 'You doubled it? Oh, well done. Tomorrow is my night, you know.'),

  // ---- the card room ----
  lou_cards: conv('lou_cards', ['lou', 'jo'], {
    start: { who: 'lou', text: "Three tables. Take a pot from each one. Everyone shows one card, and everyone shows a tell.", next: 'l2' },
    l2: { who: 'lou', text: 'The Judge hums when he is happy, and he calls everything. Sorrel never bluffs: her little finger leaves the glass when she has something.', next: 'l3' },
    l3: { who: 'lou', text: "Nico touches his collar when he is scared. Push him then. Hands flat on the baize, he has it.", next: 'l4' },
    l4: { who: 'lou', text: "I'll whisper what I see. I'm right most of the time. Not all of it.", end: true },
  }, { replayable: true }),
  lou_tilt: once('lou_tilt', 'lou', "You're steaming, kid. I know the look. Go out on the guard and walk it off. Ten seconds. It's cheap."),
  voe_first: once('voe_first', 'voe', "Sit, sit! Lou's chair, is it? I'm a loose old fool and I hum when I'm happy. Ask anyone."),
  voe_after: once('voe_after', 'voe', "You took one off me. Good for you. My wife says I should stop at that."),
  voe_table3: once('voe_table3', 'voe', "All three of us, then. Lou's boy against the room. Deal him in."),
  sorrel: once('sorrel', 'sorrel', "I don't bluff, young man. When I bet, I have it. People never believe that."),
  nico: once('nico', 'nico', "You're not Lou. Lou's never sat out a hand in his life. Sit down, I'm hot tonight."),

  // ---- the purser's office ----
  pell_first: conv('pell_first', ['pell', 'jo'], {
    start: { who: 'pell', text: "Mr Jo, isn't it? Lou's young friend. I make it my business to know my guests.", next: 'p2' },
    p2: { who: 'pell', text: "If your line is running thin, the boat can help. A marker: fifty dollars on your word. No paper but this book.", next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'Sign for fifty.', next: 'p_sign' },
        { text: 'No, thank you.', next: 'p_no' },
      ],
    },
    p_sign: { who: 'pell', text: 'There. Quick and kind. It is settled at the landing, out of what you carry down.', set: { met_pell: true }, effects: [{ beat: 'marker' }], end: true },
    p_no: { who: 'pell', text: 'Of course. The offer stands, all night. The stairs are at the end of the corridor.', set: { met_pell: true }, end: true },
  }),
  pell_again: conv('pell_again', ['pell', 'jo'], {
    start: { who: 'pell', text: 'Another marker, Mr Jo? Fifty, on your word.', next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'Sign for fifty.', next: 'p_sign' },
        { text: 'No.', next: 'p_no' },
      ],
    },
    p_sign: { who: 'pell', text: "Signed. Mind the corridor, it's narrow tonight.", effects: [{ beat: 'marker' }], end: true },
    p_no: { who: 'pell', text: 'Very good. Up the stairs, then.', end: true },
  }, { replayable: true }),
  pell_full: once('pell_full', 'pell', "That's three, Mr Jo. The book is generous. Crake will see you to the landing."),

  // ---- the hurricane deck ----
  dev_deck: once('dev_deck', 'dev', "Escape pipes on the texas blow every few seconds. Watch the beat and go between. Hot-headed, you'll misjudge it every time."),

  // ---- the pilot house ----
  lou_pilot: once('lou_pilot', 'lou', "This is the table. I remember the lamp. I remember him sliding the deck across."),
  voe_last: once('voe_last', 'voe', "One more, Jo. The Queen docks in an hour. Kings and nines, the both of us. Your card or mine."),
  voe_stood: once('voe_stood', 'voe', 'Ha! Go on, then. I\'ll play myself one. I usually win those.'),
  pilot: once('pilot', 'pilot', "Port Merrow at six. I've seen men come up here at five with their whole lives on the table."),

  // ---- the landing ----
  lou_end: conv('lou_end', ['lou', 'jo'], {
    start: { who: 'lou', text: '…', next: 'l2' },
    l2: { who: 'lou', text: "You stood up. With the cards on the table and the lamp lit.", next: 'l3' },
    l3: { who: 'lou', text: "I'd have stayed.", next: 'l4' },
    l4: { who: 'lou', text: 'Go on, kid. Count it on the quay. It is not much. It is yours.', set: { heard_lou: true }, end: true },
  }),
  lou_end_after: once('lou_end_after', 'lou', 'Forty-eight years I said one more. Go and count it.'),
};

export const BARKS = [
  { id: 'quay_band', channel: 'caption', who: 'jo', text: 'A band, through the hull. And the river slapping at the stone.', when: { room: 'quay' }, once: true },
  { id: 'saloon_in', channel: 'caption', who: 'lou', text: "Smell that? Lamp oil and money. Stay out of the bar.", when: { room: 'saloon' }, once: true },
  { id: 'cards_in', channel: 'caption', who: 'lou', text: 'No band in here. Just the riffle. Listen to it.', when: { room: 'cards' }, once: true },
  { id: 'deck_in', channel: 'caption', who: 'jo', text: 'Cold. Grey light on the water. The night is nearly done.', when: { room: 'deck' }, once: true },
];
