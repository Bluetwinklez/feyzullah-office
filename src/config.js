// Ofis ayarları: ~/.feyzullah/ofis.json (Feyzullah'ın veri klasörü paylaşılır, dosyaları değiştirilmez).
import { readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = fileURLToPath(new URL('..', import.meta.url));
export const dataDir = () => process.env.FEYZULLAH_HOME || join(homedir(), '.feyzullah');

export const DEFAULTS = Object.freeze({
  feyzullahRoot: resolve(appRoot, '..', 'feyzullah-1'), // köprüyü başlatmak için
  bridgePort: 5185,
  hotkey: 'Control+Alt+O',
  alwaysOnTop: true,
  lat: 41.01, // İstanbul (gün doğumu/batımı için)
  lon: 28.98,
  pack: 'metrocity', // assets/packs/<ad>; yüklenemezse kodla çizilen karakterler
  theme: 'pixel', // 'pixel' (piksel ofis, düz masalar + MetroCity yürüme animasyonu) | 'real' (gerçekçi ofis + stilize karakterler)
  restMinutes: 10, // işi biten ajan dinlenme köşesinde bu kadar kalır
});

export async function loadConfig(dir = dataDir()) {
  try {
    const user = JSON.parse(await readFile(join(dir, 'ofis.json'), 'utf8'));
    return { ...DEFAULTS, ...(user && typeof user === 'object' ? user : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Arayüzden değiştirilebilen ayarlar (açık/kapalı) ve rapor saati. Başka anahtar yazılmaz. */
export const SETTING_KEYS = ['promptMaster', 'review', 'limitGuard', 'gitBranches', 'codexNetwork', 'caveman', 'notify', 'speak', 'events', 'dailyReport'];

export async function saveConfig(patch, dir = dataDir()) {
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (k === 'savedCommands') { if (!Array.isArray(v) || v.length > 30 || v.some((x) => typeof x !== 'string' || !x.trim() || x.length > 2000)) return { ok: false, error: 'kayıtlı komutlar: en fazla 30 metin' }; continue; }
    if (k === 'reportHour') { if (!Number.isInteger(v) || v < 0 || v > 23) return { ok: false, error: 'saat 0-23 olmalı' }; continue; }
    if (!SETTING_KEYS.includes(k)) return { ok: false, error: `ayar değiştirilemez: ${k}` };
    if (typeof v !== 'boolean') return { ok: false, error: `${k}: açık/kapalı olmalı` };
  }
  const file = join(dir, 'ofis.json');
  let cur = {};
  try { cur = JSON.parse(await readFile(file, 'utf8')) ?? {}; } catch {}
  const next = { ...cur, ...patch };
  await writeFile(`${file}.tmp`, JSON.stringify(next, null, 2));
  await rename(`${file}.tmp`, file);
  return { ok: true, config: next };
}
