import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRunner } from '../src/agents/runner.js';

const until = async (fn) => { for (let i = 0; i < 200; i++) { if (fn()) return; await new Promise((r) => setTimeout(r, 10)); } throw new Error('zaman aşımı'); };

function fakeStore(agents, keys) {
  return { list: () => agents, get: (id) => agents.find((a) => a.id === id) ?? null, getKey: (id) => keys[id] ?? null };
}

test('mesaj → düşünüyor → yazıyor → cevap; geçmiş sonraki mesaja eklenir', async () => {
  const calls = [];
  let release;
  const chatImpl = async (opts) => {
    calls.push(opts);
    opts.onDelta('Mer');
    await new Promise((r) => { release = r; });
    opts.onDelta('haba');
    return 'Merhaba';
  };
  const store = fakeStore([{ id: 'a1', name: 'Ayşe', provider: 'anthropic', model: 'claude-opus-5-5', system: 'S', hasKey: true }], { a1: 'sk-1' });
  const r = createAgentRunner({ store, chatImpl, throttleMs: 0 });
  assert.equal(r.snapshot().sessions[0].state, 'idle');
  assert.equal(r.snapshot().sessions[0].displayName, 'Ayşe');
  assert.deepEqual(r.send('a1', 'selam'), { ok: true });
  await until(() => r.snapshot().sessions[0].state === 'working');
  release();
  await until(() => r.snapshot().sessions[0].state === 'idle');
  const entries = r.snapshot().entries;
  assert.deepEqual(entries.map((e) => [e.kind, e.text ?? e.title]), [['prompt', 'selam'], ['stop', 'Merhaba']]);
  assert.equal(calls[0].key, 'sk-1');
  assert.equal(calls[0].system, 'S');
  r.send('a1', 'nasılsın');
  await until(() => calls.length === 2);
  assert.deepEqual(calls[1].messages.map((m) => m.role), ['user', 'assistant', 'user']);
  release();
});

test('anahtarsız ajan: mesaj reddedilir; sağlayıcı hatası kayıt olarak görünür', async () => {
  const store = fakeStore([{ id: 'a1', name: 'X', provider: 'openai', model: 'm', hasKey: false }, { id: 'a2', name: 'Y', provider: 'openai', model: 'm', hasKey: true }], { a2: 'k' });
  const r = createAgentRunner({ store, chatImpl: async () => { throw new Error('sağlayıcı 401: geçersiz'); }, throttleMs: 0 });
  assert.match(r.send('a1', 'x').error, /anahtar/);
  r.send('a2', 'x');
  await until(() => r.snapshot().entries.some((e) => e.kind === 'note'));
  const note = r.snapshot().entries.find((e) => e.kind === 'note');
  assert.equal(note.status, 'failed');
  assert.match(note.title, /401/);
  assert.equal(r.snapshot().sessions.find((s) => s.session === 'a2').state, 'idle');
});

test('uzman (CLI): kimlik + görev CLI motoruna gider, oturum kimliği bağlanır, devam ettirilir', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); o.onSession('sess-9'); o.onDelta('tamam'); return { text: 'tamam', sessionId: 'sess-9' }; };
  const store = fakeStore([{ id: 'e1', name: 'Reality Checker', emoji: '🧐', engine: 'claude', system: 'KIMLIK', workdir: '', color: '#EF4444', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'claude.exe' }, workRoot: 'C:/tmp/ofis-work', throttleMs: 0, mkdirImpl: async () => {} });
  assert.deepEqual(r.send('e1', 'kanıt göster'), { ok: true }, 'anahtarsız CLI uzmanı çalışır');
  await until(() => r.snapshot().sessions[0].state === 'idle' && calls.length === 1 && r.snapshot().entries.length === 2);
  assert.equal(calls[0].engine, 'claude');
  assert.equal(calls[0].persona, 'KIMLIK');
  assert.equal(calls[0].bin, 'claude.exe');
  assert.match(calls[0].cwd.split(String.fromCharCode(92)).join('/'), /ofis-work\/e1$/);
  assert.equal(calls[0].resumeId, null);
  const snap = r.snapshot();
  assert.deepEqual(snap.links, [['claude:sess-9', 'api:e1']]);
  assert.equal(snap.sessions[0].displayName, '🧐 Reality Checker');
  assert.equal(snap.sessions[0].color, '#EF4444');
  r.send('e1', 'tekrar bak');
  await until(() => calls.length === 2);
  assert.equal(calls[1].resumeId, 'sess-9');
});

