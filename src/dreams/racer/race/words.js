// What is said on the road, and the card at the line: no Phaser (tests/racerWords.test.js).
// A number in a line is the game's own number: a time, a stop or a count is read from the
// track, TUNE or the run, never written in by hand (the test scans every line for one).
import { TUNE } from '../../../engines/race.js';
import { clock, spoken, costliest, shownTime, flagOf } from './result.js';

export const NAMES = { aldo: 'Aldo', teo: 'Brasca', dante: 'Dante', cassian: 'Roche', roche: 'Roche' };
export const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

const NUM = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
// a whole number as a word, up to twenty (past that, the figure)
export const numberWord = (n) => (Number.isInteger(n) && n >= 0 && n < NUM.length ? NUM[n] : String(n));
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// seconds as Tullio says them: whole ones and halves ('a second and a half', 'two and a half seconds')
export function seconds(s) {
  const whole = Math.floor(s);
  const half = s - whole === 0.5;
  if (!half) return `${numberWord(s)} ${s === 1 ? 'second' : 'seconds'}`;
  return whole === 1 ? 'a second and a half' : `${numberWord(whole)} and a half seconds`;
}
const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${numberWord(n)} times`);

// the road's own lines, by cue or by event: [who, text]
export const CUES = {
  crest: ['OTTAVIA', 'Right, over the top. Trust the board. You will not see it.'],
  line: ['OTTAVIA', 'Wide holds more speed. Tight is shorter. Watch the notch.'],
  stay_in_my_air: ['ALDO', "Stay in my air. Don't look at the water."],
  tide: ['ALDO', "Tide's in, stranger. Look at the road, not the water."],
  out_and_she_sings: ['OTTAVIA', 'You are in his air. Now out, and she goes.'],
  the_cart: ['OTTAVIA', 'A cart, on the left. Go right.'],
  the_box: ['OTTAVIA', 'The box. Stop on the paint, or there is no second lap.'],
  second_lap: ['OTTAVIA', 'New tyres. Now spend them.'],
};
export const STORY = {
  aldo_wide: ['ALDO', "Wide. I'm wide."],
  teo_through: ['OTTAVIA', 'Brasca. Let him go. Stay with Aldo.'],
  orders_broken: ['OTTAVIA', 'That was the paper you signed. I read it. I read everything now.'],
  block_tell: ['OTTAVIA', 'He has seen you. He will shut the door. The door is not in the bend.'],
  mistake: ['OTTAVIA', 'There. He braked early. That is the door.'],
  fade: ['OTTAVIA', "Brasca's gone off his tyres. Let him come back to you."],
  crossing_bell: ['OTTAVIA', 'The bell. Make it, or brake and wait.'],
  gate: ['OTTAVIA', 'Sit. It will open.'],
  pit_through: ['OTTAVIA', 'You have no tyres for a second lap.'],
  wheel: ['OTTAVIA', "That's a wheel. That's his wheel."],
  oil: ['OTTAVIA', 'Oil. His sump. Hold the wheel.'],
  stop_go: ['OTTAVIA', 'That cost you. You still have it. Drive.'],
};
export const AIR = { out: ['ALDO', 'Where are you? In my air, Jo.'], back: ['OTTAVIA', 'There. Stay in it.'] };

// Ottavia, on the radio (a few words, on a caption)
export const RADIO = {
  go: "Don't lift.",
  lights: 'Green, then gas.',
  jump_start: 'Early. Next time.',
  launch: 'That was the green. Good.',
  armed: 'In his air. Out, and she goes.',
  sling: 'There she goes.', // (she sings in a bend taken right: the sling is another thing)
  straw: 'Straw. Slower into that one.',
  bale: 'Mind the bales.',
  spin: 'Breathe. I have you at the lamp.',
  lamp: 'You passed a lamp. Spin, and you start from it.',
  rub: 'That was paint.',
  hit: 'That was more than paint.',
  verge: 'Off the verge. It eats the tyres.',
  aid: 'I will whisper the brake marks. Listen for me.',
  short: "They are last month's. I said what the jar said. Brake early and they will last.",
  tide: "Tide's coming in. I looked. Somebody has to.",
  hot: 'She is running hot. Watch the temperature.',
  harbour: 'Your first start. Green, then gas, and stay with him.',
};

// Aldo on the grid at Pinewood: his own time, and after a miss the time he will take from you.
// gate.was is his (raceFor eases only the bar Jo is judged against), so he never says another
export function aldoGrid(gate) {
  if (gate.was === undefined) return `${spoken(gate.time)}, I did it in. In that car. Go on.`;
  return `${spoken(gate.was)}, I did it in. For you, ${spoken(gate.time).toLowerCase()}. Go on.`;
}

// the first line on the grid: [who, text, ms], or null
export function gridLine(track, { aid = false, hot = false, flags = {} } = {}) {
  if (aid) return ['OTTAVIA', RADIO.aid, 3200];
  if (track.id === 'pinewood') return ['ALDO', aldoGrid(track.gate), 2600];
  if (track.id === 'salt' && flags.tyres_short) return ['OTTAVIA', RADIO.short, 4200];
  if (track.id === 'coppa') return ['OTTAVIA', RADIO.tide, 3200];
  if (track.id === 'harbour') return ['OTTAVIA', hot ? RADIO.hot : RADIO.harbour, 3200];
  return hot ? ['OTTAVIA', RADIO.hot, 3200] : null;
}

// how the run behaved, in one sentence
function manners(run) {
  if (run.clean) return 'A clean run.';
  const parts = [];
  if (run.spins) parts.push(`${numberWord(run.spins)} ${run.spins === 1 ? 'spin' : 'spins'}`);
  if (run.offroads) parts.push(`into the hay ${times(run.offroads)}`);
  if (run.rubs) parts.push(`${numberWord(run.rubs)} ${run.rubs === 1 ? 'rub' : 'rubs'}`);
  return `${cap(parts.join(', '))}.`;
}

// the card, from what the run actually did: one thing a sentence
export function cardLines(track, { place, time, gap, flags: run }, pass, flags, owed, sang, nearest) {
  const gate = track.gate || {};
  const him = NAMES[nearest] || 'The next car';
  const lines = [];
  if (gate.time !== undefined) {
    lines.push(`Aldo reads the watch: "${spoken(shownTime(time, gate, pass))}."`);
    lines.push(pass ? 'He is pretending not to smile. The seat is yours.' : '"Again," he says. He says it kindly.');
    lines.push(gate.was !== undefined ? `Aldo's time: ${clock(gate.was)}. He will take ${clock(gate.time)}.` : `Aldo's time: ${clock(gate.time)}.`);
    lines.push(manners(run));
  } else {
    const name = ORDINAL[place - 1] || `P${place}`;
    const lifts = run.lifts === 0 ? 'you never lifted' : run.lifts === 1 ? 'I heard you lift once' : run.lifts === 2 ? 'I heard you lift only twice' : `I heard you lift ${numberWord(run.lifts)} times`;
    let say = place === 1 ? `${name}, and ${lifts}.` : pass ? `${name}. On the sheet. It will do.` : `${name}. Not on the sheet. Again.`;
    if (track.id === 'salt' && pass) say = `${name}. On the sheet. The sheet pays. Go and put it on her dresser.`;
    if (track.id === 'coppa' && pass) say = "That's it. That's dead on.";
    if (track.id === 'coppa' && !pass) say = `${name}. The Coppa pays first, and nothing else. Again.`;
    lines.push(`Ottavia: "${say}"`);
    if (gap !== null) lines.push(gap >= 0 ? `${him} came in ${gap.toFixed(1)} s behind you.` : `${him} was home ${(-gap).toFixed(1)} s before you.`);
    lines.push(manners(run));
    if (run.slings) lines.push(`You slung out of a car's air ${times(run.slings)}.`);
  }
  if (sang) lines.push(`${cap(numberWord(sang))} of ${numberWord(track.bends.length)} bends sang.`);
  const lesson = costliest(run);
  if (lesson) lines.push(lesson);
  if (track.target) lines.push(time <= track.target ? `Ottavia's time: ${clock(track.target)}. You have it.` : `Ottavia's time: ${clock(track.target)}.`);
  if (owed) lines.push(`The prize tin is waiting at the garage: ${owed} brass nuts.`);
  else if (pass) lines.push('Nothing more in the tin for that.');
  if (!pass) {
    lines.push(`Your best here: ${clock(flags[flagOf(track.id, 'time')])}.`);
    if (gate.place) lines.push(gate.place === 1 ? 'Only first will do.' : `The sheet takes the first ${numberWord(gate.place)}.`);
  }
  return lines;
}

// Tullio after the drill (beats.js): the crew's stops, read from TUNE
export const DRILL = {
  clean: `Wheel, wheel, fuel, flag. ${cap(seconds(TUNE.pitClean))}. That is a crew. That is all a crew is.`,
  late: `One late. ${cap(seconds(TUNE.pitBox))} on the night, not ${seconds(TUNE.pitClean)}. It will do, and I will mention it.`,
  miss: `On the night that is ${seconds(TUNE.pitMiss)}, and the road does not wait. Again, on her call.`,
};
