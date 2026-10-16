import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoSnapshot } from '../src/demo.js';
import { buildOffice, newMemory } from '../src/office-model.js';

test('demo: her etkinlikten bir karakter (kod, terminal, tarayıcı, düşünme, izin, mola)', () => {
  const now = Date.now();
  const snap = demoSnapshot(now);
  const st = { sessions: new Map(snap.sessions.map((s) => [`${s.agent}:${s.session}`, s])), entries: snap.entries, pending: new Map(snap.pending.map((p) => [p.id, p])), guards: [] };
  const acts = buildOffice(st, { now, memory: newMemory() }).agents.map((a) => a.activity).sort();
  assert.deepEqual(acts, ['browser', 'code', 'resting', 'terminal', 'thinking', 'waiting']);
});
