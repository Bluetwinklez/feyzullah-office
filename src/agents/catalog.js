// Agency Agents kataloğu (github.com/msitarzewski/agency-agents, MIT): her uzman bir markdown dosyası
// (ön bilgi: name, description, color, emoji; gövde: kimlik/kurallar). catalog/agency-agents altına klonlanır.
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

export const CORE_TEAM = [
  'engineering-frontend-developer', 'engineering-backend-architect', 'engineering-ai-engineer', 'engineering-devops-automator',
  'design-ui-designer', 'engineering-code-reviewer', 'testing-reality-checker', 'project-manager-senior',
];

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { meta, body: text.slice(m[0].length) };
}

export async function loadCatalog(dir) {
  let divisions = {};
  try { divisions = JSON.parse(await readFile(join(dir, 'divisions.json'), 'utf8')).divisions ?? {}; } catch {}
  const agents = [];
  for (const division of Object.keys(divisions)) {
    // Bölüm kökü + bir alt klasör (ör. game-development/godot, unity, unreal-engine).
    const files = [];
    let top = [];
    try { top = await readdir(join(dir, division), { withFileTypes: true }); } catch { continue; }
    for (const e of top) {
      if (e.isFile() && e.name.endsWith('.md')) files.push(e.name);
      else if (e.isDirectory()) for (const f of await readdir(join(dir, division, e.name)).catch(() => [])) if (f.endsWith('.md')) files.push(join(e.name, f));
    }
    for (const f of files.sort()) {
      let parsed;
      try { parsed = frontmatter(await readFile(join(dir, division, f), 'utf8')); } catch { continue; }
      if (!parsed?.meta.name) continue;
      agents.push({
        id: basename(f, '.md'), division, file: join(division, f),
        name: parsed.meta.name, description: parsed.meta.description ?? '', emoji: parsed.meta.emoji ?? '',
        color: divisions[division]?.color ?? '#94a3b8',
      });
    }
  }
  return { divisions, agents };
}

// VoltAgent alt ajanları (github.com/VoltAgent/awesome-claude-code-subagents, MIT): categories/<NN-ad>/<ajan>.md.
// Kategoriler ofisin bölümlerine eşlenir; kimlik dosyası kendi kökünden (entry.root) okunur.
const VOLT_DIVISIONS = {
  '01-core-development': 'engineering', '02-language-specialists': 'engineering', '03-infrastructure': 'engineering',
  '04-quality-security': 'testing', '05-data-ai': 'engineering', '06-developer-experience': 'engineering',
  '07-specialized-domains': 'specialized', '08-business-product': 'product', '09-meta-orchestration': 'project-management',
  '10-research-analysis': 'research',
};
const VOLT_COLORS = { engineering: '#3B82F6', testing: '#EF4444', specialized: '#14B8A6', product: '#EAB308', 'project-management': '#A855F7', research: '#06B6D4' };
const title = (s) => s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export async function loadVoltCatalog(dir) {
  const agents = [];
  let cats = [];
  try { cats = (await readdir(join(dir, 'categories'))).sort(); } catch { return { divisions: {}, agents }; }
  for (const cat of cats) {
    const division = VOLT_DIVISIONS[cat] ?? 'specialized';
    let files = [];
    try { files = await readdir(join(dir, 'categories', cat)); } catch { continue; }
    for (const f of files.filter((x) => x.endsWith('.md') && x.toLowerCase() !== 'readme.md').sort()) {
      let parsed;
      try { parsed = frontmatter(await readFile(join(dir, 'categories', cat, f), 'utf8')); } catch { continue; }
      if (!parsed?.meta.name) continue;
      agents.push({
        id: `volt-${parsed.meta.name}`, division, file: join('categories', cat, f), root: dir,
        name: title(parsed.meta.name), description: parsed.meta.description ?? '', emoji: '', color: VOLT_COLORS[division] ?? '#94a3b8',
      });
    }
  }
  const divisions = Object.fromEntries([...new Set(agents.map((a) => a.division))].map((d) => [d, { label: title(d), color: VOLT_COLORS[d] ?? '#94a3b8' }]));
  return { divisions, agents };
}

/** İki katalog birleşir (aynı id'de ilk gelen kalır). */
export function mergeCatalogs(...cats) {
  const divisions = {};
  const agents = [];
  const ids = new Set();
  for (const c of cats) {
    for (const [k, v] of Object.entries(c.divisions ?? {})) divisions[k] ??= v;
    for (const a of c.agents ?? []) if (!ids.has(a.id)) { ids.add(a.id); agents.push(a); }
  }
  return { divisions, agents };
}

/** Uzmanın kimlik metni (ön bilgi olmadan). */
export async function readPersona(dir, entry) {
  const text = await readFile(join(entry.root ?? dir, entry.file), 'utf8');
  return (frontmatter(text)?.body ?? text).trim();
}

/** Uzmana göre motor: tasarım/arayüz → agy; planlama, mimari, inceleme, kontrol → Claude (beyin); geri kalan iş yükü → Codex. */
export function engineFor({ id, division }) {
  // Görsel üreten tasarım uzmanları Codex'te (Krea orada yetkili; agy'de Krea girişi yok). Arayüz kodu agy'de.
  if (division !== 'design' && /frontend|ui-|ux-|visual/.test(id)) return 'antigravity';
  // Beyin Claude: planlama, mimari, inceleme, kontrol. Asıl iş yükü Codex ve agy'de.
  if (/architect|reviewer|reality|security|incident|project-manager|product-manager|strategist|game-designer|studio-producer/.test(id) || division === 'project-management') return 'claude';
  return 'codex';
}
