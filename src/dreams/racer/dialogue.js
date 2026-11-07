// THE LONG STRAIGHT's lines (docs/dream_racer.md). Ottavia's dream: at seventy-one
// she still tells people an engine is a quarter-tone flat; here it is 1958, she is
// twenty-two, and the car is hers for one season. Every name is invented. Nobody is
// a villain and nobody is hurt on screen: the Harbour Night Cup is told here
// afterwards, briefly, by people who each think it was somebody else's fault.
//
// (Only the Roche boy blocks, on the road: nothing here says otherwise. The life between
// the races is told here, in the order a player walks it: the seat, the Heron, the loss,
// the tin, the paper, the sheet, the letter, whose car, the chalk, the wall, the Coppa.)
import { PRICES, softPrice, PAPERS } from './season.js';

export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  ottavia: { name: 'OTTAVIA', short: 'O', color: '#7ec8c8', portrait: 'portrait-pv-ottavia', face: 'npc-pv-ottavia', voicePitch: 1.1 },
  aldo: { name: 'ALDO', portrait: 'portrait-pv-aldo', face: 'npc-pv-aldo', voicePitch: 0.78 },
  tullio: { name: 'TULLIO', portrait: 'portrait-pv-tullio', face: 'npc-pv-tullio', voicePitch: 0.7 },
  nino: { name: 'NINO', portrait: 'portrait-pv-nino', face: 'npc-pv-nino', voicePitch: 1.3 },
  sable: { name: 'MR SABLE', portrait: 'portrait-pv-sable', face: 'npc-pv-sable', voicePitch: 0.9 },
  signora: { name: 'SIGNORA CASTELLANE', portrait: 'portrait-pv-signora', face: 'npc-pv-signora', voicePitch: 0.92 },
  rosa: { name: 'ROSA', portrait: 'portrait-pv-rosa', face: 'npc-pv-rosa', voicePitch: 1.05 },
  beppe: { name: 'BEPPE', portrait: 'portrait-pv-beppe', face: 'npc-pv-beppe', voicePitch: 0.72 },
  pia: { name: 'PIA', portrait: 'portrait-pv-pia', face: 'npc-pv-pia', voicePitch: 1.45 },
  gino: { name: 'GINO', portrait: 'portrait-pv-gino', face: 'npc-pv-gino', voicePitch: 1.4 },
  teo: { name: 'TEO BRASCA', portrait: 'portrait-pv-teo', face: 'npc-pv-teo', voicePitch: 0.85 },
  dante: { name: 'DANTE MIR', portrait: 'portrait-pv-dante', face: 'npc-pv-dante', voicePitch: 1.05 },
  cassian: { name: 'CASSIAN ROCHE', portrait: 'portrait-pv-cassian', face: 'npc-pv-cassian', voicePitch: 1 },
  agnese: { name: 'SISTER AGNESE', portrait: 'portrait-pv-agnese', face: 'npc-pv-agnese', voicePitch: 1.05 },
};

const conv = (id, cast, nodes, extra = {}) => ({ id, channel: 'scene', camera: 'talk', cast, nodes, ...extra });
const once = (id, who, text, extra = {}) => conv(id, [who], { start: { who, text, end: true } }, { replayable: true, ...extra });
// one person, one line, by how far along the season is: latest flag first, [null, text] last
const byStage = (id, who, rows) => {
  const nodes = {};
  rows.forEach(([flag, text], i) => {
    nodes[i ? `s${i}` : 'start'] = { who, text, end: true, ...(flag ? { if: flag, else: `s${i + 1}` } : null) };
  });
  return conv(id, [who], nodes, { replayable: true });
};

