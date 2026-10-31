// THE LONG EVENING — the people of the town.
//
// Nobody here wants anything from Jo. Everyone has an activity, a home spot,
// a pool of idle lines (far more than one visit will hear), and — if they met
// him in a dream — a few roasts that only make sense because of it (`knows`
// names the dream; the town never roasts him for something that didn't
// happen). `greets`: greets Jo by name — only people who'd know it.
//
// look: { hat, held, kid, pal: { H hair/hat, S skin, T top, t trim, P legs, B shoes, A held } }

// Her. The spec leaves her unnamed while the cast is renamed; this is the one
// place her name lives. She is at the chess table all evening, losing on
// purpose, and at the gap in the hedge when the road opens.
export const HER = 'wren';
export const HER_NAME = 'Wren';

const P = (H, S, T, t, Pp, B, A = 0xe8e4d8) => ({ H, S, T, t, P: Pp, B, A });

export const CAST = {
  // --- the town ------------------------------------------------------------
  fereshteh: {
    name: 'Fereshteh', voice: 1.12, home: 'laundry', greets: false,
    look: { hat: 'scarf', held: 'basket', pal: P(0x7a3a5a, 0xa87858, 0xd89a4a, 0xa8743a, 0x4a3a44, 0x2a1e24, 0xc8a870) },
    idle: [
      'Wind from the sea. Good drying wind.',
      'Pegs. I had forty. Now I have thirty-one.',
      "The cats sit on the warm stones and judge my folding.",
      "My husband says line-dried sheets smell like outside. He means it as a complaint.",
      'Hold still, you. Not you. The sheet.',
      "Everything on this line has been in someone's dream.",
      "Somebody's kid drew me on the map. I'm a triangle with arms.",
      "If it rains, it rains. I'll be quick.",
      'Blue ones first. Always the blue ones first.',
      'That one was my mother\'s. Still white. Stubborn, like her.',
      'You have a laundry face. Tired, but clean.',
      "I talk to the washing. It doesn't talk back. That's the arrangement.",
    ],
  },
  bo: {
    name: 'Bo', voice: 0.95, home: 'square', greets: true, knows: 'always',
    look: { hat: 'scarf', held: 'accordion', pal: P(0x8a3a3a, 0xb08868, 0x5a4a3a, 0x40342a, 0x3a3a44, 0x1e1e28, 0xc03a2a) },
    idle: [
      'Request? I know one. I can do it sad.',
      "Tips go in the hat. There's no hat. Keep your tips.",
      'This accordion was my uncle\'s. It still hates me.',
      'Wrong note. On purpose. Jazz.',
      'Four notes. I only ever learned the first four.',
      "Hum it back to me. No — the other way.",
      "I used to play the tutorial street. Now I play wherever the light's good.",
      "The dog likes the minor keys. Won't hear a word against them.",
      "Somebody on a balcony is singing along. Badly. I love them.",
      'I tune to the fountain. The fountain is flat.',
    ],
    roast: [
      'You got famous and I *still* have the better hat.',
      'I taught him that riff. He tells it the other way. He is wrong.',
      'He plays like he\'s apologising to the trumpet.',
    ],
  },
  adaeze: {
    name: 'Adaeze', voice: 0.9, home: 'square', greets: 'astronaut', knows: 'astronaut',
    look: { hat: 'none', held: 'rope', pal: P(0xd8d4c8, 0x6a4630, 0xc03a2a, 0xf2d580, 0x2a2a34, 0x1e1e26, 0xc8a870) },
    idle: [
      'Skipping is just boxing with the fighting taken out.',
      "Slow is fine. Slow is how you get old.",
      'My knees have opinions tonight.',
      'Come as you are. Leave a bit lighter.',
      "One-two, one-two. You don't have to count. The rope counts.",
      'I closed the gym early. First time in thirty years. Felt like a crime.',
      'The pool smells of chlorine and good decisions.',
      "Breathe out on the landing. There. You're doing it.",
    ],
    roast: [
      'Three rounds. *Three.* And you told everyone it was five.',
      'You still drop your left when you\'re tired. I can see it from here.',
      'He went to space and still can\'t skip.',
    ],
  },
  marcus: {
    name: 'Marcus', voice: 0.85, home: 'school', greets: 'musician', knows: 'musician',
    look: { hat: 'cap', held: null, pal: P(0x2a2a30, 0x5a3a28, 0x4a6a8a, 0x36506a, 0x2e2e38, 0x1a1a20) },
    idle: [
      "Pedal, pedal — look up, not down. Up.",
      "She's faster than I ever was. Don't tell her I said.",
      'Warehouse is fine. Days. I see her in the daylight now.',
      'I still drum on the steering wheel. Only at red lights.',
      "She thinks I'm the best drummer alive. I've stopped correcting her.",
      'Helmet. Helmet. HELMET.',
    ],
    roast: [
      'You still owe me a napkin, man.',
      'Four-count in, Jo. You always came in on three.',
    ],
  },
  marcus_kid: {
    name: 'Joy', voice: 1.5, home: 'school', greets: false,
    look: { hat: 'bun', held: null, kid: true, pal: P(0x2a2a30, 0x5a3a28, 0xe86a8a, 0xc04a6a, 0x3a5a80, 0x2a2a32) },
    idle: ["Don't let go. Don't let go. Okay let go.", 'I did a whole street!', 'Daddy was a drummer. For real.', 'Watch. WATCH.'],
  },
  fisherman: {
    name: 'the fisherman', voice: 0.8, home: 'canal', greets: false,
    look: { hat: 'beanie', held: 'rod', pal: P(0x4a5a3a, 0xb08868, 0x6a6a52, 0x50503e, 0x3a3a34, 0x2a2a28, 0x8a6a4a) },
    // reseeded each visit: what the fisherman says is different every time
    idle: [
      'Nothing yet.',
      "Nothing. It's a good nothing, mind.",
      'Twenty-two years on this canal. Caught a boot once. Put it back.',
      "The fish know me. They're being polite.",
      "It isn't about the fish.",
      "Sit. There's a second rod. It catches the same as mine.",
      'Heron took the only one worth having. Fair enough. He was here first.',
      'If you catch something, throw it back quick, before it gets ideas.',
      'The water goes the colour of tea about now.',
      'My wife thinks I come here to fish.',
      "Shh. No. I just like saying shh.",
      "The boat's been moored there since before the boat.",
    ],
  },
  hamid: {
    name: 'Hamid', voice: 0.78, home: 'square', greets: false,
    look: { hat: 'peaked', held: null, pal: P(0x3a3a44, 0xa87858, 0x6a4a3a, 0x503828, 0x3a3a44, 0x1e1e28) },
    idle: [
      "She's losing on purpose. I can tell. I'll allow it.",
      'Forty years at this table. Won most of them. Lost the good ones.',
      "Check. No. Wait. Not check. Carry on.",
      'The bishop moves diagonally. Some of us remember that.',
      'My move? It is always my move. She is very slow.',
      'Sit, sit. Watch a master throw away a queen.',
    ],
  },
  wren: {
    name: 'Wren', voice: 1.05, home: 'square', greets: true,
    look: { hat: 'bob', held: null, pal: P(0x3a2418, 0xc09070, 0x3a6a6a, 0x2a5050, 0x3a3240, 0x201a20) },
    idle: [
      "Don't help me. I'm losing beautifully.",
      "I'm letting him win. He knows. It's a whole thing.",
      'Pawn to wherever. I stopped learning the names.',
      'He cheats, you know. Badly. I love it.',
      "You look like someone who's been busy for a very long time.",
      'Sit down before you fall down.',
      "I've been here all evening. So have you, sort of.",
      'Bishop. No, the pointy one. No — oh, whatever.',
    ],
  },
  baker: {
    name: 'the baker', voice: 0.92, home: 'square', greets: false,
    look: { hat: 'baker', held: null, pal: P(0xf2ece0, 0xc8a080, 0xf2ece0, 0xd8cfc0, 0x4a4a52, 0x2a2a30) },
    idle: [
      "Closing up. Unsold bread is just tomorrow's toast being patient.",
      "People say it's rustic. They mean hard.",
      "Door's propped. The smell does the advertising.",
      'The cats come for the smell and stay for the crumbs.',
      "I get up at four. I'll be asleep by the time you're interesting.",
      "Rye. Nobody wanted rye. Rye doesn't care.",
      'Take the tray round? The square eats for free at closing.',
    ],
  },
  kite: {
    name: 'Kite Kid', voice: 1.45, home: 'rooftops', greets: true, knows: 'always',
    look: { hat: 'tuft', held: 'string', kid: true, pal: P(0x2a2230, 0x8a5a3b, 0xf2c078, 0xc89a5a, 0x3a5a80, 0x2a2a32) },
    idle: [
      "It goes up if you run. It comes down if you stop. That's all of physics.",
      'I got it up at the station once. For like a second.',
      'The wind lives up here. You have to ask it nicely.',
      'Hold the string. No — hold it like it matters.',
      'The goat ate my last kite. The goat is not sorry.',
      "I'm not allowed on the roof. This is technically a big balcony.",
    ],
  },
  bilal: {
    name: 'Bilal', voice: 0.88, home: 'square', greets: true, knows: 'always',
    look: { hat: 'cap', held: 'tray', pal: P(0xf2e6cc, 0x9a6a48, 0x6a8a5a, 0x4e6a44, 0x3a3a44, 0x2a2a30, 0xf2d580) },
    idle: [
      'No prices. There never were. I just liked the sign.',
      'Sit. It needs a minute.',
      "Keep the change. You'll know when.",
      'Cardamom tonight. The kettle chose.',
      "Everyone's tea is different. I don't ask. I know.",
      'The station was busy. This is not busy. I like this.',
    ],
  },
  waiting_kid: {
    name: 'Noor', voice: 1.55, home: 'school', greets: false,
    look: { hat: 'bun', held: null, kid: true, pal: P(0x1e1a20, 0x6a4630, 0x50a0c0, 0x3a7a98, 0x4a3a44, 0x2a2230) },
    idle: ["Mum's late. She's always late. She's always coming.", 'Kick it here! Here!', "I'm the last one. I'm the boss of the yard.", "I can do keepie-uppies. Four. Don't watch."],
  },
  mother: {
    name: "Noor's mum", voice: 1.0, home: 'school', greets: false,
    look: { hat: 'scarf', held: null, pal: P(0x2e4a6a, 0x6a4630, 0xd8cfc0, 0xa89e90, 0x3a3a44, 0x1e1e28) },
    idle: ['Sorry, sorry — the bus.', 'Did you wait nicely?', "Thank you for— oh, you're just here. Lovely."],
  },
  sweeper: {
    name: 'the sweeper', voice: 0.82, home: 'hill', greets: true, knows: 'always',
    look: { hat: 'broom', held: 'broom', pal: P(0x3a3a44, 0x6a4630, 0x4a5a6a, 0x36444f, 0x3a3a44, 0x1e1e28, 0xb8a06a) },
    idle: [
      'They keep falling. I keep sweeping. Nobody is losing.',
      'Grab a broom. Or don\'t. The leaves won\'t notice either way.',
      "I swept the station for years. Here the floor is the whole world.",
      'A clean path is a nice thing to leave behind for an hour.',
      "Hear that? Leaves. Best sound there is, after tea.",
      "It's not a job if there's no end to it. It's a life.",
    ],
  },
  stones_kid: {
    name: 'Idris', voice: 1.5, home: 'canal', greets: false,
    look: { hat: 'tuft', held: null, kid: true, pal: P(0x14141c, 0x5a3a28, 0xe8762a, 0xb85a20, 0x2e3a52, 0x1e1e28) },
    idle: ['Flat ones. You want flat ones.', "Seven skips. I did seven. Nobody saw it but it counts.", 'Wrist, not arm. WRIST.', 'The heron is my nemesis.'],
  },
  gardener: {
    name: 'the gardener', voice: 0.9, home: 'allotments', greets: false,
    look: { hat: 'straw', held: null, pal: P(0xd8b858, 0xb08868, 0x6a7a4a, 0x4e5a36, 0x5a4a3a, 0x2a2a28) },
    idle: [
      'The courgettes are winning. They always win.',
      "Bees don't sting if you don't have an opinion about them.",
      "The scarecrow's wearing my husband's coat. He hasn't noticed it's gone.",
      "Watering can's by the shed, if you're feeling useful. Or not.",
      'Everything grows. Some things just take the evening.',
    ],
  },
  sleeper: {
    name: 'the man on the charpoy', voice: 0.7, home: 'rooftops', greets: false,
    look: { hat: 'none', held: null, pal: P(0x8a8478, 0xb09070, 0x6a6a62, 0x50504a, 0x4a4a44, 0x2a2a28) },
    idle: ['…zzz.', '…mm. five more minutes.', '…is it still evening? good.', '…zzz.'],
  },
  bike_man: {
    name: 'the bicycle man', voice: 0.86, home: 'steep', greets: false,
    look: { hat: 'cap', held: null, pal: P(0x3a3a44, 0x8a5a3b, 0x2e4a6a, 0x1e3050, 0x3a3a44, 0x1e1e28) },
    idle: ['Every bike in this town has been through my hands. And back down that hill.', "The cart? It's been about to roll for eleven years.", "Chain's fine. Chain's always fine. It's the rider.", 'Bell works. Listen. Nice, eh?'],
  },

  // --- the people from the dreams, doing ordinary things -------------------
  priya: {
    name: 'Priya', voice: 1.08, home: 'allotments', greets: 'astronaut', knows: 'astronaut', ordinary: 'reading',
    look: { hat: 'none', held: 'book', pal: P(0x1a1a20, 0x8a5a3b, 0x3a5a80, 0xf2c078, 0x2e4668, 0x22334c, 0xe8e4d8) },
    idle: ['Chapter nine. Nothing happens. It\'s wonderful.', 'I wrote in the margins of this one too. Old habit.', 'The sky is very close here. I like it at this distance.'],
    roast: ['Twelve months he made me wait. Twelve.', 'You still hum when you\'re nervous. The whole station heard it.'],
  },
  nia: {
    name: 'Nia', voice: 1.0, home: 'canal', greets: 'musician', knows: 'musician', ordinary: 'tuning',
    look: { hat: 'none', held: 'bass', pal: P(0x2a1a14, 0x6a4630, 0x6a2a4a, 0x4a1e34, 0x2a2a34, 0x1a1a20, 0x8a5a2c) },
    idle: ['E string. Always the E string.', 'I play weddings now. The bride cried. The good kind.', 'Nobody in this town rushes. Except one person.'],
    roast: ['Rushing the third bar again. In *retirement*.', 'You still count out loud. Under your breath. I can hear it.'],
  },
  delphine: {
    name: 'Delphine', voice: 1.1, home: 'laundry', greets: 'musician', knows: 'musician', ordinary: 'watering',
    look: { hat: 'bun', held: 'can', pal: P(0xc8a070, 0xd8a888, 0x8a9a5a, 0x6a7a44, 0x4a4a52, 0x2a2a30, 0x6a8a9a) },
    idle: ['Geraniums. They forgive everything.', 'I drove two hours once. Worth it. Don\'t tell anyone.'],
    roast: ['He asked me if nine people was good.', 'Two hours I drove. He played eleven minutes.'],
  },
  ray: {
    name: 'Ray', voice: 0.8, home: 'steep', greets: 'musician', knows: 'musician', ordinary: 'step',
    look: { hat: 'cap', held: null, pal: P(0x2a2a30, 0x5a3a28, 0x6a5a4a, 0x4a3e32, 0x3a3a44, 0x1e1e28) },
    // Ray never says a word. He smiles at whatever roast lands. That's his bit.
    silent: true,
    idle: [],
  },
  marguerite: {
    name: 'Marguerite', voice: 1.02, home: 'square', greets: 'chef', knows: 'chef', ordinary: 'shelling',
    look: { hat: 'bun', held: null, pal: P(0x8a8a90, 0xd8b090, 0x2a2a34, 0xf2ece0, 0x2a2a34, 0x1a1a20) },
    idle: ['Peas. I shell peas now. For fun. Imagine.', 'Nobody here sends anything back. It\'s unnerving.'],
    roast: ['He plated a soufflé with a gloved hand. I still think about it.', 'Salt the water, Jo. I\'m not saying it twice. I\'m saying it forever.'],
  },
  bastien: {
    name: 'Bastien', voice: 1.15, home: 'canal', greets: 'chef', knows: 'chef', ordinary: 'washing',
    look: { hat: 'none', held: 'brush', pal: P(0x6a4a2a, 0xc8a080, 0xe8e4d8, 0xb8b4a8, 0x3a3a44, 0x1e1e28, 0x8a6a4a) },
    idle: ['This step was filthy. Now it is a step.', "I still sing when I scrub. Nobody's asked me to stop. Yet."],
    roast: ['He sings worse than me. Nobody believes me. It\'s true.'],
  },
};

