class_name MekanOrganlari
extends Node3D

var oyuncu: Oyuncu
var kimlik: String
var _nokta: EtkilesimNoktasi
var _sis_bekleme: float = 0.0

func kur(hedef: Oyuncu, yer: String) -> void:
	oyuncu = hedef
	kimlik = yer
	if not kimlik in ["cekirdek_odasi", "sis_cebi"]:
		return
	var veri: Dictionary = Ayarlar.denge["asama3"]["ilerleme"]
	_nokta = EtkilesimNoktasi.new()
	_nokta.name = "SolukCekirdegi" if kimlik == "cekirdek_odasi" else "NefesKesesi"
	_nokta.eylem = &"buluntu"
	_nokta.metin_anahtari = "etkilesim.soluk" if kimlik == "cekirdek_odasi" else "etkilesim.nefes"
	add_child(_nokta)
	_nokta.position = Ayarlar.diziden_vektor(veri["soluk_konum" if kimlik == "cekirdek_odasi" else "nefes_konum"])
	var model: OrganGorseli = OrganGorseli.new()
	model.name = "Gorsel"
	model.kimlik = "soluk_cekirdegi" if kimlik == "cekirdek_odasi" else "nefes_kesesi"
	_nokta.add_child(model)
	if kimlik == "cekirdek_odasi":
		model.position.y = float(Ayarlar.denge["modeller"]["soluk_cekirdegi"]["boy"]) / 2.0
	_nokta.kullanildi.connect(_al)
	Olaylar.durum_degisti.connect(_guncelle)
	_guncelle()

func _al(_hedef: Oyuncu) -> void:
	if kimlik == "cekirdek_odasi":
		Oyun.soluk_bul()
	else:
		Oyun.nefes_kesesi_al()

func _guncelle() -> void:
	_nokta.etkin = Oyun.soluk_konumu == Oyun.BULUNMADI if kimlik == "cekirdek_odasi" else not Oyun.nefes_kesesi_alindi
	_nokta.visible = _nokta.etkin

func _physics_process(delta: float) -> void:
	if kimlik != "sis_cebi" or not is_instance_valid(oyuncu) or oyuncu.can <= 0.0:
		return
	var ortak: Dictionary = Ayarlar.denge["asama3"]["mekan"]
	var merkez: Vector3 = Ayarlar.diziden_vektor(ortak["sis_konum"])
	var boy: Vector3 = Ayarlar.diziden_vektor(ortak["sis_hacmi"])
	var alan: Rect2 = Rect2(Vector2(merkez.x, merkez.z) - Vector2(boy.x, boy.z) / 2.0, Vector2(boy.x, boy.z))
	if not alan.has_point(Vector2(oyuncu.position.x, oyuncu.position.z)) or oyuncu.soluk.aktif:
		_sis_bekleme = 0.0
		return
	_sis_bekleme -= delta
	if _sis_bekleme <= 0.0:
		var veri: Dictionary = Ayarlar.denge["asama3"]["ilerleme"]
		_sis_bekleme += float(veri["sis_hasar_aralik"])
		oyuncu.hasar_al(float(veri["sis_hasar"]))

func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_guncelle):
		Olaylar.durum_degisti.disconnect(_guncelle)
