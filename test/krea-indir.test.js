import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { denetle, indir } from '../tools/krea-indir.mjs';

test('Krea indirme: yalnız Krea https adresleri ve çalışma klasörünün içi', () => {
  const kok = 'C:/is';
  assert.ok(denetle('https://app-uploads.krea.ai/public/a.glb', 'varliklar/a.glb', kok));
  assert.ok(denetle('https://gen.krea.ai/images/b.png', 'b.png', kok));
  assert.throws(() => denetle('https://kotu.com/a.glb', 'a.glb', kok), /yalnız Krea/);
  assert.throws(() => denetle('http://gen.krea.ai/b.png', 'b.png', kok), /yalnız Krea/);
  assert.throws(() => denetle('https://gen.krea.ai/b.png', '../disari.png', kok), /içinde/);
  assert.throws(() => denetle('https://gen.krea.ai/b.png', 'C:/Windows/x.png', kok), /içinde/);
});

test('Krea indirme: dosyayı klasörünü oluşturarak yazar', async () => {
  const kok = await mkdtemp(join(tmpdir(), 'ki-'));
  const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => new TextEncoder().encode('GLB').buffer });
  const r = await indir('https://app-uploads.krea.ai/public/a.glb', 'varliklar/modeller/a.glb', { kok, fetchImpl });
  assert.equal(r.bayt, 3);
  assert.equal(await readFile(join(kok, 'varliklar/modeller/a.glb'), 'utf8'), 'GLB');
});
