// Round 2 WP6 (critique §9 "Jo anchor"): how much Jo stands out of the place
// behind him. Two snapshots of the canvas, Jo shown and Jo hidden; the
// pixels that changed are Jo. His mean luminance is compared with the mean
// of the 120 × 120 px box behind him (WCAG contrast ratio).
function lum(r, g, b) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

async function pixels(dc) {
  const src = await dc.snap();
  const img = new Image();
  await new Promise((r) => {
    img.onload = r;
    img.src = src;
  });
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
}

export async function joContrast(dc, sc) {
  const p = sc.player;
  const cam = sc.cameras.main;
  // Jo drawn, then Jo at alpha 0 (his body, hat, tool, rim and ink line go;
  // the light he stands in and the place behind him stay)
  // (the moving film grain is held off for both, so only Jo differs)
  const grain = sc.look && sc.look.grain;
  const grainWas = grain ? grain.visible : false;
  if (grain) grain.setVisible(false);
  const A = await pixels(dc);
  const alphaWas = p.alpha;
  p.setAlpha(0);
  const B = await pixels(dc);
  p.setAlpha(alphaWas);
  if (grain) grain.setVisible(grainWas);
  dc.step(1);
  // Jo's body centre on the canvas (the canvas is 960 × 540 at zoom 1)
  const sx = A.w / cam.width;
  const f = p.feet();
  // only pixels inside his drawn bounds can be Jo (people walk past)
  const bb = p.art.getBounds();
  const bx0 = ((bb.x - 3 - cam.worldView.x) * cam.zoom) * sx;
  const bx1 = ((bb.right + 3 - cam.worldView.x) * cam.zoom) * sx;
  const by0 = ((bb.y - 14 - cam.worldView.y) * cam.zoom) * sx;
  const by1 = ((bb.bottom + 3 - cam.worldView.y) * cam.zoom) * sx;
  const inJo = (x, y) => x >= bx0 && x <= bx1 && y >= by0 && y <= by1;
  const cx = ((f.x - cam.worldView.x) * cam.zoom) * sx;
  const cy = ((f.y - 38 - cam.worldView.y) * cam.zoom) * sx;
  const half = 60 * sx;
  let joL = 0;
  let joN = 0;
  let bgL = 0;
  let bgN = 0;
  for (let y = Math.max(0, Math.round(cy - half)); y < Math.min(A.h, Math.round(cy + half)); y++) {
    for (let x = Math.max(0, Math.round(cx - half)); x < Math.min(A.w, Math.round(cx + half)); x++) {
      const i = (y * A.w + x) * 4;
      const la = lum(A.data[i], A.data[i + 1], A.data[i + 2]);
      const lb = lum(B.data[i], B.data[i + 1], B.data[i + 2]);
      bgL += lb;
      bgN += 1;
      const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]);
      if (d > 24 && inJo(x, y)) {
        joL += la;
        joN += 1;
      }
    }
  }
  if (!joN || !bgN) return { ratio: 0, joPx: joN };
  const lj = joL / joN;
  const lb = bgL / bgN;
  const ratio = (Math.max(lj, lb) + 0.05) / (Math.min(lj, lb) + 0.05);
  // the silhouette: every Jo pixel with a non-Jo neighbour, against the
  // place's mean behind him (what the eye reads at speed is his outline)
  const isJo = (x, y) => {
    const i = (y * A.w + x) * 4;
    return inJo(x, y) && Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 24;
  };
  const edge = [];
  const local = [];
  const x0 = Math.max(1, Math.round(cx - half));
  const x1 = Math.min(A.w - 1, Math.round(cx + half));
  const y0 = Math.max(1, Math.round(cy - half));
  const y1 = Math.min(A.h - 1, Math.round(cy + half));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (!isJo(x, y)) continue;
      if (isJo(x - 1, y) && isJo(x + 1, y) && isJo(x, y - 1) && isJo(x, y + 1)) continue;
      const i = (y * A.w + x) * 4;
      const l = lum(A.data[i], A.data[i + 1], A.data[i + 2]);
      edge.push((Math.max(l, lb) + 0.05) / (Math.min(l, lb) + 0.05));
      const lo = lum(B.data[i], B.data[i + 1], B.data[i + 2]);
      local.push((Math.max(l, lo) + 0.05) / (Math.min(l, lo) + 0.05));
    }
  }
  edge.sort((a, b) => a - b);
  local.sort((a, b) => a - b);
  const pct = (q, arr = edge) => (arr.length ? +arr[Math.floor((arr.length - 1) * q)].toFixed(2) : 0);
  return { ratio: +ratio.toFixed(2), edgeMedian: pct(0.5), edgeP75: pct(0.75), localMedian: pct(0.5, local), jo: +lj.toFixed(3), bg: +lb.toFixed(3), joPx: joN, edgePx: edge.length };
}
