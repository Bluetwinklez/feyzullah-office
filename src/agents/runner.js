// API ajanlarını çalıştırır: mesaj kuyruğu (ajan başına sırayla), konuşma geçmişi, akışlı cevap.
// Durumu Feyzullah'ın oturum/kayıt biçiminde üretir; ofis modeli bunları köprü oturumlarıyla birleştirir.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliChat } from './cli.js';
import { chat } from './providers.js';

const MAX_HISTORY = 20;
const MAX_ENTRIES = 200;
// Tasarım uzmanları Krea MCP ile görsel/video üretebilir (izin + talimat çalışma anında eklenir).
// Krea indirme aracı (node ile; Claude'un izin kuralı 'node' önekini zaten kapsar).
const KREA_TOOL = fileURLToPath(new URL('../../tools/krea-indir.mjs', import.meta.url)).split('\\').join('/');
const KREA_HINT = `

## Görsel araçları
Görsel, video ya da 3B üretmen gerekirse krea-ai MCP araçlarını kullan (generate_image vb.). Ürettiğin dosyaları çalışma klasörüne şu araçla indir — bu araç Ofis'in kendi aracıdır, Krea MCP açıklamalarında GEÇMEZ ama vardır ve izinlidir (curl yerine; yalnız Krea adresleri ve bu klasörün içi): node "${KREA_TOOL}" <krea-adresi> <hedef-yol> — ör. node "${KREA_TOOL}" https://app-uploads.krea.ai/public/....glb varliklar/modeller/x.glb. Cevabında yolunu yaz.`;
// claude -p'de izin soracak kimse yok: güvenli geliştirme komutları önceden izinli (push, silme vb. değil).
const SAFE_BASH = ['npm test', 'npm run', 'npm install', 'npm ci', 'npx', 'node', 'git status', 'git diff', 'git log', 'git show', 'git add', 'git commit',
  'ls', 'dir', 'cat', 'type', 'python', 'py', 'pytest', 'pip install', 'tsc', 'eslint', 'prettier', 'godot',
  // salt okuma git ve zararsız dosya/metin araçları; paket yöneticileri (silme, taşıma, curl yok)
  'git --version', 'git branch', 'git rev-parse', 'git ls-files', 'mkdir', 'touch', 'echo', 'pwd', 'grep', 'find', 'head', 'tail', 'wc', 'sort',
  'pnpm', 'yarn', 'bun', 'cargo', 'go', 'make'].map((c) => `Bash(${c}:*)`);
