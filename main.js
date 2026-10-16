// Feyzullah Ofis — ana süreç. Feyzullah'ın köprüsünü dinler (jeton, SSE, onay, mesaj), durumu
// Feyzullah'ın kendi island-model indirgeyicisiyle tutar, ofis sahnesini pencereye gönderir.
// Feyzullah'ın dosyalarına yazmaz; yalnızca okur ve köprü API'sini kullanır.
import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, Notification, safeStorage, Tray } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bridgeStarter, createBridgeClient } from './src/bridge-client.js';
import { appRoot, dataDir, loadConfig, saveConfig, SETTING_KEYS } from './src/config.js';
import { demoBoard, demoSnapshot } from './src/demo.js';
import { agentDetails, buildOffice, newMemory, withApiAgents } from './src/office-model.js';
import { createAgentRunner } from './src/agents/runner.js';
import { createAgentStore } from './src/agents/store.js';
import { ADMIN_PERSONA, createAdmin, promptMasterPersona } from './src/agents/admin.js';
import { loadCaveman, RE_ID, RE_PERSONA } from './src/agents/personas.js';
import { createUsage } from './src/usage.js';
import { approvalNotice, boardNotices, dailyReport, reportDay, reportDue } from './src/notify.js';
import { branchDiff, cleanupWorktrees, commitAll, mergeWorktree, removeWorktree, revertMerge, runProjectTests, sharedPreparer } from './src/gitwork.js';
import { addHistory, expertStats, statsLine } from './src/stats.js';
import { probeClaude } from './src/usage.js';
import { statSync } from 'node:fs';
import { CORE_TEAM, engineFor, loadCatalog, loadVoltCatalog, mergeCatalogs, readPersona } from './src/agents/catalog.js';
import { findBins } from './src/agents/cli.js';
import { existsSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve as resolvePath, sep } from 'node:path';

// Masa sayısı sahneye göre: piksel (düz) ofiste 12, diğerlerinde 10 (renderer/image-scene.js).
const deskCount = () => (config.theme === 'real' ? 10 : 12);
let win = null;
let config;
let model; // Feyzullah'ın island-model.js'i
let state;
let online = false;
let selected = null;
const memory = newMemory();
let agentStore = null;
let agentRunner = null;
let admin = null;
let adminId = () => null;
let promptId = () => null;
let usage = null;
let client = null;
const noticeSeen = new Map();
/** Yöneticiye komut: arka planda dağıtır; hata yöneticinin sohbetine not düşer. */
function commandAdmin(text) {
  const id = adminId();
  if (!id) return { ok: false, error: 'yönetici yok' };
  admin.command(String(text ?? '').slice(0, 8000)).then((r) => {
    if (!r.ok) agentRunner.note(id, `Hata: ${r.error}`);
    else if (r.tasks) notify({ title: 'Komut tamamlandı', body: `${r.tasks} görev bitti; yöneticinin özeti hazır.`, speak: 'Yönetici özeti hazır.' });
  }).catch((err) => agentRunner.note(id, `Hata: ${err.message}`));
  return { ok: true };
}
/** Limit koruması: Claude 5 saatlik limiti %90'ı geçtiyse Claude'a iş verilmez, Prompt Master atlanır. */
function claudeLow() {
  if (config.limitGuard === false) return false;
  const w = usage?.get().claude?.fiveHour;
  return Boolean(w && w.used >= 0.9 && (!w.resetsAt || w.resetsAt > Date.now()));
}

/** Görev başına git dalı: klasör bir git deposundaysa ayrı çalışma ağacında (ofis/<kart>) çalışılır. */
const WORKTREES = () => join(dataDir(), 'ofis-work', 'worktrees');
// Aynı komutun aynı depodaki görevleri tek dalı paylaşır (sırayla çalışanlar birbirinin dosyasını görür).
let prepShared = null;
const gitPrepare = (cwd, card) => (config.gitBranches === false ? null : (prepShared ??= sharedPreparer(WORKTREES()))(cwd, card.group ?? card.id));

