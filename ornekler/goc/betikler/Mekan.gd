class_name Mekan
extends Node3D

@export var kimlik: String
@onready var oyuncu: Oyuncu = $Oyuncu
@onready var kamera: Camera3D = $Kamera
var _buluntu: EtkilesimNoktasi
var _kamera_veri: Dictionary

func _ready() -> void:
	var veri: Dictionary = Ayarlar.denge["asama3"]["mekanlar"][kimlik]
	var ortak: Dictionary = Ayarlar.denge["asama3"]["mekan"]
	var boy: Vector3 = Ayarlar.diziden_vektor(veri["boyut"])
	var zemin: MeshInstance3D = Geometri.kutu(self, boy, Vector3.DOWN * boy.y / 2.0, Color(Ayarlar.denge["renk_zemin"]), true)
	var kalinlik: float = float(ortak["duvar_kalinlik"])
	var yukseklik: float = float(ortak["duvar_yukseklik"])
	for isaret: float in [-1.0, 1.0]:
		Geometri.kutu(self, Vector3(kalinlik, yukseklik, boy.z), Vector3(isaret * boy.x / 2.0, yukseklik / 2.0, 0.0), Color(Ayarlar.denge["renk_duvar"]), true)
		Geometri.kutu(self, Vector3(boy.x, yukseklik, kalinlik), Vector3(0.0, yukseklik / 2.0, isaret * boy.z / 2.0), Color(Ayarlar.denge["renk_duvar"]), true)
	oyuncu.position = Ayarlar.diziden_vektor(veri["dogum"])
	_kamera_veri = Ayarlar.denge["gorsel"]["kamera"]
	kamera.rotation_degrees = Vector3(-float(_kamera_veri["egim"]), float(_kamera_veri["yatay"]), 0.0)
	kamera.size = float(_kamera_veri["boyut"])
	kamera.position = oyuncu.position + kamera.basis.z * float(_kamera_veri["mesafe"])
	var gorsel: AvluGorseli = AvluGorseli.new()
	add_child(gorsel)
	gorsel.kur(oyuncu, zemin, kamera)
	Oyun.oyuncu_bagla(oyuncu, kimlik)
	for kapi: Dictionary in veri["kapilar"]:
		kapi_ekle(self, kapi)
	if kimlik == "kuyu_salonu":
		_kuyu_kur()
	_dusmanlari_kur(veri)
	var organlar: MekanOrganlari = MekanOrganlari.new()
	organlar.name = "Organlar"
	add_child(organlar)
	organlar.kur(oyuncu, kimlik)
	if kimlik == "sis_cebi":
		# Bu alt adımda yalnız mekân: sis hasarı ve ödül sonraki görevde.
		var sis: MeshInstance3D = Geometri.kutu(self, Ayarlar.diziden_vektor(ortak["sis_hacmi"]), Ayarlar.diziden_vektor(ortak["sis_konum"]), Color(ortak["sis_renk"]), false)
		sis.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		(sis.material_override as StandardMaterial3D).transparency = BaseMaterial3D.TRANSPARENCY_ALPHA

func _dusmanlari_kur(veri: Dictionary) -> void:
	var sira: int = 0
	for kayit: Dictionary in veri.get("dusmanlar", []):
		var dusman: YeniDusman = (load(kayit["sahne"]) as PackedScene).instantiate() as YeniDusman
		add_child(dusman)
		dusman.position = Ayarlar.diziden_vektor(kayit["konum"])
		dusman.hedef = oyuncu
		SeferDusmani.bagla(dusman, dusman.tur, kimlik + ":" + str(sira))
		sira += 1
	if kimlik == "derin_gecit":
		var son: SonKarsilasma = SonKarsilasma.new()
		son.name = "SonKarsilasma"
		son.oyuncu_yolu = NodePath("../Oyuncu")
		add_child(son)

static func kapi_ekle(kok: Node3D, veri: Dictionary) -> MekanKapisi:
	var kapi: MekanKapisi = MekanKapisi.new()
	kapi.name = veri["ad"]
	kapi.hedef = veri["hedef"]
	kapi.eylem = &"kapi"
	kapi.metin_anahtari = veri["metin"]
	kapi.muhur_gerekli = bool(veri.get("muhur", false))
	kapi.kestirme_gerekli = bool(veri.get("kestirme", false))
	kok.add_child(kapi)
	kapi.position = Ayarlar.diziden_vektor(veri["konum"])
	var ortak: Dictionary = Ayarlar.denge["asama3"]["mekan"]
	Geometri.kutu(kapi, Ayarlar.diziden_vektor(ortak["kapi_isaret_boyut"]), Vector3.ZERO, Color(Ayarlar.denge["asama2"]["amber"]), false)
	return kapi

func _kuyu_kur() -> void:
	var veri: Dictionary = Ayarlar.denge["asama3"]["mekanlar"][kimlik]
	for sinir: Dictionary in veri["kestirme_yan_duvarlar"]:
		Geometri.kutu(self, Ayarlar.diziden_vektor(sinir["boyut"]), Ayarlar.diziden_vektor(sinir["konum"]), Color(Ayarlar.denge["renk_duvar"]), true)
	_buluntu = EtkilesimNoktasi.new()
	_buluntu.name = "KuyuSalonuBuluntusu"
	_buluntu.eylem = &"buluntu"
	_buluntu.metin_anahtari = "etkilesim.yanki"
	add_child(_buluntu)
	_buluntu.position = Ayarlar.diziden_vektor(veri["buluntu"])
	_buluntu.kullanildi.connect(_yanki_al)
	var kese: YankiKesesi = (load("res://sahneler/yanki_kesesi.tscn") as PackedScene).instantiate() as YankiKesesi
	kese.sahip = Oyun.BULUNMADI
	_buluntu.add_child(kese)
	kese.set_physics_process(false)
	var duvar: KirilganDuvar = (load("res://sahneler/kirilgan_duvar.tscn") as PackedScene).instantiate() as KirilganDuvar
	duvar.name = "KirilganDuvar"
	add_child(duvar)
	duvar.position = Ayarlar.diziden_vektor(veri["duvar"])
	if Oyun.kestirme_acik:
		duvar.kayittan_ac()
	duvar.yikildi.connect(_kestirme_ac)
	Olaylar.durum_degisti.connect(_buluntu_guncelle)
	_buluntu_guncelle()

func _kestirme_ac() -> void:
	Geometri.ses(self, "ses_etkilesim")

func _yanki_al(_oyuncu: Oyuncu) -> void:
	Oyun.yanki_bul()

func _buluntu_guncelle() -> void:
	_buluntu.visible = Oyun.kese_konumu == Oyun.BULUNMADI
	_buluntu.etkin = _buluntu.visible

func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_buluntu_guncelle):
		Olaylar.durum_degisti.disconnect(_buluntu_guncelle)

func _physics_process(delta: float) -> void:
	kamera.position = kamera.position.lerp(oyuncu.position + kamera.basis.z * float(_kamera_veri["mesafe"]), minf(1.0, delta * float(_kamera_veri["takip_yumusatma"])))
