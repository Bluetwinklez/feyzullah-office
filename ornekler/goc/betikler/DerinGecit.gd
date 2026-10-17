class_name DerinGecit
extends Node3D
var _muhur: StaticBody3D
var _rota: Node3D
var acik: bool:
	get:
		return Oyun.gecit_acik

func _ready() -> void:
	var veri: Dictionary = Ayarlar.denge["asama2"]
	_muhur = StaticBody3D.new()
	_muhur.name = "Muhur"
	add_child(_muhur)
	var mesh: MeshInstance3D = Geometri.kutu(_muhur, Ayarlar.diziden_vektor(veri["muhur_boyut"]), Vector3.UP * float(veri["muhur_y"]), Color(veri["muhur_renk"]), false)
	var carpisma: CollisionShape3D = CollisionShape3D.new()
	var sekil: BoxShape3D = BoxShape3D.new()
	sekil.size = Ayarlar.diziden_vektor(veri["muhur_boyut"])
	carpisma.shape = sekil
	carpisma.position.y = float(veri["muhur_y"])
	_muhur.add_child(carpisma)
	_rota = Node3D.new()
	_rota.name = "RotaIsareti"
	add_child(_rota)
	for konum: Array[Variant] in veri["rota_konumlar"]:
		var iz: MeshInstance3D = Geometri.kutu(_rota, Ayarlar.diziden_vektor(veri["rota_boyut"]), Ayarlar.diziden_vektor(konum), Color(veri["amber"]), false)
		var malzeme: StandardMaterial3D = iz.material_override as StandardMaterial3D
		malzeme.emission_enabled = true
		malzeme.emission = Color(veri["amber"])
		malzeme.emission_energy_multiplier = float(veri["rota_enerji"])
	mesh.set_meta("muhur", true)
	Olaylar.durum_degisti.connect(_guncelle)
	_guncelle()

func _guncelle() -> void:
	_muhur.visible = not acik
	_muhur.collision_layer = 0 if acik else 1
	_muhur.collision_mask = 0 if acik else 1
	_rota.visible = acik

func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_guncelle):
		Olaylar.durum_degisti.disconnect(_guncelle)
