// Pencere: solda piksel ofis, altta çalışanlar, sağda seçili ajanın ayrıntıları (komutlar, diff'ler).
import { loungeChatter } from '../src/chatter.js';
import { daylight } from '../src/sun.js';
import { advance, newActor, LAYOUT, targetFor, TILE } from './scene-logic.js';
import { drawCharacter, lookFor, loadPack } from './sprites.js';
import { AGENT_COLORS, drawLabels, drawWorld, H, W } from './world.js';
import { createImageScene, loadCast, loadOfficeImage } from './image-world.js';
import { PIXEL2, REAL } from './image-scene.js';
import { createEvents } from './events.js';
import { PRESETS, presetFor } from '../src/agents/presets.js';

const officeEvents = createEvents();
let demoEvents = false;
let demoPanelShown = false;

const $ = (id) => document.getElementById(id);
const api = window.ofis;
const world = document.createElement('canvas');
world.width = W; world.height = H;
const wctx = world.getContext('2d');

// Sahne: varsayılan, üretilmiş ofis görseli (assets/office/ofis.png); yüklenemezse kodla çizilen ofis.
const codeScene = {
  W, H,
  newActor: () => newActor(LAYOUT.door),
  advance: (actor, agent, index, t, seed, dt) => advance(actor, targetFor(agent, index, t, seed), dt),
  point: (a) => [a.actor.x * TILE + 16, a.actor.y * TILE + 4],
  labelActor: (a) => a,
  draw: (ctx, o) => drawWorld(ctx, o),
};
let scene = codeScene;
const view = $('world');
const vctx = view.getContext('2d');

let pack = null;
let office = { agents: [], counts: { working: 0, resting: 0, waiting: 0, guards: 0 } };
let cfg = { lat: 41.01, lon: 28.98, pack: 'metrocity' };
let online = false;
let selectedKey = null;
let details = null;
let apiAgents = [];
let board = [];
let stats = {};
const cardDiffs = new Map(); // kart id → git farkı (Farkı gör)
let usage = null;
let boardOpen = false;
const TASK_TR = { doing: 'yapılıyor', review: 'kontrolde', redo: 'düzeltiliyor', done: 'bitti', 'needs-work': 'düzeltilmeli', failed: 'hata' };
const STATUS_COLOR = { doing: '#60a5fa', review: '#c084fc', redo: '#fbbf24', done: '#4ade80', 'needs-work': '#f87171', failed: '#f87171' };
const actors = new Map(); // key → { agent, actor, look, seed }
let geom = { scale: 1, ox: 0, oy: 0 };

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3000); }
const ago = (at) => { const s = Math.max(0, Math.round((Date.now() - at) / 1000)); return s < 60 ? `${s} sn` : s < 3600 ? `${Math.floor(s / 60)} dk` : `${Math.floor(s / 3600)} sa`; };

function syncActors() {
  const seen = new Set();
  let lounge = 0; let corridor = 0;
  for (const agent of office.agents) {
    seen.add(agent.key);
    let a = actors.get(agent.key);
    if (!a) {
      a = { agent, actor: scene.newActor(), look: lookFor(agent.key, pack), seed: Math.random() * 10 };
      actors.set(agent.key, a);
    }
    a.agent = agent;
    a.index = agent.place === 'lounge' ? lounge++ : agent.place === 'standing' && agent.desk == null ? corridor++ : 0;
  }
  for (const k of actors.keys()) if (!seen.has(k)) actors.delete(k);
}

// Yakınlaştırma / kaydırma: zoom 1 = ofis alanı kaplar; büyütünce sürükleyerek gezilir, "Ortala" sıfırlar.
const view_ = { zoom: 1, panX: 0, panY: 0 };
const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3];
function resize() {
  const st = $('stage');
  const r = st.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const dpr = window.devicePixelRatio || 1;
  view.width = Math.floor(r.width * dpr); view.height = Math.floor(r.height * dpr);
  view.style.width = `${r.width}px`; view.style.height = `${r.height}px`;
  // Sığdır; oran farkı küçükse (≤%20) alanı tam doldur (kenarlardan az kırpılır, boş bant kalmaz).
  const fit = Math.min(view.width / scene.W, view.height / scene.H);
  const cover = Math.max(view.width / scene.W, view.height / scene.H);
  const scale = Math.max(0.3, cover / fit <= 1.2 ? cover : fit) * view_.zoom;
  const w = scene.W * scale; const h = scene.H * scale;
  // Kaydırma, görsel alanın dışına taşmayacak kadar sınırlanır.
  const mx = Math.max(0, (w - view.width) / 2); const my = Math.max(0, (h - view.height) / 2);
  view_.panX = Math.max(-mx, Math.min(mx, view_.panX)); view_.panY = Math.max(-my, Math.min(my, view_.panY));
  geom = { scale, ox: Math.floor((view.width - w) / 2 + view_.panX), oy: Math.floor((view.height - h) / 2 + view_.panY), dpr };
  $('zoomPct').textContent = `${Math.round(view_.zoom * 100)}%`;
  $('stage').classList.toggle('pan', view_.zoom > 1);
}
function setZoom(z, at = null) {
  const old = view_.zoom; view_.zoom = Math.max(ZOOMS[0], Math.min(ZOOMS.at(-1), z));
  // İmlecin altındaki nokta yerinde kalsın.
  if (at) { const k = view_.zoom / old; view_.panX = (view_.panX - at.x) * k + at.x; view_.panY = (view_.panY - at.y) * k + at.y; }
  if (view_.zoom === 1) { view_.panX = 0; view_.panY = 0; }
  resize();
}
$('zoomIn').onclick = () => setZoom(ZOOMS.find((z) => z > view_.zoom) ?? view_.zoom);
$('zoomOut').onclick = () => setZoom([...ZOOMS].reverse().find((z) => z < view_.zoom) ?? 1);
$('zoomFit').onclick = () => { view_.panX = 0; view_.panY = 0; setZoom(1); };
view.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const r = view.getBoundingClientRect(); const dpr = geom.dpr || 1;
  const at = { x: (ev.clientX - r.left) * dpr - view.width / 2, y: (ev.clientY - r.top) * dpr - view.height / 2 };
  setZoom(view_.zoom * (ev.deltaY < 0 ? 1.15 : 1 / 1.15), at);
}, { passive: false });
let drag = null; // sürükleme tıklamayı bastırır
view.addEventListener('pointerdown', (ev) => { if (view_.zoom > 1) drag = { x: ev.clientX, y: ev.clientY, px: view_.panX, py: view_.panY, moved: false }; });
window.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const dx = ev.clientX - drag.x; const dy = ev.clientY - drag.y;
  if (Math.hypot(dx, dy) > 4) { drag.moved = true; $('stage').classList.add('panning'); }
  view_.panX = drag.px + dx * geom.dpr; view_.panY = drag.py + dy * geom.dpr; resize();
});
window.addEventListener('pointerup', () => { setTimeout(() => { drag = null; }, 0); $('stage').classList.remove('panning'); });
new ResizeObserver(() => resize()).observe($('stage'));
window.addEventListener('resize', resize);

let last = performance.now();
const perf = { n: 0, ms: 0 };
const FRAME_MS = 50; // ~20 kare/sn: piksel animasyon için yeterli, işlemciyi yormaz
function frame(now) {
  if (document.hidden || now - last < FRAME_MS) { requestAnimationFrame(frame); return; }
  const dt = Math.min(150, now - last);
  last = now;
  const list = [...actors.values()];
  const t = Date.now();
  for (const a of list) a.actor = scene.advance(a.actor, a.agent, a.index, t, a.seed, dt);
  const t0 = performance.now();
  const events = officeEvents.tick(t, cfg.settings?.events !== false);
  scene.draw(wctx, { t, counts: office.counts, actors: list, pack, light: daylight(t, cfg.lat, cfg.lon), selectedKey, events });
  perf.n++; perf.ms += performance.now() - t0;
  if (perf.n === 200) console.log(`ofis çizimi: ortalama ${(perf.ms / perf.n).toFixed(2)} ms/kare`);
  vctx.imageSmoothingEnabled = false;
  vctx.fillStyle = '#0f1116'; vctx.fillRect(0, 0, view.width, view.height);
  vctx.drawImage(world, 0, 0, scene.W, scene.H, geom.ox, geom.oy, scene.W * geom.scale, scene.H * geom.scale);
  vctx.save();
  vctx.scale(geom.dpr, geom.dpr);
  if (scene.board) drawBoardText(vctx, scene.board, geom.scale / geom.dpr, geom.ox / geom.dpr, geom.oy / geom.dpr);
  drawLabels(vctx, { actors: list.map(scene.labelActor), scale: geom.scale / geom.dpr, ox: geom.ox / geom.dpr, oy: geom.oy / geom.dpr, t, selectedKey, hoveredKey, chatter: withEventChatter(loungeChatter(office.agents, t), events) });
  vctx.restore();
  drawLive();
  requestAnimationFrame(frame);
}

