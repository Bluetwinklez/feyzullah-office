// Kullanıcının eklediği API ajanları: ~/.feyzullah/ofis-agents.json. API anahtarı yalnızca şifreli
// (Electron safeStorage = Windows DPAPI) saklanır; list() anahtarı hiç döndürmez, yalnızca son 4 karakter.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const PROVIDERS = ['anthropic', 'openai', 'gemini'];
// engine: 'api' (sağlayıcı + anahtar) ya da bilgisayardaki CLI ('claude' | 'codex' | 'antigravity')
export const ENGINES = ['api', 'claude', 'codex', 'antigravity'];
const FIELDS = ['name', 'engine', 'provider', 'model', 'baseUrl', 'system', 'catalogId', 'division', 'color', 'emoji', 'workdir', 'role'];
const LIMITS = { system: 60000, workdir: 500 };

/** crypto: { available(), encrypt(str) → base64, decrypt(base64) → str } */
export async function createAgentStore({ file, crypto }) {
  let agents = [];
  try { agents = JSON.parse(await readFile(file, 'utf8')).agents ?? []; } catch {}

  async function save() {
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, `${JSON.stringify({ agents }, null, 2)}\n`);
    await rename(tmp, file);
  }

  const pub = (a) => ({
    id: a.id, name: a.name, engine: a.engine ?? 'api', provider: a.provider ?? '', model: a.model ?? '', baseUrl: a.baseUrl ?? '', system: a.system ?? '',
    catalogId: a.catalogId ?? '', division: a.division ?? '', color: a.color ?? '', emoji: a.emoji ?? '', workdir: a.workdir ?? '', role: a.role ?? '',
    hasKey: Boolean(a.keyEnc), keyHint: a.keyHint ?? '',
  });

  function clean(fields, base = {}) {
    const out = { ...base };
    for (const k of FIELDS) if (fields[k] !== undefined) out[k] = String(fields[k]).trim().slice(0, LIMITS[k] ?? 200);
    out.engine ||= 'api';
    if (!ENGINES.includes(out.engine)) throw new Error(`bilinmeyen motor: ${out.engine}`);
    if (!out.name) throw new Error('ad gerekli');
    if (out.engine === 'api') {
      if (!PROVIDERS.includes(out.provider)) throw new Error(`bilinmeyen sağlayıcı: ${out.provider}`);
      if (!out.model) throw new Error('model gerekli');
    }
    return out;
  }

  function setKey(a, key) {
    if (key === undefined) return;
    const k = String(key).trim();
    if (!k) { delete a.keyEnc; delete a.keyHint; return; }
    if (!crypto.available()) throw new Error('Windows şifreleme (DPAPI) kullanılamıyor; anahtar saklanmadı');
    a.keyEnc = crypto.encrypt(k);
    a.keyHint = k.slice(-4);
  }

  return {
    list: () => agents.map(pub),
    async add(fields) {
      const a = clean(fields, { id: randomUUID().slice(0, 8) });
      setKey(a, fields.key);
      agents.push(a);
      await save();
      return pub(a);
    },
    async update(id, fields) {
      const i = agents.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('ajan yok');
      const a = clean(fields, agents[i]);
      setKey(a, fields.key);
      agents[i] = a;
      await save();
      return pub(a);
    },
    async remove(id) {
      agents = agents.filter((x) => x.id !== id);
      await save();
    },
    /** Yalnızca ana süreç kullanır; pencereye gönderilmez. */
    getKey(id) {
      const a = agents.find((x) => x.id === id);
      if (!a?.keyEnc) return null;
      try { return crypto.decrypt(a.keyEnc); } catch { return null; }
    },
    get: (id) => { const a = agents.find((x) => x.id === id); return a ? pub(a) : null; },
  };
}
