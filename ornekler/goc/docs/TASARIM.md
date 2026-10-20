# GÖÇ — Prototip Tasarım Belgesi (sürüm 2)

Windows PC için tek oyunculu, üstten çapraz kameralı 3D aksiyon-keşif RPG prototipi. Bir kişi + yapay zekâ ekibi,
düşük bütçe. Amaç: çekirdek oynanışı gerçek oyuncularla sınamak. Başarı/satış garantisi yok; organ ikilemi
**sınanacak bir tasarım hipotezidir**, özgün ya da kanıtlanmış diye sunulmaz.

Bu belge tek doğru kaynaktır. Belgeyle çelişen bir karar gerekirse koda değil `docs/KARARLAR.md`'ye yaz ve gerekçele.

---

## 1. Vaat ve tek karar

“Sisin içinde avlan, bulduğun organları kendi bedenine takarak kullan, sonra onları sırtında yaşadığın dev
canlıya bağışlayıp yeni topraklara ulaş.”

**Karar:** Bulduğun gücü kendinde mi tutacaksın, yaşadığın canlıya mı vereceksin?
- Karar **geri alınabilir**: organlar yalnız merkezdeki Bağ Düzeneği'nde, istenildiği kadar aktarılır.
- Bir organ aynı anda yalnız bir yerdedir: `OYUNCU`, `CANLI` ya da henüz `BULUNMADI`.
- Oyuncunun tek organ yuvası vardır. Canlının iki yuvası vardır (her organ için bir).

## 2. Dünya ve duygu

Sis dünyayı kaplamış; insanlar dev gezgin canlıların (“Taşıyıcı”) sırtında yaşar. Bizim Taşıyıcı yaralı.
Oyuncu terk edilmiş bir tesisten (“Durgun Tesis”) organ çıkarır.
Hedef duygular: merkeze dönüş rahatlığı · bilinmeyene merak · ganimetle ilerleme gerilimi · canlıyı iyileştirmenin
görünür sonucu · yeni yetenekle eski alanda yeni yol.
Ara sahne ve metin duvarı yok. Hikâye çevre, kısa satırlar (en fazla 2 cümle) ve canlının tepkileriyle anlatılır.

## 3. Kapsam

**İçerik:** tek oyuncu · 1 merkez · 1 elle tasarlanmış keşif bölgesi · 1 ana görev · 2 organ · 1 yakın dövüş silahı ·
kaçınma · 3 düşman davranışı · 1 isteğe bağlı riskli yan alan · 1 açılabilir kestirme · bitiş ekranı · yerel kayıt.
Hedef süre 15–20 dk (test edilecek hedef, garanti değil).

**Kapsam dışı (altyapısı da kurulmaz):** MMO, co-op, sunucu, PvP, lonca, pazar, açık dünya, prosedürel harita,
açlık/susuzluk, dayanıklılık, tarım, inşa, yetenek ağacı, rastgele eşya özelliği, nadirlik renkleri, seslendirme,
sezon, ödeme, günlük ödül, seri giriş, loot box, gerçek zamanlı bekleme, harici analiz servisi.

## 4. Kamera ve kontroller

Üstten çapraz sabit 3D kamera (yaklaşık 55° eğim, 45° yatay açı, döndürme yok), oyuncuyu yumuşak takip eder.

| Eylem (InputMap adı) | Tuş |
|---|---|
| `ileri/geri/sol/sag` | W S A D — kameraya göre, normalize (çapraz hızlanmaz) |
| `saldir` | Sol tık — imleç arayüz üzerindeyse dünyaya gitmez |
| `kacin` | Space |
| `organ_kullan` | Q |
| `etkilesim` | E |
| `duraklat` | Escape (duraklatma + ayarlar) |

- Oyuncu fareyle zemindeki noktaya döner (zemin düzlemi ile ışın kesişimi).
- Kamera ile oyuncu arasındaki engeller yarı saydam olur (önce yerleşim, sonra soldurma).
- Odak kaybında ve duraklatmada oyun durur (`get_tree().paused`).
- Bir eylem tek bir sistemden tetiklenir (girdi yalnız `Oyuncu` düğümünde okunur).
- Oyun hızı kare hızından bağımsızdır: hareket ve zamanlayıcılar `_physics_process(delta)` ile.

## 5. Organlar

