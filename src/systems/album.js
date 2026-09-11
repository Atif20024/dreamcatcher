// A4.1 — the camera. A photo is a downscaled snapshot of the screen, kept in
// localStorage (cap 40, oldest first out). No targets, no score. The album
// lives in the pause menu; three random photos drift behind the last cards.
const KEY = 'dreamcatcher.album';
const CAP = 40;
const W = 240;
const H = 135;

export function loadAlbum() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveAlbum(list) {
  // a full localStorage should cost the oldest photos, not the save
  for (let n = list.length; n > 0; n--) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-n)));
      return;
    } catch {
      /* too big: drop one more of the oldest and retry */
    }
  }
}

export function takePhoto(scene, onDone) {
  try {
    scene.game.renderer.snapshot((img) => {
      try {
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, W, H);
        const url = c.toDataURL('image/jpeg', 0.78);
        const list = loadAlbum();
        list.push(url);
        while (list.length > CAP) list.shift();
        saveAlbum(list);
        if (onDone) onDone(url);
      } catch {
        if (onDone) onDone(null);
      }
    });
  } catch {
    if (onDone) onDone(null);
  }
}

// load photos as textures: resolves with the texture keys that made it
export function photoTextures(scene, urls) {
  return Promise.all(
    urls.map(
      (url, i) =>
        new Promise((res) => {
          const key = `ev-photo-${hash(url)}-${i}`;
          if (scene.textures.exists(key)) return res(key);
          const img = new Image();
          img.onload = () => {
            try {
              if (!scene.textures.exists(key)) scene.textures.addImage(key, img);
              res(key);
            } catch {
              res(null);
            }
          };
          img.onerror = () => res(null);
          img.src = url;
        })
    )
  ).then((keys) => keys.filter(Boolean));
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 97) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function randomPhotos(n = 3) {
  const list = loadAlbum();
  const out = [];
  const pool = [...list];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
