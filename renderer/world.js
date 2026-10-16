// Ofis dünyası: Lumio tarzı "CODE & CHILL" endüstriyel tuğla ofis.
// Tuğla arka duvar, büyük pencerelerden şehir silueti, sol duvarda borular, koyu gri beton zemin,
// pembe/turkuaz neon "CODE & CHILL" tabelası, gri kanepe, yuvarlak desenli halı, ahşap sehpa,
// modern mutfak (espresso makinesi, mikrodalga, raflar, buzdolabı, bar masası + tabureler, sebil),
// masa grupları (çift monitör, kasa, klavye, kupa) ve dinamik aydınlatma.
import { COLS, LAYOUT, ROWS, TILE } from './scene-logic.js';
import { drawCharacter } from './sprites.js';

export const W = COLS * TILE; // 896
export const H = ROWS * TILE; // 512
export const AGENT_COLORS = {
  claude: '#f97316',
  codex: '#10b981',
  antigravity: '#818cf8',
  api: '#38bdf8',
};

const px = (ctx, c, x, y, w, h) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// --- ARKA DUVAR & PENCERELER & ŞEHİR SİLUETİ ---
function drawBricks(ctx, x1, y1, w, h) {
  px(ctx, '#22110c', x1, y1, w, h); // koyu harç
  const brickW = 16;
  const brickH = 7;
  const palette = ['#7c3022', '#8d3928', '#9e4231', '#6b261b', '#843525', '#5a1d13'];
  for (let y = y1; y < y1 + h; y += brickH + 1) {
    const row = Math.floor((y - y1) / (brickH + 1));
    const offset = (row % 2) * (brickW / 2);
    for (let x = x1 - offset; x < x1 + w; x += brickW + 1) {
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const idx = Math.floor(Math.abs(hash)) % palette.length;
      const bx = Math.max(x1, x);
      const bw = Math.min(x + brickW, x1 + w) - bx;
      const bh = Math.min(brickH, y1 + h - y);
      if (bw > 0 && bh > 0) {
        px(ctx, palette[idx], bx, y, bw, bh);
        px(ctx, 'rgba(255,255,255,0.08)', bx, y, bw, 1);
        px(ctx, 'rgba(0,0,0,0.22)', bx, y + bh - 1, bw, 1);
      }
    }
  }
}