export const CONVERSATIONS = {
  ottavia_first: conv('ottavia_first', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: "You're the one who plays by ear. Good. Aldo says you can drive. I say we find out if you can hear.", next: 'b' },
    b: { who: 'ottavia', text: 'The carburettor is on the bench. Hold the screw and it turns. You will hear her beat against your note, and you will see it in the fumes.', next: 'c' },
    c: { who: 'ottavia', text: 'When the beat stops, let go. Not before. Too far and she floods.', next: 'd' },
    d: { who: 'jo', text: 'And if I just drive her?', next: 'e' },
    e: { who: 'ottavia', text: 'Then she runs hot, and you find out how hot in front of everyone.', set: { met_ottavia: true }, end: true },
  }),
  ottavia_after: once('ottavia_after', 'ottavia', "There. She's at the shutter. Don't lift."),
  ottavia_quiet: once('ottavia_quiet', 'ottavia', 'Not now. The bench is yours, and the rack. Leave me this.'),
  // the choice: the one new set in the building
  aldo_first: conv('aldo_first', ['aldo', 'jo'], {
    start: { who: 'aldo', text: 'A stranger with good hands is all this garage can afford. Ottavia will tell you the rest. She tells everyone.', next: 'b' },
    b: { who: 'aldo', text: 'I did Pinewood in thirty-four, in that car, the year my knees worked. Beat it and there is a seat. Miss it and there is soup at the Castellanes.', next: 'c' },
    c: { who: 'jo', text: 'Can she really hear it?', next: 'd' },
    d: { who: 'aldo', text: 'I cannot tell one note from another. She tells me when the car is unhappy, and I say thank you. It is most of what I know.', end: true },
  }, { replayable: true }),
  aldo_tyres: conv('aldo_tyres', ['aldo', 'jo', 'ottavia'], {
    start: { who: 'aldo', text: 'Under my time, stranger, in my second car. So the seat is yours, and the Heron with it. Sit, before you fall over.', next: 'b' },
    b: { who: 'aldo', text: 'There is one new set of tyres in this building. Soft. I paid for them out of next month.', next: 'c' },
    c: { who: 'aldo', text: 'The Harbour Cup is on Saturday, at night. They go on your Heron. You are young and you will use them.', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "I'll take them.", next: 'keep', set: { kept_tyres: true, tyre_soft: true } },
        { text: 'They go on your car, Aldo.', next: 'give', set: { gave_tyres: true } },
      ],
    },
    keep: { who: 'aldo', text: "Good. Don't thank me, thank the bank. They don't know yet.", next: 'flat' },
    give: { who: 'aldo', text: 'You are a fool. Tullio! Put them on mine, before he thinks about it.', next: 'flat' },
    flat: { who: 'ottavia', text: 'Your car is a hair flat tonight, Aldo. It will keep till the morning.', next: 'end' },
    end: { who: 'aldo', text: 'Everything keeps till the morning. Come down to the sea wall, stranger. I am there every day. It is the only appointment I keep.', set: { tyres_settled: true }, end: true },
  }),
  aldo_settled: once('aldo_settled', 'aldo', 'Saturday. Stay in my air along the quay, then do as you like. And leave my gloves on the cowl. I know where they are.'),
  // the sea wall: the one thing he has to teach, and it comes back at the door of the ward
  aldo_wall: conv('aldo_wall', ['aldo', 'jo'], {
    start: { who: 'aldo', text: 'Thirty years, every morning. So. What is the tide doing, stranger?', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'Coming in.', next: 'right' },
        { text: 'Going out.', next: 'wrong' },
        { text: "I don't know.", next: 'good' },
      ],
    },
    right: { who: 'aldo', text: 'It is. You looked, or you guessed. Either is more than the bank does.', next: 'salt' },
    wrong: { who: 'aldo', text: 'Coming in. The third step, the weed is wet. Look, next time. It costs nothing.', next: 'salt' },
    good: { who: 'aldo', text: 'Good. Nobody does until they look. The third step, the weed is wet. Coming in.', next: 'salt' },
    salt: { who: 'aldo', text: 'When it is in there is salt on the quay road. A length sooner on the brake, and you will never know what it saved you.', next: 'beppe' },
    beppe: { who: 'aldo', text: 'That is all I have learned in thirty years, and I had it from Beppe. Go on. Saturday, and do not look at the water.', set: { tide_asked: true }, end: true },
  }),
  aldo_wall_again: once('aldo_wall_again', 'aldo', 'Still coming in. It does not need the two of us. Go and tune something.'),
  harbour_eve: conv('harbour_eve', ['tullio', 'aldo'], {    start: { if: 'gave_tyres', who: 'tullio', text: 'The new set is on him. You are on last year\'s. Do not be brave.', next: 'a', else: 'kept' },
    kept: { who: 'tullio', text: 'The new set is on you. His are old. He says they will do. He says that about everything.', next: 'a' },
    a: { who: 'aldo', text: 'Tide is in by nine, stranger. A length sooner. And thank you. I forgot to say. It is most of what I know.', end: true },
  }),
  nino_sweep: once('nino_sweep', 'nino', 'Signorina Ottavia says I sweep flat too. I did not know you could.'),
  nino_seat: once('nino_seat', 'nino', 'You are the first driver who has not walked through my pile. I told Tullio. He said wait.'),
  nino_salt: once('nino_salt', 'nino', 'A man at the cafe asked me what you are like. Nobody has asked me what anyone is like.'),
  nino_coppa: once('nino_coppa', 'nino', 'The Signorina has started sweeping. At night. I do not know what it means. I leave her the good broom.'),
  nino_pit: conv('nino_pit', ['nino'], {
    start: { who: 'nino', text: 'I went up. I did not want to. Sister let me as far as the door.', next: 'b' },
    b: { who: 'nino', text: 'He said they can go on the chair at the wall, where somebody will see them. He asked what the tide was doing. I said coming in. I do not know. I said it.', end: true },
  }, { replayable: true }),
  nino_after: conv('nino_after', ['nino'], {
    start: { if: 'gave_tyres', who: 'nino', text: 'They have put his car under the sheet. Your tyres are still on it. I swept round it.', end: true, else: 'kept' },
    kept: { who: 'nino', text: 'They have put his car under the sheet. His old tyres are still on it. I swept round it.', end: true },
  }, { replayable: true }),
  tullio_tyre: once('tullio_tyre', 'tullio', 'Out there the Roche boy covers his mirror better than he drives. The others just race you. Remember which is which.'),
  tullio_seat: once('tullio_seat', 'tullio', 'A seat. Aldo has given away a seat he cannot pay for. He has done it before, and I am still here, so.'),
  tullio_sable: once('tullio_sable', 'tullio', 'Sable has paid for a compressor, and a young man called Mir. He comes on race days, in a clean shirt, and says thank you. I do not know what to do with him.'),
  tullio_salt: conv('tullio_salt', ['tullio'], {
    start: { if: 'tyres_short', who: 'tullio', text: 'On the sheet, on those tyres. I have seen worse. From here, I have not seen better.', end: true, else: 'b' },
    b: { who: 'tullio', text: 'On the sheet. Nobody has written Pereval on a sheet since the winter. I went and looked at it twice.', end: true },
  }, { replayable: true }),
  tullio_pit: conv('tullio_pit', ['tullio'], {
    start: { if: 'sable_lien', who: 'tullio', text: 'Sable has been asking about the debts. Thirty days, he said. The Coppa is in nine. I did not say anything. There was nothing to say.', next: 'broke', else: 'box' },
    broke: { if: 'broke_orders', who: 'tullio', text: 'He started asking the morning after you went by Mir.', next: 'box' },
    box: { who: 'tullio', text: 'On the night you stop with your nose on the paint. Your nose. Mine is busy.', end: true },
  }, { replayable: true }),
  tullio_after: conv('tullio_after', ['tullio'], {
    start: { if: 'gave_tyres', who: 'tullio', text: 'Thirty years on tyres. Those were new, and I put them on him myself. I checked them twice. Ask anyone.', end: true, else: 'kept' },
    kept: { who: 'tullio', text: 'Thirty years on these tyres. Thirty years. His were old, and I checked them. Ask anyone.', end: true },
  }, { replayable: true }),
  // the morning after the Cup: Jo at the bench
  cup_morning: conv('cup_morning', ['nino', 'jo'], {
    start: { who: 'nino', text: 'They took him up the hill before it was light. They brought his things down. His gloves are on the bench, and nobody has moved them.', next: 'b' },
    b: { who: 'jo', text: 'Tail lights, at the Gull Bend. Then no tail lights. Then the dust in my lamps, and his engine stopped.', next: 'c' },
    c: { who: 'nino', text: 'He is alive. Sister says he is alive. Will you take them up? I do not want to.', end: true },
  }),
  // the corridor: put the gloves on the chair (the owner reads this before polish)
  agnese: once('agnese', 'agnese', 'Visiting was at four. Not through the ward. If you must go up, the iron stairs at the end, and quietly.'),
  agnese_up: once('agnese_up', 'agnese', 'That is all he needs tonight. Go on home.'),
  agnese_late: conv('agnese_late', ['agnese'], {
    start: { who: 'agnese', text: 'The boy came for the gloves, and I let him. Mr Pereval has asked what the Salt Road paid. I told him I am a nun.', next: 'chest' },
    chest: { if: 'chest_bad', who: 'agnese', text: 'The Castellane girl asked me what a bottle for the chest costs. Twelve. Neither of us said anything else.', end: true },
  }, { replayable: true }),
  corridor: conv('corridor', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: 'You brought them.', next: 'awake' },
    awake: { who: 'jo', text: 'Is he awake?', next: 'tide' },
    tide: { who: 'ottavia', text: 'He looks at the wall. He knows me. He asked what the tide was doing.', next: 'kept' },
    kept: { if: 'kept_tyres', who: 'ottavia', text: 'He told me to put the new set on you, and I bolted them on myself. His old ones were on his car. So.', next: 'gave' },
    gave: { if: 'gave_tyres', who: 'ottavia', text: 'He had your tyres on. Good tyres. I keep wanting it to be the tyres.', next: 'air' },
    air: { if: 'held_aldo', who: 'jo', text: 'I was in his air. I was right there.', next: 'late', else: 'back' },
    back: { who: 'jo', text: 'I was back. I saw it from back there.', next: 'late' },
    late: { who: 'jo', text: 'A car moved on him, late. Mustard. I saw it.', next: 'all' },
    all: { who: 'ottavia', text: 'Everybody saw something.', next: 'flat' },
    flat: { who: 'ottavia', text: 'I told him, the night before. A hair flat, I said, in the voice you use for the weather. It will keep, I said. And I let it.', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "You couldn't have known it mattered.", next: 'couldnt', set: { ott_couldnt: true } },
        { text: "Why didn't you say it louder?", next: 'why', set: { ott_why: true } },
        { text: 'Say nothing.', next: 'nothing', set: { ott_silent: true } },
      ],
    },
    couldnt: { who: 'ottavia', text: 'I could. It is the whole of what I can do.', next: 'chair' },
    why: { who: 'ottavia', text: 'He was tired. It was a hair. He has been kind to me.', next: 'chair' },
    nothing: { who: 'ottavia', text: 'Thank you.', next: 'chair' },
    chair: { who: 'ottavia', text: 'Put them on the chair. He will see them or he won\'t.', next: 'home' },
    home: { who: 'ottavia', text: 'Go to my mother. Aldo paid us out of the last of the tin on Friday. It is on her dresser and she won\'t touch it. Somebody has to.', set: { ward_told: true }, end: true },
  }),
  corridor_after: once('corridor_after', 'ottavia', 'Go on. I will sit a while.'),
  // the kitchen
  signora: once('signora', 'signora', 'The tin is on the dresser. Twelve. It goes in the jars, and I do not want to see you counting it twice.'),
  signora_pit: once('signora_pit', 'signora', 'I have never once come to one of these. It is very loud. Here is soup. Do not spill it on the car.'),
  signora_after: conv('signora_after', ['signora'], {
    start: { if: 'chest_bad', who: 'signora', text: 'I am sitting because I choose to sit. It is only my chest. The soup is on the stove. Get it yourself.', end: true, else: 'late' },
    late: { if: 'garage_again', who: 'signora', text: 'She comes home to sleep now, two hours. She says the engine is in the wall. There is soup.', end: true, else: 'paid' },
    paid: { if: 'rent_paid', who: 'signora', text: 'The boy with the broom put money on the table, and no note, and ran. I did not ask. There is soup.', end: true, else: 'chest' },
    chest: { if: '!med_ok', who: 'signora', text: 'Do not look at me like that. It is only my chest. There is soup.', end: true, else: 'soup' },
    soup: { who: 'signora', text: 'There is soup. There is always soup.', end: true },
  }, { replayable: true }),
  jars_said: conv('jars_said', ['signora', 'jo'], {
    start: { who: 'signora', text: 'At the cafe they say it was the money. At the harbour they say it was the boy in the black car. She says nothing. She washes her hands, and the black stays.', next: 'rent' },
    rent: { if: 'rent_ok', who: 'signora', text: 'The rent is in the jar. Good. That is one thing nobody has to say.', next: 'silent' },
    silent: { if: 'rent_short', who: 'signora', text: '…', next: 'med' },
    med: { if: 'med_short', who: 'signora', text: 'It is only my chest. It has been only my chest for years.', next: 'tyres' },
    tyres: { if: 'tyres_short', who: 'signora', text: 'And the car wants what the car wants. It can want.', next: 'end' },
    end: { who: 'signora', text: 'A man from Sable Oil left his card for the driver. It is under the clock. Oil people do not leave cards to be kind. Go on, then.', end: true },
  }),
  // Mr Sable
  sable_first: conv('sable_first', ['sable', 'jo'], {
    start: { who: 'sable', text: 'Sit, please. Pereval Corse has had a difficult spring, and Sable Oil is fond of the difficult.', next: 'b' },
    b: { who: 'sable', text: 'Three papers on the desk. Strike one clause on each, if you are a man who reads. Whatever is left standing pays on signature.', next: 'c' },
    c: { who: 'jo', text: 'And if I strike nothing?', next: 'd' },
    d: { who: 'sable', text: 'Then you are the richest young man in Calvessa until the first time you are asked to keep your word.', set: { met_sable: true }, end: true },
  }),
  sable_read: once('sable_read', 'sable', 'The papers, please. I can wait. It is most of what I do.'),
  sable_done: conv('sable_done', ['sable'], {
    start: { if: 'sable_whole', who: 'sable', text: 'Every clause. How refreshing. You will be hearing from us.', next: 'some' },
    some: { if: 'sable_struck', who: 'sable', text: 'You read them. Almost nobody reads them. Our regards to the Signorina.', next: 'mir' },
    mir: { who: 'sable', text: 'The second car will be driven by a young man of ours, Mr Mir. He is careful. Sable Oil is fond of careful.', next: 'hold' },
    hold: { if: 'sable_orders', who: 'sable', text: 'When the slate says HOLD, it means behind Mr Mir. You have initialled that.', next: 'oil' },
    oil: { if: 'oil_sable', who: 'sable', text: 'Our oil will be sent round. It is a very modern oil. Your fitter will have views.', next: 'dine' },
    dine: { if: 'sable_dinners', who: 'sable', text: 'Thursday, at eight, a clean shirt. We shall want you sitting next to someone.', end: true },
  }),
  sable_after: conv('sable_after', ['sable'], {
    start: { if: 'broke_orders', who: 'sable', text: 'Mr Mir tells me the slate was hard to read. We shall have it repainted. At your expense: a fifth of what you won.', end: true, else: 'b' },
    b: { who: 'sable', text: 'We have your name, and you have our money. Good afternoon.', end: true },
  }, { replayable: true }),
  // Teo Brasca, on the quay, on Jo's way up to Sable's
  teo_quay: conv('teo_quay', ['teo', 'jo'], {
    start: { who: 'teo', text: 'You are the one who saw.', next: 'j' },
    j: { who: 'jo', text: 'Mustard.', next: 'b' },
    b: { who: 'teo', text: 'I moved. There was a gap and I moved. It was my gap. I have gone round it every night for a month, and it is still my gap.', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'It was late.', next: 'late' },
        { text: 'Say nothing.', next: 'none' },
      ],
    },
    late: { who: 'teo', text: 'Yes.', next: 'sun' },
    none: { who: 'teo', text: 'Nobody does. They sit somewhere else.', next: 'sun' },
    sun: { who: 'teo', text: 'I will do it to you on the Salt Road. I do not know another way to drive. Watch my tyres. I never have any left by the end.', set: { teo_met: true }, end: true },
  }),
  teo_later: byStage('teo_later', 'teo', [
    ['garage_again', 'No tyres by the second lap. You know that. Everyone knows that. Buy me a drink after.'],
    [null, 'No tyres by the crossing. I told you. I tell everyone. It does not help.'],
  ]),
  // Dante Mir, in the garage, in a clean shirt, the first day he is there
  dante_first: conv('dante_first', ['dante', 'jo'], {
    start: { who: 'dante', text: 'Mir. Dante. I drive the second car. I am told you are good. I am told to say so.', next: 'seat' },
    seat: { who: 'dante', text: 'They offered me a seat here in the spring. I said no, he is still in it. Then he was not. I wanted you to hear that from me.', next: 'orders' },
    orders: { if: 'sable_orders', who: 'dante', text: 'The paper says you stay behind me. I did not write it. If you come by, come on the left. I like to know.', end: true, else: 'free' },
    free: { who: 'dante', text: 'I hold my line. It is the only thing anyone has ever said about me. Come by whenever you like.', set: { dante_met: true }, end: true },
  }),
  dante_idle: conv('dante_idle', ['dante'], {
    start: { if: 'broke_orders', who: 'dante', text: 'You came by. On the left. Thank you. Mr Sable has spoken to me about my mirrors.', end: true, else: 'held' },
    held: { if: 'done_race3', who: 'dante', text: 'You could have come by. I would not have said anything. I want you to know that I noticed.', end: true, else: 'b' },
    b: { who: 'dante', text: 'I am to stand here until someone tells me where the good spanner is. Nobody has.', end: true },
  }, { replayable: true }),
  // Cassian Roche, on the Gull road, the night before: they have one talk, and then the Bend
  cassian_gull: conv('cassian_gull', ['cassian', 'jo'], {
    start: { who: 'cassian', text: 'You chalk your own. I have a man for that. He is at dinner.', next: 'kept' },
    kept: { if: 'roche_kept', who: 'cassian', text: 'You kept my letter. The tyres are not a bribe. It is what we do when we like somebody.', next: 'rail', else: 'burnt' },
    burnt: { if: 'roche_burnt', who: 'cassian', text: 'You burnt my letter. Nobody has burnt one before. I have been thinking about it all week.', next: 'rail' },
    rail: { who: 'cassian', text: 'I was on the rail at the Harbour, with a drink. I saw the lamps go. I put the drink down. I would like that written somewhere.', next: 'ask' },
    ask: { who: 'jo', text: 'Would you stop?', next: 'no' },
    no: { who: 'cassian', text: 'At the Coppa? Nobody stops at the Coppa. It is what the purse is for.', next: 'new' },
    new: { who: 'cassian', text: 'New everything, every race. If something goes, I will not hear it coming. That is what your fitter is for. I do not have one.', next: 'end' },
    end: { who: 'cassian', text: 'Do not lift for me. I would not lift for you.', set: { cassian_met: true }, end: true },
  }),
  cassian_after: once('cassian_after', 'cassian', 'My man will be finished with the soup by now. Go on. It is your chalk.'),
  // the quay's own people: nobody, then a nod, then the whole street
  rosa: byStage('rosa', 'rosa', [
    ['garage_again', 'I have sold your coffee nine times today, to people who have never met you. Sit by the door. Be seen.'],
    ['done_race3', 'That table is yours, if you want it. Third is a table. Second is a table with a cloth.'],
    ['done_race2', 'This one is on the house. Do not say anything.'],
    ['done_race1', 'You are the new one of Aldo\'s. Coffee is still for customers.'],
    [null, 'Coffee is for customers.'],
  ]),
  beppe: byStage('beppe', 'beppe', [
    ['garage_again', 'Coming in, all night. Nobody asked. I am telling you anyway.'],
    ['done_race3', 'You were at the third step this morning. I saw. Going out, if you want it. You did not need me.'],
    ['done_race2', 'Thirty years he has asked me the tide. It has been a week. I keep looking up.'],
    ['done_race1', 'He asked you, then? He asks everyone. He has never once been told anything he did not know.'],
    [null, 'Mind the net. Aldo comes down at seven. You could set the clock by him, and she does.'],
  ]),
  pia: byStage('pia', 'pia', [
    ['garage_again', 'Are you going to win? Say yes. I have bet a button.'],
    ['done_race3', 'Write your name on the can. Not there. That is where the goal is.'],
    ['done_race2', 'My mother says I am not to ask you. So I am not asking.'],
    ['done_race1', 'Are you the driver? The real one is the old one.'],
    [null, 'You are standing in my goal.'],
  ]),
  gino: once('gino', 'gino', 'She bet my button.'),
  // the morning of the Salt Road: everything the kitchen and the desk decided, in one breath at the shutter
  salt_eve: conv('salt_eve', ['ottavia'], {
    start: { if: 'tyres_short', who: 'ottavia', text: 'Those are the tyres the jar paid for. You know what the jar paid.', next: 'rent', else: 'good' },
    good: { who: 'ottavia', text: 'Good rubber on her, and I fitted it. Do not make me go home and say what it cost.', next: 'rent' },
    rent: { if: 'rent_short', who: 'ottavia', text: 'My mother is short on the rent and has not said a word. Third pays eight. I am only telling you what third pays.', next: 'chest', else: 'sheet' },
    sheet: { who: 'ottavia', text: 'Top three go on the sheet, and the sheet pays. Fourth pays nothing, and nobody writes it down.', next: 'chest' },
    chest: { if: '!med_ok', who: 'ottavia', text: 'She coughed till four. It is only her chest. I am told. I was up, is all I am saying.', next: 'oil' },
    oil: { if: 'oil_sable', who: 'ottavia', text: "And that is Sable's oil in her now. Thin. She will run hot by the end, and there is nothing on my bench for that.", next: 'end' },
    end: { who: 'ottavia', text: 'The Roche boy is on pole. You have not met. Go and meet him.', end: true },
  }),
  // back from the Salt Road: he has been noticed
  roche_letter: conv('roche_letter', ['nino', 'jo'], {
    start: { who: 'nino', text: 'A boy in a black coat brought this, for the driver. He would not come in. He looked at the ceiling.', next: 'read' },
    read: { who: 'jo', text: 'Black and gold paper. "A works seat with Roche Motori, next season. New tyres every race. A wage, paid on the day. Reply before the Coppa. C. Roche."', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'Into the stove.', next: 'burnt', set: { roche_burnt: true } },
        { text: 'Into my pocket.', next: 'kept', set: { roche_kept: true } },
      ],
    },
    burnt: { who: 'nino', text: 'That was good paper. She wants you, at the bench. I would go now.', set: { letter_read: true }, end: true },
    kept: { who: 'nino', text: 'I did not see it. I sweep. She wants you, at the bench. I would go now.', set: { letter_read: true }, end: true },
  }),
  // the garage again: the corridor pays off, and whose car it is
  ottavia_again: conv('ottavia_again', ['ottavia', 'jo'], {
    start: { if: 'ott_couldnt', who: 'ottavia', text: "You told me I couldn't have known. It was kind. I have been angry with you for a month.", next: 'why' },
    why: { if: 'ott_why', who: 'ottavia', text: 'You asked me why I did not say it louder. I have a better answer now. I was afraid of being wrong in front of him.', next: 'nothing' },
    nothing: { if: 'ott_silent', who: 'ottavia', text: 'You said nothing, on the stairs. I have been grateful to you, in a bad temper.', next: 'orders' },
    orders: { if: 'broke_orders', who: 'ottavia', text: 'You went by Mir with HOLD on the board. Sable will have his fifth out of that, and I would do it again in your place. Do not tell him.', next: 'letter', else: 'held' },
    held: { if: 'sable_orders', who: 'ottavia', text: 'You held behind Mir, on a paper with your name on it. You did as you signed. I am not sure that is a compliment.', next: 'letter' },
    letter: { if: 'roche_kept', who: 'ottavia', text: 'And there is black and gold paper in your pocket, and four tyres in black paper by my shutter. They came an hour after. I have not touched them.', next: 'whose', else: 'stove' },
    stove: { if: 'roche_burnt', who: 'ottavia', text: 'And my stove smells of good paper. I did not ask you to do that.', next: 'whose' },
    whose: { who: 'ottavia', text: 'He will not drive again. So tell me. Whose car is that, at the shutter?', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "Aldo's.", next: 'a', set: { car_for: 'aldo', car_aldo: true } },
        { text: 'Yours.', next: 'o', set: { car_for: 'ottavia', car_ottavia: true } },
        { text: 'Mine, for now.', next: 'j', set: { car_for: 'jo' } },
      ],
    },
    a: { who: 'ottavia', text: 'Then drive her as if he could hear you.', next: 'end' },
    o: { who: 'ottavia', text: "Nobody has said that. Don't say it again. Drive.", next: 'end' },
    j: { who: 'ottavia', text: 'Good. Then I know who to blame.', next: 'end' },
    end: { who: 'ottavia', text: 'She is a hair flat, by the way. Not today. I have fixed it. I said so, out loud, to you.', next: 'nine' },
    nine: { who: 'ottavia', text: 'The Coppa is in nine days. Walk the Gull road, on foot. Then go and let Tullio shout at you in the pit lane.', set: { garage_again: true }, end: true },
  }),
  ottavia_ready: conv('ottavia_ready', ['ottavia'], {
    start: { if: 'race_coppa_tries', who: 'ottavia', text: 'I heard where you lifted. So did you. She is at the shutter.', end: true, else: 'walk' },
    walk: { who: 'ottavia', text: 'Walk the road. Drill the stop. Then I will look at you.', end: true },
  }, { replayable: true }),
  // the night of the Coppa, at the shutter
  coppa_eve: conv('coppa_eve', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: 'Eight rows of people out there, and not one of them has ever asked me about an engine.', next: 'rubber' },
    rubber: { if: 'roche_fitted', who: 'ottavia', text: "That is Roche's rubber under you. It grips the same as anyone's. I checked. I wanted it not to.", next: 'lien' },
    lien: { if: 'sable_lien', who: 'ottavia', text: "Sable's thirty days run out whatever you do tonight. The Coppa's purse would cover them. I am only saying.", next: 'doubt' },
    doubt: { who: 'jo', text: 'What if I lift at the Bend?', next: 'hear' },
    hear: { who: 'ottavia', text: 'Then I will hear it, and I will say so, out loud, to you.', next: 'aldo' },
    aldo: { if: 'car_aldo', who: 'ottavia', text: 'You told me whose car that is. Somebody has left a window open up the hill. Drive her as if.', end: true, else: 'hers' },
    hers: { if: 'car_ottavia', who: 'ottavia', text: 'You said a thing to me about whose car that is. I have not repeated it. Bring her back.', end: true, else: 'his' },
    his: { who: 'ottavia', text: 'Yours, you said, for now. It is now. Go on.', end: true },
  }),
  // home with the Coppa: what it cost, out loud, and then the note
  coppa_home: conv('coppa_home', ['tullio', 'nino', 'ottavia', 'jo'], {
    start: { who: 'tullio', text: 'Wheel, wheel, fuel, flag. I am going to sit on this tyre now, and nobody is to speak to me.', next: 'cup' },
    cup: { who: 'nino', text: 'They let me hold the cup. It is lighter than a broom. I gave it back.', next: 'tyres' },
    tyres: { if: 'kept_tyres', who: 'ottavia', text: 'You started this on the set Aldo paid for out of next month. Next month came.', next: 'rent', else: 'gave' },
    gave: { who: 'ottavia', text: 'You gave him the one new set in this building, and bought your own later, and said nothing. I noticed. I notice everything. It is the whole of what I can do.', next: 'rent' },
    rent: { if: 'rent_paid', who: 'ottavia', text: 'My mother says the rent was late. She says it as if she had not noticed.', next: 'mum' },
    mum: { if: 'med_ok', who: 'ottavia', text: 'She came to the wall. With soup. Forty years, and she has never once come. She says it is very loud.', next: 'purse', else: 'window' },
    window: { who: 'ottavia', text: 'She listened from the window. It is only her chest. She says you lifted at the hairpin. She has never heard an engine in her life.', next: 'purse' },
    purse: { if: 'sable_lien', who: 'ottavia', text: "The purse goes to Sable on Monday, all of it, for the thirty days. So we keep the building. That is what winning buys. A building.", next: 'letter', else: 'bank' },
    bank: { who: 'ottavia', text: 'The purse goes to the bank on Monday. They will not know what to do. Neither will I.', next: 'letter' },
    letter: { if: 'roche_kept', who: 'jo', text: 'I still have the letter.', next: 'lett2', else: 'note' },
    lett2: { who: 'ottavia', text: 'I know. It is good paper. Keep it. You will want to know, when you are old, that somebody asked.', next: 'note' },
    note: { who: 'ottavia', text: 'You heard it, at the line. All those years, and the one time she is dead on it is in front of people looking at you.', next: 'stand' },
    stand: { who: 'ottavia', text: 'Go and stand by her. She is still ringing. Then wash, and go up the hill. He will ask you what the tide is doing. Look first.', set: { coppa_home: true }, end: true },
  }),
  ottavia_won: once('ottavia_won', 'ottavia', 'Go and stand by her. It will not ring for long, and nobody else can hear it.'),
};

