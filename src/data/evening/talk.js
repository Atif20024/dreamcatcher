// THE LONG EVENING — what the town says to itself.
//
// Rules for the writing (Addendum A §A3): short lines, overlapping,
// unfinished sentences, callbacks to earlier lines in the same visit, no
// exposition, nobody explains the theme, and nobody thanks Jo for anything he
// did in a dream. A line of '~' is a laugh (an animation and a synth breath,
// never text). `after` makes a conversation a callback: it only happens once
// the named one has been heard this visit.

export const CONVERSATIONS = [
  { id: 'bishop', lines: [['A', "You've moved that bishop four times."], ['B', "It's thinking."], ['A', "It's a bishop."], ['B', '~']] },
  { id: 'bread', lines: [['A', 'Is this… bread?'], ['B', "It's *rustic*."], ['A', "It's a brick with ambitions."], ['*', '~']] },
  { id: 'bo_songs', lines: [['A', 'He knows three songs.'], ['B', 'He knows one song three ways.'], ['A', '~'], ['B', 'Four, on a good night.']] },
  { id: 'nephew', lines: [['A', 'My nephew wants to be an astronaut.'], ['B', 'Tell him to bring a coat.'], ['A', '…why?'], ['B', 'Just a feeling.']] },
  { id: 'rain_smell', lines: [['A', 'Smells like rain.'], ['B', 'It always smells like rain to you.'], ['A', "And I'm always—"], ['B', 'Once. You were right once.'], ['*', '~']] },
  { id: 'goat', lines: [['A', 'Whose goat is that.'], ['B', 'I thought it was yours.'], ['A', '…'], ['B', 'Nobody asks the goat.'], ['*', '~']] },
  { id: 'goat2', after: 'goat', lines: [['A', "The goat's moved."], ['B', "It hasn't."], ['A', "It's on a different roof."], ['B', "…it's on a different roof."]] },
  { id: 'sunset', lines: [['A', "Has the sun moved at all?"], ['B', 'Not since I was young.'], ['A', "You're not old."], ['B', "Exactly. It hasn't moved."]] },
  { id: 'dinner', lines: [['A', 'What are you making tonight?'], ['B', 'Something with lentils.'], ['A', 'You always say lentils.'], ['B', 'I always make lentils.'], ['A', '~']] },
  { id: 'cat_names', lines: [['A', "That cat's called Pasha."], ['B', 'That cat is called Biscuit.'], ['A', 'It answers to Pasha.'], ['B', "It answers to the fridge."], ['*', '~']] },
  { id: 'bike', lines: [['A', 'The cart rolled again.'], ['B', 'It wandered.'], ['A', 'Carts do not wander.'], ['B', 'This one has a restless soul.']] },
  { id: 'fountain', lines: [['A', 'Someone drew a flower on the fountain.'], ['B', 'Over the scratches?'], ['A', 'Mm.'], ['B', 'Good.']] },
  { id: 'lost_key', lines: [['A', "I can't find my keys."], ['B', 'Nobody locks anything here.'], ['A', "That's not the point. They're MY keys."], ['B', '~']] },
  { id: 'hats', lines: [['A', 'Nice hat.'], ['B', "It's my father's."], ['A', 'Nice father.'], ['B', 'He was all right.']] },
  { id: 'singing', lines: [['A', 'Who is that singing?'], ['B', 'Third floor. Every evening.'], ['A', "They're not good."], ['B', "No. Isn't it great."]] },
  { id: 'sea', lines: [['A', 'I put my feet in the sea today.'], ['B', 'Was it cold?'], ['A', "It's always the exact right temperature."], ['B', "That's suspicious."], ['A', "It's lovely, is what it is."]] },
  { id: 'kite', lines: [['A', "The kid's been at that kite all evening."], ['B', "It'll go up."], ['A', 'When?'], ['B', "When it's ready. Kites know."]] },
  { id: 'nothing', lines: [['A', 'Did you hear about—'], ['B', 'Yes.'], ['A', "I didn't finish."], ['B', "I heard about it anyway."], ['*', '~']] },
  { id: 'tea', lines: [['A', "Bilal won't take money."], ['B', 'I left some under the cup.'], ['A', 'He found it?'], ['B', 'He left it under my door.'], ['*', '~']] },
  { id: 'weather2', after: 'rain_smell', lines: [['A', 'Still smells like rain.'], ['B', "Don't."], ['A', "I'm just saying."]] },
  { id: 'leaves', lines: [['A', "Where do the leaves even come from?"], ['B', 'Trees.'], ['A', 'There are four trees.'], ['B', 'Busy trees.'], ['A', '~']] },
  { id: 'map', lines: [['A', "The kid's drawing a map of town."], ['B', 'Am I on it?'], ['A', "You're a circle with a hat."], ['B', 'Accurate.']] },
  { id: 'dog', lines: [['A', 'How old is that dog?'], ['B', 'Older than the square.'], ['A', "The square's four hundred years old."], ['B', 'Good dog.']] },
  { id: 'bo_again', after: 'bo_songs', lines: [['A', 'He played the fourth one.'], ['B', 'The good one?'], ['A', 'The fourth one.'], ['*', '~']] },
];

