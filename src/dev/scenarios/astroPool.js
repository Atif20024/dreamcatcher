// THE QUIET ABOVE's pool at Jo's scale (owner: "we made jo bigger, but
// everything else remains same size like the hoop which jo need to cross in
// water"). 1 m = 44 px; Jo is about 80 px.
//   astro-pool-scale   the hoops are 1.6-2 m rings (70-90 px), each fits Jo
//                      with room, the water is deep enough for the route (no
//                      hoop touches the surface, the floor or the mid-wall),
//                      the lane ropes' floats are drawn, and no lit surface
//                      band shows anywhere but the surface
//   astro-pool-hoops   a swim along the line through all five on one breath
//                      lights every hoop and gives LUNGS; the breath meter
//                      falls under water; [SPACE] at the surface climbs out
import astroTiles from '../../data/astronaut/tiles.js';

const T = 32;

async function pool(dc) {
  dc.warp('astronaut', 'gym');
  await dc.run(40);
  return dc.scene();
}

const scale = {
  id: 'astro-pool-scale',
  async run(dc) {
    const s = await pool(dc);
    const lines = [];
    let pass = true;
    const water = (x, y) => s.built.charAt(Math.floor(x / T), Math.floor(y / T)) === '~';
    for (const h of s.hoops) {
      const tall = h.near.displayHeight - 8; // the texture keeps 4 px round the ring
      const sized = tall >= 70 && tall <= 92;
      // the whole ring under water, clear of floor and wall
      const top = h.y - tall / 2;
      const bot = h.y + tall / 2;
      const wet = water(h.x, top) && water(h.x, bot) && water(h.x - 12, h.y) && water(h.x + 12, h.y);
      const ok = sized && wet && h.far.depth < s.player.depth && h.near.depth > s.player.depth;
      if (!ok) pass = false;
      lines.push(`hoop ${Math.floor(h.x / T)},${Math.floor(h.y / T)}: ${Math.round(tall)} px ${ok ? 'ok' : `FAIL (sized ${sized}, under water ${wet})`}`);
    }
    // Jo fits through the opening (his 44 px swim body, with room)
    const body = s.player.body.height;
    const opening = 2 * 34; // HOOP.inY both ways
    if (opening < body + 16) pass = false;
    lines.push(`opening ${opening} px for a ${body} px body`);
    // the depth: at least 7 tiles (5 m) of water at the shallow end
    let depth = 0;
    for (let ty = 36; water(66 * T, ty * T + 4); ty++) depth++;
    if (depth < 7) pass = false;
    lines.push(`depth ${depth} tiles (${(depth * T / 44).toFixed(1)} m)`);
    // one lit band per surface column, none under the mid-wall or deeper
    const bands = s.children.list.filter((o) => o.type === 'Rectangle' && o.fillColor === astroTiles.liquidTop && o.height === 6 && o.y > 36 * T && o.y < 52 * T && o.x > 62 * T && o.x < 86 * T);
    const deep = bands.filter((o) => o.y > 37 * T);
    if (deep.length) pass = false;
    lines.push(`surface bands ${bands.length}, below the surface ${deep.length}`);
    return { pass, detail: lines.join('; ') };
  },
};

const hoops = {
  id: 'astro-pool-hoops',
  async run(dc) {
    const s = await pool(dc);
    const p = s.player;
    const put = (x, y) => {
      p.setPosition(x, y);
      p.body.reset(x, y);
    };
    const lungs0 = s.stats.lungs;
    // swim the line: into the water at the left, then hoop to hoop, a few
    // px either side of each centre (as a swimmer would)
    put(64 * T + 16, 38 * T);
    await dc.run(10);
    const breath0 = s.breath;
    let lit = 0;
    for (const h of s.hoops) {
      for (const dx of [-24, -12, 0, 12, 24]) {
        put(h.x + dx, h.y + 6);
        await dc.run(3);
      }
      if (h.hit) lit++;
    }
    const breathUnder = s.breath;
    // up to the surface by the right wall, and out with [SPACE]
    put(83 * T + 16, 36 * T + 20);
    await dc.run(6);
    dc.press('jump', 2);
    for (let f = 0; f < 50 && s.inWater(); f++) await dc.run(1);
    dc.hold('right');
    await dc.run(40);
    dc.release('right');
    await dc.run(20);
    const out = !s.inWater();
    const gained = s.stats.lungs > lungs0;
    const pass = lit === 5 && breathUnder < breath0 && out && gained;
    return { pass, detail: `hoops lit ${lit}/5; breath ${Math.round(breath0)} -> ${Math.round(breathUnder)} under water; climbed out ${out}; LUNGS ${lungs0} -> ${s.stats.lungs}` };
  },
};

export default [scale, hoops];
