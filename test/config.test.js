import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULTS, loadConfig } from '../src/config.js';

test('ayar dosyası yoksa varsayılanlar', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-cfg-'));
  try {
    const c = await loadConfig(dir);
    assert.deepEqual(c, DEFAULTS);
    assert.equal(c.hotkey, 'Control+Alt+O');
    assert.equal(c.bridgePort, 5185);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('ayar dosyası varsayılanların üzerine yazar; bozuk dosya yok sayılır', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-cfg-'));
  try {
    await writeFile(join(dir, 'ofis.json'), JSON.stringify({ lat: 39.9, pack: 'limezu' }));
    const c = await loadConfig(dir);
    assert.equal(c.lat, 39.9);
    assert.equal(c.pack, 'limezu');
    assert.equal(c.lon, DEFAULTS.lon);
    await writeFile(join(dir, 'ofis.json'), '{bozuk');
    assert.deepEqual(await loadConfig(dir), DEFAULTS);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('saveConfig: yalnız izinli anahtarlar, kullanıcının diğer ayarları korunur', async () => {
  const { saveConfig, SETTING_KEYS } = await import('../src/config.js');
  const { mkdtemp, readFile, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'cfg-'));
  await writeFile(join(dir, 'ofis.json'), JSON.stringify({ theme: 'real', lat: 1 }));
  assert.ok(SETTING_KEYS.includes('review'));
  assert.equal((await saveConfig({ review: false }, dir)).ok, true);
  assert.equal((await saveConfig({ reportHour: 22 }, dir)).ok, true);
  assert.equal((await saveConfig({ feyzullahRoot: 'C:/kötü' }, dir)).ok, false);
  assert.equal((await saveConfig({ review: 'evet' }, dir)).ok, false);
  assert.equal((await saveConfig({ reportHour: 40 }, dir)).ok, false);
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'ofis.json'), 'utf8')), { theme: 'real', lat: 1, review: false, reportHour: 22 });
});

test('kayıtlı komutlar: metin listesi kaydedilir, geçersiz biçim reddedilir', async () => {
  const { saveConfig } = await import('../src/config.js');
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'cfg2-'));
  assert.equal((await saveConfig({ savedCommands: ['testleri çalıştır ve düzelt'] }, dir)).ok, true);
  assert.equal((await saveConfig({ savedCommands: 'tek' }, dir)).ok, false);
  assert.equal((await saveConfig({ savedCommands: [''] }, dir)).ok, false);
});
