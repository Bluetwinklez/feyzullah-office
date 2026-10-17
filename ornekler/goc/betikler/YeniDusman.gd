class_name YeniDusman
extends CharacterBody3D

## Hasar sonrası kalan canı bildirir.
signal can_degisti(yeni_can: float)
## Hazırlık halkası açıldığında yayılır.
signal saldiri_hazirlaniyor
## Ölümde yalnız bir kez yayılır.
signal oldu
@export_enum("agir", "puskurtucu") var tur: String = "agir"
@export var hedef_yolu: NodePath
@onready var hedef: Oyuncu = get_node_or_null(hedef_yolu) as Oyuncu if not hedef_yolu.is_empty() else null
@onready var model: ModelBaglantisi = $Model
var can: float
var saldiri_hazirligi_aktif: bool = false
var oldu_mu: bool:
	get:
		return can <= 0.0
var acik_kalan: float = 0.0
var _veri: Dictionary
var _hazirlik: float = 0.0
var _bekleme: float = 0.0
var _yon: Vector3 = Vector3.FORWARD
var _vuruslar: Dictionary = {}
var _halka: MeshInstance3D

func _ready() -> void:
	_veri = Ayarlar.denge["asama3"]["dusmanlar"][tur]
	can = float(_veri["can"])
	add_to_group("hasar_alabilir")
	var carpisma: CollisionShape3D = CollisionShape3D.new()
	var sekil: CapsuleShape3D = CapsuleShape3D.new()
	sekil.height = float(_veri["boy"])
	sekil.radius = float(_veri["yaricap"])
	carpisma.shape = sekil
	carpisma.position.y = sekil.height / 2.0
	add_child(carpisma)
	if not model.yuklendi:
		var boyut: Vector3 = Ayarlar.diziden_vektor(_veri["yedek_boyut"])
		Geometri.kutu(model, boyut, Vector3.UP * boyut.y / 2.0, Color(_veri["renk"]), false)
		if tur == "puskurtucu":
			Geometri.kutu(model, Ayarlar.diziden_vektor(_veri["boyun_boyut"]), Ayarlar.diziden_vektor(_veri["boyun_konum"]), Color(_veri["renk"]), false)
	_halka = MeshInstance3D.new()
	var halka: TorusMesh = TorusMesh.new()
	halka.outer_radius = float(_veri["menzil"])
	halka.inner_radius = halka.outer_radius * Ayarlar.sayi("halka_ic_oran")
	_halka.mesh = halka
	_halka.position.y = Ayarlar.sayi("hedef_halka_y")
	_halka.scale.y = Ayarlar.sayi("halka_yukseklik")
	var malzeme: StandardMaterial3D = StandardMaterial3D.new()
	malzeme.albedo_color = Color(Ayarlar.denge["renk_hazirlik"])
	malzeme.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_halka.material_override = malzeme
	add_child(_halka)
	_halka.hide()

func goruyor_mu() -> bool:
	if not is_instance_valid(hedef) or hedef.can <= 0.0:
		return false
	var yukari: Vector3 = Vector3.UP * float(_veri["goz_y"])
	var sorgu: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(global_position + yukari, hedef.global_position + Vector3.UP)
	sorgu.exclude = [get_rid()]
	var sonuc: Dictionary = get_world_3d().direct_space_state.intersect_ray(sorgu)
	return not sonuc.is_empty() and sonuc["collider"] == hedef

func saldiri_baslat() -> bool:
	if get_tree().paused or oldu_mu or saldiri_hazirligi_aktif or _bekleme > 0.0 or acik_kalan > 0.0 or not goruyor_mu():
		return false
	var fark: Vector3 = hedef.global_position - global_position
	fark.y = 0.0
	if fark.length() > float(_veri["menzil"]):
		return false
	_yon = fark.normalized()
	saldiri_hazirligi_aktif = true
	_hazirlik = float(_veri["hazirlik"])
	model.scale.y = Ayarlar.sayi("hazirlik_olcek")
	Geometri.renk_degistir(model, Color(Ayarlar.denge["renk_hazirlik"]))
	_halka.show()
	Geometri.ses(self, "ses_hazirlik")
	saldiri_hazirlaniyor.emit()
	return true

func _physics_process(delta: float) -> void:
	if oldu_mu:
		return
	velocity = Vector3.ZERO
	_bekleme = maxf(0.0, _bekleme - delta)
	acik_kalan = maxf(0.0, acik_kalan - delta)
	if saldiri_hazirligi_aktif:
		_hazirlik -= delta
		if _hazirlik <= 0.0:
			_saldiriyi_bitir()
	elif is_instance_valid(hedef) and hedef.can > 0.0 and acik_kalan <= 0.0:
		var fark: Vector3 = hedef.global_position - global_position
		fark.y = 0.0
		if fark.length() <= float(_veri["algilama"]) and goruyor_mu():
			if not fark.is_zero_approx():
				look_at(global_position + fark, Vector3.UP)
			if fark.length() > float(_veri["menzil"]):
				velocity = fark.normalized() * float(_veri["hiz"])
			elif tur == "puskurtucu" and fark.length() < float(_veri["uzak_dur"]):
				velocity = -fark.normalized() * float(_veri["hiz"])
			else:
				saldiri_baslat()
	move_and_slide()

func _saldiriyi_bitir() -> void:
	saldiri_hazirligi_aktif = false
	_halka.hide()
	model.scale = Vector3.ONE
	Geometri.renk_degistir(model, Color(_veri["renk"]))
	_bekleme = float(_veri["bekleme"])
	acik_kalan = float(_veri["acik_sure"])
	if oldu_mu or not is_instance_valid(hedef) or hedef.can <= 0.0:
		return
	if tur == "puskurtucu":
		var mermi: DusmanMermisi = DusmanMermisi.new()
		mermi.kaynak = weakref(self)
		mermi.yon = _yon
		mermi.veri = _veri
		# Top-level mermi dönüşü miras almaz; sahne kaldırılınca birlikte temizlenir.
		mermi.top_level = true
		add_child(mermi)
		mermi.global_position = global_position + Vector3.UP * float(_veri["mermi_y"])
	elif global_position.distance_to(hedef.global_position) <= float(_veri["menzil"]) and goruyor_mu():
		var fark: Vector3 = (hedef.global_position - global_position).normalized()
		if _yon.dot(fark) >= float(_veri["vurus_aci"]):
			hedef.hasar_al(float(_veri["hasar"]))
	Geometri.ses(self, "ses_saldiri")

func hasar_al(miktar: float, vurus_kimligi: String = "") -> void:
	if oldu_mu or miktar <= 0.0 or (not vurus_kimligi.is_empty() and _vuruslar.has(vurus_kimligi)):
		return
	if not vurus_kimligi.is_empty():
		_vuruslar[vurus_kimligi] = true
	can = maxf(0.0, can - miktar)
	Geometri.ses(self, "ses_hasar")
	can_degisti.emit(can)
	if oldu_mu:
		saldiri_hazirligi_aktif = false
		velocity = Vector3.ZERO
		collision_layer = 0
		collision_mask = 0
		model.hide()
		_halka.hide()
		set_physics_process(false)
		oldu.emit()