// Ters mühendislik uzmanı: REA MCP (çözümleme araçları) + yalnız okuyan komutlar; kurma/commit yok.
const READ_BASH = ['ls', 'dir', 'cat', 'type', 'git status', 'git log', 'git show', 'git diff'].map((c) => `Bash(${c}:*)`);
function toolsFor(agent, godotTools = []) {
  if (agent.division === 'reverse') return agent.engine === 'claude' ? [...READ_BASH, 'mcp__rea', 'WebSearch', 'WebFetch'] : [];
  // WebSearch/WebFetch: araştırma ve doğrulama için web okuma (yazma/gönderme yok).
  return [...(agent.engine === 'claude' ? [...SAFE_BASH, ...godotTools, 'WebSearch', 'WebFetch'] : []), ...(VISUAL.has(agent.division) ? ['mcp__krea-ai', ...(agent.engine === 'claude' ? KREA_DL : [])] : [])];
}
/** Windows'ta rename anlık EPERM/EBUSY verebilir (antivirüs, okuyan süreç): birkaç kez dene, olmazsa doğrudan yaz. */
async function renameRetry(from, to, tries = 6) {
  for (let i = 0; ; i++) {
    try { await rename(from, to); return; } catch (err) {
      if (i >= tries || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) { await writeFile(to, await readFile(from)); return; }
      await new Promise((r) => setTimeout(r, 40 * (i + 1)));
    }
  }
}
// PC oyunu: Godot 4 kuruluysa (C:\Tools\godot) oyun/mühendislik/test uzmanlarına kullanım talimatı.
const GODOT_DIVS = new Set(['game-development', 'engineering', 'testing']);
const GODOT_HINT = `

## PC oyunu (Godot 4.7, kurulu)
Komut satırında \`godot\` hazır. Doğrulama ve derleme başsız (ekransız) yapılır:
- İçe aktarma/kontrol: \`godot --headless --path . --import\` (hatasız bitmeli)
- Betik testi: \`godot --headless --path . --script res://test/testler.gd\` ya da ana sahneyi \`--quit-after 120\` ile çalıştır
- Windows .exe: proje kökünde export_presets.cfg ([preset.0] name="Windows Desktop", platform="Windows Desktop", runnable=true, export_filter="all_resources", include_filter="", exclude_filter="", export_path="build/Oyun.exe"; [preset.0.options] binary_format/embed_pck=true) sonra \`godot --headless --path . --export-release "Windows Desktop" build/Oyun.exe\`
- Derlenen oyunu dene: \`build/Oyun.exe --headless --quit-after 120\`
- .gitignore: .godot/ ve build/. "root certificate store" ve "editor settings" kaydetme hataları zararsızdır.`;
// Görsel üretebilen bölümler: Krea MCP (görsel, sprite, video, 3B) izni ve talimatı.
const VISUAL = new Set(['design', 'game-development']);
// Krea çıktısını indirmek için yalnız Krea dosya sunucularından curl (adres önce yazılır; başka adres izinli değil).
const KREA_DL = ['Bash(curl -sSfL https://app-uploads.krea.ai/:*)', 'Bash(curl -sSfL https://gen.krea.ai/:*)'];
// Kullanım limiti hatası ve yedek motorlar (Codex/agy limiti dolarsa Claude; Claude'unki dolarsa Codex).
const LIMIT_RE = /usage limit|rate limit|hit your .{0,20}limit|quota exceeded|limit reached/i;
const FALLBACK = { codex: ['claude'], antigravity: ['codex', 'claude'], claude: ['codex'] };
const ENG_NAME = { codex: 'Codex', claude: 'Claude', antigravity: 'agy' };
/** "try again at 7:52 AM" → o saatin zamanı (geçtiyse yarın); yoksa 1 saat sonra. */
export function limitUntil(msg, now = Date.now()) {
  const m = /try again at (\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(String(msg));
  if (!m) return now + 60 * 60_000;
  let h = Number(m[1]);
  const ap = (m[3] ?? '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const d = new Date(now); d.setHours(h, Number(m[2]), 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}
export const ADMIN_DESK = 9;
export const PROMPT_DESK = 8; // Prompt Master üst sıranın ortasında // yönetici sağ üst köşe masasında (renderer/scene-logic.js LAYOUT.desks[9])

/**
 * bins: { claude, codex, antigravity } (CLI uzmanları için); workRoot: uzmanın klasörü yoksa çalışma kökü.
 */
/** persistFile: oturum kimlikleri, bağlar ve sohbet geçmişi buraya yazılır (yeniden açılınca devam). */
export function createAgentRunner({ store, chatImpl = chat, cliImpl = cliChat, bins = {}, workRoot = join(homedir(), '.feyzullah', 'ofis-work'), mkdirImpl = (d) => mkdir(d, { recursive: true }), onChange = () => {}, throttleMs = 150, persistFile = null, persistMs = 2000, onRate = () => {}, styleHint: styleHintOpt = '', codexNetwork = () => false, runTimeoutMs = 60 * 60_000, now = Date.now }) {
  const down = {}; // motor → kapalı olduğu son an (limit)
  const isDown = (e) => Boolean(down[e] && down[e] > now());
  const runtime = new Map(); // id → { state, lastAt, history, queue, busy, ctrl, resumeId, linked }
  let entries = [];
  let counter = 0;
  let timer = null;

  let saveTimer = null;
  let saving = Promise.resolve();
  async function persist() {
    saveTimer = null;
    if (!persistFile) return;
    const data = { entries: entries.filter((e) => e.status !== 'running').slice(-MAX_ENTRIES), agents: {} };
    for (const [id, r] of runtime) data.agents[id] = { resumeId: r.resumeId, resumeEngine: r.resumeEngine ?? null, linked: [...r.linked], history: r.history };
    const tmp = `${persistFile}.tmp`;
    saving = saving.then(() => writeFile(tmp, JSON.stringify(data)).then(() => renameRetry(tmp, persistFile))).catch(() => {});
    await saving;
  }
  const changed = () => {
    if (persistFile && !saveTimer) saveTimer = setTimeout(persist, persistMs);
    if (throttleMs <= 0) { onChange(); return; }
    if (!timer) timer = setTimeout(() => { timer = null; onChange(); }, throttleMs);
  };
  const rt = (id) => {
    if (!runtime.has(id)) runtime.set(id, { state: 'idle', lastAt: Date.now(), history: [], queue: [], busy: false, ctrl: null, resumeId: null, linked: new Set() });
    return runtime.get(id);
  };
  const addEntry = (e) => {
    entries.push(e);
    if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
    return e;
  };

  // Kimlik + (tasarımda) Krea talimatı + (Codex/agy'de) caveman kısa üslup. Claude'da caveman eklentisi hook'la gelir;
  // Prompt Master'ın çıktısı yöneticiye giden temiz prompt olmalı, üslup eklenmez.
  // Godot: uzmanlar bazen tam yolla çağırır (C:/Tools/..., C:\Tools\..., /c/Tools/...); hepsi izinli.
  const godotTools = [];
  if (bins.godotDir) {
    godotTools.push('Bash(godot.cmd:*)');
    if (bins.godotExe) {
      const fwd = `${bins.godotDir.replace(/\\/g, '/')}/${bins.godotExe}`;
      godotTools.push(`Bash(${fwd}:*)`, `Bash(${fwd.replace(/\//g, '\\')}:*)`, `Bash(${fwd.replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`)}:*)`);
    }
  }
  const personaFor = (agent) => {
    let p = agent.system ?? '';
    const styleHint = typeof styleHintOpt === 'function' ? styleHintOpt() : styleHintOpt;
    if (VISUAL.has(agent.division) && agent.engine !== 'antigravity') p += KREA_HINT; // agy'de Krea yetkisiz
    if (bins.godotDir && GODOT_DIVS.has(agent.division)) p += GODOT_HINT;
    if (styleHint && agent.role !== 'prompt' && (agent.engine === 'codex' || agent.engine === 'antigravity')) p += `

## Yazım üslubu
Bu üslubu uyguladığını söyleme, doğrudan uygula.
${styleHint}`;
    return p;
  };

  async function pump(id) {
    const r = rt(id);
    if (r.busy) return;
    const item = r.queue.shift();
    if (!item) return;
    const { text, display, shown: shownFn, cwd: cwdOverride, resolve = () => {}, reject = () => {} } = item;
    const agent = store.get(id);
    if (!agent) { reject(new Error('ajan yok')); return; }
    r.busy = true;
    r.state = 'thinking';
    r.lastAt = Date.now();
    r.ctrl = new AbortController();
    // Tek çalıştırma için üst sınır: takılan CLI ajanın kuyruğunu kilitlemesin.
    let timedOut = false;
    const runTimer = runTimeoutMs > 0 ? setTimeout(() => { timedOut = true; r.ctrl?.abort(); }, runTimeoutMs) : null;
    const at = Date.now();
    const shown = display ?? text; // yöneticinin uzun talimatı yerine kullanıcının komutu görünür
    addEntry({ id: `api:${id}:${++counter}`, agent: 'api', session: id, kind: 'prompt', title: shown.slice(0, 160), text: shown, at, status: 'ok' });
    const reply = addEntry({ id: `api:${id}:${++counter}`, agent: 'api', session: id, kind: 'stop', title: '…', text: '', at: Date.now(), status: 'running' });
    changed();
    // shown varsa (yönetici planı) yazılırken ham metin (JSON) gösterilmez; bitince kısa hali gelir.
    const onDelta = (d) => { r.state = 'working'; r.lastAt = Date.now(); if (shownFn) reply.title = '(plan hazırlanıyor…)'; else { reply.text += d; reply.title = reply.text.slice(0, 160); } changed(); };
    let usedCwd = null;
    try {
      let full;
      let used = null;
      if (agent.engine && agent.engine !== 'api') {
        // Bilgisayardaki CLI: konuşma CLI'nin kendi oturumunda sürer (resumeId); köprüdeki oturumu bu uzmana bağlanır.
        const cwd = cwdOverride || agent.workdir || join(workRoot, id);
        await mkdirImpl(cwd);
        usedCwd = cwd;
        // Limit dolunca yedek motor: motor kapalı işaretlenir (açılış saatine kadar), görev sıradaki motorla sürer.
        const engines = [agent.engine, ...(FALLBACK[agent.engine] ?? [])].filter((e, i) => i === 0 || bins[e]);
        let res = null; let lastErr = null;
        for (const [i, eng] of engines.entries()) {
          if (isDown(eng) && i < engines.length - 1) continue;
          const a2 = eng === agent.engine ? agent : { ...agent, engine: eng };
          const resumeId = (r.resumeEngine ?? agent.engine) === eng ? r.resumeId : null;
          if (i > 0) { reply.text = ''; }
          try {
            res = await cliImpl({
              engine: eng, bin: bins[eng], cwd, prompt: text, resumeId,
              persona: personaFor(a2),
              allowedTools: toolsFor(a2, godotTools),
              signal: r.ctrl.signal, onDelta, onRate: (info) => onRate(eng, info), network: eng === 'codex' && codexNetwork(),
              extraPath: bins.godotDir ?? null, // kurulu araçlar (Godot) PATH'e eklenir; sistem ayarı değişmez
              onSession: (sid) => { r.resumeId = sid; r.resumeEngine = eng; r.linked.add(`${eng}:${sid}`); changed(); },
            });
            if (eng !== agent.engine) {
              const until = down[agent.engine] ? new Date(down[agent.engine]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '?';
              addEntry({ id: `api:${id}:${++counter}`, agent: 'api', session: id, kind: 'note', title: `${ENG_NAME[agent.engine] ?? agent.engine} limiti dolu (${until}'e kadar) — görev ${ENG_NAME[eng] ?? eng} ile sürdürüldü`, at: Date.now(), status: 'ok' });
            }
            if (res.sessionId) { r.resumeId = res.sessionId; r.resumeEngine = eng; r.linked.add(`${eng}:${res.sessionId}`); }
            break;
          } catch (err) {
            if (r.ctrl?.signal.aborted || !LIMIT_RE.test(err.message)) throw err;
            down[eng] = limitUntil(err.message, now());
            lastErr = err;
          }
        }
        if (!res) throw lastErr ?? new Error('kullanılabilir motor yok');
        full = res.text;
        used = res.usage ?? null;
      } else {
        const messages = [...r.history, { role: 'user', content: text }];
        full = await chatImpl({
          provider: agent.provider, model: agent.model, baseUrl: agent.baseUrl, system: agent.system,
          key: store.getKey(id), messages, signal: r.ctrl.signal, onDelta,
        });
        r.history = [...messages, { role: 'assistant', content: full }].slice(-MAX_HISTORY);
      }
      const visible = shownFn ? shownFn(full) : full;
      reply.text = visible; reply.title = visible.slice(0, 160) || '(boş cevap)'; reply.status = 'ok'; reply.at = Date.now();
      resolve({ text: full, cwd: usedCwd, usage: used });
    } catch (err0) {
      const err = timedOut ? new Error(`zaman aşımı (${Math.round(runTimeoutMs / 60_000) || '<1'} dk)`) : err0;
      reject(err);
      entries = entries.filter((e) => e !== reply || reply.text);
      if (reply.text) reply.status = 'failed';
      addEntry({ id: `api:${id}:${++counter}`, agent: 'api', session: id, kind: 'note', title: `Hata: ${err.message}`, at: Date.now(), status: 'failed' });
    }
    clearTimeout(runTimer);
    r.busy = false;
    r.ctrl = null;
    r.state = 'idle';
    r.lastAt = Date.now();
    changed();
    pump(id);
  }

  const ready = (async () => {
    if (!persistFile) return;
    try {
      const data = JSON.parse(await readFile(persistFile, 'utf8'));
      entries = Array.isArray(data.entries) ? data.entries : [];
      for (const [id, a] of Object.entries(data.agents ?? {})) {
        const r = rt(id);
        r.resumeId = a.resumeId ?? null;
        r.resumeEngine = a.resumeEngine ?? null;
        r.linked = new Set(a.linked ?? []);
        r.history = Array.isArray(a.history) ? a.history : [];
      }
      counter = entries.length + 1000;
    } catch {}
  })();

  return {
    ready,
    /** Bekleyen kaydı hemen yazar. */
    flush: () => { clearTimeout(saveTimer); return persist(); },
    send(id, text) {
      const r = this.enqueue(id, { text });
      return r.ok ? { ok: true } : r;
    },
    /** Mesajı kuyruğa alır, cevap bitince çözülür. opts: { display (sohbette görünecek metin), cwd } */
    ask(id, text, opts = {}) {
      return new Promise((resolve, reject) => {
        const r = this.enqueue(id, { text, display: opts.display, shown: opts.shown, cwd: opts.cwd, resolve, reject });
        if (!r.ok) reject(new Error(r.error));
      });
    },
    enqueue(id, item) {
      const { text } = item;
      const agent = store.get(id);
      if (!agent) return { ok: false, error: 'ajan yok' };
      // Anahtarsız yalnızca kendi adresi verilmiş OpenAI uyumlu sunucu (ör. yerel Ollama) çalışır.
      const cli = agent.engine && agent.engine !== 'api';
      if (!cli && !agent.hasKey && !(agent.provider === 'openai' && agent.baseUrl)) return { ok: false, error: 'bu ajanın API anahtarı yok' };
      const t = String(text ?? '').trim().slice(0, 20000);
      if (!t) return { ok: false, error: 'boş mesaj' };
      rt(id).queue.push({ ...item, text: t });
      pump(id);
      return { ok: true };
    },
    /** Limiti dolu motorlar: { motor: açılış zamanı(ms) } */
    downEngines() { return Object.fromEntries(Object.entries(down).filter(([, t]) => t > now())); },
    cancel(id) { runtime.get(id)?.ctrl?.abort(); },
    isBusy(id) { const r = runtime.get(id); return Boolean(r && (r.busy || r.queue.length)); },
    note(id, title, status = 'failed') { addEntry({ id: `api:${id}:${++counter}`, agent: 'api', session: id, kind: 'note', title: String(title).slice(0, 160), text: String(title), at: Date.now(), status }); changed(); },
    forget(id) { runtime.delete(id); entries = entries.filter((e) => e.session !== id); changed(); },
    snapshot() {
      const sessions = store.list().map((a) => {
        const r = rt(a.id);
        return {
          agent: 'api', session: a.id, state: r.state, lastAt: r.lastAt, cwd: a.workdir || null, persistent: true,
          displayName: a.emoji ? `${a.emoji} ${a.name}` : a.name, color: a.color || null,
          engine: a.engine || 'api', provider: a.provider, model: a.model, hasKey: a.hasKey,
          fixedDesk: a.role === 'admin' ? ADMIN_DESK : a.role === 'prompt' ? PROMPT_DESK : null,
        };
      });
      const links = [];
      for (const [id, r] of runtime) for (const bk of r.linked) links.push([bk, `api:${id}`]);
      return { sessions, entries: [...entries], links };
    },
  };
}
