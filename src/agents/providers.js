// API ajanlarının sağlayıcı istemcileri. Hepsi akışlı: onDelta(metin parçası), dönüş = tam metin.
//   anthropic : resmî @anthropic-ai/sdk (Messages API, akış)
//   openai    : OpenAI uyumlu /chat/completions (OpenAI, Groq, OpenRouter, yerel sunucular; baseUrl ile)
//   gemini    : Google Generative Language API streamGenerateContent (SSE)
// Hata mesajlarında API anahtarı asla geçmez.
import Anthropic from '@anthropic-ai/sdk';

// Bu modellerde sunucu tarafı yedek (refusal → önerilen yedek model) varsayılan olarak açık.
const FALLBACK_MODELS = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']);

const scrub = (msg, key) => (key ? String(msg).split(key).join('***') : String(msg));

async function* sseData(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).replace(/\r$/, '');
      buf = buf.slice(i + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
  if (buf.startsWith('data:')) yield buf.slice(5).trim();
}

async function post(url, headers, body, signal, key) {
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
  } catch (err) { throw new Error(scrub(`bağlantı hatası: ${err.message}`, key)); }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = text;
    try { detail = JSON.parse(text)?.error?.message ?? text; } catch {}
    throw new Error(scrub(`sağlayıcı ${res.status}: ${String(detail).slice(0, 300)}`, key));
  }
  return res;
}

async function openaiChat({ model, baseUrl, key, system, messages, onDelta, signal }) {
  const base = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const body = { model, stream: true, messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages] };
  const res = await post(`${base}/chat/completions`, key ? { authorization: `Bearer ${key}` } : {}, body, signal, key);
  let text = '';
  for await (const data of sseData(res)) {
    if (data === '[DONE]') break;
    let j;
    try { j = JSON.parse(data); } catch { continue; }
    const d = j.choices?.[0]?.delta?.content;
    if (d) { text += d; onDelta(d); }
  }
  return text;
}

async function geminiChat({ model, baseUrl, key, system, messages, onDelta, signal }) {
  const base = (baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
  const body = {
    contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
  };
  const res = await post(`${base}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, key ? { 'x-goog-api-key': key } : {}, body, signal, key);
  let text = '';
  for await (const data of sseData(res)) {
    let j;
    try { j = JSON.parse(data); } catch { continue; }
    for (const p of j.candidates?.[0]?.content?.parts ?? []) if (p.text) { text += p.text; onDelta(p.text); }
  }
  return text;
}

async function anthropicChat({ model, baseUrl, key, system, messages, onDelta, signal, anthropicFactory }) {
  const client = anthropicFactory
    ? anthropicFactory({ apiKey: key, baseURL: baseUrl || undefined })
    : new Anthropic({ apiKey: key, ...(baseUrl ? { baseURL: baseUrl } : {}) });
  const params = {
    model, max_tokens: 64000, messages,
    ...(system ? { system } : {}),
    ...(FALLBACK_MODELS.has(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
  };
  try {
    const stream = client.beta.messages.stream(params, { signal });
    let text = '';
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { text += ev.delta.text; onDelta(ev.delta.text); }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw new Error(`model isteği reddetti (${final.stop_details?.category ?? 'bilinmiyor'})`);
    return text;
  } catch (err) {
    const status = err?.status ? `sağlayıcı ${err.status}: ` : '';
    throw new Error(scrub(`${status}${err.message}`, key));
  }
}

/**
 * chat({ provider, model, baseUrl?, key?, system?, messages: [{role:'user'|'assistant', content}], onDelta?, signal? })
 */
export async function chat({ provider, onDelta = () => {}, ...rest }) {
  if (provider === 'openai') return openaiChat({ ...rest, onDelta });
  if (provider === 'gemini') return geminiChat({ ...rest, onDelta });
  if (provider === 'anthropic') return anthropicChat({ ...rest, onDelta });
  throw new Error(`bilinmeyen sağlayıcı: ${provider}`);
}