// Roasts addressed to Jo when he's near someone who knows him (cast.js).
// Jo answers with a reaction, never a line (REACTIONS below).
export const REACTIONS = ['grin', 'shrug', 'eye_roll', 'toot', 'laugh'];

// The four group scenes (§A3.3): slots filled by whoever is there. Sitting
// down in one is how you join it.
export const GROUP_SCENES = {
  bakery_step: {
    place: 'square',
    lines: [
      [1, 'So the cart rolls all the way down the steep street—'],
      [2, "It didn't roll. It *wandered*."],
      [3, 'It was a Tuesday.'],
      [1, 'It was — fine. Tuesday. And it hits the fountain—'],
      [4, 'The bench.'],
      [1, 'THE BENCH. And the goat is in it—'],
      [5, 'There was no goat.'],
      ['*', '~'],
      [1, "There's always a goat."],
      [3, "It wasn't Tuesday."],
      ['*', '~'],
    ],
  },
  chess: {
    place: 'square',
    loop: true,
    lines: [
      [1, 'Your move.'],
      [2, 'I moved.'],
      [1, 'That was a sneeze.'],
      [2, 'It was a gambit.'],
      [3, 'He always does the horse thing.'],
      [1, 'Knight.'],
      [3, 'The horse thing.'],
      ['*', '~'],
      [2, "Check. No. Wait—"],
      [1, 'Not check.'],
      [2, 'Not check. Carry on.'],
    ],
  },
  rooftop_rainbow: {
    place: 'rooftops',
    lines: [
      [1, 'Look at that.'],
      [2, 'Two of them.'],
      [3, 'Somebody bring tea.'],
      [4, 'Somebody brought tea.'],
      [5, "What's that? The dance. What's that you're doing."],
      [2, "It's called the— it's the—"],
      [5, "It's called sit down."],
      ['*', '~'],
      [1, 'Leave him. He\'s having a lovely time.'],
    ],
  },
  snowman: {
    place: 'school',
    lines: [
      [1, "Its head's crooked."],
      [2, "It's *thinking*."],
      [3, 'About what?'],
      [2, 'About being a snowman.'],
      ['*', '~'],
      [4, 'Nobody fix it.'],
      [5, 'Nobody was going to fix it.'],
      [1, '…I was a bit going to fix it.'],
      ['*', '~'],
    ],
  },
};

// A4.2 — everyone's dinner: an ordinary thing on the way in
export const EXIT_LINES = [
  "That's me. Something's on.",
  'Dinner. Back in a bit.',
  "If I don't go in, she'll come out. Worse.",
  'Lentils.',
  'Right. Inside.',
  "I'll leave the window open.",
  'See you after.',
  'Something smells burnt. Probably mine.',
];

// §4 — sit and, after 8 s, something happens nearby. Per place, drawn at
// random; the scene knows how to stage each id.
export const SIT_EVENTS = {
  meadow: ['leaf_hat', 'swallows', 'wind_grass', 'sea_glint'],
  arch: ['ivy_bird', 'leaf_hat', 'cat_arrives', 'bell'],
  orchard: ['apple_falls', 'leaf_hat', 'swing_creaks', 'cat_arrives'],
  laundry: ['shutter_opens', 'cat_arrives', 'someone_sings', 'sheet_billows'],
  square: ['pigeons_land', 'someone_sings', 'dog_sighs', 'fountain_glint', 'bike_bell'],
  canal: ['heron_takes_off', 'fish_rises', 'boat_creaks', 'someone_sings'],
  steep: ['cart_creaks', 'bike_bell', 'shutter_opens', 'cat_arrives'],
  rooftops: ['pigeons_land', 'goat_bleats', 'radio_plays', 'leaf_hat'],
  school: ['swing_moves', 'ball_rolls', 'bell', 'cat_arrives'],
  allotments: ['bee_visits', 'scarecrow_leans', 'leaf_hat', 'radio_plays'],
  hill: ['whole_town', 'leaf_hat', 'bell', 'swallows'],
  station: ['board_clacks', 'moths', 'leaf_hat', 'cat_arrives'],
  hedge: ['moths', 'owl_calls', 'leaf_hat'],
  orchard_road: ['apple_falls', 'swallows', 'leaf_hat'],
  fields: ['swallows', 'wind_grass', 'tractor_ticks'],
  lake: ['fish_rises', 'frogs', 'boat_creaks'],
  first_stars: ['star_appears', 'fireflies', 'frogs'],
  foothills: ['sheep_bell', 'fire_pops', 'owl_calls'],
  pines: ['owl_calls', 'snow_drops', 'breath'],
  stream: ['deer_look', 'ice_creaks', 'breath'],
  switchbacks: ['wind_grass', 'breath', 'town_lights'],
  treeline: ['aurora_flare', 'breath'],
  ridge: ['aurora_flare', 'shooting_star'],
};

