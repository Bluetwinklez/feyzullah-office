import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approvalNotice, boardNotices } from '../src/notify.js';

test('pano bildirimi: yalnız bitme / düzeltilmeli / hata geçişlerinde, bir kez', () => {
  const seen = new Map();
  assert.deepEqual(boardNotices(seen, [{ id: 'a', status: 'doing', name: 'FE', title: 'Sayfa' }]), []);
  const n = boardNotices(seen, [{ id: 'a', status: 'done', name: 'FE', title: 'Sayfa' }]);
  assert.equal(n.length, 1);
  assert.match(n[0].title, /bitti/);
  assert.match(n[0].body, /FE/);
  assert.match(n[0].speak, /FE/);
  assert.deepEqual(boardNotices(seen, [{ id: 'a', status: 'done', name: 'FE', title: 'Sayfa' }]), []);
  assert.match(boardNotices(seen, [{ id: 'b', status: 'needs-work', name: 'X', title: 'T' }])[0].title, /düzelt/i);
  assert.match(boardNotices(seen, [{ id: 'c', status: 'failed', name: 'X', title: 'T', error: 'çöktü' }])[0].body, /çöktü/);
});

test('ilk yüklemede eski kartlar için bildirim yok', () => {
  const seen = new Map();
  boardNotices(seen, [{ id: 'old', status: 'done', name: 'A', title: 'x' }], { silent: true });
  assert.deepEqual(boardNotices(seen, [{ id: 'old', status: 'done', name: 'A', title: 'x' }]), []);
});

test('izin bildirimi', () => {
  const n = approvalNotice({ agent: 'claude', tool: 'Bash', title: 'npm publish', cwd: 'C:/p/site' }, 'Backend Architect');
  assert.match(n.title, /izin/i);
  assert.match(n.body, /npm publish/);
  assert.match(n.speak, /Backend Architect/);
});

test('günlük rapor: bugünün görevleri ve limitler', async () => {
  const { dailyReport, reportDue } = await import('../src/notify.js');
  const now = new Date(2026, 9, 14, 21, 5).getTime();
  const today = now - 3_600_000; const yesterday = now - 30 * 3_600_000;
  const board = [
    { id: 'a', status: 'done', name: 'Dev', title: 'Sayfa', startedAt: today, at: today },
    { id: 'b', status: 'needs-work', name: 'UI', title: 'Logo', startedAt: today, at: today },
    { id: 'c', status: 'done', name: 'Eski', title: 'Dün', startedAt: yesterday, at: yesterday },
  ];
  const t = dailyReport(board, { claude: { fiveHour: { used: 0.5, resetsAt: now + 3_600_000 }, week: { used: 0.4, resetsAt: now + 86_400_000 } }, codex: null }, now);
  assert.match(t, /1 bitti/);
  assert.match(t, /1 düzeltilmeli/);
  assert.match(t, /Dev: Sayfa/);
  assert.doesNotMatch(t, /Eski/);
  assert.match(t, /Claude.*%40/);
  assert.equal(reportDue(now, 21, null), true);
  assert.equal(reportDue(now, 21, '2026-10-14'), false, 'bugün gönderildi');
  assert.equal(reportDue(now, 22, null), false);
});