// Uzman geçmişi (bitmiş görevler): istatistik sayfası ve yöneticinin uzman seçimi için.
const HISTORY_FILE = () => join(dataDir(), 'ofis-history.json');
let history = [];
let historyTimer = null;
const statsMap = () => expertStats(history);

/** Kullanıcı komutu: önce Prompt Master net prompta çevirir, sonra yönetici dağıtır (direct: doğrudan yöneticiye). */
function dispatch(text, { direct = false } = {}) {
  const t = String(text ?? '').trim().slice(0, 8000);
  if (!t) return { ok: false, error: 'boş komut' };
  const pm = promptId();
  if (direct || !pm || config.promptMaster === false || claudeLow()) return commandAdmin(t);
  agentRunner.ask(pm, t, { display: t })
    .then((r) => commandAdmin(r.text?.trim() || t))
    .catch((err) => { agentRunner.note(pm, `Hata: ${err.message} — komut doğrudan yöneticiye gitti`); commandAdmin(t); });
  return { ok: true };
}

// Bildirim + ses: Windows bildirimi; ses Feyzullah'ın ses altyapısıyla (voice/provider.js + desktop.json ayarı).
let voice = null;
async function loadVoice() {
  try {
    const { createVoice } = await import(pathToFileURL(join(config.feyzullahRoot, 'voice', 'provider.js')).href);
    let s = {};
    try { s = JSON.parse(await readFile(join(dataDir(), 'desktop.json'), 'utf8')).voice ?? {}; } catch {}
    const v = createVoice();
    return { speak: (text) => v.speak(text, { provider: s.provider ?? 'system', voiceId: s.voiceId ?? '' }).catch(() => null) };
  } catch { return null; }
}
function notify({ title, body, speak }) {
  if (config.notify !== false && Notification.isSupported()) new Notification({ title, body, silent: config.speak !== false }).show();
  if (config.speak !== false && speak && win && !win.isDestroyed()) {
    Promise.resolve(voice?.speak(speak) ?? null).then((audio) => win.webContents.send('speak', { text: speak, audio })).catch(() => {});
  }
}

// Telefon: Feyzullah köprüsünde "Ofis Yöneticisi" oturumu. Gelen mesajlar Prompt Master → yönetici hattına girer;
// Prompt Master ve yöneticinin sohbeti köprüye yansıtılır (telefon cevabı görür).
async function takePhone() {
  const r = await client?.post('/ofis/take', {});
  for (const m of r?.messages ?? []) dispatch(m.text);
}
let mirrorSig = '';
let mirrorTimer = null;
function mirrorToBridge(force = false) {
  if (!client || process.env.OFIS_DEMO === '1') return;
  const ids = [promptId(), adminId()].filter(Boolean);
  const snap = agentRunner.snapshot();
  const entries = snap.entries.filter((e) => ids.includes(e.session) && ['prompt', 'stop', 'note'].includes(e.kind)).slice(-40)
    .map((e) => ({ id: e.id, kind: e.kind, title: e.title, text: e.text, status: e.status, at: e.at }));
  const busy = ids.some((id) => agentRunner.isBusy(id));
  const sig = JSON.stringify([busy, entries.map((e) => [e.id, e.status, e.title])]);
  if (!force && sig === mirrorSig) return;
  mirrorSig = sig;
  client.post('/ofis', { state: busy ? 'working' : 'idle', entries });
}
const scheduleMirror = () => { if (!mirrorTimer) mirrorTimer = setTimeout(() => { mirrorTimer = null; mirrorToBridge(); }, 1000); };
const BOARD_FILE = () => join(dataDir(), 'ofis-board.json');
async function loadBoard() { try { const b = JSON.parse(await readFile(BOARD_FILE(), 'utf8')); return Array.isArray(b) ? b : []; } catch { return []; } }
let boardSaveTimer = null;
function onBoard(board) {
  for (const n of boardNotices(noticeSeen, board)) notify(n);
  const before = history.length;
  history = addHistory(history, board);
  if (history.length !== before && !historyTimer) historyTimer = setTimeout(() => { historyTimer = null; writeFile(HISTORY_FILE(), JSON.stringify(history)).catch(() => {}); }, 1500);
  schedulePush();
  if (!boardSaveTimer) boardSaveTimer = setTimeout(() => { boardSaveTimer = null; writeFile(BOARD_FILE(), JSON.stringify(admin.board())).catch(() => {}); }, 1000);
}
const merged = () => withApiAgents(state, agentRunner?.snapshot());
const CATALOG_DIR = join(appRoot, 'catalog', 'agency-agents');
let catalog = { divisions: {}, agents: [] };

