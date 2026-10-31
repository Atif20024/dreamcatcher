// THE MASTER'S LADDER's beats (plan 2.1 BeatRunner): data, run on events.
import { CONTRACT_DOC } from './contract.js';
export default {
  // the arrival: the bottega, the smell of it
  start: [
    { wait: 600 },
    { music: 'quiet' },
    { say: { who: 'jo', text: 'Egg yolk, rabbit-skin glue, wet lime. A workshop.' } },
    { wait: 3000 },
    { say: { who: 'jo', text: 'Somebody up in the loft is drawing. I can hear the charcoal.' } },
  ],
  // the grinding is done: the master binds Jo to the shop
  ground_done: [
    { set: 'ground' },
    { sfx: 'click' },
    { camera: { push: 1.2, to: 'npc:gualtiero', ms: 500 } },
    { talk: 'gualtiero_lapis' },
    { camera: 'pop' },
    { sting: 'gate' },
  ],
  got_lapis: [
    { say: { who: 'jo', text: 'Lapis. A stone the colour of the deep end of the sky, and it weighs like money.' } },
    { objective: 'back_bottega' },
  ],
  // the altarpiece: the gold ground and the mantle are laid
  drapery_done: [
    { set: 'drapery_done' },
    { wait: 400 },
    { talk: 'gualtiero_assistant' },
    { sting: 'gate' },
  ],
  // Small Moment "Bice's hand": she draws a hand from memory, by one candle
  moment_bice: [
    { lock: true },
    { camera: { push: 1.4, to: 'npc:bice', ms: 700 } },
    { say: { who: 'jo', text: 'She draws a hand from memory. Her own, holding the charcoal.' } },
    { wait: 3000 },
    { say: { who: 'jo', text: 'Then she rubs it out with bread, and draws it again, better.' } },
    { wait: 2800 },
    { camera: 'pop' },
    { lock: false },
  ],
  // the test piece: the consuls nod
  master_done: [
    { set: 'guild_master' },
    { camera: { push: 1.2, to: 'npc:folco', ms: 500 } },
    { say: { who: 'jo', text: 'Folco writes my name in the book. In ink. It will be there tomorrow.' } },
    { wait: 2400 },
    { camera: 'pop' },
    { objective: 'take_seal' },
  ],
  got_seal: [{ objective: 'to_palazzo' }, { sting: 'gate' }],
  // the contract: what the finale will spend
  contract_signed: [
    { read: CONTRACT_DOC },
    { say: { who: 'jo', text: 'The notary writes it in Roman numbers. Ultramarine, two. Gold leaf, ten.' } },
    { objective: 'get_gold' },
  ],
  got_gold: [{ objective: 'to_chapel' }, { sting: 'gate' }],
  got_cartoon: [
    { say: { who: 'jo', text: "The cartoon, rolled under a sack of lime. Every line pricked through. Bice's hand." } },
    { objective: 'climb_vault' },
    { sting: 'gate' },
  ],
  // the bell: the scaffolds come down, the city looks up (the guild's
  // judging as a coda: the two bays, the crowd, the consuls)
  contest_done: [
    { music: 'quiet' },
    { camera: { vista: 0.8, to: 'self', ms: 600 } },
    { sfx: 'bell' },
    { say: { who: 'jo', text: 'Vespers. The bell. Below us the whole city has come in to look up.' } },
    { wait: 2800 },
    { fade: 'out', ms: 400 },
    { set: 'judged' },
    { wait: 500 },
    { fade: 'in', ms: 900 },
    { if: 'giornata_clean', then: [{ say: { who: 'jo', text: 'The consuls stand under our bay the longest. Dori stands with them.' } }], else: [{ say: { who: 'jo', text: 'The consuls stand a long time under both bays. Then under ours.' } }] },
    { wait: 3000 },
    { if: 'choice_bice', then: [{ say: { who: 'jo', text: '"Whose drawing?" Messer Corso says it out loud: hers.' } }], else: [{ say: { who: 'jo', text: '"The Gualtiero workshop," they say. Bice says nothing at all.' } }] },
    { wait: 3000 },
    { camera: 'pop' },
    { objective: 'after' },
  ],
  // studies in silverpoint ([Q]): optional, remembered at the end
  study_torso: [{ say: { who: 'jo', text: 'A torso from the old forum. Nobody alive made it, and it still breathes.' } }],
  study_hands: [{ say: { who: 'jo', text: 'His hands. Every knuckle a story. I draw them twice.' } }],
  study_dome: [{ say: { who: 'jo', text: 'The centering under the dome: a forest of beams holding up half a sky.' } }],
};
