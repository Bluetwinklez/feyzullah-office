import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chat } from '../src/agents/providers.js';

async function sseServer(handler) {
  const seen = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => { seen.push({ url: req.url, headers: req.headers, body: body ? JSON.parse(body) : null }); handler(req, res); });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((r) => server.close(r)) };
}
const msgs = [{ role: 'user', content: 'Merhaba' }];

test('OpenAI uyumlu: akışlı parçalar birleşir, Bearer anahtar, sistem mesajı başta', async () => {
  const s = await sseServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    for (const t of ['Sel', 'am']) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`);
    res.end('data: [DONE]\n\n');
  });
  try {
    const deltas = [];
    const text = await chat({ provider: 'openai', model: 'm1', baseUrl: s.base, key: 'k-1', system: 'kısa ol', messages: msgs, onDelta: (d) => deltas.push(d) });
    assert.equal(text, 'Selam');
    assert.deepEqual(deltas, ['Sel', 'am']);
    assert.equal(s.seen[0].url, '/chat/completions');
    assert.equal(s.seen[0].headers.authorization, 'Bearer k-1');
    assert.deepEqual(s.seen[0].body.messages[0], { role: 'system', content: 'kısa ol' });
    assert.equal(s.seen[0].body.stream, true);
  } finally { await s.close(); }
});

test('Gemini: x-goog-api-key, model rolü, systemInstruction', async () => {
  const s = await sseServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Tamam' }] } }] })}\n\n`);
  });
  try {
    const text = await chat({ provider: 'gemini', model: 'g1', baseUrl: s.base, key: 'g-key', system: 'S', messages: [...msgs, { role: 'assistant', content: 'x' }, { role: 'user', content: 'y' }] });
    assert.equal(text, 'Tamam');
    assert.equal(s.seen[0].url, '/models/g1:streamGenerateContent?alt=sse');
    assert.equal(s.seen[0].headers['x-goog-api-key'], 'g-key');
    assert.deepEqual(s.seen[0].body.contents.map((c) => c.role), ['user', 'model', 'user']);
    assert.equal(s.seen[0].body.systemInstruction.parts[0].text, 'S');
  } finally { await s.close(); }
});

test('HTTP hatası: durum kodu bildirilir, anahtar mesajda geçmez', async () => {
  const s = await sseServer((req, res) => { res.writeHead(401); res.end('{"error":{"message":"bad key k-SECRET"}}'); });
  try {
    await assert.rejects(
      () => chat({ provider: 'openai', model: 'm', baseUrl: s.base, key: 'k-SECRET', messages: msgs }),
      (err) => /401/.test(err.message) && !err.message.includes('k-SECRET'),
    );
  } finally { await s.close(); }
});

function fakeAnthropic(events, final) {
  const calls = [];
  const client = { beta: { messages: { stream(params) {
    calls.push(params);
    return { async *[Symbol.asyncIterator]() { yield* events; }, finalMessage: async () => final };
  } } } };
  return { calls, factory: () => client };
}

test('Anthropic (SDK): metin parçaları, Opus 5.5 için fallbacks "default"', async () => {
  const f = fakeAnthropic(
    [{ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Mer' } }, { type: 'content_block_delta', delta: { type: 'text_delta', text: 'haba' } }],
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Merhaba' }] },
  );
  const deltas = [];
  const text = await chat({ provider: 'anthropic', model: 'claude-opus-5-5', key: 'sk', system: 'S', messages: msgs, onDelta: (d) => deltas.push(d), anthropicFactory: f.factory });
  assert.equal(text, 'Merhaba');
  assert.deepEqual(deltas, ['Mer', 'haba']);
  assert.equal(f.calls[0].fallbacks, 'default');
  assert.deepEqual(f.calls[0].betas, ['server-side-fallback-2026-07-01']);
  assert.equal(f.calls[0].system, 'S');
});

test('Anthropic: Haiku için fallbacks yok; refusal hata olur', async () => {
  const f = fakeAnthropic([], { stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [] });
  await assert.rejects(() => chat({ provider: 'anthropic', model: 'claude-haiku-5-5', key: 'sk', messages: msgs, anthropicFactory: f.factory }), /reddetti/);
  assert.equal(f.calls[0].fallbacks, undefined);
});
