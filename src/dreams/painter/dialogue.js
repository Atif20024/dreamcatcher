// THE MASTER'S LADDER's lines (the design: docs/dream_painter_renaissance.md).
// Bice's dream: Fioralba in the spring the new chapel went to a contest. Jo is
// the new errand boy and climbs the whole ladder of the trade in a day. Every
// name is invented. Scene conversations open only on [E] or from a beat;
// barks ride the caption bar. Portraits are cut from the cast's own rigs.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  gualtiero: { name: 'MAESTRO GUALTIERO', portrait: 'portrait-rn-gualtiero', face: 'npc-rn-gualtiero', voicePitch: 0.75 },
  bice: { name: 'BICE', portrait: 'portrait-rn-bice', face: 'npc-rn-bice', voicePitch: 1.2 },
  tonio: { name: 'TONIO', portrait: 'portrait-rn-tonio', face: 'npc-rn-tonio', voicePitch: 1.1 },
  orazio: { name: 'ORAZIO', portrait: 'portrait-rn-orazio', face: 'npc-rn-orazio', voicePitch: 0.9 },
  folco: { name: 'CONSUL FOLCO', portrait: 'portrait-rn-folco', face: 'npc-rn-folco', voicePitch: 0.7 },
  consul: { name: 'A CONSUL', portrait: 'portrait-rn-consul', face: 'npc-rn-consul', voicePitch: 0.8 },
  corso: { name: 'MESSER CORSO', portrait: 'portrait-rn-corso', face: 'npc-rn-corso', voicePitch: 0.95 },
  dori: { name: 'MAESTRO DORI', portrait: 'portrait-rn-dori', face: 'npc-rn-dori', voicePitch: 0.65 },
  steward: { name: 'THE STEWARD', portrait: 'portrait-rn-steward', face: 'npc-rn-steward', voicePitch: 0.9 },
  woman: { name: 'A WOMAN', portrait: 'portrait-rn-woman', face: 'npc-rn-woman', voicePitch: 1.15 },
  friar: { name: 'A FRIAR', portrait: 'portrait-rn-friar', face: 'npc-rn-friar', voicePitch: 0.85 },
  beggar: { name: 'AN OLD MAN', portrait: 'portrait-rn-beggar', face: 'npc-rn-beggar', voicePitch: 0.7 },
  bruno: { name: 'BRUNO', portrait: 'portrait-rn-bruno', face: 'foe-rn-foreman', voicePitch: 0.7 },
  inspector: { name: 'AN INSPECTOR', portrait: 'portrait-rn-inspector', face: 'npc-rn-inspector', voicePitch: 0.8 },
};

const conv = (id, cast, nodes, extra = {}) => ({ id, channel: 'scene', camera: 'talk', cast, nodes, ...extra });
const once = (id, who, text) => conv(id, [who], { start: { who, text, end: true } }, { replayable: true });

