# Kararlar

> Bu belge geçmiş geliştirme kayıtlarını içerir. Servis adları ve kaynak adresleri yayımdan kaldırılmıştır. Eski araç ve indirme talimatları güncel entegrasyon değildir; varlıkların lisans kısıtları korunur.

## 2026-10-16 — AŞAMA 4 (2): kabul ve performans

- K8'in başsız testi, release EXE'yi değil geçici bir `--export-pack` ZIP'ini ve varsa `build/GOC.exe`'nin gömülü paketini editör ikilisiyle `--main-pack` üzerinden açar. EXE'nin kendisini test içinden `OS.execute` ile çalıştırmak, ortamın EXE onay denetimini atlatmak olacağından yapılmadı. Doğrudan pencereli EXE koşusu onay verilmediği için "doğrulanmadı — onay gerekli" kaldı.
- K3 "kapatıp kayıt yüklenir": mevcut test aynı süreçte durumu sıfırlayıp diskten yükler. Ayrı süreç açılmadı. Görev "gerekirse güncelle" dediği ve test diskteki dosyayı gerçek yükleme yolundan okuduğu için değiştirilmedi.
- Performans ölçümü `test/` altında yalnız `--perf-kosu` argümanı ve debug derlemesiyle çalışır; release paketine girmez. Bu yüzden ölçüm `build/GOC.exe` ile değil editör ikilisiyle yapıldı. Ölçümde V-Sync kapatıldı; aksi halde kare süresi ekran tazelemesine kilitlenirdi.
- Ekran görüntüleri `docs/ekran/` altında. `.gdignore` ile Godot içe aktarmasından ve paketten dışlandı (`docs/*` zaten export dışı).

## 2026-10-16 — AŞAMA 4 (1): Ayarlar

- TASARIM §11 ses birimini ve çözünürlük listesini vermez. Ana ses lineer 0..1 saklanır, Master bus'a dB'ye çevrilerek uygulanır; 0 susturur. Çözünürlük listesi varsayımdır: 1152×648 (proje pencere boyutu, varsayılan), 1280×720, 1600×900, 1920×1080, 2560×1440. Tam ekranda boyut saklanır, pencereye dönünce uygulanır.
- Kodda ekran sarsıntısı yoktu (grep: `shake|sars|h_offset|v_offset` boş). Ayarın anlamlı olması için tek giriş noktası `KameraSarsintisi.sars()` eklendi ve yalnız oyuncu hasarına bağlandı; kamera takip konumunu bozmamak için `h_offset/v_offset` kullanılır. Bayrak orada denetlenir; test, ofsetin başka betikte yazılmadığını da sınar.
- Varsayılanlar `denge.json` → `ayarlar` içinde tek yerdedir; `Ayarlar.gd` yalnız oradan okur. Ayar durumu mevcut `Ayarlar` autoload'una eklendi (TASARIM §12 "autoload/Ayarlar.gd ayarlar").
- Duraklatma menüsünde Devam ve Ayarlar yan yana durur: alt alta dizilim paneli HUD iyileşme düğmesine bindiriyordu.
- Başsız modda pencere modu/boyutu ölçülemez; test uygulanmak istenen değeri doğrular.

## 2026-10-16 — AŞAMA 3 (3): test, export, kayıt

