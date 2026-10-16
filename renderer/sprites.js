// Karakter görselleri: piksel paketinin (assets/packs/<ad>) kıyafet + saç katmanları; gövde/ten
// katmanı pakette yoksa kodla çizilir. Paket yüklenemezse tamamen kodla çizilmiş karakter.
const DIRS = ['down', 'right', 'up', 'left'];
const SKINS = ['#f2c9a0', '#e0ac7e', '#c68955', '#9a6440', '#f6d7b8'];

const loadImg = (src) => new Promise((resolve, reject) => {
  const i = new Image();
  i.onload = () => resolve(i);
  i.onerror = () => reject(new Error(`görsel yüklenemedi: ${src}`));
  i.src = src;
});

export async function loadPack(name) {
  if (!name || name === 'procedural') return null;
  try {
    const base = `../assets/packs/${name}/`;
    const m = (await import(`${base}manifest.json`, { with: { type: 'json' } })).default;
    const suits = [];
    for (const s of m.layers.suit ?? []) {
      const img = await loadImg(base + s.sheet);
      for (let r = 0; r < s.rows; r++) suits.push({ img, row: r, hat: s.sheet === 'Suit.png' });
    }
    const hairs = [];
    for (const h of m.layers.hair ?? []) {
      const img = await loadImg(base + h.sheet);
      for (let r = 0; r < h.rows; r++) if (r !== 1) hairs.push({ img, row: r }); // 1. satır yalnız favori
    }
    const body = m.layers.body ? { img: await loadImg(base + m.layers.body.sheet), rows: m.layers.body.rows ?? 1 } : null;
    return { frame: m.frame ?? 32, per: m.framesPerDirection ?? 6, suits, hairs, body };
  } catch (err) {
    console.warn('paket yüklenemedi, kodla çizilen karakterler kullanılacak:', err.message);
    return null;
  }
}

function hash(str) {
  let h = 2166136261;
  for (const c of String(str)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Oturum anahtarından kalıcı görünüm. */
export function lookFor(key, pack) {
  const h = hash(key);
  const skin = SKINS[h % SKINS.length];
  if (!pack) return { skin, shirt: `hsl(${h % 360} 55% 45%)`, hair: `hsl(${(h >>> 8) % 40 + 15} 45% ${20 + (h % 30)}%)` };
  const suit = pack.suits[(h >>> 3) % pack.suits.length];
  const hair = suit.hat ? null : pack.hairs[(h >>> 7) % pack.hairs.length];
  const body = pack.body ? (h >>> 11) % pack.body.rows : null;
  return { skin, suit, hair, body };
}

/** Pakette gövde yoksa ten: baş, boyun, eller (32×32 karede, katmanların altında). */
function drawSkin(ctx, x, y, dir, skin) {
  ctx.fillStyle = skin;
  ctx.fillRect(x + 10, y + 6, 12, 11); // baş
  ctx.fillRect(x + 9, y + 8, 14, 7);
  ctx.fillRect(x + 13, y + 17, 6, 2); // boyun
  if (dir === 'down' || dir === 'up') { ctx.fillRect(x + 8, y + 22, 2, 3); ctx.fillRect(x + 22, y + 22, 2, 3); }
  else ctx.fillRect(x + (dir === 'right' ? 18 : 12), y + 23, 3, 3);
  ctx.fillStyle = '#2a1d17';
  if (dir === 'down') { ctx.fillRect(x + 13, y + 14, 2, 2); ctx.fillRect(x + 17, y + 14, 2, 2); }
  else if (dir === 'right') ctx.fillRect(x + 19, y + 14, 2, 2);
  else if (dir === 'left') ctx.fillRect(x + 11, y + 14, 2, 2);
}

/** Paketsiz karakter: basit piksel insan. */
function drawSimple(ctx, x, y, dir, look, frame) {
  const leg = frame % 2 ? 1 : 0;
  ctx.fillStyle = '#2b2f3a';
  ctx.fillRect(x + 12, y + 25 + leg, 3, 5); ctx.fillRect(x + 17, y + 25 + (1 - leg), 3, 5);
  ctx.fillStyle = look.shirt;
  ctx.fillRect(x + 10, y + 17, 12, 9);
  drawSkin(ctx, x, y, dir, look.skin);
  ctx.fillStyle = look.hair;
  ctx.fillRect(x + 9, y + 4, 14, dir === 'up' ? 11 : 5);
}

/**
 * Karakteri (sol üst x, y; dünya pikseli) çizer. frame: 0..per-1 (0 = duruş).
 */
export function drawCharacter(ctx, pack, look, x, y, dir, frame) {
  x = Math.round(x); y = Math.round(y);
  if (!pack) { drawSimple(ctx, x, y, dir, look, frame); return; }
  const F = pack.frame;
  const col = DIRS.indexOf(dir) * pack.per + (frame % pack.per);
  if (pack.body) ctx.drawImage(pack.body.img, col * F, look.body * F, F, F, x, y, F, F);
  else drawSkin(ctx, x, y, dir, look.skin);
  ctx.drawImage(look.suit.img, col * F, look.suit.row * F, F, F, x, y, F, F);
  if (look.hair) ctx.drawImage(look.hair.img, col * F, look.hair.row * F, F, F, x, y, F, F);
}
