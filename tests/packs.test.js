// A dream loads only its own atlas packs (src/art/packOwners.js): every person
// its source names, and every foe its kinds name, must be in those packs.
// Keys built at runtime (`${key}-talk#1`) all start with a person's key, and a
// person's frames all share one owner. The dream-packs-cover scenario checks
// what the running game asked for as well.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ownerOf, PLACE_OWNERS } from '../src/art/packOwners.js';
import { FOES } from '../src/data/kinds.js';

const SRC = path.resolve(import.meta.dirname, '../src');
const PERSON = /\b(ev-p|ev-x|wr-p|hub|npc|foe)-[a-z0-9_-]*[a-z0-9_]/g;

const ROOTS = {
  chef: ['dreams/chef'],
  musician: ['dreams/musician', 'themes/musician.js'],
  painter: ['dreams/painter'],
  gambler: ['dreams/gambler'],
  clockmaker: ['dreams/clockmaker'],
  racer: ['dreams/racer', 'scenes/RaceScene.js'],
  astronaut: ['scenes/AstronautScene.js', 'data/astronaut', 'data/astronautData.js', 'themes/astronaut.js', 'systems/astroPuzzles.js'],
  writer: ['scenes/WriterScene.js', 'data/writer', 'systems/writerPuzzles.js'],
  evening: ['scenes/EveningScene.js', 'scenes/evening', 'data/evening', 'systems/evening.js', 'systems/talk.js', 'entities/Townsfolk.js'],
};
// code every place runs: anyone it names must be in the always-loaded pack
const SHARED = ['actors', 'entities', 'play', 'narrative', 'ui', 'systems', 'world', 'scenes/BaseLevel.js', 'scenes/HubScene.js', 'scenes/IntroScene.js', 'scenes/TitleScene.js', 'scenes/DreamScene.js'];
const NOT_SHARED = new Set(Object.values(ROOTS).flat());

const files = (rel) => {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs).flatMap((f) => files(path.join(rel, f)));
};
// code, without its comments
const names = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8').replace(/^\s*\/\/.*$|\s\/\/ .*$/gm, '').match(PERSON) || [];
// 'hub-' and the like are not people: a person's key has its full name
const person = (k) => !/^hub-(rain|tile|prop|lamp)/.test(k);

describe('atlas packs', () => {
  for (const [place, roots] of Object.entries(ROOTS)) {
    it(`${place} names only people in its packs`, () => {
      const allowed = new Set(['hub', ...PLACE_OWNERS[place]]);
      const named = new Set(roots.flatMap(files).flatMap(names).filter(person));
      for (const def of Object.values(FOES[place] || {})) if (def.texture) named.add(def.texture);
      const wrong = [...named].filter((k) => !allowed.has(ownerOf(k)));
      expect(wrong).toEqual([]);
    });
  }

  it('shared code names only people in the always-loaded pack', () => {
    // (foeArt.js lists every foe for the build; at runtime it skips the ones whose pack is away)
    const shared = SHARED.flatMap(files).filter((f) => !NOT_SHARED.has(f) && f !== path.join('entities', 'foeArt.js'));
    const wrong = shared.flatMap((f) => names(f).filter((k) => person(k) && ownerOf(k) !== 'hub').map((k) => `${f}: ${k}`));
    expect(wrong).toEqual([]);
  });
});