export const CONVERSATIONS = {
  // ---- the bottega ----
  gualtiero_first: conv('gualtiero_first', ['gualtiero', 'jo'], {
    start: { who: 'gualtiero', text: "The new boy. Good. You sweep, you fetch, you carry, and you keep your hands off the gold.", next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: 'I came to paint.', next: 'g2' },
    g2: { who: 'gualtiero', text: 'Everyone comes to paint. Painters are made at the slab. Six years of it, if you are lucky.', next: 'g3' },
    g3: { who: 'gualtiero', text: 'The green earth wants grinding, by the window. Fine as flour, washed, then tempered with the yolk. Go on.', set: { met_master: true }, effects: [{ objective: 'grind' }], end: true },
  }),
  gualtiero_wait: once('gualtiero_wait', 'gualtiero', 'The slab, boy. By the window. Fine as flour.'),
  gualtiero_lapis: conv('gualtiero_lapis', ['gualtiero', 'jo'], {
    start: { if: '!grind_clean', who: 'gualtiero', text: "Hm. Flour, with gravel in it. I have ground worse. You'll do: from today you're bound to the shop. Apprentice.", next: 'g1' },
    g1: { if: 'grind_clean', who: 'gualtiero', text: "Hm. Flour. You'll do: from today you're bound to the shop. Apprentice.", next: 'g2' },
    g2: { who: 'gualtiero', text: "The Lady's mantle wants ultramarine, and there isn't a grain of it in the house.", next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: "There's blue in the shells.", next: 'g3' },
    g3: { who: 'gualtiero', text: "Azurite. Ultramarine is lapis from over the sea, and it costs more than gold, ounce for ounce.", next: 'g4' },
    g4: { who: 'gualtiero', text: "Orazio keeps it on his top shelf, under the sign of the mortar. It goes on my account. Don't drop it.", set: { apprentice: true }, effects: [{ objective: 'fetch_lapis' }], end: true },
  }),
  gualtiero_lapis_wait: once('gualtiero_lapis_wait', 'gualtiero', 'Under the sign of the mortar. The top shelf. Mind Dori\'s boys in the street.'),
  gualtiero_drapery: conv('gualtiero_drapery', ['gualtiero', 'jo'], {
    start: { if: '!lapis_stolen', who: 'gualtiero', text: 'You brought it whole. Then you lay it. The gold ground first, then her mantle.', next: 'g1' },
    g1: { if: 'lapis_stolen', who: 'gualtiero', text: "Orazio has sent me the second bill. You brought it, at least. Then you lay it. The gold ground first, then her mantle.", next: 'g2' },
    g2: { who: 'gualtiero', text: 'The face is mine. The master paints the faces. That is how the shop is paid.', end: true },
  }, { replayable: true }),
  gualtiero_assistant: conv('gualtiero_assistant', ['gualtiero', 'jo'], {
    start: { if: '!drapery_clean', who: 'gualtiero', text: "…Rope at the hem. But the fold falls like cloth from the knee. Who taught you that?", next: 'g0' },
    g0: { if: 'drapery_clean', who: 'gualtiero', expr: 'smile', text: "…The fold falls like cloth, not like rope. Who taught you that?", next: 'j1' },
    j1: { who: 'jo', text: '…', choices: [{ text: 'Bice did.', next: 'g2b', set: { told_master: true } }, { text: 'I saw it.', next: 'g2' }] },
    g2b: { who: 'gualtiero', text: "Did she. Keep it in the shop. The guild doesn't take girls, and the street talks.", next: 'g2' },
    g2: { who: 'gualtiero', text: "From today you paint for me: an assistant. And the guild is taking test pieces. I'll stand for you.", next: 'g3' },
    g3: { who: 'gualtiero', text: "Go to the hall across the square. The chain on the gate drops for a master's man.", set: { assistant: true }, effects: [{ objective: 'to_guild' }], end: true },
  }),
  gualtiero_after: once('gualtiero_after', 'gualtiero', 'The guild hall, across the square. Show them a hand they can trust with their walls.'),
  gualtiero_sealed: once('gualtiero_sealed', 'gualtiero', 'A seal on a boy from my slab. I will tell the street it was my idea.'),
  gualtiero_guild: once('gualtiero_guild', 'gualtiero', "Don't look at me, boy. Look at the panel. I only said I would stand here."),
  gualtiero_guild_after: once('gualtiero_guild_after', 'gualtiero', 'I stood for you. Now take your seal off that table, before Folco reads what he has written.'),
  tonio_sealed: once('tonio_sealed', 'tonio', 'Seven years now. Six for the floor, one for waiting for you.'),
  tonio: conv('tonio', ['tonio', 'jo'], {
    start: { who: 'tonio', text: "Six years I've swept this floor. Six. You'll be a master before me, you watch.", next: 'j1' },
    j1: { who: 'jo', text: 'Sorry.', next: 't2' },
    t2: { who: 'tonio', text: "Don't be. Somebody has to keep the glue warm. It might as well be someone who likes glue.", end: true },
  }, { replayable: true }),
  bice_first: conv('bice_first', ['bice', 'jo'], {
    start: { who: 'bice', text: 'Your drapery will be wrong.', next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: "I haven't painted it yet.", next: 'b2' },
    b2: { who: 'bice', text: "You'll paint it like rope. Everyone does. Look: cloth falls from the knee, and then it breaks. Like water off a step.", next: 'j2' },
    j2: { who: 'jo', text: 'You draw better than the master.', next: 'b3' },
    b3: { who: 'bice', expr: 'smile', text: "Don't say that downstairs. The guild doesn't take girls. I grind, I sweep, and I draw at night.", set: { met_bice: true }, end: true },
  }),
  bice_wait: once('bice_wait', 'bice', 'From the knee, then it breaks. Like water off a step.'),
  bice_after: conv('bice_after', ['bice', 'jo'], {
    start: { if: '!drapery_clean', who: 'bice', text: "The knee is right. The hem is rope. I'll put it right tonight, and nobody downstairs will know.", next: 'b1' },
    b1: { if: 'drapery_clean', who: 'bice', expr: 'smile', text: 'The fold. You listened.', next: 'j1' },
    j1: { who: 'jo', text: 'I copied you.', next: 'b2' },
    b2: { who: 'bice', text: "Everyone copies someone. That's what a workshop is.", end: true },
  }, { replayable: true }),

  // ---- the street and the colour-seller ----
  woman: once('woman', 'woman', "The master's daughter draws his angels, you know. Everyone knows. Nobody says."),
  woman_known: once('woman_known', 'woman', "You're Gualtiero's boy. The one who paints cloth like cloth. The street talks."),
  orazio: conv('orazio', ['orazio', 'jo'], {
    start: { who: 'orazio', text: "Gualtiero's boy? The lapis is up top, where a thief needs a ladder.", next: 'o2' },
    o2: { who: 'orazio', text: 'One cake of it is a mason\'s wages for a month. Dori\'s boys have been sniffing round it all morning.', next: 'j1' },
    j1: { who: 'jo', text: "On the master's account.", next: 'o3' },
    o3: { who: 'orazio', text: "Everything's on someone's account. Go on. Climb.", set: { met_orazio: true }, end: true },
  }),
  orazio_after: once('orazio_after', 'orazio', "Hold it like a bird. It is worth more than you are. And go home high: they are waiting in the street."),
  orazio_bought: once('orazio_bought', 'orazio', "Dori's boy sold it back to me for a penny and ran. I put it up top. Climb. It goes on your master's account twice."),

  // ---- the square ----
  woman_square: once('woman_square', 'woman', 'The dome has stood open to the sky for two winters. They say it will close itself. They say a lot.'),
  friar: once('friar', 'friar', 'At vespers they judge the new chapel. The bell will tell the whole city.'),
  friar_known: once('friar_known', 'friar', 'Two workshops and one chapel. I am praying for whichever of you pays for the candles.'),
  inspector_nod: once('inspector_nod', 'inspector', 'Maestro. The guild has no more questions. Mind the wet paint, and your manners.'),
  beggar: once('beggar', 'beggar', 'Draw my hands if you like. They are the only things I have left that are any good.'),
  beggar_known: once('beggar_known', 'beggar', 'You wear a seal now. Draw my hands anyway. Nobody did, before.'),

  // ---- the guild hall ----
  folco_first: conv('folco_first', ['folco', 'jo', 'gualtiero'], {
    start: { who: 'folco', text: "Gualtiero's man. He stands for you?", next: 'j1' },
    j1: { who: 'jo', text: 'He does.', next: 'g1' },
    g1: { who: 'gualtiero', text: 'I do. At the foot of your dais, Folco, with my knees, as God sees.', next: 'f2' },
    f2: { who: 'folco', text: 'Then show us. A head and a hand, on a panel, here, before the consuls.', next: 'f3' },
    f3: { who: 'folco', text: 'The guild trusts a wall only to hands it has watched.', next: 'f4' },
    f4: { who: 'folco', text: "The store is on the table. One cake of ultramarine, one book of gold, one horn of bone white for your silverpoint. A journeyman's hands carry two.", next: 'j2' },
    j2: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'The ultramarine and the gold.', next: 'f5', set: { test_kit: 'ug' } },
        { text: 'The ultramarine and the bone white.', next: 'f5', set: { test_kit: 'ub' } },
        { text: 'The gold and the bone white.', next: 'f5', set: { test_kit: 'gb' } },
      ],
    },
    f5: { who: 'folco', text: 'What you drop stays dropped. What you left, you paint without.', set: { trial_set: true }, effects: [{ objective: 'trial' }], end: true },
  }),
  folco_wait: once('folco_wait', 'folco', 'The panel is on the dais. We are watching.'),
  folco_after: once('folco_after', 'folco', 'Your name in the book, your seal on your door. Palazzo Bardelli wants a painter for its chapel. Go and be one.'),
  consul: once('consul', 'consul', 'My grandfather painted with his thumbs. The young want brushes for everything.'),

  // ---- the palazzo ----
  steward: once('steward', 'steward', "Messer Corso receives masters upstairs. Mind Bruno's porters on the gallery; they are carrying the chapel's gold."),
  dori_first: conv('dori_first', ['dori', 'jo'], {
    start: { who: 'dori', text: "Gualtiero's sweeper, with a seal already. The guild grows careless.", next: 'j1' },
    j1: { who: 'jo', text: 'Maestro Dori.', next: 'd2' },
    d2: { who: 'dori', expr: 'smile', text: 'Anselmo Dori. Three cities sleep under my vaults. Tell your master I shall be gentle with him.', set: { met_dori: true }, end: true },
  }),
  dori_after: once('dori_after', 'dori', 'One giornata, boy. Plaster does not wait for anyone, not even for me.'),
  corso: conv('corso', ['corso', 'jo'], {
    start: { who: 'corso', text: 'Two workshops and one chapel. The city likes a contest, and so do I.', next: 'c2' },
    c2: { who: 'corso', text: "Dori takes the left bay of the vault, Gualtiero's workshop the right. One giornata each: one day of wet plaster. At vespers the bell, and the city judges.", next: 'c3' },
    c3: { who: 'corso', text: "The notary has the contract: the mantle and the sky in ultramarine, not azurite. The stars in gold leaf. Two ounces of blue, ten books of gold.", next: 'c4' },
    c4: { who: 'corso', text: 'And the drawing. Whose cartoon will you work from?', next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: "Bice's. The master's daughter drew it.", next: 'c5b', set: { choice_bice: true } },
        { text: "The workshop's.", next: 'c5s', set: { choice_silent: true } },
      ],
    },
    c5b: { who: 'corso', text: 'A girl. Hm. Then draw it well, all of you. The city will be looking for a reason.', next: 'c6' },
    c5s: { who: 'corso', text: "Good. A workshop's work. Nobody asks whose hand.", next: 'c6' },
    c6: { who: 'corso', text: 'The gold is in my study, at the end of the gallery. Take it to the chapel.', set: { commission: true }, effects: [{ beat: 'contract_signed' }], end: true },
  }),
  corso_after: once('corso_after', 'corso', 'The gold. The study. Then the chapel, before the plasterer starts without you.'),

  // ---- the chapel ----
  bice_deck: conv('bice_deck', ['bice', 'jo'], {
    start: { who: 'bice', text: 'Bruno hid the cartoon under the lime. You found it.', next: 'j1' },
    j1: { who: 'jo', text: 'You drew all of this?', next: 'b2' },
    b2: { who: 'bice', expr: 'smile', text: "All night. Pounce it, and lay the blue. I'll be behind you. The face is mine.", set: { bice_ready: true }, end: true },
  }),
  bice_deck_after: once('bice_deck_after', 'bice', 'Look up. Nobody will ever know which star was yours.'),
  bice_deck_named: once('bice_deck_named', 'bice', 'He said my name. Out loud, to the whole nave. Look up, Jo. Nobody will ever know which star was yours.'),
  gualtiero_deck: conv('gualtiero_deck', ['gualtiero', 'jo'], {
    start: { who: 'gualtiero', text: 'You climbed it. On my knees I took the long way. Bruno is under the lime with his feelings.', next: 'j1' },
    j1: { if: 'met_dori', who: 'jo', text: 'Maestro Dori says he will be gentle with you.', next: 'g1' },
    g1: { if: 'met_dori', who: 'gualtiero', text: 'He was gentle with three cities.', next: 'g2' },
    g2: { who: 'gualtiero', text: "The contract says the face is the master's hand. No notary has ever climbed a scaffold. She paints it. On paper, it has always been mine.", end: true },
  }, { replayable: true }),
  // the bell: what he says depends on who was named, and on who told him
  gualtiero_bell: conv('gualtiero_bell', ['gualtiero', 'jo'], {
    start: { if: 'named_told', who: 'gualtiero', text: 'You told me who taught you, and I said keep it in the shop. Now you have told the nave. It was never my fold. It is hers, and it is in my vault.', next: 's2' },
    s2: { if: 'named_untold', who: 'gualtiero', text: "So. Every angel on my account, and Corso says it out loud. It was never my hand. It is hers, and it is in my vault.", next: 's3' },
    s3: { if: 'choice_silent', who: 'gualtiero', text: 'The Gualtiero workshop. I said it myself. I will not sleep tonight.', end: true },
  }),
  gualtiero_bell_after: once('gualtiero_bell_after', 'gualtiero', 'Go on, boy. The plaster is dry. There is nothing left up here for either of us to touch.'),
  dori_deck: once('dori_deck', 'dori', 'Paint, boy. Talking dries the plaster.'),
  // Gualtiero's question again, and this time an answer
  dori_deck_after: conv('dori_deck_after', ['dori', 'jo'], {
    start: { who: 'dori', text: '…Your fold falls like cloth. Who taught you that?', next: 'j1' },
    j1: { if: 'told_master', who: 'jo', text: 'Bice.', next: 'd1' },
    d1: { if: 'told_master', who: 'dori', text: 'The girl. Good. Then I lost to a better hand than yours.', next: 'j2' },
    j2: { if: '!told_master', who: 'jo', text: 'I saw it.', next: 'd2' },
    d2: { if: '!told_master', who: 'dori', text: 'Nobody sees that. Somebody showed you.', end: true },
  }),
  dori_deck_done: once('dori_deck_done', 'dori', 'Look at it while it is wet, boy. Tomorrow it is only a wall.'),
};

export const BARKS = [
  { id: 'via_rivals', channel: 'caption', who: 'jo', text: "Green caps. Dori's boys. They own this end of the street.", when: { room: 'via', unless: 'lapis' }, once: true },
  { id: 'via_home', channel: 'caption', who: 'jo', text: "More of them, and on the floor. They're after the blue.", when: { room: 'via', flag: 'lapis_carry' }, once: true },
  { id: 'bruno_notice', channel: 'caption', who: 'bruno', text: "Gualtiero's boy. The cartoon is under the lime, where it belongs.", when: { room: 'chapel', flag: 'bruno_near' }, once: true },
  { id: 'piazza_dome', channel: 'caption', who: 'jo', text: 'The dome. Half a sky in brick, open to the weather.', when: { room: 'piazza' }, once: true },
  { id: 'chapel_wet', channel: 'caption', who: 'jo', text: 'Wet plaster. It waits for nobody.', when: { room: 'chapel' }, once: true },
];