function drawCitySkyline(ctx, wx, wy, ww, wh, light, t) {
  const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  if (light > 0.8) {
    skyGrad.addColorStop(0, '#4388cc');
    skyGrad.addColorStop(0.65, '#8bc0e8');
    skyGrad.addColorStop(1, '#fed7aa');
  } else if (light >= 0.2) {
    skyGrad.addColorStop(0, '#2b153b');
    skyGrad.addColorStop(0.5, '#ab3b63');
    skyGrad.addColorStop(1, '#f59e0b');
  } else {
    skyGrad.addColorStop(0, '#060913');
    skyGrad.addColorStop(1, '#11182c');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(wx, wy, ww, wh);

  if (light < 0.3) {
    for (let i = 0; i < 16; i++) {
      const sx = wx + ((i * 37 + 13) % (ww - 4)) + 2;
      const sy = wy + ((i * 23 + 7) % Math.floor(wh * 0.55)) + 2;
      const twinkle = Math.floor(t / 600 + i) % 3 === 0 ? 0.3 : 0.9;
      ctx.fillStyle = `rgba(226, 232, 240, ${twinkle})`;
      ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
  }

  if (light > 0.8) {
    px(ctx, 'rgba(255, 255, 255, 0.4)', wx + 12, wy + 8, 22, 4);
    px(ctx, 'rgba(255, 255, 255, 0.55)', wx + 16, wy + 6, 14, 2);
    px(ctx, 'rgba(255, 255, 255, 0.35)', wx + ww - 34, wy + 14, 18, 3);
  }

  const bColorFar = light >= 0.2 ? '#252c3d' : '#0c101b';
  const bColorNear = light >= 0.2 ? '#1b202e' : '#080a14';

  const farBuildings = [
    { x: 0, w: 18, h: 36 },
    { x: 16, w: 22, h: 48 },
    { x: 36, w: 16, h: 40 },
    { x: 50, w: 26, h: 54 },
    { x: 74, w: 20, h: 44 },
    { x: 92, w: 24, h: 50 },
  ];
  for (const b of farBuildings) {
    const bx = wx + (b.x * ww) / 112;
    const bw = Math.max(8, (b.w * ww) / 112);
    const bh = Math.min(wh - 2, b.h);
    const by = wy + wh - bh;
    px(ctx, bColorFar, bx, by, bw, bh);
  }

  const nearBuildings = [
    { x: 4, w: 24, h: 32, winCols: 2, winRows: 4 },
    { x: 26, w: 20, h: 42, antenna: true, winCols: 2, winRows: 6 },
    { x: 44, w: 28, h: 26, winCols: 3, winRows: 3 },
    { x: 70, w: 22, h: 38, winCols: 2, winRows: 5 },
    { x: 90, w: 22, h: 30, winCols: 2, winRows: 4 },
  ];
  for (const b of nearBuildings) {
    const bx = wx + (b.x * ww) / 112;
    const bw = Math.max(10, (b.w * ww) / 112);
    const bh = Math.min(wh - 2, b.h);
    const by = wy + wh - bh;
    px(ctx, bColorNear, bx, by, bw, bh);

    if (b.antenna) {
      px(ctx, '#05070c', bx + bw / 2 - 1, by - 8, 2, 8);
      px(ctx, '#ef4444', bx + bw / 2 - 1, by - 9, 2, 2);
    }

    if (light < 0.7) {
      const nightAlpha = Math.min(1, (1 - light) * 1.4);
      for (let r = 0; r < b.winRows; r++) {
        for (let c = 0; c < b.winCols; c++) {
          const winX = bx + 3 + c * 7;
          const winY = by + 4 + r * 6;
          if (winX + 3 < bx + bw && winY + 3 < wy + wh) {
            const lit = ((b.x * 13 + r * 7 + c * 11) % 5) !== 0;
            if (lit) {
              const yellow = (r + c) % 2 === 0 ? '#fef08a' : '#fde047';
              ctx.fillStyle = yellow;
              ctx.globalAlpha = 0.9 * nightAlpha;
              ctx.fillRect(Math.round(winX), Math.round(winY), 3, 3);
              ctx.globalAlpha = 1;
            }
          }
        }
      }
    }
  }
}

function drawWindows(ctx, light, t) {
  const winXs = [88, 224, 424, 594, 734];
  const winW = 100;
  const winY = 12;
  const winH = 74;

  for (const wx of winXs) {
    px(ctx, '#181a20', wx - 3, winY - 3, winW + 6, winH + 6);
    drawCitySkyline(ctx, wx, winY, winW, winH, light, t);

    const cols = 3;
    const rows = 4;
    const cw = winW / cols;
    const ch = winH / rows;

    for (let c = 1; c < cols; c++) {
      px(ctx, '#181a20', wx + c * cw - 1, winY, 2, winH);
    }
    for (let r = 1; r < rows; r++) {
      px(ctx, '#181a20', wx, winY + r * ch - 1, winW, 2);
    }
    px(ctx, '#272b36', wx - 5, winY + winH, winW + 10, 5);
    px(ctx, '#3d4352', wx - 4, winY + winH, winW + 8, 1);
  }
}

function drawPipesAndPillars(ctx) {
  px(ctx, '#3e434f', 0, 0, 16, 96);
  px(ctx, '#4e5463', 0, 0, 3, 96);
  px(ctx, '#2c303a', 14, 0, 2, 96);

  px(ctx, '#1c1f26', 0, 0, W, 8);
  px(ctx, '#2b303d', 0, 7, W, 2);
  for (let x = 12; x < W; x += 32) {
    px(ctx, '#0e1014', x, 3, 3, 3);
  }

  // Kalın ve ince borular
  px(ctx, '#5a6273', 18, 8, 7, 88);
  px(ctx, '#7b849a', 20, 8, 2, 88);
  px(ctx, '#3a3f4c', 24, 8, 1, 88);

  px(ctx, '#4b5261', 28, 8, 4, 88);
  px(ctx, '#687285', 29, 8, 1, 88);

  for (const ky of [24, 52, 80]) {
    px(ctx, '#222630', 16, ky, 18, 4);
    px(ctx, '#8b95a8', 17, ky, 1, 4);
    px(ctx, '#14161d', 33, ky, 1, 4);
  }

  px(ctx, '#b91c1c', 16, 44, 11, 3);
  px(ctx, '#ef4444', 18, 41, 7, 9);
  px(ctx, '#7f1d1d', 20, 43, 3, 5);
  px(ctx, '#fca5a5', 20, 44, 2, 2);
}

function drawPendantLights(ctx) {
  const lamps = [136, 274, 474, 644, 784];
  for (const lx of lamps) {
    const ly = 46;
    px(ctx, '#111317', lx, 8, 1, ly - 8);
    px(ctx, '#232730', lx - 2, ly, 5, 4);
    px(ctx, '#3f4452', lx - 4, ly + 4, 9, 3);
    px(ctx, '#fef08a', lx - 2, ly + 7, 5, 5);
    px(ctx, '#f59e0b', lx - 1, ly + 8, 3, 3);
    px(ctx, 'rgba(254, 240, 138, 0.25)', lx - 4, ly + 5, 9, 9);
  }
}

function drawBoardAndClock(ctx, t, counts) {
  const bx = 336;
  const by = 16;
  const bw = 80;
  const bh = 54;

  px(ctx, '#10131a', bx, by, bw, bh);
  px(ctx, '#1c2230', bx + 2, by + 2, bw - 4, bh - 4);

  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#86efac';
  ctx.fillText(`▶ ${counts.working}`, bx + 6, by + 14);
  ctx.fillStyle = '#93c5fd';
  ctx.fillText(`☕ ${counts.resting}`, bx + 34, by + 14);
  ctx.fillStyle = counts.waiting ? '#fbbf24' : '#6b7280';
  ctx.fillText(`! ${counts.waiting}`, bx + 62, by + 14);

  for (let i = 0; i < 9; i++) {
    const barH = 3 + ((i * 7 + Math.floor(t / 800)) % 8);
    px(ctx, '#34d399', bx + 6 + i * 8, by + 30 - barH, 4, barH);
  }

  const cx = bx + bw / 2;
  const cy = by + 41;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const d = new Date(t);
  const hand = (ang, len, w) => {
    ctx.lineWidth = w;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len);
    ctx.stroke();
  };
  hand(((d.getHours() % 12) + d.getMinutes() / 60) * Math.PI / 6, 5, 1.5);
  hand(d.getMinutes() * Math.PI / 30, 7, 1);
}

// --- BETON ZEMİN & HALI ---
function drawFloor(ctx) {
  const yStart = 3 * TILE; // 96
  px(ctx, '#3c404d', 0, yStart, W, H - yStart);

  for (let y = yStart; y < H; y += 64) {
    px(ctx, '#313540', 0, y, W, 1);
  }
  for (let x = 0; x < W; x += 64) {
    px(ctx, '#313540', x, yStart, 1, H - yStart);
  }

  ctx.strokeStyle = '#272a33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 440); ctx.lineTo(95, 452); ctx.lineTo(110, 448); ctx.lineTo(125, 460);
  ctx.moveTo(380, 360); ctx.lineTo(395, 375); ctx.lineTo(410, 370); ctx.lineTo(430, 390);
  ctx.moveTo(590, 420); ctx.lineTo(605, 430); ctx.lineTo(625, 426); ctx.lineTo(640, 445);
  ctx.moveTo(435, 470); ctx.lineTo(450, 485); ctx.lineTo(470, 480);
  ctx.stroke();

  ctx.strokeStyle = '#4c5263';
  ctx.beginPath();
  ctx.moveTo(81, 441); ctx.lineTo(96, 453);
  ctx.moveTo(381, 361); ctx.lineTo(396, 376);
  ctx.stroke();

  const dx = 14 * TILE;
  const dy = 15 * TILE;
  px(ctx, '#1f232b', dx - 12, dy + 10, 56, 22);
  px(ctx, '#2e3440', dx - 10, dy + 12, 52, 18);
  for (let py = dy + 14; py < dy + 28; py += 3) {
    px(ctx, '#1a1c22', dx - 8, py, 48, 1);
  }
}

function drawRug(ctx) {
  const { cx, cy, r } = LAYOUT.rug;
  const rcx = cx * TILE;
  const rcy = cy * TILE;
  const rr = r * TILE;

  ctx.fillStyle = '#232630';
  ctx.beginPath();
  ctx.arc(rcx, rcy, rr, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#474f63';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(rcx, rcy, rr - 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#363d4e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(rcx, rcy, rr - 18, 0, Math.PI * 2);
  ctx.arc(rcx, rcy, rr - 36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#323947';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const ang = (i * Math.PI) / 8;
    ctx.moveTo(rcx + Math.cos(ang) * (rr - 36), rcy + Math.sin(ang) * (rr - 36));
    ctx.lineTo(rcx + Math.cos(ang) * (rr - 18), rcy + Math.sin(ang) * (rr - 18));
  }
  ctx.stroke();

  ctx.fillStyle = '#2e3340';
  ctx.beginPath();
  ctx.arc(rcx, rcy, rr - 54, 0, Math.PI * 2);
  ctx.fill();
}

// --- TUĞLA BÖLME DUVARI & "CODE & CHILL" NEON TABELASI ---
function drawBrickPartitionAndNeon(ctx, t) {
  // Referanstaki gibi: Lounge arkasında yükselen şık tuğla bölme duvarı (x=14..21 arası)
  // y=184'ten y=248'e kadar yüksek ve ferah tuğla panel!
  const wallX = 14 * TILE;
  const wallY = 186;
  const wallW = 7 * TILE; // 224 px
  const wallH = 64;

  // Tuğla örgü
  drawBricks(ctx, wallX, wallY, wallW, wallH);

  // Üst kalın mermer küpeşte
  px(ctx, '#e2e8f0', wallX, wallY - 4, wallW, 5);
  px(ctx, '#94a3b8', wallX, wallY + 1, wallW, 2);

  // Mutfak arkası duvar devamı (daha alçak: x=21..28)
  const mutX = 21 * TILE;
  const mutY = 7 * TILE - 6;
  const mutW = 7 * TILE;
  const mutH = 26;
  drawBricks(ctx, mutX, mutY, mutW, mutH);
  px(ctx, '#cbd5e1', mutX, mutY, mutW, 3);

  // NEON TABELA: "CODE & CHILL"
  // Kanepenin tam üstünde, duvara monte edilmiş ferah ve göz alıcı neon!
  const neonX = wallX + 32;
  const neonY = wallY + 12;

  // Neon tüp görünümü: kalın renkli ışıma + ince beyaz çekirdek (bir kez çizilip önbelleğe alınır)
  const neon = (text, x, y, color) => {
    ctx.save();
    ctx.font = 'bold 22px "Segoe UI", "Arial Rounded MT Bold", sans-serif';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.strokeText(text, x, y);
    ctx.restore();
  };
  neon('CODE &', neonX + 30, neonY + 4, '#ff3d9a');
  neon('CHILL', neonX + 42, neonY + 28, '#22d3ee');
}

// --- DİNLENME ALANI: KANEPE, SEHPA, KOLTUKLAR ---
function drawSofa(ctx) {
  // y=8 x 15..18 kanepe
  const sx = 15 * TILE - 6;
  const sy = 8 * TILE - 2;
  const sw = 4 * TILE + 12; // 140 px

  // Dolgulu açık/orta gri sırtlık
  px(ctx, '#454c5c', sx, sy, sw, 14);
  px(ctx, '#5a6375', sx + 2, sy + 2, sw - 4, 10);

  // Kolçaklar
  px(ctx, '#3a404e', sx, sy + 6, 8, 22);
  px(ctx, '#545d6e', sx + 1, sy + 6, 6, 20);
  px(ctx, '#3a404e', sx + sw - 8, sy + 6, 8, 22);
  px(ctx, '#545d6e', sx + sw - 7, sy + 6, 6, 20);

  // 4 adet oturma minderi
  const mw = (sw - 20) / 4;
  for (let i = 0; i < 4; i++) {
    const mx = sx + 10 + i * mw;
    px(ctx, '#3d4452', mx, sy + 12, mw - 2, 16);
    px(ctx, '#616a7d', mx + 1, sy + 13, mw - 4, 13);
  }

  // Kırlentler (turkuaz & hardal sarısı)
  px(ctx, '#0d9488', sx + 10, sy + 7, 10, 10);
  px(ctx, '#14b8a6', sx + 11, sy + 8, 8, 8);
  px(ctx, '#d97706', sx + sw - 21, sy + 7, 10, 10);
  px(ctx, '#f59e0b', sx + sw - 20, sy + 8, 8, 8);
}

function drawCoffeeTable(ctx) {
  const tx = 16 * TILE + 2;
  const ty = 10 * TILE + 4;
  const tw = 2 * TILE - 4; // 60 px

  px(ctx, '#181a20', tx + 4, ty + 18, 2, 8);
  px(ctx, '#181a20', tx + tw - 6, ty + 18, 2, 8);
  px(ctx, '#181a20', tx + 8, ty + 12, 2, 8);
  px(ctx, '#181a20', tx + tw - 10, ty + 12, 2, 8);

  px(ctx, '#a67243', tx, ty, tw, 14);
  px(ctx, '#be8754', tx + 2, ty + 1, tw - 4, 10);
  px(ctx, '#7a4d25', tx, ty + 13, tw, 4);

  // Açık laptop
  px(ctx, '#cbd5e1', tx + 14, ty + 2, 14, 9);
  px(ctx, '#38bdf8', tx + 15, ty - 4, 12, 7);
  px(ctx, '#1e293b', tx + 14, ty - 5, 14, 2);

  // Kahve kupaları
  px(ctx, '#f8fafc', tx + 34, ty + 4, 5, 5);
  px(ctx, '#451a03', tx + 35, ty + 5, 3, 3);
  px(ctx, '#ef4444', tx + 44, ty + 3, 5, 5);
  px(ctx, '#451a03', tx + 45, ty + 4, 3, 3);
}

function drawArmchair(ctx, tx, ty, face) {
  const x = tx * TILE + 2;
  const y = ty * TILE + 2;
  const w = 28;
  const h = 28;

  if (face === 'right') {
    px(ctx, '#82522c', x, y, 4, h);
    px(ctx, '#3d4452', x + 4, y + 2, 22, h - 4);
    px(ctx, '#545d6e', x + 6, y + 4, 18, h - 8);
    px(ctx, '#683f1f', x + 2, y, 22, 3);
    px(ctx, '#683f1f', x + 2, y + h - 3, 22, 3);
  } else if (face === 'left') {
    px(ctx, '#82522c', x + w - 4, y, 4, h);
    px(ctx, '#3d4452', x + 2, y + 2, 22, h - 4);
    px(ctx, '#545d6e', x + 4, y + 4, 18, h - 8);
    px(ctx, '#683f1f', x + 4, y, 22, 3);
    px(ctx, '#683f1f', x + 4, y + h - 3, 22, 3);
  } else {
    px(ctx, '#82522c', x, y + h - 5, w, 5);
    px(ctx, '#3d4452', x + 2, y + 4, w - 4, 18);
    px(ctx, '#545d6e', x + 4, y + 6, w - 8, 14);
    px(ctx, '#683f1f', x, y + 2, 3, 22);
    px(ctx, '#683f1f', x + w - 3, y + 2, 3, 22);
  }
}

// --- MUTFAK: TEZGÂH, KAHVE MAKİNESİ, MİKRODALGA, RAFLAR, BUZDOLABI, BAR MASASI, SEBİL ---
function drawKitchenCounter(ctx) {
  const kx = 21 * TILE;
  const ky = 8 * TILE;
  const kw = 5 * TILE; // 160 px
  const kh = 28;

  // Alt dolaplar
  px(ctx, '#222834', kx, ky + 6, kw, kh - 6);
  const dw = kw / 5;
  for (let i = 0; i < 5; i++) {
    const cx = kx + i * dw;
    px(ctx, '#191e28', cx, ky + 8, 1, kh - 9);
    px(ctx, '#94a3b8', cx + dw / 2 - 4, ky + 12, 8, 2);
  }

  // Beyaz İtalyan mermeri tezgâh tablası
  px(ctx, '#cbd5e1', kx, ky, kw, 6);
  px(ctx, '#f1f5f9', kx, ky, kw, 2);
  px(ctx, '#94a3b8', kx, ky + 5, kw, 1);

  // Duvarda asılı raflar
  px(ctx, '#854d0e', kx + 8, ky - 20, kw - 16, 3);
  px(ctx, '#854d0e', kx + 8, ky - 34, kw - 16, 3);
  for (let i = 0; i < 7; i++) {
    px(ctx, ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#f8fafc', '#a855f7'][i], kx + 14 + i * 18, ky - 27, 6, 7);
    px(ctx, '#94a3b8', kx + 18 + i * 18, ky - 41, 5, 7);
  }

  // Barista Espresso Makinesi
  const emX = kx + 6;
  const emY = ky - 18;
  px(ctx, '#881337', emX, emY, 26, 18);
  px(ctx, '#e2e8f0', emX + 2, emY + 4, 22, 4);
  px(ctx, '#475569', emX + 5, emY + 10, 6, 7);
  px(ctx, '#475569', emX + 15, emY + 10, 6, 7);
  px(ctx, '#22c55e', emX + 4, emY + 2, 2, 2);
  px(ctx, '#ef4444', emX + 8, emY + 2, 2, 2);

  // Mikrodalga Fırın
  const mwX = kx + kw - 34;
  const mwY = ky - 14;
  px(ctx, '#64748b', mwX, mwY, 28, 14);
  px(ctx, '#0f172a', mwX + 3, mwY + 2, 16, 10);
  px(ctx, '#22c55e', mwX + 21, mwY + 3, 5, 2);
  px(ctx, '#94a3b8', mwX + 22, mwY + 8, 3, 3);
}

function drawFridge(ctx) {
  const fx = 26 * TILE + 2;
  const fy = 8 * TILE - 24;
  const fw = 2 * TILE - 4; // 60 px
  const fh = 52;

  px(ctx, '#94a3b8', fx, fy, fw, fh);
  px(ctx, '#cbd5e1', fx + 1, fy + 1, fw - 2, fh - 2);
  px(ctx, '#64748b', fx + fw / 2 - 1, fy, 2, fh);

  px(ctx, '#334155', fx + fw / 2 - 4, fy + 10, 2, 24);
  px(ctx, '#334155', fx + fw / 2 + 2, fy + 10, 2, 24);

  px(ctx, '#1e293b', fx + 6, fy + 8, 14, 16);
  px(ctx, '#38bdf8', fx + 10, fy + 14, 6, 2);

  px(ctx, '#ef4444', fx + fw - 12, fy + 6, 3, 3);
  px(ctx, '#f59e0b', fx + fw - 8, fy + 12, 3, 4);
  px(ctx, '#10b981', fx + fw - 14, fy + 18, 4, 3);

  px(ctx, '#78716c', fx + 8, fy - 6, 12, 6);
  px(ctx, '#16a34a', fx + 6, fy - 10, 16, 5);
}

function drawWaterCooler(ctx) {
  const wx = 27 * TILE + 6;
  const wy = 10 * TILE - 6;

  px(ctx, '#e2e8f0', wx, wy + 16, 20, 24);
  px(ctx, '#94a3b8', wx + 2, wy + 20, 16, 8);
  px(ctx, '#ef4444', wx + 5, wy + 21, 3, 3);
  px(ctx, '#3b82f6', wx + 12, wy + 21, 3, 3);

  px(ctx, '#38bdf8', wx + 2, wy, 16, 16);
  px(ctx, '#7dd3fc', wx + 4, wy + 2, 12, 12);
  px(ctx, '#bae6fd', wx + 6, wy + 4, 4, 8);
}

function drawBarTable(ctx) {
  const bx = 22 * TILE;
  const by = 11 * TILE + 4;
  const bw = 3 * TILE; // 96 px

  px(ctx, '#181a20', bx + 6, by + 14, 4, 14);
  px(ctx, '#181a20', bx + bw - 10, by + 14, 4, 14);
  px(ctx, '#222630', bx + 6, by + 22, bw - 16, 2);

  px(ctx, '#a16207', bx, by, bw, 14);
  px(ctx, '#b45309', bx, by + 12, bw, 3);
  px(ctx, '#ca8a04', bx + 2, by + 1, bw - 4, 8);

  px(ctx, '#bae6fd', bx + 24, by + 2, 4, 6);
  px(ctx, '#fca5a5', bx + 56, by + 2, 4, 6);
}

function drawStool(ctx, tx, ty) {
  const sx = tx * TILE + 8;
  const sy = ty * TILE + 2;

  px(ctx, '#181a20', sx + 2, sy + 10, 2, 12);
  px(ctx, '#181a20', sx + 12, sy + 10, 2, 12);
  px(ctx, '#272b34', sx + 2, sy + 16, 12, 2);

  px(ctx, '#b45309', sx, sy, 16, 8);
  px(ctx, '#d97706', sx + 2, sy + 1, 12, 5);
}

// --- SUNUCU DOLAPLARI (SERVER RACKS) ---
// --- BİTKİLER & ÇÖP KUTUSU ---
function drawPlant(ctx, tx, ty) {
  const x = tx * TILE;
  const y = ty * TILE;
  // Saksı
  px(ctx, '#b45309', x + 9, y + 20, 14, 10);
  px(ctx, '#92400e', x + 8, y + 19, 16, 3);
  px(ctx, '#78350f', x + 10, y + 28, 12, 2);
  // Yapraklar: koyu → açık kümeler (monstera)
  const leaf = (cx, cy, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  leaf(x + 9, y + 13, 7, 5, '#166534');
  leaf(x + 23, y + 12, 7, 5, '#166534');
  leaf(x + 16, y + 8, 7, 7, '#15803d');
  leaf(x + 11, y + 6, 5, 4, '#16a34a');
  leaf(x + 21, y + 5, 5, 4, '#16a34a');
  leaf(x + 16, y + 3, 4, 3, '#22c55e');
  px(ctx, '#14532d', x + 15, y + 12, 2, 8); // sap
}

function drawTrash(ctx, tx, ty) {
  const x = tx * TILE + 6;
  const y = ty * TILE + 6;

  px(ctx, '#475569', x, y + 2, 20, 20);
  px(ctx, '#334155', x + 2, y + 4, 16, 16);
  px(ctx, '#f8fafc', x + 5, y + 7, 5, 5);
  px(ctx, '#fde047', x + 11, y + 6, 5, 5);
  px(ctx, '#e2e8f0', x + 8, y + 12, 6, 5);
}

// --- MONİTÖR EKRANI ---
function drawScreen(ctx, x, y, activity, t, seed) {
  const sw = 28;
  const sh = 18;
  if (!activity) {
    px(ctx, '#14171f', x, y, sw, sh);
    return;
  }
  const tick = Math.floor(t / 600) + seed;
  if (activity === 'code' || activity === 'read') {
    px(ctx, '#1e1b2e', x, y, sw, sh);
    const cols = ['#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f472b6'];
    for (let l = 0; l < 6; l++) {
      const w = 4 + ((tick + l * 5) % 7) * 2;
      px(ctx, cols[(l + seed) % cols.length], x + 2 + (l % 3) * 2, y + 2 + l * 2.5, Math.min(w, sw - 6), 1);
    }
  } else if (activity === 'terminal' || activity === 'tool') {
    px(ctx, '#05070a', x, y, sw, sh);
    for (let l = 0; l < 5; l++) {
      px(ctx, '#22c55e', x + 2, y + 2 + l * 3, 4 + ((tick + l * 3) % 9) * 2, 1);
    }
    if (tick % 2) px(ctx, '#86efac', x + 2, y + 14, 3, 2);
  } else if (activity === 'browser') {
    px(ctx, '#f8fafc', x, y, sw, sh);
    px(ctx, '#3b82f6', x, y, sw, 3);
    for (let l = 0; l < 3; l++) {
      px(ctx, '#cbd5e1', x + 3, y + 6 + l * 3, 18 - ((tick + l) % 4) * 2, 1);
    }
  } else if (activity === 'thinking') {
    px(ctx, '#1e293b', x, y, sw, sh);
    for (let i = 0; i < 3; i++) {
      px(ctx, i === tick % 3 ? '#e2e8f0' : '#475569', x + 7 + i * 5, y + 8, 3, 3);
    }
  } else if (activity === 'waiting') {
    px(ctx, Math.floor(t / 400) % 2 ? '#78350f' : '#b45309', x, y, sw, sh);
    px(ctx, '#fef3c7', x + 13, y + 3, 3, 8);
    px(ctx, '#fef3c7', x + 13, y + 13, 3, 2);
  } else {
    px(ctx, '#14171f', x, y, sw, sh);
  }
}

// --- MASALAR (DESKS) ---
function drawDesk(ctx, d, occupant, t, i) {
  const mx = (d.x - 1) * TILE;
  const my = d.y * TILE;
  const mw = 3 * TILE;

  // Ahşap masa tablası
  px(ctx, '#936338', mx + 2, my + 4, mw - 4, 22);
  px(ctx, '#a87343', mx + 4, my + 5, mw - 8, 12);
  px(ctx, '#6e4421', mx + 2, my + 24, mw - 4, 6);

  // Metal ayaklar
  px(ctx, '#181a20', mx + 4, my + 28, 4, 6);
  px(ctx, '#181a20', mx + mw - 8, my + 28, 4, 6);

  // Kule tipi bilgisayar kasası (Tower PC)
  const pcX = mx + mw - 20;
  const pcY = my + 2;
  px(ctx, '#161920', pcX, pcY, 14, 22);
  px(ctx, '#282d3b', pcX + 1, pcY + 1, 12, 20);
  const rgbCols = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];
  const rgbCol = rgbCols[Math.floor(t / 2400 + i) % rgbCols.length];
  px(ctx, rgbCol, pcX + 4, pcY + 6, 6, 6);

  if (d.face === 'up') {
    // face === 'up': Sandalye masanın altında (y+1), monitör EKRANI izleyiciye dönük
    const monX = mx + 32;
    const monY = my - 12;

    px(ctx, '#1c1f26', monX - 1, monY - 1, 32, 22);
    px(ctx, '#52525b', monX + 14, monY + 21, 4, 4);
    px(ctx, '#3f3f46', monX + 10, monY + 24, 12, 2);

    drawScreen(ctx, monX + 1, monY + 1, occupant?.activity, t, i * 3);

    // Çift monitör hissi: İkinci açılı monitör
    px(ctx, '#181a20', monX - 18, monY + 2, 15, 18);
    px(ctx, '#222836', monX - 17, monY + 3, 13, 16);
    px(ctx, '#3b82f6', monX - 15, monY + 6, 8, 1);
    px(ctx, '#64748b', monX - 15, monY + 9, 9, 1);

    // Klavye
    px(ctx, '#27272a', mx + 36, my + 15, 24, 6);
    px(ctx, '#e4e4e7', mx + 37, my + 16, 22, 4);

    // Fare & Mousepad
    px(ctx, '#18181b', mx + 63, my + 15, 8, 8);
    px(ctx, '#3f3f46', mx + 65, my + 17, 4, 4);

    // Kahve kupası
    px(ctx, '#f8fafc', mx + 73, my + 12, 5, 5);
    px(ctx, '#451a03', mx + 74, my + 13, 3, 3);

    // Köşe Masası Lambası (sağ üst masa index 9: x=24, y=4)
    if (i === 9) {
      px(ctx, '#1e293b', mx + 10, my + 10, 8, 3);
      px(ctx, '#334155', mx + 13, my + 3, 2, 8);
      px(ctx, '#2563eb', mx + 8, my - 2, 12, 6);
      px(ctx, '#fef08a', mx + 11, my + 4, 6, 2);
    }

    // Sandalye masanın önünde
    const cx = d.chair[0] * TILE + 6;
    const cy = d.chair[1] * TILE + 6;
    px(ctx, '#181a20', cx, cy + 4, 20, 16);
    px(ctx, '#27272a', cx + 2, cy + 6, 16, 12);
    px(ctx, '#3f3f46', cx + 6, cy + 18, 8, 4);
  } else {
    // face === 'down': Sandalye masanın üstünde (y-1), monitörün ARKASI bize dönük
    const monX = mx + 32;
    const monY = my - 8;

    px(ctx, '#262a34', monX, monY, 32, 20);
    px(ctx, '#1a1d24', monX + 1, monY + 1, 30, 18);
    px(ctx, '#52525b', monX + 12, monY + 6, 8, 8);
    px(ctx, '#71717a', monX + 14, monY + 14, 4, 10);
    px(ctx, '#3f3f46', monX + 10, monY + 23, 12, 2);

    // Yan monitör arkası
    px(ctx, '#222630', monX - 18, monY + 3, 15, 17);
    px(ctx, '#181a22', monX - 17, monY + 4, 13, 15);

    // Masanın ön yüzü
    px(ctx, '#27272a', mx + 38, my + 17, 22, 5);
    px(ctx, '#f8fafc', mx + 68, my + 14, 5, 5);

    // Sandalye masanın arkasındadır (y-1)
    const cx = d.chair[0] * TILE + 7;
    const cy = d.chair[1] * TILE + 10;
    px(ctx, '#181a20', cx, cy, 18, 14);
  }
}

// --- GECE AYDINLATMASI ---
function drawLight(ctx, light, busyDesks, t) {
  if (light >= 1) return;
  const key = `${Math.round(light * 40)}:${busyDesks.map((d) => `${d.x},${d.y}`).join('|')}`;
  if (!lightCache || lightCache.key !== key) {
    const [c, cx] = offscreen(W, H);
    drawLightLayer(cx, light, busyDesks);
    lightCache = { canvas: c, key };
  }
  // Karartma katmanı normal, ışıklar 'lighter': ikisi ayrı tuvallerde.
  ctx.drawImage(lightCache.canvas, 0, 0);
}

function drawLightLayer(ctx, light, busyDesks) {
  const dark = (1 - light) * 0.65;
  ctx.fillStyle = `rgba(10, 14, 26, ${dark})`;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'lighter';
  const a = (1 - light);

  const glow = (x, y, r, c) => {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  const lamps = [136, 274, 474, 644, 784];
  for (const lx of lamps) {
    glow(lx, 50, 80, `rgba(254, 240, 138, ${0.45 * a})`);
  }

  // "CODE & CHILL" neon tabela parıltısı
  glow(14 * TILE + 70, 196, 95, `rgba(244, 63, 94, ${0.55 * a})`);
  glow(14 * TILE + 80, 210, 100, `rgba(6, 182, 212, ${0.6 * a})`);

  // Çalışan monitörler
  for (const d of busyDesks) {
    glow(d.x * TILE + 16, d.y * TILE, 50, `rgba(147, 197, 253, ${0.35 * a})`);
  }

  // Köşe masa lambası
  glow(24 * TILE + 16, 4 * TILE + 12, 65, `rgba(254, 240, 138, ${0.55 * a})`);

  ctx.globalCompositeOperation = 'source-over';
}

// --- ÖNBELLEK ---
// Değişmeyen katmanlar ayrı tuvallere bir kez çizilir; her karede yalnızca drawImage yapılır.
const bakedItems = new Map(); // ad → { canvas, x, y }
let bgCache = null;           // { canvas, key }
let lightCache = null;        // { canvas, key }

function offscreen(w, h) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  return [c, cx];
}

/** Sabit bir öğeyi tam boy tuvale çizer, dolu alanına kırpar, saklar. */
function baked(name, draw) {
  let b = bakedItems.get(name);
  if (!b) {
    const [full, fctx] = offscreen(W, H);
    draw(fctx);
    const data = fctx.getImageData(0, 0, W, H).data;
    let x0 = W; let y0 = H; let x1 = -1; let y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) { b = { canvas: null, x: 0, y: 0 }; } else {
      const [crop, cctx] = offscreen(x1 - x0 + 1, y1 - y0 + 1);
      cctx.drawImage(full, -x0, -y0);
      b = { canvas: crop, x: x0, y: y0 };
    }
    bakedItems.set(name, b);
  }
  return (ctx) => { if (b.canvas) ctx.drawImage(b.canvas, b.x, b.y); };
}

function background(ctx, light, t) {
  // Gökyüzü ışığa ve dakikaya göre değişir; o zaman yeniden çizilir.
  const key = `${Math.round(light * 40)}:${Math.floor(t / 60_000)}`;
  if (!bgCache || bgCache.key !== key) {
    const [c, cx] = offscreen(W, H);
    drawBricks(cx, 0, 0, W, 3 * TILE);
    drawWindows(cx, light, t);
    drawPipesAndPillars(cx);
    drawPendantLights(cx);
    drawFloor(cx);
    drawRug(cx);
    bgCache = { canvas: c, key };
  }
  ctx.drawImage(bgCache.canvas, 0, 0);
}

// --- DÜNYAYI ÇİZ (WORLD RENDERER) ---
export function drawWorld(ctx, { t, counts, actors, pack, light, selectedKey }) {
  ctx.imageSmoothingEnabled = false;

  // 1. Statik Arka Plan (önbellekten) + pano/saat (canlı)
  background(ctx, light, t);
  drawBoardAndClock(ctx, t, counts);

  const byDesk = new Map();
  for (const a of actors) {
    if (a.agent.place === 'desk' || a.agent.activity === 'waiting') {
      if (a.agent.desk != null) byDesk.set(a.agent.desk, a.agent);
    }
  }

  // 2. Z-Sıralı Öğeler
  const items = [];

  // Tuğla Bölme Duvarı ve Neon Tabela (y=7)
  items.push({
    y: 7.1,
    draw: () => baked('partition', (c) => drawBrickPartitionAndNeon(c, 0))(ctx),
  });

  // Mutfak Tezgâhı
  items.push({
    y: 8.4,
    draw: () => baked('counter', (c) => drawKitchenCounter(c))(ctx),
  });

  // Buzdolabı
  items.push({
    y: 8.8,
    draw: () => baked('fridge', (c) => drawFridge(c))(ctx),
  });

  // Kanepe
  items.push({
    y: 8.2,
    draw: () => baked('sofa', (c) => drawSofa(c))(ctx),
  });

  // Su Sebili
  items.push({
    y: 10.5,
    draw: () => baked('cooler', (c) => drawWaterCooler(c))(ctx),
  });

  // Sehpa
  items.push({
    y: 10.4,
    draw: () => baked('table', (c) => drawCoffeeTable(c))(ctx),
  });

  // Tekli Koltuklar
  items.push({ y: 10.3, draw: () => baked('arm-14-10', (c) => drawArmchair(c, 14, 10, 'right'))(ctx) });
  items.push({ y: 10.3, draw: () => baked('arm-19-10', (c) => drawArmchair(c, 19, 10, 'left'))(ctx) });
  items.push({ y: 12.3, draw: () => baked('arm-15-12', (c) => drawArmchair(c, 15, 12, 'up'))(ctx) });
  items.push({ y: 12.3, draw: () => baked('arm-18-12', (c) => drawArmchair(c, 18, 12, 'up'))(ctx) });

  // Bar Masası
  items.push({
    y: 11.5,
    draw: () => baked('bar', (c) => drawBarTable(c))(ctx),
  });

  // Bar Tabureleri
  items.push({
    y: 12.2,
    draw: () => baked('stools', (c) => { drawStool(c, 22, 12); drawStool(c, 23, 12); drawStool(c, 24, 12); })(ctx),
  });

  // Saksı Bitkileri
  items.push({ y: 7.5, draw: () => baked('plant-13-7', (c) => drawPlant(c, 13, 7))(ctx) });
  items.push({ y: 4.5, draw: () => baked('plant-1-4', (c) => drawPlant(c, 1, 4))(ctx) });
  items.push({ y: 13.5, draw: () => baked('plant-26-13', (c) => drawPlant(c, 26, 13))(ctx) });
  items.push({ y: 14.5, draw: () => baked('plant-21-14', (c) => drawPlant(c, 21, 14))(ctx) });
  items.push({ y: 3.5, draw: () => baked('plant-12-3', (c) => drawPlant(c, 12, 3))(ctx) });

  // Çöp Kutusu
  items.push({ y: 14.4, draw: () => baked('trash', (c) => drawTrash(c, 11, 14))(ctx) });
  // Sunucuların yerinde bitkiler
  items.push({ y: 12.5, draw: () => baked('plant-1-12', (c) => drawPlant(c, 1, 12))(ctx) });
  items.push({ y: 14.5, draw: () => baked('plant-1-14', (c) => drawPlant(c, 1, 14))(ctx) });

  // Masalar:
  LAYOUT.desks.forEach((d, i) => {
    items.push({
      y: d.y + 0.5,
      draw: () => drawDesk(ctx, d, byDesk.get(i), t, i),
    });
  });

  // Karakterler
  for (const a of actors) {
    items.push({
      y: a.actor.y + 0.6,
      draw: () => {
        const seated = a.actor.arrived && (a.agent.place === 'desk' || a.agent.place === 'lounge');
        const typing = seated && a.agent.place === 'desk' && a.agent.activity !== 'thinking';
        const bob = typing && Math.floor(t / 400 + a.seed) % 2 ? 1 : 0;
        const frame = a.actor.walking ? 1 + (Math.floor(a.actor.step / 110) % 5) : 0;
        const x = a.actor.x * TILE;
        const y = a.actor.y * TILE - (seated ? 8 : 12) + bob;

        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(Math.round(x + 9), Math.round(a.actor.y * TILE + 18), 14, 3);

        drawCharacter(ctx, pack, a.look, x, y, a.actor.dir, frame);

        if (a.agent.key === selectedKey) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(x) + 6.5, Math.round(y) + 2.5, 19, 30);
        }
      },
    });
  }

  items.sort((p, q) => p.y - q.y).forEach((it) => it.draw());

  // 3. Gece Aydınlatması
  drawLight(ctx, light, [...byDesk.keys()].map((i) => LAYOUT.desks[i]), t);
}

