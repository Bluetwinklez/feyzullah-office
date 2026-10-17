class_name Geometri
extends RefCounted

const PCM_ORNEK_BAYT: int = 2
const PCM_S16_TEPE: int = 32767

static func kutu(ebeveyn: Node3D, boyut: Vector3, konum: Vector3, renk: Color, fizik: bool) -> MeshInstance3D:
	var kok: Node3D = StaticBody3D.new() if fizik else Node3D.new()
	ebeveyn.add_child(kok)
	kok.position = konum
	var mesh: MeshInstance3D = MeshInstance3D.new()
	var kutu_mesh: BoxMesh = BoxMesh.new()
	kutu_mesh.size = boyut
	mesh.mesh = kutu_mesh
	var malzeme: StandardMaterial3D = StandardMaterial3D.new()
	malzeme.albedo_color = renk
	mesh.material_override = malzeme
	kok.add_child(mesh)
	if fizik:
		var carpisma: CollisionShape3D = CollisionShape3D.new()
		var sekil: BoxShape3D = BoxShape3D.new()
		sekil.size = boyut
		carpisma.shape = sekil
		kok.add_child(carpisma)
	return mesh
static func govde(kok: CharacterBody3D, model: Node3D, renk: Color, kapsul: bool = false) -> void:
	var sekil: CapsuleShape3D = CapsuleShape3D.new()
	sekil.height = Ayarlar.sayi("govde_boy")
	sekil.radius = Ayarlar.sayi("govde_yaricap")
	var carpisma: CollisionShape3D = CollisionShape3D.new()
	carpisma.shape = sekil
	carpisma.position.y = sekil.height / 2.0
	kok.add_child(carpisma)
	if model is ModelBaglantisi and (model as ModelBaglantisi).yuklendi:
		return
	if kapsul:
		var mesh: MeshInstance3D = MeshInstance3D.new()
		var kapsul_mesh: CapsuleMesh = CapsuleMesh.new()
		kapsul_mesh.height = sekil.height
		kapsul_mesh.radius = sekil.radius
		mesh.mesh = kapsul_mesh
		mesh.position = carpisma.position
		var malzeme: StandardMaterial3D = StandardMaterial3D.new()
		malzeme.albedo_color = renk
		mesh.material_override = malzeme
		model.add_child(mesh)
	else:
		kutu(model, Vector3(sekil.radius, sekil.height, sekil.radius), carpisma.position, renk, false)

static func ses(kok: Node3D, frekans_anahtari: String) -> void:
	var sesler: Dictionary = Ayarlar.denge["ses_dosyalari"]
	if sesler.has(frekans_anahtari) and ResourceLoader.exists(sesler[frekans_anahtari]):
		var kayit: AudioStream = load(sesler[frekans_anahtari]) as AudioStream
		if kayit != null:
			var ses_oynatici: AudioStreamPlayer3D = AudioStreamPlayer3D.new()
			ses_oynatici.stream = kayit
			ses_oynatici.process_mode = Node.PROCESS_MODE_PAUSABLE
			kok.add_child(ses_oynatici)
			ses_oynatici.finished.connect(ses_oynatici.queue_free, CONNECT_ONE_SHOT)
			ses_oynatici.play()
			return
	var ses_verisi: PackedByteArray = PackedByteArray()
	var ornek_sayisi: int = int(Ayarlar.sayi("ses_ornek_hiz") * Ayarlar.sayi("ses_sure"))
	ses_verisi.resize(ornek_sayisi * PCM_ORNEK_BAYT)
	for i: int in range(ornek_sayisi):
		var zaman: float = float(i) / Ayarlar.sayi("ses_ornek_hiz")
		var genlik: float = sin(zaman * TAU * Ayarlar.sayi(frekans_anahtari)) * Ayarlar.sayi("ses_genlik") * (1.0 - float(i) / float(ornek_sayisi))
		ses_verisi.encode_s16(i * PCM_ORNEK_BAYT, int(genlik * PCM_S16_TEPE))
	var akis: AudioStreamWAV = AudioStreamWAV.new()
	akis.format = AudioStreamWAV.FORMAT_16_BITS
	akis.mix_rate = int(Ayarlar.sayi("ses_ornek_hiz"))
	akis.data = ses_verisi
	var oynatici: AudioStreamPlayer3D = AudioStreamPlayer3D.new()
	oynatici.stream = akis
	kok.add_child(oynatici)
	oynatici.finished.connect(oynatici.queue_free, CONNECT_ONE_SHOT)
	oynatici.play()
static func renk_degistir(kok: Node, renk: Color) -> void:
	if kok is ModelBaglantisi and (kok as ModelBaglantisi).yuklendi:
		(kok as ModelBaglantisi).renk_uygula(renk)
		return
	for dugum: Node in kok.get_children():
		if dugum is MeshInstance3D and dugum.material_override is StandardMaterial3D:
			var malzeme: StandardMaterial3D = dugum.material_override as StandardMaterial3D
			malzeme.albedo_color = renk
		renk_degistir(dugum, renk)
