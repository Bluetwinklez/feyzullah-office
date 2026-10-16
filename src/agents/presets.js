// API anahtarlı ajanlar için hazır sağlayıcılar. Çoğu OpenAI uyumlu (/chat/completions): provider 'openai' + adres.
// model: varsayılan (boşsa kullanıcı yazar), hint: örnek model adı, local: anahtar gerekmez (bilgisayardaki sunucu).
export const PRESETS = [
  { id: 'anthropic', label: 'Anthropic (Claude)', provider: 'anthropic', baseUrl: '', model: 'claude-opus-5-5', hint: 'claude-sonnet-5-5' },
  { id: 'openai', label: 'OpenAI', provider: 'openai', baseUrl: 'https://api.openai.com/v1', model: '', hint: 'model adı (ör. platform.openai.com/docs/models)' },
  { id: 'gemini', label: 'Google Gemini', provider: 'gemini', baseUrl: '', model: '', hint: 'gemini model adı' },
  { id: 'openrouter', label: 'OpenRouter (birçok model tek anahtar)', provider: 'openai', baseUrl: 'https://openrouter.ai/api/v1', model: '', hint: 'sağlayıcı/model (ör. anthropic/…)' },
  { id: 'groq', label: 'Groq (çok hızlı)', provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', model: '', hint: 'groq model adı' },
  { id: 'deepseek', label: 'DeepSeek', provider: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', hint: 'deepseek-chat / deepseek-reasoner' },
  { id: 'mistral', label: 'Mistral', provider: 'openai', baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-large-latest', hint: 'mistral-large-latest' },
  { id: 'xai', label: 'xAI (Grok)', provider: 'openai', baseUrl: 'https://api.x.ai/v1', model: '', hint: 'grok model adı' },
  { id: 'together', label: 'Together AI', provider: 'openai', baseUrl: 'https://api.together.xyz/v1', model: '', hint: 'açık model adı' },
  { id: 'fireworks', label: 'Fireworks AI', provider: 'openai', baseUrl: 'https://api.fireworks.ai/inference/v1', model: '', hint: 'accounts/fireworks/models/…' },
  { id: 'perplexity', label: 'Perplexity (web aramalı)', provider: 'openai', baseUrl: 'https://api.perplexity.ai', model: 'sonar', hint: 'sonar / sonar-pro' },
  { id: 'cerebras', label: 'Cerebras', provider: 'openai', baseUrl: 'https://api.cerebras.ai/v1', model: '', hint: 'cerebras model adı' },
  { id: 'deepinfra', label: 'DeepInfra', provider: 'openai', baseUrl: 'https://api.deepinfra.com/v1/openai', model: '', hint: 'açık model adı' },
  { id: 'ollama', label: 'Ollama (yerel, anahtarsız)', provider: 'openai', baseUrl: 'http://localhost:11434/v1', model: '', hint: 'ör. llama3.1', local: true },
  { id: 'lmstudio', label: 'LM Studio (yerel, anahtarsız)', provider: 'openai', baseUrl: 'http://localhost:1234/v1', model: '', hint: 'yüklü model adı', local: true },
  { id: 'custom', label: 'Özel OpenAI uyumlu adres', provider: 'openai', baseUrl: '', model: '', hint: 'model adı' },
];

const norm = (u) => String(u ?? '').trim().replace(/\/+$/, '').toLowerCase();

/** Kayıtlı ajanın sağlayıcı + adresinden hangi hazır seçenek olduğunu bulur. */
export function presetFor(provider, baseUrl) {
  if (provider === 'anthropic' || provider === 'gemini') return PRESETS.find((p) => p.id === provider);
  const u = norm(baseUrl);
  if (!u) return PRESETS.find((p) => p.id === 'openai');
  return PRESETS.find((p) => p.provider === 'openai' && p.baseUrl && norm(p.baseUrl) === u) ?? PRESETS.find((p) => p.id === 'custom');
}
