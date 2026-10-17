extends Node3D
@onready var oyuncu: Oyuncu = $Oyuncu
@onready var kamera: Camera3D = $Kamera
var _bag_ekrani: BagEkrani
var _canli_kese: YankiKesesi
var _canli_soluk: OrganGorseli
var _yolculuk: SonYolculuk
var _dinle_noktasi: EtkilesimNoktasi

func _ready() -> void:
	if not Oyun.oturum_aktif:
		Oyun.yeni_oyun()
	var veri: Dictionary = Ayarlar.denge["asama2"]
	oyuncu.position = Ayarlar.diziden_vektor(veri["merkez_dogum"])
	Oyun.oyuncu_bagla(oyuncu, "merkez")
	_model(self, "TasiyiciSirt", "tasiyici_sirt", Vector3.ZERO)
	var zemin: MeshInstance3D = Geometri.kutu(self, Ayarlar.diziden_vektor(veri["merkez_zemin"]), Vector3.DOWN * float(veri["zemin_yari"]), Color(veri["zemin_renk"]), true)
	zemin.visible = false # Düz fizik platformu organik sırt modelini örtmez.
	# Sırt modeli görseldir; yürünebilir düz taban ve kenar sınırları ayrı kalır.
	for duvar: Array[Variant] in veri["merkez_sinirlar"]:
		Geometri.kutu(self, Ayarlar.diziden_vektor(duvar[1]), Ayarlar.diziden_vektor(duvar[0]), Color(veri["zemin_renk"]), true)
	var keseler: Node3D = Node3D.new()
	keseler.name = "NefesKeseleri"
	add_child(keseler)
	for konum: Array[Variant] in veri["nefes_konumlar"]:
		var nefes: TasiyiciNefes = TasiyiciNefes.new()
		nefes.name = "Kese" + str(keseler.get_child_count())
		keseler.add_child(nefes)
		nefes.position = Ayarlar.diziden_vektor(konum)
	var omurga: Node3D = Node3D.new()
	omurga.name = "TasiyiciOmurga"
	add_child(omurga)
	_model(omurga, "Model", "tasiyici_omurga", Ayarlar.diziden_vektor(veri["omurga_konum"]))
	var bag: EtkilesimNoktasi = _nokta("BagDuzenegi", &"bag", "etkilesim.bag", veri["bag_konum"])
	_model(bag, "Model", "bag_duzenegi", Vector3.ZERO)
	bag.kullanildi.connect(_bag_ac)
	_bag_ekrani = BagEkrani.new()
	add_child(_bag_ekrani)
	var dinle: EtkilesimNoktasi = _nokta("Tasiyici", &"dinle", "etkilesim.dinle", veri["dinle_konum"])
	_dinle_noktasi = dinle
	dinle.kullanildi.connect(_dinle)
	_yolculuk = SonYolculuk.new()
	_yolculuk.oyuncu = oyuncu
	add_child(_yolculuk)
	var kapi: EtkilesimNoktasi = _nokta("DonusKapisi", &"kapi", "etkilesim.avlu", veri["merkez_kapi"])
	kapi.kullanildi.connect(_avluya_git)
	_canli_kese = (load("res://sahneler/yanki_kesesi.tscn") as PackedScene).instantiate() as YankiKesesi
	_canli_kese.sahip = Oyun.CANLI
	bag.add_child(_canli_kese)
	_canli_kese.position = Ayarlar.diziden_vektor(veri["canli_kese_konum"])
	_canli_soluk = OrganGorseli.new()
	_canli_soluk.name = "CanliSoluk"
	add_child(_canli_soluk)
	_canli_soluk.position = Ayarlar.diziden_vektor(Ayarlar.denge["asama3"]["ilerleme"]["canli_soluk_konum"])
	var tezgah: EtkilesimNoktasi = _nokta("HazirlikTezgahi", &"tezgah", "etkilesim.tezgah", Ayarlar.denge["asama3"]["ilerleme"]["tezgah_konum"])
	Geometri.kutu(tezgah, Ayarlar.diziden_vektor(Ayarlar.denge["asama3"]["ilerleme"]["tezgah_boyut"]), Vector3.ZERO, Color(veri["amber"]), false)
	tezgah.kullanildi.connect(_hazirlan)
	_ortam(veri)
	Olaylar.durum_degisti.connect(_guncelle)
	_guncelle()
	if Oyun.tamamlandi:
		add_child(BitisEkrani.new())

