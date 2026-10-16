import { createServer } from 'node:http';

export function freePort() {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

/** Sahte Feyzullah köprüsü: /health, /events (SSE), /decide, /say. */
export async function fakeBridge({ token = 'tok' } = {}) {
  const port = await freePort();
  const streams = new Set();
  const posts = [];
  let connections = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') return res.end('{"ok":true}');
    if (req.headers['x-feyzullah-token'] !== token) { res.statusCode = 401; return res.end('{}'); }
    if (url.pathname === '/events') {
      connections++;
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      streams.add(res);
      req.on('close', () => streams.delete(res));
      return undefined;
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => { posts.push({ path: url.pathname, body: JSON.parse(body || '{}') }); res.end('{"ok":true}'); });
    return undefined;
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return {
    port,
    posts,
    get connections() { return connections; },
    emit(type, data) { for (const s of streams) s.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`); },
    dropAll() { for (const s of streams) s.destroy(); streams.clear(); },
    close: () => new Promise((r) => { for (const s of streams) s.destroy(); server.closeAllConnections?.(); server.close(r); }),
  };
}

export const until = async (fn, ms = 3000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (fn()) return true; await new Promise((r) => setTimeout(r, 20)); }
  throw new Error('zaman aşımı');
};