/** Kart başlığını duvar notuna sığacak kısa metne çevirir (biçim işaretleri, yollar, tırnaklar atılır). */
function shortTitle(t) {
  return String(t ?? '')
    .replace(/[*`#>_]/g, '')
    .replace(/[A-Za-z]:[\\/][^\s,;)]*/g, '')
    .replace(/["'“”‘’]/g, '')
    .replace(/\b(projesinde|klasöründe|içindeki|uygulamasının|uygulaması)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Duvar panosu: başlık + üç sütun (yapılıyor / kontrolde / bitti), her görev renkli yapışkan not. */
const BOARD_COLS = [
  { title: 'YAPILIYOR', match: (t) => t.status === 'doing', paper: '#fde68a', pin: '#ef4444' },
  { title: 'KONTROLDE', match: (t) => t.status === 'review' || t.status === 'redo', paper: '#ddd6fe', pin: '#7c3aed' },
  { title: 'BİTTİ', match: (t) => ['done', 'needs-work', 'failed'].includes(t.status), paper: '#bbf7d0', pin: '#16a34a' },
];
function drawBoardText(ctx, [bx, by, bw, bh], s, ox, oy) {
  const x = ox + bx * s; const y = oy + by * s; const w = bw * s; const h = bh * s;
  const pad = Math.max(4, w * 0.02);
  const fs = Math.max(8, Math.min(12, h / 8.5));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.textBaseline = 'top';
  // başlık
  ctx.font = `700 ${fs}px "Bahnschrift", "Segoe UI", sans-serif`;
  ctx.fillStyle = '#fde68a';
  ctx.fillText('GÖREV PANOSU', x + pad, y + pad * 0.8);
  const active = board.filter((t) => ['doing', 'review', 'redo'].includes(t.status)).length;
  const sum = `${active} aktif · ${board.filter((t) => t.status === 'done').length} bitti`;
  ctx.font = `${fs - 1}px "Segoe UI", sans-serif`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(sum, x + w - pad - ctx.measureText(sum).width, y + pad * 0.8 + 1);
  // sütunlar
  const top = y + pad + fs * 1.5;
  const colW = (w - pad * 4) / 3;
  const noteH = Math.max(fs * 2.3, (h - (top - y) - pad - fs * 1.2) / 2 - pad * 0.6);
  BOARD_COLS.forEach((col, ci) => {
    const cx = x + pad + ci * (colW + pad);
    ctx.font = `700 ${fs - 2}px "Segoe UI", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    const items = [...board].filter(col.match).sort((a, b) => b.at - a.at);
    ctx.fillText(`${col.title} ${items.length || ''}`.trim(), cx, top);
    items.slice(0, 2).forEach((t, i) => {
      const ny = top + fs * 1.2 + i * (noteH + pad * 0.6);
      const tilt = ((i + ci) % 2 ? 1 : -1) * 0.012;
      ctx.save();
      ctx.translate(cx + colW / 2, ny + noteH / 2); ctx.rotate(tilt); ctx.translate(-(cx + colW / 2), -(ny + noteH / 2));
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(cx + 2, ny + 2, colW, noteH);
      const failed = t.status === 'failed' || t.status === 'needs-work';
      ctx.fillStyle = failed ? '#fecaca' : col.paper; ctx.fillRect(cx, ny, colW, noteH);
      ctx.fillStyle = col.pin; ctx.beginPath(); ctx.arc(cx + colW / 2, ny + 2, Math.max(1.5, fs * 0.22), 0, Math.PI * 2); ctx.fill();
      // ad + kısa başlık (iki satır)
      const fit = (txt, maxW) => { let s2 = txt; while (s2.length > 2 && ctx.measureText(s2).width > maxW) s2 = `${s2.slice(0, -2)}…`; return s2; };
      ctx.fillStyle = '#1f2937';
      ctx.font = `700 ${fs - 2}px "Segoe UI", sans-serif`;
      ctx.fillText(fit(`${t.name}${failed ? ' ✕' : t.status === 'redo' ? ' ↻' : ''}`, colW - 6), cx + 3, ny + noteH * 0.14);
      ctx.font = `${fs - 2}px "Segoe UI", sans-serif`;
      ctx.fillStyle = '#374151';
      ctx.fillText(fit(shortTitle(t.title), colW - 6), cx + 3, ny + noteH * 0.14 + fs);
      ctx.restore();
    });
    if (!items.length) { ctx.font = `${fs - 2}px "Segoe UI", sans-serif`; ctx.fillStyle = '#475569'; ctx.fillText('—', cx, top + fs * 1.3); }
  });
  ctx.restore();
}
function boardAt(ev) {
  if (!scene.board) return false;
  const r = view.getBoundingClientRect();
  const wx = ((ev.clientX - r.left) * geom.dpr - geom.ox) / geom.scale;
  const wy = ((ev.clientY - r.top) * geom.dpr - geom.oy) / geom.scale;
  const [bx, by, bw, bh] = scene.board;
  return wx >= bx && wx <= bx + bw && wy >= by && wy <= by + bh;
}
// ---- sağ panel yönetimi: widget'lar (boşta) · pano · ayarlar · ajan ayrıntısı ----
let panel = null; // null | 'board' | 'settings'
function showPanel(name) {
  panel = name;
  boardOpen = name === 'board';
  if (name) { selectedKey = null; details = null; api.select(null); }
  for (const [id, p] of [['navOffice', null], ['navStats', 'stats'], ['navBoard', 'board'], ['navExperts', 'experts'], ['navSettings', 'settings']]) $(id).classList.toggle('on', p === name);
  $('detail').classList.toggle('stats-open', name === 'stats');
  renderRoster();
  renderDetails();
}
$('navOffice').onclick = () => { showPanel(null); setView('office'); };
$('ovBoard').onclick = () => showPanel('board');
$('navStats').onclick = () => showPanel(panel === 'stats' ? null : 'stats'); // dar ekranda genel bakış
$('navBoard').onclick = () => showPanel(panel === 'board' ? null : 'board');
$('navSettings').onclick = () => showPanel(panel === 'settings' ? null : 'settings');
$('navExperts').onclick = () => showPanel(panel === 'experts' ? null : 'experts');
$('eClose').onclick = () => showPanel(null);

/// ---- orta görünüm: Ofis (canlı) · Görevler (kanban) · Raporlar ----
let centerView = 'office';
const VIEW_TITLE = { office: 'Canlı ofis', tasks: 'Görevler', reports: 'Raporlar' };
function setView(v) {
  centerView = v;
  for (const t of document.querySelectorAll('.tab')) t.classList.toggle('on', t.dataset.view === v);
  $('viewTitle').textContent = VIEW_TITLE[v];
  $('stage').hidden = v !== 'office';
  $('stageFoot').hidden = v !== 'office';
  $('tasksView').hidden = v !== 'tasks';
  $('reportsView').hidden = v !== 'reports';
  renderCenter();
  if (v === 'office') requestAnimationFrame(resize);
}
for (const t of document.querySelectorAll('.tab')) t.onclick = () => setView(t.dataset.view);
const KCOLS = [
  ['Yapılıyor', ['doing'], '#60a5fa'],
  ['Kontrolde', ['review', 'redo'], '#c084fc'],
  ['Bitti', ['done'], '#3ee0a1'],
  ['Sorunlu', ['failed', 'needs-work'], '#f87171'],
];
function renderCenter() {
  if (centerView === 'tasks') {
    $('tasksView').replaceChildren(...KCOLS.map(([title, sts, color]) => {
      const list = [...board].reverse().filter((t) => sts.includes(t.status));
      const col = el('div', 'kcol');
      const h = el('h3'); const dot = el('i'); dot.style.setProperty('--c', color); h.append(dot, `${title} `, el('span', null, String(list.length)));
      const box = el('div', 'klist');
      box.append(...(list.length ? list.slice(0, 40).map((t) => {
        const c = el('button', 'kcard'); c.style.setProperty('--c', STATUS_COLOR[t.status] ?? color);
        const m = el('div', 'km'); m.append(el('span', null, `${t.name}${t.round ? ` · ${t.round}. tur` : ''}`), el('span', null, ago(t.at)));
        c.append(el('div', 'kt', t.title), m);
        if (t.branch) c.append(el('div', 'km', t.merged ? `✓ ${t.branch} birleştirildi` : t.worktree ? `🌿 ${t.branch} bekliyor` : `🌿 ${t.branch}`));
        c.title = 'Panoda aç (fark, birleştir, yeniden başlat)';
        c.onclick = () => showPanel('board');
        return c;
      }) : [el('div', 'dim', '—')]));
      col.append(h, box);
      return col;
    }));
  } else if (centerView === 'reports') {
    const done = board.filter((t) => t.status === 'done').length;
    const bad = board.filter((t) => ['failed', 'needs-work'].includes(t.status)).length;
    const tok = board.reduce((n, t) => n + (t.usage ? t.usage.in + t.usage.out : 0), 0);
    const cost = board.reduce((n, t) => n + (t.usage?.cost ?? 0), 0);
    const finished = board.filter((t) => t.status === 'done' && t.startedAt && t.at > t.startedAt);
    const avg = finished.length ? Math.round(finished.reduce((n, t) => n + (t.at - t.startedAt), 0) / finished.length / 60_000) : null;
    const kpi = (v, l) => { const k = el('div', 'kpi'); k.append(el('div', 'v', v), el('div', 'dim', l)); return k; };
    const row = el('div', 'rep-row');
    row.append(kpi(String(board.length), 'son görev'), kpi(board.length ? `%${Math.round((done / Math.max(1, done + bad)) * 100)}` : '–', 'başarı (biten / sorunlu)'), kpi(tok ? fmtTok(tok) : '–', `token${cost ? ` · $${cost.toFixed(2)}` : ''}`), kpi(avg == null ? '–' : `${Math.max(1, avg)} dk`, 'ortalama görev süresi'));
    const ex = Object.entries(stats).sort((a, b) => b[1].total - a[1].total).map(([, s]) => {
      const r = el('div', 'rep-ex'); const rate = Math.round(s.successRate * 100);
      const bar = el('div', 'bar'); const f = el('i'); f.style.width = `${rate}%`; f.style.setProperty('--c', rate >= 80 ? 'var(--accent)' : rate >= 50 ? 'var(--warn)' : 'var(--bad)'); bar.append(f);
      const n = el('div', 'n'); n.append(el('div', null, s.name ?? '?'), el('div', 'dim', `${s.total} görev · ${s.done} bitti · ${s.redo} düzeltme turu${s.avgMs ? ` · ort ${Math.max(1, Math.round(s.avgMs / 60_000))} dk` : ''}`));
      r.append(n, bar, el('div', 'p', `%${rate}`)); return r;
    });
    $('reportsView').replaceChildren(row, el('h3', null, 'Uzmanlar'), ...(ex.length ? ex : [el('div', 'dim', 'Henüz bitmiş görev yok.')]));
  }
}
// Tam ekran: yan paneller gizlenir, ofis büyür.
$('fullBtn').onclick = () => { const on = document.querySelector('.app').classList.toggle('full'); $('fullBtn').classList.toggle('on', on); $('fullBtn').title = on ? 'Yan panelleri göster' : 'Tam ekran (yan panelleri gizle)'; requestAnimationFrame(resize); };
$('btnAddAgent2').onclick = () => $('btnAddAgent').click();
$('btnSync').onclick = async () => { const r = await api.syncBoard(); toast(r?.ok ? (r.changed ? `${r.changed} kart güncellendi` : 'Pano zaten git ile uyumlu') : `Olmadı: ${r?.error ?? ''}`); };

