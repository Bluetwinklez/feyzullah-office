import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daylight, sunTimes } from '../src/sun.js';
import { findPath } from '../src/pathing.js';

const near = (actual, expectedIso, min = 12) => assert.ok(Math.abs(actual - Date.parse(expectedIso)) < min * 60_000, `${new Date(actual).toISOString()} ≉ ${expectedIso}`);

test('İstanbul gün doğumu/batımı (yaz ve kış gündönümü)', () => {
  const j = sunTimes(Date.parse('2026-06-21T12:00:00Z'), 41.01, 28.98);
  near(j.sunrise, '2026-06-21T02:32:00Z');
  near(j.sunset, '2026-06-21T17:39:00Z');
  const d = sunTimes(Date.parse('2026-12-21T12:00:00Z'), 41.01, 28.98);
  near(d.sunrise, '2026-12-21T05:25:00Z');
  near(d.sunset, '2026-12-21T14:39:00Z');
});

test('ışık: öğlen 1, gece yarısı 0, gün batımında arada', () => {
  assert.equal(daylight(Date.parse('2026-06-21T10:00:00Z'), 41.01, 28.98), 1);
  assert.equal(daylight(Date.parse('2026-06-21T22:00:00Z'), 41.01, 28.98), 0);
  const dusk = daylight(Date.parse('2026-06-21T17:39:00Z'), 41.01, 28.98);
  assert.ok(dusk > 0 && dusk < 1);
});

test('yol bulma: engelin etrafından en kısa yol; yol yoksa null', () => {
  const grid = [
    '.....',
    '.###.',
    '.....',
  ].map((r) => [...r].map((c) => c === '.'));
  const p = findPath(grid, [0, 1], [4, 1]);
  assert.deepEqual(p[0], [0, 1]);
  assert.deepEqual(p.at(-1), [4, 1]);
  assert.equal(p.length, 7);
  assert.ok(p.every(([x, y]) => grid[y][x]));
  const blocked = [[true, false, true]];
  assert.equal(findPath(blocked, [0, 0], [2, 0]), null);
});
