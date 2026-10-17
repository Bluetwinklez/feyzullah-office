class_name Oyuncu
extends CharacterBody3D
## Oyuncu canı değiştiğinde yayılır.
signal can_degisti(yeni_can: float)
## Her kabul edilen saldırıda kimlik ve zincir basamağı gönderir.
signal saldirdi(adim: int, vurus_kimligi: String)
## Kaçınma başladığında yayılır.
signal kacindi
## Oyuncu öldüğünde bir kez yayılır.
signal oldu
@export var kamera_yolu: NodePath
@onready var model: Node3D = $Model
@onready var yanki: YankiKesesi = $YankiKesesi
@onready var kamera: Camera3D = get_node_or_null(kamera_yolu) as Camera3D if not kamera_yolu.is_empty() else null
var can: float
var zincir_adimi: int
var kaciniyor_mu: bool = false
var kacin_bekleme: float
var _kacin_kalan: float
var _zincir_kalan: float
var _saldiri_kalan: float
var _vurus_sayaci: int
var _kacin_yonu: Vector3 = Vector3.FORWARD
var _tepki_kalan: float
var _hareket: Vector3 = Vector3.ZERO
var soluk: SolukCekirdegi
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	can = Ayarlar.sayi("oyuncu_can")
	zincir_adimi = 0
	_vurus_sayaci = zincir_adimi
	kacin_bekleme = 0.0
	_kacin_kalan = kacin_bekleme
	_zincir_kalan = kacin_bekleme
	_saldiri_kalan = kacin_bekleme
	_tepki_kalan = kacin_bekleme
	Geometri.govde(self, model, Color(Ayarlar.denge["renk_oyuncu"]), true)
	soluk = SolukCekirdegi.new()
	soluk.name = "SolukCekirdegi"
	add_child(soluk)
	if not (model is ModelBaglantisi and (model as ModelBaglantisi).yuklendi):
		Geometri.kutu(model, Ayarlar.vektor("isaret_boyut"), Ayarlar.vektor("isaret_konum"), Color(Ayarlar.denge["renk_organ"]), false)
func _unhandled_input(olay: InputEvent) -> void:
	if olay.is_action_pressed("duraklat"):
		Oyun.duraklat_degistir()
		get_viewport().set_input_as_handled()
		return
	if get_tree().paused or can <= 0.0:
		return
	if olay.is_action_pressed("saldir"):
		saldir()
	elif olay.is_action_pressed("kacin"):
		kacin()
	elif olay.is_action_pressed("organ_kullan"):
		organ_kullan()
	elif olay.is_action_pressed("etkilesim"):
		etkiles()
func hareket_vektoru_hesapla(girdi: Vector2) -> Vector3:
	var aci: float = deg_to_rad(Ayarlar.sayi("kamera_yatay"))
	return Vector3(girdi.x, 0.0, girdi.y).limit_length(1.0).rotated(Vector3.UP, aci)

func organ_kullan() -> bool:
	if can <= 0.0:
		return false
	return soluk.kullan() if Oyun.soluk_konumu == Oyun.OYUNCU else yanki.tara()
func _physics_process(delta: float) -> void:
	if get_tree().paused or can <= 0.0 or Oyun.arayuz_acik:
		return
	_tepki_kalan = maxf(0.0, _tepki_kalan - delta)
	if _tepki_kalan <= 0.0:
		Geometri.renk_degistir(model, Color(Ayarlar.denge["renk_oyuncu"]))
	kacin_bekleme = maxf(0.0, kacin_bekleme - delta)
	_kacin_kalan = maxf(0.0, _kacin_kalan - delta)
	_zincir_kalan = maxf(0.0, _zincir_kalan - delta)
	_saldiri_kalan = maxf(0.0, _saldiri_kalan - delta)
	kaciniyor_mu = _kacin_kalan > 0.0
	if _zincir_kalan <= 0.0:
		zincir_adimi = 0
	_hareket = hareket_vektoru_hesapla(Input.get_vector("sol", "sag", "ileri", "geri"))
	if is_instance_valid(kamera):
		var fare: Vector2 = get_viewport().get_mouse_position()
		var nokta: Variant = Plane(Vector3.UP, global_position.y).intersects_ray(kamera.project_ray_origin(fare), kamera.project_ray_normal(fare))
		if nokta is Vector3:
			var hedef: Vector3 = nokta
			hedef.y = global_position.y
			if not hedef.is_equal_approx(global_position):
				look_at(hedef, Vector3.UP)
	velocity = _kacin_yonu * Ayarlar.sayi("kacin_hiz") if kaciniyor_mu else _hareket * Ayarlar.sayi("hiz")
	move_and_slide()