// ---- zamanlanmış komutlar (⏰): belli saatte ve/veya limitler açılınca yöneticiye gider ----
let scheduled = [];
function renderSched() {
  const pop = $('schedPop');
  $('schedCount').hidden = !scheduled.length; $('schedCount').textContent = String(scheduled.length);
  $('navSchedule').classList.toggle('on', !pop.hidden);
  if (pop.hidden) return;
  const rows = scheduled.map((x) => {
    const r = el('div', 'sc');
    const when = [x.at ? `${new Date(x.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${hm(x.at)}` : null, x.whenLimit ? 'limit açılınca' : null].filter(Boolean).join(' + ');
    const tx = el('div', 'txt', x.text); tx.title = x.text;
    const del = el('button', 'del', '✕'); del.title = 'İptal et';
    del.onclick = async () => { const res = await api.removeSchedule(x.id); if (!res?.ok) toast(`Olmadı: ${res?.error ?? ''}`); };
    r.append(el('span', 'when', `⏰ ${when}${x.direct ? ' · 👔' : ''}`), tx, del);
    return r;
  });
  const form = el('div', 'form');
  const time = el('input'); time.type = 'time';
  const lim = el('input'); lim.type = 'checkbox';
  const limL = el('label'); limL.append(lim, 'limitler açılınca');
  const cur = $('adminText').value.trim();
  const add = el('button', 'add', cur ? `+ "${cur.slice(0, 40)}${cur.length > 40 ? '…' : ''}" komutunu zamanla` : 'Önce kutuya komutu yaz');
  add.disabled = !cur;
  add.onclick = async () => {
    const res = await api.addSchedule({ text: cur, at: time.value || null, whenLimit: lim.checked, direct: $('adminDirect').checked });
    if (!res?.ok) { toast(`Zamanlanamadı: ${res?.error ?? ''}`); return; }
    $('adminText').value = ''; toast('Zamanlandı');
  };
  form.append(el('span', 'dim', 'Saat'), time, limL, el('span', 'grow'), add);
  pop.replaceChildren(...(rows.length ? rows : [el('div', 'dim', 'Bekleyen zamanlanmış komut yok. Örn: Codex limiti dolunca "limitler açılınca" seç.')]), form);
}
const toggleSched = () => { const p = $('schedPop'); p.hidden = !p.hidden; $('savedPop').hidden = true; renderSched(); };
$('schedBtn').onclick = (ev) => { ev.stopPropagation(); toggleSched(); };
$('navSchedule').onclick = (ev) => { ev.stopPropagation(); toggleSched(); };
document.addEventListener('click', (ev) => { if (!ev.target.closest?.('#schedPop, #schedBtn, #navSchedule')) { $('schedPop').hidden = true; $('navSchedule').classList.remove('on'); } });

// Uzman istatistikleri: geçmişteki bitmiş görevlerden başarı oranı, düzeltme turu, ortalama süre.
function renderExperts() {
  $('expertsPanel').hidden = panel !== 'experts';
  if (panel !== 'experts') return;
  const rows = Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  $('eSub').textContent = rows.length ? `${rows.reduce((n, [, s]) => n + s.total, 0)} bitmiş görev · yönetici bu geçmişe bakarak seçer` : 'Henüz bitmiş görev yok';
  $('eList').replaceChildren(...rows.map(([, s]) => {
    const r = el('div', 'ex');
    const rate = Math.round(s.successRate * 100);
    const d = el('div', 'dots'); d.style.setProperty('--c', rate >= 80 ? '#2ee6c5' : rate >= 50 ? '#f59e0b' : '#ff2d55');
    for (let i = 0; i < 14; i++) d.append(el('i', i < Math.round(s.successRate * 14) ? 'on' : null));
    const avg = s.avgMs == null ? '' : ` · ort ${Math.max(1, Math.round(s.avgMs / 60_000))} dk`;
    r.append(el('div', 'ex-n', s.name ?? '?'), el('div', 'ex-r', `%${rate}`), el('div', 'dim', `${s.total} görev · ${s.done} bitti · ${s.needsWork} düzeltilmeli · ${s.failed} hata · ${s.redo} tur${avg}`), d);
    return r;
  }));
}

const fmtTok = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
function renderBoard() {
  $('boardPanel').hidden = panel !== 'board';
  if (panel !== 'board') return;
  const active = board.filter((t) => ['doing', 'review', 'redo'].includes(t.status)).length;
  const tok = board.reduce((n, t) => n + (t.usage ? t.usage.in + t.usage.out : 0), 0);
  const cost = board.reduce((n, t) => n + (t.usage?.cost ?? 0), 0);
  $('bSub').textContent = `${active} yapılıyor · ${board.filter((t) => t.status === 'done').length} bitti · son ${board.length} görev${tok ? ` · ${fmtTok(tok)} token${cost ? ` · $${cost.toFixed(2)}` : ''}` : ''}`;
  $('bList').replaceChildren(...[...board].reverse().map((t) => {
    const c = el('div', `card ${t.status}`);
    const top = el('div', 'c-top');
    top.append(el('span', null, `${t.name}${t.fixer ? ` → ${t.fixer}` : ''}`), el('span', null, `${TASK_TR[t.status] ?? t.status}${t.round ? ` · ${t.round}. tur` : ''} · ${ago(t.at)}`));
    c.append(top, el('div', 'c-title', t.title));
    if (t.branch) c.append(el('div', 'dim', `Dal: ${t.branch}`));
    if (t.integration) c.append(el('div', 'dim', `🧩 Bütünleşme kontrolü: ${t.integration}`));
    if (t.reviewSkipped) c.append(el('div', 'dim', `⚠ Reality Checker kontrolü atlandı: ${t.reviewSkipped}`));
    if (t.feedback && t.status !== 'done') c.append(el('div', 'dim', `Kontrol: ${t.feedback}`));
    if (t.error) c.append(el('div', 'dim', `Hata: ${t.error}`));
    if (t.command) c.append(el('div', 'dim', `Komut: ${t.command}`));
    // Panodan yönetim: süren görev iptal, biten/başarısız görev yeniden başlatılır.
    const btns = el('div', 'c-btns');
    const act = async (action, msg) => { const r = await api.boardAction(t.id, action); toast(r?.ok ? msg : `Olmadı: ${r?.error ?? ''}`); };
    if (['doing', 'review', 'redo'].includes(t.status)) { const b = el('button', 'deny', 'İptal'); b.onclick = () => act('cancel', 'İptal edildi'); btns.append(b); }
    else if (t.task) { const b = el('button', null, '↻ Yeniden başlat'); b.onclick = () => act('retry', 'Yeniden başlatıldı'); btns.append(b); }
    if (t.branch && !t.merged && !t.discarded && !board.some((other) => other.repo === t.repo && other.branch === t.branch && ['todo', 'doing', 'review', 'redo'].includes(other.status))) {
      const v = el('button', null, cardDiffs.has(t.id) ? 'Farkı gizle' : '🔍 Farkı gör');
      v.dataset.test = 'diff';
      v.onclick = async () => {
        if (cardDiffs.has(t.id)) { cardDiffs.delete(t.id); renderBoard(); return; }
        const r = await api.boardAction(t.id, 'diff');
        if (!r?.ok) { toast(`Fark alınamadı: ${r?.error ?? ''}`); return; }
        cardDiffs.set(t.id, r); renderBoard();
      };
      const m = el('button', 'allow', '⤵ Dalı birleştir'); m.title = `${t.branch} → deponun o anki dalı`; m.onclick = () => act('merge', 'Birleştirildi');
      const x = el('button', 'deny', 'Dalı at'); x.dataset.test = 'discard'; x.onclick = () => act('discard', 'Dal silindi');
      btns.append(v, m, x);
    }
    if (t.merged) c.append(el('div', 'dim', t.reverted ? '↶ birleştirme geri alındı' : `✓ dal birleştirildi${t.mergeCommit ? ` (${t.mergeCommit})` : ''}`));
    if (t.merged && t.postTest) {
      const bad = t.postTest === 'BAŞARISIZ';
      c.append(el('div', `ptest ${bad ? 'bad' : t.postTest === 'geçti' ? 'ok' : ''}`, `🧪 Birleştirme sonrası test: ${t.postTest}`));
      if (bad && t.postTestTail) c.append(el('pre', 'stat', t.postTestTail));
    }
    if (t.merged && t.mergeCommit && !t.reverted) { const rv = el('button', 'deny', '↶ Birleştirmeyi geri al'); rv.title = 'Yeni bir geri alma (revert) commit\'i atar; geçmiş silinmez'; rv.onclick = () => act('revert', 'Birleştirme geri alındı'); btns.append(rv); }
    if (t.usage) c.append(el('div', 'c-use', `📊 ${fmtTok(t.usage.in + t.usage.out)} token${t.usage.cost ? ` · $${t.usage.cost.toFixed(3)}` : ''}`));
    if (btns.childElementCount) c.append(btns);
    const d = cardDiffs.get(t.id);
    if (d && !t.merged) { c.append(el('pre', 'stat', d.stat || '(değişiklik yok)')); if (d.diff) c.append(diffView(d.diff, { id: `diff:${t.id}`, title: t.title })); }
    return c;
  }));
  if (!board.length) $('bList').replaceChildren(el('div', 'dim', 'Prompt Master\'a komut yazınca görevler burada görünür.'));
}
$('bClose').onclick = () => showPanel(null);

