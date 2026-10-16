// Ofis modeli (saf): Feyzullah durumu (island-model'in state'i) → ofis sahnesi.
// Her oturum bir karakter: masada çalışır (kod/terminal/tarayıcı/düşünme), izin bekleyince ayağa
// kalkar, bitince dinlenme köşesine gider, bir süre sonra ofisten çıkar.

export const AGENT_NAMES = { claude: 'Claude', codex: 'Codex', antigravity: 'agy', api: 'API' };
const LABELS = {
  code: 'kod yazıyor', read: 'kod okuyor', terminal: 'komut çalıştırıyor', browser: "web'de arıyor",
  tool: 'araç kullanıyor', thinking: 'düşünüyor…', waiting: 'izin bekliyor', resting: 'mola', idle: 'boşta',
};
const KIND_ACTIVITY = { edit: 'code', write: 'code', plan: 'code', read: 'read', search: 'read', run: 'terminal', web: 'browser', mcp: 'tool', tool: 'tool', agent: 'tool' };
const QUIET = new Set(['note', 'guard', 'session']);
const AT_DESK = new Set(['code', 'read', 'terminal', 'browser', 'tool', 'thinking']);
const GONE_AFTER_MS = 30 * 60_000; // boştaki oturum bu kadar sonra ofisten çıkar

export const newMemory = () => ({ desks: new Map() }); // oturum anahtarı → masa no
const project = (cwd) => String(cwd ?? '').split(/[\\/]/).filter(Boolean).pop() ?? '';

function lastEntry(entries, s) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.agent === s.agent && e.session === s.session && !QUIET.has(e.kind)) return e;
  }
  return null;
}

/** Bir oturumun etkinliği; null → ofiste değil. */
function activityOf(s, last, pending, now, restMs) {
  if (s.state === 'ended') return null;
  if (pending || s.state === 'waiting') return 'waiting';
  if (s.state === 'thinking') return 'thinking';
  if (last?.kind === 'stop' || s.state === 'idle') {
    if (s.persistent && last?.kind !== 'stop') return 'idle'; // eklenmiş ama henüz iş yapmamış API ajanı
    const at = last?.at ?? s.lastAt;
    if (now - at < restMs) return 'resting';
    if (s.persistent) return 'idle'; // eklenen API ajanları ofiste kalır
    return now - s.lastAt < GONE_AFTER_MS && s.state !== 'idle' ? 'idle' : null;
  }
  if (s.state === 'working') return KIND_ACTIVITY[last?.kind] ?? 'code';
  return null;
}

/**
 * opts: { now, memory (newMemory()), desks = 8, restMs = 10 dk }
 * Dönüş: { agents: [{ key, agent, session, name, project, activity, label, place, desk, since, pending }], counts }
 */
export function buildOffice(state, { now = Date.now(), memory = newMemory(), desks = 8, restMs = 10 * 60_000 } = {}) {
  const pendingBy = new Map();
  for (const p of state.pending.values()) pendingBy.set(`${p.agent}:${p.session}`, p);

  const agents = [];
  for (const [key, s] of state.sessions) {
    const last = lastEntry(state.entries, s);
    const pending = pendingBy.get(key) ?? null;
    const activity = activityOf(s, last, pending, now, restMs);
    if (!activity) { memory.desks.delete(key); continue; }
    agents.push({
      key, agent: s.agent, session: s.session,
      name: s.displayName || `${AGENT_NAMES[s.agent] ?? s.agent}${project(s.cwd) ? ` · ${project(s.cwd)}` : ''}`,
      project: project(s.cwd), activity, label: LABELS[activity] ?? activity, color: s.color ?? null,
      since: last?.at ?? s.lastAt, pending, desk: null, place: 'lounge', fixedDesk: s.fixedDesk ?? null,
    });
  }
  // Masa ataması: önce kayıtlı masasına, sonra boş masaya. İzin bekleyen masasının yanında ayakta.
  const used = new Set();
  // Sabit masalı ajan (yönetici) her zaman kendi masasında; o masa başkasına verilmez.
  for (const a of agents) if (a.fixedDesk != null && a.fixedDesk < desks) { a.desk = a.fixedDesk; used.add(a.fixedDesk); }
  const wantsDesk = (a) => a.fixedDesk == null && (AT_DESK.has(a.activity) || a.activity === 'waiting');
  for (const a of agents) {
    const d = memory.desks.get(a.key);
    if (wantsDesk(a) && d != null && d < desks && !used.has(d)) { a.desk = d; used.add(d); }
  }
  for (const a of agents) {
    if (!wantsDesk(a) || a.desk != null) continue;
    for (let d = 0; d < desks; d++) if (!used.has(d)) { a.desk = d; used.add(d); memory.desks.set(a.key, d); break; }
  }
  for (const a of agents) {
    if (a.fixedDesk != null && a.desk != null) { a.place = a.activity === 'waiting' ? 'standing' : 'desk'; continue; }
    if (a.activity === 'waiting' || (wantsDesk(a) && a.desk == null)) a.place = 'standing';
    else if (AT_DESK.has(a.activity)) a.place = 'desk';
    else a.place = 'lounge';
  }
  agents.sort((x, y) => x.key.localeCompare(y.key));
  const counts = {
    working: agents.filter((a) => AT_DESK.has(a.activity)).length,
    resting: agents.filter((a) => a.activity === 'resting' || a.activity === 'idle').length,
    waiting: agents.filter((a) => a.activity === 'waiting').length,
    guards: state.guards?.filter((g) => now - (g.at ?? 0) < 60_000).length ?? 0,
  };
  return { agents, counts };
}

