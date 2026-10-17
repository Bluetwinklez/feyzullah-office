extends RefCounted

## Kaynak yüklemesini ve sahnedeki gerçek GLB/ses/ikon bağlantılarını sınar.
var _sonuclar: Array[Dictionary] = []
var _yer_tutucular: Array[String] = []
var _denge: Dictionary

func _sayi(anahtar: String) -> float:
	return float(_denge[anahtar])

func _kaydet(anahtar: String, yol: String, gecti: bool) -> void:
	var asama: int = 1
	for kimlik: String in ["agir", "puskurtucu", "soluk_cekirdegi", "nefes_kesesi"]:
		var veri: Dictionary = _denge["modeller"].get(kimlik, {})
		if yol == veri.get("yol", "") or yol == veri.get("sahne", ""):
			asama = 3
	if yol == _denge["ses_dosyalari"].get("ses_sis_kalkani", ""):
		asama = 3
	_sonuclar.append({"ad": TranslationServer.translate(anahtar) % yol, "gecti": gecti, "asama": asama})

func _yukle(yol: String) -> void:
	if yol in _yer_tutucular:
		return
	var kaynak: Resource = load(yol) if ResourceLoader.exists(yol) else null
	var uygun: bool = kaynak != null
	if yol.ends_with(".glb"):
		uygun = kaynak is PackedScene
	elif yol.ends_with(".mp3"):
		uygun = kaynak is AudioStreamMP3
	elif yol.ends_with(".png"):
		uygun = kaynak is Texture2D
	_kaydet("test.varlik_yukle", yol, uygun)

func _mesh_kutulari(dugum: Node, kutular: Array[AABB]) -> void:
	if dugum is MeshInstance3D:
		var mesh: MeshInstance3D = dugum as MeshInstance3D
		kutular.append(mesh.global_transform * mesh.get_aabb())
	for cocuk: Node in dugum.get_children():
		_mesh_kutulari(cocuk, kutular)

func _model_sahnesi(agac: SceneTree, veri: Dictionary) -> void:
	var kaynak: PackedScene = load(veri["sahne"]) as PackedScene
	if kaynak == null:
		_kaydet("test.varlik_sahne", veri["sahne"], false)
		return
	var sahne: Node3D = kaynak.instantiate() as Node3D
	agac.root.add_child(sahne)
	var model: ModelBaglantisi = sahne.get_node_or_null("Model") as ModelBaglantisi
	var bagli: bool = model != null and model.yuklendi and model.glb != null
	if bagli:
		bagli = model.glb.scene_file_path == veri["yol"] and model.get_child_count() == 1
		# Bağlayıcının önbelleğini değil, gerçek sahnedeki dünya geometrisini ölç.
		var kutular: Array[AABB] = []
		_mesh_kutulari(model.glb, kutular)
		if kutular.is_empty():
			bagli = false
		else:
			var gercek: AABB = kutular.front()
			for kutu: AABB in kutular:
				gercek = gercek.merge(kutu)
			bagli = bagli and absf(gercek.size.y - float(veri["boy"])) <= _sayi("test_tolerans")
			if bool(veri["tabana_hizala"]):
				bagli = bagli and absf(gercek.position.y - sahne.global_position.y) <= _sayi("test_tolerans")
			else:
				bagli = bagli and absf(gercek.get_center().y - model.global_position.y) <= _sayi("test_tolerans")
		bagli = bagli and absf(model.glb.rotation.y - deg_to_rad(float(veri["donus_y"]))) <= _sayi("test_tolerans")
	if not str(veri["yol"]) in _yer_tutucular:
		_kaydet("test.varlik_sahne", veri["sahne"], bagli)
	sahne.queue_free()
	await agac.process_frame

func _ses_var(kok: Node, yol: String) -> bool:
	for cocuk: Node in kok.get_children():
		if cocuk is AudioStreamPlayer3D:
			var oynatici: AudioStreamPlayer3D = cocuk as AudioStreamPlayer3D
			if oynatici.stream != null and oynatici.stream.resource_path == yol and oynatici.playing:
				return true
	return yol in _yer_tutucular

func _olay_baglantilari(agac: SceneTree) -> void:
	var sahne: Node3D = (load("res://sahneler/bolge.tscn") as PackedScene).instantiate() as Node3D
	agac.root.add_child(sahne)
	await agac.physics_frame
	await agac.process_frame
	var p: Oyuncu = sahne.get_node("Oyuncu") as Oyuncu
	var e: Avci = sahne.get_node("Avci") as Avci
	var duvar: KirilganDuvar = sahne.get_node("KirilganDuvar") as KirilganDuvar
	var sesler: Dictionary = _denge["ses_dosyalari"]
	var ikon: TextureRect = sahne.get_node("HUD").find_child("YankiIkon", true, false) as TextureRect
	if not str(_denge["yanki_ikon"]) in _yer_tutucular:
		_kaydet("test.varlik_hud", _denge["yanki_ikon"], ikon != null and ikon.texture != null and ikon.texture.resource_path == _denge["yanki_ikon"])
	var saldiri: bool = p.saldir() and _ses_var(p, sesler["ses_saldiri"])
	p.hasar_al(_sayi("avci_hasar"))
	e.hasar_al(_sayi("avci_hasar"), "test.varlik_hasar")
	var hasar: bool = _ses_var(p, sesler["ses_hasar"]) and _ses_var(e, sesler["ses_hasar"])
	var tarama: bool = p.yanki.tara() and _ses_var(p.yanki, sesler["ses_tarama"])
	duvar.hasar_al(_sayi("duvar_can"), "test.varlik_kestirme")
	var etkilesim: bool = duvar.yikildi_mi() and _ses_var(duvar, sesler["ses_etkilesim"])
	_kaydet("test.varlik_ses", "res://sahneler/bolge.tscn", saldiri and hasar and tarama and etkilesim)
	sahne.queue_free()
	await agac.process_frame

func calistir(agac: SceneTree, denge: Dictionary) -> Array[Dictionary]:
	_denge = denge
	_yer_tutucular.assign(_denge["yer_tutucu_varliklar"])
	var modeller: Dictionary = _denge["modeller"]
	for kimlik: String in modeller:
		_yukle(modeller[kimlik]["yol"])
	_yukle(_denge["yanki_ikon"])
	for anahtar: String in _denge["ses_dosyalari"]:
		_yukle(_denge["ses_dosyalari"][anahtar])
	for kimlik: String in modeller:
		await _model_sahnesi(agac, modeller[kimlik])
	await _olay_baglantilari(agac)
	print(TranslationServer.translate("test.yer_tutucu") % (", ".join(_yer_tutucular) if not _yer_tutucular.is_empty() else TranslationServer.translate("test.yok")))
	return _sonuclar
