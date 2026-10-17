class_name Avci
extends CharacterBody3D
## Hasar sonrası kalan canı bildirir.
signal can_degisti(yeni_can: float)
## Hazırlık başladığında yayılır.
signal saldiri_hazirlaniyor
## Ölümde yalnız bir kez yayılır.
signal oldu
@export var hedef_yolu: NodePath
@onready var hedef: Oyuncu = get_node_or_null(hedef_yolu) as Oyuncu if not hedef_yolu.is_empty() else null
@onready var model: Node3D = $Model
var can: float
var _bekleme: float
var _hazirlik: float
var _atilma: float
var _yon: Vector3 = Vector3.ZERO
var _vuruslar: Dictionary = {}
var _halka: MeshInstance3D
var _tepki_kalan: float
var _vurdu: bool = false
func _ready() -> void:
	can = Ayarlar.sayi("avci_can")
	_bekleme = 0.0
	_hazirlik = _bekleme
	_atilma = _bekleme
	_tepki_kalan = _bekleme
	add_to_group("hasar_alabilir")
	Geometri.govde(self, model, Color(Ayarlar.denge["renk_avci"]))
	_halka = MeshInstance3D.new()
	var halka_mesh: TorusMesh = TorusMesh.new()
	halka_mesh.inner_radius = Ayarlar.sayi("avci_menzil") * Ayarlar.sayi("halka_ic_oran")
	halka_mesh.outer_radius = Ayarlar.sayi("avci_menzil")
	_halka.mesh = halka_mesh
	_halka.position.y = Ayarlar.sayi("hedef_halka_y")
	_halka.scale.y = Ayarlar.sayi("halka_yukseklik")
	var malzeme: StandardMaterial3D = StandardMaterial3D.new()
	malzeme.albedo_color = Color(Ayarlar.denge["renk_hazirlik"])
	_halka.material_override = malzeme
	add_child(_halka)
	_halka.visible = false
func _goruyor_mu() -> bool:
	var yukari: Vector3 = Vector3.UP * 1.0
	var sorgu: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(global_position + yukari, hedef.global_position + yukari)
	sorgu.exclude = [get_rid()]
	var sonuc: Dictionary = get_world_3d().direct_space_state.intersect_ray(sorgu)
	return not sonuc.is_empty() and sonuc["collider"] == hedef
func _physics_process(delta: float) -> void:
	if can <= 0.0 or not is_instance_valid(hedef) or hedef.can <= 0.0:
		return
	_tepki_kalan = maxf(0.0, _tepki_kalan - delta)
	if _tepki_kalan <= 0.0 and _hazirlik <= 0.0:
		Geometri.renk_degistir(model, Color(Ayarlar.denge["renk_avci"]))
	_bekleme = maxf(0.0, _bekleme - delta)
	var fark: Vector3 = hedef.global_position - global_position
	fark.y = 0.0
	velocity = Vector3.ZERO
	if _atilma > 0.0:
		_atilma -= delta
		velocity = _yon * Ayarlar.sayi("avci_atilma")
		if not _vurdu and fark.length() <= Ayarlar.sayi("avci_menzil"):
			hedef.hasar_al(Ayarlar.sayi("avci_hasar"))
			_vurdu = true
	elif _hazirlik > 0.0:
		_hazirlik -= delta
		if _hazirlik <= 0.0:
			_atilma = Ayarlar.sayi("avci_atilma_sure")
			_bekleme = Ayarlar.sayi("avci_bekleme")
			_vurdu = false
			model.scale = Vector3.ONE
			_halka.visible = false
	elif fark.length() <= Ayarlar.sayi("algilama") and _goruyor_mu():
		if not fark.is_zero_approx():
			look_at(global_position + fark, Vector3.UP)
		if fark.length() <= Ayarlar.sayi("avci_menzil") and _bekleme <= 0.0:
			_hazirlik = Ayarlar.sayi("avci_hazirlik")
			_yon = fark.normalized()
			model.scale.y = Ayarlar.sayi("hazirlik_olcek")
			_halka.visible = true
			Geometri.renk_degistir(model, Color(Ayarlar.denge["renk_hazirlik"]))
			Geometri.ses(self, "ses_hazirlik")
			saldiri_hazirlaniyor.emit()
		elif fark.length() > Ayarlar.sayi("avci_menzil"):
			velocity = fark.normalized() * Ayarlar.sayi("avci_hiz")
	move_and_slide()
func hasar_al(miktar: float, vurus_kimligi: String = "") -> void:
	if can <= 0.0 or (not vurus_kimligi.is_empty() and _vuruslar.has(vurus_kimligi)):
		return
	_vuruslar[vurus_kimligi] = true
	can = maxf(0.0, can - maxf(miktar, 0.0))
	_tepki_kalan = Ayarlar.sayi("tepki_sure")
	Geometri.renk_degistir(model, Color(Ayarlar.denge["renk_hasar"]))
	Geometri.ses(self, "ses_hasar")
	move_and_collide(global_basis.z * Ayarlar.sayi("geri_itme"))
	can_degisti.emit(can)
	if can <= 0.0:
		velocity = Vector3.ZERO
		collision_layer = 0
		collision_mask = 0
		model.visible = false
		_halka.visible = false
		set_physics_process(false)
		oldu.emit()
