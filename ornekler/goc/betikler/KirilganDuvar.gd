class_name KirilganDuvar
extends StaticBody3D
## Duvarın görünürlük süresi başladığında veya bittiğinde yayılır.
signal gorunurluk_degisti(gorunur: bool)
## Duvar yıkıldığında bir kez yayılır.
signal yikildi
var can: float
var kalan: float
var _yikildi: bool = false
var _vuruslar: Dictionary = {}
var _mesh: MeshInstance3D
func _ready() -> void:
	can = Ayarlar.sayi("duvar_can")
	kalan = 0.0
	add_to_group("taranabilir")
	add_to_group("hasar_alabilir")
	_mesh = Geometri.kutu(self, Ayarlar.vektor("duvar_boyut"), Vector3.ZERO, Color(Ayarlar.denge["renk_organ"]), false)
	var catlak: MeshInstance3D = Geometri.kutu(_mesh.get_parent() as Node3D, Ayarlar.vektor("catlak_boyut"), Ayarlar.vektor("catlak_konum"), Color(Ayarlar.denge["renk_zemin"]), false)
	catlak.rotation_degrees.z = Ayarlar.sayi("catlak_aci")
	_mesh.get_parent().visible = false
	var carpisma: CollisionShape3D = CollisionShape3D.new()
	var sekil: BoxShape3D = BoxShape3D.new()
	sekil.size = Ayarlar.vektor("duvar_boyut")
	carpisma.shape = sekil
	add_child(carpisma)
func _physics_process(delta: float) -> void:
	if kalan > 0.0:
		kalan = maxf(0.0, kalan - delta)
		if not gorunur_mu():
			_mesh.get_parent().visible = false
			gorunurluk_degisti.emit(false)
func tara_ile_goster(sure: float) -> void:
	if _yikildi:
		return
	kalan = sure
	_mesh.get_parent().visible = true
	gorunurluk_degisti.emit(true)
func gorunur_mu() -> bool:
	return kalan > 0.0 and not _yikildi
func yikildi_mi() -> bool:
	return _yikildi

func kayittan_ac() -> void:
	_yikildi = true
	can = 0.0
	collision_layer = 0
	collision_mask = 0
	_mesh.get_parent().visible = false
func hasar_al(miktar: float, vurus_kimligi: String = "") -> void:
	if not gorunur_mu() or (not vurus_kimligi.is_empty() and _vuruslar.has(vurus_kimligi)):
		return
	_vuruslar[vurus_kimligi] = true
	can = maxf(0.0, can - maxf(miktar, 0.0))
	if can <= 0.0:
		_yikildi = true
		collision_layer = 0
		collision_mask = 0
		_mesh.get_parent().visible = false
		Oyun.kestirme_acik = true
		yikildi.emit()
		Olaylar.kestirme_acildi.emit()
