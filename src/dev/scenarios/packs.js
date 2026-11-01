// SPEED_REPORT round 2: a dream loads only its own atlas packs.
//   dream-packs-cover  builds every room of each framework dream and visits the
//                      other scenes' places: every person the game asks for
//                      belongs to a pack that place loads (tests/packs.test.js
//                      makes the same check on the source).
import { artAsked } from '../../art/baked.js';
import { ownerOf, PLACE_OWNERS } from '../../art/packOwners.js';

const FRAMEWORK = ['chef', 'musician', 'painter', 'gambler', 'clockmaker', 'racer'];
const PLACES = { astronaut: ['gym', 'moon'], writer: ['attic'], evening: ['arch', 'square', 'station'] };

const wrongFor = (place) => {
  const allowed = new Set(['hub', ...PLACE_OWNERS[place]]);
  return [...artAsked].filter((k) => !allowed.has(ownerOf(k)));
};

export default [
  {
    id: 'dream-packs-cover',
    expect: 'pass',
    async run(dc) {
      const out = {};
      for (const dream of FRAMEWORK) {
        dc.warp(dream, 'start');
        await dc.run(5);
        artAsked.clear();
        const s = dc.scene();
        for (const id of s.graph.rooms.keys()) {
          s.streamer.focus(id);
          await dc.run(10);
        }
        out[dream] = { asked: artAsked.size, wrong: wrongFor(dream) };
      }
      for (const [place, stops] of Object.entries(PLACES)) {
        artAsked.clear();
        for (const stop of stops) {
          dc.warp(place, stop);
          for (let i = 0; i < 300 && !(dc.scene() && dc.scene().player); i++) {
            await new Promise((r) => setTimeout(r, 20));
            dc.step(2);
          }
          await dc.run(30);
        }
        out[place] = { asked: artAsked.size, wrong: wrongFor(place) };
      }
      // (the racer has no people of its own yet: Jo is the hub's)
      return { pass: Object.entries(out).every(([k, o]) => !o.wrong.length && (o.asked || k === 'racer')), detail: out };
    },
  },
];
