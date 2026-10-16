import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAgentStore } from '../src/agents/store.js';

// Sahte şifreleme (testte DPAPI yok): ters çevir + base64.
const fakeCrypto = {
  available: () => true,
  encrypt: (s) => Buffer.from([...s].reverse().join('')).toString('base64'),
  decrypt: (b) => [...Buffer.from(b, 'base64').toString()].reverse().join(''),
};

async function setup(crypto = fakeCrypto) {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-ag-'));
  const file = join(dir, 'ofis-agents.json');
  return { dir, file, store: await createAgentStore({ file, crypto }), cleanup: () => rm(dir, { recursive: true, force: true }) };
}

test('ajan ekle: anahtar dosyada düz metin olarak yok, listede yalnızca son 4 karakter', async () => {
  const s = await setup();
  try {
    const a = await s.store.add({ name: 'Ayşe', provider: 'anthropic', model: 'claude-opus-5-5', system: 'Kod inceler', key: 'sk-ant-GIZLI-1234' });
    const raw = await readFile(s.file, 'utf8');
    assert.ok(!raw.includes('GIZLI'), 'anahtar düz metin yazılmamalı');
    const [listed] = s.store.list();
    assert.equal(listed.id, a.id);
    assert.equal(listed.hasKey, true);
    assert.equal(listed.keyHint, '1234');
    assert.equal(listed.key, undefined);
    assert.equal(listed.keyEnc, undefined);
    assert.equal(s.store.getKey(a.id), 'sk-ant-GIZLI-1234');
  } finally { await s.cleanup(); }
});

test('anahtarsız ajan eklenir; güncelle ve sil; yeniden açınca kalıcı', async () => {
  const s = await setup();
  try {
    const a = await s.store.add({ name: 'Mehmet', provider: 'openai', model: 'gpt-x', baseUrl: 'https://api.groq.com/openai/v1' });
    assert.equal(s.store.list()[0].hasKey, false);
    await s.store.update(a.id, { key: 'gsk_abcd9999', name: 'Mehmet 2' });
    assert.equal(s.store.list()[0].keyHint, '9999');
    const again = await createAgentStore({ file: s.file, crypto: fakeCrypto });
    assert.equal(again.list()[0].name, 'Mehmet 2');
    assert.equal(again.getKey(a.id), 'gsk_abcd9999');
    await again.update(a.id, { key: '' }); // boş anahtar = anahtarı kaldır
    assert.equal(again.list()[0].hasKey, false);
    await again.remove(a.id);
    assert.equal(again.list().length, 0);
  } finally { await s.cleanup(); }
});

test('geçersiz sağlayıcı reddedilir; şifreleme yoksa anahtar saklanmaz', async () => {
  const s = await setup({ available: () => false, encrypt() { throw new Error('x'); }, decrypt() { throw new Error('x'); } });
  try {
    await assert.rejects(() => s.store.add({ name: 'X', provider: 'bilinmez', model: 'm' }), /sağlayıcı/);
    await assert.rejects(() => s.store.add({ name: 'X', provider: 'anthropic', model: 'm', key: 'sk-1' }), /şifreleme/);
    const a = await s.store.add({ name: 'X', provider: 'anthropic', model: 'm' });
    assert.equal(a.hasKey, false);
  } finally { await s.cleanup(); }
});

test('uzman (CLI motoru): sağlayıcı/model gerekmez; uzun kimlik saklanır; geçersiz motor reddedilir', async () => {
  const s = await setup();
  try {
    const persona = 'x'.repeat(30000);
    const a = await s.store.add({ name: 'Reality Checker', engine: 'claude', catalogId: 'testing-reality-checker', division: 'testing', color: '#EF4444', emoji: '🧐', system: persona, workdir: 'C:/w' });
    const [l] = s.store.list();
    assert.equal(l.engine, 'claude');
    assert.equal(l.catalogId, 'testing-reality-checker');
    assert.equal(l.workdir, 'C:/w');
    assert.equal(l.system.length, 30000);
    assert.equal(l.hasKey, false);
    await assert.rejects(() => s.store.add({ name: 'X', engine: 'gpt' }), /motor/);
    await s.store.update(a.id, { engine: 'codex' });
    assert.equal(s.store.list()[0].engine, 'codex');
  } finally { await s.cleanup(); }
});
