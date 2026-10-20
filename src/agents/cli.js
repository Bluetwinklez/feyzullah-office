// Uzmanları bilgisayardaki CLI'lerle çalıştırır (API anahtarı gerekmez, girişli hesaplar):
//   claude      : claude -p --output-format stream-json (kimlik --append-system-prompt ile), devam --resume
//   codex       : codex exec --json -s workspace-write (kimlik talimatın başında), devam `resume <id>`
//   antigravity : agy -p "<kimlik + görev>" --output-format stream-json --sandbox, devam --conversation
// İzin atlatma bayrakları kullanılmaz; Claude'un izin istekleri Feyzullah'a (ada/telefon/ofis) düşer.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { homedir } from 'node:os';
import { join, win32 } from 'node:path';
import { StringDecoder } from 'node:string_decoder';

const NAMES = { claude: 'Claude', codex: 'Codex', antigravity: 'agy' };
const withPersona = (persona, prompt) => (persona ? `${persona}\n\n---\n\nGörev:\n${prompt}` : prompt);

export function cliArgs(engine, { cwd, persona, personaFile = null, prompt, resumeId, allowedTools = [], network = false }) {
  if (engine === 'codex') {
    // network: kum havuzu (workspace-write) içinde ağ erişimi (npm install vb.); dosya yazma yine yalnız çalışma klasörü.
    return ['exec', '--json', '-s', 'workspace-write', ...(network ? ['-c', 'sandbox_workspace_write.network_access=true'] : []), '--skip-git-repo-check', '-C', cwd, ...(resumeId ? ['resume', resumeId] : []), '-'];
  }
  if (engine === 'antigravity') {
    return ['-p', resumeId ? prompt : withPersona(persona, prompt), '--output-format', 'stream-json', '--sandbox', ...(resumeId ? ['--conversation', resumeId] : [])];
  }
  return ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits',
    ...(persona ? ['--append-system-prompt', persona] : personaFile ? ['--append-system-prompt-file', personaFile] : []), ...(resumeId ? ['--resume', resumeId] : []),
    ...(allowedTools.length ? ['--allowedTools', ...allowedTools] : [])];
}