// Ayarlar: ~/.feyzullah/ofis.json (main yazar). Anahtarlı kartlar.
const SETTINGS = [
  ['promptMaster', '✨', 'Prompt Master', 'Komutu önce net prompta çevirir'],
  ['review', '🧐', 'Reality Checker', 'Uzman işini kontrol eder, gerekirse geri gönderir'],
  ['limitGuard', '🛡️', 'Limit koruması', 'Claude %90\'ı geçince Claude\'a iş verilmez'],
  ['gitBranches', '🌿', 'Görev başına git dalı', 'Git deposundaki işler ayrı çalışma ağacında'],
  ['codexNetwork', '🌐', 'Codex ağ erişimi', 'Kum havuzunda internet (npm install vb.); yazma yine yalnız iş klasörü'],
  ['caveman', '✂️', 'caveman üslubu', 'Codex/agy cevapları kısa (yeniden açınca)'],
  ['notify', '🔔', 'Bildirim', 'Görev bitince / izin istenince'],
  ['speak', '🔊', 'Sesli okuma', 'Feyzullah ses altyapısıyla'],
  ['events', '🍕', 'Ofis olayları', 'Pizza, kedi, elektrik dalgalanması'],
  ['dailyReport', '🗓️', 'Günlük rapor', 'Akşam özeti telefona ve bildirim olarak'],
];
function renderSettings() {
  $('settingsPanel').hidden = panel !== 'settings';
  if (panel !== 'settings') return;
  const s = cfg.settings ?? {};
  $('sList').replaceChildren(...SETTINGS.map(([key, icon, title, sub]) => {
    const row = el('div', 'tg');
    const b = el('div', 'tg-b'); b.append(el('div', 'tg-t', title), el('div', 'dim', sub));
    const sw = el('button', `switch${s[key] !== false ? ' on' : ''}`);
    sw.title = s[key] !== false ? 'Açık' : 'Kapalı';
    sw.onclick = async () => { const r = await api.setConfig(key, s[key] === false); if (!r?.ok) toast(`Kaydedilemedi: ${r?.error ?? ''}`); };
    row.append(el('span', 'tg-ic', icon), b);
    if (key === 'dailyReport') {
      const h = el('input'); h.type = 'number'; h.min = 0; h.max = 23; h.value = s.reportHour ?? 21; h.title = 'Saat';
      h.onchange = () => api.setConfig('reportHour', Math.max(0, Math.min(23, Number(h.value) || 21)));
      row.append(h);
    }
    row.append(sw);
    return row;
  }));
}
$('sClose').onclick = () => showPanel(null);