| | Oyuncuda (Q) | Canlıda |
|---|---|---|
| **Yankı Kesesi** | Tarama darbesi: 12 m içindeki gizli izleri ve **Kırılgan Duvar**'ı 6 sn gösterir; bekleme 8 sn. Görünen Kırılgan Duvar saldırıyla yıkılabilir. | Taşıyıcı bölgedeki **Derin Geçit**'in yerini bulur: kalıcı rota işareti + geçidin mühürü açılır. Organ geri alınsa da açık kalır (kalıcı bayrak). |
| **Soluk Çekirdeği** | Sis kalkanı: 5 sn boyunca tehlikeli **sis cebi** hasar vermez; bekleme 12 sn. Süre ve bekleme ekranda görünür. | Taşıyıcının nefesi düzelir, çevredeki sis incelir; **Son Yolculuk** başlatılabilir hale gelir. Yolculuk yalnız oyuncunun açık etkileşimiyle başlar. |

- Bağ Düzeneği ekranı her organ için şunları gösterir: şu an nerede · oyuncuya etkisi · canlıya etkisi ·
  aktarınca ne kazanılıp ne kaybedileceği (onaydan önce).
- Organ canlıya takılınca görünür ve işitilir tepki olur: Taşıyıcı'nın ilgili beden parçası parlar, nefes sesi ve
  ritmi değişir, kısa bir satır belirir.

### Kilitlenmeme kuralları (zorunlu)
1. Derin Geçit bir kez açılınca kalıcıdır (`gecit_acik = true`); Yankı'yı geri almak onu kapatmaz.
2. Soluk Çekirdeği'ne giden **ana yol sis cebinden geçmez**; sis kalkanı yalnız yan alan için gerekir.
3. Kestirme (Kırılgan Duvar) zorunlu değildir; ana yol onsuz da tamamlanır.
4. Hiçbir organ kalıcı kaybolmaz; ölümde organlar bulundukları yerde kalır.
5. Oyuncu her durumda merkeze dönebilir (bölge girişinde dönüş kapısı her zaman açık).

## 6. Mekân planı

```
                  [YAN ALAN: Sis Cebi]──(ödül: Nefes Kesesi = kalıcı +1 iyileştirme kapasitesi)
                          │ (tehlikeli sis; Soluk Çekirdeği oyuncudayken geçilir)
[MERKEZ: Taşıyıcı'nın sırtı]──Rampa──[1. Avlu]──[2. Koridor]──[3. Kuyu Salonu: Yankı Kesesi]
   · Bağ Düzeneği                │                    │
   · Taşıyıcı (nefes)            │              (Kırılgan Duvar = kestirme: 3 → Rampa)
   · Hazırlık Tezgâhı            │                    │
   · Dönüş Kapısı                └──────────[4. Derin Geçit (mühürlü)]──[5. Çekirdek Odası: Soluk Çekirdeği]
```
- Merkez sıcak renkler (turuncu/amber ışık), bölge soğuk renkler (mavi-gri, sis).
- Derin Geçit mührü Yankı canlıya takılınca açılır; rota işareti yerde parlayan iz olarak görünür.
- Kırılgan Duvar yalnız tarama sırasında belirgin çatlak dokusuyla görünür; yıkılınca 3 → Rampa kestirmesi açılır.
- Mekân basit geometriyle (CSG / MeshInstance + StandardMaterial) kurulur.

## 7. Görev durum makinesi

| Aşama (kod) | Hedef metni (anahtar) | Geçiş koşulu |
|---|---|---|
| `M0_UYANIS` | `hedef.m0` “Taşıyıcı'yı dinle” | Taşıyıcı ile etkileşim |
| `M1_TESISE_IN` | `hedef.m1` “Durgun Tesis'e in” | Kuyu Salonu'nda Yankı Kesesi alınır |
| `M2_YANKIYI_GETIR` | `hedef.m2` “Yankı Kesesi'ni Taşıyıcı'ya bağla” | Yankı canlıya takılır (geçit açılır) |
| `M3_DERIN_GECIT` | `hedef.m3` “Derin Geçit'ten Çekirdek Odası'na ulaş” | Soluk Çekirdeği alınır |
| `M4_NEFES` | `hedef.m4` “Soluk Çekirdeği'ni Taşıyıcı'ya bağla” | Soluk canlıya takılır |
| `M5_YOLCULUK` | `hedef.m5` “Son Yolculuğu başlat” | Taşıyıcı ile etkileşim (onaylı) |
| `M6_BITTI` | — | Bitiş ekranı: süre, ölüm sayısı, “Tekrar oyna”, “Çık” |

