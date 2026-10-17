class_name ModelBaglantisi
extends Node3D

## Model bağlantısının görsel sorumluluğu; fizik şekillerini değiştirmez.
@export var kimlik: String
var yuklendi: bool = false
var ham_aabb: AABB
var olcek: float
var glb: Node3D
var _ilk_mesh: bool = true
var _meshler: Array[MeshInstance3D] = []
var _temel_renkler: Array[Color] = []

func _ready() -> void:
	var veri: Dictionary = Ayarlar.denge["modeller"][kimlik]
	var yol: String = veri["yol"]
	if not ResourceLoader.exists(yol):
		return
	var sahne: PackedScene = load(yol) as PackedScene
	if sahne == null:
		return
	glb = sahne.instantiate() as Node3D
	if glb == null:
		return
	glb.name = "GLB"
	add_child(glb)
	_aabb_topla(glb, Transform3D.IDENTITY)
	if _ilk_mesh or ham_aabb.size.y <= 0.0:
		remove_child(glb)
		glb.queue_free()
		glb = null
		return
	olcek = float(veri["boy"]) / ham_aabb.size.y
	glb.scale *= olcek
	glb.rotation.y += deg_to_rad(float(veri["donus_y"]))
	if bool(veri["tabana_hizala"]):
		glb.position.y -= ham_aabb.position.y * olcek
	yuklendi = true

func _aabb_topla(dugum: Node3D, ust: Transform3D) -> void:
	var donusum: Transform3D = ust * dugum.transform
	if dugum is MeshInstance3D:
		var mesh: MeshInstance3D = dugum as MeshInstance3D
		var kutu: AABB = donusum * mesh.get_aabb()
		ham_aabb = kutu if _ilk_mesh else ham_aabb.merge(kutu)
		_ilk_mesh = false
		# Kopya malzeme, paylaşılan GLB kaynağını ve dokusunu korur.
		var temel: StandardMaterial3D = mesh.get_active_material(0) as StandardMaterial3D
		if temel != null:
			mesh.material_override = temel.duplicate() as StandardMaterial3D
			_meshler.append(mesh)
			_temel_renkler.append(temel.albedo_color)
	for cocuk: Node in dugum.get_children():
		if cocuk is Node3D:
			_aabb_topla(cocuk as Node3D, donusum)

func renk_uygula(renk: Color) -> void:
	var veri: Dictionary = Ayarlar.denge["modeller"][kimlik]
	var carpan: Color = Color.WHITE if renk == Color(Ayarlar.denge[veri["temel_renk"]]) else renk
	for i: int in range(_meshler.size()):
		var malzeme: StandardMaterial3D = _meshler[i].material_override as StandardMaterial3D
		malzeme.albedo_color = _temel_renkler[i] * carpan
