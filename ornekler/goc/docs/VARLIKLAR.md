# Varlıklar ve lisanslar

## Lisans

Bu bölüm 2026-10-16'da, GitHub yayını hazırlığında eklendi. Aşağıdaki tarihli kayıtlar değiştirilmedi.

### Kapsam

| Grup | Dosyalar | Kaynak | Lisans |
|---|---|---|---|
| Krea çıktıları | `varliklar/modeller/*.glb`, GLB'lerden Godot'un çıkardığı `varliklar/modeller/*_Color_*.jpg` dokuları, `varliklar/gorseller/*.png`, `varliklar/sesler/*.mp3` | Krea AI ile üretildi (görsel: `krea/krea-2/medium`, `openai/gpt-image-2.5-flare`; 3B: `tripo/h3.1`; ses: `bytedance/seed-audio-1.0`). Model, tarih ve prompt kayıtları aşağıda | Krea kullanım koşulları (aşağıya bakın). MIT kapsamında **değildir** |
| Özgün kod ile üretilen içerik | `varliklar/shaderlar/tas_karo.gdshader`, koddaki yedek geometri ve PCM sesler | Bu proje için yazıldı | Projenin kod lisansı: MIT (`LICENSE`) |
| `.import`, `.uid` metadata | Godot'un ürettiği yan dosyalar | Godot içe aktarıcısı | Ait olduğu dosyanın lisansını izler |

Tüm Krea çıktıları prototip için **geçicidir**.

### Krea kullanım koşulları