- §15 kabul (5) "tüm organ yerleşimleri": iki organ × üç konumun 9 kombinasyonu ele alındı. Görev/tek yuva kuralıyla geçerli 6'sı (BB, OB, CB, CO, CC, OC; ilk harf Yankı) ayrı oturumda diskten yüklenip ana yol + Merkez dönüşü fiziksel kapılarla yürünür. Geçersiz 3'ü (BO, BC, OO) `Kayit.dogrula` tarafından reddedilir ve `kayittan_uygula` durumu değiştirmez.
- Kayıt dosyası JSON tam hassasiyetle yazılır (`JSON.stringify(..., true, true)`). Önceki kısaltılmış yazım `sure_sn` ve Soluk zamanlarını son basamaklarda değiştiriyordu. Godot JSON okuyucusu kesirli sayılarda tek ULP sapabildiğinden K3 eşitliği tam sayı/bayraklarda birebir, kesirlilerde mevcut `test_tolerans` ile denetlenir.
- Kayıtta bulunan iki görsel hata düzeltildi: bitiş ekranı Son Yolculuk kararmasıyla aynı CanvasLayer katmanındaydı ve siyah perdenin altında kalıyordu; artık bir üst katmanda. Duraklatma paneli genişliksizdi; AŞAMA 3'teki satır kaydıran ölüm kaybı metni paneli buton genişliğine daraltıyor, HUD'un şişe satırına bindiriyordu. Panel `hud_genislik` (ana menüyle aynı veri) genişliğinde ekran ortasında açılır; kullanılmayan `duraklat_y` silindi. İki durum da K1/K7'de denetlenir.
- `hedef.m3` AŞAMA 2'den kalan "Devam bölgesi sonraki aşamada" metnini gösteriyordu; TASARIM §7 metnine çevrildi.
- `GOC.exe`'yi doğrudan çalıştırma bu ortamda onay istedi ve onaylanmadı. Duman testi aynı gömülü paketle `godot --headless --main-pack build/GOC.exe --quit-after 300` olarak yapıldı; release ikilisinin kendisi bu adımda çalıştırılmadı.

## 2026-10-16 — AŞAMA 3 (2c–2f): organlar, ölüm ve son

- §1 tek oyuncu yuvası bağlayıcıdır. Diğer organ oyuncudaysa yeni organ alma/oyuncuya aktarma reddedilir; önce Merkez'de mevcut organ canlıya bağlanır. Otomatik yer değiştirme yoktur. Soluk geri alınınca görev gerilemez; M5'te yolculuk için yeniden canlıya bağlanmalıdır. Yankı geri alınsa da geçit açık kalır.
- §9 ölüm/kaynak kaybı artık uygulanır; AŞAMA 2'nin kaynak koruma kararı geçersizdir. Yalnız o sefer kazanılan Kehribar'ın JSON oranı (0,5) kaybolur. Bölünemeyen kaynakta kayıp yukarı yuvarlanır; önceki seferlerin Kehribar'ı korunur. Organlar, görev, açık yollar, kalıcı kapasite ve süre korunur; ölüm sayısı artar. Merkez'de tam can ve temel + kalıcı kapasite kadar şişe ile doğulur. Harcanmış seferlik hazırlık iade edilmez.
- §9 ganimet miktarı ve şişe iyileştirmesi belirtmez. Prototip: Avcı 2, Ağır 4, Püskürtücü 2 Kehribar; şişe 40 can. Ganimet düşman ölümünde doğrudan envantere girer. İyileştirme HUD düğmesi ve public API ile kullanılır; yeni tuş atanmadı. Sis hasarı 12 / 1 sn varsayılandır. Tüm değerler `asama3.ilerleme` içindedir.
- Tezgâh her kullanımda 5 Kehribar karşılığı sonraki sefer için +1 şişe hazırlar; en çok +2. Merkez'den çıkınca hazırlık tüketilir, odalar arası geçişte tekrar verilmez. Nefes Kesesi yalnız Soluk oyuncudayken bir kez alınır; organ yuvasını işgal etmez, kalıcı kapasiteyi +1 artırır. Yükleme Merkez'e güvenli dönüş olduğundan şişeleri temel + kalıcı kapasiteye doldurur ve sefer Kehribar sayacını sıfırlar; toplam Kehribar aynen korunur.
- Önceki alt adımda bildirilen oda değişiminde düşman yeniden doğması düzeltildi: aynı seferde ölenlerin kimlikleri Oyun'da tutulur, tekrar ganimet vermez. Merkez'den yeni sefere çıkınca veya güvenli kayıt yükleyince sıfırlanır. Bu geçici sefer listesi kayda yazılmaz; güvenli yükleme Merkez'de başlar. Avcı davranış betiği değişmedi.
- Kayıt sürümü 2. Geçerli sürüm 1 doğrulanıp yeni sayaçlar/süre/şişe ve Soluk zamanları güvenli varsayılanlarla eklenir. Tanınmayan sürüm, eksik veya tutarsız veri kurtarma akışına gider; kısmi durum uygulanmaz. Geçerli sürüm 2 iki organın tek yuva kuralını ve M0–M6 tutarlılığını doğrular.
- Yeni oyun ve bitişteki açık Tekrar oyna seçimi kaydı atomik olarak değiştirir, eski dosya .bak olur. Yeni oyun disk yazımı başarısız olsa da oynanabilir; görünür kayıt hata sinyali ve güvenli çıkıştaki ikinci istek kuralı korunur. Bu durumda diskte eski kayıt kalabilir; başarı iddia edilmez.
- Son Yolculuk yalnız Merkez'deki Taşıyıcı etkileşimi + ayrı onay, M5 ve canlıda Soluk ile başlar. JSON'daki 2 sn kararma/model hareketi sonunda ortak temalı bitiş ekranı görünür. Tamamlanmış kayıt yüklenince bitiş ekranı yeniden açılır; otomatik tekrar başlamaz. Süre duraklatma hariç aktif oyun süresidir; tamamlanınca donar.
- Görev başında Soluk/Nefes GLB'leri ve sesleri yoktu; son kontrol sırasında dört yeni GLB, dört kavram PNG ve iki MP3 çalışma kopyasına dışarıdan geldi. Hepsi import edilip bağlandı; ölçekler gerçek AABB'den ölçüldü, VARLIKLAR.md'ye yazıldı. Bu uzman harici servis indirme/üretimi yapmadı. Yükleme yedekleri korunur. Export, kayıt ve kalıcı yeni kabul testleri sonraki görevde; bu teslimde her alt adımın mevcut 35 testi ve geçici duman doğrulaması çalıştırılır. Yer tutucu listesi gerçek dosyalar için kaldırılınca mevcut veri güdümlü varlık testleri otomatik genişler.

