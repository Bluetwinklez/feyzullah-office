# Performans — AŞAMA 4 (2)

Ölçüm tarihi 2026-10-16. Tek koşu, tek makine. Başka donanım için FPS iddiası yoktur (TASARIM §14).

## Yöntem

- Komut (yalnız debug, `test/` release paketinden dışlıdır; argümansız çalıştırılırsa hiçbir şey yapmadan çıkar):

  ```text
  godot --path . --script res://test/perf_kosu.gd -- --perf-kosu --perf-etiket=editor
  ```

- `test/perf_olcer.gd`, K1 kabul akışını (`test/asama3.gd` `_akis(true)`) **pencereli ve gerçek çizimle** otomatik oynatır: yeni oyun → Merkez → Avlu (`bolge`) → Koridor → Kuyu Salonu → Merkez (Yankı bağlanır) → Avlu → Derin Geçit (son karşılaşma: 1 Ağır + 2 Avcı) → Çekirdek Odası → Merkez → Avlu → Koridor → Sis Cebi (Nefes Kesesi) → Merkez (Soluk bağlanır) → Son Yolculuk → bitiş ekranı (+120 kare). Gerçek kapı/etkileşim/savaş girdileriyle; akış `tamam=true` bitti.
- Kare süresi: ardışık `_process` çağrıları arasındaki gerçek süre (`Time.get_ticks_usec`), her kare, o anki mekâna (`Oyun.mekan`; bitişten sonra `bitis`) yazılır. %95 = sıralı dizinin %95 sırası.
- Her 10 karede `Performance.get_monitor`: `MEMORY_STATIC`, `MEMORY_STATIC_MAX`, `RENDER_VIDEO_MEM_USED`, `RENDER_TOTAL_DRAW_CALLS_IN_FRAME`, `RENDER_TOTAL_OBJECTS_IN_FRAME`, `RENDER_TOTAL_PRIMITIVES_IN_FRAME`, `OBJECT_COUNT`, `OBJECT_NODE_COUNT`, `OBJECT_RESOURCE_COUNT` (+ `TIME_PROCESS`, `TIME_PHYSICS_PROCESS`).
- Ölçüm sırasında V-Sync kapalı, `max_fps` sınırsız, `time_scale` 1 (oyun hızı gerçek). Ayarlar `denge.json` → `perf_kosu`.
- "Takılma" = 250 ms'den uzun kare (`perf_kosu.takilma_ms`).
- Ham sonuç: `build/perf/editor.json`, günlük `build/perf/editor.log` (Git dışı).

## Koşullar

