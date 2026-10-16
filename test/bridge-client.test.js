import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBridgeClient } from '../src/bridge-client.js';
import { fakeBridge, until } from './helpers.js';

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-bc-'));
  await writeFile(join(dir, 'token'), 'tok\n');
  const bridge = await fakeBridge();
  const events = [];
  const client = createBridgeClient({ dir, port: bridge.port, onEvent: (type, data) => events.push({ type, data }), ensureBridge: async () => true, minDelay: 30 });
  return { dir, bridge, events, client, cleanup: async () => { client.stop(); await bridge.close(); await rm(dir, { recursive: true, force: true }); } };
}

test('SSE olaylarını jetonla alır', async () => {
  const s = await setup();
  try {
    s.client.start();
    await until(() => s.bridge.connections === 1);
    s.bridge.emit('snapshot', { sessions: [], entries: [], pending: [] });
    s.bridge.emit('entry', { entry: { id: 'e1', kind: 'run' } });
    await until(() => s.events.length >= 2);
    assert.deepEqual(s.events.map((e) => e.type), ['snapshot', 'entry']);
    assert.equal(s.events[1].data.entry.id, 'e1');
  } finally { await s.cleanup(); }
});

test('bağlantı koparsa offline bildirir ve yeniden bağlanır', async () => {
  const s = await setup();
  try {
    s.client.start();
    await until(() => s.bridge.connections === 1);
    s.bridge.dropAll();
    await until(() => s.events.some((e) => e.type === 'offline'));
    await until(() => s.bridge.connections === 2);
  } finally { await s.cleanup(); }
});

test('decide ve say köprüye jetonla gider', async () => {
  const s = await setup();
  try {
    assert.equal((await s.client.decide('a1', 'deny')).ok, true);
    assert.equal((await s.client.say('claude', 's1', 'merhaba')).ok, true);
    assert.deepEqual(s.bridge.posts, [
      { path: '/decide', body: { id: 'a1', decision: 'deny' } },
      { path: '/say', body: { agent: 'claude', session: 's1', text: 'merhaba' } },
    ]);
  } finally { await s.cleanup(); }
});

test('jeton dosyası yoksa bağlanmaz, offline kalır', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ofis-bc-'));
  const bridge = await fakeBridge();
  const events = [];
  const client = createBridgeClient({ dir, port: bridge.port, onEvent: (t) => events.push(t), ensureBridge: async () => true, minDelay: 30 });
  try {
    client.start();
    await until(() => events.includes('offline'));
    assert.equal(bridge.connections, 0);
  } finally { client.stop(); await bridge.close(); await rm(dir, { recursive: true, force: true }); }
});
