extends RefCounted

var agac: SceneTree
var sonuclar: Array[Dictionary] = []
var mekanlar: Array[String] = []
var dusmanlari_durdur: bool = false
var m0: Dictionary
var m2: Dictionary
var m3: Dictionary
var m4: Dictionary
var m5: Dictionary

func p() -> Oyuncu:
	return Oyun.etkin_oyuncu()

func ayar(anahtar: String) -> float:
	return float(Ayarlar.denge["test_asama3"][anahtar])

func kontrol(deger: bool, ayrinti: String) -> bool:
	if not deger:
		print(JSON.stringify({"kabul_detay": ayrinti, "mekan": Oyun.mekan, "gorev": int(Oyun.gorev.durum)}))
	return deger

func kare() -> void:
	await agac.physics_frame
	await agac.process_frame
	if dusmanlari_durdur:
		for n: Node in agac.get_nodes_in_group("hasar_alabilir"):
			if n is CharacterBody3D:
				n.set_physics_process(false)

func birak() -> void:
	for eylem: String in ["ileri", "geri", "sol", "sag"]:
		Input.action_release(eylem)

func hareket(yon: Vector3) -> void:
	var girdi: Vector3 = yon.rotated(Vector3.UP, -deg_to_rad(Ayarlar.sayi("kamera_yatay")))
	Input.action_press("sag", maxf(girdi.x, 0.0))
	Input.action_press("sol", maxf(-girdi.x, 0.0))
	Input.action_press("geri", maxf(girdi.z, 0.0))
	Input.action_press("ileri", maxf(-girdi.z, 0.0))

func yuru(hedef: Vector3, yakinlik: float) -> bool:
	var zaman: float = 0.0
	p().kamera = null
	while p().global_position.distance_to(hedef) > yakinlik and zaman < ayar("yurume_zaman_asimi"):
		if p().can <= 0.0:
			birak()
			return false
		hareket((hedef - p().global_position).normalized())
		await kare()
		zaman += p().get_physics_process_delta_time()
	birak()
	return kontrol(p().global_position.distance_to(hedef) <= yakinlik, "yuru:" + str(hedef))

func yaklas(nokta: Node3D) -> bool:
	var mesafe: float = float(Ayarlar.denge["asama2"]["etkilesim_menzil"]) * ayar("etkilesim_oran")
	if Oyun.mekan in ["koridor", "derin_gecit"]:
		var yan: float = ayar("koridor_yan_x" if Oyun.mekan == "koridor" else "derin_yan_x")
		if not await yuru(Vector3(yan, 0.0, p().position.z), mesafe):
			return false
		if not await yuru(Vector3(yan, 0.0, nokta.position.z), mesafe):
			return false
	return await yuru(nokta.global_position, mesafe)

func nokta(ad: String) -> EtkilesimNoktasi:
	for n: Node in agac.get_nodes_in_group("etkilesilebilir"):
		if n is EtkilesimNoktasi and n.name == ad:
			return n as EtkilesimNoktasi
	return null

func etkiles(ad: String) -> bool:
	var n: EtkilesimNoktasi = nokta(ad)
	if n == null or not await yaklas(n):
		return kontrol(false, "etkiles:" + ad)
	return kontrol(n.etkiles(p()), "etkiles:" + ad)

func kapi(ad: String, hedef: String) -> bool:
	if not await etkiles(ad):
		return false
	await agac.scene_changed
	mekanlar.append(Oyun.mekan)
	p().kamera = null
	await kare()
	return kontrol(Oyun.mekan == hedef, "kapi:" + ad)

func savas() -> bool:
	var zaman: float = 0.0
	p().kamera = null
	while zaman < ayar("savas_zaman_asimi"):
		var yakin: CharacterBody3D
		var mesafe: float = INF
		for n: Node in agac.get_nodes_in_group("hasar_alabilir"):
			if n is CharacterBody3D and float(n.get("can")) > 0.0:
				var uzaklik: float = p().global_position.distance_to(n.global_position)
				if uzaklik < mesafe:
					yakin = n
					mesafe = uzaklik
		if yakin == null:
			birak()
			return true
		if p().can <= 0.0:
			return false
		if p().can <= Ayarlar.sayi("oyuncu_can") * ayar("iyilesme_oran"):
			Oyun.iyiles()
		var fark: Vector3 = yakin.global_position - p().global_position
		if not fark.is_zero_approx():
			p().look_at(yakin.global_position, Vector3.UP)
		if mesafe > Ayarlar.sayi("saldiri_menzil") * ayar("savas_yakinlik_oran"):
			hareket(fark.normalized())
		else:
			birak()
			p().saldir()
		await kare()
		zaman += p().get_physics_process_delta_time()
	birak()
	return kontrol(false, "savas_zaman_asimi")

func bag(organ: String, hedef: String) -> bool:
	if not await yaklas(nokta("BagDuzenegi")):
		return false
	return kontrol(Oyun.organ_aktar(organ, hedef, true), "bag:" + organ + hedef)

func yaz(veri: Dictionary) -> void:
	var dosya: FileAccess = FileAccess.open(Kayit.kayit_yolu, FileAccess.WRITE)
	dosya.store_string(JSON.stringify(veri, "", true, true))
	dosya.close()

func yukle(veri: Dictionary) -> bool:
	birak()
	agac.paused = false
	yaz(veri)
	Oyun.yeni_oyun() # Her kombinasyon ayrı oturumdan yüklenir; RAM bayrakları testi maskelemez.
	if not Kayit.yukle():
		return kontrol(false, "fixture_yukle")
	await agac.scene_changed
	await kare()
	return true
