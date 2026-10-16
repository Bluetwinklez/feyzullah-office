import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { CORE_TEAM, engineFor, loadCatalog, readPersona } from '../src/agents/catalog.js';
import { root } from './helpers-root.js';

const dir = join(root, 'test', 'fixtures', 'catalog');

test('katalog: bölümler ve uzmanlar; ön bilgisi olmayan dosya atlanır', async () => {
  const c = await loadCatalog(dir);
  assert.equal(c.divisions.design.label, 'Design');
  assert.deepEqual(c.agents.map((a) => a.id).sort(), ['design-ui-designer', 'engineering-devops-automator', 'godot-gameplay-scripter', 'testing-reality-checker']);
  const rc = c.agents.find((a) => a.id === 'testing-reality-checker');
  assert.equal(rc.name, 'Reality Checker');
  assert.equal(rc.division, 'testing');
  assert.equal(rc.emoji, '🧐');
  assert.equal(rc.color, '#EF4444', 'renk bölümden');
  assert.match(await readPersona(dir, rc), /You require evidence/);
  assert.doesNotMatch(await readPersona(dir, rc), /^---/);
});

test('motor seçimi: tasarım → agy, mimar/inceleme/kontrol → claude, uygulama → codex', () => {
  assert.equal(engineFor({ id: 'design-ui-designer', division: 'design' }), 'codex'); // Krea agy'de yetkisiz: görsel üreten tasarım Codex'te
  assert.equal(engineFor({ id: 'engineering-frontend-developer', division: 'engineering' }), 'antigravity');
  assert.equal(engineFor({ id: 'engineering-backend-architect', division: 'engineering' }), 'claude');
  assert.equal(engineFor({ id: 'engineering-code-reviewer', division: 'engineering' }), 'claude');
  assert.equal(engineFor({ id: 'testing-reality-checker', division: 'testing' }), 'claude');
  assert.equal(engineFor({ id: 'engineering-devops-automator', division: 'engineering' }), 'codex');
  assert.equal(engineFor({ id: 'testing-api-tester', division: 'testing' }), 'codex');
  assert.equal(engineFor({ id: 'marketing-growth-hacker', division: 'marketing' }), 'codex'); // iş yükü Codex/agy'de
  assert.equal(engineFor({ id: 'engineering-ai-engineer', division: 'engineering' }), 'codex');
  assert.equal(engineFor({ id: 'project-manager-senior', division: 'project-management' }), 'claude');
  assert.equal(engineFor({ id: 'game-designer', division: 'game-development' }), 'claude'); // oyun tasarımı = planlama
  assert.equal(engineFor({ id: 'godot-gameplay-scripter', division: 'game-development' }), 'codex');
});

test('çekirdek ekip 8 kişi', () => {
  assert.equal(CORE_TEAM.length, 8);
  assert.ok(CORE_TEAM.includes('testing-reality-checker'));
});

test('VoltAgent kataloğu: kategoriler bölümlere eşlenir, kimlik kendi klasöründen okunur, iki katalog birleşir', async () => {
  const { loadVoltCatalog, mergeCatalogs } = await import('../src/agents/catalog.js');
  const vdir = join(root, 'test', 'fixtures', 'voltagent');
  const v = await loadVoltCatalog(vdir);
  assert.deepEqual(v.agents.map((a) => a.id).sort(), ['volt-electron-pro', 'volt-security-auditor']);
  const e = v.agents.find((a) => a.id === 'volt-electron-pro');
  assert.equal(e.name, 'Electron Pro');
  assert.equal(e.division, 'engineering');
  assert.equal(v.agents.find((a) => a.id === 'volt-security-auditor').division, 'testing');
  assert.match(await readPersona('başka-klasör', e), /senior Electron developer/);
  const m = mergeCatalogs(await loadCatalog(dir), v);
  assert.equal(m.agents.length, 6);
  assert.ok(m.divisions.engineering);
  assert.equal(engineFor(e), 'codex');
  assert.equal(engineFor(v.agents.find((a) => a.id === 'volt-security-auditor')), 'claude');
});

test('alt klasördeki uzmanlar da yüklenir (ör. game-development/godot)', async () => {
  const c = await loadCatalog(dir);
  const g = c.agents.find((a) => a.id === 'godot-gameplay-scripter');
  assert.ok(g, 'alt klasör uzmanı yok');
  assert.equal(g.division, 'engineering');
  assert.match(await readPersona(dir, g), /Godot/);
});