test('ask: cevap bitince çözülür; gösterilecek metin ve klasör geçersiz kılınabilir', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: `cevap:${o.prompt.length}`, sessionId: 's1' }; };
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'codex', system: '', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { codex: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  const res = await r.ask('e1', 'UZUN TALIMAT METNI', { display: 'kısa', cwd: 'C:/proje' });
  assert.equal(res.text, 'cevap:18');
  assert.equal(res.cwd, 'C:/proje'); // kontrolcü aynı klasöre bakabilsin
  assert.equal(calls[0].cwd, 'C:/proje');
  assert.equal(r.snapshot().entries.find((e) => e.kind === 'prompt').text, 'kısa');
  await assert.rejects(() => r.ask('yok', 'x'), /ajan yok/);
});

test('tasarım uzmanı: Krea izni ve talimatı eklenir; diğerlerine eklenmez', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([
    { id: 'd1', name: 'UI Designer', engine: 'claude', division: 'design', system: 'KIMLIK', hasKey: false },
    { id: 'e1', name: 'DevOps', engine: 'claude', division: 'engineering', system: 'K2', hasKey: false },
  ], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('d1', 'logo');
  await r.ask('e1', 'deploy');
  assert.ok(calls[0].allowedTools.includes('mcp__krea-ai'));
  assert.match(calls[0].persona, /krea/i);
  assert.ok(!calls[1].allowedTools.includes('mcp__krea-ai'));
  assert.equal(calls[1].persona, 'K2');
});

test('Claude uzmanına güvenli geliştirme komutları izinli; tehlikeliler değil', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'claude', division: 'engineering', system: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('e1', 'test et');
  const tools = calls[0].allowedTools.join(' ');
  assert.match(tools, /Bash\(npm test/);
  assert.match(tools, /Bash\(git diff/);
  assert.doesNotMatch(tools, /git push|rm |Bash\(\*\)/);
});

test('çalışma durumu diske kaydedilir ve yeniden açılınca devam eder (oturum + geçmiş)', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'ofis-rt-'));
  const file = join(dir, 'runtime.json');
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'cevap', sessionId: 's-77' }; };
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'codex', system: '', hasKey: false }], {});
  try {
    const r1 = createAgentRunner({ store, cliImpl, bins: { codex: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {}, persistFile: file, persistMs: 0 });
    await r1.ask('e1', 'ilk');
    await r1.flush();
    const r2 = createAgentRunner({ store, cliImpl, bins: { codex: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {}, persistFile: file, persistMs: 0 });
    await r2.ready;
    assert.deepEqual(r2.snapshot().entries.map((e) => e.kind), ['prompt', 'stop']);
    assert.deepEqual(r2.snapshot().links, [['codex:s-77', 'api:e1']]);
    await r2.ask('e1', 'ikinci');
    assert.equal(calls[1].resumeId, 's-77');
    await r2.flush(); // bekleyen kayıt bitmeden klasör silinmesin (Windows ENOTEMPTY)
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 5 }); }
});

test('CLI limit olayları onRate ile dışarı iletilir', async () => {
  const seen = [];
  const cliImpl = async (o) => { o.onRate?.({ utilization: 0.4 }); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'claude', system: '', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {}, onRate: (engine, info) => seen.push([engine, info.utilization]) });
  await r.ask('e1', 'x');
  assert.deepEqual(seen, [['claude', 0.4]]);
});

