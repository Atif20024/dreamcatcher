// RGBA images for the atlas build: create, blit, scale, trim, hash, pack.
import crypto from 'node:crypto';

export const image = (width, height) => ({ width, height, data: new Uint8Array(width * height * 4) });

export function setPx(img, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const o = (y * img.width + x) * 4;
  img.data[o] = (rgb >> 16) & 255;
  img.data[o + 1] = (rgb >> 8) & 255;
  img.data[o + 2] = rgb & 255;
  img.data[o + 3] = a;
}
export const alphaAt = (img, x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : img.data[(y * img.width + x) * 4 + 3]);

// src-over blit of a rect (alpha-aware; opaque pixels overwrite)
export function blit(dst, src, dx, dy, sx = 0, sy = 0, sw = src.width, sh = src.height, opts = {}) {
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      const so = ((sy + y) * src.width + sx + x) * 4;
      const a = src.data[so + 3];
      if (!a && !opts.copy) continue;
      const tx = dx + x, ty = dy + y;
      if (tx < 0 || ty < 0 || tx >= dst.width || ty >= dst.height) continue;
      const o = (ty * dst.width + tx) * 4;
      if (a === 255 || opts.copy || !dst.data[o + 3]) dst.data.set(src.data.subarray(so, so + 4), o);
      else {
        const k = a / 255;
        for (let c = 0; c < 3; c++) dst.data[o + c] = Math.round(src.data[so + c] * k + dst.data[o + c] * (1 - k));
        dst.data[o + 3] = Math.min(255, a + dst.data[o + 3]);
      }
    }
}

export function scaleNearest(src, k) {
  const out = image(src.width * k, src.height * k);
  for (let y = 0; y < out.height; y++)
    for (let x = 0; x < out.width; x++) {
      const so = (((y / k) | 0) * src.width + ((x / k) | 0)) * 4;
      out.data.set(src.data.subarray(so, so + 4), (y * out.width + x) * 4);
    }
  return out;
}

export function crop(src, x, y, w, h) {
  const out = image(w, h);
  blit(out, src, 0, 0, x, y, w, h, { copy: true });
  return out;
}

// the opaque bounding box, or null when empty
export function bbox(img) {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (img.data[(y * img.width + x) * 4 + 3]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export const hashImage = (img) => crypto.createHash('sha1').update(img.data).update(`${img.width}x${img.height}`).digest('hex');

// a shelf packer (sorted by height), 1 px padding plus 1 px edge extrusion
export function pack(items, maxW = 2048) {
  const PAD = 2;
  const sorted = [...items].sort((a, b) => b.img.height - a.img.height || b.img.width - a.img.width);
  let x = PAD, y = PAD, rowH = 0, W = 0;
  for (const it of sorted) {
    if (x + it.img.width + PAD > maxW) {
      x = PAD;
      y += rowH + PAD;
      rowH = 0;
    }
    it.x = x;
    it.y = y;
    x += it.img.width + PAD;
    rowH = Math.max(rowH, it.img.height);
    W = Math.max(W, x);
  }
  const H = y + rowH + PAD;
  const pow2 = (n) => 2 ** Math.ceil(Math.log2(Math.max(n, 1)));
  const sheet = image(pow2(W), pow2(H));
  for (const it of sorted) {
    blit(sheet, it.img, it.x, it.y, 0, 0, it.img.width, it.img.height, { copy: true });
    extrude(sheet, it);
  }
  return sheet;
}
// copy each frame's edge pixels one px outward so bilinear sampling or a
// sub-pixel camera never pulls in a neighbour (the padding is 2 px)
function extrude(sheet, it) {
  const { x, y } = it;
  const { width: w, height: h } = it.img;
  const cp = (fx, fy, tx, ty) => {
    const so = (fy * sheet.width + fx) * 4;
    sheet.data.set(sheet.data.subarray(so, so + 4), (ty * sheet.width + tx) * 4);
  };
  for (let i = 0; i < w; i++) {
    cp(x + i, y, x + i, y - 1);
    cp(x + i, y + h - 1, x + i, y + h);
  }
  for (let j = -1; j <= h; j++) {
    cp(x, Math.min(Math.max(y + j, y), y + h - 1), x - 1, y + j);
    cp(x + w - 1, Math.min(Math.max(y + j, y), y + h - 1), x + w, y + j);
  }
}