export const SIT_EVENT_LINES = {
  someone_sings: ['(third floor, badly: la-la-laaa…)', '(someone, somewhere, humming the middle bit)'],
  radio_plays: ['(a radio two streets over, too far to hear properly)'],
  bell: ['(a bell, a long way off)'],
  goat_bleats: ['(the goat, about nothing)'],
  dog_sighs: ['(the dog sighs the way only old dogs sigh)'],
  frogs: ['(frogs, starting up one at a time)'],
  owl_calls: ['(an owl, asking something)'],
  sheep_bell: ['(sheep bells, somewhere below)'],
  breath: ['(your breath, visible now)'],
  ice_creaks: ['(the ice, settling)'],
  tractor_ticks: ['(the tractor ticking as it cools)'],
  cart_creaks: ['(the cart creaks. it stays.)'],
  boat_creaks: ['(the boat, against its rope)'],
  swing_creaks: ['(the rope swing, moving on its own)'],
};

// --- the road: her ---------------------------------------------------------
export const HER_LINES = {
  hedge_greet: ["Took your time.", 'Thought you might.', 'Finished being useful?'],
  hedge_alone: ['…suit yourself.'],
  // the long walk: about nothing, in fragments, with long silences between
  walk: [
    "Do you ever think about how bread is just wet flour that got warm.",
    "Don't answer that.",
    'My grandmother said you can hear snow. You can\'t. She lied about a lot of things. Good things.',
    'I lost on purpose, by the way. The chess. You noticed.',
    "You walk like you're late for something. You're not.",
    'Left here. No. Right. There is only one road.',
    "I'm not cold. I'm just holding my coat very tightly.",
    'When I was small I thought the hill was the edge of the world.',
    "It isn't. Obviously. It's the edge of the town.",
    'Say something. — No, that was plenty.',
    "I don't know where it goes. That's sort of the point of a road.",
    'Your hat is doing a thing. Leave it. It\'s good.',
  ],
  // gated roasts (she's heard the stories; the town talks)
  roast: {
    chef: ['I heard about the soufflé. The whole square heard about the soufflé.'],
    musician: ['Nine people. I asked Delphine. She said nine, and one was her.'],
    astronaut: ['Twelve months, Priya said. She said it like it was twelve years.'],
  },
  point: {
    first_star: 'There. First one. Make a wish or don\'t, I\'m not your mother.',
    owl: "Owl. Don't look. It's shy.",
    moon: 'Oh. Hello.',
    deer: 'Stand still.',
    aurora: 'look.',
    constellation: "That's the Plough.",
    constellation_insist: "It's the Plough. I've decided.",
    lake: "It's got the whole sky in it. Show-off.",
    town: 'Look how small it is. All of it. Everyone.',
  },
  caught_up: ["You could've — waited. I'm fine. I'm fine.", 'Long legs. Congratulations.', "I'm not out of breath. This is how I breathe."],
  call_out: ['Hey—', 'HEY.', 'Jo!'],
  stones: ['Bet you a tea.', 'Seven. Pay up.'],
  snowball: ["Oh, you're dead.", 'I win. I always win this. Ask anyone.'],
  back_to_town: ["Forgot something? Fine. I'll come."],
};

// the last cards (§7 and §B6) — the counts are filled in by the scene
export const CARDS = {
  station: ['You caught {N} dreams.', 'You noticed {M} small things.', "This one you didn't have to catch."],
  station_last: 'Stay as long as you like.',
  ridge: ['You caught {N} dreams.', 'You noticed {M} small things.', 'You walked {D} kilometres tonight.'],
  ridge_last: ['Nobody was watching.', 'It counted anyway.'],
  alone: 'You walked it alone. It still counted.',
  horn: "You left the horn on a bench. Somebody's playing it.",
  all_moments: 'You were paying attention the whole time.',
};
