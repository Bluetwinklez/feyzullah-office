// Karakter sayfasını (3 poz yan yana, şeffaf arka plan) pozlara ayırır:
//   node tools/slice-sheet.mjs <sayfa.png> <çıktı-öneki>   → <önek>-stand.png, -sitback.png, -sitfront.png
// Saydam olmayan sütun aralıkları bulunur, en geniş 3 aralık pozlar sayılır, her biri dolu alanına kırpılır,
// 360 px yüksekliğe ölçeklenir. PNG çözme/kodlama için ffmpeg kullanılır (bağımlılık yok).
import { execFileSync } from 'node:child_process';

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('kullanım: node tools/slice-sheet.mjs <sayfa.png> <çıktı-öneki>'); process.exit(2); }

const [w, h] = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src], { encoding: 'utf8' }).trim().split(',').map(Number);
const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: w * h * 4 + 1024 });
const alpha = (x, y) => raw[(y * w + x) * 4 + 3];
const TH = 40; // yarı saydam haleyi sayma

const colFilled = [];
for (let x = 0; x < w; x++) {
  let n = 0;
  for (let y = 0; y < h; y += 2) if (alpha(x, y) > TH) { n++; if (n > 3) break; }
  colFilled.push(n > 3);
}
const runs = [];
for (let x = 0; x < w; x++) {
  if (!colFilled[x]) continue;
  const s = x;
  while (x < w && colFilled[x]) x++;
  runs.push([s, x - 1]);
}
// Yakın aralıkları birleştir (kol ile gövde arası boşluk gibi)
const merged = [];
for (const r of runs) {
  const last = merged.at(-1);
  if (last && r[0] - last[1] < w * 0.03) last[1] = r[1]; else merged.push([...r]);
}
const poses = merged.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])).slice(0, 3).sort((a, b) => a[0] - b[0]);
if (poses.length !== 3) { console.error(`3 poz bulunamadı (${poses.length})`); process.exit(1); }

const names = ['stand', 'sitback', 'sitfront'];
poses.forEach(([x0, x1], i) => {
  let y0 = h; let y1 = -1;
  for (let y = 0; y < h; y++) for (let x = x0; x <= x1; x += 2) if (alpha(x, y) > TH) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; }
  const pad = 4;
  const cx = Math.max(0, x0 - pad); const cy = Math.max(0, y0 - pad);
  const cw = Math.min(w, x1 + pad) - cx; const ch = Math.min(h, y1 + pad) - cy;
  const file = `${out}-${names[i]}.png`;
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', src, '-vf', `crop=${cw}:${ch}:${cx}:${cy},scale=-1:360:flags=lanczos`, file]);
  console.log(file, `${cw}x${ch}`);
});