// ---- genel bakış (sağ panel boşken) ----
const pctNow = (w) => (w ? (!w.resetsAt || w.resetsAt > Date.now() ? w.used : 0) : null);
const level = (v) => (v == null ? '#3a3a42' : v > 0.85 ? 'var(--neon-red)' : v > 0.6 ? 'var(--neon-yellow)' : 'var(--neon-green)');
const hm = (ms) => new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
let probingNow = false;
function probeBtn() {
  const b = el('button', 'w-btn', probingNow ? 'ölçülüyor…' : '↻ ölç');
  b.title = 'Claude limitini şimdi ölç (çok küçük bir sorgu, limitten az harcar)';
  b.disabled = probingNow;
  b.onclick = async () => { probingNow = true; renderUsage(); const r = await api.probeUsage(); probingNow = false; renderUsage(); toast(r?.ok ? 'Claude limiti güncellendi' : `Ölçülemedi: ${r?.error ?? ''}`); };
  return b;
}
const ACTIVE = ['doing', 'review', 'redo'];
const ringSvg = (frac, color) => {
  const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 44 44');
  const c = (cls) => { const e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', 22); e.setAttribute('cy', 22); e.setAttribute('r', 18); e.setAttribute('class', cls); return e; };
  const fg = c('fg'); const L = 2 * Math.PI * 18;
  fg.setAttribute('stroke-dasharray', String(L)); fg.setAttribute('stroke-dashoffset', String(L * (1 - Math.max(0, Math.min(1, frac)))));
  svg.style.setProperty('--c', color); svg.append(c('bgc'), fg); return svg;
};
function usageCard({ icon, title, sub, v, w, week, down, extra, at }) {
  const card = el('div', `uc${down ? ' down' : ''}`);
  card.title = at ? `${ago(at)} önce ölçüldü` : 'henüz ölçülmedi';
  const bar = el('div', 'bar'); const fill = el('i'); fill.style.width = `${Math.round((v ?? 0) * 100)}%`; fill.style.setProperty('--c', level(v)); bar.append(fill);
  const foot = el('div', 'u-f');
  foot.append(el('span', null, down ? `⛔ kapalı · ${hm(down)}'e kadar` : w?.resetsAt ? `Sıfırlanma ${hm(w.resetsAt)}` : 'Sıfırlanma —'), el('span', null, week == null ? 'Hafta ?' : `Hafta %${Math.round(week * 100)}`));
  if (extra) foot.append(extra);
  card.append(el('div', 'u-ic', icon), el('div', 'u-t', title), el('div', 'u-v', v == null ? '–' : `%${Math.round(v * 100)}`), el('div', 'u-s', sub), bar, foot);
  return card;
}
function renderUsage() {
  const c = usage?.claude; const x = usage?.codex;
  const cv = pctNow(c?.fiveHour); const xv = pctNow(x?.fiveHour);
  $('usage').replaceChildren(
    usageCard({ icon: '✳️', title: 'Claude', sub: 'beyin · 5 saatlik kullanım', v: cv, w: c?.fiveHour, week: pctNow(c?.week), down: usage?.down?.claude, at: c?.at, extra: probeBtn() }),
    usageCard({ icon: '⌘', title: 'Codex', sub: 'iş yükü · 5 saatlik kullanım', v: xv, w: x?.fiveHour, week: pctNow(x?.week), down: usage?.down?.codex, at: x?.at }),
  );
  $('ovWhen').textContent = usage?.down?.antigravity ? `agy kapalı · ${hm(usage.down.antigravity)}` : '';
  // Görevler: aktif / tamamlanan halkaları + kısa sayaçlar.
  const active = board.filter((t) => ACTIVE.includes(t.status));
  const done = board.filter((t) => t.status === 'done').length;
  const bad = board.filter((t) => ['failed', 'needs-work'].includes(t.status)).length;
  const ring = (frac, color, v, l) => { const r = el('div', 'ring'); const b = el('div'); b.append(el('div', 'v', String(v)), el('div', 'l', l)); r.append(ringSvg(frac, color), b); return r; };
  const total = board.length || 1;
  const mini = el('div', 'ov-mini');
  mini.append(el('span', null, `🧐 kontrolde ${active.filter((t) => t.status === 'review').length}`), el('span', null, `↻ düzeltme ${active.filter((t) => t.status === 'redo').length}`), el('span', null, `✕ sorunlu ${bad}`), el('span', null, `⏰ zamanlı ${scheduled.length}`));
  const rings = el('div', 'ov-tasks'); rings.append(ring(active.length / total, '#60a5fa', active.length, 'Aktif'), el('span', 'sep'), ring(done / total, 'var(--accent)', done, 'Tamamlandı'));
  $('ovTasks').replaceChildren(rings, mini);
  renderActivity();
  renderStatus();
}

// ---- son aktiviteler + bildirimler: panodaki durum değişimlerinden üretilir ----
const feed = []; // { at, text, title, color, notify }
const seen = new Map(); // kart id → durum
let feedReady = false; let unread = 0;
const FEED_TXT = { doing: ['göreve başladı', '#60a5fa'], review: ['kontrole gitti', '#c084fc'], redo: ['düzeltiyor', '#fbbf24'], done: ['görevi tamamladı', '#3ee0a1'], 'needs-work': ['düzeltilmeli', '#f87171'], failed: ['görevde hata', '#f87171'] };
function trackBoard() {
  const fresh = [];
  for (const t of board) {
    if (seen.get(t.id) === t.status) continue;
    seen.set(t.id, t.status);
    const [verb, color] = FEED_TXT[t.status] ?? [t.status, '#8597a3'];
    fresh.push({ at: feedReady ? Date.now() : (t.at ?? t.startedAt ?? Date.now()), text: `${t.name} ${verb}`, title: t.title, agentId: t.agentId, color, notify: feedReady && ['done', 'failed', 'needs-work'].includes(t.status) });
  }
  feedReady = true;
  if (!fresh.length) return;
  feed.push(...fresh); feed.sort((a, b) => a.at - b.at); if (feed.length > 60) feed.splice(0, feed.length - 60);
  const n = fresh.filter((f) => f.notify).length;
  if (n) { unread += n; renderBell(); }
}
let lastWaiting = 0;
function trackApprovals() {
  const w = office.agents.filter((a) => a.activity === 'waiting');
  if (feedReady && w.length > lastWaiting) {
    for (const a of w.slice(0, w.length - lastWaiting)) feed.push({ at: Date.now(), text: `${a.name} izin bekliyor`, key: a.key, color: '#f5b041', notify: true });
    unread += w.length - lastWaiting; renderBell();
  }
  lastWaiting = w.length;
}
function renderActivity() {
  const rows = [...feed].reverse().slice(0, 8);
  $('activity').replaceChildren(...(rows.length ? rows.map((f) => {
    const r = el('div', 'act-row'); const d = el('i'); d.style.setProperty('--c', f.color);
    const tx = el('div', 'tx', f.text); if (f.title) tx.title = f.title;
    r.feed = f; r.title = 'Tıkla: ajanı göster';
    r.append(d, el('span', 'tm', hm(f.at)), tx); return r;
  }) : [el('div', 'dim', 'Henüz aktivite yok.')]));
}
function renderBell() {
  $('bellCount').hidden = !unread; $('bellCount').textContent = unread > 9 ? '9+' : String(unread);
  const pop = $('bellPop'); if (pop.hidden) return;
  const items = [...feed].reverse().filter((f) => f.notify).slice(0, 20);
  pop.replaceChildren(...(items.length ? items.map((f, i) => {
    const r = el('div', `nt${i < unread ? ' new' : ''}`); const tx = el('div', 'tx', f.text);
    if (f.title) tx.append(el('div', 'dim', f.title.slice(0, 120)));
    r.feed = f;
    r.append(el('span', 'tm', hm(f.at)), tx); return r;
  }) : [el('div', 'dim', 'Bildirim yok.')]));
}
$('bellBtn').onclick = (ev) => {
  ev.stopPropagation(); const p = $('bellPop'); p.hidden = !p.hidden; renderBell();
  if (!p.hidden) setTimeout(() => { unread = 0; $('bellCount').hidden = true; }, 1500);
};
document.addEventListener('click', (ev) => { if (!ev.target.closest?.('#bellPop, #bellBtn')) $('bellPop').hidden = true; });

// ---- alt durum çubuğu ----
let lastSync = null;
const ENG_NAME = { claude: 'Claude', codex: 'Codex', antigravity: 'agy' };
function renderStatus() {
  const down = Object.entries(usage?.down ?? {}).filter(([, t]) => t > Date.now());
  $('sysState').className = `sys${(!online && !cfg.demo) || down.length ? ' warn' : ''}`;
  $('sysText').textContent = online || cfg.demo ? (down.length ? 'Sistemler çalışıyor · yedek motor devrede' : 'Sistemler çalışıyor') : 'Köprü yok · ajanlar yine çalışır';
  $('sysEngines').textContent = down.map(([e, t]) => `${ENG_NAME[e] ?? e} limitte (${hm(t)}'e kadar)`).join(' · ');
  const working = office.agents.filter((a) => !['idle', 'resting'].includes(a.activity)).length;
  $('sysAgents').textContent = `${office.agents.length} ajan · ${working} aktif`;
  $('sysSync').textContent = lastSync ? `Son eşitleme ${hm(lastSync)}` : '';
}

// ---- saat / tarih ----
function tick() {
  const now = new Date();
  $('clock').textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  $('today').textContent = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  $('sunIcon').textContent = daylight(now.getTime(), cfg.lat, cfg.lon) > 0.5 ? '☀️' : '🌙';
}
setInterval(tick, 10_000);
setTimeout(tick, 0);

// ---- avatarlar: karakterin baş/omuz kısmı (önbellekli) ----
const avatars = new Map();
function avatarFor(a) {
  const key = `${a.key}|${pack ? 1 : 0}`;
  if (avatars.has(key)) return avatars.get(key);
  const c = document.createElement('canvas'); c.width = 22; c.height = 22;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const look = actors.get(a.key)?.look ?? lookFor(a.key, pack);
  x.translate(-5, -2);
  drawCharacter(x, pack, look, 0, 0, 'down', 0);
  const url = c.toDataURL();
  avatars.set(key, url);
  return url;
}

// ---- canlı görüntü: seçili ajanın çevresi, büyütülmüş ----
const live = $('live');
const lctx = live.getContext('2d');
function drawLive() {
  if ($('detailBody').hidden || !selectedKey) return;
  const a = actors.get(selectedKey);
  if (!a) return;
  const [px, py] = scene.point(a);
  const sw = Math.min(scene.W, 240); const sh = Math.round(sw * live.height / live.width);
  const sx = Math.max(0, Math.min(scene.W - sw, px - sw / 2)); const sy = Math.max(0, Math.min(scene.H - sh, py - sh / 2));
  lctx.imageSmoothingEnabled = false;
  lctx.drawImage(world, sx, sy, sw, sh, 0, 0, live.width, live.height);
}

/** Pizza geldiyse dinlenen birinin balonunda duyurulur. */
function withEventChatter(chatter, events) {
  if (!events.some((e) => e.kind === 'pizza')) return chatter;
  const who = office.agents.find((a) => a.place === 'lounge');
  if (!who) return chatter;
  const m = new Map(chatter ?? []);
  m.set(who.key, { text: 'Pizza geldi! 🍕' });
  return m;
}

let hoveredKey = null;
function actorAt(ev) {
  const r = view.getBoundingClientRect();
  const wx = ((ev.clientX - r.left) * geom.dpr - geom.ox) / geom.scale;
  const wy = ((ev.clientY - r.top) * geom.dpr - geom.oy) / geom.scale;
  let best = null; let bd = 26;
  for (const a of actors.values()) {
    const [px, py] = scene.point(a);
    const d = Math.hypot(px - wx, py - wy);
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}
view.addEventListener('mousemove', (ev) => { hoveredKey = actorAt(ev)?.agent.key ?? null; });
view.addEventListener('mouseleave', () => { hoveredKey = null; });
view.addEventListener('click', (ev) => {
  if (drag?.moved) return;
  const a = actorAt(ev);
  if (!a && boardAt(ev)) { showPanel('board'); return; }
  select(a?.agent.key ?? null);
});

async function select(key) {
  selectedKey = key;
  userClosed = !key;
  if (key && panel) { panel = null; boardOpen = false; for (const id of ['navStats', 'navBoard', 'navExperts', 'navSettings']) $(id).classList.remove('on'); $('navOffice').classList.add('on'); }
  // Seçim kalkınca ana süreçe de bildirilir; yoksa her güncellemede eski ajanın ayrıntısı geri gelir.
  const d = await api.select(key ?? null);
  details = key && selectedKey === key ? d : null;
  renderRoster();
  renderDetails();
}

/// ---- sol: ekibim (arama + Tümü/Çalışan/Molada süzgeci) ----
let rosterFilter = 'all';
const isBusy = (a) => !['idle', 'resting', 'waiting'].includes(a.activity);
function renderRoster() {
  const box = $('roster');
  const q = $('agentSearch').value.trim().toLocaleLowerCase('tr');
  const all = [...office.agents].sort((a, b) => b.since - a.since);
  const agents = q ? all.filter((a) => `${a.name} ${a.label ?? ''}`.toLocaleLowerCase('tr').includes(q)) : all;
  const waiting = agents.filter((a) => a.activity === 'waiting');
  const busy = agents.filter(isBusy);
  const rest = agents.filter((a) => ['idle', 'resting'].includes(a.activity));
  const groups = [['İzin bekliyor', waiting], ['Çalışıyor', busy], ['Molada', rest]]
    .filter(([t]) => rosterFilter === 'all' || (rosterFilter === 'work' ? t !== 'Molada' : t === 'Molada'));
  $('tCount').textContent = String(all.length);
  $('agentCount').textContent = String(all.length);
  $('tSub').textContent = q ? `"${$('agentSearch').value.trim()}" · ${agents.length} sonuç` : '';
  if (!all.length) { box.replaceChildren(el('div', 'dim', online || cfg.demo ? 'Şu an ofiste ajan yok.' : 'Feyzullah köprüsüne bağlanılıyor…')); return; }
  const chip = (a) => {
    const idle = ['idle', 'resting'].includes(a.activity);
    const c = el('button', `chip${a.key === selectedKey ? ' sel' : ''}${idle ? ' idle' : ' busy'}`);
    const img = el('img', 'ava'); img.src = avatarFor(a); img.alt = '';
    img.style.boxShadow = `0 0 0 2px ${a.color ?? AGENT_COLORS[a.agent] ?? '#5f717d'}`;
    const body = el('div', 'c-body');
    body.append(el('div', 'c-name', a.name), el('div', `c-act ${a.activity}`, idle ? `${a.activity === 'resting' ? 'molada' : 'boşta'} · ${ago(a.since)}` : `${a.label} · ${ago(a.since)}`));
    c.append(img, body);
    if (!idle) c.append(el('span', `st${a.activity === 'waiting' ? ' warn' : ''}`));
    c.title = a.label ?? '';
    c.onclick = () => select(a.key);
    return c;
  };
  const head = (t, n) => { const h = el('div', 'grp', `${t} `); h.append(el('span', null, `· ${n}`)); return h; };
  const out = groups.filter(([, l]) => l.length).flatMap(([t, l]) => [head(t, l.length), ...l.map(chip)]);
  box.replaceChildren(...(out.length ? out : [el('div', 'dim', 'Bu süzgeçte ajan yok.')]));
}
$('agentSearch').addEventListener('input', () => renderRoster());
for (const b of $('rosterTabs').querySelectorAll('button')) {
  b.onclick = () => { rosterFilter = b.dataset.f; for (const x of $('rosterTabs').querySelectorAll('button')) x.classList.toggle('on', x === b); renderRoster(); };
}

// ---- sağ panel: ayrıntılar ----
const KIND_TR = { prompt: 'görev', edit: 'düzenle', write: 'yaz', read: 'oku', search: 'ara', run: 'komut', web: 'web', mcp: 'mcp', plan: 'plan', tool: 'araç', agent: 'alt ajan', permission: 'izin', stop: 'bitti', note: 'not', guard: 'bekçi', session: 'oturum', say: 'mesaj' };

// ---- sohbet görünümü: mesaj balonları, basit markdown, katlanır komutlar ----
const expanded = new Set(); // açılmış uzun mesajlar / komutlar (yeniden çizimde korunur)
const LONG_MSG = 700;

/** Satır içi biçim: **kalın**, `kod`, [metin](bağlantı) → DOM (innerHTML yok). */
function inlineMd(text) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0; let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(document.createTextNode(text.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(el('strong', null, tok.slice(2, -2)));
    else if (tok.startsWith('`')) out.push(el('code', 'ic', tok.slice(1, -1)));
    else out.push(el('span', 'lnk', tok.slice(1, tok.indexOf(']'))));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}

/** Basit markdown: başlık, madde, numaralı madde, kod bloğu, tablo satırları (düz), paragraf. */
function mdView(src) {
  const box = el('div', 'md');
  const lines = String(src ?? '').replace(/\r\n/g, '\n').split('\n');
  let list = null; let code = null;
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (code) { box.append(code); code = null; } else code = el('pre', 'mdcode', '');
      continue;
    }
    if (code) { code.textContent += `${line}\n`; continue; }
    const li = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      if (!list) { list = el(/^\s*\d/.test(line) ? 'ol' : 'ul'); box.append(list); }
      const item = el('li'); item.append(...inlineMd(li[1])); list.append(item);
      continue;
    }
    list = null;
    if (!line.trim()) continue;
    const hd = /^#{1,4}\s+(.*)$/.exec(line);
    if (hd) { const h = el('div', 'mdh'); h.append(...inlineMd(hd[1])); box.append(h); continue; }
    if (/^\|?[\s:-]+\|[\s|:-]*$/.test(line)) continue; // tablo ayırıcı satırı
    const p = el('p'); p.append(...inlineMd(line.replace(/^\|\s*|\s*\|$/g, '').replace(/\s*\|\s*/g, ' · '))); box.append(p);
  }
  if (code) box.append(code);
  return box;
}

