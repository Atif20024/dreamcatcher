// THE LONG STRAIGHT's lines (docs/dream_racer.md). Ottavia's dream: at seventy-one
// she still tells people an engine is a quarter-tone flat; here it is 1958, she is
// twenty-two, and the car is hers for one season. Every name is invented. Nobody is
// a villain and nobody is hurt on screen: the Harbour Night Cup is told here
// afterwards, briefly, by people who each think it was somebody else's fault.
//
// (Only the Roche boy blocks, later, on the road: nothing here says otherwise.)
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
    start: { who: 'aldo', text: 'A small cup. A good small cup. Sit, before you fall over.', next: 'b' },
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
  aldo_settled: once('aldo_settled', 'aldo', 'Saturday. Follow me for the first lap. Then do as you like.'),
  nino_sweep: once('nino_sweep', 'nino', 'Signorina Ottavia says I sweep flat too. I did not know you could.'),
  nino_after: once('nino_after', 'nino', 'They have put his car under the sheet. I swept round it.'),
  tullio_tyre: once('tullio_tyre', 'tullio', 'Out there the Roche boy covers his mirror better than he drives. The others just race you. Remember which is which.'),
  tullio_after: once('tullio_after', 'tullio', 'Thirty years on these tyres. Thirty years. I checked them. Ask anyone.'),
  // the morning after the Cup: Jo at the bench
  cup_morning: conv('cup_morning', ['nino', 'jo'], {
    start: { who: 'nino', text: 'They took him up the hill before it was light. His gloves were on the bench. Nobody has moved them.', next: 'b' },
    b: { who: 'jo', text: 'Tail lights, at the Gull Bend. Then no tail lights. Then the dust in my lamps, and his engine stopped.', next: 'c' },
    c: { who: 'nino', text: 'He is alive. Sister says he is alive. Will you take them up? I do not want to.', end: true },
  }),
  // the corridor: put the gloves on the chair (the owner reads this before polish)
  agnese: once('agnese', 'agnese', 'Visiting was at four. Not through the ward. If you must go up, the iron stairs at the end, and quietly.'),
  agnese_up: once('agnese_up', 'agnese', 'That is all he needs tonight. Go on home.'),
  corridor: conv('corridor', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: 'You brought them.', next: 'awake' },
    awake: { who: 'jo', text: 'Is he awake?', next: 'tide' },
    tide: { who: 'ottavia', text: 'He looks at the wall. He knows me. He asked what the tide was doing.', next: 'kept' },
    kept: { if: 'kept_tyres', who: 'ottavia', text: 'He told me to put the new set on you, and I bolted them on myself. His old ones were on his car. So.', next: 'gave' },
    gave: { if: 'gave_tyres', who: 'ottavia', text: 'He had your tyres on. Good tyres. I keep wanting it to be the tyres.', next: 'late' },
    late: { who: 'jo', text: 'A car moved on him, late. I saw it.', next: 'all' },
    all: { who: 'ottavia', text: 'Everybody saw something.', next: 'flat' },
    flat: { who: 'ottavia', text: "His engine was flat on Saturday. A hair. I heard it, and I thought: tomorrow. I'll tell him tomorrow.", next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "You couldn't have known.", next: 'couldnt', set: { ott_couldnt: true } },
        { text: "Why didn't you say?", next: 'why', set: { ott_why: true } },
        { text: 'Say nothing.', next: 'nothing', set: { ott_silent: true } },
      ],
    },
    couldnt: { who: 'ottavia', text: 'I could. It is the whole of what I can do.', next: 'chair' },
    why: { who: 'ottavia', text: 'He was tired. It was a hair. He has been kind to me.', next: 'chair' },
    nothing: { who: 'ottavia', text: 'Thank you.', next: 'chair' },
    chair: { who: 'ottavia', text: 'Put them on the chair. He will see them or he won\'t.', next: 'home' },
    home: { who: 'ottavia', text: 'Go to my mother. The Cup money is on her dresser and she won\'t touch it.', set: { gloves_left: true }, end: true },
  }),
  corridor_after: once('corridor_after', 'ottavia', 'Go on. I will sit a while.'),
  // the kitchen
  signora: once('signora', 'signora', 'The tin is on the dresser. Twelve. It goes in the jars, and I do not want to see you counting it twice.'),
  signora_after: once('signora_after', 'signora', 'There is soup. There is always soup.'),
  jars_said: conv('jars_said', ['signora', 'jo'], {
    start: { who: 'signora', text: 'At the cafe they say it was the money. At the harbour they say it was the boy in the black car. She says nothing. She washes her hands, and the black stays.', next: 'rent' },
    rent: { if: 'rent_ok', who: 'signora', text: 'The rent is in the jar. Good. That is one thing nobody has to say.', next: 'silent' },
    silent: { if: 'rent_short', who: 'signora', text: '…', next: 'med' },
    med: { if: 'med_short', who: 'signora', text: 'It is only my chest. It has been only my chest for years.', next: 'tyres' },
    tyres: { if: 'tyres_short', who: 'signora', text: 'And the car wants what the car wants. It can want.', next: 'end' },
    end: { who: 'signora', text: 'Go on, then. You have a road to drive on, and she will want you back at that garage.', end: true },
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
    some: { if: 'sable_struck', who: 'sable', text: 'You read them. Almost nobody reads them. Our regards to the Signorina.', end: true },
  }),
  // the garage again: the corridor pays off, and whose car it is
  ottavia_again: conv('ottavia_again', ['ottavia', 'jo'], {
    start: { if: 'ott_couldnt', who: 'ottavia', text: "You told me I couldn't have known. It was kind. I have been angry with you for a month.", next: 'why' },
    why: { if: 'ott_why', who: 'ottavia', text: 'You asked me why I did not say. I have a better answer now. I was afraid of being wrong in front of him.', next: 'nothing' },
    nothing: { if: 'ott_silent', who: 'ottavia', text: 'You said nothing, on the stairs. I have been grateful to you, in a bad temper.', next: 'orders' },
    orders: { if: 'sable_orders', who: 'ottavia', text: 'And Sable has your name on a paper that says hold station when you are told. I read it. I read everything now.', next: 'whose' },
    whose: { who: 'ottavia', text: 'He will not drive again. So tell me. Whose car is that, at the shutter?', next: 'pick' },
    pick: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "Aldo's.", next: 'a', set: { car_for: 'aldo' } },
        { text: 'Yours.', next: 'o', set: { car_for: 'ottavia' } },
        { text: 'Mine, for now.', next: 'j', set: { car_for: 'jo' } },
      ],
    },
    a: { who: 'ottavia', text: 'Then drive her as if he could hear you.', next: 'end' },
    o: { who: 'ottavia', text: "Nobody has said that. Don't say it again. Drive.", next: 'end' },
    j: { who: 'ottavia', text: 'Good. Then I know who to blame.', next: 'end' },
    end: { who: 'ottavia', text: 'She is a hair flat, by the way. Not today. I have fixed it. I said so, out loud, to you. Go on.', set: { garage_again: true }, end: true },
  }),
};

