// Ofis olayları: arada bir pizza gelir, ofis kedisi dolaşır, elektrik dalgalanır (ayarlardan kapatılabilir).
// Saf zamanlama (createEvents) + çizim (drawEvents, dünya pikseli).

const KINDS = ['pizza', 'cat', 'flicker'];
const LEN = { pizza: 90_000, cat: 120_000, flicker: 1_800 };

/** rand: test için; gap: iki olay arası [min, max] ms. */
export function createEvents({ rand = Math.random, gap = [180_000, 360_000], first = 60_000 } = {}) {
  let next = null;
  const active = [];
  return {
    /** Etkin olayları döndürür: [{ kind, start, end }]. */
    tick(now, enabled = true) {
      for (let i = active.length - 1; i >= 0; i--) if (active[i].end <= now) active.splice(i, 1);
      if (!enabled) { active.length = 0; next = null; return active; }
      if (next == null) next = now + first;
      if (now >= next) {
        const kind = KINDS[Math.floor(rand() * KINDS.length)];
        if (!active.some((e) => e.kind === kind)) active.push({ kind, start: now, end: now + LEN[kind] });
        next = now + gap[0] + rand() * (gap[1] - gap[0]);
      }
      return active;
    },
    /** Hemen başlat (deneme/demo). */
    start(kind, now) { if (LEN[kind] && !active.some((e) => e.kind === kind)) active.push({ kind, start: now, end: now + LEN[kind] }); },
  };
}

/** Elektrik dalgalanması: karartma oranı (0..1). */
export function flickerDark(e, now) {
  const p = (now - e.start) / (e.end - e.start);
  return [0.55, 0, 0.7, 0.1, 0.8, 0, 0.4, 0][Math.min(7, Math.floor(p * 8))];
}

/** Kedi: dinlenme köşesindeki noktalar arasında yürür, arada oturur. pts: [[x, y], ...] dünya pikseli. */
export function catPos(e, now, pts) {
  const leg = 6000; // bir noktadan ötekine (yürüme 4 sn + oturma 2 sn)
  const k = Math.floor((now - e.start) / leg);
  const f = ((now - e.start) % leg) / leg;
  const a = pts[k % pts.length]; const b = pts[(k + 1) % pts.length];
  const w = Math.min(1, f / 0.66);
  return { x: a[0] + (b[0] - a[0]) * w, y: a[1] + (b[1] - a[1]) * w, walking: w < 1, left: b[0] < a[0] };
}

function px(ctx, c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

/** Piksel kedi (ölçek s), ayak ucu (x, y). */
function drawCat(ctx, x, y, s, walking, left, now) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(left ? -s : s, s);
  const step = walking ? Math.floor(now / 150) % 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
  const o = '#e08a3c'; const d = '#b0612a';
  px(ctx, o, -6, -7, 10, 5); // gövde
  px(ctx, d, -4, -7, 2, 5); px(ctx, d, 0, -7, 2, 5); // çizgiler
  px(ctx, o, 3, -10, 5, 5); // baş
  px(ctx, o, 3, -12, 1, 2); px(ctx, o, 7, -12, 1, 2); // kulaklar
  px(ctx, '#1b1d24', 6, -9, 1, 1); // göz
  px(ctx, o, -8, -10 + step, 2, 4); px(ctx, o, -9, -11 + step, 2, 2); // kuyruk
  px(ctx, d, -5, -2, 2, 2 - step); px(ctx, d, 2, -2, 2, 1 + step); // bacaklar
  ctx.restore();
}

/** Açık pizza kutusu (merkez x, y). */
function drawPizza(ctx, x, y, s) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(s, s);
  px(ctx, '#c9a77a', -9, -14, 18, 7); // kapak
  px(ctx, '#e8d3b0', -9, -7, 18, 12); // kutu
  ctx.fillStyle = '#e9b44c'; ctx.beginPath(); ctx.arc(0, -1, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d0452f';
  for (const [a, b] of [[-3, -3], [2, -4], [3, 1], [-2, 2], [0, -1]]) ctx.fillRect(a, b, 2, 2);
  ctx.strokeStyle = '#a8742c'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(7, -1); ctx.moveTo(0, -8); ctx.lineTo(0, 6); ctx.stroke();
  ctx.restore();
}

/** spots: { table: [x, y], lounge: [[x, y], ...] } dünya pikseli. Dönüş: karartma oranı (gece katmanına eklenir). */
export function drawEvents(ctx, events, now, spots, s = 2) {
  let dark = 0;
  for (const e of events) {
    if (e.kind === 'pizza') drawPizza(ctx, spots.table[0], spots.table[1], s);
    else if (e.kind === 'cat') { const c = catPos(e, now, spots.lounge); drawCat(ctx, c.x, c.y, s, c.walking, c.left, now); }
    else if (e.kind === 'flicker') dark = Math.max(dark, flickerDark(e, now));
  }
  return dark;
}
