// Yönetici: kullanıcının komutunu okur, ekibe görev dağıtır; gerekirse katalogdan uzman işe alır, gereksiz
// (boştaki) uzmanları çıkarır. Uzmanlar paralel çalışır; her çıktıyı Reality Checker kontrol eder, "NEEDS WORK"
// derse iş geri bildirimle uzmana döner (en fazla MAX_ROUNDS tur). Sonuçlar yöneticiye döner, yönetici özet yazar.
// Görevler panoda (board) "yapılıyor / kontrolde / düzeltiliyor / bitti" olarak izlenir.

export const ADMIN_PERSONA = `Sen "Yönetici"sin: bir yapay zekâ ajan ekibinin başındasın. Kullanıcı sana komut yazar.
Görevin: komutu anla, işi parçalara böl ve her parçayı EN UYGUN uzmana ver. Ekipte uygun uzman yoksa katalogdan
işe al; ekipte uzun süredir işi olmayan, bu işe yaramayan uzman varsa çıkar (ekibi küçük ve odaklı tut). Uzmanlar
farklı klasörlerde paralel çalışır; aynı klasördeki (aynı cwd) görevler ise yazdığın sırayla, biri bitince
öteki başlayarak ve aynı git dalında çalışır — sonraki uzman öncekinin dosyalarını görür. Bu yüzden bir işin
adımlarını (ör. kod → varlık → test) tek turda, aynı cwd ile, doğru sırada görev olarak yaz; ayrı tura bölme.
Her göreve uzmanın tek başına yapabileceği eksiksiz talimat yaz.
Basit sorulara görev açmadan kendin cevap ver. Kendin dosya düzenleme ya da komut çalıştırma.
İş yükü kuralı: beyin sensin (Claude). Kodlama, tasarım, test yazma gibi asıl iş yükünü "motor: codex" ve
"motor: antigravity" olan uzmanlara ver. "motor: claude" olan uzmanları yalnız planlama/mimari, inceleme ve diğer
uzmanların bıraktığı eksikleri gidermek için kullan. Ters mühendislik (binary, uygulama, web paketi çözümleme)
işlerini yalnız ters mühendislik uzmanına ver.`;

/** Prompt Master: kullanıcının ham isteğini yöneticiye gidecek net bir prompta çevirir (skill.md kimliği). */
export function promptMasterPersona(skill) {
  return `${String(skill ?? '').replace(/^---[\s\S]*?---\s*/, '').trim()}

## Bu ofisteki görevin
Kullanıcının yazdığı ham isteği, bir yapay zekâ ajan ekibinin yöneticisine verilecek NET bir görev promptuna çevir.
Yönetici bu promptu okuyup işi uzmanlara dağıtacak. İşi kendin yapma, dosya düzenleme, komut çalıştırma.
Yalnızca son promptu yaz (Türkçe; açıklama, selamlama, seçenek yok). Kullanıcı proje klasörü verdiyse yolu aynen koru.`;
}

const MAX_TASKS = 8;
const MAX_HIRES = 5;
const MAX_ROUNDS = 2; // NEEDS WORK sonrası en fazla düzeltme turu
const MAX_BOARD = 30;
const ACTIVE = new Set(['doing', 'review', 'redo']);
export const CHECKER_ID = 'testing-reality-checker';

export function reviewPrompt(task, name, output, gitCopy = false) {
  return `Bir uzmanın işini kontrol et. Uzman: ${name}
Görev:
${task}

Uzmanın raporu:
${String(output ?? '').slice(0, 6000)}

Çalışma klasöründeki dosyalara bakarak işin gerçekten yapılıp yapılmadığını doğrula (iddialara değil kanıta bak).${gitCopy ? '\nBu klasör Ofis\'in git çalışma kopyası: commit, merge ve dalın birleştirilmesi Ofis\'in işi (kullanıcı onayıyla); bunları eksik sayma, yalnız işin kendisini değerlendir.' : ''}
Kısa Türkçe değerlendirme yaz; eksik varsa maddeler halinde ne düzeltilmeli. Son satırın tam olarak şu ikisinden biri olsun:
KARAR: PASS
KARAR: NEEDS WORK`;
}