// the rare wedding party (§8): extras, drawn from these palettes
export const EXTRAS = [
  { hat: 'none', pal: P(0x2a2a30, 0xc8a080, 0xf2ece0, 0xd8cfc0, 0x2a2a34, 0x1a1a20) },
  { hat: 'veil', pal: P(0xf2ece0, 0x8a5a3b, 0xf2ece0, 0xe8e0d0, 0xf2ece0, 0xd8cfc0) },
  { hat: 'cap', pal: P(0x4a3a2a, 0x6a4630, 0x2e3a52, 0x1f2a3c, 0x2a2a34, 0x1a1a20) },
  { hat: 'scarf', pal: P(0xc03a2a, 0xa87858, 0xd89a4a, 0xa8743a, 0x4a3a44, 0x2a1e24) },
  { hat: 'none', pal: P(0x3a2418, 0xb08868, 0x6a8a5a, 0x4e6a44, 0x3a3a44, 0x2a2a30) },
];

// who needs what (A4.8): drop one of these near one of them and, a few
// minutes later, they pick it up and it turns up in their idle
export const NEEDS = {
  loaf: ['fisherman', 'sleeper', 'sweeper', 'waiting_kid'],
  ball: ['waiting_kid', 'stones_kid', 'kite', 'marcus_kid'],
  can: ['gardener', 'delphine'],
  stick: ['sweeper'],
  basket: ['fereshteh'],
  kite: ['kite'],
  tray: ['baker'],
};