- Yanlış sıradaki etkileşimler ilerlemeyi bozmaz: koşul sağlanmadıysa kısa bir ipucu satırı gösterilir.
- Aşamalar geri gitmez; kayıttan yüklemede aşama ile organ yerleri tutarlılık denetiminden geçer.

## 8. Savaş

- Oyuncu: 3 vuruşluk tek saldırı dizisi (zamanlama penceresi), kaçınma (0,35 sn dokunulmazlık, bekleme 0,6 sn),
  organ yeteneği, can 100, net hasar tepkisi (geri itme, kırmızı parlama, kısa ses).
- Her saldırı bir “vuruş kimliği” taşır; aynı vuruş aynı hedefe bir kez hasar verir.
- Düşmanlar başlangıçta görüş hattı (raycast) olmadan oyuncuyu algılamaz; ölünce çarpışmayı ve saldırıyı bırakır.
- Hazırlıklar görsel olarak okunur: yere hedef dairesi + gövde rengi değişimi + kısa ses.

| Düşman | Davranış | Can | Hasar | Hazırlık |
|---|---|---|---|---|
| **Avcı** | Yaklaşır, kısa hazırlıktan sonra atılır | 30 | 10 | 0,5 sn |
| **Ağır** | Yavaş; belirgin hazırlıklı güçlü darbe, sonra 1,2 sn açık | 80 | 30 | 1,1 sn |
| **Püskürtücü** | Mesafede durur, yavaş mermi atar (kaçınılabilir) | 25 | 12 | 0,8 sn |

- Boss yok. Çekirdek Odası önündeki son karşılaşma: 1 Ağır + 2 Avcı.
- Ekran sarsıntısı düşük ve ayarlardan kapatılabilir.
- **Oynanış ayar değerleri `data/denge.json`'da** (hız, hasar, can, bekleme, menzil, sis hasarı, kaynak kaybı oranı) — yani tasarımcının ayarlamak isteyeceği sayılar.
  0, 1, -1, 0.5 gibi matematik/mantık sabitleri ve dizi indisleri kodda yazılır; bunları JSON'a taşıma.

## 9. Ganimet, iyileşme, ölüm

- Envanter: görev organları · tek kaynak “Kehribar” · iyileştirme şişeleri (temel 3).
- Kehribar'ın tek kullanımı: merkezde Hazırlık Tezgâhı'nda 5 Kehribar → bir sonraki sefer için +1 şişe (en fazla +2).
- Yan alan ödülü **Nefes Kesesi**: kalıcı +1 şişe kapasitesi (organ değil; yalnız Soluk oyuncudayken alınabilir).
  Bu, “Soluk'u kendinde tut” seçeneğine somut değer verir.
- Merkeze dönüş şişeleri temel seviyeye tamamlar.
- Ölüm: merkezde yeniden başlama; o seferin Kehribar'ının `kaynak_kayip_orani` (varsayılan 0,5) kadarı kaybolur.
  Bu kayıp ölümden önce duraklatma ekranında yazılıdır. Organlar ve görev ilerlemesi korunur.
- Bölgeden merkeze dönüşte düşmanlar yeniden doğar (yan alan ödülü tekrar doğmaz).

## 10. Görsel ve ses

- Basit geometri, stilize karanlık fantastik. Sis: önce Godot'un ucuz mesafe/yükseklik sisi; sis cebi için
  yarı saydam hacim + parçacık. Yol ve saldırı hazırlıkları her zaman okunur kalmalı.
- Taşıyıcı: birkaç beden parçası + nefes animasyonu (ölçek dalgası). Yolculuk: kısa geçiş (kararma + hareket).
- Ses: saldırı, hasar, organ kullanımı, etkileşim, canlının nefesi. Kaynak: harici servis ile üretim ya da kod ile üretilmiş
  basit sesler. Her varlık `docs/VARLIKLAR.md`'ye kaynak + lisans + geçici mi diye yazılır. Ücretli/lisansı belirsiz içerik yok.
- Kritik bilgi yalnız renkle verilmez (şekil + simge + metin).

