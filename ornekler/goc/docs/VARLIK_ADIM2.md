# Aşama 1, Adım 2 — harici servis erişim kaydı

> Bu belge geçmiş geliştirme kayıtlarını içerir. Servis adları ve kaynak adresleri yayımdan kaldırılmıştır. Eski araç ve indirme talimatları güncel entegrasyon değildir; varlıkların lisans kısıtları korunur.

Tarih: 2026-10-15. `asset-generation` becerisi ve bağlı harici servis MCP kullanıldı.

- `generate_image`, `generate_3d`, `generate_audio` araçları listede mevcut. Model listesi ve üç modelin şeması başarıyla alındı.
- Bağımsız `get_balance` aracı yok. Aynı hesabın `open_home.compute_balance` alanı: 18937,998888888887 CU. Model başına canlı fiyat sunulmadığından toplam maliyet doğrulanamadı.
- Oyuncu, Avcı ve Yankı kavramları için `image-generation-model` çağrıları denendi. Üçü de otomatik onay denetiminde reddedildi: `MCP tool call requires approval, but approval policy is never`.
- Görsel çıktısı veya üretim işi kimliği oluşmadı. Kavram görseli olmadan 3B çağrı yapılmadı. Aynı onay engelini aşmak için başka yol denenmedi; ikon ve ses üretimi de yapılmadı.
- Kullanıcının yedek akışı uygulandı: tüm varlıklar yer tutucu; indirilen dosya ve yeni harici lisans yok. Ölçek/yön ve bağlantılar DURUM.md ve VARLIKLAR.md içindedir.
- Bu adımın import kontrolünden sonra Adım 3 test/export çalışmasına geçilir.
- Adım 2 importu çalıştırıldı: `godot --headless --path . --import`, çıkış 0. Betik/parse/eksik kaynak hatası yok; ortamın sertifika ve editör ayarlarına yazma hataları mevcut. Ardından Adım 3 başlatıldı.
