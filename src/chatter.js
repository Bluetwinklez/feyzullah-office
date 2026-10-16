// Dinlenme köşesi sohbeti (saf): ikili gruplar, sırayla konuşma, bağlama göre kısa Türkçe cümleler.
const TYPES = { claude: 'Claude', codex: 'Codex', antigravity: 'agy', api: 'API' };

// UTF-16 birimleriyle sayar: text.length kullananlar için de en fazla 28 karakter.
function shorten(value, limit) {
  const text = String(value ?? '');
  if (text.length <= limit) return text;
  let prefix = '';
  for (const character of text) {
    if (prefix.length + character.length > limit - 1) break;
    prefix += character;
  }
  return `${prefix}…`;
}

function hash(value) {
  let result = 2166136261;
  for (const character of value) {
    result = Math.imul(result ^ character.codePointAt(0), 16777619);
  }
  return result >>> 0;
}

function line(speaker, partner, slot) {
  const choices = speaker.activity === 'resting'
    ? ['Testler yeşil ✓', 'Kahve molası ☕', 'İş tamam, biraz mola.',
      'Son değişiklik de hazır.', 'Bugün iyi ilerledik.']
    : ['Sırada ne var?', 'Yeni görev bekliyorum', 'Bir fikrin var mı?',
      'Biraz soluklanalım.', 'Yeni iş için hazırım.'];
  choices.push('Kahve ister misin?', 'Biraz sohbet edelim.', 'Mola iyi geldi.',
    `${TYPES[speaker.agent] ?? 'Ajan'} burada, işler yolunda.`);
  if (speaker.project && speaker.activity === 'resting') {
    choices.push(`${shorten(speaker.project, 21)} bitti!`);
  }
  if (partner) {
    if (partner.project) choices.push(`${shorten(partner.project, 14)} nasıl gidiyor?`);
    if (partner.name) choices.push(`${shorten(partner.name, 16)}, kahve var mı?`);
  } else {
    choices.push('Telefona bir bakayım.', 'Kendi kendime düşünüyorum.');
  }
  return shorten(choices[hash(`${speaker.key}:${slot}`) % choices.length], 28);
}

/** Deterministik balonlar; girdi dizisi ve ajanlar değiştirilmez. */
export function loungeChatter(agents, now, { period = 6000 } = {}) {
  const lounge = agents.filter((agent) => agent.place === 'lounge')
    .sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const slot = Math.floor(now / period);
  const phase = ((slot % 3) + 3) % 3;
  const result = new Map();
  for (let i = 0; i < lounge.length; i += 2) {
    const first = lounge[i];
    const second = lounge[i + 1];
    if (!second) {
      if (phase === 0) result.set(first.key, { text: line(first, null, slot), to: null });
    } else if (phase !== 2) {
      const [speaker, partner] = slot % 2 === 0 ? [first, second] : [second, first];
      result.set(speaker.key, { text: line(speaker, partner, slot), to: partner.key });
    }
  }
  return result;
}