### 10.1 Varlık üretimi
Karakterler ve önemli nesneler haricen hazırlanabilir. Ofis herhangi bir görsel üretim servisini kurmaz, yetkilendirmez veya otomatik kullanmaz.
Akış: önce tutarlı stil için kavram görseli (`generate_image`, aynı stil tarifi + gerekirse ilham panosu/moodboard),
sonra 3B model (`generate_3d` → GLB) ya da düşük poligon gerekiyorsa basit geometriyle yeniden kurulur.

| Varlık | Aşama | harici servis çıktısı | Not |
|---|---|---|---|
| Oyuncu (fenerli gezgin) | 1 | kavram + GLB | basit iskeletsiz model; yürüme hissi kod animasyonu (eğilme/zıplama) |
| Avcı | 1 | kavram + GLB | hızlı, ince, okunur siluet |
| Yankı Kesesi | 1 | GLB ya da ikon + basit model | parlayan kese; HUD ikonu da |
| Taşıyıcı (dev canlı) parçaları | 2 | kavram + birkaç GLB parça | sırt, nefes keseleri; nefes = ölçek animasyonu |
| Bağ Düzeneği | 2 | GLB | merkezde etkileşim noktası |
| Ağır, Püskürtücü | 3 | kavram + GLB | Ağır iri ve yavaş; Püskürtücü uzun boyunlu |
| Soluk Çekirdeği, Nefes Kesesi | 3 | GLB / ikon | |
| Sesler (saldırı, hasar, organ, etkileşim, nefes) | 1–3 | `generate_audio` | kısa, döngüsüz; nefes döngülü |
| Arayüz ikonları | 1–3 | `generate_image` (şeffaf zemin) | |

- Stil tarifi (tüm üretimlerde aynı): “stylized dark fantasy, simple low-poly shapes, muted cold blues and greys for
  the fog world, warm amber accents for the hub and organs, clean readable silhouettes, no text”.
- Dosyalar: `varliklar/modeller/*.glb`, `varliklar/gorseller/*.png`, `varliklar/sesler/*.ogg|wav`.
- Her üretim `docs/VARLIKLAR.md`'ye: dosya · harici servis modeli · tarih · lisans (harici servis kullanım koşulları) · geçici mi.
- Model yüklenemezse ya da oyunu yavaşlatırsa basit geometri yedeğe geçilir; bu `docs/KARARLAR.md`'ye yazılır.
- harici servis kredisi bitecekse (hata alınırsa) üretim durur, basit geometriyle devam edilir ve durumda belirtilir.

## 11. Arayüz, metinler, ayarlar

- HUD: can · şişe sayısı · takılı organ ve bekleme durumu · kısa hedef · yakın etkileşim istemi.
- Tüm metinler `data/metinler.csv` (anahtar, tr) üzerinden `TranslationServer` ile; kodda düz metin yok.
- Ayarlar (Escape): ana ses · ekran sarsıntısı aç/kapa · pencere/tam ekran · çözünürlük. `user://ayarlar.cfg`.
- 1080p'de yazılar rahat okunur (en az 22 px gövde).

## 12. Teknik yapı

```
project.godot            Godot 4.7 (Forward+ yoksa Mobile), ana sahne res://sahneler/ana_menu.tscn
autoload/Oyun.gd         görev aşaması, organ yerleri, kaynaklar, bayraklar (tek durum kaynağı)
autoload/Kayit.gd        kayıt/yükleme (user://kayit.json, .tmp → yeniden adlandır, .bak yedek, surum alanı)
autoload/Olaylar.gd      yerel olay günlüğü (user://olaylar.jsonl)
autoload/Ayarlar.gd      ayarlar
sahneler/                ana_menu, merkez, bolge, oyuncu, dusmanlar/*, arayuz/*
betikler/                sahnelere ait GDScript
data/denge.json          tüm ayar sayıları
data/metinler.csv        Türkçe metinler
test/                    başsız test botu ve senaryolar
docs/                    TASARIM, KARARLAR, VARLIKLAR, DURUM (her aşama sonu)
varliklar/               harici servis çıktıları: modeller/*.glb, gorseller/*.png, sesler/*
export_presets.cfg       "Windows Desktop" → build/GOC.exe
```
- Kayıt alanları: `surum`, `gorev_asamasi`, `organlar{yanki,soluk: BULUNMADI|OYUNCU|CANLI}`, `kehribar`,
  `sise_kapasitesi`, `gecit_acik`, `kestirme_acik`, `nefes_kesesi_alindi`, `tamamlandi`.
