class_name YankiKesesi
extends Node3D
## Başarılı taramayı bildirir.
signal tarama_yapildi(yaricap: float)
var bekleme: float
@export var sahip: String = "OYUNCU"
@onready var model: Node3D = $Model
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	bekleme = 0.0
	position = Ayarlar.vektor("organ_konum")
	Olaylar.durum_degisti.connect(_guncelle)
	_guncelle()
	if model is ModelBaglantisi and (model as ModelBaglantisi).yuklendi:
		return
	var mesh: MeshInstance3D = MeshInstance3D.new()
	var kure: SphereMesh = SphereMesh.new()
	kure.height = Ayarlar.sayi("organ_boy")
	kure.radius = kure.height / 2.0
	mesh.mesh = kure
	var malzeme: StandardMaterial3D = StandardMaterial3D.new()
	malzeme.albedo_color = Color(Ayarlar.denge["renk_organ"])
	mesh.material_override = malzeme
	model.add_child(mesh)
func _physics_process(delta: float) -> void:
	bekleme = maxf(0.0, bekleme - delta)
func tara() -> bool:
	if get_tree().paused or Oyun.arayuz_acik or sahip != Oyun.OYUNCU or Oyun.kese_konumu != Oyun.OYUNCU or bekleme > 0.0:
		return false
	bekleme = Ayarlar.sayi("tarama_bekleme")
	for nesne: Node in get_tree().get_nodes_in_group("taranabilir"):
		if nesne is Node3D and global_position.distance_to(nesne.global_position) <= Ayarlar.sayi("tarama_yaricap") and nesne.has_method("tara_ile_goster"):
			nesne.call("tara_ile_goster", Ayarlar.sayi("tarama_sure"))
	Geometri.ses(self, "ses_tarama")
	tarama_yapildi.emit(Ayarlar.sayi("tarama_yaricap"))
	if Oyun.oturum_aktif:
		Olaylar.yaz("organ_kullanildi", "yanki")
	return true

func _guncelle() -> void:
	visible = Oyun.kese_konumu == sahip

func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_guncelle):
		Olaylar.durum_degisti.disconnect(_guncelle)
