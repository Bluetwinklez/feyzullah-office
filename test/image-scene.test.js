import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMG, SPOTS, advancePx, newActorPx, targetPx } from '../renderer/image-scene.js';

test('görsel sahne: 10 masa, oturma ve mutfak noktaları görselin içinde', () => {
  assert.equal(SPOTS.desks.length, 10);
  for (const s of [...SPOTS.desks, ...SPOTS.lounge, ...SPOTS.kitchen]) {
    assert.ok(s.pos[0] > 0 && s.pos[0] < IMG.w && s.pos[1] > 0 && s.pos[1] < IMG.h, `dışarıda: ${s.pos}`);
  }
  assert.ok(SPOTS.lounge.length >= 6);
});

test('hedefler: masa, ayakta, koltuk; koltuklar dolunca mutfak', () => {
  assert.deepEqual(targetPx({ place: 'desk', desk: 3 }).pos, SPOTS.desks[3].pos);
  assert.notDeepEqual(targetPx({ place: 'standing', desk: 3 }).pos, SPOTS.desks[3].pos);
  const all = SPOTS.lounge.length + SPOTS.kitchen.length;
  const seen = new Set();
  for (let i = 0; i < all; i++) seen.add(targetPx({ place: 'lounge', activity: 'idle' }, i).pos.join(','));
  assert.equal(seen.size, all);
});

test('yürüme: yol ağı üzerinden hedefe varır, varınca hedef yöne bakar', () => {
  for (const goal of [SPOTS.desks[0], SPOTS.desks[9], SPOTS.lounge[0], SPOTS.kitchen[0]]) {
    let a = newActorPx(SPOTS.door);
    for (let i = 0; i < 4000 && !a.arrived; i++) a = advancePx(a, goal, 50);
    assert.ok(a.arrived, `varamadı: ${goal.pos}`);
    assert.deepEqual([a.x, a.y], goal.pos);
    assert.equal(a.dir, goal.face);
  }
});

test('gerçekçi sahne: 10 masa, hepsinde ekran (yönetici hariç), her noktaya kapıdan ulaşılır', async () => {
  const { REAL } = await import('../renderer/image-scene.js');
  assert.ok(REAL);
  assert.equal(REAL.SPOTS.desks.length, 10);
  assert.ok(REAL.SPOTS.desks.slice(0, 9).every((d) => d.screen), 'çalışan masalarında ekran var');
  for (const goal of [...REAL.SPOTS.desks, ...REAL.SPOTS.lounge, ...REAL.SPOTS.kitchen]) {
    assert.ok(goal.pos[0] > 0 && goal.pos[0] < REAL.IMG.w && goal.pos[1] > 0 && goal.pos[1] < REAL.IMG.h);
    let a = REAL.newActorPx(REAL.SPOTS.door);
    for (let i = 0; i < 4000 && !a.arrived; i++) a = REAL.advancePx(a, goal, 50);
    assert.ok(a.arrived, `varamadı: ${goal.pos}`);
  }
});

test('piksel (düz) sahne: 12 masa, üst sıra dolu; hepsine kapıdan ulaşılır', async () => {
  const { PIXEL2 } = await import('../renderer/image-scene.js');
  assert.equal(PIXEL2.SPOTS.desks.length, 12);
  for (const goal of PIXEL2.SPOTS.desks) {
    let a = PIXEL2.newActorPx(PIXEL2.SPOTS.door);
    for (let i = 0; i < 4000 && !a.arrived; i++) a = PIXEL2.advancePx(a, goal, 50);
    assert.ok(a.arrived);
  }
});

test('genişletilmiş görsel: pad yüksekliğe eklenir, tüm koordinatlar üst pay kadar aşağı kayar', async () => {
  const { makeScene, PIXEL2_DEF } = await import('../renderer/image-scene.js');
  const flat = makeScene({ ...PIXEL2_DEF, pad: undefined });
  const wide = makeScene(PIXEL2_DEF);
  const [top, bottom] = PIXEL2_DEF.pad;
  assert.equal(wide.IMG.h, flat.IMG.h + top + bottom);
  wide.SPOTS.desks.forEach((d, i) => {
    assert.deepEqual(d.pos, [flat.SPOTS.desks[i].pos[0], flat.SPOTS.desks[i].pos[1] + top]);
    if (d.screen) assert.equal(d.screen[1], flat.SPOTS.desks[i].screen[1] + top);
  });
  assert.equal(wide.BOARD[1], flat.BOARD[1] + top);
  assert.equal(wide.OCCLUDERS[0].rect[1], flat.OCCLUDERS[0].rect[1] + top);
  assert.equal(wide.OCCLUDERS[0].rect[3], flat.OCCLUDERS[0].rect[3]);
});