test('ters mühendislik uzmanı: yalnız REA MCP araçları + okuma izinli, Krea yok', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([{ id: 're', name: 'RE', engine: 'claude', division: 'reverse', system: 'RE', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('re', 'şu exe');
  assert.ok(calls[0].allowedTools.includes('mcp__rea'));
  assert.ok(!calls[0].allowedTools.includes('mcp__krea-ai'));
  assert.ok(!calls[0].allowedTools.some((t) => /git commit|npm install/.test(t)), 'yazma/kurma komutları yok');
});

test('caveman: Codex/agy uzmanlarının kimliğine kısa üslup eklenir; Claude (eklenti hook\'u var) ve Prompt Master\'a eklenmez', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([
    { id: 'cx', name: 'C', engine: 'codex', system: 'KIMLIK', workdir: '', hasKey: false },
    { id: 'ag', name: 'A', engine: 'antigravity', system: 'KIMLIK', workdir: '', hasKey: false },
    { id: 'cl', name: 'L', engine: 'claude', system: 'KIMLIK', workdir: '', hasKey: false },
    { id: 'pm', name: 'P', engine: 'codex', role: 'prompt', system: 'KIMLIK', workdir: '', hasKey: false },
  ], {});
  const r = createAgentRunner({ store, cliImpl, bins: { codex: 'c', antigravity: 'a', claude: 'l' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {}, styleHint: 'CAVEMAN' });
  for (const id of ['cx', 'ag', 'cl', 'pm']) await r.ask(id, 'x');
  assert.deepEqual(calls.map((c) => /CAVEMAN/.test(c.persona)), [true, true, false, false]);
});

test('ask shown: sohbette görünen cevap dönüştürülebilir, çağırana tam metin döner', async () => {
  const cliImpl = async () => ({ text: 'TAM```json{}```', sessionId: null });
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'codex', system: '', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { codex: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  const res = await r.ask('e1', 'x', { shown: () => 'KISA' });
  assert.equal(res.text, 'TAM```json{}```');
  assert.equal(r.snapshot().entries.find((e) => e.kind === 'stop').text, 'KISA');
});

test('shown varken yazılırken ham metin görünmez, "plan hazırlanıyor" yazar', async () => {
  let seen = null;
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'codex', system: '', workdir: '', hasKey: false }], {});
  let r;
  const cliImpl = async (o) => { o.onDelta('```json {"reply"'); seen = { ...r.snapshot().entries.find((e) => e.kind === 'stop') }; return { text: 'TAM', sessionId: null }; };
  r = createAgentRunner({ store, cliImpl, bins: { codex: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('e1', 'x', { shown: () => 'KISA' });
  assert.equal(seen.text, '');
  assert.match(seen.title, /plan hazırlanıyor/);
});

test('CLI zaman aşımı: takılan çalıştırma durdurulur, kuyruk kilitlenmez', async () => {
  const cliImpl = (o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(new Error('durduruldu'))));
  const store = fakeStore([{ id: 'e1', name: 'X', engine: 'codex', system: '', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { codex: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {}, runTimeoutMs: 30 });
  await assert.rejects(() => r.ask('e1', 'x'), /zaman aşımı/);
  assert.equal(r.isBusy('e1'), false);
});

test('oyun geliştirme uzmanları da Krea (sprite/asset) kullanabilir', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([{ id: 'ta', name: 'Technical Artist', engine: 'claude', division: 'game-development', system: 'K', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('ta', 'x');
  assert.ok(calls[0].allowedTools.includes('mcp__krea-ai'));
  assert.match(calls[0].persona, /krea/i);
});

test('Godot kuruluysa: oyun/mühendislik uzmanına Godot talimatı, PATH eki ve claude için godot izni gider', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([
    { id: 'g', name: 'Godot', engine: 'claude', division: 'game-development', system: 'K', workdir: '', hasKey: false },
    { id: 'm', name: 'Pazarlama', engine: 'codex', division: 'marketing', system: 'K', workdir: '', hasKey: false },
  ], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c', codex: 'x', godotDir: 'C:/Tools/godot' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('g', 'oyun'); await r.ask('m', 'metin');
  assert.match(calls[0].persona, /godot --headless/);
  assert.equal(calls[0].extraPath, 'C:/Tools/godot');
  assert.ok(calls[0].allowedTools.includes('Bash(godot:*)'));
  assert.doesNotMatch(calls[1].persona, /godot/);
});

test('Godot izni: komut adı ve tam yol biçimleri (claude)', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([{ id: 'rc', name: 'RC', engine: 'claude', division: 'testing', system: 'K', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c', godotDir: 'C:\\Tools\\godot', godotExe: 'Godot_v4.7.2-stable_win64_console.exe' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('rc', 'kontrol');
  const t = calls[0].allowedTools;
  for (const p of ['Bash(godot:*)', 'Bash(godot.cmd:*)', 'Bash(C:/Tools/godot/Godot_v4.7.2-stable_win64_console.exe:*)', 'Bash(C:\\Tools\\godot\\Godot_v4.7.2-stable_win64_console.exe:*)', 'Bash(/c/Tools/godot/Godot_v4.7.2-stable_win64_console.exe:*)']) assert.ok(t.includes(p), p);
});

test('Claude uzmanları web arayıp sayfa okuyabilir (WebSearch, WebFetch)', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([{ id: 'mr', name: 'Araştırmacı', engine: 'claude', division: 'research', system: 'K', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('mr', 'araştır');
  assert.ok(calls[0].allowedTools.includes('WebSearch'));
  assert.ok(calls[0].allowedTools.includes('WebFetch'));
});

test('agy uzmanına Krea talimatı verilmez (agy\'de Krea yetkisiz); ters mühendis web okuyabilir', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([
    { id: 'ag', name: 'UI', engine: 'antigravity', division: 'design', system: 'K', workdir: '', hasKey: false },
    { id: 're', name: 'RE', engine: 'claude', division: 'reverse', system: 'K', workdir: '', hasKey: false },
  ], {});
  const r = createAgentRunner({ store, cliImpl, bins: { antigravity: 'a', claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('ag', 'x'); await r.ask('re', 'x');
  assert.doesNotMatch(calls[0].persona, /krea/i);
  assert.ok(calls[1].allowedTools.includes('WebFetch'));
  assert.ok(!calls[1].allowedTools.includes('Bash(npm install:*)'));
});

test('görsel üreten Claude uzmanı Krea çıktısını yalnız Krea sunucusundan curl ile indirebilir', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o); return { text: 'ok', sessionId: null }; };
  const store = fakeStore([
    { id: 'ta', name: 'TA', engine: 'claude', division: 'game-development', system: 'K', workdir: '', hasKey: false },
    { id: 'be', name: 'BE', engine: 'claude', division: 'engineering', system: 'K', workdir: '', hasKey: false },
  ], {});
  const r = createAgentRunner({ store, cliImpl, bins: { claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await r.ask('ta', 'x'); await r.ask('be', 'x');
  assert.ok(calls[0].allowedTools.includes('Bash(curl -sSfL https://app-uploads.krea.ai/:*)'));
  assert.ok(calls[0].allowedTools.includes('Bash(curl -sSfL https://gen.krea.ai/:*)'));
  assert.ok(!calls[0].allowedTools.some((t) => t === 'Bash(curl:*)'), 'genel curl yok');
  assert.match(calls[0].persona, /krea-indir\.mjs/);
  assert.ok(!calls[1].allowedTools.some((t) => t.startsWith('Bash(curl')));
});

test('limit dolunca: motor kapalı işaretlenir, görev yedek motorla sürer, sonraki işler doğrudan yedeğe gider', async () => {
  const calls = [];
  const cliImpl = async (o) => {
    calls.push(o.engine);
    if (o.engine === 'codex') throw new Error("You've hit your usage limit. ... try again at 7:52 AM.");
    return { text: `ok-${o.engine}`, sessionId: 's' };
  };
  const store = fakeStore([{ id: 'g', name: 'Godot', engine: 'codex', division: 'game-development', system: 'K', workdir: '', hasKey: false }], {});
  const now = new Date(2026, 9, 16, 3, 47).getTime();
  const r = createAgentRunner({ store, cliImpl, bins: { codex: 'x', claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {}, now: () => now });
  const res = await r.ask('g', 'iş');
  assert.equal(res.text, 'ok-claude');
  assert.deepEqual(calls, ['codex', 'claude']);
  const down = r.downEngines();
  assert.equal(new Date(down.codex).getHours(), 7);
  assert.equal(new Date(down.codex).getMinutes(), 52);
  assert.ok(r.snapshot().entries.some((e) => /Codex limiti dolu.*Claude/.test(e.title)));
  await r.ask('g', 'iş 2');
  assert.deepEqual(calls, ['codex', 'claude', 'claude'], 'kapalı motor denenmez');
});

test('limit hatası dışındaki hatada yedeğe geçilmez', async () => {
  const calls = [];
  const cliImpl = async (o) => { calls.push(o.engine); throw new Error('sözdizimi hatası'); };
  const store = fakeStore([{ id: 'g', name: 'G', engine: 'codex', system: '', workdir: '', hasKey: false }], {});
  const r = createAgentRunner({ store, cliImpl, bins: { codex: 'x', claude: 'c' }, workRoot: 'C:/w', throttleMs: 0, mkdirImpl: async () => {} });
  await assert.rejects(() => r.ask('g', 'x'), /sözdizimi/);
  assert.deepEqual(calls, ['codex']);
});
