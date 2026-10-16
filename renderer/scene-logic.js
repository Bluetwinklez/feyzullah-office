// Sahne mantığı (saf; tarayıcıda ve Node testlerinde çalışır): ofis yerleşimi, karakter hedefi
// (masa / koltuk / mutfak / ayakta) ve ızgara üzerinde yürüme.
//
// Oda 28×16 kare (32 px). Arka duvar y 0..2. Sol üstte karşılıklı 6'lı masa grubu, altında 3 tekli
// masa, sağ üstte köşe masası; ortada "CODE & CHILL" dinlenme köşesi, sağda mutfak.
import { findPath } from '../src/pathing.js';

export const TILE = 32;
export const COLS = 28;
export const ROWS = 16;
const SPEED = 3; // kare/sn

function buildLayout() {
  const walk = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => y >= 3 && x >= 1));
  const block = (x, y) => { if (walk[y]?.[x] !== undefined) walk[y][x] = false; };
  const desk = (x, y, face) => {
    [x - 1, x, x + 1].forEach((bx) => block(bx, y));
    const cy = face === 'down' ? y - 1 : y + 1;
    return { x, y, face, chair: [x, cy], stand: [x + 2, cy] };
  };
  const desks = [
    // karşılıklı grup: üst sıra aşağı bakar (yüzleri görünür), alt sıra yukarı (ekranlar görünür)
    desk(4, 5, 'down'), desk(7, 5, 'down'), desk(10, 5, 'down'),
    desk(4, 6, 'up'), desk(7, 6, 'up'), desk(10, 6, 'up'),
    // tekli masalar
    desk(4, 10, 'up'), desk(9, 10, 'up'), desk(6, 13, 'up'),
    // köşe masası
    desk(24, 4, 'up'),
  ];
  // Alçak tuğla bölme (neon tabela) ve mutfak arka duvarı
  for (let x = 14; x <= 27; x++) block(x, 7);
  // Dinlenme köşesi: sehpa engel; kanepe ve koltuklar oturulabilir
  block(16, 10); block(17, 10);
  const lounge = [
    { tile: [15, 8], face: 'down' }, { tile: [17, 8], face: 'down' }, { tile: [16, 8], face: 'down' }, { tile: [18, 8], face: 'down' },
    { tile: [14, 10], face: 'right' }, { tile: [19, 10], face: 'left' },
    { tile: [15, 12], face: 'up' }, { tile: [18, 12], face: 'up' },
  ];
  // Mutfak: tezgâh, buzdolabı, sebil, bar masası engel; tezgâh önü ve bar tabureleri durulabilir
  for (let x = 21; x <= 25; x++) block(x, 8);
  block(26, 8); block(27, 8); block(27, 10);
  for (let x = 22; x <= 24; x++) block(x, 11);
  const kitchen = [
    { tile: [22, 9], face: 'up' }, { tile: [24, 9], face: 'up' },
    { tile: [22, 12], face: 'up' }, { tile: [23, 12], face: 'up' }, { tile: [24, 12], face: 'up' },
  ];
  // Dekor: bitkiler, çöp kutusu
  for (const [x, y] of [[13, 7], [1, 4], [26, 13], [21, 14], [12, 3], [1, 12], [1, 14]]) block(x, y);
  block(11, 14);
  return { walk, desks, lounge, kitchen, door: [14, 15], rug: { cx: 16.5, cy: 10.5, r: 3.2 } };
}

export const LAYOUT = buildLayout();

/**
 * Karakterin durduğu yer: { tile, face }. index: aynı yerdekiler arasında sırası;
 * t, seed: dinlenenlerin ara sıra mutfağa gidip dönmesi için (saf; aynı girdi aynı sonuç).
 */
export function targetFor(agent, index = 0, t = 0, seed = 0) {
  if (agent.place === 'desk' && agent.desk != null) { const d = LAYOUT.desks[agent.desk]; return { tile: d.chair, face: d.face }; }
  if (agent.place === 'standing') {
    if (agent.desk != null) return { tile: LAYOUT.desks[agent.desk].stand, face: 'down' };
    return { tile: [2 + (index % 10), 15], face: 'down' }; // boş masa yok: koridorda bekler
  }
  // Dinlenen: her ~30 sn'lik dilimlerin üçte birinde mutfakta (kahve), sonra koltuğuna döner.
  if (agent.activity === 'resting' && Math.floor((t / 1000 + seed * 13) / 30) % 3 === 1) {
    return LAYOUT.kitchen[index % LAYOUT.kitchen.length];
  }
  // Koltuklar dolunca mutfak tabureleri; ikisi de dolarsa başa dön.
  const seats = [...LAYOUT.lounge, ...LAYOUT.kitchen];
  return seats[index % seats.length];
}

export function newActor([x, y]) {
  return { x, y, dir: 'down', walking: false, arrived: false, path: null, goal: null, step: 0 };
}

/** dt ms kadar ilerletir; yeni actor nesnesi döner. */
export function advance(actor, target, dt) {
  const a = { ...actor };
  const goal = target.tile.join(',');
  if (a.goal !== goal) {
    const from = [Math.round(a.x), Math.round(a.y)];
    a.path = findPath(LAYOUT.walk, from, target.tile) ?? [target.tile];
    a.goal = goal;
    a.arrived = false;
  }
  let budget = (SPEED * dt) / 1000;
  while (budget > 0 && a.path.length) {
    const [nx, ny] = a.path[0];
    const dx = nx - a.x;
    const dy = ny - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= budget) {
      a.x = nx; a.y = ny; budget -= dist; a.path = a.path.slice(1);
    } else {
      a.x += (dx / dist) * budget; a.y += (dy / dist) * budget; budget = 0;
    }
    if (dist > 0) a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  if (!a.path.length) {
    a.x = target.tile[0]; a.y = target.tile[1];
    a.walking = false; a.arrived = true; a.dir = target.face;
  } else {
    a.walking = true;
    a.step += dt;
  }
  return a;
}
