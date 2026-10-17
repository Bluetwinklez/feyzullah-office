# GÖÇ — ajan kuralları

Bu depoda çalışan her uzman (Claude, Codex, agy) için:

1. İşe başlamadan **`docs/TASARIM.md`'yi oku**. Tek doğru kaynak odur. Kapsam dışındaki hiçbir şeyi ekleme.
2. Motor: Godot 4.7.2, GDScript. Komut satırında `godot` hazır. Başsız çalıştır (`--headless`).
3. Oynanış ayar değerleri (hız, hasar, süre, menzil…) `data/denge.json`'da, metinler `data/metinler.csv`'de; kodda düz metin yok.
   0, 1, -1 gibi matematik sabitleri kodda kalır (JSON'a taşıma).
4. Mevcut çalışan sistemi gerekçesiz değiştirme; başkasının dosyasını silme. Belgeyle çelişen kararı `docs/KARARLAR.md`'ye yaz.
5. Bitirmeden önce: temiz kopyada önce `godot --headless --path . --import`, sonra test botunu çalıştır (`godot --headless --path . --script res://test/calistir.gd`), gerekiyorsa
   `.exe` dışa aktar, `docs/DURUM.md`'yi güncelle. “Çalışıyor” yalnız gerçekten çalıştırdığın şey için.
6. Varlık eklediysen `docs/VARLIKLAR.md`'ye kaynak + lisans yaz. Ücretli/lisansı belirsiz içerik yok.
   Krea çıktısını indirmenin TEK yolu (Ofis'in aracı; Krea MCP açıklamalarında geçmez, curl kullanma):
   `node C:/Users/ornek/Desktop/claude/feyzullah-ofis/tools/krea-indir.mjs <krea-adresi> <varliklar/...hedef>`
7. git commit / merge yapma; Ofis yapar.