## 2026-10-16 — AŞAMA 3 (2a–2b): mekânlar ve düşmanlar

- Aşama 2'deki geçici Avlu buluntusu kaldırıldı; Yankı artık gerçek Kuyu Salonu'ndadır. Eski fiziksel buluntu/dönüş testi aynı koşulları gerçek salonda sınar; 35 test korunur. Bağımsız Aşama 1 Avlu sözleşmesi ve Avcı betiği değişmez.
- TASARIM §6'nın ana bağlantıları E ile sahne geçişidir: Merkez ↔ Avlu ↔ Koridor ↔ Kuyu Salonu; Koridor ↔ Sis Cebi; Avlu ↔ mühürlü Derin Geçit ↔ Çekirdek Odası. Kuyu → Rampa/Merkez kestirmesi duvar yıkılınca açılır. §5 kural 5 için her yeni odada koşulsuz Merkez dönüş kapısı bulunur. Var olan Avlu duvarı/şekilleri korunur; Kuyu'daki ikinci temsil aynı kalıcı kestirme bayrağını kullanır.
- §6 oda ölçüsü ve kapı koordinatı vermez. `asama3.mekanlar` basit prototip yerleşimidir. Sis Cebi bu görevde yalnız yan mekân ve saydam sis görselidir; hasar, kalkan ve ödül 2c–2f görevine bırakılır. Ana rota Sis Cebi'ne girmez.
- §8 son karşılaşmayı Çekirdek Odası önünde 1 Ağır + 2 Avcı olarak tanımlar; özel tetik koşulu vermez. Derin Geçit'te `(0,0,-5)` merkezli 9 m alana canlı oyuncu girince, mühür açıksa bir kez oluşturulur (oda örneği başına). Öldürme zorunluluğu veya geri dönüş kilidi eklenmez. Koordinat/yarıçap JSON'dadır.
- Ağır 80/30/1,1 sn, açık süre 1,2 sn; Püskürtücü 25/12/0,8 sn belge değerleridir. Belirtilmeyen hız, menzil, bekleme, mermi boyutu/hızı/ömrü ve gövde ölçüleri `asama3.dusmanlar` içinde prototip varsayımlarıdır. Yeni odalar yeniden örneklendiğinde düşmanlar yeniden oluşur; sefer içi oda bazlı düşman kalıcılığı bu teslimde yoktur.
- Ağır/Püskürtücü GLB'leri hâlâ diskte yoktur. §10.1 uyarınca özgün basit geometri kullanılır; indirme/üretim denenmez. `Model` bağlayıcıları dosyalar gelince gerçek AABB ile 2,6/2,2 m boy ve önerilen +90° Y dönüşü uygular; dosyalar olmadığından yön gözle doğrulanamadı.
- TASARIM §12 Forward+/Mobile der; önceki Compatibility kararı korunur. Yeni odalar mevcut ucuz mesafe sisi, gölgesiz ışık ve taş shader'ını kullanır; volumetrik sis eklenmez. Bu alt teslimde export/kayıt yapılmaz; aşama sonu doğrulamasına bırakılır.

