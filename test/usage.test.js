import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { claudeFromEvent, codexFromRateLimits, createUsage, readCodexUsage } from '../src/usage.js';

const rl = { primary: { used_percent: 17, window_minutes: 300, resets_at: 1791989494 }, secondary: { used_percent: 10, window_minutes: 10080, resets_at: 1792487369 } };

test('Claude rate_limit_event → 5 saatlik ve haftalık kullanım', () => {
  const u = claudeFromEvent({ status: 'allowed_warning', utilization: 0.94, resetsAt: 1791996600, rateLimitType: 'five_hour', unifiedWindows: { five_hour: { utilization: 0.94, resetsAt: 1791996600 }, seven_day: { utilization: 0.48, resetsAt: 1792422000 } } }, 5);
  assert.deepEqual(u, { fiveHour: { used: 0.94, resetsAt: 1791996600000 }, week: { used: 0.48, resetsAt: 1792422000000 }, at: 5 });
  // unifiedWindows yoksa yalnız bildirilen pencere
  assert.deepEqual(claudeFromEvent({ utilization: 0.3, resetsAt: 10, rateLimitType: 'seven_day' }, 1), { fiveHour: null, week: { used: 0.3, resetsAt: 10000 }, at: 1 });
  assert.equal(claudeFromEvent(null), null);
});

test('Codex rate_limits → yüzde kesire çevrilir', () => {
  assert.deepEqual(codexFromRateLimits(rl, 7), { fiveHour: { used: 0.17, resetsAt: 1791989494000 }, week: { used: 0.1, resetsAt: 1792487369000 }, at: 7 });
});

test('readCodexUsage en yeni rollout dosyasındaki son rate_limits kaydını okur', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cx-'));
  const d = join(root, '2026', '10', '14');
  await mkdir(d, { recursive: true });
  const line = (p) => JSON.stringify({ timestamp: 'x', type: 'event_msg', payload: { type: 'token_count', rate_limits: { ...rl, primary: { ...rl.primary, used_percent: p } } } });
  await writeFile(join(d, 'rollout-a.jsonl'), `${line(50)}\n`);
  await writeFile(join(d, 'rollout-b.jsonl'), `${line(20)}\n{"type":"x"}\n${line(33)}\n`);
  await utimes(join(d, 'rollout-a.jsonl'), new Date(1000), new Date(1000));
  const u = await readCodexUsage(root);
  assert.equal(u.fiveHour.used, 0.33);
  assert.ok(u.at > 0);
  assert.equal(await readCodexUsage(join(root, 'yok')), null);
});

test('createUsage: Claude kaydı dosyada kalır, get ikisini döner', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'us-'));
  const file = join(dir, 'u.json');
  const u = await createUsage({ file, codexRoot: join(dir, 'yok') });
  u.noteClaude({ utilization: 0.5, resetsAt: 100, rateLimitType: 'five_hour' });
  await u.flush();
  const u2 = await createUsage({ file, codexRoot: join(dir, 'yok') });
  assert.equal(u2.get().claude.fiveHour.used, 0.5);
  assert.equal(u2.get().codex, null);
});

test('en yeni dosyada limit yoksa bir öncekine bakılır', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cx2-'));
  const d = join(root, '2026', '10', '14');
  await mkdir(d, { recursive: true });
  await writeFile(join(d, 'rollout-old.jsonl'), `${JSON.stringify({ payload: { rate_limits: rl } })}\n`);
  await utimes(join(d, 'rollout-old.jsonl'), new Date(1000), new Date(1000));
  await writeFile(join(d, 'rollout-new.jsonl'), '{"type":"session_meta"}\n');
  assert.equal((await readCodexUsage(root)).fiveHour.used, 0.17);
});

test('probeClaude: hook\'suz, oturum kaydetmeden küçük sorgu; rate_limit_event okunur', async () => {
  const { probeClaude, PROBE_ARGS } = await import('../src/usage.js');
  const { spawn } = await import('node:child_process');
  const { root } = await import('./helpers-root.js');
  assert.ok(PROBE_ARGS.includes('--no-session-persistence'));
  assert.ok(PROBE_ARGS.join(' ').includes('disableAllHooks'));
  const fake = join(root, 'test', 'fixtures', 'fake-cli.js');
  const info = await probeClaude({ bin: 'x', spawnImpl: (b, args, o) => spawn(process.execPath, [fake, 'claude', ...args], { ...o, stdio: ['pipe', 'pipe', 'pipe'] }) });
  assert.equal(info.utilization, 0.5);
  await assert.rejects(() => probeClaude({ bin: null }), /bulunamadı/);
});

test('Codex son bilinen değeri dosyada kalır (yeni rollout\'ta limit yoksa kaybolmaz)', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cx3-'));
  const d = join(root, '2026', '10', '14');
  await mkdir(d, { recursive: true });
  await writeFile(join(d, 'rollout-a.jsonl'), `${JSON.stringify({ payload: { rate_limits: rl } })}\n`);
  const file = join(root, 'u.json');
  const u = await createUsage({ file, codexRoot: root });
  await u.refreshCodex();
  await u.flush();
  const empty = await mkdtemp(join(tmpdir(), 'cx4-'));
  const u2 = await createUsage({ file, codexRoot: empty });
  await u2.refreshCodex();
  assert.equal(u2.get().codex.fiveHour.used, 0.17);
});

test('limit kaydı boş olan yeni rollout eski doğru değeri ezmez', async () => {
  const { createUsage } = await import('../src/usage.js');
  const root = await mkdtemp(join(tmpdir(), 'cx5-'));
  const d = join(root, '2026', '10', '16');
  await mkdir(d, { recursive: true });
  await writeFile(join(d, 'rollout-a.jsonl'), `${JSON.stringify({ payload: { rate_limits: rl } })}\n`);
  const u = await createUsage({ codexRoot: root });
  await u.refreshCodex();
  await writeFile(join(d, 'rollout-b.jsonl'), `${JSON.stringify({ payload: { rate_limits: { limit_id: 'codex', primary: null, secondary: null } } })}\n`);
  await u.refreshCodex();
  assert.equal(u.get().codex.fiveHour.used, 0.17);
});