/** Katalogdan uzmanı işe alır (kimliği ve önerilen motoruyla). */
async function hire(catalogId, engine) {
  const entry = catalog.agents.find((a) => a.id === catalogId);
  if (!entry) throw new Error('katalogda yok');
  return agentStore.add({ name: entry.name, engine: engine || engineFor(entry), catalogId: entry.id, division: entry.division, color: entry.color, emoji: entry.emoji, system: await readPersona(CATALOG_DIR, entry) });
}

if (!app.requestSingleInstanceLock()) app.quit();
// Windows bildirimleri uygulama kimliği ister (paketlenmemiş Electron'da çalıştırılabilir yolu).
if (process.platform === 'win32') app.setAppUserModelId(process.execPath);
app.on('second-instance', () => toggle(true));

async function loadModel() {
  // Feyzullah'ın durum indirgeyicisi (kopyalanmaz): ayarlardaki Feyzullah klasöründen yüklenir.
  try {
    return await import(pathToFileURL(join(config.feyzullahRoot, 'desktop', 'island-model.js')).href);
  } catch {
    // Feyzullah klasörü yoksa en temel indirgeyici (yalnızca snapshot/session/entry).
    return {
      initialState: () => ({ online: false, sessions: new Map(), entries: [], pending: new Map(), guards: [] }),
      applyEvent(s, type, d) {
        if (type === 'snapshot') { s.sessions = new Map((d.sessions ?? []).map((x) => [`${x.agent}:${x.session}`, x])); s.entries = d.entries ?? []; s.pending = new Map((d.pending ?? []).map((p) => [p.id, p])); }
        else if (type === 'session') s.sessions.set(`${d.session.agent}:${d.session.session}`, d.session);
        else if (type === 'entry') { const i = s.entries.findIndex((e) => e.id === d.entry.id); if (i >= 0) s.entries[i] = d.entry; else s.entries.push(d.entry); }
        else if (type === 'approval') s.pending.set(d.approval.id, d.approval);
        else if (type === 'approval-done') s.pending.delete(d.id);
        return s;
      },
    };
  }
}

