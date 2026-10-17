## Oturum ömürlü, sahneler arası sinyal veri yolu ve yalnız yerel JSONL günlüğü.
extends Node
## Duraklatma görünümünü günceller.
signal duraklatma_degisti(duraklatildi: bool)
## Kestirme fizik engeli kaldırıldığında yayılır.
signal kestirme_acildi
## Organ tek konum değiştirdiğinde yayılır.
signal organ_aktarildi(organ: String, konum: String)
## Görev hedefi değiştiğinde yayılır.
signal gorev_degisti(durum: int)
## Kalıcı mühür ve rota açıldığında yayılır.
signal gecit_acildi
## HUD ve modellerin durumu yeniden okumasını ister.
signal durum_degisti
## UI'ye çeviri anahtarı ile bilgi gönderir.
signal bilgi(anahtar: String)
var gunluk_yolu: String = "user://olaylar.jsonl"
var son_hata: Error = OK
var _oturum: String = ""
var _baslangic: int = 0
var _ilk_dusman: bool = false
const OLAYLAR: Array[String] = ["oturum_basladi", "sefer_basladi", "sefer_dondu", "ilk_dusman_yenildi", "organ_bulundu", "organ_aktarildi", "organ_kullanildi", "gecit_acildi", "kestirme_acildi", "olum", "tamamlandi", "tekrar_oyna"]

func oturum_baslat() -> void:
	_oturum = Crypto.new().generate_random_bytes(16).hex_encode()
	_baslangic = Time.get_ticks_msec()
	_ilk_dusman = false
	yaz("oturum_basladi")

func dusman_yenildi() -> void:
	if _ilk_dusman:
		return
	_ilk_dusman = true
	yaz("ilk_dusman_yenildi")

func yaz(olay: String, ilgili: String = "") -> bool:
	if _oturum.is_empty() or not olay in OLAYLAR:
		return false
	var dosya: FileAccess = FileAccess.open(gunluk_yolu, FileAccess.READ_WRITE if FileAccess.file_exists(gunluk_yolu) else FileAccess.WRITE)
	if dosya == null:
		son_hata = FileAccess.get_open_error()
		return false
	dosya.seek_end()
	dosya.store_line(JSON.stringify({"olay": olay, "oturum": _oturum, "sure_sn": float(Time.get_ticks_msec() - _baslangic) / 1000.0, "ilgili": ilgili, "surum": Kayit.SURUM}))
	dosya.flush()
	son_hata = dosya.get_error()
	dosya.close()
	return son_hata == OK
