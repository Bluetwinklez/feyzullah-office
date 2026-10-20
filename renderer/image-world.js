// Görsel arka planlı ofis çizimi: üretilmiş boş ofis görseli yarım çözünürlükte önbelleğe alınır;
// üstüne monitör ekranları, karakterler ve gece karartması çizilir. İki tarz: 'pixel' (MetroCity katmanları)
// ve 'real' (üretilmiş stilize 3B karakterler: ayakta / masada sırtı dönük / önden oturan).
import { drawCharacter } from './sprites.js';
import { TILE } from './scene-logic.js';
import { drawEvents } from './events.js';

const R = 0.5; // dünya tuvali = görsel × R
const S = 2; // piksel karakter büyütmesi (32 px MetroCity → görseldeki sandalye boyu)
const LEG = 24; // 32 px karede bacakların başladığı satır (oturunca kesilir)
// Gerçekçi karakter boyları (dünya pikseli): pozların orijinal oranları korunur.
const REAL_H = { stand: 86, sitback: 64, sitfront: 80 };

export function loadOfficeImage(IMG) {
  const IW = Math.round(IMG.w * R); const IH = Math.round(IMG.h * R);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = IW; c.height = IH;
      const cx = c.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, IW, IH);
      resolve(c);
    };
    img.onerror = () => resolve(null);
    img.src = IMG.src;
  });
}

/** Ofis karakterleri: assets/realistic/chars/c<n>-{stand,sitback,sitfront}.png (yüklenebilenler). */
export async function loadCast(max = 12) {
  const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const cast = [];
  for (let n = 1; n <= max; n++) {
    const [stand, sitback, sitfront] = await Promise.all(['stand', 'sitback', 'sitfront'].map((x) => load(`../assets/realistic/chars/c${n}-${x}.png`)));
    if (!stand || !sitback || !sitfront) break;
    cast.push({ stand, sitback, sitfront });
  }
  return cast;
}

function castIndex(key, n) {
  let h = 2166136261;
  for (const c of String(key)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % n;
}

/** Gerçekçi karakterin pozu. */
function realPose(a) {
  const seated = a.actor.arrived && (a.agent.place === 'desk' || a.agent.place === 'lounge');
  if (!seated) return 'stand';
  return a.actor.dir === 'up' ? 'sitback' : 'sitfront';
}

/** Tekli masaların gri ekranlarına etkinlik animasyonu. */
function drawScreen(ctx, [x, y, w, h], activity, t, seed) {
  const sx = Math.round(x * R); const sy = Math.round(y * R); const sw = Math.round(w * R); const sh = Math.round(h * R);
  if (!activity || activity === 'idle' || activity === 'resting') return; // boşken görseldeki gri ekran kalır
  const tick = Math.floor(t / 600) + seed;
  const px = (c, a, b, ww, hh) => { ctx.fillStyle = c; ctx.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh)); };
  if (activity === 'code' || activity === 'read') {
    px('#1e1b2e', sx, sy, sw, sh);
    const cols = ['#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f472b6'];
    for (let l = 0; l < 6; l++) px(cols[(l + seed) % cols.length], sx + 3 + (l % 3) * 3, sy + 3 + l * (sh - 6) / 6, Math.min(sw - 10, 8 + ((tick + l * 5) % 7) * 3), 2);
  } else if (activity === 'terminal' || activity === 'tool') {
    px('#05070a', sx, sy, sw, sh);
    for (let l = 0; l < 5; l++) px('#22c55e', sx + 3, sy + 3 + l * (sh - 6) / 5, 6 + ((tick + l * 3) % 9) * 2, 2);
  } else if (activity === 'browser') {
    px('#f8fafc', sx, sy, sw, sh); px('#3b82f6', sx, sy, sw, 4);
    for (let l = 0; l < 3; l++) px('#cbd5e1', sx + 4, sy + 8 + l * 4, sw - 12 - ((tick + l) % 4) * 3, 2);
  } else if (activity === 'thinking') {
    px('#1e293b', sx, sy, sw, sh);
    for (let i = 0; i < 3; i++) px(i === tick % 3 ? '#e2e8f0' : '#475569', sx + sw / 2 - 9 + i * 7, sy + sh / 2 - 2, 4, 4);
  } else if (activity === 'waiting') {
    px(Math.floor(t / 400) % 2 ? '#78350f' : '#b45309', sx, sy, sw, sh);
    px('#fef3c7', sx + sw / 2 - 1, sy + 3, 3, sh - 9); px('#fef3c7', sx + sw / 2 - 1, sy + sh - 5, 3, 3);
  }
}