/** Tek JSON satırı → { sessionId?, text?, final?, error?, rate? } | null */
export function parseCliLine(engine, line) {
  let j;
  try { j = JSON.parse(line); } catch { return null; }
  if (engine === 'codex') {
    if (j.type === 'thread.started') return { sessionId: j.thread_id };
    if (j.type === 'item.completed' && j.item?.type === 'agent_message') return { text: j.item.text, final: j.item.text };
    if (j.type === 'turn.failed') return { error: j.error?.message ?? 'Codex turu başarısız' };
    if (j.type === 'turn.completed' && j.usage) return { usage: { in: j.usage.input_tokens ?? 0, out: j.usage.output_tokens ?? 0, cost: 0 } }; // cached_input_tokens girdinin içinde
    return null;
  }
  if (engine === 'antigravity') {
    if (j.event === 'init') return { sessionId: j.conversation_id };
    if (j.event === 'step_update' && j.step_update?.step_type === 'agent_response' && j.step_update.text_delta) return { text: j.step_update.text_delta };
    if (j.event === 'result') return j.result?.status === 'SUCCESS' ? { final: String(j.result.response ?? '').trim() } : { error: `agy: ${j.result?.status ?? '?'}` };
    return null;
  }
  if (j.type === 'system' && j.subtype === 'init') return { sessionId: j.session_id };
  if (j.type === 'rate_limit_event') return j.rate_limit_info ? { rate: j.rate_limit_info } : null; // kullanım limiti
  if (j.type === 'assistant') {
    const text = (j.message?.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    return text ? { text } : null;
  }
  if (j.type === 'result') {
    const u = j.usage ? { in: (j.usage.input_tokens ?? 0) + (j.usage.cache_read_input_tokens ?? 0) + (j.usage.cache_creation_input_tokens ?? 0), out: j.usage.output_tokens ?? 0, cost: j.total_cost_usd ?? 0 } : null;
    return j.is_error ? { error: j.result || 'Claude hatası', usage: u } : { sessionId: j.session_id, final: j.result ?? '', usage: u };
  }
  return null;
}

/**
 * cliChat({ engine, bin, cwd, persona, prompt, resumeId?, onDelta?, onSession?, onRate?, signal?, spawnImpl? })
 * → Promise<{ text, sessionId }>; hata durumunda reddedilir.
 */
// Windows komut satırı en fazla ~32.767 karakter: agy'ye kimlik + görev argümanla gider, uzunsa dosyaya yazılır.
const MAX_ARG = 24_000;
export const TASK_FILE = '.ofis-gorev.md';

let fileSeq = 0;
export async function cliChat(opts) {
  if (opts.signal?.aborted) throw new Error('durduruldu');
  const { engine, bin, cwd, persona, prompt, resumeId = null } = opts;
  if (!bin) throw new Error(`${NAMES[engine] ?? engine} CLI bulunamadı`);
  if (engine === 'antigravity') {
    const full = resumeId ? prompt : withPersona(persona, prompt);
    if (full.length > MAX_ARG) {
      // agy kum havuzunda çalışır: dosya çalışma klasöründe; iş bitince silinir (git dalına girmesin).
      const f = join(cwd, TASK_FILE);
      await writeFile(f, full);
      const short = `Talimatın ve kimliğin bu klasördeki ${TASK_FILE} dosyasında (komut satırına sığmadı). Önce o dosyayı oku, oradaki görevi uygula; dosyayı silme ya da değiştirme.`;
      try { return await runCli({ ...opts, persona: null, prompt: short }); } finally { await unlink(f).catch(() => {}); }
    }
  }
  if (engine === 'claude' && persona && persona.length > MAX_ARG) {
    // Uzun kimlik: geçici dosyadan (--append-system-prompt-file), iş bitince silinir.
    const f = join(tmpdir(), `ofis-kimlik-${process.pid}-${Date.now()}-${++fileSeq}.md`);
    await writeFile(f, persona);
    try { return await runCli({ ...opts, persona: null, personaFile: f }); } finally { await unlink(f).catch(() => {}); }
  }
  return runCli(opts);
}

function runCli({ engine, bin, cwd, persona, personaFile = null, network = false, extraPath = null, prompt, resumeId = null, allowedTools = [], onDelta = () => {}, onSession = () => {}, onRate = () => {}, signal, spawnImpl = spawn }) {
  return new Promise((resolve, reject) => {
    const args = cliArgs(engine, { cwd, persona, personaFile, prompt, resumeId, allowedTools, network });
    const env = { ...process.env, FEYZULLAH_OFIS: '1' };
    if (extraPath) { const k = Object.keys(env).find((x) => x.toLowerCase() === 'path') ?? 'PATH'; env[k] = `${extraPath}${process.platform === 'win32' ? ';' : ':'}${env[k] ?? ''}`; }
    const child = spawnImpl(bin, args, { cwd, windowsHide: true, env });
    let sessionId = resumeId;
    const usage = { in: 0, out: 0, cost: 0 }; // token ve (Claude için) dolar maliyeti
    let streamed = '';
    let final = null;
    let error = null;
    let stderr = '';
    let buf = '';
    const dec = new StringDecoder('utf8');
    const handle = (line) => {
      if (!line.trim()) return;
      const ev = parseCliLine(engine, line);
      if (!ev) return;
      if (ev.rate) { try { onRate(ev.rate); } catch {} return; }
      if (ev.usage) { usage.in += ev.usage.in; usage.out += ev.usage.out; usage.cost += ev.usage.cost; }
      if (ev.sessionId && ev.sessionId !== sessionId) { sessionId = ev.sessionId; onSession(sessionId); }
      // Codex'in agent_message'ı tam mesajdır; claude/agy metni parça parça gelir.
      if (ev.text && engine !== 'codex') { streamed += ev.text; onDelta(ev.text); }
      if (ev.final != null) {
        if (engine === 'codex') onDelta(streamed ? `\n${ev.final}` : ev.final);
        final = engine === 'codex' && streamed ? `${streamed}\n${ev.final}` : ev.final;
        if (engine === 'codex') streamed = final;
      }
      if (ev.error) error = ev.error;
    };
    child.stdout.on('data', (c) => { const lines = (buf + dec.write(c)).split('\n'); buf = lines.pop(); lines.forEach(handle); });
    child.stderr.on('data', (c) => { stderr = (stderr + c).slice(-2000); });
    child.stdin.on('error', () => {});
    if (engine === 'antigravity') child.stdin.end();
    else child.stdin.end(resumeId || engine === 'claude' ? prompt : withPersona(persona, prompt));
    const kill = () => {
      if (process.platform === 'win32' && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGKILL');
    };
    signal?.addEventListener('abort', () => { error = 'durduruldu'; kill(); }, { once: true });
    child.on('error', (err) => reject(new Error(`başlatılamadı: ${err.message}`)));
    child.on('close', (code) => {
      handle(buf);
      if (error) return reject(new Error(error));
      if (code !== 0) return reject(new Error(`çıkış kodu ${code}: ${stderr.trim().slice(-300)}`));
      resolve({ text: (final ?? streamed).trim(), sessionId, usage });
    });
  });
}

const local = () => process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local');
const roaming = () => process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');

/** Native executable lookup; Windows .cmd shims are not executed through a shell. */
export function findExecutable(name, { env = process.env, platform = process.platform, exists = existsSync } = {}) {
  const key = Object.keys(env).find((k) => k.toLowerCase() === 'path');
  const pathJoin = platform === 'win32' ? win32.join : join;
  for (const entry of String(env[key] ?? '').split(platform === 'win32' ? ';' : ':')) {
    const dir = entry.trim().replace(/^"|"$/g, '');
    if (!dir) continue;
    const candidate = pathJoin(dir, platform === 'win32' ? `${name}.exe` : name);
    if (exists(candidate)) return candidate;
  }
  return null;
}

async function newest(dir, name) {
  try {
    for (const v of (await readdir(dir)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
      for (const sub of [v, ...(await readdir(join(dir, v)).catch(() => []))]) {
        const p = sub === v ? join(dir, v, name) : join(dir, v, sub, name);
        if (existsSync(p)) return p;
      }
    }
  } catch {}
  return null;
}

/** claude / codex / agy çalıştırılabilirleri (Claude masaüstü paketi MSIX: iki konum da denenir). */
export async function findBins() {
  let claude = await newest(join(roaming(), 'Claude', 'claude-code'), 'claude.exe');
  if (!claude) {
    try {
      for (const p of await readdir(join(local(), 'Packages'))) {
        if (!/^Claude_/i.test(p)) continue;
        claude = await newest(join(local(), 'Packages', p, 'LocalCache', 'Roaming', 'Claude', 'claude-code'), 'claude.exe');
        if (claude) break;
      }
    } catch {}
  }
  const agy = join(local(), 'agy', 'bin', 'agy.exe');
  // PC oyunu için Godot: C:\Tools\godot\godot.cmd (Ofis kurulumu) varsa uzmanların PATH'ine eklenir.
  const godotDir = [join(process.env.SystemDrive ?? 'C:', '\\', 'Tools', 'godot')].find((d) => existsSync(join(d, 'godot.cmd'))) ?? null;
  const godotExe = godotDir ? (await readdir(godotDir).catch(() => [])).find((f) => /_console\.exe$/i.test(f)) ?? null : null;
  const override = (name) => {
    const value = process.env[name];
    if (!value) return null;
    if (!existsSync(value) || (process.platform === 'win32' && !/\.exe$/i.test(value))) throw new Error(`${name}: native CLI executable bulunamadı`);
    return value;
  };
  return {
    claude: override('OFIS_CLAUDE_BIN') || claude || findExecutable('claude'),
    codex: override('OFIS_CODEX_BIN') || await newest(join(local(), 'OpenAI', 'Codex', 'bin'), 'codex.exe') || findExecutable('codex'),
    antigravity: override('OFIS_AGY_BIN') || (existsSync(agy) ? agy : null) || findExecutable('agy'),
    godotDir, godotExe,
  };
}