func saldir() -> bool:
	if get_tree().paused or can <= 0.0 or Oyun.arayuz_acik or kaciniyor_mu or _saldiri_kalan > 0.0:
		return false
	var hasarlar: Array[Variant] = Ayarlar.denge["hasarlar"]
	zincir_adimi += 1
	_vurus_sayaci += 1
	var kimlik: String = str(get_instance_id()) + ":" + str(_vurus_sayaci)
	var hasar: float = float(hasarlar[zincir_adimi - 1])
	_saldiri_kalan = Ayarlar.sayi("saldiri_aralik")
	_zincir_kalan = Ayarlar.sayi("zincir_pencere")
	Geometri.ses(self, "ses_saldiri")
	saldirdi.emit(zincir_adimi, kimlik)
	for hedef: Node in get_tree().get_nodes_in_group("hasar_alabilir"):
		if hedef is Node3D and hedef.has_method("hasar_al"):
			var yon: Vector3 = hedef.global_position - global_position
			yon.y = 0.0
			if yon.length() <= Ayarlar.sayi("saldiri_menzil") and -global_basis.z.dot(yon.normalized()) >= Ayarlar.sayi("saldiri_aci"):
				var yukari: Vector3 = Vector3.UP * 1.0
				var sorgu: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(global_position + yukari, hedef.global_position + yukari)
				sorgu.exclude = [get_rid()]
				var sonuc: Dictionary = get_world_3d().direct_space_state.intersect_ray(sorgu)
				if not sonuc.is_empty() and sonuc["collider"] == hedef:
					hedef.call("hasar_al", hasar, kimlik)
	if zincir_adimi >= hasarlar.size():
		zincir_adimi = 0
	return true
func kacin() -> bool:
	if get_tree().paused or can <= 0.0 or Oyun.arayuz_acik or kacin_bekleme > 0.0:
		return false
	_kacin_yonu = _hareket.normalized() if not _hareket.is_zero_approx() else -global_basis.z
	_kacin_kalan = Ayarlar.sayi("kacin_sure")
	kacin_bekleme = Ayarlar.sayi("kacin_bekleme")
	kaciniyor_mu = true
	kacindi.emit()
	return true
func hasar_al(miktar: float) -> void:
	if can <= 0.0 or kaciniyor_mu:
		return
	can = maxf(0.0, can - maxf(miktar, 0.0))
	_tepki_kalan = Ayarlar.sayi("tepki_sure")
	Geometri.renk_degistir(model, Color(Ayarlar.denge["renk_hasar"]))
	Geometri.ses(self, "ses_hasar")
	KameraSarsintisi.sars(kamera)
	move_and_collide(global_basis.z * Ayarlar.sayi("geri_itme"))
	can_degisti.emit(can)
	if can <= 0.0:
		oldu.emit()
		if Oyun.oturum_aktif:
			Olaylar.yaz("olum")

func etkiles() -> bool:
	if get_tree().paused or Oyun.arayuz_acik or can <= 0.0:
		return false
	var en_yakin: EtkilesimNoktasi
	var uzaklik: float = INF
	for dugum: Node in get_tree().get_nodes_in_group("etkilesilebilir"):
		if dugum is EtkilesimNoktasi and dugum.erisilebilir(self):
			var mesafe: float = global_position.distance_squared_to(dugum.global_position)
			if mesafe < uzaklik:
				en_yakin = dugum
				uzaklik = mesafe
	return en_yakin.etkiles(self) if en_yakin != null else false

func durum_verisi() -> Dictionary:
	return {"can": can, "kacin_bekleme": kacin_bekleme, "tarama_bekleme": yanki.bekleme, "soluk_kalan": soluk.kalan, "soluk_bekleme": soluk.bekleme}

func durum_uygula(veri: Dictionary) -> void:
	if veri.is_empty():
		return
	can = float(veri["can"])
	kacin_bekleme = float(veri["kacin_bekleme"])
	yanki.bekleme = float(veri["tarama_bekleme"])
	soluk.kalan = float(veri.get("soluk_kalan", 0.0)) if Oyun.soluk_konumu == Oyun.OYUNCU else 0.0
	soluk.bekleme = float(veri.get("soluk_bekleme", 0.0))
	velocity = Vector3.ZERO
	can_degisti.emit(can)
