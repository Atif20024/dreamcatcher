// The rail's services, place by place (FIVE-STAR DREAM, docs/dream_chef.md):
// stations and tickets as data for src/engines/tickets.js. Pure: the balance
// test plays them in Node. Authored in teaching order, never random: a bad
// draw must not change a run. Times in ms; `x`, `y` are the station's standing
// tile in its room (the rail verb and the bot both read them).
export const PIT = {
  stations: {
    sink: { kind: 'quick', x: 12, y: 11, short: 'SINK', label: 'THE SINK', verb: 'take it from Bastien', idle: 'Bastien has nothing for you yet.' },
    scour: { kind: 'work', x: 21, y: 11, short: 'SCOUR', work: 1800, label: 'THE SCOUR BENCH', verb: 'scour the copper' },
    rack: { kind: 'to', x: 26, y: 11, short: 'RACK', label: 'THE PLATE RACK', verb: 'rack the plates', empty: 'The rack wants plates. Bastien has them.' },
    hooks: { kind: 'to', x: 32, y: 6, short: 'HOOKS', label: 'THE COPPER HOOKS', verb: 'hang the copper', empty: 'The hooks want copper, scoured.' },
    hatch: { kind: 'to', x: 39, y: 11, short: 'HATCH', label: 'THE HATCH', verb: 'send it through', empty: 'The hatch wants the tureen. Bastien has it.' },
  },
  tickets: [
    { id: 'p1', table: 'PIT', dish: 'PLATES', stops: ['sink'], to: 'rack' },
    { id: 'p2', after: 'clear', table: 'PIT', dish: 'COPPER POTS', stops: ['sink', 'scour'], to: 'hooks' },
    { id: 'p3', after: 'clear', table: 'LINE', dish: 'THE TUREEN', stops: ['sink'], to: 'hatch', due: 24000 },
  ],
};

// the speaking tube's one ticket: the pedestal finishes it (a key item)
export const COLD = {
  stations: { shelf: { kind: 'quick', x: 23, y: 7, short: 'TOP SHELF', external: true, label: 'TOP SHELF', verb: 'take the tin' } },
  tickets: [{ id: 'saffron', table: 'CHEF', dish: 'SAFFRON', stops: ['shelf'], to: 'pocket' }],
};

// the mise: more than a first night finishes before the doors. What gets done
// is what the line has at the rush (`gives`: portions per line station).
export const PREP = {
  limit: 60000,
  stations: {
    sacks: { kind: 'quick', x: 6, y: 6, short: 'SACKS', label: 'THE SACKS', verb: 'shoulder the shallots' },
    icebox: { kind: 'quick', x: 14, y: 11, short: 'ICE', label: 'THE ICE CHEST', verb: 'lift out the bass' },
    board: { kind: 'work', x: 24, y: 11, short: 'BOARD', work: 2600, label: 'THE BOARD', verb: 'chop' },
    slab: { kind: 'work', x: 30, y: 11, short: 'SLAB', work: 3200, label: 'THE SLAB', verb: 'scale and gut' },
    window: { kind: 'quick', x: 36, y: 8, short: 'HERBS', label: 'THE WINDOW BOX', verb: 'cut the herbs' },
    shelf: { kind: 'to', x: 42, y: 11, short: 'SHELF', label: 'THE LINE SHELF', verb: 'shelve it', empty: 'The shelf is empty. That is the problem.' },
  },
  tickets: [
    { id: 'm_bass', table: 'MISE', dish: 'BASS', stops: ['icebox', 'slab'], to: 'shelf', gives: { grill: 4 } },
    { id: 'm_shallot', table: 'MISE', dish: 'SHALLOTS', stops: ['sacks', 'board'], to: 'shelf', gives: { sauce: 3 } },
    { id: 'm_herb', table: 'MISE', dish: 'HERBS', stops: ['window', 'board'], to: 'shelf', gives: { larder: 2 } },
  ],
};