## 2026-10-16 — AŞAMA 3, Adım (1): harici servis varlıkları

- Görev indirmeyi yalnız "harici servis talimatında/araç açıklamasında belirtilen node indirme aracı"yla sınırlıyor; harici servis MCP'de böyle bir araç yok ve depoda node betiği yok. Diğer yöntemler görevce yasak olduğundan 10 varlık üretildi ama indirilmedi; URL'ler VARLIKLAR.md'de. Godot uzmanı TASARIM §10.1 yedek kuralıyla basit geometri kullanır.
- Ses biçimi MP3: Seed Audio yalnız MP3 verir (AŞAMA 1 kararıyla aynı); TASARIM §10.1 `.ogg|wav` der.
- TASARIM §10.1 "nefes döngülü" der. `nefes.mp3` döngüye uygun istendi, dikiş doğrulanmadı; mevcut kod PCM nefesi yedek kalır.
- Ad: yan alan ödülü `nefes_kesesi`, Taşıyıcı keseleri `tasiyici_nefes_kesesi` (AŞAMA 2 kararı) korunur.

## 2026-10-16 — AŞAMA 2, Adım (1): Merkez varlıkları

- Görev örneği `nefes_kesesi.glb` adını veriyor. TASARIM §9 ve §10.1'de "Nefes Kesesi" Aşama 3 yan alan ödülüdür (organ değil, ayrı GLB/ikon). Çakışmayı önlemek için Taşıyıcı'nın nefes keseleri `tasiyici_nefes_kesesi.glb` olarak adlandırıldı.
- TASARIM §10.1 Taşıyıcı için "sırt, nefes keseleri" der; ayrı parça listesi vermez. Görevdeki örnekler izlendi: sırt platformu, nefes kesesi, omurga/diken dizisi. Dosya adları `tasiyici_` önekiyle ASCII ve küçük harftir.
- Zorunlu indirme yöntemi `curl` izin onayı istediği için 8 dosya indirilemedi. Görev gereği başka araçla dolanılmadı; URL'ler VARLIKLAR.md'de. Merkez bağlaması dosyalar gelene kadar basit geometriyle yapılır (TASARIM §10.1 yedek kuralı).

## 2026-10-15 — Aşama 1 son bağlama ve Compatibility

