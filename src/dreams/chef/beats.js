// FIVE-STAR DREAM's beats: data, run on events. Hands and other run-dependent
// things are code: `{ call: 'name' }` runs src/dreams/chef/dream.js calls.
export default {
  start: [
    { wait: 500 },
    { say: { who: 'jo', text: 'Rain. The back of a grand hotel. Every window on this wall is running with steam.' } },
  ],
  // the pit's rail is clear: Marguerite comes down with the apron
  pit_clear: [
    { set: 'pit_clear' },
    { wait: 600 },
    { talk: 'apron' },
    { sting: 'gate' },
    { sfx: 'whistle' },
    { say: { who: 'tube', text: 'Saffron. The cold store. Now.' } },
    { objective: 'to_cold' },
  ],
  // the top shelf
  saffron_got: [
    { call: 'saffronGot' },
    { say: { who: 'jo', text: 'A tin the size of my palm. It goes in the pocket. Worth more than the cold store.' } },
    { sfx: 'whistle' },
    { wait: 2600 },
    { say: { who: 'tube', text: 'Good is not the word. Prep. Now.' } },
    { objective: 'out_cold' },
  ],
  doors_ready: [
    { sting: 'gate' },
    { say: { who: 'marguerite', text: 'Everything shelved? On your first night? Hm. DOORS!' } },
    { objective: 'to_line' },
  ],
  doors_late: [
    { sfx: 'bell' },
    { say: { who: 'marguerite', text: 'DOORS! What is on the shelf is what we have. Go!' } },
    { objective: 'to_line' },
  ],
  // TABLE 1 comes onto the rail
  table1_called: [
    { sfx: 'whistle' },
    { say: { who: 'tube', text: "Table one has sat. Madame Lisle. The risotto: the stage's. Stir it. Stay with it." } },
    { set: 'table1_called' },
  ],
  // the plate through the window; he will not take it there
  table1_sent: [
    { lock: true },
    { camera: { push: 1.25, to: 'npc:aurelio_window', ms: 500 } },
    { say: { who: 'aurelio', text: 'No. Not through the window. Stage. Bring it round. Yourself. I want to see your hands.' } },
    { wait: 3200 },
    { say: { who: 'marguerite', text: "...He's never asked to see anyone's hands." } },
    { wait: 2600 },
    { camera: 'pop' },
    { lock: false },
    { sting: 'gate' },
    { objective: 'to_pass' },
  ],
  // at the plate: the choice
  pick_finish: [{ talk: 'finish' }],
  // "Stage. Hands."
  // (no lock: a suspended InputMap would freeze the scene box; the box holds Jo)
  hands: [
    { music: 'silent' },
    { call: 'hands' },
    { set: 'hands_done' },
    { call: 'kitchenBack' },
    { music: 'quiet' },
    { wait: 1200 },
    { talk: 'take_it' },
    { call: 'kitchenAway' },
    { objective: 'carry' },
  ],
  // table one: the plate down, the last of the lamps
  set_down: [
    { lock: true },
    { set: 'plate_set' },
    { sfx: 'clack' },
    { wait: 1400 },
    { say: { who: 'jo', text: 'A card. An empty chair. It was always empty.' } },
    { wait: 2800 },
    { set: 'lamps_all' },
    { wait: 2600 },
    { set: 'orb_on' },
    { lock: false },
    { objective: 'catch' },
  ],
  // ---- the small moments -------------------------------------------------
  moment_tome: [
    { lock: true },
    { camera: { push: 1.4, to: 'npc:tome', ms: 700 } },
    { say: { who: 'jo', text: 'He chops onions and cries. The wireless says something, and he laughs, still crying.' } },
    { wait: 3000 },
    { say: { who: 'jo', text: "He wasn't crying about anything." } },
    { wait: 2200 },
    { say: { who: 'tome', text: 'Here. The staff pot, all day on the low ring. Not for them. Taste.' } },
    { set: 'onions' },
    { wait: 2800 },
    { say: { who: 'jo', text: 'A spoon of it, sweet and nearly burnt. The rest goes in the pocket.' } },
    { wait: 2200 },
    { camera: 'pop' },
    { lock: false },
  ],
  moment_cat: [
    { lock: true },
    { camera: { push: 1.5, to: 'self', ms: 700 } },
    { say: { who: 'jo', text: 'A cat, curled on the one warm pipe. It opens one eye and shuts it.' } },
    { sfx: 'purr_soft' },
    { wait: 3400 },
    { say: { who: 'jo', text: 'It found the only warm place, and stayed.' } },
    { wait: 2600 },
    { camera: 'pop' },
    { lock: false },
  ],
  moment_bastien: [
    { lock: true },
    { camera: { push: 1.4, to: 'npc:bastien', ms: 700 } },
    { say: { who: 'jo', text: 'He sprays and scrubs and sings, terribly, with his whole chest.' } },
    { wait: 3200 },
    { say: { who: 'jo', text: "Nobody was listening. He didn't need them to." } },
    { wait: 2600 },
    { camera: 'pop' },
    { lock: false },
  ],
};
