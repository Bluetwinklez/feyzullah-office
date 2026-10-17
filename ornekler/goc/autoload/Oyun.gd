## Oturum boyunca ortak bayrakları tutar; sahne davranışları sahne düğümlerindedir.
extends Node
var kestirme_acik: bool = false
const BULUNMADI: String = "BULUNMADI"
const OYUNCU: String = "OYUNCU"
const CANLI: String = "CANLI"
const MEKAN_SAHNELERI: Dictionary = {
	"merkez": "res://sahneler/merkez.tscn", "bolge": "res://sahneler/bolge.tscn",
	"koridor": "res://sahneler/koridor.tscn", "kuyu_salonu": "res://sahneler/kuyu_salonu.tscn",
	"derin_gecit": "res://sahneler/derin_gecit.tscn", "cekirdek_odasi": "res://sahneler/cekirdek_odasi.tscn",
	"sis_cebi": "res://sahneler/sis_cebi.tscn"
}
var _kese_konumu: String = OYUNCU # Bağımsız Aşama 1 sahnesinin başlangıç sözleşmesi.
var _soluk_konumu: String = BULUNMADI
var soluk_konumu: String:
	get:
		return _soluk_konumu
var nefes_kesesi_alindi: bool = false
var sise_sayisi: int = 0
var hazirlik_artisi: int = 0
var sefer_kehribari: int = 0
var olum_sayisi: int = 0
var sure_sn: float = 0.0
var tamamlandi: bool = false
var yenilen_dusmanlar: Dictionary = {}
var kese_konumu: String:
	get:
		return _kese_konumu
var gecit_acik: bool = false
var gorev: Gorev = Gorev.new()
var oturum_aktif: bool = false
var mekan: String = ""
var arayuz_acik: bool = false
var kehribar: int = 0
var sise_kapasitesi: int = 0
var oyuncu_durumu: Dictionary = {}
var _oyuncu: WeakRef
var _gecis: bool = false
var _kayitsiz_cikis_onayi: bool = false
var _olum_donusu: bool = false
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	Olaylar.kestirme_acildi.connect(_kestirme_kaydi)
	get_tree().auto_accept_quit = false

func yeni_oyun() -> void:
	_kayitsiz_cikis_onayi = false
	_olum_donusu = false
	oturum_aktif = true
	_kese_konumu = BULUNMADI
	_soluk_konumu = BULUNMADI
	nefes_kesesi_alindi = false
	hazirlik_artisi = 0
	sefer_kehribari = 0
	olum_sayisi = 0
	sure_sn = 0.0
	tamamlandi = false
	yenilen_dusmanlar.clear()
	gecit_acik = false
	kestirme_acik = false
	gorev = Gorev.new()
	kehribar = 0
	sise_kapasitesi = int(Ayarlar.denge["asama2"]["sise_kapasitesi"])
	sise_sayisi = sise_kapasitesi
	oyuncu_durumu = {"can": Ayarlar.sayi("oyuncu_can"), "kacin_bekleme": 0.0, "tarama_bekleme": 0.0, "soluk_kalan": 0.0, "soluk_bekleme": 0.0}
	_oyuncu = null
	mekan = ""
	arayuz_acik = false
	Olaylar.oturum_baslat()
	Olaylar.durum_degisti.emit()

func tasiyiciyi_dinle() -> bool:
	if mekan != "merkez" or not gorev.gecis(&"tasiyici_dinlendi"):
		return _reddet()
	_gorev_bildir()
	return true

func yanki_bul(konum: StringName = &"kuyu_salonu") -> bool:
	if konum != &"kuyu_salonu" or mekan != "kuyu_salonu" or _kese_konumu != BULUNMADI or gorev.durum != Gorev.Durum.M1_TESISE_IN:
		return _reddet()
	if not gorev.gecis(&"yanki_bulundu"):
		return false
	_kese_konumu = OYUNCU
	Olaylar.yaz("organ_bulundu", "yanki")
	_gorev_bildir()
	Kayit.kaydet()
	return true

func aktar(hedef: String, onay: bool = false) -> bool:
	return organ_aktar("yanki", hedef, onay)

func organ_konumu(organ: String) -> String:
	return _kese_konumu if organ == "yanki" else _soluk_konumu if organ == "soluk" else BULUNMADI

