class_name OrganGorseli
extends Node3D

@export var kimlik: String = "soluk_cekirdegi"

func _ready() -> void:
	var model: ModelBaglantisi = ModelBaglantisi.new()
	model.name = "Model"
	model.kimlik = kimlik
	add_child(model)
	if model.yuklendi:
		return
	var veri: Dictionary = Ayarlar.denge["modeller"][kimlik]
	var mesh: MeshInstance3D = MeshInstance3D.new()
	var kure: SphereMesh = SphereMesh.new()
	kure.height = float(veri["boy"])
	kure.radius = kure.height / 2.0
	mesh.mesh = kure
	var malzeme: StandardMaterial3D = StandardMaterial3D.new()
	malzeme.albedo_color = Color(Ayarlar.denge[veri["temel_renk"]])
	malzeme.emission_enabled = true
	malzeme.emission = malzeme.albedo_color
	mesh.material_override = malzeme
	model.add_child(mesh)
	if bool(veri["tabana_hizala"]):
		mesh.position.y = kure.height / 2.0
