// Off-screen objects skip the renderer. Phaser pushes every display-list object
// into the sprite batch, on screen or not (SPEED_REPORT: 4205 of the moon's 4492
// objects). This filters the render list only: `visible` and the display list
// are untouched, so game code reads what it always read.

const MARGIN = 64; // covers shake, and art drawn past its own frame

// only flat, unrotated, unparented kinds whose box is displayWidth × displayHeight
const CULLABLE = new Set(['Image', 'Sprite', 'Rectangle', 'Arc', 'Ellipse', 'RenderTexture']);

export function isOffscreen(o, v, margin = MARGIN) {
  if (!CULLABLE.has(o.type) || o._rotation !== 0 || o._scaleX < 0 || o._scaleY < 0 || o.scrollFactorX !== 1 || o.scrollFactorY !== 1) return false;
  // raw fields, not the displayWidth/rotation getters: half the cost over 4500 objects
  const w = o.width * o._scaleX;
  const h = o.height * o._scaleY;
  const x0 = o.x - o.originX * w;
  const y0 = o.y - o.originY * h;
  return x0 > v.right + margin || x0 + w < v.x - margin || y0 > v.bottom + margin || y0 + h < v.y - margin;
}

// CameraManager.render calls this right after camera.preRender, so worldView is this frame's
export function installOffscreenCull(CameraManager) {
  CameraManager.prototype.getVisibleChildren = function (children, camera) {
    const v = camera.worldView;
    const out = [];
    for (let i = 0; i < children.length; i++) {
      const o = children[i];
      if (o.willRender(camera) && !isOffscreen(o, v)) out.push(o);
    }
    return out;
  };
}