/** Bir kaydı sohbet öğesine çevirir. who: kullanıcı/ajan/sistem; komut ve araçlar katlanır satır. */
function chatItem(e, d) {
  const time = el('span', 'time', ago(e.at));
  // Kullanıcının/yöneticinin gönderdiği görev ya da telefondan mesaj: sağda balon
  if (e.kind === 'prompt' || e.kind === 'say') {
    const b = el('div', 'bubble me');
    const meta = el('div', 'b-meta'); meta.append(el('span', null, e.kind === 'say' ? (e.detail ?? 'mesaj') : 'görev'), time);
    b.append(meta, mdView(e.text ?? e.title));
    return b;
  }
  // Ajanın cevabı: solda balon, uzunsa katlanır
  if (e.kind === 'stop') {
    const b = el('div', `bubble agent${e.status === 'running' ? ' typing' : ''}`);
    const meta = el('div', 'b-meta'); meta.append(el('span', null, e.status === 'running' ? 'yazıyor…' : 'cevap'), time);
    const text = e.text || e.title || '';
    const long = text.length > LONG_MSG && !expanded.has(e.id);
    b.append(meta, mdView(long ? `${text.slice(0, LONG_MSG)}…` : text));
    if (text.length > LONG_MSG) {
      const more = el('button', 'more', expanded.has(e.id) ? 'daha az göster' : `devamını göster (${Math.round(text.length / 100) / 10}k karakter)`);
      more.onclick = () => { if (expanded.has(e.id)) expanded.delete(e.id); else expanded.add(e.id); renderDetails(); };
      b.append(more);
    }
    return b;
  }
  // Bekçi uyarısı ve notlar: ortada ince şerit
  if (e.kind === 'guard' || e.kind === 'note' || e.kind === 'session') {
    const n = el('div', `sysnote ${e.kind}${e.status === 'failed' ? ' bad' : ''}`);
    n.append(el('span', 'k', e.kind === 'guard' ? '🛡 bekçi' : e.kind === 'session' ? 'oturum' : 'not'), el('span', 't', e.title), time);
    return n;
  }
  // Komut / araç / dosya işlemi: tek satır, tıklayınca ayrıntı
  const open = expanded.has(e.id) || e.status === 'waiting';
  const row = el('div', `act ${e.status ?? ''}${open ? ' open' : ''}`);
  const h = el('button', 'act-h');
  const icon = { run: '›_', edit: '✎', write: '✎', read: '👁', search: '⌕', web: '🌐', mcp: '⚙', permission: '✋', plan: '☰', agent: '⇢' }[e.kind] ?? '•';
  h.append(el('span', 'ai', icon), el('span', 'at', e.kind === 'run' && e.command ? e.command.split('\n')[0] : e.title));
  if (e.status === 'failed') h.append(el('span', 'badge bad', 'hata'));
  h.append(time);
  h.onclick = () => { if (expanded.has(e.id)) expanded.delete(e.id); else expanded.add(e.id); renderDetails(); };
  row.append(h);
  if (open) {
    if (e.command && (e.command.includes('\n') || e.command !== e.title)) row.append(el('pre', 'cmd', `$ ${e.command}`));
    if (e.output) row.append(outputView(e));
  }
  if (e.diff) row.append(diffView(e.diff, e)); // farklar kendi içinde katlanır
  return row;
}

const FILTERS = [
  { id: 'all', label: 'Hepsi', test: () => true },
  { id: 'cmd', label: 'Komutlar', test: (e) => e.kind === 'run' || e.kind === 'permission' || Boolean(e.command) },
  { id: 'change', label: 'Değişiklikler', test: (e) => ['edit', 'write'].includes(e.kind) || Boolean(e.diff) },
  { id: 'msg', label: 'Mesajlar', test: (e) => ['prompt', 'say', 'stop', 'note'].includes(e.kind) },
];
const STATUS_TR = { ok: 'başarılı', failed: 'başarısız', running: 'çalışıyor', waiting: 'bekliyor' };
const OUTPUT_TAIL = 30;
const DIFF_MAX_LINES = 400;
let filter = 'all';
const openFiles = new Map(); // `${kayıt}:${dosya}` → açık mı (kullanıcı değiştirdiyse)
const fullOutputs = new Set(); // çıktısı tamamen açılmış kayıtlar

const cleanPath = (p) => p.trim().replace(/\t.*$/, '').replace(/^[ab]\//, '');

/** Birleşik diff ya da apply_patch metnini dosyalara böler; satır numaralarını @@ başlığından hesaplar. */
function parseDiff(text, fallbackName) {
  const files = [];
  let cur = null; let oldLn = null; let newLn = null;
  const start = (name) => { cur = { name, lines: [], add: 0, del: 0 }; files.push(cur); oldLn = null; newLn = null; };
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\*\*\* (Begin|End) Patch/.test(line) || /^diff --git /.test(line) || /^index [0-9a-f]+\.\.[0-9a-f]+/.test(line)) continue;
    const patch = /^\*\*\* (Update|Add|Delete) File: (.+)$/.exec(line);
    if (patch) { start(patch[2].trim()); if (patch[1] !== 'Update') cur.tag = patch[1] === 'Add' ? 'yeni' : 'silindi'; continue; }
    if (/^\*\*\* Move to: /.test(line) && cur) { cur.name += ` → ${line.slice(13).trim()}`; continue; }
    if (line.startsWith('--- ') && lines[i + 1]?.startsWith('+++ ')) {
      const from = cleanPath(line.slice(4)); const to = cleanPath(lines[i + 1].slice(4));
      start(to === '/dev/null' ? from : to);
      if (from === '/dev/null') cur.tag = 'yeni'; else if (to === '/dev/null') cur.tag = 'silindi';
      i++; continue;
    }
    if (!cur) { if (line === '') continue; start(fallbackName); }
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) { oldLn = Number(hunk[1]); newLn = Number(hunk[2]); cur.lines.push({ type: 'hunk', text: line }); continue; }
    if (line.startsWith('@@')) { oldLn = null; newLn = null; cur.lines.push({ type: 'hunk', text: line }); continue; }
    if (line.startsWith('\\')) { cur.lines.push({ type: 'meta', text: line }); continue; }
    if (line.startsWith('+')) { cur.add++; cur.lines.push({ type: 'add', o: null, n: newLn, text: line }); if (newLn != null) newLn++; continue; }
    if (line.startsWith('-')) { cur.del++; cur.lines.push({ type: 'del', o: oldLn, n: null, text: line }); if (oldLn != null) oldLn++; continue; }
    if (line === '' && i === lines.length - 1) continue; // sondaki boş satır
    cur.lines.push({ type: 'ctx', o: oldLn, n: newLn, text: line });
    if (oldLn != null) oldLn++;
    if (newLn != null) newLn++;
  }
  return files;
}

function diffStats(text) {
  let add = 0; let del = 0; const names = [];
  for (const f of parseDiff(text, '')) { add += f.add; del += f.del; if (f.name) names.push(f.name); }
  return { add, del, names };
}

function counter(add, del) {
  const c = el('span', 'counter');
  c.append(el('span', 'c-add', `+${add}`), el('span', 'c-del', `−${del}`));
  return c;
}

function diffView(diff, e) {
  const box = el('div', 'diff-files');
  const fallback = e.files?.[0]?.path ?? e.title ?? 'değişiklik';
  parseDiff(diff, fallback).forEach((f, idx) => {
    const key = `${e.id}:${idx}`;
    const det = el('details', 'dfile');
    det.open = openFiles.has(key) ? openFiles.get(key) : idx < 3;
    det.addEventListener('toggle', () => openFiles.set(key, det.open));
    const sum = el('summary');
    const name = el('span', 'df-name', f.name.split(/[\\/]/).slice(-3).join('/'));
    name.title = f.name;
    sum.append(name);
    if (f.tag) sum.append(el('span', `df-tag ${f.tag === 'yeni' ? 'new' : 'gone'}`, f.tag));
    sum.append(counter(f.add, f.del));
    const body = el('div', 'diff');
    for (const l of f.lines.slice(0, DIFF_MAX_LINES)) {
      if (l.type === 'hunk' || l.type === 'meta') { body.append(el('div', `dl ${l.type}`, l.text)); continue; }
      const row = el('div', `dl ${l.type}`);
      row.append(el('span', 'ln', l.o ?? ''), el('span', 'ln', l.n ?? ''), el('span', 'code', l.text || ' '));
      body.append(row);
    }
    if (f.lines.length > DIFF_MAX_LINES) body.append(el('div', 'dl meta', `… ${f.lines.length - DIFF_MAX_LINES} satır daha`));
    det.append(sum, body);
    box.append(det);
  });
  return box;
}

function outputView(e) {
  const wrap = el('div', `out${e.status === 'failed' ? ' failed' : ''}`);
  const lines = String(e.output).replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const full = fullOutputs.has(e.id);
  const shown = full ? lines : lines.slice(-OUTPUT_TAIL);
  if (lines.length > OUTPUT_TAIL) {
    const b = el('button', 'more', full ? 'son 30 satırı göster' : `tamamını göster (${lines.length} satır, ${lines.length - OUTPUT_TAIL} gizli)`);
    b.onclick = () => { if (full) fullOutputs.delete(e.id); else fullOutputs.add(e.id); renderDetails(); };
    wrap.append(b);
  }
  wrap.append(el('pre', null, shown.join('\n')));
  return wrap;
}

function renderSummary(d) {
  let box = $('dSummary');
  if (!box) { box = el('div', 'summary'); box.id = 'dSummary'; $('dTask').before(box); }
  const files = new Set(d.files.map((f) => f.path));
  let add = 0; let del = 0;
  for (const e of d.entries) {
    if (!e.diff) continue;
    const s = diffStats(e.diff);
    add += s.add; del += s.del;
    if (!e.files?.length) for (const n of s.names) files.add(n);
  }
  const lastCmd = d.entries.find(FILTERS[1].test);
  const items = [el('span', 'sm', `${files.size} dosya`), counter(add, del)];
  if (lastCmd) {
    const st = el('span', `sm status ${lastCmd.status ?? ''}`, `son komut: ${STATUS_TR[lastCmd.status] ?? lastCmd.status ?? '—'}`);
    st.title = lastCmd.command || lastCmd.title;
    items.push(st);
  }
  box.replaceChildren(...items);
}

function renderFilters(d) {
  let bar = $('dFilters');
  if (!bar) { bar = el('div', 'filters'); bar.id = 'dFilters'; $('dTimeline').before(bar); }
  bar.replaceChildren(...FILTERS.map((f) => {
    const b = el('button', `flt${f.id === filter ? ' on' : ''}`);
    b.append(el('span', null, f.label), el('span', 'n', String(d.entries.filter(f.test).length)));
    b.onclick = () => { filter = f.id; renderDetails(); };
    return b;
  }));
}