func _model(ebeveyn: Node3D, ad: String, kimlik: String, konum: Vector3) -> MerkezModeli:
	var model: MerkezModeli = MerkezModeli.new()
	model.name = ad
	ebeveyn.add_child(model)
	model.position = konum
	model.kur(kimlik)
	return model

func _nokta(ad: String, eylem: StringName, metin: String, konum: Array[Variant]) -> EtkilesimNoktasi:
	var nokta: EtkilesimNoktasi = EtkilesimNoktasi.new()
	nokta.name = ad
	nokta.eylem = eylem
	nokta.metin_anahtari = metin
	add_child(nokta)
	nokta.position = Ayarlar.diziden_vektor(konum)
	return nokta

func _ortam(veri: Dictionary) -> void:
	var dunya: WorldEnvironment = WorldEnvironment.new()
	var cevre: Environment = Environment.new()
	cevre.background_mode = Environment.BG_COLOR
	cevre.background_color = Color(veri["arka_plan"])
	cevre.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	cevre.ambient_light_color = Color(veri["amber"])
	cevre.ambient_light_energy = float(veri["ortam_enerji"])
	dunya.environment = cevre
	add_child(dunya)
	var isik: DirectionalLight3D = DirectionalLight3D.new()
	isik.rotation_degrees = Vector3(-float(Ayarlar.denge["gorsel"]["kamera"]["egim"]), 0.0, 0.0)
	isik.light_color = Color(veri["amber"])
	isik.light_energy = float(veri["isik_enerji"])
	isik.shadow_enabled = false
	add_child(isik)
	var kamera_veri: Dictionary = Ayarlar.denge["gorsel"]["kamera"]
	kamera.rotation_degrees = Vector3(-float(kamera_veri["egim"]), float(kamera_veri["yatay"]), 0.0)
	kamera.size = float(kamera_veri["boyut"])
	kamera.position = oyuncu.position + kamera.basis.z * float(kamera_veri["mesafe"])

func _physics_process(delta: float) -> void:
	var veri: Dictionary = Ayarlar.denge["gorsel"]["kamera"]
	kamera.position = kamera.position.lerp(oyuncu.position + kamera.basis.z * float(veri["mesafe"]), minf(1.0, delta * float(veri["takip_yumusatma"])))

func _bag_ac(_oyuncu: Oyuncu) -> void:
	_bag_ekrani.ac()

func _dinle(_oyuncu: Oyuncu) -> void:
	if Oyun.gorev.durum == Gorev.Durum.M5_YOLCULUK:
		_yolculuk.iste()
		return
	if Oyun.tasiyiciyi_dinle():
		Olaylar.bilgi.emit("bilgi.dinlendi")

func _avluya_git(_oyuncu: Oyuncu) -> void:
	Oyun.yer_degistir("bolge")

func _guncelle() -> void:
	_canli_kese.visible = Oyun.kese_konumu == Oyun.CANLI
	_canli_soluk.visible = Oyun.soluk_konumu == Oyun.CANLI
	_dinle_noktasi.metin_anahtari = "etkilesim.yolculuk" if Oyun.gorev.durum == Gorev.Durum.M5_YOLCULUK else "etkilesim.dinle"
	var cevre: Environment = get_world_3d().environment
	if cevre != null:
		cevre.fog_enabled = true
		cevre.fog_mode = Environment.FOG_MODE_DEPTH
		cevre.fog_depth_begin = float(Ayarlar.denge["gorsel"]["ortam"]["sis_baslangic"])
		cevre.fog_depth_end = float(Ayarlar.denge["gorsel"]["ortam"]["sis_bitis"]) * (float(Ayarlar.denge["asama3"]["ilerleme"]["sis_incelme_carpan"]) if Oyun.soluk_konumu == Oyun.CANLI else 1.0)

func _hazirlan(_oyuncu: Oyuncu) -> void:
	if Oyun.hazirlan():
		Olaylar.bilgi.emit("bilgi.hazirlandi")

func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_guncelle):
		Olaylar.durum_degisti.disconnect(_guncelle)
