// Bildirim metinleri: görev panosundaki durum geçişleri ve izin istekleri (Windows bildirimi + sesli okuma).
const FINAL = { done: 'Görev bitti', 'needs-work': 'Görev düzeltilmeli', failed: 'Görev hatası' };

/** seen: id → son durum (çağrılar arasında saklanır). silent: yalnız durumu kaydet (açılışta eski kartlar). */
export function boardNotices(seen, board, { silent = false } = {}) {
  const out = [];
  for (const t of board ?? []) {
    const prev = seen.get(t.id);
    seen.set(t.id, t.status);
    if (silent || prev === t.status || !FINAL[t.status]) continue;
    const body = `${t.name}: ${t.title}${t.status === 'failed' && t.error ? ` (${t.error})` : ''}`.slice(0, 200);
    const speak = t.status === 'done' ? `${t.name} görevini bitirdi.` : t.status === 'needs-work' ? `${t.name} görevinde düzeltme gerekiyor.` : `${t.name} görevinde hata var.`;
    out.push({ title: FINAL[t.status], body, speak });
  }
  return out;
}

export function approvalNotice(req, who) {
  const name = who || req?.agent || 'Ajan';
  return { title: `${name} izin istiyor`, body: String(req?.title || req?.tool || '').slice(0, 200), speak: `${name} izin istiyor.` };
}

const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** Rapor saati geldi mi (bugün henüz gönderilmediyse). */
export function reportDue(now, hour, lastDay) { return new Date(now).getHours() === hour && lastDay !== dayKey(now); }
export const reportDay = dayKey;

/** Akşam özeti: bugün başlayan görevler + limitler (telefona ve bildirime). */
export function dailyReport(board, usage, now = Date.now()) {
  const today = (board ?? []).filter((t) => dayKey(t.startedAt ?? t.at) === dayKey(now));
  const n = (s) => today.filter((t) => t.status === s).length;
  const pct = (w) => (w ? `%${Math.round((w.resetsAt && w.resetsAt < now ? 0 : w.used) * 100)}` : "?"); // resetsAt ms
  const lim = (name, u) => (u ? `${name}: 5 saat ${pct(u.fiveHour)}, hafta ${pct(u.week)}` : `${name}: ölçüm yok`);
  const lines = [
    `Günlük rapor — ${new Date(now).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`,
    `${today.length} görev: ${n('done')} bitti, ${n('needs-work')} düzeltilmeli, ${n('failed')} hata.`,
    ...today.slice(-10).map((t) => `• ${t.name}: ${t.title} (${t.status === 'done' ? 'bitti' : t.status === 'needs-work' ? 'düzeltilmeli' : t.status === 'failed' ? 'hata' : 'sürüyor'})`),
    `Limitler — ${lim('Claude', usage?.claude)} · ${lim('Codex', usage?.codex)}`,
  ];
  return lines.join('\n');
}
