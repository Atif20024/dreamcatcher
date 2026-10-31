// THE LAST HAND's beats (plan 2.1 BeatRunner): data, run on events. The
// money itself is code: `{ call: 'name' }` runs src/dreams/gambler/dream.js
// calls (the purse in the run's flags, F.purse).
export default {
  // the quay at dusk: Lou is waiting by the slate
  start: [
    { wait: 500 },
    { call: 'purse' },
    { say: { who: 'jo', text: 'Fog on the river. A white boat with every window lit.' } },
    { wait: 2800 },
    { say: { who: 'jo', text: 'A man in a claret coat by the gangway, holding his hands like they hurt.' } },
  ],
  // the slate is chalked: the night's three numbers
  slate_done: [
    { set: 'slate_set' },
    { sfx: 'click' },
    { say: { who: 'lou', text: "That's your line. Now it's on you all night. Go aboard." } },
    { objective: 'board' },
    { sting: 'gate' },
  ],
  // comps: friendly gifts that go on Mr Pell's book
  comp_drink: [{ call: 'compDrink' }, { say: { who: 'jo', text: 'Warm. Sweet. The room gets a little louder.' } }],
  comp_stake: [{ call: 'compStake' }],
  // the faro bank: doubled
  faro_done: [
    { set: 'faro_done' },
    { say: { who: 'lou', text: 'Eighty. Lovely. Remember how easy that was. It will not be.' } },
    { objective: 'to_cards' },
    { sting: 'gate' },
  ],
  // the bank took the forty: back to the quay, Lou's bar reset
  faro_bust: [{ call: 'bust' }],
  // a table beaten (Jo stood up from a pot he won there)
  table_won: [{ call: 'tables' }, { sting: 'gate' }],
  // busted at a table: the stack is gone; the quay, the bar reset
  bust: [{ call: 'bust' }],
  // a marker signed at the cage
  marker: [{ call: 'marker' }, { sfx: 'click' }],
  // Small Moment "One coin": Mrs Fenn plays her queen
  moment_fenn: [
    { lock: true },
    { camera: { push: 1.4, to: 'npc:fenn', ms: 700 } },
    { say: { who: 'jo', text: 'She sets her one coin on the queen and folds her hands.' } },
    { wait: 3000 },
    { say: { who: 'jo', text: 'The box gives up a seven and a two. The coin stays. She smiles at it like a grandchild.' } },
    { wait: 3200 },
    { camera: 'pop' },
    { lock: false },
  ],
  // the last table: Jo stood up. The lamp dips; the door to the gangway
  stood_up: [
    { call: 'stoodUp' },
    { lock: true },
    { camera: { push: 1.3, to: 'npc:voe_last', ms: 500 } },
    { say: { who: 'voe', text: 'Ha! Go on, then. I\'ll deal myself one.' } },
    { wait: 1800 },
    { fade: 'out', ms: 350 },
    { set: 'lamp_dipped' },
    { wait: 300 },
    { fade: 'in', ms: 600 },
    { camera: 'pop' },
    { lock: false },
    { objective: 'landing' },
  ],
  // the last hand taken and lost: the night's profit is gone; the quay
  lost_night: [{ call: 'lostNight' }],
};