func organ_aktar(organ: String, hedef: String, onay: bool = false) -> bool:
	if tamamlandi or not organ in ["yanki", "soluk"]:
		return _reddet()
	var konum: String = organ_konumu(organ)
	if not onay or mekan != "merkez" or not hedef in [OYUNCU, CANLI] or konum == BULUNMADI or hedef == konum:
		return _reddet()
	var diger: String = _soluk_konumu if organ == "yanki" else _kese_konumu
	if hedef == OYUNCU and diger == OYUNCU:
		Olaylar.bilgi.emit("bilgi.yuva_dolu")
		return false
	if gorev.durum < Gorev.Durum.M2_YANKIYI_GETIR:
		return _reddet()
	# Aktarım yalnız yakındaki Bağ Düzeneği üzerinden yapılır.
	var yakin: bool = false
	var oyuncu: Oyuncu = etkin_oyuncu()
	for nokta: Node in get_tree().get_nodes_in_group("etkilesilebilir"):
		if nokta is EtkilesimNoktasi and nokta.eylem == &"bag" and nokta.erisilebilir(oyuncu):
			yakin = true
	if not yakin:
		return _reddet()
	if organ == "yanki":
		_kese_konumu = hedef
	else:
		_soluk_konumu = hedef
	var yeni_gecit: bool = organ == "yanki" and hedef == CANLI and not gecit_acik
	if organ == "yanki" and hedef == CANLI:
		gecit_acik = true # Geri aktarım bu bayrağı asla kapatmaz.
		if gorev.durum == Gorev.Durum.M2_YANKIYI_GETIR:
			gorev.gecis(&"yanki_baglandi")
	if organ == "soluk" and hedef == CANLI and gorev.durum == Gorev.Durum.M4_NEFES:
		gorev.gecis(&"soluk_baglandi")
	Olaylar.organ_aktarildi.emit(organ, hedef)
	Olaylar.yaz("organ_aktarildi", organ)
	if yeni_gecit:
		Olaylar.gecit_acildi.emit()
		Olaylar.yaz("gecit_acildi", "yanki")
	_gorev_bildir()
	Kayit.kaydet()
	return true

func soluk_bul() -> bool:
	if mekan != "cekirdek_odasi" or not gecit_acik or _soluk_konumu != BULUNMADI or gorev.durum != Gorev.Durum.M3_DERIN_GECIT:
		return _reddet()
	if _kese_konumu == OYUNCU:
		Olaylar.bilgi.emit("bilgi.yuva_dolu")
		return false
	_soluk_konumu = OYUNCU
	gorev.gecis(&"soluk_bulundu")
	Olaylar.yaz("organ_bulundu", "soluk")
	_gorev_bildir()
	Kayit.kaydet()
	return true

func nefes_kesesi_al() -> bool:
	if mekan != "sis_cebi" or nefes_kesesi_alindi or _soluk_konumu != OYUNCU:
		return _reddet()
	nefes_kesesi_alindi = true
	sise_kapasitesi += int(Ayarlar.denge["asama3"]["ilerleme"]["nefes_kapasite_artis"])
	Olaylar.durum_degisti.emit()
	Kayit.kaydet()
	return true

func hazirlan() -> bool:
	var veri: Dictionary = Ayarlar.denge["asama3"]["ilerleme"]
	if tamamlandi or mekan != "merkez" or not _noktaya_yakin(&"tezgah") or hazirlik_artisi >= int(veri["hazirlik_en_fazla"]) or kehribar < int(veri["hazirlik_bedel"]):
		return _reddet()
	kehribar -= int(veri["hazirlik_bedel"])
	hazirlik_artisi += 1
	Olaylar.durum_degisti.emit()
	Kayit.kaydet()
	return true

func _noktaya_yakin(eylem: StringName) -> bool:
	for nokta: Node in get_tree().get_nodes_in_group("etkilesilebilir"):
		if nokta is EtkilesimNoktasi and nokta.eylem == eylem and nokta.erisilebilir(etkin_oyuncu()):
			return true
	return false

func iyiles() -> bool:
	var oyuncu: Oyuncu = etkin_oyuncu()
	if tamamlandi or get_tree().paused or arayuz_acik or sise_sayisi <= 0 or not is_instance_valid(oyuncu) or oyuncu.can <= 0.0 or oyuncu.can >= Ayarlar.sayi("oyuncu_can"):
		return false
	sise_sayisi -= 1
	oyuncu.can = minf(Ayarlar.sayi("oyuncu_can"), oyuncu.can + float(Ayarlar.denge["asama3"]["ilerleme"]["sise_iyilestirme"]))
	oyuncu.can_degisti.emit(oyuncu.can)
	Olaylar.durum_degisti.emit()
	return true

