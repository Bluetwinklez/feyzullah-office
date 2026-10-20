// Görev başına git çalışma ağacı: hazırla (ofis/<kart> dalı), birleştir, kaldır, eskileri temizle.
// Ağaçlar ~/.feyzullah/ofis-work/worktrees altında; kullanıcının çalışma kopyasına yalnız "birleştir" dokunur.
import { execFile, spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

export const git = (args, cwd) => new Promise((res) => execFile('git', args, { cwd, windowsHide: true, timeout: 30_000 }, (err, out, errOut) => res(err ? { ok: false, out: String(out).trim(), err: String(errOut || err.message).trim() } : { ok: true, out: String(out).trim() })));

/** cwd bir git deposundaysa ayrı ağaç + dal açar: { cwd, branch, repo, worktree } | null. */
export async function prepareWorktree(cwd, id, root) {
  const top = await git(['rev-parse', '--show-toplevel'], cwd);
  if (!top.ok) return null;
  const repo = top.out;
  if (!(await git(['rev-parse', '--verify', 'HEAD'], repo)).ok) return null; // hiç commit yok
  // Alt klasör git'ten alınır (Windows kısa yol adları relative()'i şaşırtır).
  const rel = (await git(['rev-parse', '--show-prefix'], cwd)).out.replace(/[\/]+$/, '');
  const worktree = join(root, `${basename(repo)}-${id}`);
  const branch = `ofis/${id}`;
  if (!(await git(['worktree', 'add', '-b', branch, worktree, 'HEAD'], repo)).ok) return null;
  return { cwd: rel ? join(worktree, rel) : worktree, branch, repo, worktree };
}

/** Ağaçtaki commit'lenmemiş değişiklikleri dala kaydeder (uzman commit etmediyse iş kaybolmasın). */
export async function commitAll(worktree, message) {
  const st = await git(['status', '--porcelain'], worktree);
  if (!st.ok) return { ok: false, error: st.err };
  if (!st.out) return { ok: true, committed: false };
  const staged = await git(['add', '-A'], worktree);
  if (!staged.ok) return { ok: false, error: staged.err };
  const c = await git(['-c', 'user.name=Feyzullah Ofis', '-c', 'user.email=ofis@localhost', 'commit', '-m', message], worktree);
  return c.ok ? { ok: true, committed: true } : { ok: false, error: c.err };
}

/** Dalı kullanıcının o anki dalına birleştirir; çalışma kopyası temiz değilse ya da çakışma olursa dokunmaz. */
export async function mergeWorktree({ repo, worktree, branch, title }) {
  if (!repo || !branch) return { ok: false, error: 'bu görevin git dalı yok' };
  const saved = worktree && existsSync(worktree) ? await commitAll(worktree, `ofis: ${title ?? branch}`) : { ok: true };
  if (!saved.ok) return { ok: false, error: `dal kaydedilemedi: ${saved.error}` };
  const dirty = await git(['status', '--porcelain', '--untracked-files=no'], repo);
  if (!dirty.ok) return { ok: false, error: dirty.err };
  if (dirty.out) return { ok: false, error: 'depoda commit edilmemiş değişiklik var; önce onları commit et' };
  const m = await git(['-c', 'user.name=Feyzullah Ofis', '-c', 'user.email=ofis@localhost', 'merge', '--no-ff', '-m', `Ofis: ${title ?? branch} (${branch})`, branch], repo);
  if (!m.ok) { await git(['merge', '--abort'], repo); return { ok: false, error: 'çakışma var, birleştirme geri alındı; dalı elle birleştir' }; }
  const head = await git(['rev-parse', '--short', 'HEAD'], repo);
  if (!head.ok) return { ok: false, error: head.err };
  const cleanup = await removeWorktree({ repo, worktree, branch, deleteBranch: true });
  return { ok: true, commit: head.out, ...(cleanup.ok ? {} : { cleanupError: cleanup.error, worktree }) };
}

/** Ağacı kaldırır; deleteBranch: dal da silinir (yalnız birleştirildiyse ya da kullanıcı "at" dediyse). */
export async function removeWorktree({ repo, worktree, branch, deleteBranch = false, force = false }) {
  if (worktree && existsSync(worktree)) {
    const removed = await git(['worktree', 'remove', ...(force ? ['--force'] : []), worktree], repo);
    if (!removed.ok) return { ok: false, error: removed.err };
  }
  const pruned = await git(['worktree', 'prune'], repo);
  if (!pruned.ok) return { ok: false, error: pruned.err };
  if (deleteBranch && branch) {
    const deleted = await git(['branch', force ? '-D' : '-d', branch], repo);
    if (!deleted.ok) return { ok: false, error: deleted.err };
  }
  return { ok: true };
}

/** maxAgeMs'den eski ağaçlar: değişiklikler dala kaydedilir, ağaç kaldırılır (dal kalır, iş kaybolmaz). */
export async function cleanupWorktrees(root, maxAgeMs = 7 * 86_400_000, now = Date.now(), keep = new Set()) {
  const removed = [];
  for (const name of await readdir(root).catch(() => [])) {
    const wt = join(root, name);
    const s = await stat(wt).catch(() => null);
    if (!s?.isDirectory() || now - s.mtimeMs < maxAgeMs || keep.has(wt.toLowerCase())) continue; // süren görevlerin ağacı korunur
    const common = await git(['rev-parse', '--path-format=absolute', '--git-common-dir'], wt);
    if (!common.ok) continue;
    const repo = common.out.replace(/[\\/]\.git$/, '');
    const saved = await commitAll(wt, 'ofis: eski çalışma ağacı kaydedildi');
    if (!saved.ok) continue;
    const removedTree = await removeWorktree({ repo, worktree: wt });
    if (removedTree.ok) removed.push(name);
  }
  return removed;
}

/**
 * Aynı komutun (grup) aynı depodaki görevleri tek ağaç + dalı paylaşır: sırayla çalışan uzmanlar birbirinin
 * dosyasını görür, sonunda tek birleştirme olur. Dönüş: (cwd, group) → { cwd, branch, repo, worktree } | null
 */
export function sharedPreparer(root) {
  const cache = new Map();
  return async (cwd, group) => {
    const top = await git(['rev-parse', '--show-toplevel'], cwd);
    if (!top.ok) return null;
    const key = `${group}|${top.out.toLowerCase()}`;
    if (!cache.has(key)) cache.set(key, prepareWorktree(top.out, group, root));
    const p = await cache.get(key);
    if (!p) { cache.delete(key); return null; }
    const rel = (await git(['rev-parse', '--show-prefix'], cwd)).out.replace(/[\/]+$/, '');
    return { ...p, cwd: rel ? join(p.worktree, rel) : p.worktree };
  };
}

/** Birleştirmeden önce bakmak için: kaydedilmemişler dahil dalın, ayrıldığı noktaya göre özeti ve farkı. */
export async function branchDiff({ repo, worktree, branch }, max = 200_000) {
  if (!repo || !branch) return { ok: false, error: 'git dalı yok' };
  if (worktree && existsSync(worktree)) {
    const saved = await commitAll(worktree, 'ofis: inceleme öncesi kayıt');
    if (!saved.ok) return { ok: false, error: `dal kaydedilemedi: ${saved.error}` };
  }
  const base = await git(['merge-base', 'HEAD', branch], repo);
  if (!base.ok) return { ok: false, error: 'dal bulunamadı' };
  const stat = await git(['diff', '--stat', `${base.out}..${branch}`], repo);
  const diff = await git(['diff', `${base.out}..${branch}`], repo);
  if (!diff.ok) return { ok: false, error: diff.err };
  return { ok: true, stat: stat.out, diff: diff.out.length > max ? `${diff.out.slice(0, max)}
… (kırpıldı)` : diff.out };
}

/** Birleştirmeyi geri alır: yeni bir "Revert" commit'i (geçmiş silinmez). Depo temiz olmalı. */
export async function revertMerge({ repo, commit }) {
  if (!repo || !commit) return { ok: false, error: 'birleştirme kaydı yok' };
  const dirty = await git(['status', '--porcelain', '--untracked-files=no'], repo);
  if (!dirty.ok) return { ok: false, error: dirty.err };
  if (dirty.out) return { ok: false, error: 'depoda commit edilmemiş değişiklik var; önce onları commit et' };
  const r = await git(['-c', 'user.name=Feyzullah Ofis', '-c', 'user.email=ofis@localhost', 'revert', '-m', '1', '--no-edit', commit], repo);
  if (!r.ok) { await git(['revert', '--abort'], repo); return { ok: false, error: `geri alınamadı: ${r.err.slice(0, 200)}` }; }
  return { ok: true };
}

/**
 * Birleştirme sonrası test: package.json'da test betiği varsa (gerekirse önce npm install) npm test çalışır.
 * Dönüş: { ran, ok, tail } — tail: çıktının son satırları.
 */
export async function runProjectTests(dir, { timeoutMs = 5 * 60_000 } = {}) {
  let pkg;
  try { pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')); } catch { return { ran: false }; }
  if (!pkg?.scripts?.test || /no test specified/.test(pkg.scripts.test)) return { ran: false };
  const run = (args) => new Promise((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: dir, shell: process.platform === 'win32', windowsHide: true, detached: process.platform !== 'win32' });
    let out = '';
    let timedOut = false;
    const add = (c) => { out = (out + c).slice(-6000); };
    child.stdout.on('data', add); child.stderr.on('data', add);
    const timer = setTimeout(() => {
      timedOut = true;
      add('\n(zaman aşımı)');
      if (process.platform === 'win32' && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      else {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
      }
    }, timeoutMs);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: timedOut ? -1 : code, out }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out: e.message }); });
  });
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  if (deps.length && !existsSync(join(dir, 'node_modules'))) {
    const i = await run(['install', '--no-audit', '--no-fund']);
    if (i.code !== 0) return { ran: true, ok: false, tail: `npm install başarısız:\n${i.out.split('\n').slice(-15).join('\n')}` };
  }
  const t = await run(['test']);
  return { ran: true, ok: t.code === 0, tail: t.out.split('\n').slice(-20).join('\n').trim() };
}

/**
 * Çalışma kopyası diskte yoksa dalın akıbetini git'ten okur (Ofis dışında birleştirme/silme için pano eşitlemesi).
 * Kopya duruyorsa null; yoksa kart için alanlar: birleştirildi / atıldı / yalnız kopya düştü.
 */
export async function worktreeFate({ repo, branch, worktree }) {
  if (!repo || !branch || !worktree || existsSync(worktree)) return null;
  const ref = `refs/heads/${branch}`;
  if ((await git(['rev-parse', '--verify', '--quiet', ref], repo)).ok) {
    const merged = (await git(['merge-base', '--is-ancestor', ref, 'HEAD'], repo)).ok;
    // Fast-forward ya da harici birleştirmede HEAD'in geri alınacak Ofis merge'i olduğu varsayılmaz.
    return merged ? { merged: true, worktree: null, mergeCommit: null } : { worktree: null };
  }
  const m = await git(['log', '-F', `--grep=(${branch})`, '--merges', '--format=%h', '-1'], repo);
  if (m.ok && m.out) return { merged: true, worktree: null, mergeCommit: m.out };
  return { discarded: true, worktree: null };
}
