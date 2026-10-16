// Zamanlanmış komutlar: bir komut belirli saatte ve/veya kullanım limitleri açılınca yöneticiye kendiliğinden gönderilir.
// Kayıt: ~/.feyzullah/ofis-schedule.json. Saat yerel saattir ("HH:MM"; geçmişse ertesi gün).
import { readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MAX = 20;

/** "HH:MM" → bugünün (geçtiyse yarının) o anı (ms); geçersizse null. */
export function parseAt(hhmm, now = Date.now()) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  const d = new Date(now); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Komutun gönderilme zamanı geldi mi: saat geçtiyse ve (istenmişse) hiçbir motor limitte değilse. */
export function isDue(item, { now = Date.now(), down = {}, claudeLow = false } = {}) {
  if (item.at && item.at > now) return false;
  if (item.whenLimit && (claudeLow || Object.values(down ?? {}).some((t) => t > now))) return false;
  return true;
}

async function renameRetry(from, to, tries = 6) {
  for (let i = 0; ; i++) {
    try { return await rename(from, to); } catch (err) { if (i >= tries || err.code !== 'EPERM') throw err; await new Promise((r) => setTimeout(r, 50 * (i + 1))); }
  }
}

export async function createSchedule({ dir, now = Date.now, send }) {
  const file = join(dir, 'ofis-schedule.json');
  let items = [];
  try { const j = JSON.parse(await readFile(file, 'utf8')); if (Array.isArray(j)) items = j.filter((x) => x && typeof x.text === 'string' && x.id); } catch {}
  let saving = Promise.resolve();
  const save = () => { const data = JSON.stringify(items); saving = saving.then(() => writeFile(`${file}.tmp`, data).then(() => renameRetry(`${file}.tmp`, file))).catch(() => {}); };
  let seq = 0;
  return {
    list: () => items.map((x) => ({ ...x })),
    /** { text, at?: "HH:MM", whenLimit?: bool, direct?: bool } */
    add({ text, at = null, whenLimit = false, direct = false } = {}) {
      const t = String(text ?? '').trim().slice(0, 8000);
      if (!t) return { ok: false, error: 'boş komut' };
      if (!at && !whenLimit) return { ok: false, error: 'saat ya da "limit açılınca" seç' };
      const when = at ? parseAt(at, now()) : null;
      if (at && !when) return { ok: false, error: 'saat SS:DD biçiminde olmalı' };
      if (items.length >= MAX) return { ok: false, error: `en çok ${MAX} bekleyen komut` };
      const item = { id: `z${now().toString(36)}${(++seq).toString(36)}`, text: t, at: when, whenLimit: Boolean(whenLimit), direct: Boolean(direct), createdAt: now() };
      items.push(item); save();
      return { ok: true, item };
    },
    remove(id) {
      const n = items.length;
      items = items.filter((x) => x.id !== id);
      if (items.length === n) return { ok: false, error: 'bulunamadı' };
      save(); return { ok: true };
    },
    /** Zamanı gelenleri sırayla gönderir (her biri bir kez); gönderilenleri döndürür. */
    tick({ down = {}, claudeLow = false } = {}) {
      const t = now();
      const due = items.filter((x) => isDue(x, { now: t, down, claudeLow }));
      if (!due.length) return [];
      items = items.filter((x) => !due.includes(x)); save();
      for (const x of due) send(x.text, { direct: x.direct });
      return due;
    },
    flush: () => saving,
  };
}
