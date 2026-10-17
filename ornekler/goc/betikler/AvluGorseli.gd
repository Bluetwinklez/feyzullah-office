class_name AvluGorseli
extends Node3D

## Yalnız ışık, malzeme ve dekor üretir; fizik veya oynanış durumu tutmaz.
var _veri: Dictionary

func kur(oyuncu: Node3D, zemin: MeshInstance3D, kamera: Camera3D) -> void:
	_veri = Ayarlar.denge["gorsel"]
	_ortam_kur(kamera)
	_fener_kur(oyuncu)
	_zemin_kur(zemin)
	_dekor_kur()

func _ortam_kur(kamera: Camera3D) -> void:
	var veri: Dictionary = _veri["ortam"]
	var ortam: WorldEnvironment = WorldEnvironment.new()
	var cevre: Environment = load("res://sahneler/ortam.tres") as Environment
	cevre.background_mode = Environment.BG_COLOR
	cevre.background_color = Color(veri["arka_plan"])
	cevre.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	cevre.ambient_light_color = Color(veri["isik_renk"])
	cevre.ambient_light_energy = float(veri["isik_enerji"])
	cevre.fog_enabled = true
	cevre.fog_mode = Environment.FOG_MODE_DEPTH
	cevre.fog_light_color = Color(veri["sis_renk"])
	cevre.fog_light_energy = float(veri["sis_enerji"])
	cevre.fog_depth_begin = float(veri["sis_baslangic"])
	cevre.fog_depth_end = float(veri["sis_bitis"])
	if Oyun.soluk_konumu == Oyun.CANLI:
		cevre.fog_depth_end *= float(Ayarlar.denge["asama3"]["ilerleme"]["sis_incelme_carpan"])
	cevre.fog_depth_curve = float(veri["sis_egri"])
	cevre.volumetric_fog_enabled = false
	ortam.environment = cevre
	add_child(ortam)
	var isik: DirectionalLight3D = DirectionalLight3D.new()
	isik.rotation = kamera.rotation
	isik.light_color = Color(veri["yon_isigi_renk"])
	isik.light_energy = float(veri["yon_isigi_enerji"])
	isik.shadow_enabled = false
	add_child(isik)

func _fener_kur(oyuncu: Node3D) -> void:
	var veri: Dictionary = _veri["fener"]
	var fener: OmniLight3D = OmniLight3D.new()
	fener.name = "FenerIsigi"
	fener.position.y = float(veri["yukseklik"])
	fener.light_color = Color(veri["renk"])
	fener.light_energy = float(veri["enerji"])
	fener.omni_range = float(veri["menzil"])
	fener.omni_attenuation = float(veri["azalma"])
	fener.shadow_enabled = false
	oyuncu.add_child(fener)

func _zemin_kur(zemin: MeshInstance3D) -> void:
	var veri: Dictionary = _veri["zemin"]
	var malzeme: ShaderMaterial = ShaderMaterial.new()
	malzeme.shader = load("res://varliklar/shaderlar/tas_karo.gdshader") as Shader
	for anahtar: String in veri:
		var deger: Variant = Color(veri[anahtar]) if anahtar.ends_with("renk") else veri[anahtar]
		malzeme.set_shader_parameter(anahtar, deger)
	zemin.material_override = malzeme

func _vektor(dizi: Array[Variant]) -> Vector3:
	return Vector3(float(dizi.front()), float(dizi[1]), float(dizi.back()))

func _dekor_kur() -> void:
	var yarim_bolen: float = 2.0
	for veri: Dictionary in _veri["dekor"]:
		var boyut: Vector3 = _vektor(veri["boyut"])
		var konum: Vector3 = _vektor(veri["konum"]) + Vector3.UP * boyut.y / yarim_bolen
		var renk: Color = Color(veri["renk"])
		var mesh: MeshInstance3D
		if veri["tur"] == "sutun":
			mesh = MeshInstance3D.new()
			var silindir: CylinderMesh = CylinderMesh.new()
			silindir.height = boyut.y
			silindir.bottom_radius = boyut.x / yarim_bolen
			silindir.top_radius = silindir.bottom_radius * float(_veri["sutun_ust_oran"])
			silindir.radial_segments = int(_veri["sutun_dilim"])
			mesh.mesh = silindir
			var malzeme: StandardMaterial3D = StandardMaterial3D.new()
			malzeme.albedo_color = renk
			mesh.material_override = malzeme
			add_child(mesh)
			mesh.position = konum
		else:
			# Sadece görsel: zemin ve sınırların mevcut fiziğine hiçbir şekil eklenmez.
			mesh = Geometri.kutu(self, boyut, konum, renk, false)
		mesh.rotation_degrees = Vector3(0.0, float(veri["donus_y"]), float(veri["egim_z"]))
