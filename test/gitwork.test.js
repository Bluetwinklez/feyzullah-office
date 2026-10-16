import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanupWorktrees, git, mergeWorktree, prepareWorktree, removeWorktree } from '../src/gitwork.js';

async function repo() {
  const dir = await mkdtemp(join(tmpdir(), 'gw-'));
  const r = join(dir, 'proje');
  await mkdir(join(r, 'src'), { recursive: true });
  await git(['init', '-q', '-b', 'main'], r);
  await writeFile(join(r, 'src', 'a.txt'), 'a\n');
  await git(['add', '.'], r);
  await git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'ilk'], r);
  return { dir, r, wtRoot: join(dir, 'wt') };
}

test('git deposu değilse ya da commit yoksa ağaç açılmaz', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gw0-'));
  assert.equal(await prepareWorktree(dir, 't1', join(dir, 'wt')), null);
});

test('hazırla → uzman yazar (commit etmeden) → birleştir: değişiklik ana dala gelir, ağaç ve dal kalkar', async () => {
  const { r, wtRoot } = await repo();
  const p = await prepareWorktree(join(r, 'src'), 't1', wtRoot);
  assert.equal(p.branch, 'ofis/t1');
  assert.ok(p.cwd.endsWith(join('proje-t1', 'src')), 'alt klasör korunur');
  await writeFile(join(p.cwd, 'b.txt'), 'yeni\n');
  assert.equal(existsSync(join(r, 'src', 'b.txt')), false, 'kullanıcının kopyasına dokunulmadı');
  const m = await mergeWorktree({ ...p, title: 'b ekle' });
  assert.equal(m.ok, true);
  assert.equal((await readFile(join(r, 'src', 'b.txt'), 'utf8')).trim(), 'yeni'); // autocrlf CRLF yapabilir
  assert.equal(existsSync(p.worktree), false);
  assert.equal((await git(['branch', '--list', 'ofis/t1'], r)).out, '');
});

test('depoda commit edilmemiş değişiklik varsa birleştirmez', async () => {
  const { r, wtRoot } = await repo();
  const p = await prepareWorktree(r, 't2', wtRoot);
  await writeFile(join(p.cwd, 'c.txt'), 'c\n');
  await writeFile(join(r, 'src', 'a.txt'), 'kullanıcı değiştirdi\n');
  const m = await mergeWorktree({ ...p, title: 'c' });
  assert.equal(m.ok, false);
  assert.match(m.error, /commit edilmemiş/);
  assert.ok(existsSync(p.worktree), 'ağaç duruyor');
  await removeWorktree({ ...p, deleteBranch: true, force: true });
  assert.equal(existsSync(p.worktree), false);
});

test('eski ağaçlar temizlenir: iş dala kaydedilir, dal kalır', async () => {
  const { r, wtRoot } = await repo();
  const p = await prepareWorktree(r, 't3', wtRoot);
  await writeFile(join(p.cwd, 'd.txt'), 'd\n');
  const old = new Date(Date.now() - 10 * 86_400_000);
  await utimes(p.worktree, old, old);
  assert.deepEqual(await cleanupWorktrees(wtRoot), ['proje-t3']);
  assert.equal(existsSync(p.worktree), false);
  assert.match((await git(['show', 'ofis/t3:d.txt'], r)).out, /d/);
});

test('aynı grup aynı depoda tek ağaç/dal paylaşır; alt klasör korunur; başka grup ayrı dal', async () => {
  const { sharedPreparer } = await import('../src/gitwork.js');
  const { r, wtRoot } = await repo();
  const prep = sharedPreparer(wtRoot);
  const a = await prep(r, 'g1');
  const b = await prep(join(r, 'src'), 'g1');
  assert.equal(a.branch, 'ofis/g1');
  assert.equal(b.branch, 'ofis/g1');
  assert.equal(a.worktree, b.worktree);
  assert.ok(b.cwd.endsWith(join('proje-g1', 'src')));
  const c = await prep(r, 'g2');
  assert.equal(c.branch, 'ofis/g2');
  assert.equal(await prep(await mkdtemp(join(tmpdir(), 'nogit-')), 'g1'), null);
});

test('temizlik: korunacak (süren) ağaçlara dokunulmaz', async () => {
  const { r, wtRoot } = await repo();
  const p = await prepareWorktree(r, 't4', wtRoot);
  const old = new Date(Date.now() - 10 * 86_400_000);
  await utimes(p.worktree, old, old);
  assert.deepEqual(await cleanupWorktrees(wtRoot, 7 * 86_400_000, Date.now(), new Set([p.worktree.toLowerCase()])), []);
  assert.ok(existsSync(p.worktree));
});

test('branchDiff: dalın ana dala göre özeti ve farkı', async () => {
  const { branchDiff } = await import('../src/gitwork.js');
  const { r, wtRoot } = await repo();
  const p = await prepareWorktree(r, 't5', wtRoot);
  await writeFile(join(p.cwd, 'yeni.txt'), 'merhaba\n');
  const d = await branchDiff(p);
  assert.equal(d.ok, true);
  assert.match(d.stat, /yeni\.txt/);
  assert.match(d.diff, /\+merhaba/);
  assert.equal((await branchDiff({ repo: r, worktree: null, branch: 'yok' })).ok, false);
});

test('birleştirme commit kimliğini döner; geri alma (revert) değişikliği geri çeker, geçmiş silinmez', async () => {
  const { revertMerge } = await import('../src/gitwork.js');
  const { r, wtRoot } = await repo();
  const p = await prepareWorktree(r, 't6', wtRoot);
  await writeFile(join(p.cwd, 'z.txt'), 'z\n');
  const m = await mergeWorktree({ ...p, title: 'z' });
  assert.ok(m.ok && /^[0-9a-f]{7,}$/.test(m.commit));
  assert.ok(existsSync(join(r, 'z.txt')));
  const v = await revertMerge({ repo: r, commit: m.commit });
  assert.equal(v.ok, true);
  assert.equal(existsSync(join(r, 'z.txt')), false);
  assert.match((await git(['log', '--oneline', '-1'], r)).out, /Revert/);
});

test('runProjectTests: package.json test betiği varsa çalıştırır ve sonucu döner; yoksa çalıştırmaz', async () => {
  const { runProjectTests } = await import('../src/gitwork.js');
  const dir = await mkdtemp(join(tmpdir(), 'rt-'));
  assert.equal((await runProjectTests(dir)).ran, false);
  await writeFile(join(dir, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "console.log(\'tamam\')"' } }));
  const ok = await runProjectTests(dir);
  assert.deepEqual([ok.ran, ok.ok], [true, true]);
  assert.match(ok.tail, /tamam/);
  await writeFile(join(dir, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "process.exit(3)"' } }));
  const bad = await runProjectTests(dir);
  assert.deepEqual([bad.ran, bad.ok], [true, false]);
});
