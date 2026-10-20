import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { cliArgs, cliChat } from '../src/agents/cli.js';
import { root } from './helpers-root.js';

const fake = join(root, 'test', 'fixtures', 'fake-cli.js');
const spawnImpl = (engine) => (bin, args, opts) => spawn(process.execPath, [fake, engine, ...args], { ...opts, stdio: ['pipe', 'pipe', 'pipe'] });

for (const engine of ['claude', 'codex', 'antigravity']) {
  test(`cli (${engine}): kimlik + görev gönderilir, akış ve oturum kimliği alınır`, async () => {
    const deltas = [];
    let session = null;
    const r = await cliChat({ engine, bin: 'x', cwd: root, persona: 'KIMLIK', prompt: 'GOREV', onDelta: (d) => deltas.push(d), onSession: (s) => { session = s; }, spawnImpl: spawnImpl(engine) });
    assert.match(r.text, /^cevap\(\d+\)$/);
    assert.ok(r.sessionId);
    assert.equal(session, r.sessionId);
    assert.ok(deltas.join('').length > 0);
  });
}

test('argümanlar: devam, kimlik, izin atlatma yok', () => {
  const c = cliArgs('claude', { cwd: 'C:/w', persona: 'P', prompt: 'G', resumeId: 's1' });
  assert.ok(c.includes('--append-system-prompt') && c.includes('P'));
  assert.ok(c.join(' ').includes('--resume s1'));
  assert.ok(cliArgs('codex', { cwd: 'C:/w', resumeId: 'x' }).join(' ').includes('resume x'));
  const a = cliArgs('antigravity', { cwd: 'C:/w', persona: 'P', prompt: 'G', resumeId: 'g1' });
  assert.ok(a.join(' ').includes('--conversation g1'));
  assert.equal(a[a.indexOf('-p') + 1], 'G', 'devam ederken kimlik tekrar gönderilmez');
  const first = cliArgs('antigravity', { cwd: 'C:/w', persona: 'P', prompt: 'G' });
  assert.ok(first[first.indexOf('-p') + 1].includes('P') && first[first.indexOf('-p') + 1].includes('G'));
  for (const e of ['claude', 'codex', 'antigravity']) assert.ok(!cliArgs(e, { cwd: 'C:/w', persona: '', prompt: '' }).includes('--dangerously-skip-permissions'));
});

test('nonzero CLI exit is a failure even after a final response', async () => {
  const spawnImpl = (_bin, _args, opts) => spawn(process.execPath, ['-e', "console.log(JSON.stringify({type:'result',result:'partial'}));process.exit(3)"], opts);
  await assert.rejects(() => cliChat({ engine: 'claude', bin: 'fake', cwd: root, prompt: 'task', spawnImpl }), /çıkış kodu 3/);
});

test('already aborted requests do not launch a CLI process', async () => {
  const controller = new AbortController(); controller.abort();
  let launched = false;
  await assert.rejects(() => cliChat({ engine: 'codex', bin: 'fake', cwd: root, signal: controller.signal, spawnImpl: () => { launched = true; } }), /durduruldu/);
  assert.equal(launched, false);
});

test('native CLI discovery handles Windows PATH casing and quoted directories', async () => {
  const { findExecutable } = await import('../src/agents/cli.js');
  const wanted = 'C:\\Tools Folder\\codex.exe';
  assert.equal(findExecutable('codex', { platform: 'win32', env: { Path: ';"C:\\Tools Folder";C:\\Other' }, exists: (p) => p === wanted }), wanted);
  assert.equal(findExecutable('codex', { platform: 'win32', env: { PATH: 'C:\\Other' }, exists: () => false }), null);
});

test('cli: CLI yoksa anlaşılır hata', async () => {
  await assert.rejects(() => cliChat({ engine: 'codex', bin: null, cwd: root, persona: '', prompt: 'x' }), /Codex CLI bulunamadı/);
});

