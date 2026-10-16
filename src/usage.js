// Kullanım limitleri: Claude (claude -p stream-json'daki rate_limit_event) ve Codex (~/.codex/sessions
// rollout dosyalarındaki rate_limits). Değerler 0..1 kesir, sıfırlanma zamanı ms.
import { open, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const win = (used, resetsAt) => (Number.isFinite(used) ? { used, resetsAt: resetsAt ? resetsAt * 1000 : null } : null);

/** claude stream-json `rate_limit_event.rate_limit_info` → { fiveHour, week, at } */
export function claudeFromEvent(info, at = Date.now()) {
  if (!info || typeof info !== 'object') return null;
  const w = info.unifiedWindows;
  if (w) return { fiveHour: win(w.five_hour?.utilization, w.five_hour?.resetsAt), week: win(w.seven_day?.utilization, w.seven_day?.resetsAt), at };
  const one = win(info.utilization, info.resetsAt);
  return { fiveHour: info.rateLimitType === 'five_hour' ? one : null, week: info.rateLimitType === 'seven_day' ? one : null, at };
}

/** Codex `rate_limits` → { fiveHour, week, at } (primary 5 saat, secondary hafta). */
export function codexFromRateLimits(rl, at = Date.now()) {
  if (!rl || typeof rl !== 'object') return null;
  const pct = (x) => (Number.isFinite(x?.used_percent) ? Math.round(x.used_percent * 100) / 10000 : NaN);
  return { fiveHour: win(pct(rl.primary), rl.primary?.resets_at), week: win(pct(rl.secondary), rl.secondary?.resets_at), at };
}

/** Klasördeki alt klasör/dosyaları adına göre büyükten küçüğe (YYYY/MM/DD düzeni). */
const desc = async (d) => (await readdir(d, { withFileTypes: true }).catch(() => [])).sort((a, b) => b.name.localeCompare(a.name));

/** En yeni rollout dosyaları (son günlerden, değişme zamanına göre yeniden eskiye). */
async function recentRollouts(root, days = 3) {
  const out = [];
  let seenDays = 0;
  for (const y of await desc(root)) {
    if (!y.isDirectory()) continue;
    for (const m of await desc(join(root, y.name))) {
      if (!m.isDirectory()) continue;
      for (const d of await desc(join(root, y.name, m.name))) {
        if (!d.isDirectory()) continue;
        const dir = join(root, y.name, m.name, d.name);
        const files = (await desc(dir)).filter((f) => f.isFile() && /^rollout-.*\.jsonl$/.test(f.name));
        if (!files.length) continue;
        for (const f of files) out.push({ p: join(dir, f.name), t: (await stat(join(dir, f.name))).mtimeMs });
        if (++seenDays >= days) return out.sort((a, b) => b.t - a.t);
      }
    }
  }
  return out.sort((a, b) => b.t - a.t);
}

/** En yeni Codex rollout dosyasının sonundaki rate_limits. */
export async function readCodexUsage(root = join(homedir(), '.codex', 'sessions'), tail = 512 * 1024) {
  // Yeni açılmış oturumda henüz limit kaydı olmayabilir: en yeni birkaç dosyaya bakılır.
  for (const f of (await recentRollouts(root)).slice(0, 8)) {
    const u = await lastRateLimits(f, tail);
    if (u) return u;
  }
  return null;
}

async function lastRateLimits(f, tail) {
  let text;
  const h = await open(f.p, 'r');
  try {
    const { size } = await h.stat();
    const start = Math.max(0, size - tail);
    const buf = Buffer.alloc(size - start);
    await h.read(buf, 0, buf.length, start);
    text = buf.toString('utf8');
  } finally { await h.close(); }
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"rate_limits"')) continue;
    try {
      const j = JSON.parse(lines[i]);
      const rl = j.payload?.rate_limits ?? j.rate_limits;
      if (rl) return codexFromRateLimits(rl, f.t);
    } catch {}
  }
  return null;
}

/** file: Claude'un son bilinen değeri (yalnız CLI çalışınca gelir) burada saklanır. */
export async function createUsage({ file, codexRoot } = {}) {
  let claude = null;
  let codex = null;
  try { const j = JSON.parse(await readFile(file, 'utf8')); claude = j.claude ?? null; codex = j.codex ?? null; } catch {}
  let saving = Promise.resolve();
  const save = () => {
    if (!file) return saving;
    saving = saving.then(() => writeFile(`${file}.tmp`, JSON.stringify({ claude, codex })).then(() => rename(`${file}.tmp`, file))).catch(() => {});
    return saving;
  };
  return {
    noteClaude(info) { const u = claudeFromEvent(info); if (u) { claude = u; save(); } return u; },
    async refreshCodex() {
      const fresh = await readCodexUsage(codexRoot).catch(() => null);
      // Limit kaydı boş olan okuma (pencere bilgisi yok) son bilinen doğru değeri ezmez.
      if (fresh && (fresh.fiveHour || fresh.week) && (!codex || fresh.at >= codex.at)) { codex = fresh; save(); }
      return codex;
    },
    get: () => ({ claude, codex }),
    flush: () => saving,
  };
}

// Claude limitini tazelemek için en küçük sorgu: haiku, tek tur; hook'lar kapalı (köprüde/ofiste görünmez),
// oturum kaydedilmez, MCP ve beceriler yüklenmez. Limitten çok az harcar.
export const PROBE_ARGS = ['-p', '--output-format', 'stream-json', '--verbose', '--model', 'haiku', '--max-turns', '1',
  '--no-session-persistence', '--strict-mcp-config', '--disable-slash-commands', '--settings', JSON.stringify({ disableAllHooks: true })];

export async function probeClaude({ bin, spawnImpl, timeoutMs = 60_000 } = {}) {
  if (!bin) throw new Error('Claude CLI bulunamadı');
  const spawnFn = spawnImpl ?? (await import('node:child_process')).spawn;
  return new Promise((resolve, reject) => {
    const child = spawnFn(bin, PROBE_ARGS, { windowsHide: true, env: { ...process.env, FEYZULLAH_OFIS: '1' } });
    let buf = ''; let found = null;
    const timer = setTimeout(() => { child.kill(); reject(new Error('zaman aşımı')); }, timeoutMs);
    child.stdout.on('data', (c) => {
      buf += c;
      for (const line of buf.split('\n').slice(0, -1)) {
        if (!found && line.includes('"rate_limit_event"')) { try { found = JSON.parse(line).rate_limit_info ?? null; } catch {} }
      }
      buf = buf.slice(buf.lastIndexOf('\n') + 1);
    });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', () => { clearTimeout(timer); found ? resolve(found) : reject(new Error('limit bilgisi gelmedi')); });
    child.stdin.on('error', () => {});
    child.stdin.end('.');
  });
}
