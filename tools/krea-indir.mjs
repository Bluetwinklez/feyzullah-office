#!/usr/bin/env node
// Krea çıktısını indirir: node krea-indir.mjs <https://app-uploads.krea.ai/...|https://gen.krea.ai/...> <hedef-dosya>
// Claude uzmanlarının izin kurallarında "curl https://..." biçimi çalışmadığı için (adresteki ':' kuralı bozar)
// `node` ile çalışan bu araç kullanılır. Yalnız Krea sunucuları ve yalnız çalışma klasörünün içi.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

export const IZINLI = new Set(['app-uploads.krea.ai', 'gen.krea.ai']);

/** Adres ve hedefi denetler; uygunsa { url, hedef } döner, değilse hata fırlatır. */
export function denetle(adres, hedef, kok = process.cwd()) {
  let u;
  try { u = new URL(adres); } catch { throw new Error('geçersiz adres'); }
  if (u.protocol !== 'https:' || !IZINLI.has(u.hostname)) throw new Error(`yalnız Krea adresleri: ${[...IZINLI].join(', ')}`);
  if (!hedef) throw new Error('hedef dosya yolu gerekli');
  const tam = resolve(kok, hedef);
  const rel = relative(resolve(kok), tam);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('hedef çalışma klasörünün içinde olmalı');
  return { url: u.href, hedef: tam };
}

export async function indir(adres, hedef, { kok = process.cwd(), fetchImpl = fetch } = {}) {
  const d = denetle(adres, hedef, kok);
  const res = await fetchImpl(d.url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`indirilemedi: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(d.hedef), { recursive: true });
  await writeFile(d.hedef, buf);
  return { hedef: d.hedef, bayt: buf.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [adres, hedef] = process.argv.slice(2);
  indir(adres, hedef).then((r) => console.log(`indirildi: ${r.hedef} (${r.bayt} bayt)`)).catch((e) => { console.error(`HATA: ${e.message}`); process.exit(1); });
}