// --- ETİKETLER (LABELS) ---
/** Dinlenme köşesi sohbet balonları (src/chatter.js → Map<key, { text }>). */
function drawChatter(ctx, { actors, scale, ox, oy, chatter }) {
  if (!chatter) return;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  const placed = []; // çakışan balon çizilmez
  for (const a of actors) {
    const c = chatter.get(a.agent.key);
    if (!c || !a.actor.arrived) continue;
    const cx = ox + (a.actor.x * TILE + 16) * scale;
    const top = oy + (a.actor.y * TILE - 30) * scale;
    const bw = ctx.measureText(c.text).width + 14;
    const x = Math.round(cx - bw / 2); const y = Math.round(top - 26);
    if (placed.some((r) => x < r.x + r.w + 4 && r.x < x + bw + 4 && y < r.y + 30 && r.y < y + 30)) continue;
    placed.push({ x, y, w: bw });
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.roundRect(x, y, bw, 20, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 4, y + 20); ctx.lineTo(cx + 4, y + 20); ctx.lineTo(cx, y + 26); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.fillText(c.text, x + 7, y + 10.5);
  }
}

export function drawLabels(ctx, { actors, scale, ox, oy, t, selectedKey, hoveredKey, chatter }) {
  drawChatter(ctx, { actors, scale, ox, oy, chatter });
  ctx.textBaseline = 'middle';
  const placed = []; // çizilen etiket kutuları: çakışan etiket yukarı kayar
  for (const a of [...actors].sort((p, q) => q.actor.y - p.actor.y)) {
    // Boştaki (henüz iş almamış) ajanların etiketi yalnız üzerine gelince ya da seçiliyken.
    if (a.agent.activity === 'idle' && a.agent.key !== selectedKey && a.agent.key !== hoveredKey) continue;
    const cx = ox + (a.actor.x * TILE + 16) * scale;
    const top = oy + (a.actor.y * TILE - 14) * scale;
    const name = a.agent.name.length > 22 ? `${a.agent.name.slice(0, 21)}…` : a.agent.name;

    ctx.font = '600 12px "Segoe UI", sans-serif';
    const n = ctx.measureText(name).width;
    ctx.font = '12px "Segoe UI", sans-serif';
    const act = a.agent.key === selectedKey || a.agent.activity === 'waiting' || a.agent.place !== 'desk' ? a.agent.label : '';
    const w = 22 + n + (act ? 6 + ctx.measureText(act).width : 0) + 10;
    const x = Math.round(cx - w / 2);
    let y = Math.round(top - 14);
    for (let k = 0; k < 6 && placed.some((b) => x < b.x + b.w + 4 && b.x < x + w + 4 && y < b.y + 22 && b.y < y + 22); k++) y -= 22;
    placed.push({ x, y, w });

    ctx.fillStyle = 'rgba(17, 20, 28, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 20, 10);
    ctx.fill();

    ctx.fillStyle = a.agent.color ?? AGENT_COLORS[a.agent.agent] ?? '#94a3b8';
    ctx.beginPath();
    ctx.arc(x + 11, y + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(name, x + 20, y + 10.5);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = a.agent.activity === 'waiting' ? '#fbbf24' : '#94a3b8';
    ctx.fillText(act, x + 26 + n, y + 10.5);

    if (a.agent.activity === 'waiting' && Math.floor(t / 450) % 2) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, y - 14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 14px "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText('!', cx, y - 13);
      ctx.textAlign = 'left';
    }


  }
}
