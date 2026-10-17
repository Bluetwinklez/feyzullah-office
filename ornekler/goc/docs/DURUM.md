# Durum — AŞAMA 4 belgeleri tamamlandı (yayın öncesi açık işler aşağıda)


## Proje tamamlandı — özet

2026-10-16 itibarıyla TASARIM §15'teki dört aşamanın kapsamı uygulandı. "Tamamlandı" yalnız aşağıda doğrulandı denen şeyler için geçerlidir. Açık işler bu bölümün sonundadır.

### Aşamalar

| Aşama | Kapsam | Doğrulama |
|---|---|---|
| 1 — Beş dakikalık çekirdek | Avlu, hareket, sabit açılı kamera, 3 vuruşluk saldırı, kaçınma, Avcı, Yankı Kesesi taraması, Kırılgan Duvar, HUD, duraklatma. Krea GLB/PNG/MP3 bağlandı | 19 test; EXE başsız ve pencereli açıldı (2026-10-15) |
| 2 — Ayırt edici karar | Merkez, Taşıyıcı nefesi, Bağ Düzeneği ekranı, onaylı geri alınabilir aktarma, kalıcı Derin Geçit mührü, kayıt sistemi (atomik yazma, `.bak`, kurtarma), ana menü | +16 test; EXE başsız açıldı |
| 3 — Tam macera | Koridor, Kuyu Salonu, Derin Geçit, Çekirdek Odası, Sis Cebi; Ağır, Püskürtücü, son karşılaşma; Soluk Çekirdeği, Nefes Kesesi, Hazırlık Tezgâhı, Kehribar, ölüm/kaynak kaybı, M0–M6, Son Yolculuk, bitiş ekranı, kayıt sürümü 2, 12 olaylı yerel günlük | +16 test (K1–K7 dahil); `--main-pack` ile paket açıldı |
| 4 — Doğrulama ve teslim | Ayarlar ekranı, K8 başsız kabul testi, performans notu (`PERFORMANS.md`), README görselleri, README, LICENSE, varlık lisans bölümü, gizli bilgi taraması | Toplam **60 geçti, 0 başarısız** (2026-10-16, bu adımda yeniden çalıştırıldı) |

### Bilinen eksikler

- **K8 EXE pencereli koşusu doğrulanmadı.** `build/GOC.exe --quit-after 300` bu ortamda onay istedi, onay verilmedi. Paket yalnız `godot --headless --main-pack build/GOC.exe` ile doğrulandı.
- **Performans yalnız yazılım çiziminde (WARP) ölçüldü.** Gerçek GPU'da FPS bilinmiyor. Mekân geçişlerinde 0,6–1 sn takılma var (`PERFORMANS.md`).
- **ObjectDB uyarıları:** başsız test ve `bitis` kaydı kapanışında 4 ObjectDB sızıntı uyarısı; `son_karsilasma` kaydında 2 ObjectDB ve `ERROR: 1 resources still in use at exit`. Kapanış anı kaynak yaşam döngüsü sorunudur; kaynağı `--verbose` ile bulunmadı.
- **KARARLAR.md'deki varsayımlar** belgede değeri olmayan sayılar için seçildi: oda yerleşimleri ve kapı koordinatları, belirtilmeyen düşman hız/menzil/mermi değerleri, son karşılaşma tetik yarıçapı (9 m), ganimet miktarları (Avcı 2, Ağır 4, Püskürtücü 2), şişe iyileştirmesi (40), sis hasarı (12 / 1 sn), kaynak kaybında yukarı yuvarlama, ayarlardaki çözünürlük listesi ve lineer ses birimi. Oyuncu testiyle sınanmadılar.
- **Belgeden bilinçli sapmalar** (KARARLAR.md): renderer Forward+/Mobile yerine `gl_compatibility`; sesler `.ogg|wav` yerine MP3.
- **Doğrulanmamış maddeler:** gerçek pencerede tam ekran/çözünürlük değişimi; hoparlörden ses kalitesi ve `nefes.mp3` döngü dikişi (VDS'de ses aygıtı yok); model ön yönlerinin gözle kontrolü (kısmen kayıt karelerinde); gerçek kullanıcı `user://` dizininin yazılabilirliği; gerçek oyuncuyla oyun hissi ve 15–20 dk hedef süresi.
- **Varlık lisansı:** Krea koşullarının ticari kullanım, plan bağlılığı, atıf ve yeniden dağıtım maddeleri `[DOĞRULANMALI]` (VARLIKLAR.md → Lisans).
- **Godot uzmanına devredilen tarama bulgusu:** aşağıdaki "Gizli bilgi taraması — Godot uzmanına devir" bölümü.

### Sonraki adımlar

1. Gerçek GPU'lu bir Windows makinesinde `build/GOC.exe`'yi pencereli çalıştır; `PERFORMANS.md`'deki ölçüm komutunu yeniden koş.
2. Reality Checker denetimi: README'deki komutları temiz bir kopyada uygula; K1–K8 ve iddiaları bağımsız doğrula.
3. Yayın öncesi lisans doğrulaması: VARLIKLAR.md'deki her `[DOĞRULANMALI]` maddesini Krea'nın güncel koşulları ve hesap planıyla kapat. Varlıkları açık depoda yayımlamak uygun değilse depo dışında tutma kararı ver.
4. Git geçmişindeki yerel yollar ve commit e-postaları için yayın kararı ver (aşağıdaki tarama). Geçmiş bu adımda değiştirilmedi.
5. `.gitattributes`, `.gitignore` ve CI yapıldı (AŞAMA 4 (4)). Açık kalanlar: temiz kopya denetimi ve EXE pencereli koşusu onay bekliyor; CI ilk koşusu GitHub'da görülmeli.
6. ObjectDB kapanış uyarısının kaynağını bul; geçiş takılması için ön yükleme düşün.


## AŞAMA 4 — İlerleme

### (4) Son kontrol — 2026-10-16

Dal: `ofis/gmvau8i5e`. Commit, remote, push ve geçmiş yeniden yazma yapılmadı. Değişiklikler `git add -A` ile index'e alındı (commit Ofis'te).

#### Gizli bilgi devri

Teknik yazarın devrinde kod/sahne/yapılandırma bulgusu yoktu. `git ls-files` üzerinde tekrar tarandı (`.md` ve ikililer dışı): sürücü harfli yol, `/c/Users`, `Administrator`, e-posta, `sk-`/`ghp_`/`github_pat_`/`api_key`/`password`/`secret`/`token=`/`Bearer`. **Bulgu yok; kod değişikliği gerekmedi.** Belgelerde kalan tek mutlak yol `AGENTS.md:14` (izinli istisna).

#### Satır sonları

- Yeni `.gitattributes`: `* text=auto eol=lf`. `*.gd *.gdshader *.tscn *.tres *.cfg *.import *.uid *.csv *.md *.json *.yml project.godot LICENSE .gitignore .gitattributes` → `text eol=lf`. `*.png *.jpg *.glb *.mp3 *.wav *.ogg *.ttf *.otf *.translation *.exe *.pck` → `binary`.
- Renormalize öncesi çalışma ağacı temizdi; bekleyen içerik değişikliği yoktu.
- `git add --renormalize .` → **0 dosya değişti**. Index zaten LF'ydi: `git ls-files --eol` 180 `i/lf`, 44 `i/-text` (ikili), 1 `i/none` (boş `.gdignore`), 0 `i/crlf`. `git diff --cached -w --ignore-cr-at-eol --stat` boş.

#### .gitignore ve izlenen dosyalar

- Eklenenler: `kayit.json`, `kayit.json.tmp`, `*.bak`, `ayarlar.cfg`, `olaylar.jsonl`, `test_asama2/`, `test_asama3/`, `test_ayarlar/`, `test_k8/`, `Thumbs.db`, `.DS_Store`.
- Zaten olanlar: `.godot/`, `build/`, `*.tmp`.
- `git ls-files -ci --exclude-standard` boş çıktı: yok sayılması gereken izlenen dosya yok. **`git rm --cached` listesi: boş.**

#### Boyut

İzlenen 225 dosya, toplam 19,5 MB. **50 MB üstü dosya yok**, LFS gerekmiyor.

| Dosya | Bayt |
|---|---|
| `varliklar/gorseller/yanki_ikon.png` | 1.223.425 (en büyük) |
| `varliklar/modeller/avci.glb` | 785.804 |
| `varliklar/modeller/agir.glb` | 780.332 |
| `varliklar/modeller/oyuncu.glb` | 726.980 |
| `varliklar/modeller/puskurtucu.glb` | 706.044 |

#### CI (`.github/workflows/test.yml`)

- `ubuntu-latest`. `Godot_v4.7.2-stable_linux.x86_64.zip`, `github.com/godotengine/godot/releases/download/4.7.2-stable/` adresinden indirilir; sürüm sabit. Aynı sürümün `SHA512-SUMS.txt` dosyasıyla `sha512sum -c` doğrulanır.
- Adımlar: `--headless --path . --import`, ardından `--headless --path . --script res://test/calistir.gd`. Her adımda `set -euo pipefail`; test çıktısı `tee` ile alınır ve `TESTLER: … 0 başarısız` satırı ayrıca aranır.
- Export şablonu ve export adımı yok.
- Pencere/ses: test botu tümüyle başsız. Ses başsızda Dummy sürücüye düşer. A5, başsızda pencere yerine istenen değeri doğrular (önceden de böyleydi).
- **K8 koşullu:** CI'da şablon yok. `--export-pack` başarısız olur ve çıktısında `template` geçerse (`denge.json` → `test_k8.sablon_hatasi`), paket üretme ve `--main-pack` kısmı `test.k8_sablon_yok` notuyla ATLANIR. `export_presets.cfg` ön koşul denetimi yine yapılır.
- `build/GOC.exe` CI'da yoktur; onun `--main-pack` denetimi önceden de `test.k8_exe_yok` notuyla atlanıyordu.
- Yerelde şablon varken davranış değişmez: export başarısızsa test düşer.
- **Şablonsuz davranış yerelde denenemedi:** `APPDATA` değiştirilerek yapılacak deneme komut onayı istedi, onay verilmedi. Paket dışa aktarmanın şablon gerektirip gerektirmediği ve hata metni CI'nın ilk koşusunda görülecek.
- YAML, PyYAML 6 ile ayrıştırıldı: geçerli; 4 adım: Depoyu al / Godot indir / İçe aktar / Testler. Workflow GitHub'da çalıştırılmadı (remote yok, push yasak). 4.7.2 indirme adresi ağdan doğrulanmadı.

#### Temiz kopya