- Resmî metin: [Terms of Use | Krea](https://www.krea.ai/terms). Erişim 2026-10-16'da doğrulandı. `https://www.krea.ai/terms-of-use` adresi de aynı metni açar. Sayfada "son güncelleme" tarihi yok.
- Üretim sırasında hesap planı **Individual Pro** (ücretli) olarak kaydedildi (aşağıdaki bakiye notları).
- Metinde doğrulanan ifadeler (2026-10-16 okuması):
  - Krea, kullanıcılara hizmet için "worldwide, non-exclusive, non-sublicensable and non-transferable" bir lisans verir.
  - "Krea may allow you to commercialize certain Content generated from the Services, subject to your adherence to our copyright dispute policy".
  - "Your rights to use, reproduce, modify, distribute, or store of any Content may be dependent on specific purchases or plans".
- Kesin olmayan, yayından önce doğrulanması gereken noktalar:
  - Üretilen içeriğin sahipliği kimde? Okunan metin çıktı sahipliğini açıkça belirtmiyor. **[DOĞRULANMALI]**
  - Bu varlıklar ticari kullanıma uygun mu? Metin yalnız "may allow" diyor. **[DOĞRULANMALI]**
  - Haklar plan türüne bağlı mı? Metne göre olabilir. Individual Pro'nun bu varlıkları kapsadığı ayrıca doğrulanmadı. **[DOĞRULANMALI]**
  - Atıf gerekli mi? Okunan metinde açık bir atıf şartı bulunmadı, ama bu "atıf gerekmez" demek değildir. **[DOĞRULANMALI]**
  - Varlıkları açık bir depoda yeniden dağıtmak (GitHub'da GLB/PNG/MP3 yayımlamak) serbest mi? **[DOĞRULANMALI]**
  - Krea'nın kullandığı üçüncü taraf modellerin (Tripo, OpenAI, ByteDance) koşulları ek kısıt getiriyor mu? **[DOĞRULANMALI]**
- Bu belge hukuki görüş değildir. Yayından önce koşulların güncel metni ve hesap planı yeniden okunmalıdır.

### Krea URL'leri

Aşağıdaki kayıtlardaki `gen.krea.ai` ve `app-uploads.krea.ai` adresleri gizli bilgi değildir. Ancak bunlar **genel erişimli** bağlantılardır: adresi bilen herkes dosyayı indirebilir. Ne kadar süre açık kalacakları da garanti değildir.

## 2026-10-16 — AŞAMA 3 (2c–2f) bağlantıları

- Görev başında dosyalar yoktu; son dosya kontrolünde 08:43'te çalışma kopyasına dışarıdan eklenmiş dört GLB, dört kavram PNG ve iki MP3 bulundu. Bu uzman indirme/üretim yapmadı. Kaynak/lisans: aşağıdaki AŞAMA 3 (1) Krea üretim kaydı ve Krea kullanım koşulları; tümü geçici prototip.
- `sahneler/soluk_cekirdegi.tscn` ve `sahneler/nefes_kesesi.tscn`: `OrganGorseli.gd` çalışma anında `Model` bağlantısını kurar. Gerçek GLB'ler bağlıdır; yükleme başarısız olursa özgün küre yedeği kalır. Soluk merkezli; yerdeki buluntusu +0,2 m yukarıda. Nefes Kesesi tabanı y=0; dönüş 0°, ön yön önemsizdir.
- Gerçek bağlantılar: Çekirdek Odası `Organlar/SolukCekirdegi/Gorsel/Model`; Sis Cebi `Organlar/NefesKesesi/Gorsel/Model`; oyuncu `SolukCekirdegi/Gorsel/Model`; Merkez `CanliSoluk/Model`. Bu bağlantı düğümlerine sabit adlar verildi.
- Yedek küreler, tezgâh kutusu ve kararma geçişi bu proje için özgün kodla üretildi; üçüncü taraf içerik/lisans yok. Gerçek `sis_kalkani.mp3` Q açılışına, `nefes.mp3` Merkez nefes oyuncularına bağlandı. Nefes MP3 kopyasında loop açık; mevcut özgün PCM ve 780 Hz kalkan sesi yükleme yedeği olarak korunur. Soluk canlıdayken ritim değişir. Döngü dikişi dinlenerek doğrulanmadı.
- Mevcut Yankı PNG'si ve prosedürel `ArayuzSimgesi` Soluk bilgi satırlarıyla birlikte kullanılır. Yeni harici ikon/font eklenmedi. Ağır/Püskürtücü artık gerçek GLB kullanır; eski yer tutucular yedek olarak kodda kalır. Ön yön için belgedeki +90° kullanıldı; gözle yön kontrolü sonraki görsel kayıt adımındadır.

| Dosya (`varliklar/` altında) | Bayt | Ham AABB boyutu | Uygulanan ölçek / Y dönüşü / Y offset |
|---|---:|---|---|
| `modeller/agir.glb` | 780332 | (0,470778; 0,762134; 1,0) | 3,411475 / +90° / +1,3; boy 2,6 m |
| `modeller/puskurtucu.glb` | 706044 | (0,432191; 1,0; 0,420275) | 2,2 / +90° / +1,1; boy 2,2 m |
| `modeller/soluk_cekirdegi.glb` | 528376 | (0,600843; 1,0; 0,927596) | 0,4 / 0° / 0; boy 0,4 m |
| `modeller/nefes_kesesi.glb` | 540108 | (0,313492; 1,0; 0,894667) | 0,45 / 0° / +0,225; boy 0,45 m |
| `sesler/sis_kalkani.mp3` | 17598 | — | Q kullanımı, tek ses |
| `sesler/nefes.mp3` | 65663 | — | Merkez, döngü açık |

Kavram PNG boyutları: `agir_kavram.png` 629569, `puskurtucu_kavram.png` 408951, `soluk_cekirdegi_kavram.png` 498641, `nefes_kesesi_kavram.png` 417978 bayt. Kavramlar oyuna bağlanmaz. İçe aktarmada çıkarılan `*_Color_*.jpg` dosyaları bu Krea GLB'lerinin dokularıdır; kaynak/lisans aynıdır. Ham AABB ve ölçek kanıtı: `build/asama3-2cf/smoke-varlik.log`.

## 2026-10-16 — AŞAMA 3 (2a–2b) bağlantı durumu

- `varliklar/modeller/agir.glb` ve `puskurtucu.glb` çalışma kopyasında yok. Yeni indirme/üretim yapılmadı; aşağıdaki Krea kaynak/lisans notları korunur.
- `sahneler/dusmanlar/agir.tscn` → `Dusman/Model`: özgün kutu yer tutucu, 1,6 × 2,6 × 1,4 m, taban y=0, -Z ileri. GLB gelirse mevcut AABB bağlayıcısı 2,6 m boy, +90° Y, taban y=0 uygular.
- `sahneler/dusmanlar/puskurtucu.tscn` → `Dusman/Model`: özgün dar gövde ve uzun boyun yer tutucu; toplam boy 2,2 m, taban y=0, -Z ileri. GLB gelirse 2,2 m boy, +90° Y, taban y=0 uygulanır. Şekiller yalnız renkle ayrılmaz.
- Yeni mekân geometri/sis hacmi, hazırlık halkaları ve mermi küresi kodla oluşturuldu (`Mekan.gd`, `YeniDusman.gd`, `DusmanMermisi.gd`). Kaynak: bu proje için özgün kod; üçüncü taraf varlık/lisans yok. Geçici prototip görselleridir.
- Mevcut oyuncu, Avcı, Yankı GLB'leri ve saldırı/hasar MP3'leri korunur. Hazırlık sesi mevcut `Geometri.ses(..., "ses_hazirlik")` PCM yedeğidir. Soluk/ödül/sis kalkanı bu alt göreve bağlanmadı.

## 2026-10-16 — AŞAMA 3, Adım (1): düşmanlar, organ, ödül ve sesler (üretildi, indirilemedi)

Krea bakiyesi: başta 17052,37 CU, sonda 16118,22 CU (harcanan ≈ 934,2 CU). Plan: Individual Pro.
Lisans: Krea kullanım koşulları (ücretli Pro planı). Tümü geçici: evet (prototip). Tarih: 2026-10-16.

**10 varlığın hepsi Krea'da üretildi. Hiçbiri diske inmedi; hedef yollarda dosya yoktur, bayt boyutu ölçülemedi.**
Görev indirme için yalnız "Krea talimatında/araç açıklamasında belirtilen node indirme aracı"na izin verir; curl, PowerShell, Python ve Godot HTTPRequest yasaktır.
Böyle bir araç bulunamadı:
- Krea MCP sunucu talimatı ve `generate_*`/`get_job` açıklamaları indirme aracından söz etmez; sonuçlar yalnız URL olarak döner.
- Krea'nın dosya araçları (`read_files`, `write_files*`, `list_files`) Krea Files içindir. `read_files` açıklaması "not a URL fetcher: https:// URLs (generated images, uploads) ... fail" der ve yerel diske yazmaz.
- Depoda node indirme betiği yok (`**/*.{js,mjs,cjs}` eşleşmesi 0).
Bu yüzden indirme denenmedi; izin denetimi başka yolla dolanılmadı. Godot uzmanı dosyalar gelene kadar bu parçalar için basit geometri ve mevcut kod sesini kullanmalı.
Krea URL'lerinin süresiz kalacağı garanti değildir. Onaylı bir yöntemle aşağıdaki URL'ler hedef yollara indirilmeli, `wc -c` ile boyut ölçülmeli ve GLB AABB'si ölçülüp aşağıdaki tahminlerin yerine yazılmalıdır.

**Kullanıcının çalıştıracağı liste** (Aşama 2'de işe yarayan yol; uzman bu görevin kuralı gereği çalıştırmadı). Proje kökünde, Git Bash:

```sh
curl -sSfL https://app-uploads.krea.ai/public/d1ddf6ac-778b-49f2-9491-88fa829b10a3.glb -o varliklar/modeller/agir.glb
curl -sSfL https://app-uploads.krea.ai/public/aeb5953b-66a4-4c87-b227-0ee9e1a6d19e.glb -o varliklar/modeller/puskurtucu.glb
curl -sSfL https://app-uploads.krea.ai/public/c35415f5-2668-475f-9061-60fb7ecc2062.glb -o varliklar/modeller/soluk_cekirdegi.glb
curl -sSfL https://app-uploads.krea.ai/public/1bbcf28b-c01c-4fa5-83d9-b438527e4d64.glb -o varliklar/modeller/nefes_kesesi.glb
curl -sSfL https://gen.krea.ai/images/c6861218-7bf3-4543-a6d8-1a38f4da169e.png -o varliklar/gorseller/agir_kavram.png
curl -sSfL https://gen.krea.ai/images/56acedea-a41e-4dd4-b621-a5470419d94a.png -o varliklar/gorseller/puskurtucu_kavram.png
curl -sSfL https://gen.krea.ai/images/8ad9f60a-824a-47a6-8de6-f93495e73fba.png -o varliklar/gorseller/soluk_cekirdegi_kavram.png
curl -sSfL https://gen.krea.ai/images/aeaac64a-13bf-4c67-a0a0-29f2b86220e9.png -o varliklar/gorseller/nefes_kesesi_kavram.png
curl -sSfL https://app-uploads.krea.ai/audio/55905be8-ed4e-4789-a829-35dfe0aff381.mp3 -o varliklar/sesler/sis_kalkani.mp3
curl -sSfL https://app-uploads.krea.ai/audio/a6984001-8a3d-44a6-adad-77de812d01aa.mp3 -o varliklar/sesler/nefes.mp3
wc -c varliklar/modeller/{agir,puskurtucu,soluk_cekirdegi,nefes_kesesi}.glb varliklar/gorseller/{agir,puskurtucu,soluk_cekirdegi,nefes_kesesi}_kavram.png varliklar/sesler/{sis_kalkani,nefes}.mp3
```

Sonra uzman bayt, AABB, üçgen, ön yön ve ses sürelerini ölçüp bu bölümdeki "indirilemedi" ve "tahmin" notlarını değiştirir. Reality Checker'ın açtığı `agir.glb`: ≈ 780 KB, glTF 2.0, Tripo3D, 9654 üçgen (bağımsız doğrulama; diske inmedi).

Ortak stil metni (TASARIM §10.1), tüm kavram promptlarının başında; ardından virgül ve nesne metni:

> stylized dark fantasy, simple low-poly shapes, muted cold blues and greys for the fog world, warm amber accents for the hub and organs, clean readable silhouettes, no text

### Kavram görselleri — `krea/krea-2/medium`, 1K, `creativity=raw`

| Hedef yol | Krea URL | En-boy | Nesne promptu | Bayt |
|---|---|---|---|---|
| `varliklar/gorseller/agir_kavram.png` | https://gen.krea.ai/images/c6861218-7bf3-4543-a6d8-1a38f4da169e.png | 3:4 | `single full-body huge heavy brute creature, massive hunched shoulders, thick stone-like grey-blue armored hide, very large club-like forearms, short thick legs, small head sunk between shoulders, slow and powerful silhouette clearly bigger and bulkier than a human, neutral A-pose with arms away from body, both feet visible on same ground baseline, front view, isolated on plain light grey background, no scenery, no pedestal, no shadow, game creature model concept` | indirilemedi |
| `varliklar/gorseller/puskurtucu_kavram.png` | https://gen.krea.ai/images/56acedea-a41e-4dd4-b621-a5470419d94a.png | 3:4 | `single full-body ranged spitter creature with a very long thin neck, small head with wide open tube-like mouth for spitting projectiles, lean four-limbed body standing upright on two legs, short arms, cold grey-blue skin, faint amber glow in the throat, tall distinctive silhouette, neutral A-pose with limbs separated from body, both feet visible on same ground baseline, front view, isolated on plain light grey background, no scenery, no pedestal, no shadow, game creature model concept` | indirilemedi |
| `varliklar/gorseller/soluk_cekirdegi_kavram.png` | https://gen.krea.ai/images/8ad9f60a-824a-47a6-8de6-f93495e73fba.png | 1:1 | `single small isolated pale breath core organ, smooth faceted crystal-like heart shape wrapped in soft misty membrane, gentle warm amber light inside, thin wisps of pale fog curling around it, compact simple form, whole object centered, front view, isolated on plain light grey background, no hands, no scenery, no pedestal, no shadow, game prop model concept` | indirilemedi |
| `varliklar/gorseller/nefes_kesesi_kavram.png` | https://gen.krea.ai/images/aeaac64a-13bf-4c67-a0a0-29f2b86220e9.png | 1:1 | `single small isolated breath pouch pickup item, soft rounded leathery bladder bag tied with a cord at the top, two folded lung-like lobes, warm amber glow seeping through thin skin, compact readable collectible shape, whole object centered, front view, isolated on plain light grey background, no hands, no scenery, no pedestal, no shadow, game pickup prop model concept` | indirilemedi |

Kavramlar oyuna bağlanmaz; 3B üretim girdisi ve stil referansıdır.

### 3B modeller — `tripo/h3.1`, görselden 3B, `generate_texture=true`

Prompt: metin yok; girdi yalnız ilgili kavram görselinin URL'sidir (`input_mode=image`). Düşük poligon için `face_limit` verildi.
Ad: Aşama 3 yan alan ödülü `nefes_kesesi` adını kullanır; Taşıyıcı'nın keseleri `tasiyici_nefes_kesesi` olarak kalır (KARARLAR.md, AŞAMA 2).

| Hedef yol | face_limit | GLB URL | Önizleme URL | Hedef sahne / düğüm | Bayt |
|---|---|---|---|---|---|
| `varliklar/modeller/agir.glb` | 10000 | https://app-uploads.krea.ai/public/d1ddf6ac-778b-49f2-9491-88fa829b10a3.glb | https://app-uploads.krea.ai/public/0758d0c3-f754-4c39-b811-f2dc0f204ffa.png | `sahneler/dusmanlar/agir.tscn` → `Agir/Model` | indirilemedi |
| `varliklar/modeller/puskurtucu.glb` | 10000 | https://app-uploads.krea.ai/public/aeb5953b-66a4-4c87-b227-0ee9e1a6d19e.glb | https://app-uploads.krea.ai/public/a76c7dd0-6939-48a3-98ce-55d0c2e16d9b.png | `sahneler/dusmanlar/puskurtucu.tscn` → `Puskurtucu/Model` | indirilemedi |
| `varliklar/modeller/soluk_cekirdegi.glb` | 3000 | https://app-uploads.krea.ai/public/c35415f5-2668-475f-9061-60fb7ecc2062.glb | https://app-uploads.krea.ai/public/639cb8ef-ec64-4d53-b1e9-89be8b2305b3.png | Çekirdek Odası ödül/buluntu düğümü (`.../SolukCekirdegi/Model`); Bağ Düzeneği canlı yuvası ve oyuncu organ konumu (Yankı ile aynı düzen) | indirilemedi |
| `varliklar/modeller/nefes_kesesi.glb` | 3000 | https://app-uploads.krea.ai/public/1bbcf28b-c01c-4fa5-83d9-b438527e4d64.glb | https://app-uploads.krea.ai/public/322b333d-1993-407c-a7d9-b2cbcaa21f02.png | Sis Cebi yan alan ödülü (`.../NefesKesesi/Model`) | indirilemedi |

**Ölçek ve yön (tahmin; dosyalar inmediği için ölçülmedi).** Önceki 7 Tripo çıktısında ölçülen davranış: **en uzun eksen 1,0 birime** normalize (karakterlerde Y, sırt/omurga/düzenekte X ya da Z), AABB merkezi orijinde, +Y yukarı, düğüm dönüşümü yok. Karakterlerin ön yönü +X çıktı; Godot'ta Y ekseninde +90° ile -Z'ye çevrildi. Mevcut `ModelBaglantisi.gd` gerçek AABB'yi ölçer; aşağıdakiler başlangıç değeridir.

| Model | Önerilen hedef boy | Ölçek formülü | Ön yön / döndürme | Zemin hizası (y offset) |
|---|---|---|---|---|
| `agir` | ≈ 2,6 m (Avcı 1,8 m'den belirgin iri; TASARIM §10.1 "iri ve yavaş") | `2.6 / aabb.size.y` | +X beklenir → **+90°**; gözle doğrulanmalı | Taban y=0: `-aabb.position.y × ölçek` (merkezli 1,0 kutuda ≈ +1,3). İri gövde genişliği 1,0'ı aşarsa en uzun eksen X/Z olabilir; önce AABB'ye bakın |
| `puskurtucu` | ≈ 2,2 m (uzun boyun dahil) | `2.2 / aabb.size.y` | +X beklenir → **+90°**; ağız/boyun yönüyle doğrulanmalı (mermi çıkışı -Z) | Taban y=0: ≈ +1,1 |
| `soluk_cekirdegi` | ≈ 0,4 m (Yankı Kesesi ile aynı) | `0.4 / max(aabb.size)` | Ön yön önemsiz; 0° | Yankı gibi merkez orijinde; offset 0. Yerde duruyorsa ≈ +0,2 |
| `nefes_kesesi` | ≈ 0,45 m | `0.45 / max(aabb.size)` | 0° | Yerde: taban y=0, `-aabb.position.y × ölçek` (≈ +0,225) |

Bütçe: tek LOD; içe aktarmada `meshes/generate_lods` açık. Dokular önceki çıktılarda 2048² JPEG; `VRAM Compressed`, 1024 sınırı önerilir.
Ağır/Püskürtücü hazırlıkları (TASARIM §8) yer dairesi + renk değişimiyle okunur; Avcı'daki malzeme kopyası/renk yöntemi aynen uygulanabilir.

### Sesler — `bytedance/seed-audio-1.0`, çıktı MP3

Seed Audio süre parametresi almaz; süre promptla istendi, ölçülmedi. Format MP3 (AŞAMA 1 KARARLAR kararıyla aynı sapma; TASARIM §10.1 `.ogg|wav` der).

| Hedef yol | Krea URL | Bağlanacağı olay | Prompt | Bayt |
|---|---|---|---|---|
| `varliklar/sesler/sis_kalkani.mp3` | https://app-uploads.krea.ai/audio/55905be8-ed4e-4789-a829-35dfe0aff381.mp3 | Soluk Çekirdeği oyuncudayken Q (`organ_kullan`) → sis kalkanı açılışı; konumsal, döngü kapalı | `Sound effect only, about 1.0 second: a protective mist shield activating, soft airy whoosh of fog swirling inward then a gentle shimmering hum with a warm magical tone, stylized dark fantasy game ability, single event, no voice, no speech, no music, no ambience` | indirilemedi |
| `varliklar/sesler/nefes.mp3` | https://app-uploads.krea.ai/audio/a6984001-8a3d-44a6-adad-77de812d01aa.mp3 | Taşıyıcı nefesi (`Merkez`, şu an `TasiyiciNefes.gd` kod PCM sesi); **döngü açık** içe aktarılmalı. Organ takılınca ritim değişimi (§5) `pitch_scale` ile | `Sound effect only, about 4 seconds: one full slow deep breath of a giant creature, a long low inhale followed by a long low exhale, wet organic airflow with a soft rumbling chest resonance, steady even volume, starts and ends at the same quiet level so it can loop seamlessly, stylized dark fantasy game, no voice, no speech, no music, no ambience, no other sounds` | indirilemedi |

Döngü dikişi dinlenerek doğrulanmadı; tık sesi duyulursa içe aktarmada `loop_offset` ya da baş/son kırpma gerekir. Kod PCM nefesi yedek olarak kalmalı.

## 2026-10-16 — AŞAMA 2 kod bağlantıları (güncel)

Önceki indirme engeli kaydı tarihçedir: bu kod görevinin başlangıcında dört GLB ve dört kavram PNG hedef yollarda mevcuttu. Yeni indirme/üretim yapılmadı. Kaynak ve lisans önceki Krea `tripo/h3.1` / Krea kullanım koşulları kaydıdır; prototip varlıkları geçicidir.

| Dosya | Bağlantı | Gerçek AABB min / boyut | Ölçek; Y dönüş; yerel Y offset |
|---|---|---|---|
| `varliklar/modeller/tasiyici_sirt.glb` | `Merkez/TasiyiciSirt/GLB` | (-0,5; -0,108209; -0,368077) / (1; 0,216418; 0,736154) | 12; 90°; -1,298508 |
| `varliklar/modeller/tasiyici_nefes_kesesi.glb` | `Merkez/NefesKeseleri/Kese0/Model/GLB`, `Kese1/Model/GLB` | (-0,454045; -0,5; -0,457291) / (0,908090; 1; 0,914582) | 1,5; 0°; +0,75 |
| `varliklar/modeller/tasiyici_omurga.glb` | `Merkez/TasiyiciOmurga/Model/GLB` | (-0,225908; -0,419696; -0,5) / (0,451817; 0,839392; 1) | 2,9783456; 0°; +1,25 |
| `varliklar/modeller/bag_duzenegi.glb` | `Merkez/BagDuzenegi/Model/GLB` | (-0,387912; -0,473053; -0,5) / (0,775825; 0,946107; 1) | 1,1626594; 90°; +0,55 |

Godot'ta dört model yüklendi; yer tutucu kullanılmadı. `MerkezModeli` yükleme başarısızlığı için basit kutu yedeği korur. Sırtın uzun X ekseni Z'ye çevrildi; üst nokta y=0. Omurganın uzun ekseni zaten Z. Ön yönler belgenin önerisidir; pencereli görsel denetim sonraki adımdadır. Nefes animasyonu taban pivotlu Node3D'ye uygulanır.

Godot GLB'lerden dört `*_Color_*.jpg` dokusu ve `.import` metadata çıkardı; dokular aynı GLB/Krea kaynak ve lisansına tabidir. Kavram görselleri oyunda kullanılmaz. Mevcut Yankı GLB'si mantıksal konuma göre oyuncu, buluntu veya Bağ Düzeneği görselinde gösterilir; tek konum kaynağı Oyun'dadır.

`TasiyiciNefes.gd` nefes sesi: özgün matematiksel PCM sinüs döngüsü, harici örnek/ücretli içerik yok. Diskte yeni ses dosyası yoktur. Basit mühür, rota ve geometri yedekleri özgün kod + Godot yerleşik API kaynaklıdır; Godot motoru MIT. Geçici: evet.

## 2026-10-16 — AŞAMA 2, Adım (1): Merkez varlıkları (üretildi, indirilemedi)

Krea bakiyesi: başta 17977,26 CU, sonda 17052,37 CU (harcanan ≈ 924,9 CU). Plan: Individual Pro.
Lisans: Krea kullanım koşulları (ücretli Pro planı). Tümü geçici: evet (prototip). Tarih: 2026-10-16.

**8 varlığın hepsi Krea'da üretildi. Hiçbiri diske inmedi.** Zorunlu indirme yöntemi engellendi:

```text
$ curl -sSfL "https://gen.krea.ai/images/dd13578b-4e3d-488b-a462-5fd9637696f4.png" -o ".../varliklar/gorseller/tasiyici_sirt_kavram.png"
This command requires approval
$ curl -sSfL "https://app-uploads.krea.ai/public/8748f2d8-ba4e-41f8-b63d-36ff8e75da37.glb" -o ".../varliklar/modeller/tasiyici_sirt.glb"
This command requires approval
```

Görev gereği izin denetimi başka araçla (WebFetch, Python, Godot) dolanılmadı. Aşağıdaki hedef yollarda dosya **yoktur**; bayt boyutu ölçülemedi.
Godot uzmanı indirme onaylanana kadar bu parçalar için basit geometri kullanmalı. Krea URL'lerinin süresiz kalacağı garanti değildir.

Onaylı ortamda proje kökünden (Git Bash):

```sh
curl -sSfL https://app-uploads.krea.ai/public/8748f2d8-ba4e-41f8-b63d-36ff8e75da37.glb -o varliklar/modeller/tasiyici_sirt.glb
curl -sSfL https://app-uploads.krea.ai/public/988b983e-f053-4960-b38c-3975c390dc6a.glb -o varliklar/modeller/tasiyici_nefes_kesesi.glb
curl -sSfL https://app-uploads.krea.ai/public/a1d298b0-69ff-4fca-896d-8750d2a6c1d8.glb -o varliklar/modeller/tasiyici_omurga.glb
curl -sSfL https://app-uploads.krea.ai/public/b2d41394-1c18-4738-aa0f-4b36cf3f04f3.glb -o varliklar/modeller/bag_duzenegi.glb
curl -sSfL https://gen.krea.ai/images/dd13578b-4e3d-488b-a462-5fd9637696f4.png -o varliklar/gorseller/tasiyici_sirt_kavram.png
curl -sSfL https://gen.krea.ai/images/c206e49d-88d6-4292-9459-b34e5db72203.png -o varliklar/gorseller/tasiyici_nefes_kesesi_kavram.png
curl -sSfL https://gen.krea.ai/images/c37a50b0-a24e-411b-9e31-9fa88d42f487.png -o varliklar/gorseller/tasiyici_omurga_kavram.png
curl -sSfL https://gen.krea.ai/images/ea3bac83-f7f6-4538-8972-01bc42b21f42.png -o varliklar/gorseller/bag_duzenegi_kavram.png
wc -c varliklar/modeller/tasiyici_*.glb varliklar/modeller/bag_duzenegi.glb varliklar/gorseller/tasiyici_*_kavram.png varliklar/gorseller/bag_duzenegi_kavram.png
```

Ad notu: Taşıyıcı'nın nefes keseleri `tasiyici_nefes_kesesi` adını alır. Düz `nefes_kesesi` adı TASARIM §9/§10.1'deki Aşama 3 yan alan ödülü **Nefes Kesesi**'ne ayrılmıştır (bkz. KARARLAR.md).

Ortak stil metni (TASARIM §10.1), tüm kavram promptlarının başında; ardından virgül ve aşağıdaki nesne metni:

> stylized dark fantasy, simple low-poly shapes, muted cold blues and greys for the fog world, warm amber accents for the hub and organs, clean readable silhouettes, no text

### Kavram görselleri — `krea/krea-2/medium`, 1K, `creativity=raw`

| Hedef yol | Krea URL | En-boy | Nesne promptu | Bayt |
|---|---|---|---|---|
| `varliklar/gorseller/tasiyici_sirt_kavram.png` | https://gen.krea.ai/images/dd13578b-4e3d-488b-a462-5fd9637696f4.png | 4:3 | `single isolated section of a giant creature's back used as a walkable platform, broad gently curved slab of thick grey-blue hide with flat top surface, subtle bony plates and leathery folds, rounded organic edges, a few small warm amber glowing veins, whole piece visible, three-quarter top view, isolated on plain light grey background, no characters, no buildings, no scenery, no shadow, game environment prop concept` | indirilemedi |
| `varliklar/gorseller/tasiyici_nefes_kesesi_kavram.png` | https://gen.krea.ai/images/c206e49d-88d6-4292-9459-b34e5db72203.png | 1:1 | `single isolated breathing sac organ of a giant creature, round dome-shaped translucent membrane bulb growing from a short fleshy grey-blue base ring, warm amber glow inside, a few thin vein lines, symmetrical simple form, whole object centered, front view, isolated on plain light grey background, no scenery, no pedestal, no shadow, game prop model concept` | indirilemedi |
| `varliklar/gorseller/tasiyici_omurga_kavram.png` | https://gen.krea.ai/images/c37a50b0-a24e-411b-9e31-9fa88d42f487.png | 4:3 | `single isolated spine ridge segment of a giant creature, a row of three large curved bony dorsal spikes rising from a short strip of grey-blue hide, pale bone color with cold blue tint, simple chunky shapes, whole object visible, side view, isolated on plain light grey background, no scenery, no pedestal, no shadow, game environment prop concept` | indirilemedi |
| `varliklar/gorseller/bag_duzenegi_kavram.png` | https://gen.krea.ai/images/ea3bac83-f7f6-4538-8972-01bc42b21f42.png | 1:1 | `single isolated organ binding apparatus shrine, a waist-high round stone and bone altar with two cradle sockets on top for holding glowing organs, thick fleshy tubes and brass rings connecting it to the base, warm amber glowing core in the center, sturdy symmetrical silhouette, whole object visible, front three-quarter view, isolated on plain light grey background, no characters, no scenery, no shadow, game interactable prop concept` | indirilemedi |

Kavramlar oyuna bağlanmaz; 3B üretim girdisi ve stil referansıdır. Bağ Düzeneği'ndeki iki yuva, TASARIM §1'deki canlının iki organ yuvasını görselleştirir.

### 3B modeller — `tripo/h3.1`, görselden 3B, `generate_texture=true`

Prompt: metin yok; girdi yalnız ilgili kavram görselinin URL'sidir (`input_mode=image`). Düşük poligon için `face_limit` verildi (Aşama 1 ile aynı model).

| Hedef yol | face_limit | GLB URL | Önizleme URL | Hedef sahne / düğüm | Bayt |
|---|---|---|---|---|---|
| `varliklar/modeller/tasiyici_sirt.glb` | 4000 | https://app-uploads.krea.ai/public/8748f2d8-ba4e-41f8-b63d-36ff8e75da37.glb | https://app-uploads.krea.ai/public/58afe621-9af4-4b3b-a1e3-57fc47a34538.png | `Merkez/TasiyiciSirt` (gerekirse `Merkez/TasiyiciSirt/Parca*` ile döşenir) | indirilemedi |
| `varliklar/modeller/tasiyici_nefes_kesesi.glb` | 2000 | https://app-uploads.krea.ai/public/988b983e-f053-4960-b38c-3975c390dc6a.glb | https://app-uploads.krea.ai/public/1586e27c-369b-4c49-8371-bdf5895e41f6.png | `Merkez/NefesKeseleri/*` (tek parça, çoğaltılır) | indirilemedi |
| `varliklar/modeller/tasiyici_omurga.glb` | 3000 | https://app-uploads.krea.ai/public/a1d298b0-69ff-4fca-896d-8750d2a6c1d8.glb | https://app-uploads.krea.ai/public/2bc092d0-bc32-4326-b857-53b7a3bfceef.png | `Merkez/TasiyiciOmurga/*` (sırt kenarı/ortası, çoğaltılabilir) | indirilemedi |
| `varliklar/modeller/bag_duzenegi.glb` | 5000 | https://app-uploads.krea.ai/public/b2d41394-1c18-4738-aa0f-4b36cf3f04f3.glb | https://app-uploads.krea.ai/public/8ae873b3-63aa-4d71-8bfc-04330b59c8d6.png | `Merkez/BagDuzenegi/Model` | indirilemedi |

**Ölçek ve yön (tahmin; dosyalar inmediği için ölçülmedi).** Aşama 1'de aynı modelin üç çıktısı ölçüldü: Y boyu tam 1,0 birim, AABB merkezi orijinde, +Y yukarı, düğüm dönüşümü yok, ön yön +X. Aynı davranış beklenir, ama yatay parçalarda normalize ekseni farklı olabilir. Godot uzmanı içe aktarmada gerçek AABB'yi ölçmeli (`ModelBaglantisi.gd` zaten bunu yapar).

| Model | Önerilen hedef ölçü | Ölçek formülü | Ön yön / döndürme | Zemin hizası (y offset) |
|---|---|---|---|---|
| `tasiyici_sirt` | uzun ekseni ≈ 12 m (Merkez alanına göre ayarlanır) | `hedef / max(aabb.size.x, aabb.size.z)` | Uzun eksen sırtın baş-kuyruk ekseni. Uzun eksen X çıkarsa +90° ile Z'ye çevrilir; baş -Z | Üst yüzey y=0: `-(aabb.position.y + aabb.size.y) × ölçek`. Üst yüzey kavisli; yürünebilirlik için ayrı düz `BoxShape3D`/`StaticBody3D`; mesh çarpışması önerilmez |
| `tasiyici_nefes_kesesi` | boy ≈ 1,5 m | `1.5 / aabb.size.y` | Eksenel simetrik; döndürme gerekmez | Taban y=0: `-aabb.position.y × ölçek` (merkezli 1,0 kutuda ≈ +0,75). Nefes ölçek animasyonu tabandan büyümeli; pivot taban olsun diye GLB'yi bir `Node3D` altına koyup ölçeği o düğüme uygulayın |
| `tasiyici_omurga` | boy ≈ 2,5 m | `2.5 / aabb.size.y` | Diken dizisi sırt boyunca (Z) uzanmalı; dizi X'te çıkarsa +90° | Taban y=0: `-aabb.position.y × ölçek` (≈ +1,25). Dekor; çarpışma isteğe bağlı basit kutu |
| `bag_duzenegi` | boy ≈ 1,1 m (bel hizası) | `1.1 / aabb.size.y` | Etkileşim yüzü -Z olmalı. Tripo önü +X ise +90° (Aşama 1 karakterleri gibi); simetrik olduğundan gözle doğrulanmalı | Taban y=0: `-aabb.position.y × ölçek` (≈ +0,55). Etkileşim alanı (`Area3D`) ön yüze |

Bütçe: tek LOD; Godot içe aktarmada `meshes/generate_lods` açık bırakılmalı. Tripo dokuları Aşama 1'de 2048² JPEG idi; `VRAM Compressed` ve 1024 sınırı önerilir. Merkez sıcak renkli olmalı (TASARIM §6); Taşıyıcı dokusu soğuk gri-mavi, amber vurgular ışıkla güçlendirilebilir.

## 2026-10-15 — Avlu görsel prototipi

- `varliklar/shaderlar/tas_karo.gdshader`: özgün prosedürel taş karo/yol malzemesi; mevcut zemine `AvluGorseli` üzerinden bağlanır. Dış doku kullanılmaz. Kaynak: bu görevde yazılan kod. Lisans: üçüncü taraf içerik veya lisans yükümlülüğü yok; Godot motoru MIT.
- `betikler/AvluGorseli.gd`: iki kısa sütun, üç kasa, üç taş; Godot CylinderMesh/BoxMesh API ile üretilir. Çarpışma yok. Kaynak: özgün kod ve yerleşik geometri; motor MIT. Geçici prototip dekorudur.
- `sahneler/ortam.tres`: tek Environment kaynağı, JSON ile ayarlanır. Özgün proje ayarıdır. Harici/ücretli varlık eklenmedi.

## Güncel durum — 2026-10-15, Aşama 1 son bağlama

Bu worktree'de üç GLB, dört MP3 ve dört PNG mevcuttur. İlk import başarıyla tamamlandı. Aşağıdaki eski üretim/indirme engeli notları tarihçedir; güncel bağlantılar bu bölümde ve DURUM.md'dedir. Yeni Krea üretimi veya indirme yapılmadı; mevcut Krea kullanım koşulları ve önceki lisans kaydı korunur. Varlıklar prototip için geçicidir.

| Kaynak dosya | Bağlantı | Uygulanan ölçek / Y dönüşü / Y offset |
|---|---|---|
| `varliklar/modeller/oyuncu.glb` | `sahneler/oyuncu.tscn` → `Oyuncu/Model/GLB` | 1,8 / +90° / +0,9 m |
| `varliklar/modeller/avci.glb` | `sahneler/dusmanlar/avci.tscn` → `Avci/Model/GLB` | 1,8 / +90° / +0,9 m |
| `varliklar/modeller/yanki_kesesi.glb` | `sahneler/yanki_kesesi.tscn` → `YankiKesesi/Model/GLB` | 0,4 / 0° / 0 m; merkezli |
| `varliklar/gorseller/yanki_ikon.png` | `sahneler/arayuz/hud.tscn` → çalışma zamanındaki `YankiIkon` TextureRect | 48×48 arayüz birimi, oran korunur |
| `varliklar/sesler/saldiri.mp3` | `Oyuncu.saldir()` → AudioStreamPlayer3D | Konumsal, döngü kapalı |
| `varliklar/sesler/hasar.mp3` | Oyuncu/Avcı `hasar_al()` → AudioStreamPlayer3D | Konumsal, döngü kapalı |
| `varliklar/sesler/tarama.mp3` | `YankiKesesi.tara()` → AudioStreamPlayer3D | Konumsal, döngü kapalı |
| `varliklar/sesler/etkilesim.mp3` | `Olaylar.kestirme_acildi` → Avlu → duvardaki AudioStreamPlayer3D | Konumsal, döngü kapalı |

GLB örnekleri ModelBaglantisi tarafından `_ready()` sırasında Model'in çocuğu olarak oluşturulur. Başarılı bağlantıda yer tutucu mesh ve oyuncu yön kutusu oluşturulmaz; çarpışma şekilleri korunur. Kaynak yüklenemezse önceki geometri/ses yedeği kalır. Son denemede yer tutucu yoktur; sekiz kaynak yükleme ve sahne/HUD/ses bağlantısı testleri geçti.

Gerçek Godot mesh AABB ölçümü: oyuncu Y boyu 1,0, min Y -0,5; Avcı 1,0/-0,5; kese 1,0/-0,5. Karakterler hedef 1,8 m boya göre ölçeklenip tabana hizalanır. Kese için belgedeki merkez orijini korundu; oyuncudaki konum denge dosyasının `organ_konum` değeridir. Ön yön dönüşleri önceki geometrik incelemeye uygundur: karakterlerde +X → -Z.

`oyuncu_kavram.png`, `avci_kavram.png` ve `yanki_kesesi_kavram.png` mevcut üretim referanslarıdır; oyuna bağlanmaz. PNG/MP3/GLB içe aktarım dosyaları ve kaynak kimlikleri kaydedildi; GLB otomatik LOD üretimi açık, ikon mipmap üretimi kapalıdır.

### Godot'un GLB'den çıkardığı doku kaynakları

| Dosya | Kaynak | Lisans / durum |
|---|---|---|
| `varliklar/modeller/oyuncu_Color_a02d4fb7-9264-4672-8d81-2ebe647ddad8.jpg` | oyuncu.glb gömülü JPEG; Godot importu | Aynı Krea varlığının dokusu, mevcut Krea lisans kaydı; geçici |
| `varliklar/modeller/avci_Color_faabfd7b-7612-4aed-9a36-59e7152d74d7.jpg` | avci.glb gömülü JPEG; Godot importu | Aynı Krea varlığının dokusu, mevcut Krea lisans kaydı; geçici |
| `varliklar/modeller/yanki_kesesi_Color_019f6ecb-b182-4ab6-b6bc-08b6df072587.jpg` | yanki_kesesi.glb gömülü JPEG; Godot importu | Aynı Krea varlığının dokusu, mevcut Krea lisans kaydı; geçici |

Bu dokular için yeni harici içerik veya farklı lisans eklenmedi. Model malzemeleri dokuyu koruyan örnek kopyalarıyla çalışır. Ses kaynaklarının yüklenmesi/olayda oynatılması test edildi; bu VDS'de fiziksel ses aygıtı olmadığından işitsel kalite ayrıca değerlendirilmelidir.

## Önceki üretim ve indirme kayıtları (tarihçe)

## 2026-10-15 — Aşama 1, Adım 1: Krea üretimi (üretildi, indirildi, projeye kopyalanamadı)

Krea bakiyesi: başta 18772,37 CU, sonda 18063,55 CU (harcanan ≈ 708,8 CU). Plan: Individual Pro.

**Tüm 11 varlık Krea'da üretildi ve WebFetch ile ikili olarak indirildi; tüm değerler aşağıda gerçek dosyadan ölçüldü.**
İndirme geçmişi:
1. `curl -sSfL -o ".../varliklar/gorseller/oyuncu_kavram.png" https://gen.krea.ai/...` → `This command requires approval`.
2. WebFetch: 11/11 dosya oturumun araç sonuç klasörüne kaydedildi
   (ajan oturumunun yerel araç sonuç klasörü: `~/.claude/projects/<proje>/<oturum>/tool-results/webfetch-*.{png,bin,mp3}`; depo dışı, kalıcı değil).
3. Oradan `cp` ile hedef yola kopyalama → `Claude requested permissions to edit ...\tool-results\webfetch-1792090273119-exqojj.bin which is a sensitive file.`
   Kopyalama ya da `curl` için açık kullanıcı onayı bekleniyor. Onaysız başka kopyalama yolu denenmedi.

**Durum: hedef yollarda (`varliklar/modeller`, `varliklar/sesler`, `varliklar/gorseller`) dosya henüz yok.** Oyunda yer tutucular (CapsuleMesh, BoxMesh, SphereMesh, kod sinüs sesleri) korunur.
Onaydan sonra her dosya kopyalanmalı ve aşağıdaki bayt değeriyle karşılaştırılmalı. Krea URL'lerinin süresiz kalacağı garanti değildir.

| Hedef yol | Önbellekteki dosya (`tool-results/`) | Bayt |
|---|---|---|
| `varliklar/modeller/oyuncu.glb` | `webfetch-1792090273119-exqojj.bin` | 726980 |
| `varliklar/modeller/avci.glb` | `webfetch-1792090274000-jr2vzp.bin` | 785804 |
| `varliklar/modeller/yanki_kesesi.glb` | `webfetch-1792090274828-qsd22p.bin` | 544236 |
| `varliklar/gorseller/oyuncu_kavram.png` | `webfetch-1792090264051-5goz8e.png` | 349455 |
| `varliklar/gorseller/avci_kavram.png` | `webfetch-1792090271460-xcpr3j.png` | 532999 |
| `varliklar/gorseller/yanki_kesesi_kavram.png` | `webfetch-1792090271635-vgu7z9.png` | 482530 |
| `varliklar/gorseller/yanki_ikon.png` | `webfetch-1792090272510-0xahw1.png` | 1223425 |
| `varliklar/sesler/saldiri.mp3` | `webfetch-1792090275260-ue5yhv.mp3` | 10911 |
| `varliklar/sesler/hasar.mp3` | `webfetch-1792090276400-3zo1a3.mp3` | 9657 |
| `varliklar/sesler/tarama.mp3` | `webfetch-1792090277559-3ecxyi.mp3` | 20524 |
| `varliklar/sesler/etkilesim.mp3` | `webfetch-1792090279129-zrioh5.mp3` | 7985 |

Ölçüm: glTF JSON başlığı, PNG IHDR + çözülmüş alfa kanalı, MP3 kare sayımı (Python, salt okuma).

**Üçüncü düzeltme turu (2026-10-15):** `curl -sSfL -o varliklar/modeller/oyuncu.glb https://app-uploads.krea.ai/public/0a91263a-...glb` yeniden `This command requires approval` verdi. Önbellekteki `tool-results/` dosyaları önceki oturuma (`f7cdbeb4-...`) ait; kalıcı değiller. Önerilen yol Krea URL'lerinden doğrudan indirmek. Proje kökünde (Git Bash) çalıştırın:

```sh
cd varliklar
curl -sSfL -o modeller/oyuncu.glb          https://app-uploads.krea.ai/public/0a91263a-f29f-40f1-b4f3-f2f0b8fce625.glb
curl -sSfL -o modeller/avci.glb            https://app-uploads.krea.ai/public/774c8555-8058-423a-9532-da9d328d57cb.glb
curl -sSfL -o modeller/yanki_kesesi.glb    https://app-uploads.krea.ai/public/9c03bf1f-c3d2-4f97-96f7-e002e933e8e8.glb
curl -sSfL -o gorseller/oyuncu_kavram.png  https://gen.krea.ai/images/33da89d2-80d4-4c5d-9fd7-c0f48522ad87.png
curl -sSfL -o gorseller/avci_kavram.png    https://gen.krea.ai/images/fe098a60-4258-4f17-b37f-2bfed39cb757.png
curl -sSfL -o gorseller/yanki_kesesi_kavram.png https://gen.krea.ai/images/cd5409d7-e80a-48d9-9544-f7f0f49ebd3d.png
curl -sSfL -o gorseller/yanki_ikon.png     https://app-uploads.krea.ai/<kullanici-id>/412c70f4-1618-4c51-9911-9e86f7a50037-image.png
curl -sSfL -o sesler/saldiri.mp3   https://app-uploads.krea.ai/audio/ce8e4959-18a7-4d08-afcf-956cc84b6e47.mp3
curl -sSfL -o sesler/hasar.mp3     https://app-uploads.krea.ai/audio/2d26e5a6-72d0-40c6-b98c-65d978924098.mp3
curl -sSfL -o sesler/tarama.mp3    https://app-uploads.krea.ai/audio/3ecff37f-7471-486c-990f-547a97a71be1.mp3
curl -sSfL -o sesler/etkilesim.mp3 https://app-uploads.krea.ai/audio/08d36ec1-deec-4dbc-a7ae-2a407db22f85.mp3
wc -c modeller/* gorseller/* sesler/*   # baytları yukarıdaki tabloyla karşılaştırın
```

Bayt farklıysa ya da bir URL 403/404 verirse o varlık Krea'da yeniden üretilmeli.

Lisans: Krea kullanım koşulları (ücretli Pro planı; "ticari kullanıma izin veren plan" ifadesi **[DOĞRULANMALI]**, bkz. en üstteki Lisans bölümü). Tümü geçici: evet (prototip).
Tarih: 2026-10-15. PNG yolları TASARIM §10.1 uyarınca `varliklar/gorseller/` (görevdeki `kavram/`, `ikonlar/` yerine; bkz. KARARLAR.md).

Ortak stil metni (TASARIM §10.1), tüm görsel promptlarının başında:

> stylized dark fantasy, simple low-poly shapes, muted cold blues and greys for the fog world, warm amber accents for the hub and organs, clean readable silhouettes, no text

### Kavram görselleri — `krea/krea-2/medium`, 1K, `creativity=raw`

| Hedef yol | Tür | Krea URL | En-boy | Prompt (ortak stil + virgül + aşağıdaki) |
|---|---|---|---|---|
| `varliklar/gorseller/oyuncu_kavram.png` | PNG | https://gen.krea.ai/images/33da89d2-80d4-4c5d-9fd7-c0f48522ad87.png | 3:4 | `single full-body lantern-bearing hooded human wanderer, sturdy boots, short blue-grey cloak, small glowing amber lantern attached to belt, simple solid silhouette, neutral A-pose with arms slightly away from body, both feet visible on same ground baseline, front view, isolated on plain light grey background, no scenery, no pedestal, no shadow, game character model concept` |
| `varliklar/gorseller/avci_kavram.png` | PNG | https://gen.krea.ai/images/fe098a60-4258-4f17-b37f-2bfed39cb757.png | 3:4 | `single full-body lean fast predatory biped creature, narrow angular torso, long thin arms with claws, hunched pointed head, digitigrade claw feet, cold grey skin, small amber glowing eyes, clearly nonhuman silhouette, neutral A-pose with limbs separated from body, both feet visible on same ground baseline, front view, isolated on plain light grey background, no scenery, no pedestal, no shadow, game creature model concept` |
| `varliklar/gorseller/yanki_kesesi_kavram.png` | PNG | https://gen.krea.ai/images/cd5409d7-e80a-48d9-9544-f7f0f49ebd3d.png | 1:1 | `single small glowing amber organic echo sac, pear-shaped membranous pouch with a short neck and three curved ribs, smooth low-poly solid form, whole object centered, front view, isolated on plain light grey background, no hands, no scenery, no pedestal, no shadow, game prop model concept` |

Kavramlar oyuna bağlanmaz; yalnız 3B üretim girdisi ve stil referansıdır. Ölçülen: oyuncu ve Avcı 896×1184, kese 1024×1024; üçü de RGB (alfa yok), gri düz zemin.

### 3B modeller — `tripo/h3.1`, görselden 3B, `generate_texture=true`

Tripo H3.1, `face_limit` ile düşük poligon sınırı verebildiği için seçildi (Hunyuan 3.1 Pro'nun alt sınırı 40000 yüz).
Prompt: metin yok; girdi yalnız ilgili kavram görselinin URL'sidir (`input_mode=image`).

| Hedef yol | face_limit | GLB URL | Önizleme URL | Bağlanacağı düğüm |
|---|---|---|---|---|
| `varliklar/modeller/oyuncu.glb` | 10000 | https://app-uploads.krea.ai/public/0a91263a-f29f-40f1-b4f3-f2f0b8fce625.glb | https://app-uploads.krea.ai/public/876bd8bd-b107-4dfe-9e43-6000344b2f45.png | `sahneler/oyuncu.tscn` → `Oyuncu/Model` |
| `varliklar/modeller/avci.glb` | 10000 | https://app-uploads.krea.ai/public/774c8555-8058-423a-9532-da9d328d57cb.glb | https://app-uploads.krea.ai/public/0069abab-1de3-4517-bc96-6de7b1555700.png | `sahneler/dusmanlar/avci.tscn` → `Avci/Model` |
| `varliklar/modeller/yanki_kesesi.glb` | 3000 | https://app-uploads.krea.ai/public/9c03bf1f-c3d2-4f97-96f7-e002e933e8e8.glb | https://app-uploads.krea.ai/public/9e3a6877-8d8b-4091-bfee-4143d4fb493c.png | `sahneler/yanki_kesesi.tscn` → `YankiKesesi/Model` ve oyuncudaki `Oyuncu/YankiKesesi/Model` |

**Ölçülen değerler (gerçek dosyadan):**

| Model | Üretici | Üçgen | AABB min (x,y,z) | AABB max (x,y,z) | Boyut (x × y × z) | Doku | Malzeme | Düğüm dönüşümü |
|---|---|---|---|---|---|---|---|---|
| oyuncu | tripo3d.ai | 9415 | (-0,147, -0,5, -0,321) | (0,147, 0,5, 0,321) | 0,295 × 1,000 × 0,643 | 1 × JPEG 2048² gömülü | 1 | yok (birim) |
| avci | tripo3d.ai | 9540 | (-0,244, -0,5, -0,427) | (0,244, 0,5, 0,427) | 0,488 × 1,000 × 0,854 | 1 × JPEG 2048² gömülü | 1 | yok (birim) |
| yanki_kesesi | tripo3d.ai | 2862 | (-0,285, -0,5, -0,332) | (0,285, 0,5, 0,332) | 0,570 × 1,000 × 0,664 | 1 × JPEG 2048² gömülü | 1 | yok (birim) |

Üçü de Y'de normalize: boy tam 1,0 birim, orijin kutunun merkezinde, +Y yukarı. Üçgen sayıları istenen sınırların altında (10000 / 10000 / 3000).

**Ön yön: +X (glTF'nin olağan +Z'si değil).** Kanıt, köşe noktası dağılımından:
- Oyuncu: ayak bölgesi (y < -0,44) Z'de ±0,12 iki yana ayrık, X'te simetrik ±0,08. Yani yanal eksen Z. Önizlemede kol açıklığı geniş; AABB'nin geniş ekseni de Z (0,643). Baş bölgesi (y > 0,3) X'te -0,126…+0,078; başlığın arkası -X'e taşıyor, yani yüz +X.
- Avcı: baş bölgesi X ortalaması +0,052 (en çok +0,244, öne eğik kambur baş), ayak bölgesi X ortalaması -0,077. Ayaklar Z'de ±0,25 ayrık. Ön yön +X.
- Kese: ön yönü belirsiz, neredeyse eksenel simetrik; döndürme gerekmez.
- Bu çıkarım geometriden yapıldı; ilk bağlamada editörde gözle doğrulanmalı. Ters çıkarsa açıyı -90° yapın.

**Godot bağlantısı** (hedef: +Y yukarı, -Z ileri, taban y=0):

| Model | Döndürme (Y ekseni) | Ölçek (tekdüze) | Konum offset | Sonuç boyut (m): ön-arka × boy × yanal |
|---|---|---|---|---|
| oyuncu | **+90°** (+X → -Z) | **1,8** (`1.8 / 1.0`) | y = **+0,9** (`0.5 × 1.8`) | 0,53 × 1,80 × 1,16 (yanal = A-poz kol açıklığı) |
| avci | **+90°** | **1,8** | y = **+0,9** | 0,88 × 1,80 × 1,54 |
| yanki_kesesi | 0° | **0,4** (`0.4 / 1.0`, en uzun eksen Y) | 0 (merkez orijinde) | 0,23 × 0,40 × 0,27 |

- Önerilen yapı: `Model` altında `Node3D` sarmalayıcı (yukarıdaki döndürme + ölçek + offset), GLB örneği onun çocuğu. Çarpışma şekilleri değişmez.
- Avcı 1,8 m ölçekte kol açıklığı 1,54 m, ön-arka 0,88 m. Kapsül çarpışmasıyla görsel taşma olabilir; gerekirse ölçek 1,5'e indirilebilir. Bu karar bağlama adımınındır.
- Bütçe: tek LOD (LOD0); spec sheet'teki LOD1–3 zinciri yok. Godot'un içe aktarmadaki otomatik LOD üretimi (`meshes/generate_lods`) açık bırakılmalı.
- Dokular 2048² JPEG; Avlu kamerasında karakter ekranda küçük. İçe aktarmada `VRAM Compressed` ve 1024 boyut sınırı önerilir.

### Yankı HUD ikonu — `openai/gpt-image-2.5-flare`, 1K, 1:1, `background=transparent`, `quality=medium`

| Hedef yol | Tür | Krea URL |
|---|---|---|
| `varliklar/gorseller/yanki_ikon.png` | PNG (şeffaf zemin istendi) | https://app-uploads.krea.ai/<kullanici-id>/412c70f4-1618-4c51-9911-9e86f7a50037-image.png |

Prompt: ortak stil + `. Game HUD icon: isolated glowing amber echo sac (pear-shaped membranous organic pouch with three curved ribs) with two thin concentric sonar arcs radiating from it, centered, clean bold silhouette, readable at 64 pixels, transparent background, no lettering, no border, no frame`

- **Alfa doğrulandı:** PNG renk tipi 6 (RGBA, 8 bit), 1024×1024. Piksellerin %54,1'i tam şeffaf (α=0), köşe α=0. Kese gövdesi α≈252, en yüksek α=254. Hiçbir piksel tam 255 değil; dış parıltı (%45,9) yarı saydam geçiştir. Koyu HUD zemininde sorun yok; açık zeminde parıltı halesi bulanık görünebilir.
- En küçük çözünürlük 1K (1024×1024). 256×256 için Godot içe aktarmada `size_limit=256` ya da dışarıda küçültme gerekir. Mipmap kapalı (UI).
- Bağlantı: `sahneler/arayuz/hud.tscn`, tarama/Yankı bekleme göstergesi (`TextureRect` ya da `TextureProgressBar`). Metin göstergesi korunmalı (TASARIM §10: bilgi yalnız renkle verilmez).

### Sesler — `bytedance/seed-audio-1.0`, çıktı MP3

Seed Audio süre parametresi almaz; süre promptla istendi. **Ölçülen süreler** (MPEG-1 Layer III, 44100 Hz, stereo, kare sayımı):
saldırı 0,653 sn · hasar 0,575 sn · tarama 1,254 sn · etkileşim 0,470 sn. Dördü de 0,3–1,5 sn aralığında. Format `.ogg`/`.wav` değil MP3 (bkz. KARARLAR.md). Godot `AudioStreamMP3` ile doğrudan oynatır; döngü kapalı içe aktarılmalı.

| Hedef yol | Krea URL | Bağlanacağı olay | Prompt |
|---|---|---|---|
| `varliklar/sesler/saldiri.mp3` | https://app-uploads.krea.ai/audio/ce8e4959-18a7-4d08-afcf-956cc84b6e47.mp3 | `Oyuncu.saldir()` / sinyal `saldirdi(adim, vurus_kimligi)`; şu an `Geometri.ses` | `Sound effect only, about 0.6 seconds: short dry sword whoosh ending in a light impact, stylized dark fantasy game melee attack, single event, no voice, no speech, no music, no ambience` |
| `varliklar/sesler/hasar.mp3` | https://app-uploads.krea.ai/audio/2d26e5a6-72d0-40c6-b98c-65d978924098.mp3 | Oyuncu/Avcı `hasar_al()` / sinyal `can_degisti` (azalışta) | `Sound effect only, about 0.5 seconds: short muted body impact thud with a faint pained grunt-free cloth rustle, stylized dark fantasy game character taking damage, single event, no voice, no speech, no music, no ambience` |
| `varliklar/sesler/tarama.mp3` | https://app-uploads.krea.ai/audio/3ecff37f-7471-486c-990f-547a97a71be1.mp3 | `YankiKesesi.tara()` / sinyal `tarama_yapildi(yaricap)` | `Sound effect only, about 1.2 seconds: single resonant organic sonar pulse, soft wet membrane thump followed by a warm ringing echo that fades out, magical echolocation scan, stylized dark fantasy game, no voice, no speech, no music, no ambience` |
| `varliklar/sesler/etkilesim.mp3` | https://app-uploads.krea.ai/audio/08d36ec1-deec-4dbc-a7ae-2a407db22f85.mp3 | `etkilesim` (E) eylemi; Aşama 1'de etkileşim noktası yok, Aşama 2'de Taşıyıcı/Bağ Düzeneği | `Sound effect only, about 0.4 seconds: short soft interaction click, a muted wooden and stone tap with a tiny warm chime, stylized dark fantasy game UI interact sound, single event, no voice, no speech, no music, no ambience` |

Konumsal sesler (`AudioStreamPlayer3D`) için ölçek/yön uygulanmaz. Süre 0,3–1,5 sn dışında çıkarsa içe aktarmada kırpılmalı.

## 2026-10-15 — Aşama 1, Adım 2 sonucu

Krea araçları listelenebildi; bakiye 18937,998888888887 CU. Üç kavram üretimi otomatik onay denetiminde reddedildi: `MCP tool call requires approval, but approval policy is never`. Hiçbir üretim işi başlamadı veya dosya indirilmedi. Görevdeki yedek akışla tüm varlıklar yer tutucu bırakıldı. Ayrıntılı erişim kaydı: `docs/VARLIK_ADIM2.md`.

Tablodaki `varliklar/` yolları beklenen çıktı yollarıdır; dosyalar mevcut değildir. Harici içerik ve yeni harici lisans yoktur. Korunan yer tutucular özgün kod ve Godot yerleşik geometri/ses API'sinden gelir (motor MIT).

| Beklenen dosya | Tür ve sonuç | Bağlantı / mevcut yer tutucu | Ölçek ve yön |
|---|---|---|---|
| `varliklar/gorseller/oyuncu_kavram.png` | Kavram PNG; üretim reddedildi | Oyuncu modelinin üretim girdisi olacaktı; oyuna bağlanmadı | Tam beden, ayaklar görünür |
| `varliklar/gorseller/avci_kavram.png` | Kavram PNG; üretim reddedildi | Avcı modelinin üretim girdisi olacaktı; oyuna bağlanmadı | Tam beden, ayaklar görünür |
| `varliklar/gorseller/yanki_kesesi_kavram.png` | Kavram PNG; üretim reddedildi | Yankı modelinin üretim girdisi olacaktı; oyuna bağlanmadı | Tek nesne, merkezli |
| `varliklar/modeller/oyuncu.glb` | GLB; kavram yok, çağrı yapılmadı | `sahneler/oyuncu.tscn`, `Oyuncu/Model`: CapsuleMesh ve yön işareti korundu | Boy 1,8 m, taban y=0, +Y yukarı, -Z ileri |
| `varliklar/modeller/avci.glb` | GLB; kavram yok, çağrı yapılmadı | `sahneler/dusmanlar/avci.tscn`, `Avci/Model`: BoxMesh korundu | Boy 1,8 m, taban y=0, +Y yukarı, -Z ileri |
| `varliklar/modeller/yanki_kesesi.glb` | GLB; kavram yok, çağrı yapılmadı | `sahneler/yanki_kesesi.tscn`, `YankiKesesi/Model`: SphereMesh korundu | Çap 0,4 m, merkez orijinde, +Y yukarı, -Z ileri |
| `varliklar/gorseller/yanki_ikon.png` | Şeffaf PNG; onay engeli nedeniyle çağrı yapılmadı | `sahneler/arayuz/hud.tscn`: mevcut tarama metni korunuyor; ikon yok | Arayüz simgesi, yön uygulanmaz |
| `varliklar/sesler/saldiri.wav` | Ses; onay engeli nedeniyle çağrı yapılmadı | `Oyuncu.saldir()` içindeki `Geometri.ses`: dinamik AudioStreamPlayer3D | Konumsal, ölçek/yön uygulanmaz |
| `varliklar/sesler/hasar.wav` | Ses; onay engeli nedeniyle çağrı yapılmadı | Oyuncu ve Avcı `hasar_al()` içindeki `Geometri.ses`: dinamik AudioStreamPlayer3D | Konumsal, ölçek/yön uygulanmaz |
| `varliklar/sesler/tarama.wav` | Ses; onay engeli nedeniyle çağrı yapılmadı | `YankiKesesi.tara()` içindeki `Geometri.ses`: dinamik AudioStreamPlayer3D | Konumsal, ölçek/yön uygulanmaz |
| `varliklar/sesler/etkilesim.wav` | Ses; onay engeli nedeniyle çağrı yapılmadı | Yeni ses bağlanmadı; duvar yıkımı `yikildi` ve `Olaylar.kestirme_acildi` sinyalleriyle bildirilir | Ölçek/yön uygulanmaz |

### Prompt kaydı

Üç `generate_image` isteği `krea/krea-2/medium`, `aspect_ratio=1:1`, `resolution=1K`, `creativity=raw` ile gönderildi. Hepsi aşağıdaki ortak stil metni, virgül ve nesne metninin birleşimidir:

> stylized dark fantasy, simple low-poly shapes, muted cold blues and greys for the fog world, warm amber accents for the hub and organs, clean readable silhouettes, no text

- Oyuncu: `Single full-body lantern-bearing hooded human wanderer, sturdy boots, short blue-grey cloak, small amber lantern attached to belt, simple solid silhouette, neutral A pose, both feet visible on same ground baseline, isolated on plain light grey background, front three-quarter view, no scenery, no pedestal, game model concept`
- Avcı: `Single full-body lean predatory biped creature, narrow angular torso, long arms, hunched pointed head, claw feet, cold grey skin, clearly nonhuman silhouette, neutral stance with limbs separated, both feet visible, isolated on plain light grey background, front three-quarter view, no scenery, no pedestal, game model concept`
- Yankı: `Single small glowing amber organic echo sac, pear-shaped membranous pouch with a short neck and three curved ribs, smooth low-poly solid form, isolated object on plain light grey background, front three-quarter view, no hands, no scenery, no pedestal, game model concept`

3B için `tencent/hunyuan3d-3.1-rapid`, ses için `bytedance/seed-audio-1.0` şemaları incelendi; bu araçlara üretim isteği gönderilmedi. Bu nedenle aşağıdakiler kullanılan prompt değil, sonraki yetkili deneme için taslaktır:

- Üç GLB: ilgili kavram görselinden, ortak stile uygun tek nesne; +Y yukarı, -Z ileri; karakter ayakları y=0, hedef boy 1,8 m; organ çapı 0,4 m.
- İkon: ortak stil + `isolated amber echo sac icon, transparent background, clean bold silhouette, no lettering, no border`.
- Saldırı: `Short dry sword whoosh and impact, stylized dark fantasy game, single event, no voice, no music, no ambience`.
- Hasar: `Short muted body impact, stylized dark fantasy game, single event, no voice, no music, no ambience`.
- Tarama: `Short resonant organic sonar pulse, warm amber magical echo, stylized dark fantasy game, no voice, no music, no ambience`.
- Etkileşim: `Short brittle stone wall crumble with a clear opening accent, stylized dark fantasy game, no voice, no music, no ambience`.

| Dosya | Kaynak | Lisans | Geçici mi |
|---|---|---|---|

## 2026-10-15 — Geçici çekirdek yer tutucular

- `betikler/Geometri.gd`: kutu meshler, kapsül fizik şekilleri; `Avci.gd`: hazırlık halkası; `KirilganDuvar.gd`: geometrik çatlak. Kaynak: bu görevde yazılan özgün kod ve Godot yerleşik geometri API'si. Lisans: harici varlık içermez; Godot motoru MIT. Geçici: evet.
- `Geometri.ses()`: PCM sinüs sesleri, saldırı/hasar/tarama/Avcı hazırlığı. Kaynak: bu görevde yazılan özgün matematiksel üretim; üçüncü taraf örnek kullanılmadı. Harici lisans gerektiren varlık yok. Geçici: evet. Diskte ses dosyası üretilmez.
- Krea üretimi ve harici model/ikon/ses indirmesi yapılmadı. Beklenen GLB bağlantıları DURUM.md'de; dosyalar henüz yok.

## 2026-10-15 — Yer tutucu şekil düzeltmesi

- Oyuncu: `Geometri.govde` içinde CapsuleMesh; Yankı Kesesi: `YankiKesesi.gd` içinde SphereMesh. Avcı BoxMesh olarak korunur. Kaynak: Godot yerleşik geometri API'si ve bu görevde yazılan özgün kod. Harici varlık yok; Godot motoru MIT. Geçici: evet.

