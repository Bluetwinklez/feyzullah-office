import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catPos, createEvents, flickerDark } from '../renderer/events.js';

test('olaylar: ilk olay gecikmeyle başlar, süresi dolunca biter, kapalıyken olmaz', () => {
  let r = 0;
  const ev = createEvents({ rand: () => r, first: 1000, gap: [5000, 5000] });
  assert.equal(ev.tick(0).length, 0);
  const a = ev.tick(1000);
  assert.deepEqual(a.map((e) => e.kind), ['pizza']);
  assert.equal(ev.tick(1000 + 90_001)[0].start, 91_001, 'eski pizza bitti, sıradaki olay başladı');
  r = 0.99;
  assert.equal(ev.tick(200_000)[0].kind, 'flicker');
  assert.equal(ev.tick(200_100, false).length, 0);
});

test('kedi noktalar arasında yürür, sonra oturur; elektrik dalgalanması kısa', () => {
  const e = { kind: 'cat', start: 0, end: 120_000 };
  const pts = [[0, 0], [100, 0]];
  assert.equal(catPos(e, 0, pts).x, 0);
  assert.ok(catPos(e, 2000, pts).walking);
  const sit = catPos(e, 5000, pts);
  assert.equal(sit.x, 100); assert.equal(sit.walking, false);
  assert.ok(flickerDark({ start: 0, end: 1800 }, 0) > 0);
});
