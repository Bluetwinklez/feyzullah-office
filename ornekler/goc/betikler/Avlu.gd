extends Node3D
@onready var oyuncu: Oyuncu = $Oyuncu
@onready var avci: Avci = $Avci
@onready var duvar: KirilganDuvar = $KirilganDuvar
@onready var kamera: Camera3D = $Kamera
var _kamera_veri: Dictionary
func _ready() -> void:
	oyuncu.position = Ayarlar.vektor("oyuncu_konum")
	avci.position = Ayarlar.vektor("avci_konum")
	duvar.position = Ayarlar.vektor("duvar_konum")
	var zemin: MeshInstance3D = Geometri.kutu(self, Ayarlar.vektor("zemin_boyut"), Ayarlar.vektor("zemin_konum"), Color(Ayarlar.denge["renk_zemin"]), true)
	for veri: Array[Variant] in Ayarlar.denge["duvarlar"]:
		var p: Array[Variant] = veri.front()
		var b: Array[Variant] = veri.back()
		Geometri.kutu(self, Vector3(b.front(), b[1], b.back()), Vector3(p.front(), p[1], p.back()), Color(Ayarlar.denge["renk_duvar"]), true)
	_kamera_veri = Ayarlar.denge["gorsel"]["kamera"]
	kamera.rotation_degrees = Vector3(-float(_kamera_veri["egim"]), float(_kamera_veri["yatay"]), 0.0)
	kamera.size = float(_kamera_veri["boyut"])
	kamera.position = oyuncu.position + kamera.basis.z * float(_kamera_veri["mesafe"])
	var gorsel: AvluGorseli = AvluGorseli.new()
	add_child(gorsel)
	gorsel.kur(oyuncu, zemin, kamera)
	Olaylar.kestirme_acildi.connect(_kestirme_sesi)
	if Oyun.oturum_aktif:
		var asama2: BolgeAsama2 = BolgeAsama2.new()
		asama2.name = "Asama2"
		add_child(asama2)
		asama2.kur(oyuncu, avci)
		if Oyun.kestirme_acik:
			duvar.kayittan_ac()
func _kestirme_sesi() -> void:
	Geometri.ses(duvar, "ses_etkilesim")
func _exit_tree() -> void:
	if Olaylar.kestirme_acildi.is_connected(_kestirme_sesi):
		Olaylar.kestirme_acildi.disconnect(_kestirme_sesi)
func _physics_process(delta: float) -> void:
	kamera.position = kamera.position.lerp(oyuncu.position + kamera.basis.z * float(_kamera_veri["mesafe"]), minf(1.0, delta * float(_kamera_veri["takip_yumusatma"])))
