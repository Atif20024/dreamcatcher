// Which atlas pack holds each person, so a dream loads only its own people
// (SPEED_REPORT round 2). Read by scripts/build-atlas.js and the runtime; a
// person named here must appear only in the dreams listed for its owner
// (tests/packs.test.js scans for it). Anyone not named goes in the hub's pack,
// which is always loaded: a mistake here costs memory, never a missing person.
const RULES = [
  ['crowd', /^ev-p-(fereshteh|bo|fisherman|hamid|baker|bilal|mother|sweeper|gardener|sleeper)\b/], // the Evening's people, also the Cellar's crowd
  ['hub', /^ev-p-waiting_kid\b/], // a face in the clockmaker's dialogue, too small for a pack of its own
  ['evening', /^ev-[px]-/],
  ['writer', /^(wr-p-|foe-(landlady|talker|guard|proofreader)\b)/],
  ['astronaut', /^(npc-(priya|adaeze|halvorsen|osei)\b|foe-(gym-rat|cleaner|security)\b)/],
  ['musician', /^(npc-(delphine|nia|marcus|ray|tally|sol|scalper|roadie)\b|foe-(bouncer|heckler|scalper|manager|roadie)\b)/],
  ['painter', /^((npc|foe)-rn-|foe-(petitioner|gendarme|gardener|farmer|shopkeeper)\b)/],
  ['gambler', /^((npc|foe)-lq-|foe-(floor-security|collector|runner|lounge-bouncer|pit)\b)/],
  ['clockmaker', /^npc-sh-/],
  ['chef', /^(npc-rv-|foe-sous-chef\b)/],
];

export const ownerOf = (key) => (RULES.find(([, re]) => re.test(key)) || ['hub'])[0];

// what each place needs on top of the always-loaded packs
export const PLACE_OWNERS = {
  chef: ['chef'],
  musician: ['musician', 'crowd'],
  writer: ['writer'],
  painter: ['painter'],
  astronaut: ['astronaut'],
  gambler: ['gambler'],
  clockmaker: ['clockmaker'],
  evening: ['evening', 'crowd'],
};
