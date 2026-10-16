import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loungeChatter } from '../src/chatter.js';

const agent = (key, overrides = {}) => ({
  key, agent: 'codex', name: 'Codex', activity: 'resting',
  place: 'lounge', since: 0, project: 'ofis', label: 'mola', ...overrides,
});

test('only lounge agents speak; desk and standing agents never speak', () => {
  const agents = [agent('a'), agent('b'), agent('desk', { place: 'desk' }),
    agent('standing', { place: 'standing' })];
  for (let slot = 0; slot < 30; slot++) {
    for (const [key, bubble] of loungeChatter(agents, slot * 6000)) {
      assert.ok(['a', 'b'].includes(key));
      assert.ok(['a', 'b'].includes(bubble.to));
    }
  }
  assert.deepEqual(loungeChatter([agent('desk', { place: 'desk' })], 0), new Map());
});

test('sorted pairs alternate speakers and have one silent slot per three', () => {
  const agents = ['d', 'b', 'c', 'a'].map((key) => agent(key));
  for (let slot = 0; slot < 12; slot++) {
    const result = loungeChatter(agents, slot * 6000);
    if (slot % 3 === 2) {
      assert.equal(result.size, 0);
    } else {
      const speakers = slot % 2 === 0 ? ['a', 'c'] : ['b', 'd'];
      assert.deepEqual([...result.keys()], speakers);
      assert.equal(result.get(speakers[0]).to, slot % 2 === 0 ? 'b' : 'a');
      assert.equal(result.get(speakers[1]).to, slot % 2 === 0 ? 'd' : 'c');
    }
  }
});

test('results are deterministic, input-order independent and do not mutate inputs', () => {
  const agents = Object.freeze([Object.freeze(agent('b')), Object.freeze(agent('a'))]);
  assert.deepEqual(loungeChatter(agents, 6000), loungeChatter(agents, 6000));
  assert.deepEqual(loungeChatter(agents, 6000), loungeChatter([...agents].reverse(), 6000));
  assert.deepEqual(loungeChatter(agents, 6001), loungeChatter(agents, 11999));
});

test('different slots offer varied short text with activity, type and partner context', () => {
  const agents = [agent('a', { agent: 'claude', name: 'Claude' }),
    agent('b', { agent: 'antigravity', name: 'agy', activity: 'idle', project: 'bahçe' })];
  const texts = new Set();
  for (let slot = 0; slot < 600; slot++) {
    for (const { text } of loungeChatter(agents, slot * 6000).values()) {
      assert.ok(text.length <= 28);
      assert.ok(text.length > 0);
      texts.add(text);
    }
  }
  assert.ok(texts.size >= 12);
  for (const expected of ['Testler yeşil ✓', 'ofis bitti!', 'Sırada ne var?',
    'Yeni görev bekliyorum', 'bahçe nasıl gidiyor?']) assert.ok(texts.has(expected), expected);
  assert.ok([...texts].some((text) => text.includes('Claude')));
  assert.ok([...texts].some((text) => text.includes('agy')));
});

test('long projects and names keep every bubble within 28 UTF-16 characters', () => {
  const agents = [agent('a', { project: 'çok-uzun-proje-'.repeat(20) }),
    agent('b', { name: '😀'.repeat(50), project: '😀'.repeat(50) })];
  for (let slot = 0; slot < 300; slot++) {
    for (const { text } of loungeChatter(agents, slot * 6000).values()) {
      assert.ok(text.length <= 28);
      assert.ok(!/[\uD800-\uDBFF]$/.test(text));
    }
  }
});

test('a lone or unpaired agent occasionally speaks without a recipient', () => {
  for (const agents of [[agent('a')], [agent('c'), agent('a'), agent('b')]]) {
    const key = agents.length === 1 ? 'a' : 'c';
    let spoken = 0;
    for (let slot = 0; slot < 12; slot++) {
      const bubble = loungeChatter(agents, slot * 6000).get(key);
      if (bubble) { assert.equal(bubble.to, null); spoken++; }
    }
    assert.equal(spoken, 4);
  }
});

test('empty input returns an empty Map', () => {
  assert.deepEqual(loungeChatter([], 0), new Map());
});

test('custom period controls slot boundaries', () => {
  const agents = [agent('a'), agent('b')];
  assert.deepEqual([...loungeChatter(agents, 99, { period: 100 }).keys()], ['a']);
  assert.deepEqual([...loungeChatter(agents, 100, { period: 100 }).keys()], ['b']);
  assert.equal(loungeChatter(agents, 200, { period: 100 }).size, 0);
});