function renderDetails() {
  renderBoard();
  renderSettings();
  renderExperts();
  const d = panel ? null : details;
  $('detailEmpty').hidden = Boolean(d) || (Boolean(panel) && panel !== 'stats');
  $('detailBody').hidden = !d;
  if (!d) return;
  const agent = office.agents.find((a) => a.key === d.key);
  const apiA = d.agent === 'api' ? apiAgents.find((a) => a.id === d.session) : null;
  $('dDot').textContent = apiA?.emoji || { claude: '✳️', codex: '⌘', antigravity: '🅰️' }[d.agent] || '🤖';
  $('dDot').style.background = office.agents.find((x) => x.key === d.key)?.color ?? AGENT_COLORS[d.agent] ?? 'var(--accent)';
  $('dName').textContent = agent?.name ?? `${d.agent} · ${d.project}`;
  $('dSub').textContent = `${agent?.label ?? d.state} · ${d.cwd ?? ''}`;
  $('dTask').textContent = d.task ? `Görev: ${d.task}` : '';
  $('dPending').hidden = !d.pending;
  if (d.pending) $('dPendingCmd').textContent = d.pending.command || d.pending.title;
  $('dFiles').replaceChildren(...d.files.slice(-30).map((f) => el('span', `file ${f.change}`, f.path.split(/[\\/]/).slice(-2).join('/'))));
  renderSummary(d);
  renderFilters(d);
  const test = (FILTERS.find((f) => f.id === filter) ?? FILTERS[0]).test;
  const shown = d.entries.filter(test);
  // Sohbet sırası: eskiden yeniye (en yeni yazma kutusunun üstünde); kullanıcı alttaysa yeni mesajda alta kayar.
  const pane = $('detail');
  const atBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80;
  const sameAgent = renderDetails.lastKey === d.key;
  renderDetails.lastKey = d.key;
  const ordered = [...shown].sort((a, b) => a.at - b.at);
  $('dTimeline').replaceChildren(...(ordered.length ? ordered.map((e) => chatItem(e, d)) : [el('div', 'dim', 'Bu filtrede kayıt yok.')]));
  if (!sameAgent || atBottom) requestAnimationFrame(() => { pane.scrollTop = pane.scrollHeight; });
  $('dSay').hidden = !(d.agent === 'claude' || d.agent === 'antigravity' || d.agent === 'api');
  const apiAgent = d.agent === 'api' ? apiAgents.find((a) => a.id === d.session) : null;
  $('dApi').hidden = !apiAgent;
  $('dRemove').hidden = apiAgent?.role === 'admin' || apiAgent?.role === 'prompt'; // silinemezler
  if (apiAgent && apiAgent.engine !== 'api') $('dSub').textContent = `${agent?.label ?? ''} · ${ENGINE_TR[apiAgent.engine] ?? apiAgent.engine} · ${apiAgent.workdir || 'ofis-work klasörü'}`;
  else if (apiAgent) $('dSub').textContent = `${agent?.label ?? ''} · ${apiAgent.provider} · ${apiAgent.model}${apiAgent.hasKey ? ` · anahtar ••••${apiAgent.keyHint}` : ' · anahtar yok'}`;
  $('dSayText').placeholder = d.agent === 'api' ? 'Ajana yaz…' : 'Ajana yaz… (sonraki adımda ya da bitince iletilir)';
}

$('dClose').onclick = () => select(null);
// ---- kayıtlı komutlar (⭐): tıklayınca kutuya gelir; kutudaki komut kaydedilebilir ----
function renderSaved() {
  const list = cfg.savedCommands ?? [];
  const pop = $('savedPop');
  const save = (next) => api.setConfig('savedCommands', next).then((r) => { if (!r?.ok) toast(`Kaydedilemedi: ${r?.error ?? ''}`); });
  const rows = list.map((c, i) => {
    const r = el('div', 'sc');
    const use = el('button', 'use', c); use.title = c;
    use.onclick = () => { $('adminText').value = c; pop.hidden = true; $('adminText').focus(); };
    const del = el('button', 'del', '✕'); del.title = 'Sil';
    del.onclick = () => save(list.filter((_, j) => j !== i));
    r.append(use, del);
    return r;
  });
  const cur = $('adminText').value.trim();
  const add = el('button', 'add', cur ? `+ Kutudaki komutu kaydet: "${cur.slice(0, 50)}${cur.length > 50 ? '…' : ''}"` : 'Kutuya bir komut yaz, sonra buradan kaydet');
  add.disabled = !cur || list.includes(cur) || list.length >= 30;
  add.onclick = () => save([...list, cur]);
  pop.replaceChildren(...(rows.length ? rows : [el('div', 'dim', 'Henüz kayıtlı komut yok. Örn: "testleri çalıştır, kırılanları düzelt"')]), add);
}
$('savedBtn').onclick = () => { const p = $('savedPop'); p.hidden = !p.hidden; $('schedPop').hidden = true; if (!p.hidden) renderSaved(); };
document.addEventListener('click', (ev) => { if (!ev.target.closest?.('#savedPop, #savedBtn')) $('savedPop').hidden = true; });
$('adminForm').onsubmit = async (ev) => {
  ev.preventDefault();
  const text = $('adminText').value.trim();
  if (!text) return;
  const direct = $('adminDirect').checked;
  const r = await api.commandAdmin(text, { direct });
  if (!r.ok) { toast(`Gönderilemedi: ${r.error}`); return; }
  $('adminText').value = '';
  rememberCommand(text);
  const pm = apiAgents.find((a) => a.role === 'prompt');
  toast(direct || !pm ? 'Yönetici görevi dağıtıyor…' : 'Prompt Master netleştiriyor, sonra yönetici dağıtacak…');
  const who = direct || !pm ? apiAgents.find((a) => a.role === 'admin') : pm;
  if (who) select(`api:${who.id}`);
};
$('dAllow').onclick = async () => { if (!details?.pending) return; const r = await api.decide(details.pending.id, 'allow'); toast(r.ok ? 'İzin verildi' : `Olmadı: ${r.error ?? ''}`); };
$('dDeny').onclick = async () => { if (!details?.pending) return; const r = await api.decide(details.pending.id, 'deny'); toast(r.ok ? 'Reddedildi' : `Olmadı: ${r.error ?? ''}`); };
$('dSay').onsubmit = async (ev) => {
  ev.preventDefault();
  const text = $('dSayText').value.trim();
  if (!text || !details) return;
  const r = await api.say(details.agent, details.session, text);
  if (r.ok) { $('dSayText').value = ''; toast('Mesaj sıraya alındı'); } else toast(`Gönderilemedi: ${r.error ?? ''}`);
};

// ---- API ajanı ekle / düzenle ----
let editingId = null;
function openAgentDialog(agent = null) {
  editingId = agent?.id ?? null;
  const f = $('agentForm');
  f.reset();
  $('agentDlgTitle').textContent = agent ? 'Ajanı düzenle' : 'Ajan ekle';
  f.name.value = agent?.name ?? '';
  f.engine.value = agent?.engine ?? 'api';
  f.workdir.value = agent?.workdir ?? '';
  syncEngineRows();
  // Hazır sağlayıcı listesi (Anthropic, OpenAI, Gemini, OpenRouter, Groq, DeepSeek, Mistral, xAI, yerel Ollama/LM Studio…).
  if (!f.preset.options.length) for (const p of PRESETS) { const o = document.createElement('option'); o.value = p.id; o.textContent = p.label; f.preset.append(o); }
  const pre = agent ? presetFor(agent.provider, agent.baseUrl) : PRESETS[0];
  f.preset.value = pre.id;
  f.baseUrl.value = agent?.baseUrl ?? pre.baseUrl;
  f.model.value = agent?.model ?? pre.model;
  syncPreset();
  f.system.value = agent?.system ?? '';
  f.key.placeholder = agent?.hasKey ? `Kayıtlı: ••••${agent.keyHint} (boş bırak = değiştirme)` : 'Boş bırakılabilir';
  $('keyClearRow').hidden = !agent?.hasKey;
  $('agentDlg').showModal();
}
function syncEngineRows() {
  const isApi = $('agentForm').engine.value === 'api';
  for (const e of document.querySelectorAll('#agentForm .api-only')) e.hidden = !isApi;
  for (const e of document.querySelectorAll('#agentForm .cli-only')) e.hidden = isApi;
}
$('agentForm').engine.addEventListener('change', syncEngineRows);
/** Seçili hazır sağlayıcıya göre: sağlayıcı türü, adres alanı (yalnız özel adreste görünür), model ipucu, anahtar notu. */
function syncPreset() {
  const f = $('agentForm');
  const p = PRESETS.find((x) => x.id === f.preset.value) ?? PRESETS[0];
  f.provider.value = p.provider;
  $('baseUrlRow').hidden = p.id !== 'custom';
  f.model.placeholder = p.hint ?? '';
  if (!f.key.value && !editingId) f.key.placeholder = p.local ? 'Yerel sunucu: anahtar gerekmez' : 'Bu sağlayıcının API anahtarı (isteğe bağlı)';
}
$('agentForm').preset.addEventListener('change', () => {
  const f = $('agentForm');
  const p = PRESETS.find((x) => x.id === f.preset.value);
  const known = PRESETS.some((x) => x.model && x.model === f.model.value);
  if (p.id !== 'custom') f.baseUrl.value = p.baseUrl;
  if (!f.model.value || known) f.model.value = p.model;
  syncPreset();
});
// ---- Agency Agents kataloğundan işe alma ----
let catalogData = null;
const ENGINE_TR = { claude: 'Claude', codex: 'Codex', antigravity: 'agy' };
function renderHire() {
  const q = $('hireSearch').value.trim().toLowerCase();
  const div = $('hireDivision').value;
  const hired = new Set(apiAgents.map((a) => a.catalogId).filter(Boolean));
  const list = catalogData.agents.filter((a) => (!div || a.division === div) && (!q || `${a.name} ${a.description} ${a.id}`.toLowerCase().includes(q))).slice(0, 120);
  $('hireList').replaceChildren(...(list.length ? list.map((a) => {
    const row = el('div', `hire-item${hired.has(a.id) ? ' hired' : ''}`);
    row.style.setProperty('--c', a.color);
    const info = el('div');
    info.append(el('div', 'h-name', `${a.emoji} ${a.name}`), el('div', 'h-desc', `${catalogData.divisions[a.division]?.label ?? a.division} · ${a.description}`));
    info.title = a.description;
    const sel = el('select');
    for (const [v, t] of Object.entries(ENGINE_TR)) { const o = el('option', null, v === a.engine ? `${t} (önerilen)` : t); o.value = v; sel.append(o); }
    sel.value = a.engine;
    const btn = el('button', 'allow', hired.has(a.id) ? 'Ofiste' : 'İşe al');
    btn.type = 'button';
    btn.disabled = hired.has(a.id);
    btn.onclick = async () => {
      btn.disabled = true;
      const r = await api.hire(a.id, sel.value);
      if (!r.ok) { toast(`Olmadı: ${r.error}`); btn.disabled = false; return; }
      apiAgents.push(r.agent);
      btn.textContent = 'Ofiste'; row.classList.add('hired');
      toast(`${a.name} işe alındı — ofise geliyor`);
    };
    row.append(info, sel, btn);
    return row;
  }) : [el('p', 'dim', 'Sonuç yok.')]));
}
$('btnAddAgent').onclick = async () => {
  if (!catalogData) {
    catalogData = await api.catalog();
    for (const [id, d] of Object.entries(catalogData.divisions)) { const o = el('option', null, d.label); o.value = id; $('hireDivision').append(o); }
  }
  if (!catalogData.agents.length) { openAgentDialog(); toast('Katalog yok (catalog/agency-agents); API ajanı ekleyebilirsin'); return; }
  renderHire();
  $('hireDlg').showModal();
};
$('hireSearch').addEventListener('input', () => renderHire());
$('hireDivision').addEventListener('change', () => renderHire());
$('hireApi').onclick = () => { $('hireDlg').close(); openAgentDialog(); };
$('agentDlg').addEventListener('close', async () => {
  const f = $('agentForm');
  if ($('agentDlg').returnValue !== 'save') { f.key.value = ''; return; }
  const key = f.keyClear.checked ? '' : (f.key.value.trim() || (editingId ? null : undefined));
  const engine = f.engine.value;
  const fields = engine === 'api'
    ? { name: f.name.value, engine, provider: f.provider.value, model: f.model.value, baseUrl: f.baseUrl.value, system: f.system.value, key }
    : { name: f.name.value, engine, workdir: f.workdir.value };
  f.key.value = ''; // anahtar formda kalmasın
  const r = await api.saveAgent(editingId, fields);
  if (!r.ok) { toast(`Kaydedilemedi: ${r.error}`); return; }
  toast(editingId ? 'Ajan güncellendi' : 'Ajan eklendi — ofise geliyor');
  select(`api:${r.agent.id}`);
});
$('dEdit').onclick = () => { const a = apiAgents.find((x) => x.id === details?.session); if (a) openAgentDialog(a); };
$('dRemove').onclick = async () => {
  const a = apiAgents.find((x) => x.id === details?.session);
  if (!a) return;
  if ($('dRemove').dataset.confirm !== a.id) { $('dRemove').dataset.confirm = a.id; $('dRemove').textContent = 'Emin misin? Tekrar bas'; return; }
  delete $('dRemove').dataset.confirm; $('dRemove').textContent = 'Sil';
  await api.removeAgent(a.id);
  select(null);
  toast('Ajan silindi');
};

