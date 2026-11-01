// The shared human skeleton (adult class). A rig supplies parts, palette and
// metrics; a pose supplies hips, lean, foot targets, arm angles and the head.
// composeHuman(rig, pose) → { body, hat, attach, contacts } (letter grids).
//
// Pose fields (all 1× px; + y is UP for hips/heights, x is toward facing):
//   hips      hip height offset (recoil −1, high +1, airborne +2…)
//   hx        hip x offset (weight shift)
//   lean      torso top shift forward (+) or back (−)
//   head      head variant name; headDy/headDx override (head lag)
//   fF, fB    front/back foot: [x from hip, height above ground, boot variant]
//   aF, aB    front/back arm: [shoulder angle from down (+ forward), elbow bend]
//   torso     torso variant name
//   hat       true | false | { dx, dy, q } (q = quarter turns)
//   rot       whole-figure rotation in degrees about the hips (falls, KO, float)
//   lift      whole figure up by n px (sitting on a seat drawn lower, etc.)
//   trail     coat tails and hems lag by n px at the bottom (secondary motion)
//   rim       leading-edge light this frame ('limbs' | 'all'; a rig's `rim` is the default)
//   sF, sB    shoulder [col, row] on the torso grid, overriding the rig's (a square-on torso)
//   kneeF/B   which way the knee goes (+1 forward, the default; -1 for a square-on left leg)
//   hipSep    hip spread, overriding the metric; flat: both sides lit alike (no far limb)
// A rig's parts.over is a layer or a list of layers: { rows, ox, oy } stamped
// on the hips; { rows, torso: true } the torso's own size, moving with it;
// { ..., trail: true } a hanging layer that swings by pose.trail.
import { grid, stamp, capsule, ik, fk, outline, rimPass, rotateGrid, translateGrid, rotRows } from './compose.js';