func kehribar_kazan(tur: String, kimlik: String) -> void:
	if not oturum_aktif or mekan == "merkez" or tamamlandi or yenilen_dusmanlar.has(kimlik):
		return
	var ganimet: Dictionary = Ayarlar.denge["asama3"]["ilerleme"]["ganimet"]
	if not ganimet.has(tur):
		return
	yenilen_dusmanlar[kimlik] = true
	var miktar: int = int(ganimet[tur])
	kehribar += miktar
	sefer_kehribari += miktar
	Olaylar.dusman_yenildi()
	Olaylar.durum_degisti.emit()

func _physics_process(delta: float) -> void:
	if oturum_aktif and not get_tree().paused and not tamamlandi:
		sure_sn += delta

func yolculuga_hazir() -> bool:
	return oturum_aktif and not tamamlandi and mekan == "merkez" and gorev.durum == Gorev.Durum.M5_YOLCULUK and _soluk_konumu == CANLI and _noktaya_yakin(&"dinle")

func yolculuk_baslat(onay: bool = false) -> bool:
	if not onay or not yolculuga_hazir():
		return _reddet()
	if not gorev.gecis(&"yolculuk_onaylandi"):
		return _reddet()
	tamamlandi = true
	Olaylar.yaz("tamamlandi")
	_gorev_bildir()
	Kayit.kaydet()
	return true

func tekrar_oyna() -> bool:
	if not tamamlandi:
		return _reddet()
	Olaylar.yaz("tekrar_oyna")
	if not Kayit.yeni_oyun(true):
		return false
	return yer_degistir("merkez")

func oyuncu_bagla(oyuncu: Oyuncu, yer: String) -> void:
	if not oturum_aktif:
		return
	mekan = yer
	_oyuncu = weakref(oyuncu)
	oyuncu.durum_uygula(oyuncu_durumu)
	if not oyuncu.oldu.is_connected(_olumden_don):
		oyuncu.oldu.connect(_olumden_don, CONNECT_ONE_SHOT)

func _olumden_don() -> void:
	if not oturum_aktif or tamamlandi or _olum_donusu:
		return
	olum_sayisi += 1
	var kayip: int = olum_kaybi()
	kehribar -= kayip
	sefer_kehribari -= kayip
	_olum_donusu = true
	# Sahne değişimi yer_degistir içinde ertelenir; fizik karesinde düğüm silinmez.
	if not _gecis:
		_gecis = true
		_gec.call_deferred("merkez")

func olum_kaybi() -> int:
	var oran: float = float(Ayarlar.denge["asama3"]["ilerleme"]["kaynak_kayip_orani"])
	return mini(kehribar, ceili(float(sefer_kehribari) * oran))

func etkin_oyuncu() -> Oyuncu:
	return _oyuncu.get_ref() as Oyuncu if _oyuncu != null else null

func yer_degistir(hedef: String) -> bool:
	if _gecis or not MEKAN_SAHNELERI.has(hedef) or hedef == mekan:
		return false
	if hedef in ["derin_gecit", "cekirdek_odasi"] and not gecit_acik:
		Olaylar.bilgi.emit("bilgi.muhur_kapali")
		return false
	var oyuncu: Oyuncu = etkin_oyuncu()
	if oyuncu != null:
		oyuncu_durumu = oyuncu.durum_verisi()
	_gecis = true
	_gec.call_deferred(hedef)
	return true

func _gec(hedef: String) -> void:
	var onceki_mekan: String = mekan
	if _olum_donusu:
		hedef = "merkez"
		oyuncu_durumu = {"can": Ayarlar.sayi("oyuncu_can"), "kacin_bekleme": 0.0, "tarama_bekleme": 0.0, "soluk_kalan": 0.0, "soluk_bekleme": 0.0}
		# Eski ölü örnek dönüş kaydında tam canı yeniden ezemez.
		_oyuncu = null
	if onceki_mekan == "merkez" and hedef != "merkez":
		sise_sayisi = sise_kapasitesi + hazirlik_artisi
		hazirlik_artisi = 0
		sefer_kehribari = 0
		yenilen_dusmanlar.clear()
	elif hedef == "merkez":
		sise_sayisi = sise_kapasitesi
		sefer_kehribari = 0
	get_tree().paused = false
	arayuz_acik = false
	var sonuc: Error = get_tree().change_scene_to_file(MEKAN_SAHNELERI[hedef])
	_gecis = false
	if sonuc != OK:
		Olaylar.bilgi.emit("bilgi.gecis_hatasi")
		return
	mekan = hedef
	_olum_donusu = false
	if onceki_mekan != "" and (hedef == "merkez" or onceki_mekan == "merkez"):
		Olaylar.yaz("sefer_dondu" if hedef == "merkez" else "sefer_basladi")
	if hedef == "merkez" and onceki_mekan != "" and onceki_mekan != "merkez":
		Kayit.kaydet()