/** Sağ panel: seçili oturumun görevi, son kayıtları (yeni → eski), dokunduğu dosyalar. */
export function agentDetails(state, key, limit = 60) {
  const s = state.sessions.get(key);
  if (!s) return null;
  const mine = state.entries.filter((e) => e.agent === s.agent && e.session === s.session);
  const prompt = [...mine].reverse().find((e) => e.kind === 'prompt');
  const files = new Map();
  for (const e of mine) for (const f of e.files ?? []) files.set(f.path, f);
  let pending = null;
  for (const p of state.pending.values()) if (p.agent === s.agent && p.session === s.session) pending = p;
  return {
    key, agent: s.agent, session: s.session, state: s.state, cwd: s.cwd, project: project(s.cwd),
    task: prompt ? (prompt.text || prompt.title) : null,
    pending,
    files: [...files.values()],
    entries: mine.slice(-limit).reverse().map((e) => ({
      id: e.id, kind: e.kind, title: e.text || e.title, at: e.at, status: e.status,
      command: e.command, output: e.output, diff: e.diff, files: e.files, detail: e.detail,
    })),
  };
}

/** Köprü durumu + API ajanları (runner.snapshot()) → birleşik durum. Girdiler değiştirilmez. */
export function withApiAgents(state, api) {
  if (!api) return state;
  // CLI uzmanlarının köprüdeki oturumları (bağlar) uzmanın kendisine katılır: ayrı karakter olmaz,
  // araç kayıtları (komut, diff) ve onay istekleri uzmana geçer; prompt/stop çalıştırıcıdan geldiği için atlanır.
  const links = new Map(api.links ?? []);
  const remap = (agent, session) => {
    const to = links.get(`${agent}:${session}`);
    if (!to) return null;
    const i = to.indexOf(':');
    return { agent: to.slice(0, i), session: to.slice(i + 1) };
  };
  const sessions = new Map();
  // 'ofis' oturumu Ofis'in kendi yöneticisinin köprüdeki yansıması (telefon için): burada ayrı karakter değil.
  for (const [k, s] of state.sessions) if (!links.has(k) && s.agent !== 'ofis') sessions.set(k, s);
  for (const s of api.sessions) sessions.set(`${s.agent}:${s.session}`, s);
  const entries = [];
  for (const e of state.entries) {
    if (e.agent === 'ofis') continue;
    const to = remap(e.agent, e.session);
    if (!to) entries.push(e);
    else if (e.kind !== 'prompt' && e.kind !== 'stop' && e.kind !== 'session') entries.push({ ...e, ...to });
  }
  const pending = new Map();
  for (const [id, p] of state.pending) { const to = remap(p.agent, p.session); pending.set(id, to ? { ...p, ...to } : p); }
  return { ...state, sessions, pending, entries: [...entries, ...api.entries].sort((a, b) => a.at - b.at) };
}
