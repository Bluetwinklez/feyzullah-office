## Uygulama ömürlü yerel kayıt hizmeti. Testler kayit_yolu'nu değiştirebilir.
extends Node
## Okumada başarısızlık; oyun durumu uygulanmaz.
signal kurtarma_gerekli(neden: String)
## Dosya işlemi hatasını çeviri anahtarıyla bildirir.
signal kayit_hatasi(anahtar: String)
## Geçerli veri uygulandıktan sonra yayılır.
signal yuklendi
var kayit_yolu: String = "user://kayit.json"
var son_hata: String = ""
const SURUM: int = 2

func kaydet() -> bool:
	var veri: Dictionary = Oyun.kayit_verisi()
	if not dogrula(veri):
		return _hata("kayit.tutarsiz")
	var gecici: String = kayit_yolu + ".tmp"
	var dosya: FileAccess = FileAccess.open(gecici, FileAccess.WRITE)
	if dosya == null:
		return _hata("kayit.yazilamadi")
	dosya.store_string(JSON.stringify(veri, "", true, true))
	dosya.flush()
	var sonuc: Error = dosya.get_error()
	dosya.close()
	if sonuc != OK:
		return _hata("kayit.yazilamadi")
	if FileAccess.file_exists(kayit_yolu):
		if DirAccess.copy_absolute(kayit_yolu, kayit_yolu + ".bak") != OK:
			return _hata("kayit.yazilamadi")
	# Aynı dizinde rename; başarısızlıkta eski dosya kaldırılmaz.
	if DirAccess.rename_absolute(gecici, kayit_yolu) != OK:
		return _hata("kayit.yazilamadi")
	son_hata = ""
	return true

func yukle(yedek: bool = false) -> bool:
	var yol: String = kayit_yolu + ".bak" if yedek else kayit_yolu
	if not FileAccess.file_exists(yol):
		return _kurtarma("kayit.eksik")
	var dosya: FileAccess = FileAccess.open(yol, FileAccess.READ)
	if dosya == null:
		return _kurtarma("kayit.okunamadi")
	var json: JSON = JSON.new()
	var sonuc: Error = json.parse(dosya.get_as_text())
	dosya.close()
	if sonuc != OK:
		return _kurtarma("kayit.bozuk")
	var veri: Variant = json.data
	if not veri is Dictionary:
		return _kurtarma("kayit.bozuk")
	veri = tasi(veri)
	if not dogrula(veri):
		return _kurtarma("kayit.bozuk")
	Oyun.kayittan_uygula(veri)
	son_hata = ""
	yuklendi.emit()
	Oyun.yer_degistir("merkez")
	return true

func yeni_oyun(onay: bool = false) -> bool:
	if (FileAccess.file_exists(kayit_yolu) or FileAccess.file_exists(kayit_yolu + ".bak")) and not onay:
		return _hata("kayit.yeni_onay")
	Oyun.yeni_oyun()
	# Açık yeni oyun seçimi eski kaydı atomik olarak değiştirir; .bak korunur.
	# Yazılamayan diskte oyunu kilitleme; kaydet zaten görünür hata sinyali yayar.
	kaydet()
	return true

func _eski_dogrula(veri: Dictionary) -> bool:
	for anahtar: String in ["surum", "gorev_asamasi", "kehribar", "sise_kapasitesi"]:
		if not veri.has(anahtar) or not _tam_sayi(veri[anahtar]) or float(veri[anahtar]) < 0.0:
			return false
	if int(veri["surum"]) != 1 or int(veri["gorev_asamasi"]) > Gorev.Durum.M3_DERIN_GECIT:
		return false
	for anahtar: String in ["gecit_acik", "kestirme_acik", "nefes_kesesi_alindi", "tamamlandi"]:
		if not veri.has(anahtar) or not veri[anahtar] is bool:
			return false
	if veri["nefes_kesesi_alindi"] or veri["tamamlandi"]:
		return false
	if not veri.get("organlar") is Dictionary:
		return false
	var organlar: Dictionary = veri["organlar"]
	if organlar.get("soluk") != "BULUNMADI" or not organlar.get("yanki") in ["BULUNMADI", "OYUNCU", "CANLI"]:
		return false
	var asama: int = int(veri["gorev_asamasi"])
	var yer: String = organlar["yanki"]
	if (asama < Gorev.Durum.M2_YANKIYI_GETIR) != (yer == "BULUNMADI"):
		return false
	if (yer == "CANLI" or asama == Gorev.Durum.M3_DERIN_GECIT) and not veri["gecit_acik"]:
		return false
	if (yer == "CANLI" or veri["gecit_acik"]) and asama != Gorev.Durum.M3_DERIN_GECIT:
		return false
	var oyuncu: Variant = veri.get("oyuncu")
	if not oyuncu is Dictionary:
		return false
	for anahtar: String in ["can", "kacin_bekleme", "tarama_bekleme"]:
		if not oyuncu.has(anahtar) or not (oyuncu[anahtar] is float or oyuncu[anahtar] is int):
			return false
		if not is_finite(float(oyuncu[anahtar])) or float(oyuncu[anahtar]) < 0.0:
			return false
	return float(oyuncu["can"]) <= Ayarlar.sayi("oyuncu_can")