let pushTimer = null;
function schedulePush() {
  if (pushTimer) return;
  pushTimer = setTimeout(() => { pushTimer = null; push(); }, 120);
}
function push() {
  if (!win || win.isDestroyed()) return;
  const all = merged();
  const office = buildOffice(all, { memory, desks: deskCount(), restMs: config.restMinutes * 60_000 });
  // Uzman kimlik metinleri uzun: pencereye yalnız API ajanlarının talimatı gider.
  const agents = (agentStore?.list() ?? []).map((a) => (a.engine === 'api' ? a : { ...a, system: '' }));
  win.webContents.send('office', { online, office, agents, stats: Object.fromEntries(statsMap()), board: process.env.OFIS_DEMO === '1' ? demoBoard() : admin?.board() ?? [], usage: usage ? { ...usage.get(), down: agentRunner?.downEngines() ?? {} } : null, config: { demo: process.env.OFIS_DEMO === '1', demoPanel: process.env.OFIS_PANEL || null, lat: config.lat, lon: config.lon, pack: config.pack, theme: config.theme, settings: Object.fromEntries([...SETTING_KEYS, 'reportHour'].map((k) => [k, config[k]])), savedCommands: config.savedCommands ?? [] } });
  if (selected) win.webContents.send('details', agentDetails(all, selected));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 900, show: false, backgroundColor: '#14161d', title: 'Feyzullah Ofis',
    autoHideMenuBar: true,
    webPreferences: { preload: join(appRoot, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false },
  });
  // OFIS_SIZE=1600x900: deneme görüntüsü için sabit boyut (yoksa tam ekran).
  const size = /^(\d+)x(\d+)$/.exec(process.env.OFIS_SIZE ?? '');
  if (size) win.setContentSize(Number(size[1]), Number(size[2])); else win.maximize();
  win.loadFile(join(appRoot, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-finish-load', push);
  if (process.env.OFIS_DEBUG) win.webContents.on('console-message', (e) => console.log(`[pencere] ${e.message} (${e.sourceId}:${e.lineNumber})`));
  // Dış bağlantılar uygulamada açılmaz.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.on('close', (e) => { if (!app.isQuitting) { e.preventDefault(); win.hide(); } });
}

function toggle(forceShow = false) {
  if (!win) return;
  if (!forceShow && win.isVisible() && win.isFocused()) win.hide();
  else { win.show(); win.focus(); }
}

app.whenReady().then(async () => {
  config = await loadConfig();
  model = await loadModel();
  state = model.initialState();
  // API anahtarları Windows DPAPI ile şifrelenir (safeStorage); pencereye hiç gönderilmez.
  agentStore = await createAgentStore({
    file: join(dataDir(), 'ofis-agents.json'),
    crypto: {
      available: () => safeStorage.isEncryptionAvailable(),
      encrypt: (s) => safeStorage.encryptString(s).toString('base64'),
      decrypt: (b) => safeStorage.decryptString(Buffer.from(b, 'base64')),
    },
  });
  const firstRun = !existsSync(join(dataDir(), 'ofis-agents.json'));
  // Agency Agents + VoltAgent alt ajanları (ikisi de MIT, catalog/ altına klonlanır).
  catalog = mergeCatalogs(await loadCatalog(CATALOG_DIR), await loadVoltCatalog(join(appRoot, 'catalog', 'voltagent')));
  const cavemanText = await loadCaveman();
  usage = await createUsage({ file: join(dataDir(), 'ofis-usage.json') });
  usage.refreshCodex().then(schedulePush);
  setInterval(() => usage.refreshCodex().then(schedulePush), 60_000);
  const bins = await findBins();
  agentRunner = createAgentRunner({
    store: agentStore, bins, persistFile: join(dataDir(), 'ofis-runtime.json'),
    styleHint: () => (config.caveman === false ? '' : cavemanText), // Codex/agy uzmanlarına caveman üslubu
    codexNetwork: () => config.codexNetwork !== false, // Codex kum havuzunda ağ (npm install vb.)
    onChange: () => { schedulePush(); scheduleMirror(); },
    onRate: (engine, info) => { if (engine === 'claude') { usage.noteClaude(info); schedulePush(); } },
  });
  await agentRunner.ready; // önceki oturumların kimlikleri ve sohbet geçmişi
  // Yönetici: her zaman bir tane; komutları ekibe dağıtır.
  const adm = agentStore.list().find((a) => a.role === 'admin');
  if (!adm) await agentStore.add({ name: 'Yönetici', engine: 'claude', role: 'admin', emoji: '👔', color: '#f59e0b', system: ADMIN_PERSONA });
  // Kod güncellenince yöneticinin talimatı da güncellenir (kayıtta eski sürüm kalmasın; her çağrıda yeniden verilir).
  else if (adm.system !== ADMIN_PERSONA) await agentStore.update(adm.id, { system: ADMIN_PERSONA });
  adminId = () => agentStore.list().find((a) => a.role === 'admin')?.id ?? null;
  // Prompt Master: kullanıcının ham isteğini net prompta çevirir (kimliği ../skill.md, yoksa repodaki kopya).
  let skill = '';
  for (const f of [join(appRoot, '..', 'skill.md'), join(appRoot, 'src', 'agents', 'prompt-master.md')]) { try { skill = await readFile(f, 'utf8'); break; } catch {} }
  const pm = agentStore.list().find((a) => a.role === 'prompt');
  if (!pm) await agentStore.add({ name: 'Prompt Master', engine: 'claude', role: 'prompt', emoji: '✨', color: '#a855f7', system: promptMasterPersona(skill) });
  else if (skill) await agentStore.update(pm.id, { system: promptMasterPersona(skill) });
  promptId = () => agentStore.list().find((a) => a.role === 'prompt')?.id ?? null;
  // Ters mühendis: yalnız REA MCP ile tersine mühendislik.
  // Görsel üreten tasarım uzmanları agy'den Codex'e (agy'de Krea yetkisiz; Codex'te çalışıyor).
  for (const a of agentStore.list().filter((x) => x.division === 'design' && x.engine === 'antigravity')) await agentStore.update(a.id, { engine: 'codex' });
  const re = agentStore.list().find((a) => a.catalogId === RE_ID);
  if (!re) await agentStore.add({ name: 'Ters Mühendis', engine: 'claude', catalogId: RE_ID, division: 'reverse', emoji: '🔬', color: '#14b8a6', system: RE_PERSONA });
  else if (re.system !== RE_PERSONA) await agentStore.update(re.id, { system: RE_PERSONA });
  try { history = JSON.parse(await readFile(HISTORY_FILE(), 'utf8')); if (!Array.isArray(history)) history = []; } catch { history = []; }
  const initialBoard = await loadBoard();
  history = addHistory(history, initialBoard); // önceki oturumdan bitmiş kartlar da sayılsın
  boardNotices(noticeSeen, initialBoard, { silent: true });
  voice = await loadVoice();
  admin = createAdmin({
    runner: agentRunner,
    adminId,
    review: () => config.review !== false, // uzman çıktısını Reality Checker kontrol eder
    guard: claudeLow,
    prepare: gitPrepare,
    // Yönetici her komutta depoların güncel durumunu görür (bekleyen / birleştirilmiş dallar).
    repoState: () => {
      const b = admin?.board() ?? [];
      const seen = new Set();
      const lines = [];
      for (const t of [...b].reverse()) {
        if (!t.branch || seen.has(t.branch)) continue;
        seen.add(t.branch);
        const st = t.reverted ? 'birleştirildi, sonra geri alındı' : t.merged ? 'birleştirildi (dal silindi)' : t.discarded ? 'atıldı'
          // Çalışma kopyası diskte yoksa dal Ofis dışında birleştirilmiş/kaldırılmıştır; "bekliyor" denmez.
          : t.worktree && existsSync(t.worktree) ? 'bekliyor (kullanıcı birleştirmedi)' : t.worktree ? 'Ofis dışında birleştirildi ya da kaldırıldı (çalışma kopyası yok)' : 'yok';
        lines.push(`- ${t.branch} (${t.repo ?? '?'}): ${st} — ${String(t.title ?? '').slice(0, 70)}`);
        if (lines.length >= 8) break;
      }
      return lines.join('\n');
    },
    // Yeni görev klasörü yalnız kullanıcı klasörünün altında oluşturulur (sistem klasörlerine dokunulmaz).
    ensureDir: async (d) => {
      const full = resolvePath(String(d));
      const home = homedir().toLowerCase();
      const low = full.toLowerCase();
      if (!low.startsWith(home + sep) || low.startsWith(join(home, 'appdata').toLowerCase())) return false;
      try { await mkdir(full, { recursive: true }); return true; } catch { return false; }
    },
    engineState: () => agentRunner.downEngines(), // limiti dolu motorlar
    afterRun: (card, who) => commitAll(card.worktree, `ofis: ${who}: ${card.title.slice(0, 60)}`), // uzman turu dala kaydedilir
    taskTimeoutMs: () => (Number(config.taskTimeoutMin) || 45) * 60_000, // takılan uzman en fazla bu kadar bekletir
    board: initialBoard,
    onBoard,
    team: () => { const st = statsMap(); return agentStore.list().filter((a) => a.role !== 'admin' && a.role !== 'prompt').map(({ id, name, emoji, engine, division, catalogId }) => ({ id, name, emoji, engine, division, catalogId, stats: statsLine(st.get(id)) })); },
    dirOk: (d) => { try { return statSync(d).isDirectory(); } catch { return false; } },
    // Yönetici gerektiğinde katalogdan uzman alır, boştaki gereksizleri çıkarır.
    catalog: () => catalog.agents.map(({ id, name, division }) => ({ id, name, division })),
    hire: async (catalogId, engine) => { const a = await hire(catalogId, engine); schedulePush(); return a; },
    fire: async (fid) => { agentRunner.forget(fid); await agentStore.remove(fid); schedulePush(); },
    isBusy: (fid) => agentRunner.isBusy(fid),
  });
  // İlk açılışta çekirdek ekip (Agency Agents) işe alınır.
  if (firstRun && catalog.agents.length) for (const id of CORE_TEAM) await hire(id).catch(() => {});
  createWindow();

  // Deneme: OFIS_DEMO=1 köprü yerine demo verisi; OFIS_SNAPSHOT=dosya.png ekran görüntüsü alıp çıkar.
  // Deneme: OFIS_CLICK=<düğme id ya da [data-test=...]> 4. saniyede o düğmeye tıklar (ör. dClose).
  if (process.env.OFIS_CLICK && /^[A-Za-z0-9=\[\]\-]+$/.test(process.env.OFIS_CLICK)) {
    const sel = process.env.OFIS_CLICK.startsWith('[') ? process.env.OFIS_CLICK : `#${process.env.OFIS_CLICK}`;
    setTimeout(() => win.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(sel)})?.click()`).catch(() => {}), 4000);
  }
  if (process.env.OFIS_NOTIFY_TEST) {
    const n = new Notification({ title: 'Feyzullah Ofis', body: 'Bildirim denemesi' });
    n.on('show', () => console.log('bildirim: gösterildi')); n.on('failed', (_e, err) => console.log('bildirim: hata', err));
    n.show();
  }
  if (process.env.OFIS_SNAPSHOT) {
    setTimeout(async () => {
      win.show();
      const img = await win.webContents.capturePage();
      console.log('görüntü', img.getSize());
      await writeFile(process.env.OFIS_SNAPSHOT, img.toPNG());
      app.isQuitting = true;
      app.quit();
    }, Number(process.env.OFIS_SNAPSHOT_MS) || 5000);
  }
  if (process.env.OFIS_DEMO === '1') {
    model.applyEvent(state, 'snapshot', demoSnapshot());
    online = true;
    if (process.env.OFIS_SELECT) selected = process.env.OFIS_SELECT;
  }
  client = createBridgeClient({
    dir: dataDir(), port: config.bridgePort,
    ensureBridge: bridgeStarter({ port: config.bridgePort, feyzullahRoot: config.feyzullahRoot }),
    onEvent(type, data) {
      if (type === 'offline') online = false;
      else { online = true; model.applyEvent(state, type, data); }
      if (type === 'snapshot') { mirrorToBridge(true); if ((data.inbox ?? []).some((m) => m.agent === 'ofis')) takePhone(); }
      if (type === 'say' && data.say?.agent === 'ofis') takePhone();
      if (type === 'approval' && data.approval) {
        const who = merged().sessions.get(`${data.approval.agent}:${data.approval.session}`)?.displayName;
        notify(approvalNotice(data.approval, who));
      }
      schedulePush();
    },
  });
  setInterval(() => mirrorToBridge(true), 120_000); // köprü oturumu bayatlamasın
  if (process.env.OFIS_DEMO !== '1') client.start();
  setInterval(schedulePush, 5000); // dinlenme süreleri zamanla dolar

  ipcMain.handle('config:set', async (_e, { key, value }) => {
    try {
      const r = await saveConfig({ [String(key)]: value });
      if (r.ok) { config[key] = value; schedulePush(); }
      return r;
    } catch (err) { return { ok: false, error: err.message }; }
  });
  ipcMain.handle('board:action', async (_e, { id, action }) => {
    if (action === 'retry') return admin.retry(String(id));
    if (action === 'cancel') return admin.cancel(String(id));
    const card = admin.board().find((t) => t.id === String(id));
    if (!card?.branch || !card.repo) return { ok: false, error: 'bu görevin git dalı yok' };
    if (action === 'revert') {
      if (!card.merged || !card.mergeCommit || card.reverted) return { ok: false, error: 'geri alınacak birleştirme yok' };
      const r = await revertMerge({ repo: card.repo, commit: card.mergeCommit });
      if (r.ok) for (const t of admin.board().filter((x) => x.branch === card.branch && x.repo === card.repo)) admin.annotate(t.id, { reverted: true });
      return r;
    }
    if (card.merged || card.discarded || !card.worktree) return { ok: false, error: card.merged ? 'bu dal zaten birleştirildi' : 'bu dal artık yok' };
    if (action === 'diff') return branchDiff(card); // birleştirmeden önce değişikliklere bakmak için
    if (['doing', 'review', 'redo'].includes(card.status)) return { ok: false, error: 'görev sürüyor' };
    // Birleştir: kullanıcının o anki dalına (temiz değilse ya da çakışırsa dokunmaz). At: ağaç + dal silinir.
    // Aynı dalı paylaşan kartların hepsi birlikte işaretlenir.
    const sameBranch = () => admin.board().filter((t) => t.branch === card.branch && t.repo === card.repo);
    if (action === 'merge') {
      if (sameBranch().some((t) => ['doing', 'review', 'redo'].includes(t.status))) return { ok: false, error: 'bu dalda süren görev var; bitmesini bekle' };
      // Commit mesajı: biçim işaretleri (**, `) atılmış kısa başlık.
      const title = String(card.title ?? card.command ?? '').replace(/[*`#>_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 72);
      const r = await mergeWorktree({ ...card, title });
      if (r.ok) {
        for (const t of sameBranch()) admin.annotate(t.id, { merged: true, worktree: null, mergeCommit: r.commit, postTest: r.commit ? 'çalışıyor' : null });
        // Birleştirme sonrası asıl depoda testler: kırılırsa uyarı + "geri al" düğmesi.
        runProjectTests(card.repo).then((t) => {
          const text = !t.ran ? 'test betiği yok' : t.ok ? 'geçti' : 'BAŞARISIZ';
          for (const x of sameBranch()) admin.annotate(x.id, { postTest: text, postTestTail: t.tail ?? null });
          if (t.ran && !t.ok) notify({ title: 'Birleştirme sonrası testler kırıldı', body: `${card.branch}: geri almak için panoda "Birleştirmeyi geri al"`, speak: 'Birleştirmeden sonra testler kırıldı.' });
        }).catch(() => {});
      }
      return r;
    }
    if (action === 'discard') { await removeWorktree({ ...card, deleteBranch: true, force: true }); for (const t of sameBranch()) admin.annotate(t.id, { discarded: true, worktree: null }); return { ok: true }; }
    return { ok: false, error: 'bilinmeyen işlem' };
  });
  // Claude limitini şimdi ölç: hook'suz, kayıtsız en küçük sorgu (limitten çok az harcar).
  let probing = null;
  ipcMain.handle('usage:probe', async () => {
    probing ??= probeClaude({ bin: bins.claude }).then((info) => { usage.noteClaude(info); schedulePush(); return { ok: true }; }).catch((err) => ({ ok: false, error: err.message })).finally(() => { probing = null; });
    return probing;
  });
  // Eski (7 günden eski) çalışma ağaçları: iş dala kaydedilip ağaç kaldırılır; açılışta ve 6 saatte bir.
  // Süren görevlerin ağaçları (klasör zamanı içerik değişince güncellenmez) temizlikten korunur.
  const sweepTrees = () => cleanupWorktrees(WORKTREES(), 7 * 86_400_000, Date.now(), new Set(admin.board().filter((t) => t.worktree && ['doing', 'review', 'redo'].includes(t.status)).map((t) => t.worktree.toLowerCase()))).catch(() => []);
  setTimeout(sweepTrees, 30_000);
  setInterval(sweepTrees, 6 * 3_600_000);
  // Günlük rapor: ayarlanan saatte bir kez (bildirim + yöneticinin sohbeti → telefon).
  let lastReport = null;
  try { lastReport = JSON.parse(await readFile(join(dataDir(), 'ofis-report.json'), 'utf8')).day ?? null; } catch {}
  setInterval(() => {
    const now = Date.now();
    if (config.dailyReport === false || !reportDue(now, config.reportHour ?? 21, lastReport) || !adminId()) return;
    lastReport = reportDay(now);
    writeFile(join(dataDir(), 'ofis-report.json'), JSON.stringify({ day: lastReport })).catch(() => {});
    const text = dailyReport(admin.board(), usage.get(), now);
    agentRunner.note(adminId(), text, 'ok');
    notify({ title: 'Günlük rapor', body: text.split('\n').slice(1, 3).join(' '), speak: 'Günlük rapor hazır.' });
  }, 60_000);
  ipcMain.handle('select', (_e, key) => { selected = typeof key === 'string' ? key : null; return selected ? agentDetails(merged(), selected) : null; });
  ipcMain.handle('agents:save', async (_e, { id, fields }) => {
    try {
      const f = { ...fields };
      if (f.key === null) delete f.key; // null: anahtarı değiştirme
      delete f.role; // rol (yönetici) pencereden değiştirilemez
      const a = id ? await agentStore.update(String(id), f) : await agentStore.add(f);
      schedulePush();
      return { ok: true, agent: a };
    } catch (err) { return { ok: false, error: err.message }; }
  });
  ipcMain.handle('catalog:list', () => ({ divisions: catalog.divisions, agents: catalog.agents.map(({ file, root, ...a }) => ({ ...a, engine: engineFor(a) })) }));
  ipcMain.handle('agents:hire', async (_e, { catalogId, engine }) => {
    try { const a = await hire(String(catalogId), engine ? String(engine) : undefined); schedulePush(); return { ok: true, agent: a }; }
    catch (err) { return { ok: false, error: err.message }; }
  });
  ipcMain.handle('agents:remove', async (_e, id) => {
    if (String(id) === adminId() || String(id) === promptId()) return { ok: false, error: 'yönetici ve Prompt Master silinemez' }; agentRunner.forget(String(id)); await agentStore.remove(String(id)); schedulePush(); return { ok: true }; });
  ipcMain.handle('decide', (_e, { id, decision }) => (decision === 'allow' || decision === 'deny' ? client.decide(String(id), decision) : { ok: false }));
  ipcMain.handle('admin:command', (_e, text, opts = {}) => dispatch(text, { direct: Boolean(opts?.direct) }));
  ipcMain.handle('say', (_e, { agent, session, text }) => (agent === 'api'
    ? (session === adminId() ? commandAdmin(text) : session === promptId() ? dispatch(text) : agentRunner.send(String(session), text))
    : client.say(String(agent), String(session), String(text ?? '').slice(0, 4000))));

  globalShortcut.register(config.hotkey, () => toggle());
  const tray = new Tray(nativeImage.createFromPath(join(appRoot, 'assets', 'icon.png')));
  tray.setToolTip('Feyzullah Ofis');
  tray.on('click', () => toggle(true));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ofisi aç', click: () => toggle(true) },
    { label: 'Çıkış', click: () => { app.isQuitting = true; app.quit(); } },
  ]));
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  agentRunner?.flush();
  // Bekleyen pano/geçmiş kaydı kaybolmasın (zamanlayıcıyı beklemeden yaz).
  // admin varsa açılış tamamlanmış ve geçmiş yüklenmiştir (yoksa boş geçmişle ezilmesin).
  try { if (admin) { writeFileSync(join(dataDir(), 'ofis-board.json'), JSON.stringify(admin.board())); writeFileSync(join(dataDir(), 'ofis-history.json'), JSON.stringify(history)); } } catch {}
});
// Kapanırken köprüdeki "Ofis Yöneticisi" oturumu bitti olarak işaretlenir: telefon boşuna yazmasın.
let endedSent = false;
app.on('before-quit', (e) => {
  if (endedSent || !client || process.env.OFIS_DEMO === '1') return;
  e.preventDefault();
  endedSent = true;
  app.isQuitting = true;
  Promise.race([client.post('/ofis', { state: 'ended', entries: [] }), new Promise((r) => setTimeout(r, 1500))]).finally(() => app.quit());
});
app.on('window-all-closed', (e) => e.preventDefault());
