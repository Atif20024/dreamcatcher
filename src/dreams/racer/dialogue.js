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
  agnese: { name: 'SISTER AGNESE', portrait: 'portrait-pv-agnese', face: 'npc-pv-agnese', voicePitch: 1.05 },
};

const conv = (id, cast, nodes, extra = {}) => ({ id, channel: 'scene', camera: 'talk', cast, nodes, ...extra });
const once = (id, who, text, extra = {}) => conv(id, [who], { start: { who, text, end: true } }, { replayable: true, ...extra });

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
  aldo_first: once('aldo_first', 'aldo', 'A stranger with good hands is all this garage can afford. Ottavia will tell you the rest. She tells everyone.'),
  aldo_tyres: conv('aldo_tyres', ['aldo', 'jo', 'ottavia'], {
    start: { who: 'aldo', text: 'Under my time, in my second car. So the seat is yours, and the Heron with it. Sit, before you fall over.', next: 'b' },
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
    end: { who: 'aldo', text: 'Everything keeps till the morning.', set: { tyres_settled: true }, end: true },
  }),
  aldo_settled: once('aldo_settled', 'aldo', 'Saturday. Stay in my air along the quay, then do as you like. And leave my gloves on the cowl. I know where they are.'),
  harbour_eve: conv('harbour_eve', ['tullio', 'ottavia'], {
    start: { if: 'gave_tyres', who: 'tullio', text: 'The new set is on him. You are on last year\'s. Do not be brave.', next: 'o', else: 'kept' },
    kept: { who: 'tullio', text: 'The new set is on you. His are old. He says they will do. He says that about everything.', next: 'o' },
    o: { who: 'ottavia', text: 'A quay at night, and no straw where you want it. Follow the cream car. That is the whole of the job.', end: true },
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
  agnese_late: once('agnese_late', 'agnese', 'The boy came for the gloves, and I let him. Mr Pereval has asked what the Salt Road paid. I told him I am a nun.'),
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
  signora_after: conv('signora_after', ['signora'], {
    start: { if: 'garage_again', who: 'signora', text: 'She comes home to sleep now, two hours. She says the engine is in the wall. There is soup.', end: true, else: 'paid' },
    paid: { if: 'rent_paid', who: 'signora', text: 'The boy with the broom put money on the table, and no note, and ran. I did not ask. There is soup.', end: true, else: 'chest' },
    chest: { if: 'med_short', who: 'signora', text: 'Do not look at me like that. It is only my chest. There is soup.', end: true, else: 'soup' },
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
  // the morning of the Salt Road: everything the kitchen and the desk decided, in one breath at the shutter
  salt_eve: conv('salt_eve', ['ottavia'], {
    start: { if: 'tyres_short', who: 'ottavia', text: 'Those are the tyres the jar paid for. You know what the jar paid.', next: 'rent', else: 'good' },
    good: { who: 'ottavia', text: 'Good rubber on her, and I fitted it. Do not make me go home and say what it cost.', next: 'rent' },
    rent: { if: 'rent_short', who: 'ottavia', text: 'My mother is short on the rent and has not said a word. Third pays eight. I am only telling you what third pays.', next: 'chest', else: 'sheet' },
    sheet: { who: 'ottavia', text: 'Top three go on the sheet, and the sheet pays. Fourth pays nothing, and nobody writes it down.', next: 'chest' },
    chest: { if: 'med_short', who: 'ottavia', text: 'She coughed till four. It is only her chest. I am told.', next: 'oil' },
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
    burnt: { who: 'nino', text: 'That was good paper.', next: 'end' },
    kept: { who: 'nino', text: 'I did not see it. I see nothing. I sweep.', next: 'end' },
    end: { who: 'nino', text: 'She wants you. At the bench. I would go now.', set: { letter_read: true }, end: true },
  }),
  // the garage again: the corridor pays off, and whose car it is
  ottavia_again: conv('ottavia_again', ['ottavia', 'jo'], {
    start: { if: 'ott_couldnt', who: 'ottavia', text: "You told me I couldn't have known. It was kind. I have been angry with you for a month.", next: 'why' },
    why: { if: 'ott_why', who: 'ottavia', text: 'You asked me why I did not say it louder. I have a better answer now. I was afraid of being wrong in front of him.', next: 'nothing' },
    nothing: { if: 'ott_silent', who: 'ottavia', text: 'You said nothing, on the stairs. I have been grateful to you, in a bad temper.', next: 'orders' },
    orders: { if: 'broke_orders', who: 'ottavia', text: 'You went by Mir with HOLD on the board. Sable will have his fifth out of that, and I would do it again in your place. Do not tell him.', next: 'letter', else: 'held' },
    held: { if: 'sable_orders', who: 'ottavia', text: 'You held behind Mir, on a paper with your name on it. You did as you signed. I am not sure that is a compliment.', next: 'letter' },
    letter: { if: 'roche_kept', who: 'ottavia', text: 'And there is black and gold paper in your pocket. I can read through cloth.', next: 'whose', else: 'stove' },
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
    start: { who: 'ottavia', text: 'Eight rows of people out there, and not one of them has ever asked me about an engine.', next: 'lien' },
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
    rent: { if: 'rent_paid', who: 'ottavia', text: 'My mother says the rent was late. She says it as if she had not noticed.', next: 'purse' },
    purse: { if: 'sable_lien', who: 'ottavia', text: "The purse goes to Sable on Monday, all of it, for the thirty days. So we keep the building. That is what winning buys. A building.", next: 'letter', else: 'bank' },
    bank: { who: 'ottavia', text: 'The purse goes to the bank on Monday. They will not know what to do. Neither will I.', next: 'letter' },
    letter: { if: 'roche_kept', who: 'jo', text: 'I still have the letter.', next: 'lett2', else: 'note' },
    lett2: { who: 'ottavia', text: 'I know. It is good paper. Keep it. You will want to know, when you are old, that somebody asked.', next: 'note' },
    note: { who: 'ottavia', text: 'You heard it, at the line. All those years, and the one time she is dead on it is in front of people looking at you.', next: 'stand' },
    stand: { who: 'ottavia', text: 'Go and stand by her. She is still ringing. Listen, before it stops.', set: { coppa_home: true }, end: true },
  }),
  ottavia_won: once('ottavia_won', 'ottavia', 'Go and stand by her. It will not ring for long, and nobody else can hear it.'),
};

export const BARKS = [
  { id: 'jo_quay', channel: 'caption', who: 'jo', text: 'Stone, salt and a telegraph line. The road is the only straight thing here.', when: { room: 'quay', unless: 'done_race1' } }, // (once; the street's own word takes over)
  // the street, by how far along he is: nobody knows him, then they do
  { id: 'q_seat', channel: 'caption', who: 'jo', text: 'The cafe owner asked who I was. Then he asked who was paying.', when: { room: 'quay', flag: 'done_race1', unless: 'done_race2' } },
  { id: 'q_cup', channel: 'caption', who: 'jo', text: 'At the cafe they say it was the money. At the harbour, the boy in the black car. They stop when I go by.', when: { room: 'quay', flag: 'done_race2', unless: 'jars_done' } },
  { id: 'q_teo', channel: 'caption', who: 'jo', text: 'Teo Brasca is at the end table, alone, in mustard overalls. He looked at my hands, then at his glass.', when: { room: 'quay', flag: 'jars_done', unless: 'done_race3' } },
  { id: 'q_third', channel: 'caption', who: 'jo', text: 'A boy asked me to write my name on his oil tin. Nobody has asked before. I spelled it carefully.', when: { room: 'quay', flag: 'done_race3', unless: 'garage_again' } },
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
  if (F.tyre_soft && !F.tyres_short) return once('rack', 'ottavia', F.kept_tyres ? 'The soft set is on her. Aldo paid. Look after them.' : 'The soft set is on her. They stay nearer new as they wear. They will not make her any faster. Nothing on that rack will.');
  return conv('rack', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: `A soft set, ${price} brass nuts.${jar} They stay nearer new as they wear. They will not make her any faster.`, next: 'pick' },
    pick: {
      who: 'jo',
      text: `I have ${nuts} nuts.`,
      choices: [
        ...(nuts >= price ? [{ text: `Buy the soft set: ${price} nuts`, next: 'bought', effects: [{ call: 'buy', item: 'soft', price }] }] : []),
        { text: nuts >= price ? 'Not today.' : 'I am short. Not today.', next: 'no' },
      ],
    },
    bought: { who: 'ottavia', text: 'I will fit them. Mind your straw: even these only forgive so much.', end: true },
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