- TASARIM §12 Forward+/Mobile önerir. Bu görev Vulkan bulunmayan makinedeki çökme için açıkça Compatibility ister. Yalnız renderer bu nedenle `gl_compatibility` olur; oynanış ve fizik değişmez.
- VARLIKLAR.md'nin eski "dosyalar yok" bölümleri tarihçedir. Bu çalışma kopyasında üç GLB, dört MP3 ve dört PNG mevcut ve import edilmiştir; yeniden üretim/indirme yapılmaz.
- Görev tüm modellerin tabanını y=0 ister; VARLIKLAR.md Yankı Kesesi için merkez orijini ve offset 0 tanımlar. Belge önceliğiyle yalnız karakterler tabana hizalanır; oyuncunun çocuğu organ merkezli kalır.
- VARLIKLAR.md etkileşim sesini sonraki aşamanın E etkileşimlerine ayırır; Aşama 1'de etkileşim noktası yoktur. Görevdeki yedek varsayımla ses `Olaylar.kestirme_acildi` üzerinden duvar yıkımına bağlanır; yeni etkileşim sistemi eklenmez.
- Küçük grafik oturumunda Windows pencereyi 604×648'e sınırlar; movie çıktısı 1152×648 kalırken doğrudan çizim HUD'ı kırptı. Kontrol düğümlerinin mantıksal konumları doğruydu. `display/window/stretch/mode="viewport"` ile ayrı viewport çizimi seçildi; aynı oturumda HUD ve ikonun tam göründüğü PNG ile doğrulandı. Fizik/kamera açısı değiştirilmedi.

## 2026-10-15 — Aşama 1, Adım 1: harici servis varlıkları

- Görev `git commit` istiyor; AGENTS.md §7 ve görev notu commit/merge'i yasaklıyor. Belgeye uyuldu: commit yapılmadı, Ofis'e bırakıldı.
- Görev PNG'ler için `varliklar/kavram/` ve `varliklar/ikonlar/` diyor; TASARIM §10.1 `varliklar/gorseller/*.png` diyor. Belge önceliği gereği hedef yollar `varliklar/gorseller/` altındadır.
- Görev `.ogg` ya da `.wav` istiyor; harici servis `bytedance/seed-audio-1.0` yalnız MP3 döndürdü. Godot 4 MP3'ü `AudioStreamMP3` ile doğrudan içe aktarır; dönüştürme bağlama adımına bırakıldı. TASARIM §10.1 `sesler/*.ogg|wav` der; bu sapma bilinçlidir.
- Görev tarama sesi için "tarama", TASARIM §10 "organ kullanımı" der; aynı olaydır (`YankiKesesi.tara()`), ad `tarama` olarak korundu.
- Tüm harici servis üretimleri tamamlandı, fakat `curl` indirmesi ortam onay politikasıyla engellendi. URL'ler VARLIKLAR.md'ye yazıldı. Yer tutucular oyunda korunur.
- Reality Checker düzeltmesi: WebFetch ile 11 dosya indirildi, ama oturum önbelleğine (`~/.claude/.../tool-results`) kaydedildi. Projeye `cp` izin denetiminde "sensitive file" olarak reddedildi. Reddedilen kopyalamayı başka komutla (Python, Godot vb.) yapmak izin engelini aşmak olacağından denenmedi; açık onay istendi.
- Tripo GLB'lerinin ön yönü glTF'nin olağan +Z'si değil, +X çıktı (geometriden çıkarım). Bağlamada Y ekseninde +90° önerildi; ilk taslaktaki 180° önerisi geçersiz.

## 2026-10-15 — Aşama 1, Adım 2/3 ve 3/3

- Görevin sonundaki zorunlu commit isteği, aynı görevin başındaki yasak ve AGENTS.md §7 ile çelişiyor. Kullanıcının belgeye öncelik kuralıyla commit/merge yapılmadı; Ofis'e bırakıldı.
- harici servis araçları ve bakiye okunabildi, fakat üç kavram üretimi otomatik onay denetiminde reddedildi. Kullanıcının açık yedek akışı gereği yer tutucular korundu; üretim engelini aşmak için başka yol denenmedi.
- Kavram/ikon için beklenen PNG yolları, görevdeki örnek klasörler yerine TASARIM §10.1 uyarınca `varliklar/gorseller` altındadır. Dosyalar üretilmedi.
- Ham CSV, include_filter bulunmasına rağmen export paketinde yer almadı. Release açılışı takıldı; debug motoruyla paket içinden null CSV okuyucu hatası doğrulandı. Çeviriler CSV'den Godot tarafından üretilen Translation kaynağı üzerinden yüklenir. Metinlerin tek kaynağı `data/metinler.csv` olarak kaldı; bu export uyumluluğu düzeltmesidir.
- `--script` başlangıcında autoload sınıf kayıtları hazır olmadığından test giriş noktası, tipli sahne senaryolarını ertelenmiş olarak yükler. Oynanış sınıfları testsiz veya tipsiz hale getirilmedi.

