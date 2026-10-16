import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentDetails, buildOffice, newMemory } from '../src/office-model.js';

const NOW = 1_000_000_000;
const sess = (agent, session, state, lastAt = NOW - 1000, cwd = 'C:/p/feyzullah-1') => ({ agent, session, state, lastAt, cwd });
const ent = (agent, session, kind, at, extra = {}) => ({ id: `${session}-${kind}-${at}`, agent, session, kind, title: kind, at, status: 'ok', ...extra });
const state = (sessions, entries = [], pending = []) => ({ sessions: new Map(sessions.map((s) => [`${s.agent}:${s.session}`, s])), entries, pending: new Map(pending.map((p) => [p.id, p])), guards: [] });

test('etkinlik son kayda göre: edit→code, run→terminal, web→browser, thinking, idle→gone', () => {
  const st = state(
    [sess('claude', 'a', 'working'), sess('codex', 'b', 'working'), sess('antigravity', 'c', 'working'), sess('claude', 'd', 'thinking'), sess('claude', 'old', 'idle', NOW - 3_600_000)],
    [ent('claude', 'a', 'edit', NOW - 50), ent('codex', 'b', 'run', NOW - 40), ent('antigravity', 'c', 'web', NOW - 30)],
  );
  const o = buildOffice(st, { now: NOW, memory: newMemory() });
  const by = Object.fromEntries(o.agents.map((x) => [x.session, x]));
  assert.equal(by.a.activity, 'code');
  assert.equal(by.b.activity, 'terminal');
  assert.equal(by.c.activity, 'browser');
  assert.equal(by.d.activity, 'thinking');
  assert.equal(by.old, undefined, 'uzun süredir boştaki oturum ofiste yok');
  assert.equal(by.a.name, 'Claude · feyzullah-1');
  assert.equal(by.b.label, 'komut çalıştırıyor');
  assert.equal(o.counts.working, 4);
});

test('izin bekleyen: waiting, ayakta, istek bilgisiyle; sayaçta', () => {
  const st = state([sess('claude', 'a', 'waiting')], [ent('claude', 'a', 'permission', NOW - 10)], [{ id: 'p1', agent: 'claude', session: 'a', title: 'npm publish', command: 'npm publish' }]);
  const [a] = buildOffice(st, { now: NOW, memory: newMemory() }).agents;
  assert.equal(a.activity, 'waiting');
  assert.equal(a.place, 'standing');
  assert.equal(a.pending.id, 'p1');
});

test('bitti: dinlenme süresince lounge, sonra ofisten çıkar', () => {
  const st = state([sess('codex', 'b', 'idle', NOW - 60_000)], [ent('codex', 'b', 'stop', NOW - 60_000, { title: 'Tamam' })]);
  const mem = newMemory();
  const o1 = buildOffice(st, { now: NOW, memory: mem, restMs: 600_000 });
  assert.equal(o1.agents[0].activity, 'resting');
  assert.equal(o1.agents[0].place, 'lounge');
  assert.equal(o1.counts.resting, 1);
  const o2 = buildOffice(st, { now: NOW + 700_000, memory: mem, restMs: 600_000 });
  assert.equal(o2.agents.length, 0);
});

test('masa ataması kalıcı: aynı oturum aynı masaya döner; boş masa yoksa ayakta bekler', () => {
  const mem = newMemory();
  const w = (ids) => state(ids.map((id) => sess('claude', id, 'working')), ids.map((id) => ent('claude', id, 'edit', NOW - 5)));
  const o1 = buildOffice(w(['x', 'y']), { now: NOW, memory: mem, desks: 2 });
  const deskOfX = o1.agents.find((a) => a.session === 'x').desk;
  const o2 = buildOffice(w(['y', 'x', 'z']), { now: NOW, memory: mem, desks: 2 });
  assert.equal(o2.agents.find((a) => a.session === 'x').desk, deskOfX);
  const z = o2.agents.find((a) => a.session === 'z');
  assert.equal(z.desk, null);
  assert.equal(z.place, 'standing');
});

test('ayrıntılar: oturumun kayıtları yeniden eskiye, diff/komut/çıktı ile', () => {
  const st = state([sess('claude', 'a', 'working')], [
    ent('claude', 'a', 'prompt', NOW - 100, { title: 'README yaz' }),
    ent('claude', 'a', 'edit', NOW - 50, { title: 'README.md', diff: '+merhaba', files: [{ path: 'README.md', change: 'edit' }] }),
    ent('claude', 'a', 'run', NOW - 20, { command: 'npm test', output: 'ok', status: 'failed' }),
    ent('codex', 'b', 'run', NOW - 10),
  ]);
  const d = agentDetails(st, 'claude:a');
  assert.equal(d.task, 'README yaz');
  assert.deepEqual(d.entries.map((e) => e.kind), ['run', 'edit', 'prompt']);
  assert.equal(d.entries[0].command, 'npm test');
  assert.equal(d.entries[1].diff, '+merhaba');
  assert.deepEqual(d.files, [{ path: 'README.md', change: 'edit' }]);
  assert.equal(agentDetails(st, 'yok:yok'), null);
});