api.onOffice((msg) => {
  office = msg.office;
  cfg = msg.config ?? cfg;
  if (cfg.demo && !demoEvents) { demoEvents = true; officeEvents.start('pizza', Date.now()); officeEvents.start('cat', Date.now()); }
  if (cfg.demoPanel && !demoPanelShown) { demoPanelShown = true; setTimeout(() => showPanel(cfg.demoPanel), 500); }
  online = msg.online;
  apiAgents = msg.agents ?? [];
  board = msg.board ?? [];
  stats = msg.stats ?? {};
  usage = msg.usage ?? null;
  scheduled = msg.schedule ?? [];
  lastSync = Date.now();
  trackBoard();
  trackApprovals();
  renderUsage();
  renderCenter();
  renderSched();
  if (panel) renderDetails();
  if (!$('savedPop').hidden) renderSaved();
  $('conn').title = online ? 'Feyzullah köprüsüne bağlı' : 'Köprü yok (Ofis ajanları yine çalışır)';
  $('conn').className = `conn ${online ? 'on' : 'off'}`;
  $('connText').textContent = online ? 'Bağlı' : cfg.demo ? 'Demo' : 'Köprü yok';
  const c = office.counts;
  const b = (n) => el('b', null, String(n));
  $('counts').replaceChildren(b(c.working), ' çalışıyor · ', b(c.resting), ' molada', ...(c.waiting ? [' · ', b(c.waiting), ' izin bekliyor'] : []));
  syncActors();
  renderRoster();
  if (selectedKey && !office.agents.some((a) => a.key === selectedKey)) renderDetails();
});
// Bildirim sesi: Feyzullah ses sağlayıcısının dosyası varsa o, yoksa Windows'un Türkçe sesi.
api.onSpeak?.(({ text, audio }) => {
  if (audio?.base64) { new Audio(`data:${audio.mime};base64,${audio.base64}`).play().catch(() => {}); return; }
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'tr-TR';
  const tr = speechSynthesis.getVoices().find((v) => v.lang?.startsWith('tr'));
  if (tr) u.voice = tr;
  speechSynthesis.speak(u);
});
let userClosed = false; // kullanıcı kapattıysa ana süreçten geç gelen eski ayrıntı paneli yeniden açmaz
api.onDetails((d) => {
  if (d && d.key !== selectedKey && (userClosed || panel)) return;
  details = d; if (d) selectedKey = d.key; renderDetails(); renderRoster();
});

// ---- kullanım kolaylıkları: kısayollar, komut geçmişi, tıklanabilir aktiviteler, hatırlanan arayüz durumu ----
const agentKeyFor = (agentId) => office.agents.find((a) => a.session === agentId || a.key === `api:${agentId}`)?.key ?? null;
// Aktivite/bildirim satırına tıklayınca ilgili ajan seçilir (yoksa pano açılır).
function openFeedItem(f) {
  const key = f.key ?? (f.agentId ? agentKeyFor(f.agentId) : null);
  if (key) { setView('office'); select(key); } else showPanel('board');
}
$('activity').addEventListener('click', (ev) => { const r = ev.target.closest('.act-row'); if (r?.feed) openFeedItem(r.feed); });
$('bellPop').addEventListener('click', (ev) => { const r = ev.target.closest('.nt'); if (r?.feed) { $('bellPop').hidden = true; openFeedItem(r.feed); } });

// Komut geçmişi: kutuda ↑/↓ ile önceki komutlar (bu bilgisayarda, son 50).
const HIST_KEY = 'ofis.history';
const loadJson = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const saveJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let hist = loadJson(HIST_KEY, []); let histPos = -1;
function rememberCommand(text) { hist = [text, ...hist.filter((h) => h !== text)].slice(0, 50); histPos = -1; saveJson(HIST_KEY, hist); }
$('adminText').addEventListener('keydown', (ev) => {
  if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
  if (!hist.length) return;
  ev.preventDefault();
  histPos = ev.key === 'ArrowUp' ? Math.min(hist.length - 1, histPos + 1) : Math.max(-1, histPos - 1);
  $('adminText').value = histPos < 0 ? '' : hist[histPos];
});

// Klavye: Ctrl+K komut kutusu · Ctrl+F ajan ara · Alt+1/2/3 sekmeler · +/− yakınlaştır · 0 ortala · Esc kapat
document.addEventListener('keydown', (ev) => {
  const typing = ev.target.closest?.('input, textarea, select');
  if (ev.ctrlKey && ev.key.toLowerCase() === 'k') { ev.preventDefault(); $('adminText').focus(); return; }
  if (ev.ctrlKey && ev.key.toLowerCase() === 'f') { ev.preventDefault(); $('agentSearch').focus(); return; }
  if (ev.altKey && ['1', '2', '3'].includes(ev.key)) { ev.preventDefault(); setView(['office', 'tasks', 'reports'][Number(ev.key) - 1]); return; }
  if (ev.key === 'Escape') {
    for (const id of ['savedPop', 'schedPop', 'bellPop']) $(id).hidden = true;
    if (typing) { ev.target.blur(); return; }
    if (panel || selectedKey) { showPanel(null); select(null); }
    return;
  }
  if (typing || centerView !== 'office') return;
  if (ev.key === '+' || ev.key === '=') $('zoomIn').click();
  else if (ev.key === '-') $('zoomOut').click();
  else if (ev.key === '0') $('zoomFit').click();
});

// Arayüz durumu hatırlanır: sekme, ekip süzgeci, tam ekran (yakınlaştırma her açılışta %100).
const UI_KEY = 'ofis.ui';
function saveUi() { saveJson(UI_KEY, { view: centerView, filter: rosterFilter, full: document.querySelector('.app').classList.contains('full') }); }
for (const b of [...document.querySelectorAll('.tab'), ...$('rosterTabs').querySelectorAll('button'), $('fullBtn')]) b.addEventListener('click', () => setTimeout(saveUi, 0));
{
  const ui = loadJson(UI_KEY, {});
  if (ui.filter && ui.filter !== 'all') $('rosterTabs').querySelector(`[data-f="${ui.filter}"]`)?.click();
  if (ui.full) $('fullBtn').click();
  if (ui.view && ui.view !== 'office' && VIEW_TITLE[ui.view]) setView(ui.view);
}

(async () => {
  pack = await loadPack(cfg.pack);
  // Tema: 'real' (gerçekçi ofis + stilize karakterler) → 'pixel' (piksel ofis + MetroCity) → kod çizimi
  const theme = cfg.theme ?? 'pixel';
  const cast = theme === 'real' && REAL ? await loadCast() : [];
  const sceneDef = cast.length ? REAL : PIXEL2;
  const bg = await loadOfficeImage(sceneDef.IMG);
  if (bg) {
    scene = createImageScene(bg, sceneDef, { style: sceneDef === REAL ? 'real' : 'pixel', cast });
    world.width = scene.W; world.height = scene.H;
    for (const a of actors.values()) a.actor = scene.newActor();
  }
  for (const a of actors.values()) a.look = lookFor(a.agent.key, pack);
  resize();
  requestAnimationFrame(frame);
})();