export const BARKS = [
  { id: 'jo_quay', channel: 'caption', who: 'jo', text: 'Stone, salt and a telegraph line. The road is the only straight thing here.', when: { room: 'quay', unless: 'done_race1' } }, // (once; the street's own word takes over)
  // the street, by how far along he is: nobody knows him, then they do
  { id: 'q_nod', channel: 'caption', who: 'beppe', text: 'That is him, then. Aldo\'s stranger.', when: { near: 'npc:beppe', r: 150, flag: 'done_race1', unless: 'done_race2' } },
  { id: 'q_cup', channel: 'caption', who: 'jo', text: 'At the cafe they say it was the money. At the harbour, the boy in the black car. They stop when I go by.', when: { room: 'quay', flag: 'done_race2', unless: 'jars_done' } },
  { id: 'q_third', channel: 'caption', who: 'rosa', text: 'Third! Pereval Corse, third! Sit down, you are letting the flies in.', when: { near: 'npc:rosa', r: 170, flag: 'done_race3', unless: 'garage_again' } },
  { id: 'q_kids', channel: 'caption', who: 'pia', text: 'Him! That is him! Gino, that is HIM!', when: { near: 'npc:pia', r: 200, flag: 'garage_again', unless: 'done_coppa' } },
  { id: 'q_coppa', channel: 'caption', who: 'jo', text: 'Bunting on the wires, and my face on a poster, more or less. They have given me a better chin.', when: { room: 'quay', flag: 'garage_again', unless: 'done_coppa' } },
  { id: 'jo_night', channel: 'caption', who: 'jo', text: 'Slower on foot. There is more of it, on foot.', when: { room: 'nightbefore' } },
];