/**
 * Oturan piksel karakter (32×32 karede, sol üst 0,0): bacaklar kesilir, yerine oturuş çizilir.
 * up: masada sırtı dönük (sandalye arkalığı gövdenin altını örter); down: koltukta önden (dizler öne);
 * left/right: yandan (uyluk yatay).
 */
function drawSeated(ctx, pack, look, dir, typing, t, seed, occluded = false) {
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, 32, LEG); ctx.clip();
  drawCharacter(ctx, pack, look, 0, 0, dir, 0);
  ctx.restore();
  const pants = '#2f3442'; const shoe = '#1b1d24';
  if (dir === 'up') {
    // Sandalye arkalığı (görselde yoksa çizilir; varsa arka plan parçası sonradan üstüne basılır); yazarken dirsekler oynar.
    if (!occluded) {
      ctx.fillStyle = '#23262f'; ctx.fillRect(9, LEG - 5, 14, 8);
      ctx.fillStyle = '#343946'; ctx.fillRect(10, LEG - 4, 12, 6);
      ctx.fillStyle = '#16181e'; ctx.fillRect(15, LEG + 3, 2, 3); ctx.fillRect(11, LEG + 6, 10, 1);
    }
    if (typing) {
      const k = Math.floor(t / 220 + seed) % 2;
      ctx.fillStyle = look.skin ?? '#e0ac7e';
      ctx.fillRect(7 + k, 17, 2, 2); ctx.fillRect(23 - k, 17, 2, 2);
    }
  } else if (dir === 'down') {
    ctx.fillStyle = pants; ctx.fillRect(11, LEG, 4, 4); ctx.fillRect(17, LEG, 4, 4);
    ctx.fillStyle = shoe; ctx.fillRect(11, LEG + 4, 4, 2); ctx.fillRect(17, LEG + 4, 4, 2);
  } else {
    const r = dir === 'right';
    ctx.fillStyle = pants; ctx.fillRect(r ? 13 : 9, LEG, 10, 3); ctx.fillRect(r ? 20 : 9, LEG + 3, 3, 3);
    ctx.fillStyle = shoe; ctx.fillRect(r ? 20 : 8, LEG + 6, 4, 2);
  }
}

/** Duvardaki görev panosunun ahşap çerçevesi ve mantar zemini (dünya pikseli; [x, y, w, h] tam çözünürlük). */
function drawBoardFrame(ctx, [bx, by, bw, bh]) {
  const x = Math.round(bx * R); const y = Math.round(by * R); const w = Math.round(bw * R); const h = Math.round(bh * R);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 3, y + 4, w, h);
  ctx.fillStyle = '#5b3a1e'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#20262e'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#7a4f29'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h);
}