export const BARKS = [
  { id: 'jo_quay', channel: 'caption', who: 'jo', text: 'Stone, salt and a telegraph line. The road is the only straight thing here.', when: { room: 'quay' } },
  { id: 'jo_night', channel: 'caption', who: 'jo', text: 'Slower on foot. There is more of it, on foot.', when: { room: 'nightbefore' } },
];

// the rack: what a soft set costs today (the kitchen's jar is off the price)
export function rackConversation(F, nuts) {
  const price = softPrice(F);
  const jar = F.jar_tyres ? ` The tyre jar has paid ${F.jar_tyres * 2} of that.` : '';
  if (F.tyre_soft) return once('rack', 'ottavia', F.kept_tyres ? 'The soft set is on her. Aldo paid. Look after them.' : 'The soft set is on her. They stay nearer new as they wear. They will not make her any faster. Nothing on that rack will.');
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
  if (F.buy_chalk) return once('bench', 'ottavia', 'Your chalk is on the road, every braking point, every lane. It stays. Now leave my bench alone.');
  return conv('bench', ['ottavia', 'jo'], {
    start: { who: 'ottavia', text: `My chalk, ${PRICES.chalk} brass nuts. A mark at every braking point, on every line, for good. It will not stop the car for you.`, next: 'pick' },
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
