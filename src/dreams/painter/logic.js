// THE MASTER'S LADDER's pure rules (no Phaser): the test piece's materials,
// the consuls' verdict, the stone a rival can take, the book of studies.
// Unit-tested in tests/painterLogic.test.js.

// the guild's store on the dais: three things, a test piece carries two
export const KITS = {
  ug: ['ultramarine', 'gold'],
  ub: ['ultramarine', 'bone'],
  gb: ['gold', 'bone'],
};
export const MATERIAL_NAMES = { ultramarine: 'ULTRAMARINE', gold: 'GOLD LEAF', bone: 'BONE WHITE' };

export function testStock(kit) {
  const stock = { ultramarine: 0, gold: 0, bone: 0 };
  for (const m of KITS[kit] || KITS.ug) stock[m] = 1;
  return stock;
}

// silverpoint only bites on a ground of bone ash; without it the drawing is
// done on chalk. The mantle wants ultramarine, the halo gold.
export const TEST_STEPS = [
  { label: 'gesso the panel' },
  { label: 'the drawing, silverpoint on bone', uses: 'bone', instead: 'the drawing, on chalk: it skates' },
  { label: 'green earth under the flesh' },
  { label: 'the flesh, warm over cool' },
  { label: 'the mantle, in ultramarine', uses: 'ultramarine', instead: 'the mantle, in azurite' },
  { label: 'the halo, in gold', uses: 'gold', instead: 'the halo, in ochre' },
];

// what the finished panel lacks: left in the store, or spent on a miss
export function trialLost(kit, wasted = []) {
  const carried = KITS[kit] || KITS.ug;
  const out = Object.keys(MATERIAL_NAMES).filter((m) => !carried.includes(m));
  for (const m of wasted) if (!out.includes(m)) out.push(m);
  return out;
}

// Folco's verdict: every panel passes, each one is remembered differently
export function trialVerdict(kit, wasted = []) {
  const lost = trialLost(kit, wasted);
  if (lost.length > 1) return "Good colour on the guild's floor, and the panel finished anyway. The book does not ask how.";
  if (lost[0] === 'bone') return 'A rich panel on a poor ground. The silver skated. The gold will carry it. It usually does.';
  if (lost[0] === 'gold') return 'A halo in ochre, and the truest blue in Fioralba. We have passed worse, and charged them more.';
  return 'Azurite in the mantle. It will go green inside twenty years. You and I will be dead, so the guild passes it.';
}

// a green cap got his hands on Jo with the stone: it is gone from the satchel
// and (Dori's boy sells it back) on Orazio's top shelf again
export function loseLapis(F) {
  F.lapis = false;
  F['item:lapis'] = false;
  F.lapis_stolen = (F.lapis_stolen || 0) + 1;
  F.lapis_carry = false;
}

// the street, read from the ladder: which rivals are out
export function streetFlags(F) {
  F.lapis_carry = !!F.lapis && !F.drapery_done;
  F.rivals_out = !F.lapis_carry && !F.seal;
  F.rivals_on_pentice = !F.seal;
}

// the ending's line for the book of studies: nobody is punished for two
const STUDY = { study_torso: 'a torso', study_hands: 'a pair of hands', study_dome: "the dome's centering" };
export function studiesLine(F) {
  const got = Object.keys(STUDY).filter((k) => F[k]).map((k) => STUDY[k]);
  if (got.length === 3) return 'Three studies in silverpoint, kept in a book for sixty years.';
  if (!got.length) return null;
  const said = got.join(' and ');
  return `${said[0].toUpperCase()}${said.slice(1)}, kept in a book for sixty years.`;
}