test('izin verilen araçlar (ör. özel MCP) claude argümanlarına eklenir', () => {
  const c = cliArgs('claude', { cwd: 'C:/w', persona: 'P', prompt: 'G', allowedTools: ['mcp__example'] });
  assert.ok(c.join(' ').includes('--allowedTools mcp__example'));
  assert.ok(!cliArgs('claude', { cwd: 'C:/w', persona: 'P', prompt: 'G' }).includes('--allowedTools'));
});

test('claude rate_limit_event satırı limit bilgisi olarak ayrıştırılır ve onRate ile iletilir', async () => {
  const { parseCliLine } = await import('../src/agents/cli.js');
  const info = { utilization: 0.9, resetsAt: 5, rateLimitType: 'five_hour' };
  assert.deepEqual(parseCliLine('claude', JSON.stringify({ type: 'rate_limit_event', rate_limit_info: info })), { rate: info });
  const rates = [];
  await cliChat({ engine: 'claude', bin: 'x', cwd: root, prompt: 'RATE', onRate: (r) => rates.push(r), spawnImpl: spawnImpl('claude') });
  assert.equal(rates[0]?.utilization, 0.5);
});

test('agy: çok uzun talimat komut satırına sığmaz → çalışma klasöründe dosyaya yazılır, kısa istem gider', async () => {
  const { mkdtemp, readFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'agy-'));
  let args = null;
  const spawnImpl = (bin, a, opts) => { args = a; return spawn(process.execPath, [fake, 'antigravity', ...a], { ...opts, stdio: ['pipe', 'pipe', 'pipe'] }); };
  await cliChat({ engine: 'antigravity', bin: 'x', cwd: dir, persona: 'K'.repeat(30_000), prompt: 'GOREV', spawnImpl });
  const p = args[args.indexOf('-p') + 1];
  assert.ok(p.length < 2000, 'kısa istem');
  assert.match(p, /\.ofis-gorev\.md/);
  assert.match(p, /\.ofis-gorev\.md/);
});

test('claude: uzun kimlik geçici dosyadan (--append-system-prompt-file) verilir, iş bitince silinir; agy dosyası da silinir', async () => {
  const { existsSync } = await import('node:fs');
  let args = null;
  const spawnImpl = (eng) => (bin, a, opts) => { args = a; return spawn(process.execPath, [fake, eng, ...a], { ...opts, stdio: ['pipe', 'pipe', 'pipe'] }); };
  await cliChat({ engine: 'claude', bin: 'x', cwd: root, persona: 'K'.repeat(30_000), prompt: 'GOREV', spawnImpl: spawnImpl('claude') });
  assert.ok(!args.includes('--append-system-prompt'));
  const f = args[args.indexOf('--append-system-prompt-file') + 1];
  assert.ok(f && !existsSync(f), 'geçici kimlik dosyası silindi');
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'agy2-'));
  await cliChat({ engine: 'antigravity', bin: 'x', cwd: dir, persona: 'K'.repeat(30_000), prompt: 'G', spawnImpl: spawnImpl('antigravity') });
  assert.equal(existsSync(join(dir, '.ofis-gorev.md')), false, 'agy talimat dosyası iş bitince silindi');
});

test('codex ağ erişimi: istenince kum havuzu ağı açılır, yazma yine workspace-write', () => {
  const on = cliArgs('codex', { cwd: 'C:/p', prompt: 'x', network: true });
  assert.ok(on.join(' ').includes('-c sandbox_workspace_write.network_access=true'));
  assert.ok(on.includes('workspace-write'));
  assert.ok(!cliArgs('codex', { cwd: 'C:/p', prompt: 'x' }).join(' ').includes('network_access'));
});

test('kullanım: claude sonucu ve codex turn.completed token/maliyet olarak toplanır', async () => {
  const c = await cliChat({ engine: 'claude', bin: 'x', cwd: root, prompt: 'P', spawnImpl: spawnImpl('claude') });
  assert.deepEqual(c.usage, { in: 150, out: 20, cost: 0.01 });
  const x = await cliChat({ engine: 'codex', bin: 'x', cwd: root, prompt: 'P', spawnImpl: spawnImpl('codex') });
  assert.deepEqual(x.usage, { in: 300, out: 40, cost: 0 });
});