Belgeden sapmalar ve gerekçeleri (tarih, karar, neden).

## 2026-10-16 — AŞAMA 2 test ve teslim

- AŞAMA 1'in 19 denemesi korunur; ana test girişine 13 AŞAMA 2 denemesi eklenir. Gerçek kullanıcı kaydı yerine rastgele proje içi build test klasörü kullanılır ve temizlenir; bu makinede kullanıcı dizini izinleri belirsizdir.
- Bozuk kayıt denemesinde statik JSON okuyucunun konsola ERROR üretmesi görüldü. JSON nesnesinin parse dönüş kodu kullanılır; kurtarma davranışı değişmez, geçersiz içerik motor hatası olarak sunulmaz.
- Görsel kayıtta `%g` desteklenmediği görüldü; bilgi metinleri `%.1f` kullanır. Bağ penceresinin başlığı kırpılmasın diye görsel yükseklik 610'dan 550'ye çekildi. Oynanış değerleri korunur.
- Kayıt senaryosu yalnız `test/asama2_demo.tscn` ve açık `--asama2-demo=merkez|aktarma` argümanıyla çalışır; release export'a girmez ve normal akışı değiştirmez. Zamanlama verisi `asama2_demo` altındadır.
- TASARIM §5 kural 2'nin tam geometrik testi Çekirdek Odası/Soluk yolu AŞAMA 3'te olmadığı için yapılamaz. Mevcut döngünün Soluk olmadan ve kestirme kapalıyken tamamlanması ayrıca sınandı; bu, tam kural testi yerine geçirilmedi. Kapsamı genişletip AŞAMA 3 haritası eklenmedi.

## 2026-10-16 — Reality Checker: kilitlenme düzeltmesi

- TASARIM §5 kural 5'i sağlamak için aktif oturumda bölge ölümü Merkez'e ertelenmiş dönüş başlatır. Yeni oyuncu tam canla güvenli noktada doğar. Organ konumu, görev, açık geçit/kestirme ve kaynaklar değişmez; kaynak kaybı Aşama 3'e bırakılır. Önceki "ölüm dönüşü tamamen sonraki aşamada" kararı bu güvenli dönüş için geçersizdir.
- Kayıt başarısızlığında ilk pencere kapatma isteği ilerleme kaybını açıkça bildirir; ikinci istek yine kayıt dener ve başarısız olsa da çıkar. Kullanıcı yazma izni olmayan ortamda uygulamada tutulmaz. Yeni oyun/yükleme bu çıkış onayını sıfırlar.
- Soluk bilgi metninin süreleri `asama2.soluk_sure=5` ve `asama2.soluk_bekleme=12` alanlarından biçimlenir. Soluk yeteneği eklenmedi; yalnız mevcut bilgi ekranındaki sabit metin temizlendi.

## 2026-10-16 — AŞAMA 2 kod adımı