**Yapılamadı — onay gerekli.** `git checkout-index -a --prefix=<%TEMP% altı>/` iki yol biçimiyle denendi (`AppData/Local/Temp/goc-temiz-4/` ve oturum scratchpad'i). İkisi de "This command requires approval" ile durdu; onay verilmedi. Aynı işi başka bir araçla yapmak onay denetimini atlatmak olacağından denenmedi. Geçici kopya oluşmadığı için silinecek kopya da yok.

Yerine çalışma kopyasında yapılanlar:

- `godot --headless --path . --import` → çıkış 0.
- `godot --headless --path . --script res://test/calistir.gd` → **60 geçti, 0 başarısız, çıkış 0** (`build/k8/test4.log`).
- Testlerin kullandığı dosyalar izleniyor ve yeni `.gitignore` kalıplarına takılmıyor (`git ls-files -ci` boş). `build/GOC.exe` isteğe bağlıdır.

Temiz kopya güvencesi bu yüzden dolaylıdır.

#### EXE

- Yeniden export: `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe` → çıkış 0, ERROR/WARNING yok. 140.601.736 bayt, 14:35:52. En yeni izlenen kaynak `data/metinler.csv.import` 14:32:45'te değişti; EXE daha yeni.
- `godot --headless --main-pack build/GOC.exe --quit-after 300` → çıkış 0, ERROR/WARNING yok.
- **`build/GOC.exe --quit-after 300 --log-file build/k8/exe4.log`: onay gerekli, verilmedi; EXE doğrudan çalıştırılmadı.** K8 EXE kısmı hâlâ doğrulanmadı.

#### Git

`git remote -v` boş çıktı. Push yapılmadı. HEAD `51b2dfe`; yeni commit yok.

#### Dosyalar

- Eklenen: `.gitattributes`, `.github/workflows/test.yml`.
- Değişen: `.gitignore`, `test/k8.gd` (şablon yoksa koşullu atlama), `data/denge.json` (`test_k8.sablon_hatasi`), `data/metinler.csv` (`test.k8_sablon_yok`), üretilen `data/metinler.tr.translation`, `docs/DURUM.md`.


### (3) GitHub hazırlığı — 2026-10-16

Dal: `ofis/gmvau8i5e`. Yalnız belge dosyaları yazıldı. `.gd`, `.tscn`, `project.godot`, `.gitattributes`, `.gitignore` ve CI dosyalarına dokunulmadı. Commit, remote, push ve geçmiş yeniden yazma yapılmadı.

#### Dosyalar

- Eklenen: `README.md`, `LICENSE` (MIT, "Copyright (c) 2026 GÖÇ geliştiricileri").
- Değişen: `docs/VARLIKLAR.md` (en üste "Lisans" bölümü; bir satırda yerel yol genelleştirildi; "ticari kullanıma izin veren plan" ifadesi `[DOĞRULANMALI]` işaretlendi), `docs/DURUM.md` (bu bölüm, üst özet, yerel yolların genelleştirilmesi).

#### README bölümleri

Oyun tanıtımı · ekran görüntüleri (`docs/ekran/` altındaki 3 PNG, göreli yol ve alt metin) · kontroller (`project.godot` `[input]` ile birebir; Ayarlar ve Escape dahil) · sistem gereksinimi · editörde açma · testleri çalıştırma · Windows dışa aktarma · klasör yapısı · varlık kaynakları · lisans · English summary. README'de mutlak yerel yol ve AGENTS.md'deki yerel araç yolu yoktur.

Kontrol tablosu kaynağı: `ileri`=W(87), `geri`=S(83), `sol`=A(65), `sag`=D(68), `kacin`=Space(32), `organ_kullan`=Q(81), `etkilesim`=E(69), `duraklat`=Escape(4194305), hepsi `physical_keycode`; `saldir`=fare `button_index` 1.

#### Krea kullanım koşulları

`https://www.krea.ai/terms` WebFetch ile açıldı (2026-10-16). Başlık "Terms of Use | Krea"; tarih yok. `https://www.krea.ai/terms-of-use` aynı metni verir. Çıktı sahipliği, ticari kullanım, plan bağlılığı, atıf, yeniden dağıtım ve alt model koşulları `[DOĞRULANMALI]` olarak işaretlendi. Uydurma lisans iddiası yazılmadı.

#### Gizli bilgi taraması

Aranan kalıplar: `sk-`, `ghp_`, `gho_`, `github_pat_`, `xox?-`, `Bearer`, `api_key`, `apikey`, `token=`, `password`, `secret`, `AKIA…`, özel anahtar başlığı; e-posta adresi; `C:\Users`, `C:/Users`, `/c/Users`, `Administrator`, ek olarak sürücü harfli tüm yollar.

**İzlenen dosyalar** (`git ls-files`, 223 dosya; ikili dosyalar metin olarak taranmadı):

| Bulgu | Yer | İşlem |
|---|---|---|
| API anahtarı / jeton / parola | — | Bulunmadı |
| E-posta adresi | — | Bulunmadı |
| Krea indirme aracının yerel yolu (Windows kullanıcı klasörü altında, `…/tools/krea-indir.mjs`) | `AGENTS.md:14` | **İstisna:** geliştirme notu olarak kalır (görev kararı). Yayımlanırsa yerel kullanıcı adı ve klasör düzeni görünür |
| Ajan oturum klasörünün yolu (kullanıcı klasörü altında `.claude/projects/…/tool-results`) | `docs/VARLIKLAR.md:246` (değişiklik öncesi satır) | Genel ifadeye çevrildi |
| Godot editör ayarlarının yolu (kullanıcı klasörü altında `AppData/Roaming/Godot`) | `docs/DURUM.md:785–786` (değişiklik öncesi satırlar) | `%APPDATA%` ile kısaltıldı, not düşüldü |
| Godot motorunun yerel kurulum yolu (`godot.cmd`) | `docs/DURUM.md:398, 677, 743` (değişiklik öncesi satırlar) | "PATH'teki `godot`" olarak genelleştirildi |
| Krea indirme betikleri, günlükler | — | Depoda izlenen `.js/.mjs` betiği ve günlük dosyası yok (`build/` Git dışı) |
| Krea URL'leri (`gen.krea.ai`, `app-uploads.krea.ai`) | `docs/VARLIKLAR.md`, 62 adres | Gizli bilgi değil; genel erişimli bağlantılar. VARLIKLAR.md → Lisans bölümünde not edildi |

Taramadan sonra izlenen belgelerde kalan tek mutlak yerel yol `AGENTS.md:14`'tür.

**Git geçmişi** (`git log --all`, 40 commit; geçmiş değiştirilmedi):

| Bulgu | Commit | Dosya | Not |
|---|---|---|---|
| API anahtarı / jeton / parola | — | — | Hiçbir commit'te bulunmadı (`git log -G`) |
| Yerel araç yolu | `29d66be` | `AGENTS.md` | HEAD'de de duruyor (istisna) |
| Ajan oturum klasörü yolu | `38a788d` | `docs/VARLIKLAR.md` | HEAD'den kaldırıldı; geçmişte kalır |
| Editör ayarları yolu ve yerel motor yolu | `121c4a4` (ve sonraki DURUM sürümleri) | `docs/DURUM.md` | HEAD'den kaldırıldı; geçmişte kalır |
| Silinmiş dosya | — | — | Geçmişte silinen dosya yok; bütün geçmiş dosyaları HEAD'de |
| Commit yazarı e-postaları | 35 commit | — | `Feyzullah Ofis <ofis@localhost>` (yazar ve işleyen) |
| Commit yazarı e-postaları | 5 commit: `29d66be`, `1712209`, `43c1302`, `77cb036`, `eb7f65d` | — | Kişisel bir gmail adresi (yazar ve işleyen; adres bu belgeye yazılmadı, `git log --format='%h %ae'` ile görülür). Depo yayımlanırsa görünür; yayın öncesi karar gerekir |

#### Gizli bilgi taraması — Godot uzmanına devir

Kod, sahne ve yapılandırma dosyalarında (`.gd`, `.tscn`, `.tres`, `.cfg`, `project.godot`, `.import`, `.json`, `.csv`) bulgu **yok**. Devredilecek dosya:satır yok. Tek açık nokta yapılandırma değil belge: `AGENTS.md:14` yerel araç yolu (istisna).

#### Doğrulama

```text
godot --headless --path . --import                         → çıkış 0  (build/gh3-import.log)
godot --headless --path . --script res://test/calistir.gd  → çıkış 0  (build/gh3-test.log)
AŞAMA 1: 19 · AŞAMA 2: 16 · AŞAMA 3: 16 · AYARLAR: 8 · K8 (export): 1
TESTLER: 60 geçti, 0 başarısız
```

Bu adımda export yapılmadı; kod değişmedi. README'deki ekran görüntüsü alt metinleri PNG'ler açılarak yazıldı.

#### Belge çelişkileri

- TASARIM §12 Forward+/Mobile der; proje `gl_compatibility` kullanır (KARARLAR 2026-10-15). README buna göre yazıldı.
- Genel ajan talimatındaki örnek `build/Oyun.exe` ile TASARIM §12/§14 ve `export_presets.cfg`'deki `build/GOC.exe` çelişir. Belgeye uyuldu: `build/GOC.exe`.
- Görev README'de "OpenGL 3.3 ya da ANGLE" ister. Bu makinede yerel OpenGL 3.3 yoktu, yalnız ANGLE yolu çalıştırıldı. Yerel OpenGL 3.3 yolu doğrulanmadı.
- Görev Krea'yı "görsel, 3B ve ses varlıklarının" kaynağı olarak yazdırır. Oda geometrisi, taş shader'ı ve yedek sesler kodla üretilir; README bunu ayrıca belirtir.


### (1) Ayarlar — 2026-10-16

Dal: `ofis/gmvau8i5e`. Commit/merge yapılmadı; Ofis yapar.

#### Dosyalar

- Eklenen: `betikler/AyarlarEkrani.gd` (panel), `betikler/KameraSarsintisi.gd` (tek sarsıntı noktası), `test/ayarlar.gd` (8 deneme).
- Değişen: `autoload/Ayarlar.gd` (ConfigFile yükle/kaydet/uygula, `ayar_yolu`), `betikler/Hud.gd` (duraklatma menüsüne Ayarlar düğmesi, odak), `betikler/Oyuncu.gd` (hasarda `KameraSarsintisi.sars`), `arayuz/tema.tres` (HSlider ve PopupMenu stilleri), `data/denge.json` (`ayarlar`), `data/metinler.csv` (`menu.ayarlar`, `ayarlar.*`, `test.ayar_*`), `test/senaryolar.gd`, `test/calistir.gd`.

#### Akış

- Escape → duraklatma menüsü (odak Devam'da) → Ayarlar. Değişiklik anında uygulanır ve `Ayarlar.ayar_yolu`'na (varsayılan `user://ayarlar.cfg`) kaydedilir. Kayıt başarısızsa panelde `ayarlar.kayit_hatasi` görünür.
- Kapat düğmesi ya da Escape paneli kapatır, duraklatma menüsüne döner (odak Ayarlar düğmesinde); oyun duraklatılmış kalır.
- Klavye: ok tuşları/Tab ile gezinme, sürgüde sol/sağ; fare de çalışır. Odak ortak temanın amber `Odak` kutusu, sürgüde amber `grabber_area_highlight`. Yerel stil geçersiz kılması yok; gövde yazısı tema `Govde`/varsayılan 26 px (1920×1080 viewport).
- Açılışta `Ayarlar._ready` dosyayı okur ve uygular.

#### Ayar anahtarları (`ayarlar.cfg`, bölüm `[ayarlar]`) ve varsayılanlar (`denge.json` → `ayarlar`, tek yer)

| Anahtar | Tür | Varsayılan | Uygulama |
|---|---|---|---|
| `ses_duzeyi` | float 0..1 (lineer) | 1.0 | Master bus `linear_to_db`; 0'da bus susturulur. Sürgü adımı `ses_adim` 0,05 |
| `sarsinti` | bool | true | `KameraSarsintisi.sars()` kapalıyken hiçbir şey yapmaz; sürerken kapanırsa ofset sıfırlanır |
| `tam_ekran` | bool | false | `WINDOW_MODE_FULLSCREEN` / `WINDOWED` |
| `cozunurluk` | Vector2i | 1152×648 | Pencere modunda `window_set_size` + ortalama. Liste `cozunurlukler`: 1152×648, 1280×720, 1600×900, 1920×1080, 2560×1440 |

Geçersiz tür, aralık dışı ses (sıkıştırılır) ya da listede olmayan çözünürlük o anahtar için varsayılana düşer. Sarsıntı gücü/süresi `sarsinti_guc` 0,12 / `sarsinti_sure` 0,25 sn.

#### Testler (`test/ayarlar.gd`)

A1 kaydet→yükle aynı · A2 eksik dosya → varsayılan · A3 dört bozuk içerik (çökme yok, varsayılan) · A4 eksik/yanlış türde/geçersiz anahtar → yalnız o anahtar varsayılan · A5 Master bus dB ve susturma, pencere modu/boyutu · A6 sarsıntı kapalıyken kamera `h_offset/v_offset` değişmez ve düğüm oluşmaz; açıkken değişir; yarıda kapatınca sıfırlanır; `betikler/` içinde ofseti yalnız `KameraSarsintisi.gd` yazar · A7 duraklatma → Ayarlar → Escape dönüşü, odak, tema/yazı boyu, değişikliğin dosyaya yazılması · A8 gerçek `user://ayarlar.cfg` değişmedi, test klasörü silindi.

Testler `res://build/test_ayarlar/<rastgele>/ayarlar.cfg` kullanır ve sonunda siler; ardından `ayar_yolu` geri alınıp gerçek ayarlar yeniden okunur (yazılmaz).

**Başsız sınır:** headless DisplayServer pencere modunu/boyutunu uygulamaz; A5 bu durumda `Ayarlar.istenen_pencere_modu` ve `istenen_boyut`'u doğrular ve bunu çıktıda not eder. Gerçek pencerede tam ekran/boyut bu adımda çalıştırılıp gözle doğrulanmadı.

#### Sonuç

```text
godot --headless --path . --import            → hatasız
godot --headless --path . --script res://test/calistir.gd
AŞAMA 1: 19 geçti - 0 başarısız
AŞAMA 2: 16 geçti - 0 başarısız
AŞAMA 3: 16 geçti - 0 başarısız
AYARLAR: 8 geçti - 0 başarısız
TESTLER: 59 geçti, 0 başarısız                → çıkış kodu 0
```

Günlükteki iki `ERROR: ConfigFile parse error ...test_ayarlar...` satırı A3'ün kasıtlı bozuk dosyalarından gelir. Export bu adımda yapılmadı.

Testte bulunan hata: ek Ayarlar düğmesi duraklatma panelini uzatıp HUD'daki iyileşme düğmesiyle çakıştırdı (K7 yakaladı). Devam ve Ayarlar yan yana dizildi; panel yüksekliği değişmedi.


### (2) Kabul ve performans — 2026-10-16

Dal: `ofis/gmvau8i5e`. Commit/merge yapılmadı.

#### K1–K8 durumu (TASARIM §15 kabul listesi)

| Kabul | Test | Durum |
|---|---|---|
| 1 yeni oyundan sona | `test.k1` | GEÇTİ (başsız) |
| 2 ölüp devam | `test.k2` | GEÇTİ |
| 3 kapatıp kayıt yükleme | `test.k3` | GEÇTİ. RAM sıfırlanıp diskten yüklenir; ayrı süreç açılmaz |
| 4 iki organ doğru yerde | `test.k4` | GEÇTİ |
| 5 aktarma ilerlemeyi kilitlemez | `test.k5` | GEÇTİ |
| 6 yan alana girmeden bitiş | `test.k6` | GEÇTİ |
| 7 duraklatma ve yeniden başlatma | `test.k7` | GEÇTİ |
| 8 dışa aktarılan sürüm editörsüz açılır | `test.k8` (yeni, `test/k8.gd`) | **Başsız kısım GEÇTİ. EXE pencereli çalıştırma: doğrulanmadı — onay gerekli** |

K1–K7 değiştirilmedi; adları zaten `K1…K7` içeriyor. `test.k8` şunları denetler:

- `export_presets.cfg`: ad/platform `Windows Desktop`, `export_path=build/GOC.exe`, `embed_pck=true`, `exclude_filter` içinde `test/*`, `build/*`, `docs/*`.
- Test, geçici bir `--export-pack` ZIP üretir. Pakette `test/`, `build/`, `docs/` dosyası olmamalı; `project.binary`, `data/denge.json`, `data/metinler.tr.translation`, ana menü ve `Ayarlar.gdc` bulunmalı.
- Bu paket `--headless --main-pack … --quit-after 300` ile açılır: çıkış 0, günlükte `SCRIPT ERROR`/`Parse Error`/`Failed to load`/`Cannot open` yok.
- `build/GOC.exe` varsa onun gömülü paketi de aynı yolla açılır.
- Geçici klasör (`res://build/test_k8/<rastgele>`) silinir. Değerler `denge.json` → `test_k8`.

#### EXE

- Export: `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe` → çıkış **0**, ERROR/WARNING yok, şablon mevcut. `build/GOC.exe` **140.601.576 bayt**. Günlük `build/k8/export.log`.
- `godot --headless --main-pack build/GOC.exe --quit-after 300` → çıkış **0**, ERROR/WARNING yok (`build/k8/exe-main-pack.log`).
- **`build/GOC.exe --quit-after 300` (doğrudan, pencereli): çalıştırılamadı.** Komut iki biçimde denendi: yönlendirmeli ve `--log-file build/k8/exe.log` ile. İkisi de "This command requires approval" ile durdu; onay verilmedi. Başka yolla (ör. Godot içinden `OS.execute`) atlatılmadı. **K8 EXE kısmı: doğrulanmadı — onay gerekli.** `build/k8/exe.log` yok.

#### Performans özeti (ayrıntı `docs/PERFORMANS.md`)

- Komut: `godot --path . --script res://test/perf_kosu.gd -- --perf-kosu --perf-etiket=editor`. Yalnız debug ve açık argümanla çalışır; `test/` release paketine girmez.
- Koşu: K1 akışı pencereli ve gerçek çizimle oynatılır; V-Sync kapalı, `time_scale` 1. Akış tamamlandı, çıkış 0, SCRIPT ERROR yok.
- Editör ikilisi kullanıldı, pencere 1152×648, iç çizim 1920×1080.
- Çizim **Microsoft Basic Render Driver (yazılım, WARP)** ile yapıldı. CPU AMD EPYC-Genoa, 4 çekirdek; RAM 7,8 GiB.
- Genel (1032 kare): ortalama **56,8 ms**, %95 **69,3 ms**, en kötü **996,8 ms** (mekân girişi), 17,6 FPS.
- Mekân ortalamaları: Merkez 85,0 · Avlu 61,5 · Koridor 46,9 · Kuyu 50,6 · Derin Geçit 47,6 · Çekirdek 48,7 · Sis Cebi 64,3 · bitiş 63,8 ms.
- Bellek: statik **41,7 MiB** tepe (süreç tepesi 73,1 MiB), video belleği **160 MiB** tepe. Çizim çağrısı ortalama 21 (tepe 27), çizilen nesne tepe 258, düğüm tepe 183.
- Yazılım çizimi nedeniyle sonuçlar kötümser. Release `GOC.exe` ile ölçüm yapılmadı: ölçüm kodu pakette yok ve EXE'yi çalıştırmak onay istiyor.

#### Ekran görüntüleri (`docs/ekran/`, README için)

Kayıtlar yeniden üretildi (`--write-movie … --fixed-fps 10 --quit-after 60`, asama2/asama3 demoları; üçü de çıkış 0, SCRIPT ERROR yok). Küçültme `test/ekran_kucult.gd` ile yapıldı: `Image.resize` Lanczos, 960 px genişlik (`denge.json` → `ekran_goruntusu`).

| Dosya | Kaynak kare | Boyut | Bayt |
|---|---|---|---|
| `docs/ekran/merkez.png` | `build/kayit/asama2/merkez00000020.png` | 960×540 | 193.757 |
| `docs/ekran/son_karsilasma.png` | `build/kayit/asama3/son_karsilasma00000046.png` | 960×540 | 249.381 |
| `docs/ekran/bitis.png` | `build/kayit/asama3/bitis00000040.png` | 960×540 | 19.924 |

`docs/ekran/.gdignore` eklendi; Godot bu PNG'leri içe aktarmaz.

#### Dosyalar

- Eklenen: `test/k8.gd`, `test/perf_kosu.gd`, `test/perf_olcer.gd`, `test/ekran_kucult.gd`, `docs/PERFORMANS.md`, `docs/ekran/{merkez,son_karsilasma,bitis}.png`, `docs/ekran/.gdignore`.
- Değişen: `test/senaryolar.gd`, `test/calistir.gd` (K8 bağlandı), `data/denge.json` (`test_k8`, `perf_kosu`, `ekran_goruntusu`), `data/metinler.csv` (`test.k8`, `test.k8_exe_yok`, `test.kabul_ozet`), `docs/DURUM.md`, `docs/KARARLAR.md`.

#### Doğrulama

```text
godot --headless --path . --import                         → çıkış 0
godot --headless --path . --script res://test/calistir.gd  → çıkış 0
AŞAMA 1: 19 · AŞAMA 2: 16 · AŞAMA 3: 16 (K1–K7 dahil) · AYARLAR: 8 · K8 (export): 1
TESTLER: 60 geçti, 0 başarısız
```

Günlükler `build/k8/{import,test,export,exe-main-pack}.log`, `build/perf/editor.{json,log}`, `build/kayit/*.log` (Git dışı).

#### Açık işler

- `build/GOC.exe --quit-after 300` doğrudan, pencereli çalıştırılmalı. Bunun için kullanıcı onayı gerekiyor.
- Performansı gerçek GPU'lu makinede yeniden ölçmek gerekiyor.
- Mekân geçişlerinde 0,6–1 sn takılma var (PERFORMANS.md öneriler).


## AŞAMA 3 — İlerleme

### (3) Test, export, kayıt ve belge — 2026-10-16

Dal: `ofis/gmvahymt0`. Commit/merge yapılmadı; Ofis yapar. Motor `4.7.2.stable.official.ed1daf0bf`, renderer `gl_compatibility`.

#### Aşama 3 kapsamı (özet)

- **Mekânlar:** `merkez` ↔ `bolge` (Avlu) ↔ `koridor` ↔ `kuyu_salonu`; `koridor` ↔ `sis_cebi` (yan alan); Avlu ↔ `derin_gecit` (kalıcı mühür açıkken) ↔ `cekirdek_odasi`. Kuyu'dan kırılgan duvar arkasındaki isteğe bağlı kestirme. Her odada koşulsuz Merkez dönüş kapısı. Ayrıntı: (2a–2b).
- **Düşmanlar:** Ağır (80 can / 30 hasar / 1,1 sn hazırlık), Püskürtücü (25 / 12 / 0,8 sn, mermi), mevcut Avcı. Koridor'da 1 Püskürtücü, Kuyu'da 1 Ağır; Derin Geçit'te Çekirdek Odası önünde bir kez tetiklenen son karşılaşma 1 Ağır + 2 Avcı.
- **Sistemler:** Soluk Çekirdeği (5 sn sis kalkanı / 12 sn bekleme), tek oyuncu yuvası, iki organlı Bağ Düzeneği ve onay; Sis Cebi hasarı ve Nefes Kesesi (+1 kalıcı şişe); Hazırlık Tezgâhı; Kehribar ganimeti, şişe iyileşmesi; ölümde o seferin Kehribar'ının %50'si (yukarı yuvarlanır) kaybı; M0–M6 görev makinesi; Son Yolculuk onayı ve bitiş ekranı (süre, ölüm sayısı, Tekrar oyna, Çık); kayıt sürümü 2 ve sürüm 1 taşıma; 12 olaylı yerel günlük. Ayrıntı: (2c–2f).

#### Bu adımda bulunan ve düzeltilen gerçek hatalar

| Hata | Nasıl bulundu | Düzeltme | Testte |
|---|---|---|---|
| Bitiş ekranı Son Yolculuk'un siyah kararmasıyla aynı CanvasLayer katmanında; oyuncu yalnız siyah ekran görüyordu | `bitis` kaydında 30–59. kareler tamamen siyah | `SonYolculuk.gd`: bitiş ekranı `layer + 1` | K1: bitiş görünür ve kararmanın üst katmanında |
| Duraklatma paneli genişliksiz; satır kaydıran ölüm kaybı metni paneli daraltıp "Duraklatıldı"yı kırıyor, HUD şişe satırına biniyordu | `son_karsilasma` kaydında odak kaybıyla açılan menü | `Hud.gd`: panel `hud_genislik` genişliğinde, ekran ortasında; kullanılmayan `duraklat_y` silindi | K7: panel genişliği, tek satır başlık, HUD düğmeleriyle çakışmama. Düzeltme geri alınınca K7 KALDI (`test-kirmizi.log`) |
| `hedef.m3` AŞAMA 2'den kalma "Devam bölgesi sonraki aşamada" | `son_karsilasma` karesi HUD'u | CSV: TASARIM §7 metni "Derin Geçit'ten Çekirdek Odası'na ulaş." | Kayıt karesinde doğrulandı |
| Kayıt kesirli alanları kısaltılmış JSON ile yazıyordu (`sure_sn`, Soluk zamanları) | K3 tam koşuda KALDI | `Kayit.gd`: tam hassasiyetli `JSON.stringify` | K3 |

Test gevşetilmedi. K3'te kesirli alanlarda kalan tek-ULP farkı Godot JSON okuyucusundandır; tam sayılar/bayraklar birebir, kesirliler mevcut `test_tolerans` ile karşılaştırılır (KARARLAR).

#### Kabul 1–7 → test eşlemesi

Yeni `test/asama3.gd` (+ `test/asama3_destek.gd`), `test/calistir.gd` içinden AŞAMA 1 ve 2'den sonra çalışır. Testler gerçek kapı/etkileşim noktalarına `Input` eylemleriyle yürür ve gerçek savaşır. Kayıt ve günlük rastgele `res://build/test_asama3/<kimlik>/` altına yönlenir; sonunda dosyalar silinir, yollar geri alınır (son kontrol: kalıntı 0). Gerçek `user://kayit.json` yolu kullanılmaz. Ayarlar `denge.json`'dan (`test_asama3`, `asama2`, `asama3`) okunur.

| Kabul | Test | Ne sınanır | Durum |
|---|---|---|---|
| 1 | `test.k1` | Yeni oyun → M0…M6 fiziksel akış (Avlu, Koridor, Kuyu, Derin Geçit son karşılaşması, Çekirdek Odası, Sis Cebi + Nefes Kesesi). Son Yolculuk onaysız başlamaz; Taşıyıcı etkileşimi onay penceresi açar, Onayla sonrası bitiş ekranı kararmanın üstünde, süre/ölüm özeti ve iki buton | GEÇTİ |
| 2 | `test.k2` | Sefer içinde gerçek ölüm: Merkez doğumu, tam can, şişeler dolu, Kehribar `ceil(sefer × 0,5)` kadar azalır, ölüm sayısı +1; organlar, görev, geçit, Nefes ve kapasite korunur; tekrar sefere çıkılır | GEÇTİ |
| 3 | `test.k3` | Tüm sürüm 2 alanları diskte ve yüklemede aynen; `.bak` var, `.tmp` yok, `surum=2`; sürüm 1 kaydı güvenle taşınır; bitmiş kayıt bitiş ekranıyla, aynı süre/ölümle açılır | GEÇTİ |
| 4 | `test.k4` | Bağ ekranında organ konumu, iki etki, sonuç bilgisi onaydan önce görünür; onaysız aktarma reddi; Vazgeç durumu korur; Onayla aktarır; 6 yerleşimde sahnede her organın görünen tek kopyası | GEÇTİ |
| 5 | `test.k5` | Geçerli 6 organ yerleşimi (Yankı/Soluk: BB, OB, CB, CO, CC, OC) ayrı oturumdan yüklenip ana yol kapıları + Merkez dönüşü yürünür; mühür kapalıyken Derin Geçit reddi; geçersiz 3 yerleşim (BO, BC, OO) reddedilir ve durumu bozmaz | GEÇTİ |
| 6 | `test.k6` | İkinci tam oyun Sis Cebi'ne girmeden, Nefes Kesesi almadan ve kestirmeyi açmadan M6'ya ulaşır | GEÇTİ |
| 7 | `test.k7` | Bitişte Tekrar oyna → temiz M0 (organlar BULUNMADI, geçit kapalı, Kehribar/ölüm 0); duraklatmada konum ve süre donar, panel okunur; devamda hareket kaldığı yerden tek adım sürer; 12 olayın tamamı yalnız izinli alanlarla günlükte | GEÇTİ |
| 8 | — | Bu adımın görev listesinde değil; export sonucu aşağıda | — |

#### Test sonucu

`godot --headless --path . --import`: çıkış **0**, SCRIPT/parse hatası yok. `godot --headless --path . --script res://test/calistir.gd`:

| Aşama | Geçen | Kalan |
|---|---|---|
| AŞAMA 1 | 19 | 0 |
| AŞAMA 2 | 16 | 0 |
| AŞAMA 3 | 16 (9 varlık yükleme/ölçü + K1–K7) | 0 |
| **Toplam** | **51** | **0** |

Çıkış kodu **0**. Mevcut 35 test korunur; AŞAMA 3 varlık denemeleri (4 GLB yükleme, 1 MP3, 4 sahne ölçüsü) artık AŞAMA 3 özetinde sayılır. Ayrı `test/kilitlenme.gd`: 2 GEÇTİ, çıkış 0. Günlükler `build/asama3-3/{import,test,test-kirmizi,kilitlenme}.log` (Git dışı).

#### Export

- Şablon mevcut; `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe`: çıkış **0**, günlükte ERROR/WARNING yok.
- `build/GOC.exe`: **140.591.080 bayt**, gömülü PCK. İkilide `res://test/asama3_demo` dizgisi yok; `test/*` filtresi çalışıyor.
- `build/GOC.exe --headless --quit-after 300` bu ortamda komut onayı istedi, onaylanmadı; **EXE'nin kendisi çalıştırılmadı**. Yerine aynı paket `godot --headless --main-pack build/GOC.exe --quit-after 300` ile açıldı: çıkış **0**, ERROR/WARNING yok. Release ikilisiyle duman testi açık iştir.

#### Görsel kayıtlar

Yalnız açık argümanla ve debug build'de çalışan `test/asama3_demo.tscn` (release'ten `test/*` ile dışlı, normal akışı değiştirmez; kendi geçici kayıt/günlük dizinini kullanır, kalıntı 0):

```text
godot --path . --write-movie build/kayit/asama3/kuyu_salonu.png --fixed-fps 10 --quit-after 60 res://test/asama3_demo.tscn -- --asama3-demo=kuyu_salonu
godot --path . --write-movie build/kayit/asama3/son_karsilasma.png --fixed-fps 10 --quit-after 60 res://test/asama3_demo.tscn -- --asama3-demo=son_karsilasma
godot --path . --write-movie build/kayit/asama3/bitis.png --fixed-fps 10 --quit-after 60 res://test/asama3_demo.tscn -- --asama3-demo=bitis
```

Üçü de çıkış **0**, her biri **60 PNG**, 1920×1080, 10 FPS. Çökme, SCRIPT ERROR veya renderer ERROR yok. Renderer satırı (üçünde aynı):

```text
OpenGL API OpenGL ES 3.0 (ANGLE 2.1.1 git hash: aaebda1c5a40) - Compatibility - Using Device: Google Inc. (Microsoft) - ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11-10.0.20348.1)
```

İncelenen kareler:

- `build/kayit/asama3/kuyu_salonu00000030.png`, `…00000059.png`: Kuyu Salonu duvarları, kapı işaretleri, kestirme duvarı, Ağır ve küçük Yankı buluntusu görünür; HUD hedefi M1.
- `build/kayit/asama3/son_karsilasma00000025.png`: iki Avcı'nın sarı hazırlık halkası ve renk değişimi; Ağır arkada.
- `build/kayit/asama3/son_karsilasma00000046.png`: 1 Ağır + 2 Avcı aynı anda hazırlıkta; Ağır'ın büyük halkası ve yeşil-sarı tonu okunur; HUD hedefi düzeltilmiş M3 metni.
- `build/kayit/asama3/bitis00000040.png`, `…00000050.png`: "Yeni bir yol açıldı", "Toplam süre: 120.8 sn — Ölüm sayısı: 2", Tekrar oyna (odaklı) ve Çık butonları.

Kareler ve EXE `.gitignore` gereği Git dışında.

#### Varlıklar

Kullanılan (gerçek dosya): oyuncu, Avcı, Yankı Kesesi, Ağır, Püskürtücü, Soluk Çekirdeği, Nefes Kesesi GLB'leri; Merkez sırt/nefes keseleri/omurga/düzenek GLB'leri; Yankı HUD PNG'si; saldırı, hasar, tarama, etkileşim, sis kalkanı ve nefes MP3'leri. Test çıktısı: `YER TUTUCU: Yok`. Kod içi yedek geometri/PCM yalnız dosya yoksa devreye girer. Prosedürel olanlar: oda geometrisi (kutular), Soluk HUD simgesi, hazırlık halkaları, sis hacmi. Kaynak/lisans `VARLIKLAR.md`'de; bu adımda varlık eklenmedi.

#### Değişen / eklenen dosyalar (bu adım)

- Kod: `autoload/Kayit.gd` (tam hassasiyetli JSON), `betikler/SonYolculuk.gd` (bitiş katmanı), `betikler/Hud.gd` (duraklatma paneli).
- Veri: `data/denge.json` (`test_asama3`, `demo_asama3`; `duraklat_y` silindi), `data/metinler.csv` (`test.k1…k7`, `test.asama3_ozet`, `hedef.m3`), üretilen `metinler.tr.translation`.
- Test: yeni `test/asama3.gd`, `test/asama3_destek.gd`, `test/asama3_demo.{gd,tscn}`; `test/calistir.gd`, `test/senaryolar.gd` (AŞAMA 3 özeti), `test/varliklar.gd` (varlık denemesine aşama etiketi).
- Belge: `docs/DURUM.md`, `docs/KARARLAR.md`.

#### Bilinen hatalar ve açık işler

- `build/GOC.exe` doğrudan çalıştırılmadı (ortam onayı); paket `--main-pack` ile doğrulandı.
- Başsız test ve `bitis` kaydı kapanışında **4 ObjectDB** sızıntı uyarısı; `son_karsilasma` kaydında 2 ObjectDB + `ERROR: 1 resources still in use at exit`. Kapanış anı kaynak yaşam döngüsü sorunudur; çökme/renderer hatası değildir, açık.
- Ortamın `user://logs`, root certificate store ve editor settings erişim hataları ile OpenGL 3.3 → ANGLE uyarısı sürer.
- Movie kaydında pencere odak kaybı oyunu duraklatır (beklenen davranış); demo bunu oyunun `duraklat_degistir` yolu ile kaldırır.
- Başsız testler görsel okunurluğu kanıtlamaz; yalnız incelenen kareler için geçerlidir. Ses kalitesi ve gerçek kullanıcı kayıt dizini yazılabilirliği doğrulanmadı.
- AŞAMA 3 testleri `Engine.time_scale` = `test_asama3.hizlandirma` (3) ile koşar; yürüme/savaş zaman aşımları da `test_asama3` içindedir.

#### Belge çelişkileri

Yeni çelişki yok. TASARIM §15 kabul (8) ve AŞAMA 4 (ayarlar, performans notu, README) bu adımın kapsamında değil.

#### Sonraki adım notları (AŞAMA 4)

- Kabul (8): release `GOC.exe` editörsüz, pencereli ve başsız açılış; README.
- Ayarlar ekranı ve performans notu (§15 madde 4).
- ObjectDB/kaynak sızıntısının `--verbose` ile kaynağını bulma.
- Görsel okunurluk: Yankı buluntusu Kuyu'da küçük kalıyor; yakın planda işaret düşünülebilir (tasarım kararı gerektirir).

### (2c–2f) Organlar, ölüm, görev/son ve günlük — 2026-10-16

Dal: `ofis/gmvahymt0`. Commit/merge yapılmadı. Bu bölüm önceki (2a–2b) açık iş notlarını organlar/ölüm/son, varlıklar ve sefer içi düşman kalıcılığı bakımından günceller. Export, görsel kayıt ve kalıcı AŞAMA 3 kabul testleri sonraki görev kapsamındadır.

Yeni betikler: `OrganGorseli.gd`, `SolukCekirdegi.gd`, `MekanOrganlari.gd`, `SeferDusmani.gd`, `SonYolculuk.gd`, `BitisEkrani.gd` (`betikler/` ve UID dosyaları). Yeni sahneler: `sahneler/soluk_cekirdegi.tscn`, `sahneler/nefes_kesesi.tscn`. Güncellenenler: `autoload/Oyun.gd`, `autoload/Kayit.gd`; AvluGorseli, BagEkrani, BolgeAsama2, Gorev, Hud, Mekan, Merkez, Oyuncu, SonKarsilasma, TasiyiciNefes betikleri; denge/CSV/üretilen çeviri ve DURUM/KARARLAR/VARLIKLAR belgeleri. Test botunun kodu değiştirilmedi. Çalışma sırasında dışarıdan gelen kaynak dosyaları ve Godot'un çıkardığı doku/import dosyaları varlık envanterinde açıklanır.

**Sistemler:** Soluk Çekirdeği Çekirdek Odası'nda alınır. Tek oyuncu yuvası doluysa açıklayıcı ret verilir; otomatik organ aktarılmaz. Q, oyuncudaki organa gider: Yankı taraması veya Soluk'un 5 sn sis kalkanı / 12 sn beklemesi. Soluk süresi ve beklemesi HUD'dadır, sahne geçişinde taşınır, duraklatmada durur. Bağ ekranı iki organı, konumlarını, her iki etkisini ve kazanım/kayıp bilgisini onaydan önce simgeli satırlarla gösterir. Soluk aktarımı da ayrı onay ve Merkez/yakınlık denetimi kullanır. Canlıya Soluk bağlanınca nefes ritmi/sesi/parlaması değişir, mesafe sisi incelir. Geri alınca bu etki kalkar; görev gerilemez ve yolculuk bağlanana kadar reddedilir.

Sis Cebi ana rotadan ayrıdır; hasar yalnız işaretli hacmin XZ sınırları içinde, kalkan yokken 12 / 1 sn uygulanır. Nefes Kesesi yalnız Soluk oyuncudayken bir kez alınır; kalıcı şişe kapasitesi +1 olur. Tezgâh 5 Kehribar karşılığı sonraki sefere +1 şişe verir, en çok +2; çıkışta tüketilir. Düşmanlar doğrudan Kehribar verir (Avcı 2, Ağır 4, Püskürtücü 2). Sefer içi ölü kimlikleri tekrar ganimeti ve oda geçişinde yeniden doğmayı önler; Merkez'den yeni çıkışta sıfırlanır. HUD'da şişe, Kehribar, sonraki sefer hazırlığı ve iyileşme düğmesi vardır; şişe 40 can iyileştirir.

**M0–M6 geçişleri:**

| Önce → sonra | Kabul edilen olay / ek koşul |
|---|---|
| M0 → M1 | Merkez'de Taşıyıcı'yı dinle; `tasiyici_dinlendi` |
| M1 → M2 | Gerçek Kuyu Salonu'nda Yankı al; `yanki_bulundu` |
| M2 → M3 | Merkez'de onaylı Yankı → CANLI; `yanki_baglandi`; kalıcı mühür açılır |
| M3 → M4 | Çekirdek Odası'nda boş oyuncu yuvasıyla Soluk al; `soluk_bulundu` |
| M4 → M5 | Merkez'de onaylı Soluk → CANLI; `soluk_baglandi` |
| M5 → M6 | Taşıyıcı yakınında ayrı Son Yolculuk onayı, Soluk CANLI; `yolculuk_onaylandi` |

Geçersiz/sırasız olaylar reddedilir; aktarmayı geri almak aşamayı geriletmez. Son Yolculuk kendiliğinden başlamaz. Kısa kararma + görsel hareket sonrası bitiş ekranı toplam aktif süreyi ve ölüm sayısını gösterir. Açık Tekrar oyna yeni M0 kaydı başlatır; Çık mevcut güvenli çıkış yöntemini kullanır. Tamamlanmış kayıt yüklenince Merkez'de bitiş ekranı gösterilir.

**Ölüm:** tüm bölge odalarından ve güvenli Merkez örneğinden tam canla Merkez'de yeniden doğulur. O sefer kazanılan Kehribar'ın `kaynak_kayip_orani=0.5` kadarı yukarı yuvarlanarak düşülür; önceki seferlerde bankalanan kaynak korunur. Ölüm sayısı artar. İki organın konumu, görev, açık geçit/kestirme, Nefes Kesesi kapasitesi ve toplam süre korunur. Geçici kalkan/beklemeler temizlenir; şişeler temel + kalıcı kapasiteye dolar. Ölüm geçişle aynı kareye denk gelse de ertelenmiş hedef Merkez olarak düzeltilir. Duraklatma ekranı oranı ve o an kaybedilecek miktarı ölümden önce gösterir.

**Kayıt sürümü 2:** eski alanlara iki organın gerçek konumu, `sise_sayisi`, `hazirlik_artisi`, `sefer_kehribari`, `olum_sayisi`, `sure_sn` ve oyuncunun `soluk_kalan/soluk_bekleme` değerleri eklendi. `nefes_kesesi_alindi` ve `tamamlandi` artık gerçek durumu taşır. Geçerli sürüm 1 önce eski kurallarla doğrulanır, yeni sayaçlar 0, şişe sayısı kapasite, Soluk zamanları 0 olarak taşınır. Geçersiz/eski bilinmeyen sürüm güvenli yedek/yeni oyun seçeneğine gider. Sürüm 2 doğrulaması tek yuva, organ-aşama, kalıcı mühür, M6/tamamlandı, kapasite, sayaç ve sonlu sayı tutarlılığını denetler. Atomik `.tmp` → ad değiştirme ve `.bak` korunur. Güvenli yükleme Merkez'de olduğundan şişe dolar, sefer sayacı sıfırlanır; toplam Kehribar korunur. Yeni oyun eski kaydı açık seçimle atomik değiştirir. Yazma hatası görünür bildirilir; oyun/çıkış kilitlenmez.

**Olaylar:** `oturum_basladi`, `sefer_basladi`, `sefer_dondu`, `ilk_dusman_yenildi`, `organ_bulundu`, `organ_aktarildi`, `organ_kullanildi`, `gecit_acildi`, `kestirme_acildi`, `olum`, `tamamlandi`, `tekrar_oyna`. Önceden eksik son iki olay bağlandı; Soluk bulma/aktarma/kullanma ve yeni düşman ganimetleri mevcut olaylara bağlandı. Eksik kalan olay yok. JSONL yalnız `olay`, `oturum`, `sure_sn`, `ilgili`, `surum` alanlarını taşır. Tamamlanma bir kez, tekrar olayı eski oturumda açık seçimden sonra yazılır; ardından yeni oturum başlar.

**Bölüm 5 kilitlenmeme eşlemesi:**

| Kural | Kodda güvence |
|---|---|
| 1 — Geçit kalıcı | `Oyun.organ_aktar`: yalnız açar; geri aktarım kapatmaz. `kayittan_uygula` açık bayrağı korur. `DerinGecit` ve `yer_degistir` aynı bayrağı okur. |
| 2 — Soluk ana yolu sis dışında | `asama3.mekanlar`: Avlu → Derin Geçit → Çekirdek Odası; Sis Cebi yalnız Koridor yan kolu. `MekanOrganlari` hasarı yalnız `sis_cebi` içinde uygular. |
| 3 — Kestirme isteğe bağlı | Kuyu buluntusu/DonusKapisi duvar dışında; `MekanKapisi.kestirme_gerekli` yalnız KestirmeKapisi'ne uygulanır. |
| 4 — Organ kaybolmaz | `_olumden_don` organlara dokunmaz; `organ_aktar` tek yuva ve onay denetimi yapar. Kayit.dogrula iki organ/aşama tutarlılığı olmadan durumu uygulamaz. |
| 5 — Her zaman Merkez'e dönüş | Her odada koşulsuz DonusKapisi; yalnız Derin/Çekirdek girişleri mühürlü. `_olumden_don/_gec` ölümde Merkez ve tam canı garanti eder. Kayıt yüklemesi de güvenli Merkez'dedir. |

**Public API:** `Oyun.soluk_konumu`, `organ_konumu(organ)`, `organ_aktar(organ, hedef, onay)`; eski `aktar(hedef,onay)` Yankı için korunur. `soluk_bul()`, `nefes_kesesi_al()`, `hazirlan()`, `iyiles()`, `kehribar_kazan(tur,kimlik)`, `olum_kaybi()`, `yolculuga_hazir()`, `yolculuk_baslat(onay)`, `tekrar_oyna()`; okunabilir `nefes_kesesi_alindi`, `sise_sayisi`, `sise_kapasitesi`, `hazirlik_artisi`, `kehribar`, `sefer_kehribari`, `olum_sayisi`, `sure_sn`, `tamamlandi`. `Oyuncu.organ_kullan()`; `oyuncu.soluk.kullan()`, `aktif`, `kalan`, `bekleme`; sinyal `kalkan_acildi(sure: float)`. `Kayit.tasi(veri)`, `dogrula`, mevcut kaydet/yukle; `Gorev` enum M0–M6. Organlar mevcut `organ_aktarildi(organ,konum)`, durum/görev/bilgi sinyallerini kullanır. `SonYolculuk.iste()` gerçek onay penceresini açar.

**Yeni denge anahtarları:** `asama3.ilerleme`: `nefes_kapasite_artis=1`, `hazirlik_bedel=5`, `hazirlik_en_fazla=2`, `sise_iyilestirme=40`, `sis_hasar=12`, `sis_hasar_aralik=1`, `soluk_konum=[0,0,-3]`, `nefes_konum=[0,0,-5]`, `canli_soluk_konum=[4,1,-3]`, `tezgah_konum=[-3,0,3]`, `tezgah_boyut=[1.4,0.8,0.8]`, `saglikli_nefes_periyot=4`, `saglikli_nefes_ses=0.75`, `sis_incelme_carpan=1.6`, `kaynak_kayip_orani=0.5`, `ganimet={avci:2,agir:4,puskurtucu:2}`, `yolculuk_sure=2`, `yolculuk_mesafe=2`; `modeller.{soluk_cekirdegi,nefes_kesesi}`, `renk_soluk`, `renk_nefes`, `ses_sis_kalkani=780`, ilgili ses yolu ve yer tutucu listesi. Soluk 5/12 sn mevcut `asama2` değerlerinden okunur; önceki denge değerleri değiştirilmedi.

**Yeni metinler:** `hedef.m4/m5/m6`, `etkilesim.soluk/nefes/tezgah/yolculuk`, `bilgi.yuva_dolu/hazirlandi`, `bag.soluk_sonuc_canli/soluk_sonuc_oyuncu/tek_yuva`, `hud.soluk/siseler/iyiles`, `menu.olum_kaybi`, `yolculuk.baslik/onay`, `bitis.baslik/ozet/tekrar/cik`. Türkçe CSV ve bölüm başlığı UTF-8 olarak yazıldı.

Eski `bag.soluk_sonuc` ön izleme metnindeki artık geçersiz “bu aşamada bulunamaz” ifadesi gerçek Çekirdek Odası konumuyla güncellendi. HUD, Soluk oyuncudayken Yankı PNG'si yerine prosedürel Soluk simgesini gösterir.

**Varlıklar:** başlangıçta olmayan dört GLB, dört kavram PNG ve iki MP3 son kontrol sırasında çalışma kopyasına dışarıdan geldi. Gerçek Ağır, Püskürtücü, Soluk ve Nefes modelleri artık bağlıdır. Gerçek kalkan ve döngülü nefes MP3'leri de kullanılır; yer tutucu kalan varlık yok, yedek geometri/PCM kodu korunur. Yeni `asama3.ilerleme.nefes_ses_yolu` gerçek nefes dosyasını seçer. `modeller.*.yer_tutucu` ve `yer_tutucu_varliklar` metadata'sı güncellendi; önceki oynanış değerleri değişmedi. Ham AABB'den hesaplanan ölçekler sırasıyla 3,411475 / 2,2 / 0,4 / 0,45; Y dönüşleri +90° / +90° / 0° / 0°, Y offsetleri 1,3 / 1,1 / 0 / 0,225. Ayrıntılar ve kaynak/lisans VARLIKLAR.md'dedir. Bu uzman dosya indirmedi/üretmedi.

**Doğrulama:** Godot `4.7.2.stable.official.ed1daf0bf`. Her alt adımda import ve `godot --headless --path . --script res://test/calistir.gd`: 2c **35/0**, 2d **35/0**, 2e **35/0**, 2f **35/0**; tüm çıkışlar **0**. Mevcut testler değiştirilmedi. Günlükler `build/asama3-2cf/import-2{c,d,e,f}.log` ve `test-2{c,d,e,f}.log`. Script/parse/eksik kaynak hatası yok; kullanıcı dizini/sertifika/editor settings erişim hataları ve mevcut 4 ObjectDB kapanış uyarısı sürüyor.

Geçici, gerçek sahneleri kullanan duman senaryosu (`smoke.log`, çıkış 0) M0→M6, ganimet/tekrar ganimet reddi, tezgâh, tek yuva/onay, kalkan/bekleme/duraklatma, sis hasarı, tek ödül, ölüm/kaynak/organ koruma, şişe, sürüm 1 taşıma, sürüm 2 kaydet/yükle, bitmiş kayıt yükleme ve temiz tekrar akışını doğruladı. 12 olayın tamamı ve yalnız izinli günlük alanları gözlendi. Geçici senaryo teslimde kaldırıldı; kalıcı test kapsamı sonraki görevde genişletilecek.

Gerçek varlıklar geldikten sonraki son import çıkışı **0** (`import-varlik.log`). Yer tutucu istisnaları kaldırılınca mevcut veri güdümlü bot dört model yükleme + dört sahne ölçüsü + kalkan sesi yüklemesini otomatik ekledi: eski 35 deneme korunarak **44 geçti / 0 başarısız**, çıkış **0** (`test-varlik.log`). Nefes MP3 bağlantısı ve loop bayrağı ile tam akış ayrıca `smoke-varlik.log` içinde doğrulandı, çıkış **0**. Model boyları 2,6 / 2,2 / 0,4 / 0,45 m olarak gerçek AABB'den ölçüldü. Kalkan sesi 1,0449 sn; nefes sesi 4,0490 sn. Script/parse hatası yok; çevre erişim hataları ve önceki ObjectDB uyarısı sürer.

**Çelişkiler / açık işler:** yeni tasarım çelişkisi yok; AŞAMA 2'nin geçici kaynak koruma kararı tasarım gereği güncellendi. Belirsiz sayılar ve yukarı yuvarlama KARARLAR.md'de varsayım olarak yazıldı. Görsel/sesli okunurluk, model ön yönü ve nefes döngü dikişi başsız doğrulamayla kanıtlanmadı. Export ve kayıt yapılmadı. Sürüm 1'in önceki ölüm/süre geçmişi bilinmediğinden 0 ile başlatılır.

### (2a–2b) Mekânlar ve düşmanlar — 2026-10-16

Dal: `ofis/gmvahymt0`. Commit/merge yapılmadı. 2c–2f uygulanmadı; AŞAMA 3 tamamlanmış değildir.

**Mekânlar ve bağlantılar:**

```text
merkez.tscn ↔ bolge.tscn (Avlu) ↔ koridor.tscn ↔ kuyu_salonu.tscn
                                  ↕                  ↓ duvar yıkılınca
                              sis_cebi.tscn       Merkez / Rampa
Avlu ↔ derin_gecit.tscn (mühür açıkken) ↔ cekirdek_odasi.tscn
```

Tüm yollar `res://sahneler/` altındadır. Her yeni odanın `DonusKapisi` düğümü doğrudan Merkez'e döner; organ veya görev koşulu yoktur. `Oyun.yer_degistir` mühür kapalıyken Derin Geçit/Çekirdek Odası hedeflerini bilgi satırıyla reddeder. Avlu'daki mevcut `Asama2/DerinGecit` mühür/rota temsili korunur. Gerçek Kuyu buluntusu `KuyuSalonuBuluntusu` düğümündedir; Avlu'daki geçici işaret kaldırıldı. Kuyu'da kestirme duvarı ve iki yan duvar kestirme kapısını çevreler; ana buluntu ve dönüş yolu bundan ayrıdır. Sis Cebi ana rota üzerinde değildir.

Sahne geçişi mevcut `Oyuncu.durum_verisi/durum_uygula` ile canı, kaçınma/tarama beklemelerini taşır. Kese ve görev Oyun'da kalır; ölüm tüm bölge odalarından tam canla Merkez'e döndürür. Mekânlar soğuk ortam/mesafe sisi, gölgesiz yön ışığı ve oyuncu feneri kullanır. Renderer `gl_compatibility` olarak kaldı.

**Düşmanlar ve veriler:**

| Sahne | Can / hasar / hazırlık | Diğer temel değerler |
|---|---|---|
| `sahneler/dusmanlar/agir.tscn` | 80 / 30 / 1,1 sn | hız 1,3; menzil 2,3; darbe sonrası açık 1,2 sn |
| `sahneler/dusmanlar/puskurtucu.tscn` | 25 / 12 / 0,8 sn | hız 1,8; menzil 8; uzak durma 4; mermi hızı 4, ömrü 4 sn |

Yeni anahtarlar: `asama3.mekan` (sınır/sis/kapı görseli); `asama3.avlu_kapilar`; `asama3.mekanlar.{koridor,kuyu_salonu,derin_gecit,cekirdek_odasi,sis_cebi}` (boyut, doğum, kapılar; Kuyu buluntu/duvar/yan duvarlar; Koridor/Kuyu düşman listeleri); `asama3.dusmanlar.{agir,puskurtucu}`; `asama3.son_karsilasma`; `modeller.{agir,puskurtucu}`; `renk_agir`, `renk_puskurtucu`. `yer_tutucu_varliklar` listesine iki eksik GLB eklendi. Önceki oynanış/kamera/görsel değerleri değişmedi.

Metin anahtarları: `etkilesim.{koridor,kuyu_salonu,derin_gecit,cekirdek_odasi,sis_cebi,bolge,kestirme}`, `bilgi.{muhur_kapali,kestirme_kapali}`. Yeni oyun metinlerinin kaynağı CSV'dir; çeviri import ile yenilenir.

Koridor'da bir Püskürtücü, Kuyu'da bir Ağır bulunur. Son karşılaşma Derin Geçit'te, Çekirdek Odası kapısının önündedir: canlı oyuncu `(0,0,-5)` noktasına 9 m yaklaşınca ve kalıcı mühür açıkken 1 Ağır + 2 Avcı bir kez oluşturulur (oda örneği başına). Geri dönüş/çıkış kilidi yoktur. Avcı betiği değiştirilmedi. Yeni düşmanlar görüş hattını, tek vuruş kimliğini, hazırlık halkası + renk + gövde sıkışmasını ve ölümde etkisizleşmeyi uygular. Püskürtücü mermisi fizik hacmi tarayarak ilerler; kaynak ölünce etkisizleşir.

**Varlıklar:** iki yeni GLB dosyası yok; Ağır kutu, Püskürtücü dar gövde/uzun boyun yer tutucusudur. Her sahnede `Model` korunur. GLB bağlayıcıları gerçek AABB ile 2,6 / 2,2 m boy, +90° Y ve taban y=0 için hazırdır; dosya olmadığı için gerçek ölçek/yön ölçülmedi. Mevcut Avcı/oyuncu/Yankı modelleri ve sesler kullanılır. Kaynak/lisans `VARLIKLAR.md` güncel bölümündedir.

**Public API:**

| Sınıf | Metot / okunabilir durum | Sinyaller |
|---|---|---|
| Oyun | `MEKAN_SAHNELERI`, `yer_degistir(hedef) -> bool`, `mekan`; `yanki_bul()` artık gerçek Kuyu'da | Mevcut Olaylar durum/görev/bilgi sinyalleri |
| Mekan | `kimlik`, `oyuncu`, `kamera`, `kapi_ekle(kok, veri) -> MekanKapisi` | — |
| MekanKapisi | `hedef`, `muhur_gerekli`, `kestirme_gerekli`; kalıtılan `erisilebilir`, `etkiles` | Kalıtılan `kullanildi(oyuncu)` |
| YeniDusman | `tur`, `hedef`, `can`, `oldu_mu`, `saldiri_hazirligi_aktif`, `acik_kalan`; `hasar_al(miktar, vurus_kimligi)`, `goruyor_mu()`, `saldiri_baslat() -> bool` | `can_degisti(yeni_can)`, `saldiri_hazirlaniyor`, `oldu` |
| SonKarsilasma | `tetikle() -> bool`, `tetiklendi`, `kalan_dusman` | `basladi`, `temizlendi` |

**Doğrulama:** 2a import çıkış 0; mevcut testler **35 geçti / 0 başarısız**, çıkış **0** (`build/asama3-2/test-2a.log`). 2b ve son import çıkış 0 (`import-2b.log`, `import-son.log`); script/parse/eksik kaynak hatası yok. 2b testleri **35 geçti / 0 başarısız**, çıkış **0** (`test-2b.log`). Test sayısı ve kapsamı korunur; yalnız buluntu/dönüş regresyonu gerçek Kuyu Salonu yoluna uyarlanır. Geçici duman betiği gerçek kapı/buluntu, beş odadan dönüş ve durum koruma, kapalı mühür reddi, son karşılaşmanın tek tetiklenmesi/bileşimi, iki yeni düşmanda hazırlık, gerçek hasar, yinelenen vuruş reddi ve ölümde etkisizliği, yeni odada ölümden güvenli Merkez dönüşünü doğruladı (`smoke.log`, çıkış 0). Geçici betikler kaldırıldı. Günlüklerin tamamı `build/asama3-2/` altında, Git dışındadır.

**Varsayımlar / açık işler:** oda yerleşimi, belirtilmeyen düşman değerleri ve karşılaşma tetik yarıçapı prototip varsayımlarıdır; `KARARLAR.md`'de ayrıntılıdır. Oda yeniden örneklenince düşmanlar yeniden oluşur; sefer içi odalar arası düşman kalıcılığı yoktur. Sis hasarı/kalkanı, Soluk ve yan alan ödülü, tezgâh, kaynak kaybı, yolculuk ve bitiş sonraki görev kapsamındadır. Bu nedenle ana görevin sona kadar tamamlanması henüz doğrulanamaz. Export/görsel kayıt yapılmadı; başsız kontrol görsel okunurluk kanıtı değildir. Önceden bilinen kullanıcı dizini/sertifika erişim hataları ve 4 ObjectDB kapanış sızıntı uyarısı sürüyor. Yeni belge çelişkisi yok; önceki renderer sapması korunur.

### (0) Temizlik — 2026-10-16

- Dal: `ofis/gmvahymt0`. Yalnızca yazı tipi deneme satırı kaldırıldı; sonraki adımlara girilmedi. Commit/merge yapılmadı.
- `test/asama2_demo.gd`: sol alttaki Türkçe glif etiketini oluşturan CanvasLayer ve Label kaldırıldı.
- `data/metinler.csv`: yalnızca bu etikette kullanılan `ui.glifler` silindi. `git grep` ile `.gd`, `.tscn`, `.tres`, `.csv` dosyalarında anahtarın ve deneme satırının başka kullanımı olmadığı doğrulandı. `data/metinler.tr.translation` import sırasında yenilendi.
- Değişen dosyalar: yukarıdaki üç dosya ve `docs/DURUM.md`. Mevcut 35 test değiştirilmedi; tema testleri korundu.
- Godot: `4.7.2.stable.official.ed1daf0bf`. `godot --headless --path . --import`: çıkış 0; script/parse hatası yok.
- `godot --headless --path . --script res://test/calistir.gd`: AŞAMA 1 **19 geçti**, AŞAMA 2 **16 geçti**; toplam **35 geçti, 0 başarısız**, çıkış **0**.
- Günlükler: `build/asama3-temizlik/import.log`, `build/asama3-temizlik/test.log` (Git dışında). Ortamın root certificate store, editor settings ve user://logs erişim hataları sürüyor. Kapanıştaki mevcut `4 ObjectDB instances were leaked` uyarısı sürüyor; bu temizlik kapsamında değiştirilmedi.
- Belge çelişkisi yok.

### (1) Varlıklar — 2026-10-16

- Dal: `ofis/gmvahymt0`. Yalnız Krea üretimi ve belge; `.gd`, `.tscn`, `project.godot` değişmedi. Commit yapılmadı.
- Krea bakiyesi: başta 17052,37 CU, sonda 16118,22 CU.
- **İndirilenler:** yok.
- **Üretildi ama indirilemedi (10):** kavram PNG'leri `varliklar/gorseller/{agir,puskurtucu,soluk_cekirdegi,nefes_kesesi}_kavram.png` (`krea/krea-2/medium`); GLB'ler `varliklar/modeller/{agir,puskurtucu,soluk_cekirdegi,nefes_kesesi}.glb` (`tripo/h3.1`); sesler `varliklar/sesler/{sis_kalkani,nefes}.mp3` (`bytedance/seed-audio-1.0`).
- **Neden:** görev yalnız "Krea talimatında belirtilen node indirme aracı"na izin veriyor; böyle bir araç Krea MCP talimatında, araç açıklamalarında ve depoda yok. curl/PowerShell/Python/Godot yasak olduğundan indirme denenmedi. Krea URL'leri ve promptlar `docs/VARLIKLAR.md` en üstünde.
- **Üretilemeyen:** yok.
- **Reality Checker turu (2026-10-16):** hedef yollarda dosya hâlâ yok. Engel izin değil; görev var olmayan bir araç istiyor. Karar kullanıcıda/Ofis'te: (1) kullanıcı VARLIKLAR.md'deki 10 satırlık `curl` listesini proje kökünde çalıştırır (ya da onay verir), sonra uzman ölçer; ya da (2) adım "üretildi, indirilemedi" olarak kapanır. Görev metni değişmeden uzmanı yeniden çalıştırmak sonucu değiştirmez.
- **Üçüncü düzeltme turu (2026-10-16):** Krea MCP araç listesi yeniden tarandı. Yerel diske indiren bir araç yok: `read_files` yalnız `file:<uuid>` alır ve kısa ömürlü URL döndürür; `write_files*` buluta yükler. `get_more_tools` ve `get_balance` çağrıları `permission ... not granted` verdi, bakiye okunamadı. Hedef yollarda 10 dosya hâlâ yok. Aşama 2 dosyaları (`tasiyici_*`, `bag_duzenegi*`) artık diskte; engel yalnız Aşama 3'ü etkiliyor. Döngü durduruldu; karar yukarıdaki (1)/(2) seçeneğinde.
- **Godot uzmanına:** dosyalar gelene kadar Ağır, Püskürtücü, Soluk Çekirdeği ve Nefes Kesesi için basit geometri; sis kalkanı için kod sesi; nefes için mevcut `TasiyiciNefes.gd` PCM sesi. Ölçek/yön tahminleri (Ağır ≈ 2,6 m, Püskürtücü ≈ 2,2 m, karakterlerde +90°) VARLIKLAR.md'de; gerçek AABB ile değiştirilmeli.
- Doğrulama: `godot --headless --path . --import` → SCRIPT ERROR/parse hatası 0; `godot --headless --path . --script res://test/calistir.gd` → `TESTLER: 35 geçti, 0 başarısız`.

## AŞAMA 2 — İlerleme

### (3) Test, export, kayıt ve belge — 2026-10-16

Dal: `ofis/gmva70r2p`. Commit/merge yapılmadı; Ofis yapar. AŞAMA 2 kapsamındaki merkez/karar döngüsü doğrulandı. Çekirdek Odası yolu, Soluk oynanışı ve diğer AŞAMA 3 özellikleri eklenmedi.

#### Teslim kapsamı

- Temizlikte silinen matematik/biçim anahtarları: `sifir`, `bir`, `pi_kat`, `ses_bit`, `ses_bayt`. Karşılıkları literal 0/1/2, `TAU`, `PCM_S16_TEPE=32767`, `PCM_ORNEK_BAYT=2`; ayrıntılar (0) bölümünde.
- Eklenen merkez sahnesi, ana menü, Bağ Düzeneği ekranı, onaylı geri alınabilir aktarım, kalıcı mühür/rota, M0–M2 geçişleri/M3 sınırı, kayıt/yedek/kurtarma, yerel günlük ve güvenli ölüm dönüşü (2) bölümündeki public API ile korunur.
- Dört Merkez GLB'si gerçek AABB ile bağlıdır: sırt, iki nefes kesesi, omurga ve düzenek. AŞAMA 1'in oyuncu/Avcı/Yankı GLB'leri, HUD ikonu ve dört sesi korunur. **Yer tutucu kalan model yok.** Kuyu Salonu haritası yerine geçici buluntu işareti ve kodla üretilen nefes sesi prototip kararlarıdır; kaynak/lisans VARLIKLAR.md içindedir.
- Yeni `test/asama2.gd`, giriş `test/calistir.gd` üzerinden eski 19 denemeden sonra çalışır. Eski denemelerin gövdeleri ve sırası değiştirilmedi; ayrı AŞAMA 1/AŞAMA 2 özetleri eklendi. `test/kilitlenme.gd` bağımsız regresyon girişi korunur.
- Testler gerçek `user://kayit.json` veya gerçek olay günlüğüne yazmaz. Her çalışmada rastgele `res://build/test_asama2/<kimlik>/` kullanılır, sahne kaldırılır, yalnız bu klasörün dosyaları silinir ve yollar geri alınır. Son kontrol: geçici dosya sayısı **0**. Demo da ayrı geçici dizin kullanır; kalıntı dizin sayısı **0**.

#### Testte/görsel kontrolde bulunan gerçek hatalar

- `Kayit.yukle` bozuk JSON'u `JSON.parse_string` ile okurken motor ERROR çıktısı üretiyordu. `JSON.new().parse()` dönüş kodu kontrol edilir; hatalı içerik durum değiştirmeden `kurtarma_gerekli` akışına gider. Testler gevşetilmedi.
- CSV'deki `%g`, Godot biçimleyicisinde desteklenmediği için sayı yerine ekranda kalıyordu. Yankı ve Soluk bilgi metinleri `%.1f` kullanır; sayılar hâlâ denge verisinden gelir. Gerçek ekran etiketleri ve iptal edilen onay yeni testle denetlenir.
- Bağ penceresinin başlığı 648 px kayıtta üstten kırpılıyordu. Yalnız görsel `asama2.pencere_boy` 610 → 550 yapıldı. Son karede başlık ve dört bilgi alanı görünür. Oynanış ayarlarına dokunulmadı.
- `asama2_demo.{bilgi_kare,onay_kare,aktar_kare,kapat_kare}` = 12/30/42/53 eklendi; yalnız debug kayıt zamanlamasıdır. CSV'ye 13 test adı ve iki aşama özeti eklendi.

#### Son doğrulama

Motor: PATH'teki `godot`, `4.7.2.stable.official.ed1daf0bf`.

`godot --headless --path . --import`: **çıkış 0**; SCRIPT ERROR, parse veya eksik kaynak hatası yok.

`godot --headless --path . --script res://test/calistir.gd`:

| Aşama / test | Sonuç |
|---|---|
| 1 — Çapraz hareket normalizasyonu | GEÇTİ |
| 1 — Tek vuruş tek hasar | GEÇTİ |
| 1 — Ölü düşman etkisiz | GEÇTİ |
| 1 — Yankı tarama beklemesi | GEÇTİ |
| 1 — Taramayla açılan kırılgan duvar | GEÇTİ |
| 1 — Duraklatma ve devam | GEÇTİ |
| 1 — Oyuncu GLB yükleme | GEÇTİ |
| 1 — Avcı GLB yükleme | GEÇTİ |
| 1 — Yankı GLB yükleme | GEÇTİ |
| 1 — Yankı PNG yükleme | GEÇTİ |
| 1 — Saldırı MP3 yükleme | GEÇTİ |
| 1 — Hasar MP3 yükleme | GEÇTİ |
| 1 — Tarama MP3 yükleme | GEÇTİ |
| 1 — Etkileşim MP3 yükleme | GEÇTİ |
| 1 — Oyuncu GLB sahne bağlantısı ve ölçüsü | GEÇTİ |
| 1 — Avcı GLB sahne bağlantısı ve ölçüsü | GEÇTİ |
| 1 — Yankı GLB sahne bağlantısı ve ölçüsü | GEÇTİ |
| 1 — HUD ikon bağlantısı | GEÇTİ |
| 1 — Olay ses bağlantıları | GEÇTİ |
| 2 — Yanlış görev sırası ve bulunmamış organla dönüş | GEÇTİ |
| 2 — Kestirme kapalıyken fiziksel buluntu ve dönüş yolu | GEÇTİ |
| 2 — Onay öncesi bilgiler ve iptalde durum koruma | GEÇTİ |
| 2 — Üç ardışık aktarım, onaysız ret, tek kese, Q ve HUD | GEÇTİ |
| 2 — Kese canlıdayken Q reddi ve kapıdan dönüş | GEÇTİ |
| 2 — Geri aktarım sonrası açık fizik mührü ve rota | GEÇTİ |
| 2 — Sürüm, atomik kayıt, yedek, yükleme, kalıcı geçit | GEÇTİ |
| 2 — Bozuk JSON reddi ve yedekten kurtarma | GEÇTİ |
| 2 — Eksik alan reddi ve yedekten kurtarma | GEÇTİ |
| 2 — Boş kayıt reddi ve yedekten kurtarma | GEÇTİ |
| 2 — Mevcut kayıtta onaysız yeni oyun reddi | GEÇTİ |
| 2 — Oyuncuda/canlıda organın ölümde korunması ve güvenli dönüş | GEÇTİ |
| 2 — Yerel olay günlüğünün alanları ve izinli olayları | GEÇTİ |

**AŞAMA 1: 19 geçti, 0 başarısız. AŞAMA 2: 13 geçti, 0 başarısız. TESTLER: 32 geçti, 0 başarısız. Çıkış kodu 0.** Tam çıktı `build/asama2-son/test.log`.

#### Bölüm 5 kural → test eşlemesi

| Kural | Kanıt / sınır |
|---|---|
| 1 — Geçit bir kez açılınca kapanmaz | `test.a2_kalici`: oyuncuya geri aktarım sonrası mühür katman/maskesi 0 ve rota görünür. `test.a2_kayit`: yeni oyunla RAM bayrağı sıfırlandıktan sonra diskten yükleme ve bölgedeki gerçek mühür yeniden denetlenir. |
| 2 — Soluk'a ana yol sis cebinden geçmez | Tam kural **henüz test edilemez**: Çekirdek Odası/Soluk yolu ve sis cebi AŞAMA 3'te. `test.a2_kestirmesiz` yalnız mevcut AŞAMA 2 döngüsünün Soluk BULUNMADI iken tamamlandığını kanıtlar; bu, gelecekteki ana yolun tam testi diye sayılmadı. |
| 3 — Kestirme zorunlu değildir | `test.a2_kestirmesiz`: gerçek `test_move` sorgularıyla doğum→buluntu→dönüş kapısı yolları engelsizdir; duvar yıkılmamış ve kestirme false kalır. |
| 4 — Organ ölümde kaybolmaz | `test.a2_olum`: kese hem oyuncuda hem canlıdayken gerçek ölüm/sahne değişimi; organ, görev, bayraklar ve kaynak imzası korunur; merkezde tam can. |
| 5 — Her durumda merkeze dönüş | `test.a2_sira`: M0/BULUNMADI; `test.a2_kestirmesiz`: OYUNCU; `test.a2_canli_donus`: CANLI. Üç durumda gerçek kapı çalışır. `test.a2_olum` ölüm dönüşünü; kayıt testleri güvenli merkez yüklemesini kapsar. |

#### Windows export ve EXE

`%APPDATA%/Godot/export_templates/4.7.2.stable/windows_release_x86_64.exe` mevcut; indirme/atlatma yapılmadı.

- `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe`: **çıkış 0**.
- `build/GOC.exe`: **129.772.008 bayt**, gömülü PCK.
- `build/GOC.exe --headless --quit-after 300`: **çıkış 0**, çıktıdaki ERROR/WARNING sayısı 0.
- Test/demo kaynakları mevcut export filtresi `test/*` ile release dışında. EXE ve kareler `.gitignore` gereği Git dışında kalır.

#### Görsel kayıtlar

Normal oyun akışını değiştirmeyen `test/asama2_demo.tscn` yalnız açık argümanla çalışır. Demo verisi ve dosyaları gerçek kayda dokunmaz; aktarım gerçek pencere/buton/onay işleyicileri üzerinden yapılır. Alt pencereler yalnız demo viewport'una gömülür; onay filmde görünür.

```text
godot --path . --write-movie build/kayit/asama2/merkez.png --fixed-fps 10 --quit-after 60 res://test/asama2_demo.tscn -- --asama2-demo=merkez
godot --path . --write-movie build/kayit/asama2/aktarma.png --fixed-fps 10 --quit-after 60 res://test/asama2_demo.tscn -- --asama2-demo=aktarma
```

İkisi de **çıkış 0**, **60 PNG**, **1152×648**, 10 FPS / 6 sn. Toplam 120 kare. Çökme, SCRIPT ERROR, biçimleme hatası veya renderer ERROR yok. Bu bir FPS benchmark'ı değildir.

İncelenen kareler:

- `build/kayit/asama2/merkez00000020.png`: sıcak merkez, oyuncu, sırt/nefes/omurga/düzenek görünür.
- `build/kayit/asama2/aktarma00000020.png`: onaydan önce nerede, oyuncu/canlı etkileri ve kazanım/kayıp okunur; sayılar 12,0/6,0/8,0 ve 5,0/12,0 olarak biçimlenir.
- `build/kayit/asama2/aktarma00000035.png`: ayrı onay penceresi ve Onayla/Vazgeç seçenekleri.
- `build/kayit/asama2/aktarma00000047.png`: onay sonrası konum Taşıyıcı'da; geri aktarım kazanım/kayıpları görünür.
- `build/kayit/asama2/aktarma00000058.png`: pencere kapalı, HUD Q kullanılamaz der; M3 hedefi ve canlı tepkisi görünür. Günlükte demo sonucu `kese=CANLI`, `gecit_acik=true`.

Her iki kaydın renderer satırı aynıdır:

```text
OpenGL API OpenGL ES 3.0 (ANGLE 2.1.1 git hash: aaebda1c5a40) - Compatibility - Using Device: Google Inc. (Microsoft) - ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11-10.0.20348.1)
```

#### Bilinen hatalar, çelişkiler ve AŞAMA 3 notları

- Başsız test ve iki movie kapanışında **4 ObjectDB nesnesi** uyarısı kalır; önceki iki nefes WAV/playback çifti incelemesi geçerlidir. Bu uyarı renderer/script hatası veya çökme değildir; kaynak yaşam döngüsü sorunu olarak açıktır.
- Ortamın `Failed to open log file for writing: user://logs/godot.log`, zaman damgalı kullanıcı günlüğü açma, `Failed to read the root certificate store.` ve editör ayarı kaydetme hataları sürer. Native OpenGL 3.3 yoktur; ANGLE'a otomatik geçiş uyarısı beklenir. Son release başsız açılışı ise ERROR/WARNING üretmedi. Tüm editör/movie konsolunun hatasız olduğu iddia edilmez.
- Gerçek kullanıcı kayıt dizininin yazılabilirliği ve hoparlörden ses kalitesi bu testlerden çıkarılamaz. Test yazmaları proje içindeki geçici klasörde doğrulandı.
- Yeni belge çelişkisi yok. Önceki Compatibility kararı ve gerçek Kuyu Salonu yerine geçici buluntu işareti kararı korunur. Gerçek salon/Çekirdek Odası yolları AŞAMA 3'te kurulunca kural 2'nin tam testi zorunludur.
- AŞAMA 3: buluntuyu gerçek Kuyu Salonu'na taşı; Soluk/sis yan alanını ana yoldan ayır; M3 sonrası görev ve kayıt şemasını birlikte genişlet; kalıcı bayrakları geri alma/yüklemede kapatma; kaynak kaybını mevcut güvenli ölüm dönüşüne ekle. Tam macera/ayarlar/performance gibi sonraki kapsamlar bu adımda eklenmedi.
- Ham günlükler ve makine özeti: `build/asama2-son/{import,test,export,exe,merkez-kayit,aktarma-kayit}.log`, `sonuclar.json`.

### (2) Kod

#### Reality Checker düzeltmesi — 2026-10-16

- `Oyun.cikis_iste() -> bool` eklendi. Kayıt başarısızsa ilk X isteğinde `kayit.cikis_onay` ile ilerleme kaybı uyarılır; ikinci X kayıt başarısız olsa da oyunu kapatır. Yeni oyun ve yükleme onayı sıfırlar. `_notification` aynı public metodu çağırır.
- `oyuncu_bagla` ölüm sinyalini tek seferlik bağlar. Aktif bölge oturumunda ölüm, fizik karesinden sonra Merkez'e dönüş başlatır. Dönüş anlık görüntüsünün canı `oyuncu_can` olur; eski ölü örneğin kaydı bu değeri ezemez. Organ/görev/bayraklar ve Kehribar korunur. Kaynak kaybı eklenmedi.
- `bag.soluk_oyuncu`, JSON'daki yeni `asama2.soluk_sure=5` ve `asama2.soluk_bekleme=12` ile biçimlenir. Soluk oynanışı eklenmedi.
- Değişen dosyalar: `autoload/Oyun.gd`, `betikler/BagEkrani.gd`, `data/denge.json`, `data/metinler.csv`, üretilen çeviri ve bu iki durum/karar belgesi. `test/kilitlenme.gd` yeni, ayrı regresyon girişidir; eski testler değiştirilmedi.
- Import çıkış 0. `godot --headless --path . --script res://test/kilitlenme.gd`: ölümde gerçek sahne değişimi/tam can/organ-bayrak-kaynak koruma ve gerçek dosya yazma hatasında ikinci kapatma isteği **2 GEÇTİ; çıkış 0**. Ölüm dönüşüyle alınan kayıt da tam can içerir. Test kendi dosyalarını yalnız `build/kilit-duzeltme/` altında tutar.
- `godot --headless --path . --script res://test/calistir.gd`: **19 geçti, 0 başarısız; çıkış 0**. Günlükler `build/kilit-duzeltme/` altında. SCRIPT ERROR yok; ortamın günlük/sertifika izin hataları ayrıdır. Önceden bildirilen başsız ses kapanışı uyarısı bu düzeltmenin kapsamı dışında kaldı.

Tarih: 2026-10-16. Dal: `ofis/gmva70r2p`. Yalnız kod, import ve mevcut testlerle doğrulama yapıldı. Yeni kabul testleri, export ve görsel kayıt sonraki adıma bırakıldı. Commit/merge yapılmadı.

#### Eklenen sahneler ve sistemler

- `sahneler/ana_menu.tscn`: yeni oyun, kayıt yükleme ve yedek yükleme ekranı. Mevcut kayıt varsa yeni oyun ikinci onay ister. Bozuk/eksik kayıt durumunda durum uygulanmaz; aynı ekranda yedek/yeni oyun seçenekleri kalır.
- `sahneler/merkez.tscn`: sıcak amber ışıklı Taşıyıcı sırtı, iki nefes kesesi, omurga, Bağ Düzeneği ve Avlu kapısı. GLB görseliyle düz fizik platformu ayrıdır; platformun mesh'i sırtı örtmemesi için gizlidir. Yeni merkez sınırları dışında Aşama 1 fiziği değiştirilmedi.
- `BolgeAsama2`: yalnız yeni oturumda Avlu'ya dönüş kapısı, geçici Kuyu Salonu buluntu işareti ve Derin Geçit mührü/rotası ekler. Aşama 1 sahnesi bağımsız çalıştırılırken önceki oyuncuda-kese başlangıcı korunur. Yeni oyun ise M0 + BULUNMADI ile başlar.
- `Oyun`: organ konumu ve kalıcı bayrakların tek doğruluk kaynağı; `Gorev` örneğini sahiplenir. M0 Taşıyıcı etkileşimiyle M1'e, M1 buluntuyla M2'ye, M2 onaylı canlı aktarımıyla M3 sınırına geçer. M3'ün oynanışı uygulanmadı.
- `BagEkrani`: iki organın konumu, oyuncu/canlı etkileri ve kazanım/kayıpları gösterilir. Yankı için ayrı onay penceresi vardır. Soluk henüz bulunamaz ve aktarılamaz. Onaysız, uzak, merkez dışındaki ve geçersiz sıradaki aktarımlar reddedilir.
- `Kayit`: değiştirilebilir yol, şema/sürüm/tutarlılık doğrulaması, .tmp yazma/flush, mevcut dosyayı .bak yedekleme ve aynı dizinde rename. Hatalarda eski dosya silinmez; başarısızlık bool ve sinyalle bildirilir. Organ bulma/aktarma, merkeze dönüş, kestirme ve güvenli pencere kapanışında kayıt alınır. İlk M0→M1 geçişi de sonraki bu kayıt noktalarında saklanır.
- `Olaylar`: yalnız yerel JSONL; alanlar tam olarak `olay`, `oturum`, `sure_sn`, `ilgili`, `surum`. Oturum rastgele kimliktir; kişisel bilgi yoktur. Şimdiki olaylar bağlandı; sonraki aşamaların tamamlanma/tekrar-oyna olayları tetiklenmez.
- Sahne geçişinde oyuncunun canı, kaçınma beklemesi ve tarama beklemesi taşınır; organ konumu Oyun'da kalır. Yükleme her zaman merkezde güvenli doğum başlatır; ölü kayıt canı güvenli başlangıç canına getirilir. Reality Checker düzeltmesiyle bölge ölümünde güvenli Merkez dönüşü de eklendi. Kaynak kaybı ve diğer Aşama 3 sistemleri eklenmedi.

#### Public API ve sinyaller

| Sistem | Metotlar / okunabilir durum |
|---|---|
| Oyun | `yeni_oyun()`, `tasiyiciyi_dinle() -> bool`, `yanki_bul(konum: StringName = &"kuyu_salonu") -> bool`, `aktar(hedef: String, onay: bool = false) -> bool`, `yer_degistir(hedef: String) -> bool`, `oyuncu_bagla(oyuncu: Oyuncu, yer: String)`, `etkin_oyuncu() -> Oyuncu`, `kayit_verisi() -> Dictionary`, `kayittan_uygula(veri: Dictionary)`; `kese_konumu`, `gecit_acik`, `kestirme_acik`, `gorev.durum`, `mekan`, `oturum_aktif`, `oyuncu_durumu` |
| Gorev | `gecis(olay: StringName) -> bool`, `hedef_anahtari() -> String`; `durum`: M0=0, M1=1, M2=2, M3=3 |
| Kayit | `kaydet() -> bool`, `yukle(yedek: bool = false) -> bool`, `yeni_oyun(onay: bool = false) -> bool`, `dogrula(veri: Dictionary) -> bool`; `kayit_yolu`, `son_hata`, `SURUM` |
| Olaylar | `oturum_baslat()`, `yaz(olay: String, ilgili: String = "") -> bool`, `dusman_yenildi()`; `gunluk_yolu`, `son_hata` |
| Oyuncu | Mevcut API korunur; `etkiles() -> bool`, `durum_verisi() -> Dictionary`, `durum_uygula(veri: Dictionary)` eklenir |
| EtkilesimNoktasi | `erisilebilir(oyuncu: Oyuncu) -> bool`, `etkiles(oyuncu: Oyuncu) -> bool`; `eylem`, `etkin` |
| BagEkrani | `ac()`, `kapat()`; onay UI üzerinden ayrıca istenir |
| DerinGecit | `acik` Oyun bayrağını okur; `Muhur.collision_layer/mask` açıkken 0, `RotaIsareti.visible` true |
| MerkezModeli | `kur(kimlik: String)`; `yuklendi`, `ham_aabb`, `olcek`, `donus_y` |
| KirilganDuvar | Mevcut API korunur; `kayittan_ac()` sinyal/kayıt üretmeden yüklenen kestirmeyi açar |

Yeni sinyaller: `Olaylar.organ_aktarildi(organ: String, konum: String)`, `gorev_degisti(durum: int)`, `gecit_acildi()`, `durum_degisti()`, `bilgi(anahtar: String)`; `Kayit.kurtarma_gerekli(neden: String)`, `kayit_hatasi(anahtar: String)`, `yuklendi()`; `EtkilesimNoktasi.kullanildi(oyuncu: Oyuncu)`. Önceki sinyaller korunur. Sahne abonelikleri çıkışta çözülür.

Sonraki testler için: `Oyun.yeni_oyun()` sonrası gerçek Merkez örneğini kurun. Aktarımda gerçek oyuncu Bağ Düzeneği menzilinde olmalıdır; yalnız `onay=true` yeterli değildir. `Kayit.kayit_yolu` ve `Olaylar.gunluk_yolu` testin yazılabilir klasörüne yönlendirilebilir. `Kayit.yukle()` başarılıysa merkeze geçişi erteler; sahne değişimini bekleyin. Mevcut SceneTree girişindeki gibi tipli senaryoları autoload'lardan sonra yükleyin.

#### Bölüm 5 kilitlenmeme kuralları

| Kural | Sağlandığı yer / kapsam sınırı |
|---|---|
| 1. Geçit geri kapanmaz | `Oyun.aktar`: canlıda true olur; oyuncuya dönüşte değiştirilmez. `kayit_verisi`, `Kayit.dogrula`, `kayittan_uygula`: bayrak saklanır, tutarsız kombinasyon reddedilir ve açık oturumda eski kayıt bayrağı kapatmaz. `DerinGecit._guncelle` fizik mührünü/rotayı bayraktan okur. |
| 2. Ana yol sis cebinden geçmez | Bu adım sis cebi veya Soluk Çekirdeği yolu eklemez. Merkez/Avlu geçişi ve Yankı buluntusu sis kalkanı istemez. Çekirdek Odası'nın gerçek ana yol geometrisi Aşama 3'te ayrıca test edilmelidir. |
| 3. Kestirme zorunlu değildir | `BolgeAsama2`: dönüş kapısı ve buluntu, kırılgan duvarın erişilebilir ön tarafındadır. Geçiş/aktarım hiçbir yerde `kestirme_acik` istemez. |
| 4. Organ kalıcı kaybolmaz | `_kese_konumu` yalnız bulma, geçerli aktarım, yeni oyun ve doğrulanmış yüklemede değişir. `Oyuncu.hasar_al`/ölüm organ konumunu değiştirmez. Tek durum iki görsel temsilin görünürlüğünü ve Q yetkisini belirler; aynı anda iki yerde görünmez. |
| 5. Merkeze dönüş açık kalır | `BolgeAsama2/DonusKapisi` etkinliği organ/görev/bayraklara bağlı değildir; kapı alan girişinde ve duvar önündedir. `yer_degistir` bu koşulları istemez. Bölge ölümü `Oyun._olumden_don` ile Merkez'de tam canlı güvenli doğum başlatır. Organlar ve kaynaklar korunur; kaynak kaybı Aşama 3'e bırakılır. Yükleme de merkezde güvenli doğum yapar. |

#### Varlıklar ve ölçekler

Önceki notların aksine dört GLB bu görev başında diskte bulundu; indirme veya yeni Krea üretimi yapılmadı. Import ve gerçek mesh AABB ölçümü başarıyla tamamlandı. **Merkezde yer tutucu kalan GLB yok.**

| Düğüm | Model | Ham boyut | Ölçek / Y dönüş |
|---|---|---|---|
| `Merkez/TasiyiciSirt` | `tasiyici_sirt.glb` | (1; 0,216418; 0,736154) | 12 / 90°; üst nokta y=0 |
| `Merkez/NefesKeseleri/Kese0/Model`, `Kese1/Model` | `tasiyici_nefes_kesesi.glb` | (0,908090; 1; 0,914582) | 1,5 / 0°; taban pivotu |
| `Merkez/TasiyiciOmurga/Model` | `tasiyici_omurga.glb` | (0,451817; 0,839392; 1) | 2,9783456 / 0°; taban y=0 |
| `Merkez/BagDuzenegi/Model` | `bag_duzenegi.glb` | (0,775825; 0,946107; 1) | 1,1626594 / 90°; taban y=0 |

Her parça GLB düğümü olarak örneklenir; dosya/tür/AABB başarısızlığında aynı yerde basit kutu yedeği vardır. Nefes sesi özgün PCM sinüs üretimidir; yeni dış ses dosyası eklenmedi. Ön yönler belge önerisidir; pencereli görsel/işitsel değerlendirme bu adımda yapılmadı.

#### Veri anahtarları

Eski 90 üst düzey ayar aynen korundu. Tek yeni üst düzey alan `asama2`:

- `sise_kapasitesi`, `etkilesim_menzil`, `etiket_y`, `pencere_en`, `pencere_boy`.
- `merkez_dogum`, `merkez_kapi`, `bolge_kapi`, `merkez_zemin`, `zemin_yari`, `zemin_renk`, `merkez_sinirlar`, `nefes_konumlar`, `omurga_konum`, `bag_konum`, `dinle_konum`, `canli_kese_konum`, `buluntu_konum`, `gecit_konum`.
- `muhur_boyut`, `muhur_y`, `muhur_renk`, `rota_konumlar`, `rota_boyut`, `rota_enerji`, `amber`, `arka_plan`, `ortam_enerji`, `isik_enerji`.
- `nefes_periyot`, `nefes_bagli_periyot`, `nefes_genlik`, `tepki_menzil`, `tepki_enerji`, `nefes_ses_sure`, `nefes_frekans`, `nefes_ses_genlik`, `nefes_ses_bagli`.
- `modeller.{tasiyici_sirt,tasiyici_nefes_kesesi,tasiyici_omurga,bag_duzenegi}.{yol,boy,uzun_eksen,donus_y,eksene_gore_don,eksen_donus,yedek_boyut,yedek_konum,renk}`.

44 CSV anahtarı: `hedef.m0/m1/m2/m3`; `menu.yeni/yukle/yedek`; `kayit.yeni_onay/eksik/okunamadi/bozuk/tutarsiz/yazilamadi/kurtarma`; `yer.bulunmadi/oyuncu/canli`; `bag.baslik/yanki/soluk/yanki_oyuncu/yanki_canli/sonuc_canli/sonuc_oyuncu/bulunmadi/soluk_oyuncu/soluk_canli/soluk_sonuc/aktar/onay/onayla/vazgec/kapat`; `bilgi.sira/dinlendi/baglandi/geri_alindi/gecis_hatasi`; `etkilesim.bag/dinle/avlu/merkez/yanki`; `hud.kese_yok`. Tarama bilgisi gerçek denge değerleriyle biçimlenir. Derlenmiş çeviri import ile güncellendi.

#### Doğrulama ve açık işler

- `godot --headless --path . --import`: çıkış 0; SCRIPT ERROR/parse/eksik kaynak hatası yok.
- `godot --headless --path . --script res://test/calistir.gd`: **19 geçti, 0 başarısız; çıkış 0**. Test dosyalarına dokunulmadı.
- `godot --headless --path . res://sahneler/merkez.tscn --quit-after 180`: çıkış 0; SCRIPT ERROR yok. Başsız zorunlu kapanışta `WARNING: 4 ObjectDB instances were leaked at exit (run with --verbose for details).` görülür; ayrıntı iki `AudioStreamWAV`/`AudioStreamPlaybackWAV` çiftidir. Normal sahne örneği kaldırılıp bir kare beklendiğinde ölçüm çalışmasında uyarı görülmedi. Sonraki adımda ses kapanışı ayrıca incelenmeli.
- Ortamın kullanıcı günlük dosyası, sertifika deposu ve editör ayarlarına yazma hataları sürüyor. Gerçek `user://` yazılabilirliği ve yeni kayıt/aktarım kabul senaryoları bu adımda doğrulanmış sayılmaz; sonraki test adımında yazılabilir test yolları kullanılmalı.
- Günlükler `build/asama2-kod/` altında; geçici ölçüm betiği silindi. Export/kayıt alınmadı.
- Kuyu Salonu gerçek haritası Aşama 3'e ait olduğundan bu adımda erişilebilir buluntu işaretiyle temsil edildi. M2 başarısı belge gereği M3 hedefini açar; M3 içeriği yoktur. Gerekçe `KARARLAR.md` içinde. Merkez yeni sayısal ayarları prototip varsayılanlarıdır.

### (0) Temizlik

Tarih: 2026-10-16. Dal: `ofis/gmva70r2p`. Yalnız temizlik yapıldı; varlık üretimi, AŞAMA 2 oynanışı ve export yapılmadı. Commit/merge Ofis'e bırakıldı.

| Silinen JSON anahtarı | Kod karşılığı |
|---|---|
| `sifir` | Tamsayı bağlamında `0`, kayan noktalı bağlamda `0.0` |
| `bir` | Tamsayı/indis bağlamında `1`, kayan noktalı bağlamda `1.0`; yarıya bölmede `2.0` |
| `pi_kat` | `PI * 2` yerine Godot `TAU` sabiti |
| `ses_bit` | `Geometri.PCM_S16_TEPE: int = 32767` |
| `ses_bayt` | `Geometri.PCM_ORNEK_BAYT: int = 2` |

PCM sabitleri `AudioStreamWAV.FORMAT_16_BITS` ve `encode_s16()` biçiminin örnek boyutu/tepe değeridir; ses seviyesi veya oynanış ayarı değildir. Shader'a matematiksel `bir` uniform'u aktarımı kaldırıldı; shader içinde `1.0` ve `2.0` kullanılır. Public API ve test beklentileri korunur.

Değişen dosyalar: `autoload/Ayarlar.gd`; `betikler/Avci.gd`, `Avlu.gd`, `AvluGorseli.gd`, `Geometri.gd`, `KirilganDuvar.gd`, `ModelBaglantisi.gd`, `Oyuncu.gd`, `YankiKesesi.gd`; `test/calistir.gd`, `senaryolar.gd`, `varliklar.gd`; `varliklar/shaderlar/tas_karo.gdshader`; `data/denge.json`; bu belge.

Korunan ayarlar: kamera açıları ve tüm görsel değerler; model `donus_y` değerleri (90° dahil), fizik/mesh boyutları, ses örnekleme hızı/genlik/süre/frekanslar ve test zamanlama/toleransları. Bunlar kullanım bağlamında ayardır; sayı olarak 0, 1 veya 0,5 olmaları matematik sabiti sayılmaları için yeterli değildir. Test ayarları da bu temizlikte korunur. Kalan JSON verisi önceki sürümle birebir karşılaştırıldı; yalnız yukarıdaki beş anahtar silindi.

Doğrulama — Godot `4.7.2.stable.official.ed1daf0bf`:

- Değişiklik öncesi ve sonrası `godot --headless --path . --import`: çıkış 0.
- Değişiklik öncesi ve sonrası `godot --headless --path . --script res://test/calistir.gd`: **19 geçti, 0 başarısız; çıkış 0**. Mevcut testlerin kontrolleri gevşetilmedi.
- Tüm `.gd` dosyaları tarandı; silinen anahtarlara `Ayarlar.sayi`, test `_sayi`, yerel `sayi` veya doğrudan JSON erişimi kalmadı. PowerShell `Select-String` kullanıldı (`rg` kurulu değil); eşleşme 0.
- SCRIPT ERROR, parse veya eksik kaynak hatası yok. Ortamın sertifika deposu ve kullanıcı/editör ayarlarına yazma hataları sürüyor; başarılı çıkış kodlarından ayrı değerlendirilir.
- Günlükler: `build/temizlik/once-import.log`, `once-test.log`, `sonra-import.log`, `sonra-test.log`. `build/` Git dışında kalır.

Belge çelişkisi yok: AGENTS §3 ve güncel TASARIM §8 matematik sabitlerini kodda tutar. Sonraki sıralı adımlara başlanmadı.

### (1) Varlıklar

Tarih: 2026-10-16. Dal: `ofis/gmva70r2p`. Yalnız Krea üretimi ve belge; `.gd`, `.tscn`, `project.godot` değişmedi. Commit yapılmadı.

- Krea bakiyesi: başta 17977,26 CU, sonda 17052,37 CU.
- **Üretildi (Krea), indirilemedi:** 4 kavram PNG (`krea/krea-2/medium`) + 4 GLB (`tripo/h3.1`):
  - `varliklar/modeller/tasiyici_sirt.glb` → `Merkez/TasiyiciSirt`
  - `varliklar/modeller/tasiyici_nefes_kesesi.glb` → `Merkez/NefesKeseleri/*`
  - `varliklar/modeller/tasiyici_omurga.glb` → `Merkez/TasiyiciOmurga/*`
  - `varliklar/modeller/bag_duzenegi.glb` → `Merkez/BagDuzenegi/Model`
  - kavramlar: `varliklar/gorseller/{tasiyici_sirt,tasiyici_nefes_kesesi,tasiyici_omurga,bag_duzenegi}_kavram.png`
- **Neden indirilemedi:** zorunlu yöntem `curl -sSfL <url> -o <yol>` her denemede `This command requires approval` verdi. Görev gereği başka araçla dolanılmadı. Hedef yollarda dosya yok; bayt ölçülemedi.
- **Üretilemeyen:** yok.
- Reality Checker turu (2026-10-16): hedef yollarda `tasiyici_*`/`bag_duzenegi*` dosyası yok; `curl ... bag_duzenegi.glb` yeniden `This command requires approval`. Çözüm kullanıcıda: `curl` onayı ya da VARLIKLAR.md'deki listeyi proje kökünde çalıştırmak. Sonra `wc -c` + AABB/ön yön ölçümü yapılıp tahminler değiştirilmeli. Dosyalar inmeden sonraki adım başlarsa dört parça basit geometriyle kurulur.
- Üçüncü düzeltme turu (2026-10-16): aynı `curl` yine `This command requires approval`. Ajan döngüsü durduruldu; karar kullanıcıda: (a) `curl` onayı ya da listeyi elle çalıştırmak, (b) adımı "üretildi, indirilemedi" ile kapatıp dört parçayı basit geometriyle kurmak. Aşama 1 GLB/PNG'leri (`oyuncu`, `avci`, `yanki_kesesi`) diskte mevcut; bu engel yalnız Aşama 2 parçalarını etkiliyor.
- Krea URL'leri, tam promptlar, hazır `curl` komut listesi ve ölçek/yön önerileri `docs/VARLIKLAR.md` en üst bölümünde.
- **Godot uzmanına:** indirme onaylanana kadar dört parça için basit geometri kullanın. Dosyalar gelince gerçek AABB ölçülmeli; tahminler Aşama 1 Tripo davranışına dayanır (Y=1,0 normalize, merkez orijin, ön +X).
- Test botu: `godot --headless --path . --script res://test/calistir.gd` → `TESTLER: 19 geçti, 0 başarısız`; SCRIPT ERROR yok. Kod/sahne/veri değişmedi, yalnız belge değişti.

Tarih: 2026-10-15. Dal: `ofis/gmv9xda76`. Commit/merge yapılmadı; Ofis yapar.

## Önce/sonra

- Başlangıçta `build/kayit/` altında PNG yoktu; taşınan kare sayısı 0. Değişikliklerden önce özgün projeden 60 karelik `once/` kaydı üretildi.
- Çözünürlük 1152×648, 10 FPS. Karşılaştırma: `build/kayit/once/asama100000000.png` ve `build/kayit/sonra/asama100000000.png`. Son savaş karesi: `build/kayit/sonra/asama100000059.png`. Kareler açılarak oyuncu, Avcı, hazırlık ve HUD kontrol edildi.
- Sayısal yöntem: gerçek oyuncu GLB meshlerinin dünya AABB'si birleştirildi; XZ merkezindeki alt/üst noktalar `Camera3D.unproject_position()` ile yansıtıldı. **30,41 px / %4,69 → 52,27 px / %8,07**. 1080p eşdeğeri 50,68 → 87,11 px.
- Görsel kontrol: son karede tam siluet yaklaşık 60–65 px. Ek kontrol olarak tüm mesh köşelerinin izdüşümü **37,35 px / %5,76 → 64,20 px / %9,91** verdi. Son iki ölçüm hedef %8–10 içinde. AABB'nin sekiz köşesini çevreleyen kutu boş alanları da içerdiğinden oyuncu boyu sayılmadı.
- Geçici ölçüm betiği silindi. Sonuçlar `build/dogrulama/once-olcum.json` ve `sonra-olcum.json` içinde.

## Kamera, ışık, sis ve zemin

Yalnız `gorsel` anahtarı eklendi; eski 94 üst düzey anahtarın değerleri birebir korundu. Oynanış, çarpışmalar, Avcı konumu/yapay zekâsı ve mevcut 19 test değiştirilmedi.

| Yeni anahtar (`gorsel.` önekiyle) | Değer |
|---|---|
| `kamera.boyut`, `mesafe`, `egim`, `yatay`, `takip_yumusatma` | 12,8; 14; 55°; 45°; 7 |
| `ortam.arka_plan`, `isik_renk`, `isik_enerji` | #101b29; #6b839e; 0,38 |
| `ortam.yon_isigi_renk`, `yon_isigi_enerji` | #9cbad2; 0,85 |
| `ortam.sis_renk`, `sis_enerji`, `sis_baslangic`, `sis_bitis`, `sis_egri` | #5d7286; 0,65; 17; 29; 1,4 |
| `fener.renk`, `enerji`, `menzil`, `yukseklik`, `azalma` | #ffb654; 2,3; 5; 1,2; 1,3 |
| `zemin.tas_renk`, `yol_renk`, `derz_renk` | #26343e; #53616a; #141f29 |
| `zemin.karo_boyut`, `derz_eni`, `cesitlilik` | 1,2; 0,025; 0,14 |
| `zemin.yol_yari_en`, `yol_gecis`, `puruzluluk` | 1,8; 0,25; 0,92 |
| `sutun_ust_oran`, `sutun_dilim` | 0,7; 10 |

Ortografik boyut 22 → 12,8, mesafe 19 → 14. Açı sabit, konum yumuşak takip eder. Eski kamera anahtarları korunur; Avlu yeni görsel değerleri okur.

Avcı saldırı yarıçapındaki (1,7 m) sekiz örnek ve başlangıç Avcı konumu kadraj içindedir. Tam 16 m algılama çemberi hedef oyuncu boyuyla kadraja sığmaz. Tam siluet hedefin üst sınırına (%9,91) yakın tutuldu; oynanış menzillerine dokunulmadı. Uzak düşman ekran dışında algılayabilir.

Tek Environment `sahneler/ortam.tres` JSON ile ayarlanır. Soğuk ortam/yön ışığı ve oyuncunun çocuğu amber `FenerIsigi` gölgesizdir. Derinlik sisi kamera mesafesinde 17–29 aralığındadır; yakın saldırı hazırlığından uzakta başlar. Volumetrik sis, SDFGI ve VoxelGI yoktur. Zemin prosedürel taş karo shader'ı kullanır; orta yol daha açıktır. Zemin fiziği korunur.

## Dekorlar

`gorsel.dekor` dizisi aşağıdaki verileri içerir. Konum taban referansıdır; çizim merkezi boyun yarısı kadar yükseltilir. Hiçbir dekora çarpışma eklenmedi; yol, kırılgan duvar ve savaş geçişi boş bırakıldı.

| Tür | Konum | Boyut | Y dönüş / Z eğim | Renk |
|---|---|---|---|---|
| Sütun | (-9; 0; 5) | (1,1; 1,6; 1,1) | 12° / -6° | #43525c |
| Taş | (-8,2; 0; 5,7) | (0,9; 0,35; 0,7) | -18° / 7° | #3b4a55 |
| Kasa | (-8,8; 0; 8,8) | (1,2; 1; 1,1) | 12° / 0° | #4b463d |
| Kasa | (8,8; 0; 1) | (1,2; 0,9; 1,1) | -15° / 0° | #4b463d |
| Taş | (9; 0; 4) | (1,5; 0,5; 1,1) | 28° / 8° | #43525c |
| Taş | (9,7; 0; 4,4) | (0,8; 0,7; 0,7) | -9° / 10° | #3b4a55 |
| Sütun | (-9; 0; -4) | (1; 1,25; 1) | 34° / 5° | #43525c |
| Kasa | (9,3; 0; -9) | (1,3; 1,1; 1,2) | 5° / 0° | #4b463d |

## Güncel doğrulama

Motor: PATH'teki `godot`, `4.7.2.stable.official.ed1daf0bf`.

| Komut | Sonuç |
|---|---|
| `godot --headless --path . --import` | Çıkış 0; betik, kaynak ve shader hatası yok |
| `godot --headless --path . --script res://test/calistir.gd` | 19 GEÇTİ, 0 KALDI; çıkış 0 |
| `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe` | Çıkış 0; 118.684.304 bayt |
| `godot --path . --write-movie build/kayit/sonra/asama1.png --fixed-fps 10 --quit-after 60` | Çıkış 0; 60 PNG; çökme, SCRIPT ERROR ve renderer hatası yok |
| `build/GOC.exe --headless --quit-after 300` | Çıkış 0; SCRIPT ERROR yok |

19 testin tamamı korundu: altı oynanış, sekiz kaynak yükleme, üç GLB bağlantısı/ölçüsü, HUD ikonu ve olay sesleri. Günlükler `build/dogrulama/` altında. EXE/kayıtlar `.gitignore` gereği depoya eklenmez.

Renderer satırı:

```text
OpenGL API OpenGL ES 3.0 (ANGLE 2.1.1 git hash: aaebda1c5a40) - Compatibility - Using Device: Google Inc. (Microsoft) - ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11-10.0.20348.1)
```

## Bilinen hatalar, varsayımlar ve AŞAMA 1 durumu

- İlk görsel denemede yazılamayan shader önbelleği `_save_to_cache` / `f.is_null()` hatası verdi. `project.godot` içine `shader_compiler/shader_cache/enabled=false` eklendi. Son kayıtta renderer hatası yok; yeni süreçlerde shader yeniden derlenir.
- Ortam uyarısı: `WARNING: Your video card drivers seem not to support the required OpenGL 3.3 version, switching to ANGLE.` Otomatik ANGLE geçişiyle kayıt tamamlandı.
- Kullanıcı günlük dosyası açma, `Failed to read the root certificate store.` ve import/export sırasında `editor_settings-4.7.tres` kaydetme hataları ortam izinleri nedeniyle sürüyor. Çıkış kodları 0; tüm konsolun hatasız olduğu iddia edilmez.
- Tam algılama çemberi görünmez; fener gölgesiz, dekorlar basit prototip geometri, sis yakın savaşı örtmemek için hafiftir.
- Soğuk mavi-gri dünya, amber fener ve sabit açılı yumuşak takip TASARIM ile uyumludur. Yeni stil çelişkisi yok; önceki Compatibility kararı korunur. Önce kareleri bulunmadığından özgün durumdan yeniden üretildi.
- AŞAMA 1 görsel düzeltmesi, 19 test, Windows export ve karşılaştırma kaydı tamamlandı. Yeni oynanış eklenmedi. Sonraki aşamada dekor kalitesi artırılabilir; algılama kadrajı kısıtı değerlendirilmelidir.

---

# Önceki teslim kaydı (tarihçe)

Tarih: 2026-10-15. Dal: `ofis/gmv9wp6ez`. Çalışma yalnız bu worktree içinde yapıldı. Commit/merge yapılmadı; Ofis'e bırakıldı.

## Tamamlananlar

- Mevcut üç GLB, dört MP3 ve Yankı HUD ikonu bağlandı. Yeni Krea üretimi veya indirme yapılmadı.
- `ModelBaglantisi.gd`, GLB'yi ilgili sahnenin `Model/GLB` düğümünde PackedScene örneği olarak oluşturur. Gerçek mesh AABB'lerini dönüşümleriyle birleştirip ölçek/hizalama hesaplar. Kaynak yüklenemezse önceki geometri yedeği korunur.
- Başarılı GLB bağlantısında CapsuleMesh/BoxMesh/SphereMesh ve oyuncu yön kutusu oluşturulmaz. Mevcut kapsül çarpışmalarının biçimi, boyutu, konumu ve katmanları değiştirilmedi.
- GLB malzemeleri örneğe özel kopyalanır; dokular korunur. Hazırlık/hasar rengi kopyaya uygulanır ve ardından özgün renge döner.
- Saldırı: `Oyuncu.saldir()`; hasar: oyuncu/Avcı `hasar_al()`; tarama: `YankiKesesi.tara()`. Mevcut olay noktaları MP3 kullanan AudioStreamPlayer3D oluşturur. Ses düğümleri duraklatılabilir ve bitiş sinyaliyle güvenli kaldırılır. Duvar sesi `Olaylar.kestirme_acildi` üzerinden Avlu'dan çalınır.
- HUD tarama satırına 48×48 TextureRect eklendi; metin göstergesi korundu. İkon görünür ve bilgi yalnız renkle verilmez.
- Renderer ve mobile/web geçersiz kılmaları `gl_compatibility`. Dar grafik oturumundaki movie HUD kırpılması `display/window/stretch/mode="viewport"` ile düzeltildi.
- Altı oynanış testi korundu; sekiz kaynak yükleme, üç model/sahne/hizalama, HUD ve olay sesleri testleri eklendi.

Değişen/eklenen dosyalar: `betikler/ModelBaglantisi.gd`, `Avlu.gd`, `Geometri.gd`, `Hud.gd`, `Oyuncu.gd`, `YankiKesesi.gd`; üç karakter/organ `.tscn` sahnesi; `project.godot`; `data/denge.json`, `metinler.csv` ve derlenmiş çeviri; `test/calistir.gd`, `senaryolar.gd`, `varliklar.gd`; `docs/DURUM.md`, `KARARLAR.md`, `VARLIKLAR.md`. Yeni `.uid`/`.import` metadata ve GLB'den çıkarılan üç JPEG de teslimin parçasıdır.

## Bağlanan varlıklar ve model bağlantı noktaları

| Sahne / düğüm | Kaynak | Ham AABB min / boyut | Ölçek | Y dönüşü | Yerel Y offset |
|---|---|---|---|---|---|
| `sahneler/oyuncu.tscn`, `Oyuncu/Model/GLB` | `varliklar/modeller/oyuncu.glb` | (-0,147281; -0,5; -0,321365) / (0,294562; 1; 0,642730) | 1,8 | +90° | +0,9 |
| `sahneler/dusmanlar/avci.tscn`, `Avci/Model/GLB` | `varliklar/modeller/avci.glb` | (-0,244219; -0,5; -0,426918) / (0,488438; 1; 0,853836) | 1,8 | +90° | +0,9 |
| `sahneler/yanki_kesesi.tscn`, `YankiKesesi/Model/GLB` | `varliklar/modeller/yanki_kesesi.glb` | (-0,284845; -0,5; -0,332191) / (0,569691; 1; 0,664383) | 0,4 | 0° | 0 |

Ölçek formülü: hedef boy / ölçülen AABB Y boyu. Karakterlerin tabanı y=0, önü -Z; kaynakların +X önü +90° ile çevrilir. Kese, VARLIKLAR.md gereği merkez orijininde kalır; oyuncudaki konumu önceki `organ_konum` değeridir. Model bağlantısı `_ready()` sonrasında oluşur; sahneler SceneTree içinde test edildi.

- `varliklar/sesler/saldiri.mp3`, `hasar.mp3`, `tarama.mp3`, `etkilesim.mp3`: döngü kapalı, konumsal.
- `varliklar/gorseller/yanki_ikon.png`: HUD `YankiIkon` TextureRect kaynağı.
- Kavram PNG'leri üretim referansıdır; oyuna eklenmedi.

## Yer tutucu kalanlar

`YER TUTUCU: Yok`. Tüm istenen oyun varlıkları yüklenip bağlandı. Geometri ve kod sesi yedekleri yalnız kaynak yüklenemediğinde kullanılmak üzere korundu. Testte yalnız `yer_tutucu_varliklar` listesinde açıkça kayıtlı kaynaklar ayrı listelenir; şu an liste boştur. Eksik kaynaklar otomatik olarak başarılı sayılmaz.

## Import sonucu

- Motor: PATH'teki `godot`, `4.7.2.stable.official.ed1daf0bf`.
- `godot --headless --path . --import`: ilk ve son çalışmada çıkış 0.
- GLB, PNG ve MP3 içe aktarımları tamamlandı. SCRIPT ERROR, parse veya eksik kaynak hatası yok. Sertifika ve editör ayarlarına yazma hataları ortamdan geliyor; tüm konsolun hatasız olduğu iddia edilmez.
- GLB'lerin gömülü üç JPEG dokusu Godot tarafından `varliklar/modeller/*_Color_*.jpg` olarak çıkarıldı; .import dosyaları ve model LOD üretimi korundu. Kaynak ve lisans VARLIKLAR.md'de.

## Test sonucu

Komut: `godot --headless --path . --script res://test/calistir.gd`.

| Test | Sonuç |
|---|---|
| Çapraz hareket normalizasyonu | GEÇTİ |
| Tek vuruş tek hasar | GEÇTİ |
| Ölü düşman etkisiz | GEÇTİ |
| Yankı tarama beklemesi | GEÇTİ |
| Taramayla açılan kırılgan duvar | GEÇTİ |
| Duraklatma ve devam | GEÇTİ |
| Oyuncu GLB yükleme | GEÇTİ |
| Avcı GLB yükleme | GEÇTİ |
| Yankı GLB yükleme | GEÇTİ |
| Yankı PNG yükleme | GEÇTİ |
| Saldırı MP3 yükleme | GEÇTİ |
| Hasar MP3 yükleme | GEÇTİ |
| Tarama MP3 yükleme | GEÇTİ |
| Etkileşim MP3 yükleme | GEÇTİ |
| Oyuncu sahnesi, GLB çocuğu, ölçü/hizalama | GEÇTİ |
| Avcı sahnesi, GLB çocuğu, ölçü/hizalama | GEÇTİ |
| Yankı sahnesi, GLB çocuğu, ölçü/hizalama | GEÇTİ |
| HUD ikon bağlantısı | GEÇTİ |
| Gerçek saldırı/hasar/tarama/yıkım olaylarında ses bağlantıları | GEÇTİ |

`TESTLER: 19 geçti, 0 başarısız`. Çıkış kodu 0. Tam çıktı: `build/dogrulama/test.log`. Test beklentileri gevşetilmedi; Model düğümünde gerçek GLB kaynağı, yüklenen tür, boy/dönüşüm ve oynayan MP3 kaynağı denetlenir. Boy ve taban kontrolü bağlayıcının AABB önbelleğiyle değil, sahnedeki gerçek meshlerin dünya dönüşümleriyle bağımsız ölçülür.

## Export sonucu

- `%APPDATA%/Godot/export_templates/4.7.2.stable/windows_release_x86_64.exe` mevcut; şablon indirilmedi.
- `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe`: çıkış 0.
- `build/GOC.exe`: 118673968 bayt; gömülü PCK. `build/` .gitignore kapsamındadır; exe ve kayıtlar sürüm kontrolüne eklenmedi.
- Tam export çıktısı: `build/dogrulama/export.log`. ERROR satırları:

```text
ERROR: Failed to read the root certificate store.
ERROR: Cannot save file '%APPDATA%/Godot/editor_settings-4.7.tres'.
ERROR: Error saving editor settings to %APPDATA%/Godot/editor_settings-4.7.tres
```

(Kullanıcı klasörü yolu `%APPDATA%` olarak kısaltıldı; özgün satırda yerel mutlak yol vardı.)

## Açılış kaydı sonucu

Komut: `godot --path . --write-movie build/kayit/asama1.png --fixed-fps 10 --quit-after 60`.

- Çıkış 0. 60 PNG oluştu: `asama100000000.png`–`asama100000059.png`; 1152×648, 10 FPS, 6 saniyelik kayıt. Bunlar benchmark/FPS ölçümü değildir.
- İlk ve son kareler gözle incelendi: modeller, malzemeler, zemin, ışık ve tüm HUD/ikon görünür. Avcı yaklaşır; son karede oyuncu canı 80'dir. SCRIPT ERROR veya renderer ERROR yok; çökme yok.
- Renderer satırı, aynen:

```text
OpenGL API OpenGL ES 3.0 (ANGLE 2.1.1 git hash: aaebda1c5a40) - Compatibility - Using Device: Google Inc. (Microsoft) - ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11-10.0.20348.1)
```

- Native OpenGL 3.3 desteği yok; Godot otomatik ANGLE/D3D11 yoluna geçti. Manuel `--rendering-driver opengl3` tekrarı gerekmedi. Günlük: `build/dogrulama/kayit.log`. İlgili tüm ERROR/WARNING satırları:

```text
ERROR: Failed to open 'user://logs/godot2026-10-15T22.12.15.log'.
ERROR: Failed to open log file for writing: user://logs/godot.log
WARNING: Your video card drivers seem not to support the required OpenGL 3.3 version, switching to ANGLE.
ERROR: Failed to read the root certificate store.
```

## GOC.exe pencereli çalıştırma sonucu

Komut: `build/GOC.exe --quit-after 60`. Çıkış 0; aynı Compatibility/ANGLE renderer. SCRIPT ERROR, eksik kaynak, renderer ERROR veya çökme yok. Günlük: `build/dogrulama/pencereli.log`.

```text
ERROR: Failed to open 'user://logs/godot2026-10-15T22.12.20.log'.
ERROR: Failed to open log file for writing: user://logs/godot.log
WARNING: Your video card drivers seem not to support the required OpenGL 3.3 version, switching to ANGLE.
ERROR: Condition "hr != ((HRESULT)0x00000000)" is true. Returning: ERR_CANT_OPEN
ERROR: WASAPI: init_output_device error.
WARNING: All audio drivers failed, falling back to the dummy driver.
ERROR: Failed to read the root certificate store.
```

## Compatibility uyumluluğu ve bilinen hatalar

- SDFGI, VoxelGI, volumetric fog, SSAO/SSIL ve özel Vulkan shader'ı kullanılmıyor. Mevcut Environment temel mesafe sisi, arka plan ve ambient ışık içerir; GLB'ler StandardMaterial3D, sahne DirectionalLight3D kullanır. Desteklenmeyen özellik uyarısı oluşmadı.
- Windows'ta native OpenGL 3.3 yoktur; ANGLE fallback gereklidir. Bu makinede Compatibility açılışı doğrulandı; başka donanım için performans iddiası yok.
- Fiziksel ses aygıtı açılamadı; Dummy sürücüsünde ses dosyalarının yüklenmesi ve olayda oynatılması test edildi. Hoparlörden işitsel kalite doğrulanmadı.
- Sertifika deposu ve kullanıcı/editör günlük dizinlerine yazma hataları sürüyor.
- İlk movie denemesinde dar pencere yüzünden HUD kırpıldı; viewport stretch düzeltmesinden sonraki son kayıt geçerlidir.
- Avcı için yol bulma yoktur; oyuncu ölümü sonrası yeniden doğma sonraki tasarım aşamalarındadır. Bu görev bunları eklemedi.

## Varsayımlar ve belge çelişkileri

- TASARIM §12 Forward+/Mobile önerisi yerine görevdeki Vulkan çökmesi gerekçesiyle Compatibility seçildi. Karar KARARLAR.md'ye işlendi.
- Kese için görevdeki taban y=0 yerine VARLIKLAR.md'nin merkez orijini/offset 0 kuralı uygulandı. Karakterler tabana hizalıdır.
- Etkileşim sesi Aşama 1'deki tek uygun olay olan duvar yıkımına bağlandı; E için yeni mekanik kurulmadı.
- MP3 biçimi önceki Krea üretimi ve KARARLAR.md kararıyla korundu; kayıplı format yeniden dönüştürülmedi.
- Belgelerdeki önceki "dosyalar yok" kayıtları tarihçedir; bu worktree'de mevcut kaynaklar import ile doğrulandı.

## Sonraki aşama için notlar ve AŞAMA 1 durumu

**AŞAMA 1 teknik teslimi tamamlandı:** çekirdek oynanış, gerçek varlık bağlantıları, 19 kabul denemesi, Windows export ve pencereli açılış kaydı doğrulandı. Sonraki tasarım aşamalarının merkez, organ aktarımı, kayıt/yükleme ve diğer düşmanları kapsam dışında kaldı.

Gerçek oyuncu hissi testi, işitsel değerlendirme ve başka donanımda performans doğrulaması ayrıca yapılmalıdır. Tüm ham günlükler `build/dogrulama/` içinde; makine özeti `sonuclar.json`.

## Public API ve sinyaller

### Test için public API

| Sınıf | Metotlar | Okunabilir durum |
|---|---|---|
| Oyuncu | `hareket_vektoru_hesapla(girdi: Vector2) -> Vector3`, `saldir() -> bool`, `kacin() -> bool`, `hasar_al(miktar: float) -> void` | `can: float`, `zincir_adimi: int`, `kaciniyor_mu: bool`, `kacin_bekleme: float`, `yanki: YankiKesesi` |
| Avci | `hasar_al(miktar: float, vurus_kimligi: String = "") -> void` | `can: float`, `hedef: Oyuncu` |
| YankiKesesi | `tara() -> bool` | `bekleme: float` |
| KirilganDuvar | `tara_ile_goster(sure: float) -> void`, `gorunur_mu() -> bool`, `yikildi_mi() -> bool`, `hasar_al(miktar: float, vurus_kimligi: String = "") -> void` | `can: float`, `kalan: float` |
| Oyun | `duraklat_degistir() -> void` | `kestirme_acik: bool`; duraklatma kaynağı `get_tree().paused` |
| Ayarlar | `sayi(anahtar: String) -> float`, `vektor(anahtar: String) -> Vector3` | `denge: Dictionary` |

- Oyuncu sinyalleri: `can_degisti(yeni_can: float)`, `saldirdi(adim: int, vurus_kimligi: String)`, `kacindi()`, `oldu()`.
- Avci sinyalleri: `can_degisti(yeni_can: float)`, `saldiri_hazirlaniyor()`, `oldu()`.
- YankiKesesi: `tarama_yapildi(yaricap: float)`.
- KirilganDuvar: `gorunurluk_degisti(gorunur: bool)`, `yikildi()`.
- Olaylar: `duraklatma_degisti(duraklatildi: bool)`, `kestirme_acildi()`.
- Aynı hedefte aynı boş olmayan vuruş kimliği tekrarlanırsa hasar uygulanmaz. Boş kimlik doğrudan hasar denemeleri içindir.
- Tarama grubu `taranabilir`, saldırı hedef grubu `hasar_alabilir`. Test sahnesi kurulduktan sonra bir fizik karesi bekleyin.
- InputMap: ileri=W, geri=S, sol=A, sag=D, saldir=sol fare, kacin=Space, organ_kullan=Q, etkilesim=E, duraklat=Escape. Girdiyi yalnız Oyuncu okur.
