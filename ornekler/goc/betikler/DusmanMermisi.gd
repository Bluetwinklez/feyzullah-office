class_name DusmanMermisi
extends Node3D

var kaynak: WeakRef
var yon: Vector3 = Vector3.FORWARD
var veri: Dictionary
var _omur: float

func _ready() -> void:
	_omur = float(veri["mermi_omur"])
	var mesh: MeshInstance3D = MeshInstance3D.new()
	var kure: SphereMesh = SphereMesh.new()
	kure.radius = float(veri["mermi_yaricap"])
	kure.height = kure.radius * 2.0
	mesh.mesh = kure
	var malzeme: StandardMaterial3D = StandardMaterial3D.new()
	malzeme.albedo_color = Color(Ayarlar.denge["renk_hazirlik"])
	malzeme.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mesh.material_override = malzeme
	add_child(mesh)

func _physics_process(delta: float) -> void:
	var atan: YeniDusman = kaynak.get_ref() as YeniDusman if kaynak != null else null
	_omur -= delta
	if atan == null or atan.oldu_mu or _omur <= 0.0:
		queue_free()
		return
	var sonraki: Vector3 = global_position + yon * float(veri["mermi_hiz"]) * delta
	# Hacim taraması hem hızlı karelerde tünellemeyi hem görsel yarıçap uyumsuzluğunu önler.
	var sekil: SphereShape3D = SphereShape3D.new()
	sekil.radius = float(veri["mermi_yaricap"])
	var sorgu: PhysicsShapeQueryParameters3D = PhysicsShapeQueryParameters3D.new()
	sorgu.shape = sekil
	sorgu.transform = Transform3D(Basis.IDENTITY, global_position)
	sorgu.motion = sonraki - global_position
	sorgu.exclude = [atan.get_rid()]
	var uzay: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var oranlar: PackedFloat32Array = uzay.cast_motion(sorgu)
	if oranlar[0] < 1.0:
		sorgu.transform.origin = global_position.lerp(sonraki, oranlar[1])
		sorgu.motion = Vector3.ZERO
		var temaslar: Array[Dictionary] = uzay.intersect_shape(sorgu)
		for temas: Dictionary in temaslar:
			if temas["collider"] is Oyuncu:
				(temas["collider"] as Oyuncu).hasar_al(float(veri["hasar"]))
				break
		queue_free()
		return
	global_position = sonraki
