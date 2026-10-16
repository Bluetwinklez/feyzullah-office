// Feyzullah köprüsü istemcisi: jetonu Feyzullah'ın veri klasöründen okur, SSE akışını dinler,
// koparsa yeniden bağlanır, köprü kapalıysa başlatır. Onay (decide) ve mesaj (say) gönderir.
// Ofis onaylayıcı sayılmaz (approver=0): ofis açık diye ajanlar telefona/adaya onay beklemez.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function readToken(dir) {
  try { return (await readFile(join(dir, 'token'), 'utf8')).trim() || null; } catch { return null; }
}

/** Köprü kapalıysa Feyzullah'ın bridge/server.js'ini ayrı süreç olarak başlatır. */
export function bridgeStarter({ port, feyzullahRoot, spawnImpl = spawn }) {
  const healthy = () => fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) }).then((r) => r.ok).catch(() => false);
  return async function ensureBridge() {
    if (await healthy()) return true;
    if (!feyzullahRoot) return false;
    // Electron'da process.execPath electron.exe'dir: Node gibi çalışması için ELECTRON_RUN_AS_NODE.
    spawnImpl(process.execPath, [join(feyzullahRoot, 'bridge', 'server.js')], {
      cwd: feyzullahRoot, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, detached: true, stdio: 'ignore', windowsHide: true,
    }).unref();
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (await healthy()) return true;
    }
    return false;
  };
}

export function createBridgeClient({ dir, port = 5185, onEvent, ensureBridge = async () => true, minDelay = 1000, maxDelay = 15_000 }) {
  const base = `http://127.0.0.1:${port}`;
  let ctrl = null;
  let stopped = false;

  async function post(path, body) {
    const token = await readToken(dir);
    if (!token) return { ok: false, error: 'Feyzullah jetonu yok' };
    try {
      const res = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-feyzullah-token': token }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
      const j = await res.json().catch(() => ({}));
      return res.ok ? { ok: true, ...j } : { ok: false, error: j.error ?? `köprü ${res.status}` };
    } catch (err) { return { ok: false, error: err.message }; }
  }

  async function loop() {
    let delay = minDelay;
    while (!stopped) {
      ctrl = new AbortController();
      try {
        const token = await readToken(dir);
        if (!token) throw new Error('jeton yok');
        const res = await fetch(`${base}/events?approver=0`, { headers: { 'x-feyzullah-token': token }, signal: ctrl.signal });
        if (!res.ok) throw new Error(`events ${res.status}`);
        delay = minDelay;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i);
            buf = buf.slice(i + 2);
            const type = /^event: (.+)$/m.exec(block)?.[1];
            const data = /^data: (.+)$/m.exec(block)?.[1];
            if (!type || !data) continue;
            try { onEvent(type, JSON.parse(data)); } catch {}
          }
        }
      } catch {}
      if (stopped) break;
      onEvent('offline', {});
      await ensureBridge().catch(() => false);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  return {
    start() { stopped = false; loop(); },
    stop() { stopped = true; ctrl?.abort(); },
    decide: (id, decision) => post('/decide', { id, decision }),
    say: (agent, session, text) => post('/say', { agent, session, text }),
    post,
  };
}
