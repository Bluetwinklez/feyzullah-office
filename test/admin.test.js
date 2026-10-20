import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminPrompt, createAdmin, parseAdminReply } from '../src/agents/admin.js';

const team = [
  { id: 'fe', name: 'Frontend Developer', emoji: '🖥️', engine: 'antigravity', division: 'engineering' },
  { id: 'rc', name: 'Reality Checker', emoji: '🧐', engine: 'claude', division: 'testing' },
];
const json = (o) => `Plan hazır.\n\`\`\`json\n${JSON.stringify(o)}\n\`\`\``;

test('yönetici istemi ekibi ve sözleşmeyi içerir', () => {
  const p = adminPrompt('Giriş sayfası yap', team);
  assert.match(p, /Giriş sayfası yap/);
  assert.match(p, /fe.*Frontend Developer/);
  assert.match(p, /```json/);
});

test('board trimming retains saved branches after their worktrees were cleaned up', async () => {
  const { trimBoard } = await import('../src/agents/admin.js');
  const pending = { id: 'saved', branch: 'ofis/saved', worktree: null };
  const cards = [pending, ...Array.from({ length: 300 }, (_, i) => ({ id: `done-${i}`, merged: true }))];
  assert.ok(trimBoard(cards).some((card) => card.id === pending.id));
});

test('worktree preparation failures stop the task before the specialist runs', async () => {
  const runner = fakeRunner((id) => id === 'admin' ? json({ reply: 'Plan', tasks: [{ agent: 'fe', task: 'edit', cwd: 'C:/repo' }] }) : 'done');
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true, prepare: async () => { throw new Error('worktree unavailable'); } });
  await admin.command('edit');
  assert.equal(runner.calls.some((c) => c.id === 'fe'), false);
  assert.equal(admin.board()[0].status, 'failed');
  assert.match(admin.board()[0].error, /worktree unavailable/);
});

test('failed automatic commit marks the task failed instead of done', async () => {
  const runner = fakeRunner((id) => id === 'admin' ? json({ reply: 'Plan', tasks: [{ agent: 'fe', task: 'edit', cwd: 'C:/repo' }] }) : 'done');
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true,
    prepare: async () => ({ cwd: 'C:/wt', worktree: 'C:/wt', branch: 'ofis/test' }),
    afterRun: async () => ({ ok: false, error: 'disk full' }) });
  await admin.command('edit');
  assert.equal(admin.board()[0].status, 'failed');
  assert.match(admin.board()[0].error, /disk full/);
});

test('cevap ayrıştırma: görevler, bilinmeyen ajan ve bozuk cevap', () => {
  const ok = parseAdminReply(json({ reply: 'Böldüm', tasks: [{ agent: 'fe', task: 'Sayfayı yap' }, { agent: 'rc', task: 'Kontrol et', cwd: 'C:/p' }] }), ['fe', 'rc']);
  assert.equal(ok.reply, 'Böldüm');
  assert.deepEqual(ok.tasks, [{ agent: 'fe', task: 'Sayfayı yap', cwd: null }, { agent: 'rc', task: 'Kontrol et', cwd: 'C:/p' }]);
  assert.deepEqual(parseAdminReply(json({ reply: 'Merhaba' }), ['fe']).tasks, []);
  assert.match(parseAdminReply(json({ reply: 'x', tasks: [{ agent: 'yok', task: 't' }] }), ['fe']).error, /bilinmeyen/);
  assert.ok(parseAdminReply('json yok', ['fe']).error);
});

function fakeRunner(script) {
  const calls = [];
  return {
    calls,
    ask: async (id, text, opts = {}) => { calls.push({ id, text, opts }); return { text: script(id, text, calls.length) }; },
  };
}

test('akış: yönetici böler → uzmanlar paralel çalışır → yönetici özetler', async () => {
  const runner = fakeRunner((id, text) => {
    if (id === 'admin' && /Görev raporu/.test(text)) return 'Hepsi tamam, özet: …';
    if (id === 'admin') return json({ reply: 'İkiye böldüm', tasks: [{ agent: 'fe', task: 'Sayfa' }, { agent: 'rc', task: 'Kontrol', cwd: 'C:/p' }] });
    return `${id} bitti`;
  });
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true });
  const r = await admin.command('Giriş sayfası');
  assert.equal(r.ok, true);
  const ids = runner.calls.map((c) => c.id);
  assert.equal(ids[0], 'admin');
  assert.deepEqual(ids.slice(1, 3).sort(), ['fe', 'rc']);
  assert.equal(ids[3], 'admin');
  assert.equal(runner.calls[0].opts.display, 'Giriş sayfası', 'yöneticinin sohbetinde kullanıcının komutu görünür');
  assert.equal(runner.calls.find((c) => c.id === 'rc').opts.cwd, 'C:/p');
  assert.match(runner.calls[3].text, /fe bitti/);
  assert.match(runner.calls[3].text, /rc bitti/);
});

test('akış: bozuk plan bir kez düzeltilir; geçersiz klasör yok sayılır; görev yoksa özet istenmez', async () => {
  let n = 0;
  const runner = fakeRunner((id) => {
    if (id !== 'admin') return 'ok';
    n++;
    if (n === 1) return 'plan yok';
    return json({ reply: 'Tek iş', tasks: [{ agent: 'fe', task: 'x', cwd: 'Z:/olmayan' }] });
  });
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: (d) => d !== 'Z:/olmayan' });
  await admin.command('bir şey');
  assert.match(runner.calls[1].text, /sözleşme/);
  assert.equal(runner.calls.find((c) => c.id === 'fe').opts.cwd, undefined);

  const quiet = fakeRunner(() => json({ reply: 'Selam' }));
  await createAdmin({ runner: quiet, adminId: () => 'admin', team: () => team, dirOk: () => true }).command('merhaba');
  assert.equal(quiet.calls.length, 1);
});

const catalog = [{ id: 'design-ui-designer', name: 'UI Designer', division: 'design' }, { id: 'engineering-devops-automator', name: 'DevOps Automator', division: 'engineering' }];

test('ayrıştırma: işe alma ve çıkarma; görev yeni alınan uzmanın katalog id\'sini kullanabilir', () => {
  const r = parseAdminReply(json({ reply: 'Tasarımcı aldım', hire: [{ catalogId: 'design-ui-designer' }], fire: ['rc'], tasks: [{ agent: 'design-ui-designer', task: 'Logo çiz' }] }), ['fe', 'rc'], catalog.map((c) => c.id));
  assert.deepEqual(r.hire, [{ catalogId: 'design-ui-designer', engine: null }]);
  assert.deepEqual(r.fire, ['rc']);
  assert.equal(r.tasks[0].agent, 'design-ui-designer');
  assert.match(parseAdminReply(json({ reply: 'x', hire: [{ catalogId: 'yok' }] }), ['fe'], catalog.map((c) => c.id)).error, /katalog/);
  assert.match(parseAdminReply(json({ reply: 'x', fire: ['yok'] }), ['fe'], []).error, /çıkarılacak/);
});

test('akış: yönetici uzman alır, görevi ona verir, boştaki gereksiz uzmanı çıkarır; çalışanı ve kendini çıkarmaz', async () => {
  const hired = []; const fired = [];
  const runner = fakeRunner((id, text) => {
    if (id === 'admin' && /Görev raporu/.test(text)) return 'özet';
    if (id === 'admin') return json({ reply: 'Tasarımcı aldım, DevOps gereksiz', hire: [{ catalogId: 'design-ui-designer' }], fire: ['rc', 'fe', 'admin'], tasks: [{ agent: 'design-ui-designer', task: 'Logo çiz' }] });
    return `${id} bitti`;
  });
  const admin = createAdmin({
    runner, adminId: () => 'admin', team: () => team, dirOk: () => true, catalog: () => catalog,
    hire: async (catalogId) => { hired.push(catalogId); return { id: 'new1' }; },
    fire: async (id) => { fired.push(id); },
    isBusy: (id) => id === 'fe',
  });
  const r = await admin.command('Logo lazım');
  assert.equal(r.ok, true);
  assert.deepEqual(hired, ['design-ui-designer']);
  assert.deepEqual(fired, ['rc'], 'çalışan (fe) ve yönetici çıkarılmaz');
  assert.ok(runner.calls.some((c) => c.id === 'new1' && c.text === 'Logo çiz'), 'görev yeni uzmana gider');
  assert.match(runner.calls[0].text, /design-ui-designer/, 'yönetici kataloğu görür');
});

test('karar ayrıştırma: NEEDS WORK / PASS; belirsizse geçer', async () => {
  const { parseVerdict } = await import('../src/agents/admin.js');
  assert.equal(parseVerdict('Eksikler var.\nKARAR: NEEDS WORK').pass, false);
  assert.match(parseVerdict('Testler yok.\nKARAR: NEEDS WORK').feedback, /Testler yok/);
  assert.equal(parseVerdict('Her şey çalışıyor. KARAR: PASS').pass, true);
  assert.equal(parseVerdict('Status: NEEDS WORK').pass, false);
  assert.equal(parseVerdict('güzel olmuş').pass, true);
});

const rcTeam = [
  { id: 'fe', name: 'Frontend Developer', engine: 'codex', division: 'engineering' },
  { id: 'rc', name: 'Reality Checker', engine: 'claude', division: 'testing', catalogId: 'testing-reality-checker' },
];

test('iş akışı: uzman bitirir → Reality Checker kontrol eder → NEEDS WORK ise düzeltmeye geri gider → PASS', async () => {
  let checks = 0;
  const boards = [];
  const runner = {
    calls: [],
    async ask(id, text, opts = {}) {
      this.calls.push({ id, text, opts });
      if (id === 'admin' && /Görev raporu/.test(text)) return { text: 'özet' };
      if (id === 'admin') return { text: json({ reply: 'Verdim', tasks: [{ agent: 'fe', task: 'Giriş sayfası yap' }] }) };
      if (id === 'rc') { checks++; return { text: checks === 1 ? 'Form doğrulaması yok.\nKARAR: NEEDS WORK' : 'Tamam.\nKARAR: PASS' }; }
      return { text: `fe çıktı ${this.calls.length}`, cwd: 'C:/w/fe' };
    },
  };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, onBoard: (b) => boards.push(b.map((t) => t.status).join(',')) });
  await admin.command('site');
  const seq = runner.calls.map((c) => c.id);
  assert.deepEqual(seq, ['admin', 'fe', 'rc', 'fe', 'rc', 'admin']);
  const rcCall = runner.calls.find((c) => c.id === 'rc');
  assert.equal(rcCall.opts.cwd, 'C:/w/fe', 'kontrolcü uzmanın klasörüne bakar');
  assert.match(rcCall.text, /Giriş sayfası yap/);
  assert.match(runner.calls[3].text, /Form doğrulaması yok/, 'geri bildirim uzmana gider');
  const board = admin.board();
  assert.equal(board.length, 1);
  assert.equal(board[0].status, 'done');
  assert.equal(board[0].round, 1);
  assert.equal(board[0].name, 'Frontend Developer');
  assert.ok(boards.some((b) => b === 'doing') && boards.some((b) => b === 'review') && boards.some((b) => b === 'redo'));
  assert.match(runner.calls[5].text, /kontrol: geçti/);
});

test('iş akışı: en fazla 2 düzeltme turu; hâlâ NEEDS WORK ise panoda "düzeltilmeli" kalır; kontrolcünün kendi işi kontrol edilmez', async () => {
  const runner = {
    calls: [],
    async ask(id, text) {
      this.calls.push({ id, text });
      if (id === 'admin' && /Görev raporu/.test(text)) return { text: 'özet' };
      if (id === 'admin') return { text: json({ reply: 'Verdim', tasks: [{ agent: 'fe', task: 'A' }, { agent: 'rc', task: 'B' }] }) };
      if (id === 'rc' && /KARAR/.test(text)) return { text: 'KARAR: NEEDS WORK' };
      return { text: `${id} ok` };
    },
  };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true });
  await admin.command('iş');
  assert.equal(runner.calls.filter((c) => c.id === 'fe').length, 3, 'ilk iş + 2 düzeltme');
  const fe = admin.board().find((t) => t.agentId === 'fe');
  assert.equal(fe.status, 'needs-work');
  assert.equal(admin.board().find((t) => t.agentId === 'rc').status, 'done');
});

test('iş akışı: kontrolcü ekipte yoksa işe alınır (bir kez)', async () => {
  const hired = [];
  const runner = { async ask(id, text) {
    if (id === 'admin' && /Görev raporu/.test(text)) return { text: 'özet' };
    if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A' }, { agent: 'fe', task: 'B' }] }) };
    if (id === 'rc9') return { text: 'KARAR: PASS' };
    return { text: 'ok' };
  } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => [rcTeam[0]], dirOk: () => true, review: true, catalog: () => [{ id: 'testing-reality-checker', name: 'Reality Checker', division: 'testing' }], hire: async (c) => { hired.push(c); return { id: 'rc9', name: 'Reality Checker' }; } });
  await admin.command('iş');
  assert.deepEqual(hired, ['testing-reality-checker']);
  assert.ok(admin.board().every((t) => t.status === 'done'));
});

test('iş yükü: yönetici istemi Codex/agy\'ye iş, Claude\'a planlama/eksik giderme der', async () => {
  const { ADMIN_PERSONA } = await import('../src/agents/admin.js');
  assert.match(ADMIN_PERSONA, /codex/i);
  assert.match(ADMIN_PERSONA, /antigravity/i);
  assert.match(ADMIN_PERSONA, /eksik/);
});

test('2. düzeltme turu Claude motorlu kodlayıcıya gider (eksikleri Claude giderir)', async () => {
  const t3 = [...rcTeam, { id: 'cl', name: 'Backend Architect', engine: 'claude', division: 'engineering', catalogId: 'engineering-backend-architect' }];
  let checks = 0;
  const runner = { calls: [], async ask(id, text) {
    this.calls.push({ id, text });
    if (id === 'admin' && /Görev raporu/.test(text)) return { text: 'özet' };
    if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A' }] }) };
    if (id === 'rc') { checks++; return { text: checks < 3 ? 'eksik\nKARAR: NEEDS WORK' : 'KARAR: PASS' }; }
    return { text: `${id} ok` };
  } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => t3, dirOk: () => true, review: true });
  await admin.command('iş');
  assert.deepEqual(runner.calls.map((c) => c.id), ['admin', 'fe', 'rc', 'fe', 'rc', 'cl', 'rc', 'admin']);
  assert.match(runner.calls[5].text, /eksik/);
  const card = admin.board()[0];
  assert.equal(card.status, 'done');
  assert.equal(card.fixer, 'Backend Architect');
});

test('Prompt Master: ham metin → net prompt → yönetici', async () => {
  const { promptMasterPersona } = await import('../src/agents/admin.js');
  const p = promptMasterPersona('# SKILL\nYou are the "Prompt Optimizer."');
  assert.match(p, /Prompt Optimizer/);
  assert.match(p, /yönetici/i);
});

test('açılışta yarım kalmış kartlar "hata: uygulama kapandı" olur', () => {
  const a = createAdmin({ runner: {}, adminId: () => 'admin', team: () => [], dirOk: () => true, board: [{ id: 'x', status: 'doing' }, { id: 'y', status: 'done' }] });
  assert.deepEqual(a.board().map((t) => t.status), ['failed', 'done']);
  assert.match(a.board()[0].error, /kapandı/);
});

test('aynı klasördeki görevler sırayla, farklı klasördekiler paralel çalışır', async () => {
  const log = [];
  const runner = { async ask(id, text) {
    if (id === 'admin' && /Görev raporu/.test(text)) return { text: 'özet' };
    if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/p' }, { agent: 'rc', task: 'B', cwd: 'C:/p' }, { agent: 'rc', task: 'C', cwd: 'C:/q' }] }) };
    log.push(`+${text}`); await new Promise((r) => setTimeout(r, 20)); log.push(`-${text}`);
    return { text: 'ok' };
  } };
  await createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true }).command('iş');
  const ia = log.indexOf('-A'); const ib = log.indexOf('+B');
  assert.ok(ia < ib, `A bitmeden B başladı: ${log}`);
  assert.ok(log.indexOf('+C') < log.indexOf('-A'), 'C paralel');
});

test('yönetici istemi: Claude uzmanları "kodlama verme" diye işaretli; cevapta JSON yerine yalnız reply görünür', async () => {
  const p = adminPrompt('x', [{ id: 'cl', name: 'Arch', engine: 'claude', division: 'engineering' }, { id: 'cx', name: 'Dev', engine: 'codex', division: 'engineering' }]);
  assert.match(p, /cl: Arch.*claude.*kodlama verme/);
  assert.doesNotMatch(p, /cx: Dev.*kodlama verme/);
  const calls = [];
  const runner = { async ask(id, text, opts = {}) { calls.push(opts); if (/Görev raporu/.test(text)) return { text: 'ö' }; return { text: id === 'admin' ? json({ reply: 'Verdim', tasks: [{ agent: 'fe', task: 'A' }] }) : 'ok' }; } };
  await createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true }).command('x');
  assert.equal(calls[0].shown(json({ reply: 'Verdim', tasks: [] })), 'Verdim');
  assert.equal(calls[0].shown('bozuk cevap'), 'bozuk cevap');
});

test('limit koruması: Claude limiti doluyken istem uyarır, kontrol ve Claude düzeltici atlanır', async () => {
  const calls = [];
  const runner = { async ask(id, text) { calls.push({ id, text }); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A' }] }) }; return { text: 'ok' }; } };
  await createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, guard: () => true }).command('iş');
  assert.match(calls[0].text, /Claude limiti/);
  assert.deepEqual(calls.map((c) => c.id), ['admin', 'fe', 'admin'], 'Reality Checker çağrılmadı');
});

test('git dalı: prepare klasörü çalışma ağacına çevirir; kart dalı tutar; kontrolcü aynı ağaca bakar', async () => {
  const calls = [];
  const runner = { async ask(id, text, opts = {}) { calls.push({ id, cwd: opts.cwd }); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/repo' }] }) }; if (id === 'rc') return { text: 'KARAR: PASS' }; return { text: 'ok' }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, prepare: async (cwd, card) => ({ cwd: `C:/wt/${card.id}`, branch: `ofis/${card.id}` }) });
  await admin.command('iş');
  const card = admin.board()[0];
  assert.equal(card.branch, `ofis/${card.id}`);
  assert.equal(calls.find((c) => c.id === 'fe').cwd, `C:/wt/${card.id}`);
  assert.equal(calls.find((c) => c.id === 'rc').cwd, `C:/wt/${card.id}`);
});

test('pano: biten görev yeniden başlatılır; süren görev iptal edilir', async () => {
  let release;
  let runs = 0;
  const cancelled = [];
  const runner = {
    async ask(id, text) {
      if (/Görev raporu/.test(text)) return { text: 'ö' };
      if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'Sayfa yap' }] }) };
      if (text === 'Sayfa yap' && ++runs === 1) return { text: 'ok' };
      return new Promise((res, rej) => { release = rej; });
    },
    cancel(id) { cancelled.push(id); release?.(new Error('durduruldu')); },
  };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true });
  await admin.command('iş');
  const first = admin.board()[0];
  assert.equal(first.status, 'done');
  assert.equal(first.task, 'Sayfa yap');
  assert.equal(admin.retry(first.id).ok, true);
  await new Promise((r) => setTimeout(r, 10));
  const again = admin.board().at(-1);
  assert.notEqual(again.id, first.id);
  assert.equal(again.status, 'doing');
  assert.equal(admin.retry(again.id).ok, false, 'süren görev yeniden başlatılmaz');
  assert.equal(admin.cancel(again.id).ok, true);
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(cancelled, ['fe']);
  assert.equal(admin.board().at(-1).status, 'failed');
  assert.match(admin.board().at(-1).error, /iptal/);
});

test('git dalı bilgisi kartta (depo, ağaç); annotate kartı günceller', async () => {
  const runner = { async ask(id, text) { if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/repo' }] }) }; return { text: 'ok' }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true, prepare: async () => ({ cwd: 'C:/wt/x', branch: 'ofis/x', repo: 'C:/repo', worktree: 'C:/wt/x' }) });
  await admin.command('iş');
  const c = admin.board()[0];
  assert.equal(c.repo, 'C:/repo');
  assert.equal(c.worktree, 'C:/wt/x');
  assert.equal(admin.annotate(c.id, { merged: true }).ok, true);
  assert.equal(admin.board()[0].merged, true);
  assert.equal(admin.annotate('yok', {}).ok, false);
});

test('yönetici istemi uzmanların geçmiş başarısını gösterir', () => {
  const p = adminPrompt('x', [{ id: 'cx', name: 'Dev', engine: 'codex', division: 'engineering', stats: '5 görev, %80 başarı' }]);
  assert.match(p, /cx: Dev.*geçmiş: 5 görev, %80 başarı/);
  assert.match(p, /başarısı yüksek/);
});

test('prepare null dönerse (git dalı kapalı) görev normal klasörde çalışır', async () => {
  const calls = [];
  const runner = { async ask(id, text, o = {}) { calls.push(o.cwd); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/p' }] }) }; return { text: 'ok' }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true, prepare: () => null });
  await admin.command('iş');
  assert.equal(admin.board()[0].status, 'done');
  assert.equal(calls[1], 'C:/p');
});

test('zaman aşımı: takılan uzman durdurulur, kart "zaman aşımı" hatası alır, komut biter', async () => {
  const cancelled = [];
  let rej;
  const runner = {
    async ask(id, text) { if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A' }] }) }; return new Promise((_, r) => { rej = r; }); },
    cancel(id) { cancelled.push(id); rej?.(new Error('durduruldu')); },
  };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true, taskTimeoutMs: () => 30 });
  const r = await admin.command('iş');
  assert.equal(r.ok, true);
  assert.deepEqual(cancelled, ['fe']);
  assert.match(admin.board()[0].error, /zaman aşımı/);
});

test('git kopyası: uzmana asıl klasör yerine çalışma kopyasında çalışacağı söylenir; aynı komutun kartları aynı gruptadır', async () => {
  const calls = [];
  const runner = { async ask(id, text, o = {}) { calls.push({ id, text, cwd: o.cwd }); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'C:/repo klasöründe A yap', cwd: 'C:/repo' }, { agent: 'rc', task: 'B', cwd: 'C:/repo' }] }) }; return { text: 'ok' }; } };
  const groups = [];
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true, prepare: async (cwd, card) => { groups.push(card.group); return { cwd: 'C:/wt/g', branch: 'ofis/g', repo: 'C:/repo', worktree: 'C:/wt/g' }; } });
  await admin.command('iş');
  const fe = calls.find((c) => c.id === 'fe');
  assert.match(fe.text, /C:\/wt\/g/);
  assert.match(fe.text, /C:\/wt\/g klasöründe A yap/, 'asıl yol kopya yoluyla değişti');
  assert.ok(groups[0] && groups[0] === groups[1], 'aynı komut aynı grup');
});

test('swapPath: asıl yol (ayraç ve harf farkıyla) kopya yoluyla değişir', async () => {
  const { swapPath } = await import('../src/agents/admin.js');
  const t = 'C:\\Users\\A\\Desktop\\proje klasöründe yap; dosya c:/users/a/desktop/proje/public/x.js';
  const r = swapPath(t, 'C:\\Users\\A\\Desktop\\proje', 'D:\\wt\\g1');
  assert.equal(r, 'D:\\wt\\g1 klasöründe yap; dosya D:\\wt\\g1/public/x.js');
});

test('limit koruması kontrolü atlarsa kart bunu söyler', async () => {
  const runner = { async ask(id, text) { if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A' }] }) }; return { text: 'ok' }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, guard: () => true });
  await admin.command('iş');
  assert.match(admin.board()[0].reviewSkipped, /Claude limiti/);
});

test('bütünleşme kontrolü: ortak dalda ≥2 görev bitince kontrolcü bütünü (testler dahil) dener; sonuç rapora girer', async () => {
  const calls = [];
  const runner = { async ask(id, text, o = {}) {
    calls.push({ id, text, cwd: o.cwd });
    if (/Görev raporu/.test(text)) return { text: 'ö' };
    if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/repo' }, { agent: 'fe', task: 'B', cwd: 'C:/repo' }] }) };
    if (id === 'rc' && /Bütünleşme/.test(text)) return { text: 'npm test geçti.\nKARAR: PASS' };
    if (id === 'rc') return { text: 'KARAR: PASS' };
    return { text: 'ok' };
  } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, prepare: async () => ({ cwd: 'C:/wt/g', branch: 'ofis/g', repo: 'C:/repo', worktree: 'C:/wt/g' }) });
  await admin.command('iş');
  const integ = calls.find((c) => c.id === 'rc' && /Bütünleşme/.test(c.text));
  assert.ok(integ, 'bütünleşme kontrolü yapıldı');
  assert.equal(integ.cwd, 'C:/wt/g');
  assert.match(calls.at(-1).text, /bütünleşme: geçti/i);
});

test('git kopyasında her uzman turundan sonra afterRun (Ofis commit) çağrılır; talimat ve kontrolde "commit Ofis\'in işi" denir', async () => {
  const runs = []; const texts = [];
  const runner = { async ask(id, text) { texts.push({ id, text }); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/repo' }] }) }; if (id === 'rc') return { text: 'KARAR: PASS' }; return { text: 'ok' }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, prepare: async () => ({ cwd: 'C:/wt/g', branch: 'ofis/g', repo: 'C:/repo', worktree: 'C:/wt/g' }), afterRun: async (card) => { runs.push(card.worktree); } });
  await admin.command('iş');
  assert.deepEqual(runs, ['C:/wt/g']);
  assert.match(texts.find((t) => t.id === 'fe').text, /commit.*Ofis/i);
  assert.match(texts.find((t) => t.id === 'rc').text, /commit.*Ofis/i);
});

test('pano kırpılırken birleştirilmemiş dalı olan kartlar kalır', () => {
  const old = [{ id: 'p1', status: 'done', branch: 'ofis/p1', worktree: 'C:/wt/p1' }, ...Array.from({ length: 40 }, (_, i) => ({ id: `x${i}`, status: 'done' }))];
  const a = createAdmin({ runner: {}, adminId: () => 'admin', team: () => [], dirOk: () => true, board: old });
  assert.ok(a.board().some((t) => t.id === 'p1'), 'bekleyen dal kartı korunur');
  assert.ok(a.board().length <= 31);
});

test('kart kullanımı: uzman ve kontrolcü turlarının token/maliyeti toplanır; istem depo durumunu içerir', async () => {
  const calls = [];
  const runner = { async ask(id, text) { calls.push(text); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A' }] }) }; if (id === 'rc') return { text: 'KARAR: PASS', usage: { in: 10, out: 2, cost: 0.5 } }; return { text: 'ok', usage: { in: 100, out: 20, cost: 0 } }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => rcTeam, dirOk: () => true, review: true, repoState: () => 'Bekleyen dal: ofis/abc (C:/repo) — giriş sayfası' });
  await admin.command('iş');
  assert.deepEqual(admin.board()[0].usage, { in: 110, out: 22, cost: 0.5 });
  assert.match(calls[0], /Bekleyen dal: ofis\/abc/);
});

test('yönetici talimatı: aynı klasördeki görevlerin sırayla ve tek dalda çalıştığını bilir', async () => {
  const { ADMIN_PERSONA } = await import('../src/agents/admin.js');
  assert.match(ADMIN_PERSONA, /aynı klasördeki[\s\S]*sırayla/);
});

test('görev klasörü yoksa ensureDir ile oluşturulur ve uzman orada çalışır; oluşturulamazsa yok sayılır', async () => {
  const made = []; const calls = [];
  const exists = new Set(['C:/repo']);
  const runner = { async ask(id, text, o = {}) { calls.push({ id, cwd: o.cwd }); if (/Görev raporu/.test(text)) return { text: 'ö' }; if (id === 'admin') return { text: json({ reply: 'x', tasks: [{ agent: 'fe', task: 'A', cwd: 'C:/Users/A/Desktop/yeni' }, { agent: 'fe', task: 'B', cwd: 'C:/Windows/x' }] }) }; return { text: 'ok' }; } };
  const admin = createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: (d) => exists.has(d), ensureDir: async (d) => { if (!d.startsWith('C:/Users/')) return false; made.push(d); exists.add(d); return true; } });
  await admin.command('iş');
  assert.deepEqual(made, ['C:/Users/A/Desktop/yeni']);
  assert.deepEqual(calls.filter((c) => c.id === 'fe').map((c) => c.cwd), ['C:/Users/A/Desktop/yeni', undefined]);
});

test('her komut isteminde sıralı çalışma kuralı yazar', () => {
  assert.match(adminPrompt('x', team), /aynı cwd[\s\S]*sırayla/);
});

test('kapalı motorlar yönetici istemine yazılır', async () => {
  const calls = [];
  const runner = { async ask(id, text) { calls.push(text); return { text: json({ reply: 'x' }) }; } };
  await createAdmin({ runner, adminId: () => 'admin', team: () => team, dirOk: () => true, engineState: () => ({ codex: new Date(2026, 9, 16, 7, 52).getTime() }) }).command('iş');
  assert.match(calls[0], /KAPALI MOTORLAR[\s\S]*codex[\s\S]*07:52/);
});
