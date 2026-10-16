// Demo verisi: köprü olmadan ofisi denemek için (OFIS_DEMO=1). Feyzullah snapshot biçiminde.
export function demoSnapshot(now = Date.now()) {
  const s = (agent, session, state, cwd) => ({ agent, session, state, cwd, lastAt: now - 2000, title: '' });
  const e = (agent, session, kind, ago, extra = {}) => ({ id: `${session}-${kind}`, agent, session, kind, at: now - ago, status: 'ok', title: kind, ...extra });
  return {
    sessions: [
      s('claude', 'd-claude', 'working', 'C:/proje/feyzullah-1'),
      s('codex', 'd-codex', 'working', 'C:/proje/site'),
      s('antigravity', 'd-agy', 'working', 'C:/proje/tasarim'),
      s('claude', 'd-think', 'thinking', 'C:/proje/api'),
      s('codex', 'd-wait', 'waiting', 'C:/proje/mobil'),
      s('claude', 'd-done', 'idle', 'C:/proje/docs'),
    ],
    entries: [
      e('claude', 'd-claude', 'prompt', 90_000, { title: 'Giriş sayfasını yeniden tasarla' }),
      e('claude', 'd-claude', 'edit', 3000, { title: 'src/login.tsx', files: [{ path: 'src/login.tsx', change: 'edit' }], diff: '@@ -12,7 +12,9 @@\n-  <button>Giriş</button>\n+  <Button variant="primary" onClick={submit}>\n+    Giriş yap\n+  </Button>' }),
      e('codex', 'd-codex', 'prompt', 60_000, { title: 'Testleri düzelt' }),
      e('codex', 'd-codex', 'run', 2000, { title: 'npm test', command: 'npm test', output: '> site@1.0.0 test\n✓ 41 passing\n✗ 2 failing', status: 'running' }),
      e('antigravity', 'd-agy', 'web', 4000, { title: 'MDN: CSS container queries' }),
      e('claude', 'd-think', 'prompt', 5000, { title: 'Ödeme API tasarımı' }),
      e('codex', 'd-wait', 'permission', 8000, { title: 'İzin: git push --force', command: 'git push --force origin main', status: 'waiting' }),
      e('claude', 'd-done', 'stop', 30_000, { title: 'README güncellendi, testler geçti.' }),
    ],
    pending: [{ id: 'demo-p1', agent: 'codex', session: 'd-wait', title: 'git push --force', command: 'git push --force origin main', createdAt: now - 8000, expiresAt: now + 100_000 }],
  };
}

/** Demo görev panosu (OFIS_DEMO=1). */
export function demoBoard(now = Date.now()) {
  const t = (id, name, title, status, ago, extra = {}) => ({ id, name, title, status, at: now - ago, startedAt: now - ago - 60_000, round: 0, command: 'Giriş sayfası + API', ...extra });
  return [
    t('d1', 'Backend Architect', 'Kimlik doğrulama API tasarımı', 'done', 900_000),
    t('d2', 'Frontend Developer', 'Giriş sayfası formu ve doğrulama', 'redo', 60_000, { round: 1, feedback: 'Form doğrulaması eksik' }),
    t('d3', 'DevOps Automator', 'CI iş akışı (npm test)', 'review', 30_000),
    t('d4', 'UI Designer', 'Logo ve renk paleti (Krea)', 'doing', 20_000),
    t('d5', 'Ters Mühendis', 'eski istemci.exe protokol çözümlemesi', 'doing', 10_000),
  ];
}
