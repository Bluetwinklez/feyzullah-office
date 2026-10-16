import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, presetFor } from '../src/agents/presets.js';

test('hazır sağlayıcılar: benzersiz id, bilinen sağlayıcı türü, adresler https (yereller hariç)', () => {
  assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length);
  assert.ok(PRESETS.length >= 12);
  for (const p of PRESETS) {
    assert.ok(['anthropic', 'openai', 'gemini'].includes(p.provider), p.id);
    if (p.baseUrl) assert.ok(p.local ? p.baseUrl.startsWith('http://localhost') : p.baseUrl.startsWith('https://'), p.id);
  }
});

test('kayıtlı ajanın hazır seçeneği adresinden bulunur', () => {
  assert.equal(presetFor('anthropic', '').id, 'anthropic');
  assert.equal(presetFor('openai', 'https://api.groq.com/openai/v1/').id, 'groq');
  assert.equal(presetFor('openai', '').id, 'openai');
  assert.equal(presetFor('openai', 'https://benim.sunucum/v1').id, 'custom');
});