export function composeHuman(rig, pose) {
  const M = rig.metrics;
  const P = rig.parts;
  const g = grid(M.W, M.H);
  const hatG = grid(M.W, M.H);
  const hipX = M.ax + (pose.hx || 0);
  const hipY = M.hipY - (pose.hips || 0) - (pose.lift || 0);
  const ground = M.sole - (pose.lift || 0); // sole row of a planted boot
  const lean = pose.lean || 0;
  const torsoRows = P.torso[pose.torso || 'base'] || P.torso.base;
  const tH = torsoRows.length;
  // torso: anchored at its hip point; the top shears by `lean`
  const tOx = P.torsoAnchor[0];
  const tOy = P.torsoAnchor[1];
  const torsoTop = hipY - tOy;
  const neck = [hipX - tOx + P.neckAt[0] + lean, torsoTop + P.neckAt[1]];
  const chest = pose.chest || 0; // a breath: chest, shoulders and head up
  const shoulder = (at) => [hipX - tOx + at[0] + Math.round(lean * 0.85) + 0.5, torsoTop + at[1] + 0.5 - chest];
  const shoulderF = shoulder(pose.sF || P.shoulderF);
  const shoulderB = shoulder(pose.sB || P.shoulderB);
  const flat = !!pose.flat;
  const sep = pose.hipSep ?? M.hipSep;

  const legChain = (foot, side) => {
    const [fx, fh, kind] = foot || [0, 0, 'flat'];
    const boot = P.boots[kind] || P.boots.flat;
    const hip = [hipX + (side === 'f' ? sep : -sep) + 0.5, hipY + 0.5];
    const ankle = [hipX + fx + 0.5, ground - boot.ankleUp - fh + 0.5];
    const { mid } = ik(hip, ankle, M.thigh, M.shin, (side === 'f' ? pose.kneeF : pose.kneeB) || 1);
    return { hip, knee: mid, ankle, boot, kind, fx, fh };
  };
  const armChain = (arm, sh) => {
    const [a, bend] = arm || [0, 0];
    return { sh, ...fk(sh, a, bend, M.upper, M.fore) };
  };
  const drawLeg = (L, side) => {
    const back = side === 'b';
    const dk = back && !flat ? 1 : 0;
    capsule(g, rig, L.hip, L.knee, M.thighR, 'pants', `thigh_${side}`, { darken: dk, ring: !back });
    // a rig's tall boots: the shin takes the boot's leather
    capsule(g, rig, L.knee, L.ankle, M.shinR, P.shinFamily || 'pants', `shin_${side}`, { darken: dk, ring: !back });
    stamp(g, L.boot.rows, Math.floor(L.ankle[0]), Math.floor(L.ankle[1]), L.boot.ox, L.boot.oy, `boot_${side}`, { darken: dk, rig });
  };
  const drawArm = (A, side) => {
    const back = side === 'b';
    const dk = back && !flat ? 1 : 0;
    capsule(g, rig, A.sh, A.mid, M.armR, 'jacket', `arm_${side}`, { darken: dk, ring: !back });
    capsule(g, rig, A.mid, A.end, M.foreR, 'jacket', `fore_${side}`, { darken: dk, ring: !back });
    const hk = (side === 'f' ? pose.handF : pose.handB) || 'open';
    const hand = P.hands[hk] || P.hands.open;
    if (hk !== 'none') stamp(g, hand.rows, Math.floor(A.end[0]), Math.floor(A.end[1]), hand.ox, hand.oy, `hand_${side}`, { darken: dk, rig });
  };

  const legF = legChain(pose.fF, 'f');
  const legB = legChain(pose.fB, 'b');
  const armF = armChain(pose.aF, shoulderF);
  const armB = armChain(pose.aB, shoulderB);

  // draw order: back arm, back leg, torso, front leg, head, front arm
  drawArm(armB, 'b');
  drawLeg(legB, 'b');
  const overs = pose.rot ? [] : [].concat(P.over || []);
  const drawTorso = (rows) => {
    stamp(g, rows, hipX, hipY, tOx, tOy, 'torso', { shearTop: lean });
    if (chest) stamp(g, rows.slice(0, tH - 3), hipX, hipY - chest, tOx, tOy, 'torso', { shearTop: lean, shearRows: tH });
  };
  drawTorso(torsoRows);
  // badges, belts, cross-belts: drawn as the torso is, so they lean and breathe with it
  overs.filter((o) => o.torso).forEach((o) => drawTorso(o.rows));
  drawLeg(legF, 'f');
  // layers over the legs (a skirt, an apron, coat tails): the top stays on the hips, the hem lags
  const tr = pose.trail || 0;
  if (pose.torso !== 'front') for (const o of overs) if (!o.torso) stamp(g, o.rows, hipX + (o.trail ? tr : 0), hipY, o.ox, o.oy, 'over', { shearTop: o.trail ? -tr : 0 });
  const headRows = P.head[pose.head || 'base'] || P.head.base;
  const hDy = pose.headDy != null ? pose.headDy : pose.hips || 0;
  const headX = neck[0] + (pose.headDx || 0);
  const headY = M.hipY - tOy + P.neckAt[1] - hDy - (pose.lift || 0) - chest;
  const headFlip = !!pose.headFlip;
  stamp(g, headRows, headX, headY, P.headAnchor[0], P.headAnchor[1], 'head', { flip: headFlip });
  drawArm(armF, 'f');

  // the hat: its own layer (it lags a frame and takes the shop tint)
  let hatAttach = null;
  if (pose.hat !== false) {
    const h = typeof pose.hat === 'object' ? pose.hat : {};
    const rows = h.q ? rotRows(P.hat.rows, h.q) : P.hat.rows;
    const hx = headX + (h.dx || 0) + (headFlip ? -P.hat.flipShift : 0);
    const hy = headY + (h.dy || 0);
    stamp(hatG, rows, hx, hy, P.hat.ox, P.hat.oy, 'hat', { flip: headFlip });
    hatAttach = [hx, hy];
  }

  let body = g;
  let hat = hatG;
  const rot = pose.rot || 0;
  const pivot = pose.rotPivot === 'feet' ? [M.ax, M.sole + 1] : [hipX + 0.5, hipY + 0.5];
  if (rot) {
    body = rotateGrid(body, rot, pivot[0], pivot[1]);
    hat = rotateGrid(hat, rot, pivot[0], pivot[1]);
  }
  if (pose.shift) {
    body = translateGrid(body, pose.shift[0], pose.shift[1]);
    hat = translateGrid(hat, pose.shift[0], pose.shift[1]);
  }
  const rim = pose.rim ?? rig.rim;
  if (rim) rimPass(body, rig, rim);
  outline(body, 'k');
  outline(hat, 'k');

  const rp = (p) => {
    let [x, y] = p;
    if (rot) {
      const c = Math.cos((rot * Math.PI) / 180);
      const s = Math.sin((rot * Math.PI) / 180);
      const rx = x - pivot[0];
      const ry = y - pivot[1];
      x = pivot[0] + rx * c - ry * s;
      y = pivot[1] + rx * s + ry * c;
    }
    if (pose.shift) {
      x += pose.shift[0];
      y += pose.shift[1];
    }
    return [Math.round(x), Math.round(y)];
  };
  // contacts: a boot whose sole is on the ground (x relative to the anchor)
  const contact = (L) => (L.fh <= 0 && !rot ? Math.round(L.ankle[0] - M.ax) : null);
  return {
    body,
    hat,
    attach: {
      hand_f: rp(armF.end),
      hand_b: rp(armB.end),
      head: rp([headX, headY - 3]),
      hat: hatAttach ? rp(hatAttach) : null,
      mouth: rp([headX + 3, headY - 2]),
    },
    contacts: { f: contact(legF), b: contact(legB) },
  };
}