test('kalıcı (API) ajan: boştayken ofisten çıkmaz, kendi adıyla görünür', () => {
  const st = state([{ agent: 'api', session: 'a1', state: 'idle', lastAt: NOW - 7_200_000, persistent: true, displayName: 'Ayşe (Claude)' }]);
  const [a] = buildOffice(st, { now: NOW, memory: newMemory() }).agents;
  assert.equal(a.activity, 'idle');
  assert.equal(a.place, 'lounge');
  assert.equal(a.name, 'Ayşe (Claude)');
});

test('API ajanları köprü durumuyla birleşir (Feyzullah durumu değişmez)', async () => {
  const { withApiAgents } = await import('../src/office-model.js');
  const feyz = state([sess('claude', 'a', 'working')], [ent('claude', 'a', 'edit', NOW - 5)]);
  const merged = withApiAgents(feyz, { sessions: [{ agent: 'api', session: 'x1', state: 'idle', lastAt: NOW, persistent: true, displayName: 'Ayşe' }], entries: [{ id: 'p', agent: 'api', session: 'x1', kind: 'prompt', at: NOW - 1, title: 'selam' }] });
  assert.equal(merged.sessions.size, 2);
  assert.ok(merged.sessions.has('api:x1'));
  assert.equal(feyz.sessions.size, 1);
  assert.equal(merged.entries.length, 2);
  assert.deepEqual([...merged.pending], [...feyz.pending]);
});

test('hiç iş yapmamış kalıcı ajan "mola" değil "boşta" görünür', () => {
  const st = state([{ agent: 'api', session: 'a1', state: 'idle', lastAt: NOW - 1000, persistent: true, displayName: 'A' }]);
  assert.equal(buildOffice(st, { now: NOW, memory: newMemory() }).agents[0].activity, 'idle');
});

test('bağlı CLI oturumu uzmana katılır: ayrı karakter yok, araç kayıtları ve onay uzmana geçer', async () => {
  const { withApiAgents } = await import('../src/office-model.js');
  const feyz = state(
    [sess('claude', 'sess-9', 'waiting')],
    [ent('claude', 'sess-9', 'prompt', NOW - 9, { title: 'kimlik+görev' }), ent('claude', 'sess-9', 'run', NOW - 5, { command: 'npm test' })],
    [{ id: 'p1', agent: 'claude', session: 'sess-9', title: 'npm test' }],
  );
  const api = {
    sessions: [{ agent: 'api', session: 'e1', state: 'working', lastAt: NOW, persistent: true, displayName: 'RC' }],
    entries: [{ id: 'q', agent: 'api', session: 'e1', kind: 'prompt', at: NOW - 10, title: 'görev' }],
    links: [['claude:sess-9', 'api:e1']],
  };
  const m = withApiAgents(feyz, api);
  assert.equal(m.sessions.has('claude:sess-9'), false);
  const mine = m.entries.filter((e) => e.agent === 'api' && e.session === 'e1');
  assert.deepEqual(mine.map((e) => e.kind).sort(), ['prompt', 'run'], 'köprünün prompt kaydı tekrar etmez');
  const [p] = [...m.pending.values()];
  assert.equal(p.agent, 'api'); assert.equal(p.session, 'e1');
  const [a] = buildOffice(m, { now: NOW, memory: newMemory() }).agents;
  assert.equal(a.activity, 'waiting');
});

test('sabit masalı ajan (yönetici) boştayken de kendi masasında oturur; o masa başkasına verilmez', () => {
  const st = state([
    { agent: 'api', session: 'adm', state: 'idle', lastAt: NOW, persistent: true, displayName: 'Yönetici', fixedDesk: 1 },
    sess('claude', 'a', 'working'), sess('claude', 'b', 'working'),
  ], [ent('claude', 'a', 'edit', NOW - 5), ent('claude', 'b', 'edit', NOW - 5)]);
  const o = buildOffice(st, { now: NOW, memory: newMemory(), desks: 3 });
  const adm = o.agents.find((a) => a.session === 'adm');
  assert.equal(adm.place, 'desk'); assert.equal(adm.desk, 1);
  assert.ok(o.agents.filter((a) => a.session !== 'adm').every((a) => a.desk !== 1));
});

test('köprüdeki "ofis" oturumu (telefon yansıması) ofiste ayrı karakter olmaz', async () => {
  const { withApiAgents } = await import('../src/office-model.js');
  const s = { sessions: new Map([['ofis:admin', { agent: 'ofis', session: 'admin', state: 'idle', lastAt: 1 }], ['claude:c1', { agent: 'claude', session: 'c1', state: 'idle', lastAt: 1 }]]), entries: [{ id: 'o1', agent: 'ofis', session: 'admin', kind: 'stop', at: 1 }], pending: new Map() };
  const m = withApiAgents(s, { sessions: [], entries: [], links: [] });
  assert.deepEqual([...m.sessions.keys()], ['claude:c1']);
  assert.equal(m.entries.length, 0);
});