- Önceki varlık belgesi indirme engeli bildirir; bu görev başlangıcında dört yeni GLB ve kavram PNG'leri diskte bulundu. İndirme denenmedi; mevcut dosyalar import edilip gerçek AABB ile bağlandı. VARLIKLAR.md güncel bölümüne ölçüler yazıldı.
- TASARIM §7 M1→M2 koşulu Kuyu Salonu buluntusudur; gerçek Kuyu Salonu haritası §15'te Aşama 3 kapsamındadır. Aşama 2 karar döngüsünün denenebilmesi için Avlu'da duvarın önünde `KuyuSalonuBuluntusu` adlı geçici işaret kullanıldı. Tam harita veya sonraki aşama özellikleri eklenmedi. Aşama 3'te buluntu gerçek salona taşınmalıdır.
- M0–M2 geçişleri uygulanır. Belgedeki M2 başarı koşulu M3 hedefini açar; bu yalnız Aşama 2 bitiş sınırıdır, M3 oynanışı değildir. Soluk bilgileri ön izlenir ama Soluk bulunamaz/aktarılamaz.
- Bağımsız Aşama 1 test sahnesi oyuncuda Yankı Kesesi ile başlama sözleşmesini korur. Yeni oyun menüden açıkça başlatılır ve M0/BULUNMADI kurar. Testler global durumu yeni oyuna çevrilmeden eski 19 senaryoyu çalıştırabilir.
- Nefes için harici lisanslı ses eklenmedi; özgün PCM sinüs döngüsü kullanılır. Merkez görsel/mesafe/ses ayarları denge.json `asama2` alanındaki prototip varsayılanlarıdır; mevcut ayarlara dokunulmadı.
- Güvenli yükleme merkezde doğurur. Ölü kayıt canı başlangıç canına getirilir; organ ve kalıcı bayraklar korunur. Tam ölüm/yeniden doğma ve kaynak kaybı sistemi Aşama 3'e bırakıldı.
- Bu alt adım yeni kabul testi, export ve görsel kayıt istemez; yalnız import, mevcut 19 test ve başsız Merkez açılışı doğrulanır. TASARIM §14 aşama sonu export/kayıt zorunluluğu sonraki alt adıma bırakılır.

## 2026-10-15 — Görsel his düzeltmesi

- Yeni değerler yalnız `gorsel` altında; eski 94 anahtar korunur. Sabit açı, yumuşak takip ve renkler TASARIM ile uyumludur.
- Tam 16 m algılama çemberi hedef oyuncu boyuyla kadraja sığmaz. Tam siluet %9,91 boyda tutuldu; saldırı hazırlığı görünür. Menziller değiştirilmedi.
- Yazılamayan kullanıcı shader önbelleğinin `_save_to_cache` hatası için disk shader önbelleği kapatıldı. Compatibility korunur; son kayıtta renderer hatası yok.
- Başlangıçta PNG bulunmadı; önce kaydı değişikliklerden önce özgün projeden yeniden üretildi.

## 2026-10-15 — Aşama 1, Adım 1/3

- Son teslim satırındaki commit isteği, AGENTS.md ve görevdeki açık commit/merge yasağıyla çelişiyor. Commit/merge yapılmadı; Ofis'e bırakıldı.
- Görevde sabit kamera ifadesi var; TASARIM §4 gereği açı sabit, konum yumuşak takip eder.
- Görevde tarama için örnek eylem adı verilmiş; belgeye uygun `organ_kullan` kullanıldı. Beklenen GLB yolları `assets` yerine belgedeki `varliklar/modeller` altında.
- Olaylar bu adımda istenen sinyal veri yoludur. TASARIM §12/13 yerel günlük görevini tanımlar; günlük kapsam gereği Aşama 3'e bırakıldı. Kayit da Aşama 2'ye kadar iskelettir.
- Belge Aşama 1 için harici servis varlıklarını içerir; bu alt görev açıkça basit geometri ve sonraki model bağlantısını ister. Yer tutucular kullanıldı, harici servis üretimi yapılmadı.
- AGENTS test botu komutu denendi; dosya yok. Bu adımda bot yazma yasağı korundu; geçici ve silinen assert betiğiyle çekirdek durumlar denetlendi.
- TASARIM §14 tam aşama sonu exe/görsel kayıt bekler. Bu alt adım kod teslimidir; dışa aktarma ve görsel kayıt tamamlanmadı, DURUM'da açıkça belirtildi.



## 2026-10-20 — Servis bağımsız belgeler

Kullanıcı isteğiyle belirli görsel üretim sağlayıcısının entegrasyonu, adı ve kaynak bağlantıları güncel depodan kaldırıldı. Varlıklar ve mevcut lisans kısıtları değişmedi; görsel ve ses dosyaları kodun MIT lisansına dahil edilmedi. Eski günlükler önceki çalışmaların kaydıdır, güncel kurulum talimatı değildir.
