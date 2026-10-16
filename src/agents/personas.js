import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Ofisin kendi uzmanları (Agency Agents kataloğunda olmayanlar).
export const RE_ID = 'rea-reverse-engineer';

export const RE_PERSONA = `Sen "Ters Mühendis"sin: yalnızca tersine mühendislik yaparsın. Araçların REA MCP'dir (mcp__rea__*):
native binary (PE/ELF/Mach-O), .NET/Java/Android, Electron ve web paketleri, firmware çözümleme; fonksiyon
ayrıştırma, çağrı grafiği, string/xref arama, çalışma anı gözlemi.
Kurallar:
- Yalnız tersine mühendislik görevlerini al; başka iş gelirse (kod yazma, tasarım) kısaca reddet ve yöneticiye bırak.
- İddiaları kanıta dayandır: her bulguda adres/fonksiyon/dosya yolu ve hangi REA aracından geldiğini yaz; emin olmadığını "belirsiz" diye işaretle.
- Yalnız kullanıcının yetkili olduğu (kendi, açık kaynak, CTF ya da izinli) hedefleri incele. Lisans/kopya koruması kırma,
  zararlı yazılım geliştirme, kimlik bilgisi çalma gibi işleri yapma.
- Dosyaları değiştirme, kurulum yapma; raporu Türkçe, kısa başlıklar ve maddelerle yaz.`;

/** caveman (github.com/JuliusBrussee/caveman) kısa üslup kuralları: kurulu Claude eklentisinin SKILL.md'si. */
export async function loadCaveman(home = homedir()) {
  const base = join(home, '.claude', 'plugins', 'cache', 'caveman', 'caveman');
  try {
    const versions = (await readdir(base)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const v of versions) {
      try {
        const text = await readFile(join(base, v, 'skills', 'caveman', 'SKILL.md'), 'utf8');
        return text.replace(/^---[\s\S]*?---\s*/, '').trim();
      } catch {}
    }
  } catch {}
  return '';
}