func tasi(veri: Dictionary) -> Dictionary:
	if veri.get("surum") == SURUM:
		return veri.duplicate(true)
	if not _eski_dogrula(veri):
		return {}
	var yeni: Dictionary = veri.duplicate(true)
	yeni["surum"] = SURUM
	yeni["sise_sayisi"] = int(yeni["sise_kapasitesi"])
	for anahtar: String in ["hazirlik_artisi", "sefer_kehribari", "olum_sayisi", "sure_sn"]:
		yeni[anahtar] = 0
	yeni["oyuncu"]["soluk_kalan"] = 0.0
	yeni["oyuncu"]["soluk_bekleme"] = 0.0
	return yeni

func dogrula(veri: Dictionary) -> bool:
	if veri.get("surum") != SURUM:
		return false
	for anahtar: String in ["gorev_asamasi", "kehribar", "sise_kapasitesi", "sise_sayisi", "hazirlik_artisi", "sefer_kehribari", "olum_sayisi"]:
		if not _tam_sayi(veri.get(anahtar)) or float(veri[anahtar]) < 0.0:
			return false
	if not _pozitif_sayi(veri.get("sure_sn")):
		return false
	for anahtar: String in ["gecit_acik", "kestirme_acik", "nefes_kesesi_alindi", "tamamlandi"]:
		if not veri.get(anahtar) is bool:
			return false
	var asama: int = int(veri["gorev_asamasi"])
	if asama > Gorev.Durum.M6_BITTI or not veri.get("organlar") is Dictionary:
		return false
	var organlar: Dictionary = veri["organlar"]
	var oyuncuda: int = 0
	for organ: String in ["yanki", "soluk"]:
		if not organlar.get(organ) in [Oyun.BULUNMADI, Oyun.OYUNCU, Oyun.CANLI]:
			return false
		if organlar[organ] == Oyun.OYUNCU:
			oyuncuda += 1
	if oyuncuda > 1 or (asama < Gorev.Durum.M2_YANKIYI_GETIR) != (organlar["yanki"] == Oyun.BULUNMADI):
		return false
	if (asama < Gorev.Durum.M4_NEFES) != (organlar["soluk"] == Oyun.BULUNMADI):
		return false
	if bool(veri["gecit_acik"]) != (asama >= Gorev.Durum.M3_DERIN_GECIT):
		return false
	if organlar["yanki"] == Oyun.CANLI and not veri["gecit_acik"]:
		return false
	if organlar["soluk"] == Oyun.CANLI and asama < Gorev.Durum.M5_YOLCULUK:
		return false
	if bool(veri["tamamlandi"]) != (asama == Gorev.Durum.M6_BITTI) or (veri["tamamlandi"] and organlar["soluk"] != Oyun.CANLI):
		return false
	if veri["nefes_kesesi_alindi"] and organlar["soluk"] == Oyun.BULUNMADI:
		return false
	var ayar: Dictionary = Ayarlar.denge["asama3"]["ilerleme"]
	var kapasite: int = int(Ayarlar.denge["asama2"]["sise_kapasitesi"]) + (int(ayar["nefes_kapasite_artis"]) if veri["nefes_kesesi_alindi"] else 0)
	if int(veri["sise_kapasitesi"]) != kapasite or int(veri["hazirlik_artisi"]) > int(ayar["hazirlik_en_fazla"]) or int(veri["sise_sayisi"]) > kapasite + int(ayar["hazirlik_en_fazla"]) or int(veri["sefer_kehribari"]) > int(veri["kehribar"]):
		return false
	if not veri.get("oyuncu") is Dictionary:
		return false
	var oyuncu: Dictionary = veri["oyuncu"]
	for anahtar: String in ["can", "kacin_bekleme", "tarama_bekleme", "soluk_kalan", "soluk_bekleme"]:
		if not _pozitif_sayi(oyuncu.get(anahtar)):
			return false
	return float(oyuncu["can"]) <= Ayarlar.sayi("oyuncu_can")

func _pozitif_sayi(deger: Variant) -> bool:
	return (deger is int or deger is float) and is_finite(float(deger)) and float(deger) >= 0.0

func _tam_sayi(deger: Variant) -> bool:
	return (deger is int or deger is float) and is_finite(float(deger)) and float(deger) == floorf(float(deger))

func _hata(anahtar: String) -> bool:
	son_hata = anahtar
	kayit_hatasi.emit(anahtar)
	return false

func _kurtarma(anahtar: String) -> bool:
	son_hata = anahtar
	kurtarma_gerekli.emit(anahtar)
	return false