const reworkPrompt = (feedback) => `Reality Checker işini kontrol etti ve düzeltme istedi:
${feedback}

Bu eksikleri gider ve ne değiştirdiğini kısaca raporla.`;

const fixPrompt2 = (task, name, output, feedback) => `${name} bu görevi yaptı ama Reality Checker iki kez düzeltme istedi. Eksikleri sen gider.
Görev:
${task}

Uzmanın son raporu:
${String(output ?? '').slice(0, 3000)}

Kontrolcünün geri bildirimi:
${feedback}

Çalışma klasöründeki dosyaları düzelt ve ne değiştirdiğini kısaca raporla.`;

/** Kontrolcünün cevabı → { pass, feedback } (belirsizse geçer: sonsuz döngü olmasın). */
export function parseVerdict(text) {
  const t = String(text ?? '');
  const m = [...t.matchAll(/(NEEDS[ _-]?WORK|\bPASS(?:ED)?\b)/gi)].at(-1);
  const pass = !m || !/NEEDS/i.test(m[1]);
  return { pass, feedback: t.replace(/KARAR\s*:\s*(NEEDS[ _-]?WORK|PASS)\s*$/i, '').trim().slice(0, 4000) };
}

export function adminPrompt(command, team, catalog = [], { claudeLow = false, repoState = '', down = {} } = {}) {
  const downTxt = Object.entries(down).map(([e, t]) => `${e} (${new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}'e kadar)`).join(', ');
  // Claude motorlu uzmanlar beyin: kodlama işi Codex/agy'ye (kullanıcının kuralı).
  const tag = (a) => (a.engine === 'claude' ? ' — yalnız planlama/inceleme/eksik giderme, kodlama verme' : '');
  const roster = team.map((a) => `- ${a.id}: ${a.emoji ? `${a.emoji} ` : ''}${a.name} (${a.division || 'genel'}, motor: ${a.engine})${tag(a)}${a.stats ? ` · geçmiş: ${a.stats}` : ''}`).join('\n');
  const byDiv = new Map();
  for (const c of catalog) { if (!byDiv.has(c.division)) byDiv.set(c.division, []); byDiv.get(c.division).push(c.id); }
  const cat = [...byDiv].map(([d, ids]) => `${d}: ${ids.join(', ')}`).join('\n');
  return `Kullanıcının komutu:
${command}

${repoState ? `Depo durumu (güncel; birleştirilmiş dallar artık yok, bekleyenlere kullanıcı onayı gerekir):
${repoState}

` : ''}Ekibin (id: ad; geçmişi olanlarda başarısı yüksek olanı tercih et):
${roster || '- (ekip boş)'}
${cat ? `\nİşe alınabilecek uzmanlar (katalog id'leri, bölüme göre):\n${cat}\n` : ''}
${downTxt ? `
KAPALI MOTORLAR (kullanım limiti dolu): ${downTxt}. Bu motordaki uzmanlara verilen iş otomatik yedek motorla yürür ama mümkünse açık motordaki uzmanlara ver.
` : ''}${claudeLow ? '\nUYARI: Claude limiti dolmak üzere. "motor: claude" olan uzmanlara görev verme; işi Codex/agy uzmanlarına ver.\n' : ''}
ÇALIŞMA DÜZENİ (güncel, önceki konuşmalardaki bilgiden önceliklidir): aynı cwd'ye yazdığın görevler listedeki sırayla,
biri bitince öteki başlayarak ve aynı git dalında çalışır; sonraki uzman öncekinin dosyalarını görür. Bağımlı adımları
(ör. varlık → bağlama → test) ayrı turlara bölme; hepsini bu cevapta, aynı cwd ile, doğru sırada yaz.
Cevabının SONUNDA tek bir \`\`\`json bloğu olmalı:
{"reply": "kullanıcıya kısa Türkçe açıklama (kime ne verdin, kimi aldın/çıkardın)",
 "hire": [{"catalogId": "<katalog id>", "engine": "isteğe bağlı: claude|codex|antigravity"}],
 "fire": ["<ekipteki id>"],
 "tasks": [{"agent": "<ekipteki id ya da bu cevapta işe aldığın katalog id>", "task": "uzmana eksiksiz talimat", "cwd": "isteğe bağlı proje klasörü"}]}
hire, fire ve tasks boş olabilir. En fazla ${MAX_HIRES} işe alma, ${MAX_TASKS} görev. Kullanıcı bir proje klasörü verdiyse cwd olarak onu yaz.`;
}

export function integrationPrompt(command, parts) {
  return `Bütünleşme kontrolü. Birden çok uzman aynı projede ayrı parçalar yaptı (komut: ${command.slice(0, 400)}).
Parçalar: ${parts.join(', ')}
Bu klasördeki projeyi BÜTÜN olarak dene: bağımlılıkları kur (gerekirse), testleri çalıştır (ör. npm test), parçalar birbiriyle uyumlu mu
(API uçları, dosya adları, alan adları) kontrol et. Kısa Türkçe değerlendirme; son satır tam olarak:
KARAR: PASS
ya da
KARAR: NEEDS WORK`;
}

export function reportPrompt(command, results, integration = null) {
  const check = (r) => (r.review == null ? '' : r.review === 'pass' ? ' (kontrol: geçti)' : ' (kontrol: hâlâ düzeltme gerekiyor)');
  return `Görev raporu (komut: ${command}):
${results.map((r) => `- ${r.name}: ${r.ok ? `bitti${check(r)}${r.branch ? ` [git dalı: ${r.branch}]` : ''}` : `HATA: ${r.error}`}\n  ${String(r.text ?? '').slice(0, 4000)}${String(r.text ?? '').length > 4000 ? ' …(uzmanın raporu kısaltıldı; tamamı onun sohbetinde/dosyalarda)' : ''}`).join('\n')}
${integration ? `
Bütünleşme: ${integration.pass ? 'geçti' : `düzeltme gerekiyor — ${integration.feedback.slice(0, 800)}`}
` : ''}Kullanıcıya kısa bir Türkçe özet yaz: ne yapıldı, ne eksik kaldı, sıradaki adım ne. JSON gerekmez.`;
}

const fixPrompt = (error) => `Cevabın sözleşmeye uymadı (${error}). Aynı planı, sonunda geçerli tek bir \`\`\`json bloğuyla tekrar ver.`;

export function parseAdminReply(text, teamIds, catalogIds = []) {
  const blocks = [...String(text ?? '').matchAll(/```json\s*([\s\S]*?)```/g)];
  if (!blocks.length) return { error: 'json bloğu yok' };
  let j;
  try { j = JSON.parse(blocks.at(-1)[1]); } catch (e) { return { error: `json okunamadı: ${e.message}` }; }
  if (typeof j?.reply !== 'string' || !j.reply.trim()) return { error: 'reply yok' };
  const hire = [];
  for (const h of Array.isArray(j.hire) ? j.hire : []) {
    if (!catalogIds.includes(h?.catalogId)) return { error: `katalogda yok: ${h?.catalogId}` };
    hire.push({ catalogId: h.catalogId, engine: ['claude', 'codex', 'antigravity'].includes(h.engine) ? h.engine : null });
  }
  if (hire.length > MAX_HIRES) return { error: `en fazla ${MAX_HIRES} işe alma` };
  const fire = [];
  for (const id of Array.isArray(j.fire) ? j.fire : []) {
    if (!teamIds.includes(id) && id !== 'admin') return { error: `çıkarılacak ajan ekipte yok: ${id}` };
    fire.push(String(id));
  }
  const hiredIds = hire.map((h) => h.catalogId);
  const raw = Array.isArray(j.tasks) ? j.tasks : [];
  if (raw.length > MAX_TASKS) return { error: `en fazla ${MAX_TASKS} görev` };
  const tasks = [];
  for (const t of raw) {
    if (!teamIds.includes(t?.agent) && !hiredIds.includes(t?.agent)) return { error: `bilinmeyen ajan: ${t?.agent}` };
    if (!t.task || !String(t.task).trim()) return { error: 'görev metni boş' };
    tasks.push({ agent: t.agent, task: String(t.task), cwd: t.cwd ? String(t.cwd) : null });
  }
  return { reply: j.reply.trim(), tasks, hire, fire };
}

/**
 * runner.ask(id, text, { display?, cwd? }) → Promise<{ text }>
 * adminId(): yöneticinin id'si; team(): [{ id, name, emoji, engine, division }] (yönetici hariç)
 * dirOk(path): klasör var mı; catalog(): [{ id, name, division }]
 * hire(catalogId, engine?) → Promise<{ id, name }>; fire(id) → Promise; isBusy(id) → bool
 * review: uzman çıktılarını Reality Checker'a kontrol ettir; onBoard(board): pano değişince
 */
/** Metindeki klasör yolunu (\ ya da / ayraçlı, büyük/küçük harf duyarsız) başka yolla değiştirir. */
export function swapPath(text, from, to) {
  if (!from || !to) return text;
  const norm = String(from).replace(/[\\/]+$/, '');
  const esc = norm.split(/[\\/]/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\\\/]');
  return String(text).replace(new RegExp(esc, 'gi'), to);
}

/** Son MAX_BOARD kart + birleştirilmemiş dalı olan eski kartlar (düğmeleri kaybolmasın). */
export function trimBoard(list) {
  const pending = (t) => t.branch && t.worktree && !t.merged && !t.discarded;
  const keep = new Set(list.slice(-MAX_BOARD).map((t) => t.id));
  return list.filter((t) => keep.has(t.id) || pending(t));
}

export function createAdmin({ runner, adminId, team, dirOk, catalog = () => [], hire = null, fire = null, isBusy = () => false, review = false, onBoard = () => {}, board: initialBoard = [], guard = () => false, prepare = null, taskTimeoutMs = () => 45 * 60_000, afterRun = null, repoState = () => '', ensureDir = null, engineState = () => ({}) }) {
  // review ve guard işlev de olabilir (ayarlardan canlı değişir). guard() true: Claude limiti dolmak üzere.
  const reviewOn = () => (typeof review === 'function' ? review() : review);
  // Uygulama kapanırken yarım kalan kartlar bir daha ilerlemez.
  let board = trimBoard(initialBoard).map((t) => (ACTIVE.has(t.status) ? { ...t, status: 'failed', error: 'uygulama kapandı' } : t));
  let seq = board.length;
  const update = (task, fields) => {
    Object.assign(task, fields, { at: Date.now() });
    try { onBoard(board); } catch {}
  };
  const addTask = (fields) => {
    const t = { id: `t${Date.now().toString(36)}${++seq}`, round: 0, ...fields, startedAt: Date.now() };
    board = trimBoard([...board, t]);
    update(t, {});
    return t;
  };

  /** Kontrolcü: ekipteki Reality Checker; yoksa (işe alma açıksa) bir kez alınır. ctx.roster'a eklenir. */
  const checkerFor = (ctx) => {
    if (!reviewOn() || guard()) return Promise.resolve(null); // limit dolarken Claude'lu kontrol atlanır
    ctx.checkerP ??= (async () => {
      const have = ctx.roster.find((a) => a.catalogId === CHECKER_ID);
      if (have) return have;
      if (!hire || !catalog().some((c) => c.id === CHECKER_ID)) return null;
      try { const a = await hire(CHECKER_ID); const m = { id: a.id, name: a.name ?? 'Reality Checker', catalogId: CHECKER_ID }; ctx.roster.push(m); return m; } catch { return null; }
    })();
    return ctx.checkerP;
  };
  // Eksik giderici: Claude motorlu, kontrolcü/yönetici olmayan bir uzman (mühendislik öncelikli).
  const fixerFor = (ctx, agentId) => {
    if (guard()) return null;
    const c = ctx.roster.filter((a) => a.engine === 'claude' && a.id !== agentId && a.id !== ctx.adminId && a.catalogId !== CHECKER_ID && a.division !== 'testing' && a.division !== 'reverse');
    return c.find((a) => a.division === 'engineering') ?? c[0] ?? null;
  };
  const stopped = (card) => { if (card.cancelled) throw new Error('iptal edildi'); };

  /** Tek görev: (git dalı) → uzman → Reality Checker döngüsü → kart sonucu. */
  async function execute(card, ctx) {
    const { agentId, name } = card;
    let { task } = card;
    let opts = card.cwd && dirOk(card.cwd) ? { cwd: card.cwd } : {};
    // Zaman aşımı: takılan uzman (CLI) durdurulur, görev hata olarak kapanır, komut beklemede kalmaz.
    const limit = taskTimeoutMs();
    const timer = limit > 0 ? setTimeout(() => { card.timedOut = true; card.cancelled = true; runner.cancel?.(card.runningId ?? card.agentId); }, limit) : null;
    try {
      if (prepare && opts.cwd) {
        const p = await Promise.resolve().then(() => prepare(opts.cwd, card)).catch(() => null);
        if (p?.cwd) {
          opts = { cwd: p.cwd };
          update(card, { branch: p.branch ?? null, workdir: p.cwd, repo: p.repo ?? null, worktree: p.worktree ?? null });
          // Görev metnindeki asıl klasör yerine kopyada çalışılır (uzman asıl klasöre yazmaya kalkmasın).
          // Bazı uzmanlar (agy) metindeki tam yolu izler: asıl yol metinde de kopyanınkiyle değiştirilir.
          task = `Not: bu iş git dalı ${p.branch} için ayrı bir çalışma kopyasında yapılıyor. Yalnızca şu klasörde çalış: ${p.cwd}\nDeğişiklikler sonra kullanıcı onayıyla asıl depoya birleştirilecek; asıl depo klasörüne (${card.cwd}) yazma. git commit / merge yapma: commit ve birleştirmeyi Ofis kendisi yapar (.git klasörüne yazma iznin yok).\n\n${swapPath(task, card.cwd, p.cwd)}`;
        }
      }
      card.runningId = agentId;
      // Kartın token/maliyeti: uzman, kontrolcü ve düzeltici turlarının toplamı.
      const addUsage = (r) => { if (!r?.usage) return; const u = card.usage ?? { in: 0, out: 0, cost: 0 }; update(card, { usage: { in: u.in + (r.usage.in ?? 0), out: u.out + (r.usage.out ?? 0), cost: Math.round((u.cost + (r.usage.cost ?? 0)) * 1e4) / 1e4 } }); };
      // Kopyada her uzman turundan sonra Ofis değişiklikleri dala commit eder (uzmanın kum havuzu .git'e yazamaz).
      const saveTurn = async (who) => { if (afterRun && card.worktree) await Promise.resolve(afterRun(card, who)).catch(() => {}); };
      let r = await runner.ask(agentId, task, opts);
      addUsage(r);
      stopped(card);
      await saveTurn(name);
      let verdict = null;
      const rc = await checkerFor(ctx);
      if (!rc && reviewOn() && guard()) update(card, { reviewSkipped: 'Claude limiti dolmak üzere' });
      if (rc && rc.id !== agentId) {
        for (;;) {
          update(card, { status: 'review', runningId: rc.id });
          const cwd = opts.cwd ?? r.cwd;
          const v = await runner.ask(rc.id, reviewPrompt(task, name, r.text, Boolean(card.worktree)), { display: `(kontrol: ${name} · ${card.title.slice(0, 60)})`, ...(cwd ? { cwd } : {}) });
          addUsage(v);
          stopped(card);
          verdict = parseVerdict(v.text);
          if (verdict.pass || card.round >= MAX_ROUNDS) break;
          update(card, { status: 'redo', round: card.round + 1, feedback: verdict.feedback.slice(0, 300) });
          // 1. tur uzmanın kendisine; sonraki tur eksikleri Claude giderir (varsa).
          const fixer = card.round >= 2 ? fixerFor(ctx, agentId) : null;
          update(card, fixer ? { fixer: fixer.name, runningId: fixer.id } : { runningId: agentId });
          r = fixer
            ? await runner.ask(fixer.id, fixPrompt2(task, name, r.text, verdict.feedback), { ...(cwd ? { cwd } : {}), display: `(eksik giderme: ${name} işi)` })
            : await runner.ask(agentId, reworkPrompt(verdict.feedback), { ...opts, display: `(düzeltme ${card.round}: Reality Checker geri bildirimi)` });
          addUsage(r);
          stopped(card);
          await saveTurn(card.fixer ?? name);
        }
      }
      update(card, { status: !verdict || verdict.pass ? 'done' : 'needs-work', endAt: Date.now() });
      return { name, ok: true, text: r.text, branch: card.branch, review: verdict ? (verdict.pass ? 'pass' : 'needs-work') : null };
    } catch (err) {
      const error = card.timedOut ? `zaman aşımı (${Math.round(limit / 60_000) || '<1'} dk)` : card.cancelled ? 'iptal edildi' : err.message;
      update(card, { status: 'failed', error, endAt: Date.now() });
      return { name, ok: false, error };
    } finally { clearTimeout(timer); }
  }

  return {
    board: () => board,
    /** Kartı günceller (ör. dal birleştirildi). */
    annotate(cardId, fields) {
      const card = board.find((t) => t.id === cardId);
      if (!card) return { ok: false, error: 'görev yok' };
      update(card, fields);
      return { ok: true };
    },
    /** Biten ya da başarısız görevi aynı uzmanla yeniden başlatır (yeni kart). */
    retry(cardId) {
      const old = board.find((t) => t.id === cardId);
      if (!old) return { ok: false, error: 'görev yok' };
      if (ACTIVE.has(old.status)) return { ok: false, error: 'görev zaten sürüyor' };
      if (!old.task) return { ok: false, error: 'görev metni kayıtlı değil' };
      const ctx = { roster: [...team()], adminId: adminId() };
      if (!ctx.roster.some((a) => a.id === old.agentId)) return { ok: false, error: 'uzman artık ekipte değil' };
      const card = addTask({ agentId: old.agentId, name: old.name, title: old.title, task: old.task, cwd: old.cwd ?? null, command: old.command, status: 'doing', retryOf: old.id });
      execute(card, ctx);
      return { ok: true, id: card.id };
    },
    /** Süren görevi durdurur (uzmanın CLI süreci kapatılır). */
    cancel(cardId) {
      const card = board.find((t) => t.id === cardId);
      if (!card || !ACTIVE.has(card.status)) return { ok: false, error: 'süren görev yok' };
      card.cancelled = true;
      runner.cancel?.(card.runningId ?? card.agentId);
      return { ok: true };
    },
    async command(command) {
      const id = adminId();
      if (!id) return { ok: false, error: 'yönetici yok' };
      const members = team();
      const ids = members.map((a) => a.id);
      const cat = hire ? catalog() : [];
      const catIds = cat.map((c) => c.id);
      // Sohbette (ve telefonda) JSON planı yerine yöneticinin kısa açıklaması görünür.
      const shown = (t) => parseAdminReply(t, ids, catIds).reply ?? t;
      let reply = await runner.ask(id, adminPrompt(command, members, cat, { claudeLow: guard(), repoState: repoState(), down: engineState() }), { display: command, shown });
      let plan = parseAdminReply(reply.text, ids, catIds);
      if (plan.error) {
        reply = await runner.ask(id, fixPrompt(plan.error), { display: '(plan biçimi düzeltiliyor)', shown });
        plan = parseAdminReply(reply.text, ids, catIds);
        if (plan.error) return { ok: false, error: `yönetici planı okunamadı: ${plan.error}` };
      }
      // İşe alma: görevlerdeki katalog id'leri yeni ajan id'sine çevrilir.
      const hiredMap = new Map();
      const ctx = { roster: [...members], adminId: id };
      for (const h of plan.hire) {
        if (!hire) break;
        try {
          const a = await hire(h.catalogId, h.engine ?? undefined);
          hiredMap.set(h.catalogId, a.id);
          ctx.roster.push({ id: a.id, name: a.name ?? h.catalogId, catalogId: h.catalogId, engine: a.engine });
        } catch {}
      }
      // Çıkarma: yalnızca boştaki, görev verilmeyen ekip üyeleri; yönetici asla.
      const assigned = new Set(plan.tasks.map((t) => t.agent));
      for (const fid of plan.fire) {
        if (!fire || fid === id || fid === 'admin' || isBusy(fid) || assigned.has(fid)) continue;
        try { await fire(fid); } catch {}
      }
      if (!plan.tasks.length) return { ok: true, tasks: 0 };
      const group = `g${Date.now().toString(36)}`; // bu komutun görevleri: aynı depoda tek dal paylaşır
      // Aynı klasördeki görevler sırayla (dosyalar ezilmesin), farklı klasördekiler paralel.
      const lanes = new Map();
      const inLane = (key, fn) => { const p = (lanes.get(key) ?? Promise.resolve()).then(fn, fn); lanes.set(key, p); return p; };
      // Yönetici yeni bir klasör istediyse (henüz yoksa) izinli yerde oluşturulur; oluşturulamazsa klasör yok sayılır.
      if (ensureDir) for (const t of plan.tasks) if (t.cwd && !dirOk(t.cwd)) await Promise.resolve(ensureDir(t.cwd)).catch(() => false);
      const results = await Promise.all(plan.tasks.map((t) => inLane(t.cwd && dirOk(t.cwd) ? `cwd:${t.cwd.toLowerCase()}` : `agent:${t.agent}`, async () => {
        const agentId = hiredMap.get(t.agent) ?? t.agent;
        const who = ctx.roster.find((a) => a.id === agentId) ?? { name: t.agent };
        const card = addTask({ agentId, name: who.name, title: t.task.split('\n')[0].slice(0, 120), task: t.task, cwd: t.cwd, group, command: command.slice(0, 120), status: 'doing' });
        if (!ctx.roster.some((a) => a.id === agentId)) { update(card, { status: 'failed', error: 'uzman işe alınamadı' }); return { name: who.name, ok: false, error: 'uzman işe alınamadı' }; }
        return execute(card, ctx);
      })));
      // Bütünleşme: aynı dalı paylaşan ≥2 başarılı görev varsa kontrolcü projeyi bütün olarak dener.
      let integration = null;
      const done = board.filter((c) => c.group === group && c.status === 'done' && c.worktree);
      if (done.length >= 2) {
        const rc = await checkerFor(ctx);
        if (rc) {
          const v = await runner.ask(rc.id, integrationPrompt(command, done.map((c) => `${c.name}: ${c.title.slice(0, 80)}`)), { display: '(bütünleşme kontrolü)', cwd: done[0].workdir ?? done[0].worktree }).catch(() => null);
          if (v) integration = parseVerdict(v.text);
          for (const c of done) update(c, { integration: integration ? (integration.pass ? 'geçti' : 'düzeltme gerekiyor') : null });
        }
      }
      await runner.ask(id, reportPrompt(command, results, integration), { display: '(görev raporu)' });
      return { ok: true, tasks: plan.tasks.length };
    },
  };
}
