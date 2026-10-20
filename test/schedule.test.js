import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSchedule, parseAt, isDue } from '../src/schedule.js';

const NOW = new Date(2026, 9, 16, 10, 0).getTime();

test('parseAt: "HH:MM" bugünün o saati, geçtiyse yarın; geçersiz → null', () => {
  assert.equal(parseAt('12:30', NOW), new Date(2026, 9, 16, 12, 30).getTime());
  assert.equal(parseAt('09:15', NOW), new Date(2026, 9, 17, 9, 15).getTime());
  assert.equal(parseAt('25:00', NOW), null);
  assert.equal(parseAt('abc', NOW), null);
});

test('failed dispatches remain queued while accepted commands are removed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-sch-retry-'));
  let accept = false;
  const schedule = await createSchedule({ dir, now: () => NOW, send: (text) => {
    if (text === 'throw' && !accept) throw new Error('unavailable');
    return { ok: accept || text === 'accepted' };
  } });
  for (const text of ['reject', 'throw', 'accepted']) schedule.add({ text, whenLimit: true });
  assert.deepEqual(schedule.tick().map((x) => x.text), ['accepted']);
  await schedule.flush();
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'ofis-schedule.json'), 'utf8')).map((x) => x.text), ['reject', 'throw']);
  accept = true;
  assert.equal(schedule.tick().length, 2);
  await schedule.flush();
  assert.equal(schedule.list().length, 0);
});

test('isDue: saatli komut zamanı gelince; limit komutu motorlar açık ve Claude düşük değilse', () => {
  assert.equal(isDue({ at: NOW + 1000 }, { now: NOW }), false);
  assert.equal(isDue({ at: NOW }, { now: NOW }), true);
  assert.equal(isDue({ whenLimit: true }, { now: NOW, down: { codex: NOW + 5000 } }), false);
  assert.equal(isDue({ whenLimit: true }, { now: NOW, down: {}, claudeLow: true }), false);
  assert.equal(isDue({ whenLimit: true }, { now: NOW, down: {} }), true);
  // saat + limit birlikte: ikisi de sağlanmalı
  assert.equal(isDue({ at: NOW - 1, whenLimit: true }, { now: NOW, down: { codex: NOW + 1 } }), false);
});

test('createSchedule: ekle, kalıcı sakla, zamanı gelince bir kez gönder ve listeden düş', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-sch-'));
  const sent = [];
  let now = NOW;
  const s = await createSchedule({ dir, now: () => now, send: (text, opts) => { sent.push([text, opts.direct]); return { ok: true }; } });
  assert.equal(s.add({ text: '  ', at: '12:00' }).ok, false);
  assert.equal(s.add({ text: 'x' }).ok, false); // ne saat ne limit
  assert.equal(s.add({ text: 'x', at: '99:99' }).ok, false);
  const a = s.add({ text: 'aşama 4', at: '10:30', direct: true });
  const b = s.add({ text: 'limit işi', whenLimit: true });
  assert.ok(a.ok && b.ok);
  assert.equal(s.list().length, 2);
  await s.flush();
  assert.equal(JSON.parse(await readFile(join(dir, 'ofis-schedule.json'), 'utf8')).length, 2);

  s.tick({ down: { codex: NOW + 60_000 } });
  assert.deepEqual(sent, []);
  now = NOW + 31 * 60_000;
  s.tick({ down: { codex: NOW + 60 * 60_000 } });
  assert.deepEqual(sent, [['aşama 4', true]]);
  s.tick({ down: {} });
  assert.deepEqual(sent, [['aşama 4', true], ['limit işi', false]]);
  assert.equal(s.list().length, 0);
  s.tick({ down: {} });
  assert.equal(sent.length, 2);

  // yeniden açılışta kayıtlar geri gelir; silme çalışır
  const c = s.add({ text: 'yarın', at: '08:00' });
  await s.flush();
  const s2 = await createSchedule({ dir, now: () => now, send: () => ({ ok: true }) });
  assert.equal(s2.list().length, 1);
  assert.equal(s2.remove(c.item.id).ok, true);
  assert.equal(s2.list().length, 0);
});

test('createSchedule: en çok 20 bekleyen komut', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-sch-'));
  const s = await createSchedule({ dir, now: () => NOW, send: () => ({ ok: true }) });
  for (let i = 0; i < 20; i++) assert.ok(s.add({ text: `k${i}`, whenLimit: true }).ok);
  assert.equal(s.add({ text: 'fazla', whenLimit: true }).ok, false);
});
