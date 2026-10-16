import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, LAYOUT, ROWS, advance, newActor, targetFor } from '../renderer/scene-logic.js';

const walkable = ([x, y]) => LAYOUT.walk[y]?.[x] === true;

test('yerleşim: 28×16, 10 masa; sandalye/koltuk/mutfak noktaları yürünebilir, masalar engel', () => {
  assert.equal(COLS, 28); assert.equal(ROWS, 16);
  assert.equal(LAYOUT.desks.length, 10);
  for (const d of LAYOUT.desks) {
    assert.ok(walkable(d.chair), `sandalye ${d.chair}`);
    assert.ok(walkable(d.stand), `ayakta ${d.stand}`);
    assert.equal(LAYOUT.walk[d.y][d.x], false, 'masa engel');
  }
  for (const s of [...LAYOUT.lounge, ...LAYOUT.kitchen]) assert.ok(walkable(s.tile), `nokta ${s.tile}`);
  assert.ok(LAYOUT.lounge.length >= 7);
  // her nokta kapıdan ulaşılabilir
  for (const d of LAYOUT.desks) {
    let a = newActor(LAYOUT.door);
    for (let i = 0; i < 3000 && !a.arrived; i++) a = advance(a, { tile: d.chair, face: d.face }, 50);
    assert.ok(a.arrived, `ulaşılamadı: masa ${d.x},${d.y}`);
  }
});

test('hedefler: masa yönü masaya göre; karşılıklı grupta üst sıra aşağı bakar', () => {
  const up = LAYOUT.desks.findIndex((d) => d.face === 'up');
  const down = LAYOUT.desks.findIndex((d) => d.face === 'down');
  assert.ok(up >= 0 && down >= 0);
  assert.equal(targetFor({ place: 'desk', desk: down }, 0).face, 'down');
  assert.deepEqual(targetFor({ place: 'desk', desk: up }, 0).tile, LAYOUT.desks[up].chair);
  const a = targetFor({ place: 'lounge', activity: 'idle' }, 0, 0, 0);
  const b = targetFor({ place: 'lounge', activity: 'idle' }, 1, 0, 0);
  assert.notDeepEqual(a.tile, b.tile);
  assert.equal(targetFor({ place: 'standing', desk: 2 }, 0).face, 'down');
});

test('dinlenen ajan zaman zaman mutfağa kahveye gider, sonra koltuğuna döner', () => {
  const agent = { place: 'lounge', activity: 'resting' };
  const spots = new Set();
  for (let t = 0; t < 200_000; t += 1000) spots.add(targetFor(agent, 0, t, 3).tile.join(','));
  assert.ok([...spots].some((s) => LAYOUT.kitchen.some((k) => k.tile.join(',') === s)), 'mutfağa gitmeli');
  assert.ok(spots.has(LAYOUT.lounge[0].tile.join(',')), 'koltuğa dönmeli');
});

test('yürüme: engellere girmeden hedefe varır', () => {
  let actor = newActor(LAYOUT.door);
  const target = targetFor({ place: 'desk', desk: 0 }, 0);
  for (let i = 0; i < 3000 && !actor.arrived; i++) {
    actor = advance(actor, target, 50);
    assert.ok(walkable([Math.round(actor.x), Math.round(actor.y)]));
  }
  assert.ok(actor.arrived);
  assert.equal(actor.dir, target.face);
});

test('koltuklar dolunca boştakiler mutfak taburelerine oturur (aynı yere iki kişi oturmaz)', () => {
  const total = LAYOUT.lounge.length + LAYOUT.kitchen.length;
  const spots = new Set();
  for (let i = 0; i < total; i++) spots.add(targetFor({ place: 'lounge', activity: 'idle' }, i).tile.join(','));
  assert.equal(spots.size, total);
});
