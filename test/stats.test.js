import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addHistory, expertStats, statsLine } from '../src/stats.js';

const card = (id, agentId, status, mins, round = 0) => ({ id, agentId, name: agentId.toUpperCase(), status, round, startedAt: 0, endAt: mins * 60_000 });

test('uzman istatistiği: bitti / düzeltilmeli / hata / tur / ortalama süre', () => {
  const s = expertStats([card('1', 'fe', 'done', 2), card('2', 'fe', 'done', 4, 1), card('3', 'fe', 'needs-work', 6, 2), card('4', 'be', 'failed', 1)]);
  const fe = s.get('fe');
  assert.deepEqual([fe.total, fe.done, fe.needsWork, fe.failed, fe.redo], [3, 2, 1, 0, 3]);
  assert.equal(fe.avgMs, 4 * 60_000);
  assert.equal(Math.round(fe.successRate * 100), 67);
  assert.match(statsLine(fe), /3 görev.*%67 başarı.*ort 4 dk/);
  assert.equal(statsLine(undefined), '');
});

test('geçmiş: yalnız bitmiş kartlar, aynı id bir kez, sınırlı', () => {
  let h = [];
  h = addHistory(h, [card('1', 'fe', 'done', 1), { id: '2', status: 'doing' }]);
  h = addHistory(h, [card('1', 'fe', 'done', 1)]);
  assert.deepEqual(h.map((c) => c.id), ['1']);
  h = addHistory(h, Array.from({ length: 10 }, (_, i) => card(`x${i}`, 'fe', 'done', 1)), 5);
  assert.equal(h.length, 5);
});

test('uygulama kapandı / iptal edildi kartları uzman başarısını etkilemez', () => {
  const h = addHistory([], [{ id: 'a', agentId: 'fe', status: 'failed', error: 'uygulama kapandı' }, { id: 'b', agentId: 'fe', status: 'failed', error: 'iptal edildi' }, { id: 'c', agentId: 'fe', status: 'failed', error: 'çöktü' }]);
  assert.deepEqual(h.map((c) => c.id), ['c']);
});