// the line at rush: three sittings, each hotter; TABLE 1 only when the rail is clear
export const LINE = {
  stock: { grill: 3, sauce: 3, larder: 2 },
  stations: {
    reserve: { kind: 'reserve', x: 6, y: 11, short: 'RESERVE', work: 2400, label: 'THE RESERVE SHELF', verb: 'haul up the reserve', full: 'Nothing is out yet.' },
    larder: { kind: 'quick', x: 11, y: 11, short: 'LARDER', label: 'THE LARDER', verb: 'plate the {dish}', out: 'Out of terrine. The reserve shelf.' },
    sauce: { kind: 'quick', x: 20, y: 11, short: 'SAUCE', label: 'THE SAUCE', verb: 'spoon the sauce', out: 'Out of sauce. The reserve shelf.' },
    grill: { kind: 'fire', x: 36, y: 11, short: 'GRILL', cook: 5200, hold: 9000, slots: 2, scrape: 1800, label: 'THE GRILL', verb: 'lay the {dish} on', out: 'Out of fish. The reserve shelf.' },
    risotto: { kind: 'work', x: 47, y: 11, short: 'RISOTTO', work: 5200, label: 'THE RISOTTO', verb: 'stir in the saffron' },
    pass: { kind: 'to', x: 54, y: 11, short: 'PASS', label: 'THE PASS', verb: 'send it', empty: 'Nothing in your hands. Chef is waiting.' },
  },
  tickets: [
    { id: 't1', sitting: 1, at: 0, table: 4, dish: 'VELOUTE', stops: ['sauce'], to: 'pass', due: 42000 },
    { id: 't2', sitting: 1, at: 7000, table: 6, dish: 'TERRINE', stops: ['larder'], to: 'pass', due: 42000 },
    { id: 't3', sitting: 1, at: 16000, table: 2, dish: 'SOLE', stops: ['grill'], to: 'pass', due: 45000 },
    { id: 't4', sitting: 1, at: 28000, table: 6, dish: 'BASS', stops: ['grill', 'sauce'], to: 'pass', due: 50000 },
    { id: 't6', sitting: 2, at: 42000, table: 3, dish: 'BASS', stops: ['grill', 'sauce'], to: 'pass', due: 45000 },
    { id: 't7', sitting: 2, at: 45000, table: 5, dish: 'SOLE', stops: ['grill'], to: 'pass', due: 39000 },
    { id: 't9', sitting: 2, at: 56000, table: 7, dish: 'TOURNEDOS', stops: ['grill', 'sauce', 'larder'], to: 'pass', due: 56000 },
    // a table changes its mind while it hangs: read the rail
    { id: 't11', sitting: 2, at: 70000, table: 9, dish: 'BASS', stops: ['grill', 'sauce'], to: 'pass', due: 48000, amendAt: 77000, amendStops: ['grill'], amendNote: 'NO SAUCE' },
    { id: 't12', sitting: 3, at: 82000, table: 5, dish: 'BASS', stops: ['grill', 'sauce'], to: 'pass', due: 39000 },
    { id: 't13', sitting: 3, at: 85000, table: 3, dish: 'TOURNEDOS', stops: ['grill', 'sauce', 'larder'], to: 'pass', due: 50000 },
    { id: 't15', sitting: 3, at: 98000, table: 8, dish: 'VELOUTE', stops: ['sauce'], to: 'pass', due: 28000 },
    { id: 't16', sitting: 3, at: 104000, table: 4, dish: 'TERRINE', stops: ['larder'], to: 'pass', due: 28000, minDifficulty: 2 },
    { id: 'table1', after: 'clear', at: 0, table: 1, dish: 'RISOTTO', stops: ['risotto'], to: 'pass', final: true },
  ],
};

// the pass: Aurelio's side of the window. No clock.
export const PASS = {
  stations: {
    finish: { kind: 'work', x: 10, y: 11, short: 'PLATE', work: 1400, label: 'THE PLATE', verb: 'finish it' },
    wipe: { kind: 'quick', x: 14, y: 11, short: 'RIM', label: 'THE RIM', verb: 'wipe the rim' },
    chef: { kind: 'to', x: 18, y: 11, short: 'CHEF', label: 'CHEF', verb: 'hold out the plate' },
  },
  tickets: [{ id: 'finish', table: 1, dish: 'RISOTTO', stops: ['finish', 'wipe'], to: 'chef' }],
};

// the dining room: the plate is already in his hands
export const DINING = {
  stations: { table1: { kind: 'to', x: 54, y: 11, short: 'TABLE 1', label: 'TABLE ONE', verb: 'set it down' } },
  tickets: [{ id: 'walk', table: 1, dish: 'RISOTTO', stops: [], to: 'table1', inHand: true }],
};

export const SERVICES = { pit: PIT, cold: COLD, prep: PREP, line: LINE, pass: PASS, dining: DINING };
