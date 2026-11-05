// The night grade gives lit shapes their light back (src/art/look.js):
//   night-glow  a lamp's copy adds what the grade took, the wall beside it is
//               untouched, and the copies sit between the grade and the people
import { GLOW_DEPTH, glowTint, litAlpha } from '../../art/look.js';

const nightGlow = {
  id: 'night-glow',
  async run(dc) {
    const sum = glowTint(0x9894c8);
    const tints = sum === (0x67 << 16 | 0x6b << 8 | 0x37) && glowTint(0x9894c8, 0x808080) === (0x34 << 16 | 0x36 << 8 | 0x1c);
    const alphas = litAlpha(255, 255, 255, 170) === 1 && litAlpha(100, 90, 80, 170) === 0 && litAlpha(1, 1, 1, 0) === 1;
    dc.warp('hub');
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene().grade); i++) {
      await new Promise((r) => setTimeout(r, 20));
      dc.step(2);
    }
    dc.step(5);
    const s = dc.scene();
    const copies = s.children.list.filter((o) => o.texture && o.texture.key.startsWith('lit:'));
    const lamp = copies.find((o) => o.texture.key.startsWith('lit:hub-platform-lamp'));
    const lampSrc = lamp && lamp.texture.getSourceImage().getContext('2d');
    const lit = lampSrc && lampSrc.getImageData(9, 8, 1, 1).data[3] > 200; // the lantern's glass
    const post = lampSrc && lampSrc.getImageData(11, 80, 1, 1).data[3] === 0; // the iron post is not
    const order = s.grade.depth < GLOW_DEPTH && GLOW_DEPTH < 11;
    return { pass: tints && alphas && copies.length > 20 && lit && post && order, detail: { tints, alphas, copies: copies.length, lit, post, order } };
  },
};

export default [nightGlow];
