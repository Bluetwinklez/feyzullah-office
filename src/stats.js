// Uzman istatistikleri: bitmiş görev geçmişinden (ofis-history.json) başarı oranı, düzeltme turu, ortalama süre.
// Yönetici işi verirken bu özeti görür; arayüzde 📈 sayfası.
const FINAL = new Set(['done', 'needs-work', 'failed']);

/** Bitmiş kartları geçmişe ekler (aynı id bir kez, en fazla max). */
export function addHistory(history, board, max = 2000) {
  const ids = new Set(history.map((c) => c.id));
  // Uzmanın elinde olmayan sonlar (uygulama kapandı, kullanıcı iptal etti) başarıyı etkilemez.
  const add = (board ?? []).filter((c) => FINAL.has(c.status) && !ids.has(c.id) && !['uygulama kapandı', 'iptal edildi'].includes(c.error))
    .map(({ id, agentId, name, title, status, round, fixer, startedAt, endAt }) => ({ id, agentId, name, title, status, round: round ?? 0, fixer, startedAt, endAt }));
  return [...history, ...add].slice(-max);
}

/** agentId → { name, total, done, needsWork, failed, redo, avgMs, successRate } */
export function expertStats(history) {
  const m = new Map();
  for (const c of history ?? []) {
    const s = m.get(c.agentId) ?? { name: c.name, total: 0, done: 0, needsWork: 0, failed: 0, redo: 0, ms: 0, timed: 0 };
    s.name = c.name ?? s.name;
    s.total++;
    if (c.status === 'done') s.done++; else if (c.status === 'needs-work') s.needsWork++; else s.failed++;
    s.redo += c.round ?? 0;
    if (c.endAt && c.startedAt != null && c.endAt >= c.startedAt) { s.ms += c.endAt - c.startedAt; s.timed++; }
    m.set(c.agentId, s);
  }
  for (const s of m.values()) { s.avgMs = s.timed ? s.ms / s.timed : null; s.successRate = s.total ? s.done / s.total : 0; delete s.ms; delete s.timed; }
  return m;
}

export function statsLine(s) {
  if (!s?.total) return '';
  const avg = s.avgMs == null ? '' : `, ort ${Math.max(1, Math.round(s.avgMs / 60_000))} dk`;
  return `${s.total} görev, %${Math.round(s.successRate * 100)} başarı, ${s.redo} düzeltme turu${avg}`;
}