// the rack: what a soft set costs today (the kitchen's jar is off the price)
export function rackConversation(F, nuts) {
  // (nobody buys the one new set out from under Aldo's offer)
  if (!F.tyres_settled) return once('rack', 'ottavia', "That set is Aldo's. Drive her first, then ask him.");
  const price = softPrice(F);
  const jar = F.jar_tyres ? ` The tyre jar has paid ${PRICES.soft - price} of that.` : '';
  // (a set that went round the Harbour and a short jar is no new set: Sable's money can buy another)
  const fresh = F.tyre_soft && !F.tyres_short;
  const roche = F.roche_kept && !F.roche_fitted;
  if (fresh && !roche) return once('rack', 'ottavia', F.kept_tyres ? 'The soft set is on her. Aldo paid. Look after them.' : 'The soft set is on her. They stay nearer new as they wear. They will not make her any faster. Nothing on that rack will.');
  const canBuy = !fresh && nuts >= price;
  return conv('rack', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: fresh ? 'The set on her will do. Roche\'s are by the shutter, in their black paper. They will not make her any faster either.' : `A soft set, ${price} brass nuts.${jar} They stay nearer new as they wear. They will not make her any faster.`, next: 'pick' },
    pick: {
      who: 'jo',
      text: `I have ${nuts} nuts.`,
      choices: [
        ...(canBuy ? [{ text: `Buy the soft set: ${price} nuts`, next: 'bought', effects: [{ call: 'buy', item: 'soft', price }] }] : []),
        // (what a kept letter does: a free set, in black paper, and a line in the ending)
        ...(roche ? [{ text: "Fit Roche's set: no charge", next: 'roche', effects: [{ call: 'buy', item: 'roche', price: 0 }] }] : []),
        { text: canBuy || fresh || roche ? 'Not today.' : 'I am short. Not today.', next: 'no' },
      ],
    },
    bought: { who: 'ottavia', text: 'I will fit them. Mind your straw: even these only forgive so much.', end: true },
    roche: { who: 'ottavia', text: 'I will fit them. I will wash my hands after.', end: true },
    no: { who: 'ottavia', text: 'They will still be too dear tomorrow.', end: true },
  }, { replayable: true });
}