/** Sahne bağdaştırıcısı: app.js kod çizimli sahneyle aynı arayüzle kullanır. scene: makeScene(...) çıktısı. */
export function createImageScene(bg, scene, { style = 'pixel', cast = [] } = {}) {
  const { SPOTS, advancePx, newActorPx, targetPx } = scene;
  const IW = bg.width; const IH = bg.height;
  const real = style === 'real' && cast.length > 0;
  // Olay noktaları: dinlenme köşesinin oturma yerleri ve ortalarındaki sehpa (dünya pikseli).
  const loungePts = SPOTS.lounge.map((l) => [l.pos[0] * R, l.pos[1] * R + 14]);
  const eventSpots = { lounge: loungePts, table: [loungePts.reduce((s, p) => s + p[0], 0) / loungePts.length, loungePts.reduce((s, p) => s + p[1], 0) / loungePts.length - 10] };
  const occluderAt = (actor) => (scene.OCCLUDERS ?? []).find((o) => Math.abs(o.at[0] - actor.x) < 12 && Math.abs(o.at[1] - actor.y) < 12) ?? null;
  const headTop = (a) => (real ? a.actor.y * R - REAL_H[realPose(a)] : a.actor.y * R - 30 * S);
  return {
    W: IW, H: IH,
    /** Pano dikdörtgeni (dünya pikseli) — yazılar app.js'de pencere çözünürlüğünde çizilir. */
    board: scene.BOARD ? scene.BOARD.map((v) => v * R) : null,
    newActor: () => newActorPx(SPOTS.door),
    advance: (actor, agent, index, t, seed, dt) => advancePx(actor, targetPx(agent, index, t, seed), dt),
    /** Etiket/tıklama için karakterin gövde ortası (dünya pikseli). */
    point: (a) => [a.actor.x * R, (a.actor.y * R + headTop(a)) / 2],
    /** drawLabels kod sahnesi birimleriyle çalışır: konumu ona uygun sahte aktöre çevir. */
    labelActor: (a) => ({ ...a, actor: { ...a.actor, x: (a.actor.x * R - 16) / TILE, y: (headTop(a) + 14) / TILE } }),
    draw(ctx, { t, actors, pack, light, selectedKey, events = [] }) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, 0, 0);
      const byDesk = new Map();
      for (const a of actors) if (a.agent.desk != null && (a.agent.place === 'desk' || a.agent.activity === 'waiting')) byDesk.set(a.agent.desk, a.agent);
      SPOTS.desks.forEach((d, i) => { if (d.screen) drawScreen(ctx, d.screen, byDesk.get(i)?.activity, t, i * 3); });
      for (const a of [...actors].sort((p, q) => p.actor.y - q.actor.y)) {
        const seated = a.actor.arrived && (a.agent.place === 'desk' || a.agent.place === 'lounge');
        const typing = seated && a.agent.place === 'desk' && !['thinking', 'idle'].includes(a.agent.activity);
        const bob = typing && Math.floor(t / 400 + a.seed) % 2 ? 1 : 0;
        if (real) {
          const pose = realPose(a);
          const img = cast[castIndex(a.agent.key, cast.length)][pose];
          const h = REAL_H[pose];
          const w = Math.round(img.width * (h / img.height));
          const fx = Math.round(a.actor.x * R);
          const fy = Math.round(a.actor.y * R) + (pose === 'stand' ? 0 : 6);
          const walkBob = a.actor.walking ? Math.round(Math.abs(Math.sin(a.actor.step / 140)) * -3) : 0;
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.beginPath(); ctx.ellipse(fx, fy - 1, w * 0.32, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.imageSmoothingEnabled = true;
          ctx.save();
          if (a.actor.walking && a.actor.dir === 'left') { ctx.translate(fx, 0); ctx.scale(-1, 1); ctx.translate(-fx, 0); }
          ctx.drawImage(img, fx - w / 2, fy - h + walkBob - bob, w, h);
          ctx.restore();
          ctx.imageSmoothingEnabled = false;
          if (a.agent.key === selectedKey) { ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5; ctx.strokeRect(fx - w / 2 - 2.5, fy - h - 2.5, w + 5, h + 5); }
          continue;
        }
        const frame = a.actor.walking ? 1 + (Math.floor(a.actor.step / 110) % 5) : 0;
        const x = Math.round(a.actor.x * R - 16 * S);
        // Oturan karakter sandalyeye iner (bacak boyu kadar aşağı); masada yazarken hafif sallanır.
        const y = Math.round(a.actor.y * R - (seated ? 25 : 30) * S) + (seated && a.actor.dir === 'up' ? bob : 0);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(Math.round(a.actor.x * R), Math.round(a.actor.y * R + 1), 15, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(S, S);
        const occ = seated && a.actor.dir === 'up' ? occluderAt(a.actor) : null;
        if (seated) drawSeated(ctx, pack, a.look, a.actor.dir, typing, t, a.seed, Boolean(occ));
        else drawCharacter(ctx, pack, a.look, 0, 0, a.actor.dir, frame);
        if (a.agent.key === selectedKey) { ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1 / S; ctx.strokeRect(6.5, 2.5, 19, 30); }
        ctx.restore();
        // Koltuk/sandalye arkalığı karakterin önüne: arka plandaki o parça yeniden çizilir.
        if (occ) { const [ox, oy, ow, oh] = occ.rect.map((v) => v * R); ctx.drawImage(bg, ox, oy, ow, oh, ox, oy, ow, oh); }
      }
      if (scene.BOARD) drawBoardFrame(ctx, scene.BOARD);
      // Ofis olayları (pizza masada, kedi dinlenme köşesinde, elektrik dalgalanması karartması).
      const dark = events.length ? drawEvents(ctx, events, t, eventSpots, S) : 0;
      if (light < 1) { ctx.fillStyle = `rgba(10, 14, 30, ${(1 - light) * 0.35})`; ctx.fillRect(0, 0, IW, IH); }
      if (dark > 0) { ctx.fillStyle = `rgba(4, 6, 12, ${dark})`; ctx.fillRect(0, 0, IW, IH); }
    },
  };
}