- Kayıt noktaları: organ bulma · merkeze dönüş · organ aktarma · kestirme açma · güvenli çıkış.
- Bozuk/eksik kayıt: çökme yok; “Yedekten yükle / Yeni oyun” seçeneği. “Yeni oyun” mevcut kaydı siliyorsa onay.
- Yüklemede tutarlılık: organlar çoğalmaz/kaybolmaz, açık yollar kapanmaz, oyuncu merkezdeki güvenli noktada doğar.
- Gereksiz eklenti, framework, genel sistem yok.

## 13. Olay günlüğü (yerel)

Alanlar yalnız: `olay`, `oturum` (rastgele), `sure_sn`, `ilgili` (aşama/organ), `surum`. Kişisel veri, IP, cihaz izi yok.
Olaylar: oturum_basladi · sefer_basladi · sefer_dondu · ilk_dusman_yenildi · organ_bulundu · organ_aktarildi ·
organ_kullanildi · gecit_acildi · kestirme_acildi · olum · tamamlandi · tekrar_oyna (bitişten sonra açık seçimle).

## 14. Doğrulama (her aşamada zorunlu)

- **Test botu** (`test/`): başsız çalışan GDScript senaryoları. Komut:
  `godot --headless --path . --script res://test/calistir.gd` → sonunda `TESTLER: N geçti, M başarısız` yazar,
  başarısızlıkta çıkış kodu 1.
- **Dışa aktarma:** `godot --headless --path . --export-release "Windows Desktop" build/GOC.exe`;
  `build/GOC.exe --headless --quit-after 300` hatasız açılmalı.
- **Görsel kayıt:** `godot --path . --write-movie build/kayit/asamaN.png --fixed-fps 10 --quit-after 120 <demo sahnesi>`
  (pencere açabiliyorsa). Yapılamadıysa açıkça yaz.
- Her aşama sonunda `docs/DURUM.md`: ne çalışıyor · ne doğrulandı (komut + çıktı) · ne doğrulanamadı · kalan engel.
- “Çalışıyor” yalnız gerçekten çalıştırılıp doğrulanan şey için yazılır. Test cihazı: VDS (Windows Server 2022),
  test edilmeyen donanım için FPS iddiası yok.

## 15. Aşamalar ve kabul

1. **Beş dakikalık çekirdek:** tek alan (Avlu), hareket, kamera, saldırı, kaçınma, Avcı, Yankı Kesesi (oyuncuda),
   tarama ile görünen Kırılgan Duvar'ın yıkılıp yol açması, HUD, duraklatma. Testler: hareket normalizasyonu,
   tek vuruş tek hasar, ölü düşman etkisiz, organ beklemesi, duvar yalnız taramadan sonra yıkılır.
2. **Ayırt edici karar:** merkez, Taşıyıcı (nefes), Bağ Düzeneği ekranı, organ aktarma ve iki taraftaki etkiler,
   Derin Geçit mührü, kayıt sistemi. Testler: aktarma tutarlılığı, kalıcı geçit bayrağı, kayıt/yükleme, bozuk kayıt.
3. **Tam macera:** Koridor, Kuyu Salonu, Derin Geçit, Çekirdek Odası, Soluk Çekirdeği, Ağır ve Püskürtücü,
   yan alan + Nefes Kesesi, Hazırlık Tezgâhı, ölüm/kaynak kaybı, Son Yolculuk, bitiş ekranı, olay günlüğü.
4. **Doğrulama ve teslim:** kabul listesinin tamamı (aşağıda), ayarlar, performans notu, `.exe`, README.

**Kabul listesi:** (1) yeni oyundan sona ulaşılır · (2) ölüp devam edilir · (3) kapatıp kayıt yüklenir ·
(4) iki organ doğru yerde kalır · (5) aktarma ilerlemeyi kilitlemez · (6) ana görev yan alana girmeden biter ·
(7) duraklatma ve yeniden başlatma çalışır · (8) dışa aktarılan sürüm editörsüz açılır (yapılamadıysa yazılır).

**Son ilke:** Önce iyi hissettiren beş dakika, sonra tamamlanabilir macera. Kötü hissi daha fazla içerikle örtme.