// the bench, once she is in tune: Ottavia's chalk
export function benchConversation(F, nuts) {
  if (F.buy_chalk) return once('bench', 'ottavia', 'Your chalk is on the road, at every braking point. It stays. Now leave my bench alone.');
  return conv('bench', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: `My chalk, ${PRICES.chalk} brass nuts. A mark at every braking point, for good. It will not stop the car for you.`, next: 'pick' },
    pick: {
      who: 'jo',
      text: `I have ${nuts} nuts.`,
      choices: [
        ...(nuts >= PRICES.chalk ? [{ text: `Buy the chalk: ${PRICES.chalk} nuts`, next: 'bought', effects: [{ call: 'buy', item: 'chalk', price: PRICES.chalk }] }] : []),
        { text: nuts >= PRICES.chalk ? 'Not today.' : 'I am short. Not today.', next: 'no' },
      ],
    },
    bought: { who: 'ottavia', text: 'Nino will walk it for you before every start. He will complain.', end: true },
    no: { who: 'ottavia', text: 'Then you can find them with your foot, like everyone else.', end: true },
  }, { replayable: true });
}

// a paper on Mr Sable's desk: strike one clause, or sign it as it stands
export function paperConversation(p) {
  return conv(`paper_${p.id}`, ['jo'], {
    start: {
      who: 'jo',
      text: 'Strike which?',
      choices: [
        { text: `Strike: ${p.a.short}`, set: { [`strike_${p.id}`]: 'a' }, end: true },
        { text: `Strike: ${p.b.short}`, set: { [`strike_${p.id}`]: 'b' }, end: true },
        { text: 'Initial it as it stands', set: { [`strike_${p.id}`]: 'none' }, end: true },
      ],
    },
  }, { replayable: true });
}
for (const p of PAPERS) CONVERSATIONS[`paper_${p.id}`] = paperConversation(p);