func kayit_verisi() -> Dictionary:
	var oyuncu: Oyuncu = etkin_oyuncu()
	if oyuncu != null:
		oyuncu_durumu = oyuncu.durum_verisi()
	return {"surum": Kayit.SURUM, "gorev_asamasi": int(gorev.durum), "organlar": {"yanki": _kese_konumu, "soluk": _soluk_konumu}, "kehribar": kehribar, "sise_kapasitesi": sise_kapasitesi, "gecit_acik": gecit_acik, "kestirme_acik": kestirme_acik, "nefes_kesesi_alindi": nefes_kesesi_alindi, "tamamlandi": tamamlandi, "oyuncu": oyuncu_durumu.duplicate(true), "sise_sayisi": sise_sayisi, "hazirlik_artisi": hazirlik_artisi, "sefer_kehribari": sefer_kehribari, "olum_sayisi": olum_sayisi, "sure_sn": sure_sn}

func kayittan_uygula(veri: Dictionary) -> void:
	# Çağıran dosya dışında da doğrulama zorunlu; kısmi uygulama yapılmaz.
	veri = Kayit.tasi(veri)
	if not Kayit.dogrula(veri):
		return
	_kayitsiz_cikis_onayi = false
	_olum_donusu = false
	var kalici_gecit: bool = gecit_acik if oturum_aktif else false
	oturum_aktif = true
	_kese_konumu = veri["organlar"]["yanki"]
	_soluk_konumu = veri["organlar"]["soluk"]
	nefes_kesesi_alindi = veri["nefes_kesesi_alindi"]
	tamamlandi = veri["tamamlandi"]
	sise_sayisi = int(veri["sise_sayisi"])
	hazirlik_artisi = int(veri["hazirlik_artisi"])
	sefer_kehribari = int(veri["sefer_kehribari"])
	olum_sayisi = int(veri["olum_sayisi"])
	sure_sn = float(veri["sure_sn"])
	yenilen_dusmanlar.clear()
	gecit_acik = kalici_gecit or bool(veri["gecit_acik"])
	kestirme_acik = bool(veri["kestirme_acik"])
	gorev.durum = int(veri["gorev_asamasi"]) as Gorev.Durum
	if gecit_acik:
		gorev.durum = maxi(int(gorev.durum), Gorev.Durum.M3_DERIN_GECIT) as Gorev.Durum
		if _kese_konumu == BULUNMADI:
			_kese_konumu = OYUNCU
	kehribar = int(veri["kehribar"])
	sise_kapasitesi = int(veri["sise_kapasitesi"])
	oyuncu_durumu = veri["oyuncu"].duplicate(true)
	if float(oyuncu_durumu["can"]) <= 0.0:
		oyuncu_durumu["can"] = Ayarlar.sayi("oyuncu_can")
	# Yükleme daima merkezde güvenli doğumla başlar; eski sahne konumu yüklenmez.
	_oyuncu = null
	mekan = ""
	Olaylar.oturum_baslat()
	_gorev_bildir()

func _gorev_bildir() -> void:
	Olaylar.gorev_degisti.emit(int(gorev.durum))
	Olaylar.durum_degisti.emit()

func _reddet() -> bool:
	Olaylar.bilgi.emit("bilgi.sira")
	return false

func _kestirme_kaydi() -> void:
	if oturum_aktif:
		Olaylar.yaz("kestirme_acildi")
		Kayit.kaydet()
func duraklat_degistir() -> void:
	get_tree().paused = not get_tree().paused
	Olaylar.duraklatma_degisti.emit(get_tree().paused)

func cikis_iste() -> bool:
	if oturum_aktif and not Kayit.kaydet():
		if not _kayitsiz_cikis_onayi:
			_kayitsiz_cikis_onayi = true
			Olaylar.bilgi.emit("kayit.cikis_onay")
			return false
	get_tree().quit()
	return true

func _notification(bildirim: int) -> void:
	if bildirim == NOTIFICATION_WM_CLOSE_REQUEST:
		cikis_iste()
	if bildirim == NOTIFICATION_APPLICATION_FOCUS_OUT and is_inside_tree():
		get_tree().paused = true
		Olaylar.duraklatma_degisti.emit(true)