| Alan | Değer |
|---|---|
| İkili | Editör ikilisi `Godot_v4.7.2-stable_win64.exe` (debug), `4.7.2-stable (official)` |
| Renderer | `gl_compatibility`, sürücü `opengl3_angle` |
| Renderer satırı | `OpenGL API OpenGL ES 3.0 (ANGLE 2.1.1 git hash: aaebda1c5a40) - Compatibility - Using Device: Google Inc. (Microsoft) - ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11-10.0.20348.1)` |
| GPU | **Microsoft Basic Render Driver = yazılım çizimi (WARP, CPU'da rasterleştirme); gerçek GPU yok** |
| Pencere | Pencereli (`WINDOW_MODE_WINDOWED`), pencere 1152×648; iç viewport 1920×1080 (`stretch=viewport`, çizim 1080p'de yapılıp ölçeklenir). Ekranın bildirilen boyutu `(600, 1280)` |
| CPU | AMD EPYC-Genoa Processor, 4 mantıksal çekirdek (VDS) |
| RAM | 7,8 GiB fiziksel (`OS.get_memory_info().physical`). `available` 22,4 GiB bildirdi; sayfa dosyasını da içerdiği için kullanılmadı |
| OS | Windows 10.0.20348 (Windows Server 2022) |
| Ses | WASAPI açılamadı → Dummy sürücü (ses maliyeti ölçüme dahil değil) |

**Yazılım çizimi uyarısı:** tüm sonuçlar CPU'da çalışan WARP rasterleştiricisiyle alındı. Gerçek bir GPU'da (tümleşik dahil) çizim maliyeti çok daha düşüktür; bu tablolar **kötümserdir** ve oyunun gerçek donanımdaki FPS'sini göstermez.

## Sonuçlar — genel

| Kare | Ortalama | %95 | En kötü | Ort. FPS | Takılma (>250 ms) |
|---|---|---|---|---|---|
| 1032 | **56,8 ms** | **69,3 ms** | **996,8 ms** | 17,6 | 13 |

| Bellek / sayaç | Ortalama | Tepe |
|---|---|---|
| `MEMORY_STATIC` | 41,3 MiB | 41,7 MiB |
| `MEMORY_STATIC_MAX` (süreç boyu tepe) | — | 73,1 MiB |
| `RENDER_VIDEO_MEM_USED` | 123,3 MiB | 160,0 MiB |
| Çizim çağrısı / kare | 21,2 | 27 |
| Çizilen nesne / kare | 174 | 258 |
| İlkel (üçgen) / kare | — | 43.215 |
| Düğüm (`OBJECT_NODE_COUNT`) | 156 | 183 |
| Nesne (`OBJECT_COUNT`) | 1.896 | 1.944 |
| Kaynak (`OBJECT_RESOURCE_COUNT`) | — | 82 |

## Sonuçlar — mekân bazında

Sıra koşudaki ilk giriş sırasıdır; bir mekâna birden çok kez girildiyse kareleri birleşiktir.

| Mekân | Kare | Ort. ms | %95 ms | En kötü ms | FPS | Takılma | Çizim ort/tepe | Nesne ort/tepe | İlkel tepe | Statik bellek tepe MiB | Video bellek tepe MiB | Düğüm tepe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Merkez | 94 | 85,0 | 82,7 | 996,8 | 11,8 | 4 | 18,1 / 22 | 163 / 195 | 29.641 | 41,6 | 159,3 | 175 |
| Avlu (`bolge`) | 143 | 61,5 | 84,7 | 836,6 | 16,3 | 3 | 23,4 / 26 | 167 / 171 | 23.985 | 41,3 | 111,2 | 165 |
| Koridor | 189 | 46,9 | 49,7 | 712,5 | 21,3 | 2 | 21,4 / 27 | 159 / 177 | 20.903 | 41,4 | 111,3 | 150 |
| Kuyu Salonu | 123 | 50,6 | 51,8 | 748,2 | 19,8 | 1 | 22,9 / 27 | 163 / 184 | 26.945 | 41,4 | 111,2 | 162 |
| Derin Geçit (son karşılaşma) | 186 | 47,6 | 55,2 | 610,2 | 21,0 | 1 | 16,3 / 22 | 158 / 168 | 43.215 | 41,6 | 127,7 | 161 |
| Çekirdek Odası | 73 | 48,7 | 46,6 | 609,3 | 20,6 | 1 | 21,0 / 25 | 170 / 190 | 12.853 | 41,0 | 94,8 | 135 |
| Sis Cebi | 68 | 64,3 | 62,1 | 805,5 | 15,6 | 1 | 21,9 / 23 | 149 / 163 | 14.830 | 41,2 | 110,9 | 138 |
| Bitiş | 156 | 63,8 | 72,0 | 85,4 | 15,7 | 0 | 25,0 / 27 | 242 / 258 | 30.943 | 41,7 | 160,0 | 183 |

Bazı mekânlarda %95'in ortalamanın altında kalması, ortalamayı birkaç yükleme karesinin (600–1000 ms) yukarı çekmesindendir.

## Bilinen darboğazlar

1. **Yazılım rasterleştirme (baskın).** Çizim çağrısı 16–27, ilkel en çok ~43 bin: sahne yükü küçük. Buna rağmen kare 47–85 ms. Neredeyse tamamen 2B olan bitiş ekranı bile ~64 ms sürüyor. Maliyetin büyük kısmı 1920×1080 viewport'un piksel doldurma/karıştırma işinde olmalı (mesafe sisi, saydam katmanlar, 1080p→pencere ölçekleme). Bu çıkarımdır; GPU profili WARP'ta alınamadı.
2. **Mekân geçişlerinde takılma.** 13 kare 250 ms'yi aştı. Mekân başına takılma sayısı, o mekâna giriş sayısıyla birebir aynı (Merkez 4, Avlu 3, Koridor 2, diğerleri 1). Yani takılmalar giriş anında oluşuyor (sahne `instantiate` + GLB/shader ilk kullanımı). En kötüsü bir Merkez girişi: 997 ms. Önbellekte shader yoksa Compatibility'de ilk çizimde derleme de payı var (disk shader önbelleği daha önce kapatıldı, KARARLAR 2026-10-15).
3. **Merkez en ağır oda.** Ortalama 85 ms; Taşıyıcı'nın dört GLB parçası, nefes ölçek animasyonu ve sıcak ışık. Video belleği tepesi (159 MiB) de Merkez/bitişte.
4. Bellek sabit: statik bellek 41–42 MiB arasında, düğüm ve nesne sayıları mekânlar arasında geri dönüyor. Koşu boyunca büyüme/sızıntı eğilimi görülmedi. Bilinen kapanış anı ObjectDB uyarıları ayrıdır (DURUM AŞAMA 3).

`TIME_PROCESS` örnekleri (JSON'da `islem_sn_*`) 10 karede bir alındığı ve yükleme karelerine denk geldiği için ortalamayı bozar. Darboğaz yorumunda kullanılmadı.

## Öneriler

- **Gerçek GPU'lu bir makinede aynı komutla yeniden ölç.** Bu tablo yalnız alt sınırdır.
- Geçiş takılması için sonraki mekânın `ResourceLoader.load_threaded_request` ile kapıya yaklaşırken önceden yüklenmesi ve GLB/shader'ların Merkez'de bir kez ısıtılması (görünmez ilk çizim) düşünülebilir. Bu prototipte uygulanmadı.
- Düşük donanım için Ayarlar'daki çözünürlük düşürülebilir. Ancak `stretch=viewport` iç çizimi 1920×1080'de tuttuğundan pencere boyutu çizim maliyetini azaltmaz. Gerekirse iç çözünürlük ölçeği (`scaling_3d_scale`) ayrı bir ayar olarak değerlendirilmeli; bu kapsam dışıdır (TASARIM §11'de yok).
- Merkez'de Taşıyıcı parçalarının poligon sayısı ve saydam sis hacmi ilk optimizasyon adayıdır.

## Release ikilisiyle ölçüm

Yapılmadı. Nedenler:

- (a) Ölçüm kodu `test/` altında ve release paketinden bilerek dışlı. Release akışı ölçüm argümanından etkilenmesin diye böyle.
- (b) `build/GOC.exe`'nin doğrudan çalıştırılması bu ortamda komut onayı istedi ve onay verilmedi.

Ölçüm editör ikilisiyle, pencereli yapıldı. Release ikilisi debug denetimleri olmadığından CPU tarafında biraz daha hızlı olabilir. Çizim maliyeti aynıdır.
