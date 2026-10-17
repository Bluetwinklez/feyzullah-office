class_name MerkezModeli
extends Node3D

## Merkez parçasını gerçek AABB ile ölçekler; yükleme yoksa geometri yedeği kalır.
var yuklendi: bool = false
var ham_aabb: AABB
var olcek: float = 1.0
var donus_y: float = 0.0
var _ilk: bool = true

func kur(kimlik: String) -> void:
	var veri: Dictionary = Ayarlar.denge["asama2"]["modeller"][kimlik]
	var yol: String = veri["yol"]
	if ResourceLoader.exists(yol):
		var kaynak: PackedScene = load(yol) as PackedScene
		if kaynak != null:
			var glb: Node3D = kaynak.instantiate() as Node3D
			if glb != null:
				add_child(glb)
				_topla(glb, Transform3D.IDENTITY)
				if not _ilk and ham_aabb.size.y > 0.0:
					glb.name = "GLB"
					var uzun: bool = bool(veri["uzun_eksen"])
					olcek = float(veri["boy"]) / (maxf(ham_aabb.size.x, ham_aabb.size.z) if uzun else ham_aabb.size.y)
					donus_y = float(veri["donus_y"])
					if bool(veri["eksene_gore_don"]) and ham_aabb.size.x > ham_aabb.size.z:
						donus_y = float(veri["eksen_donus"])
					glb.scale *= olcek
					glb.rotation_degrees.y = donus_y
					glb.position.y = -(ham_aabb.end.y if uzun else ham_aabb.position.y) * olcek
					yuklendi = true
					return
				remove_child(glb)
				glb.queue_free()
	Geometri.kutu(self, Ayarlar.diziden_vektor(veri["yedek_boyut"]), Ayarlar.diziden_vektor(veri["yedek_konum"]), Color(veri["renk"]), false)

func _topla(dugum: Node3D, ust: Transform3D) -> void:
	var donusum: Transform3D = ust * dugum.transform
	if dugum is MeshInstance3D:
		var kutu: AABB = donusum * (dugum as MeshInstance3D).get_aabb()
		ham_aabb = kutu if _ilk else ham_aabb.merge(kutu)
		_ilk = false
	for cocuk: Node in dugum.get_children():
		if cocuk is Node3D:
			_topla(cocuk as Node3D, donusum)
