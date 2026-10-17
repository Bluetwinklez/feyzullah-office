extends Node

## K1 akışını (Merkez → Avlu → Koridor → Kuyu → Derin Geçit son karşılaşması → Çekirdek → Sis Cebi → Merkez → bitiş)
## gerçek çizimle otomatik oynatır; her karenin gerçek süresini mekân bazında, bellek/çizim sayaçlarını örnekleyerek kaydeder.
const IZLENENLER: Dictionary = {
	"bellek_statik": Performance.MEMORY_STATIC,
	"bellek_statik_tepe": Performance.MEMORY_STATIC_MAX,
	"video_bellek": Performance.RENDER_VIDEO_MEM_USED,
	"cizim_cagrisi": Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME,
	"cizilen_nesne": Performance.RENDER_TOTAL_OBJECTS_IN_FRAME,
	"ilkel": Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME,
	"nesne": Performance.OBJECT_COUNT,
	"dugum": Performance.OBJECT_NODE_COUNT,
	"kaynak": Performance.OBJECT_RESOURCE_COUNT,
	"islem_sn": Performance.TIME_PROCESS,
	"fizik_sn": Performance.TIME_PHYSICS_PROCESS,
}
var _v: Dictionary
var _sureler: Dictionary = {}
var _ornekler: Dictionary = {}
var _sira: Array[String] = []
var _onceki_us: int = 0
var _olcum: bool = false
var _kare: int = 0
var _klasor: String

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_v = Ayarlar.denge["perf_kosu"]
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	Engine.max_fps = 0
	Engine.time_scale = float(_v["hizlandirma"])
	_klasor = "res://build/perf/gecici_" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(_klasor)
	Kayit.kayit_yolu = _klasor + "/kayit.json"
	Olaylar.gunluk_yolu = _klasor + "/olaylar.jsonl"
	call_deferred("_kos")

func _kos() -> void:
	var bot: RefCounted = (load("res://test/asama3.gd") as GDScript).new() as RefCounted
	bot.set("agac", get_tree())
	await get_tree().process_frame
	_olcum = true
	var tamam: bool = await bot.call("_akis", true)
	for i: int in int(_v["bitis_kare"]):
		await get_tree().process_frame
	_olcum = false
	var sonuc: Dictionary = _ozet(tamam)
	var etiket: String = "editor"
	for arguman: String in OS.get_cmdline_user_args():
		if arguman.begins_with("--perf-etiket="):
			etiket = arguman.get_slice("=", 1)
	var hedef: String = "res://build/perf/" + etiket + ".json"
	var dosya: FileAccess = FileAccess.open(hedef, FileAccess.WRITE)
	dosya.store_string(JSON.stringify(sonuc, "  "))
	dosya.close()
	print(JSON.stringify({"perf": hedef, "tamam": tamam, "genel": sonuc["genel"]}))
	for ad: String in DirAccess.get_files_at(_klasor):
		DirAccess.remove_absolute(_klasor.path_join(ad))
	DirAccess.remove_absolute(_klasor)
	get_tree().quit(0 if tamam else 1)

func _process(_delta: float) -> void:
	# Pencere odağı kaybında oyun duraklar; ölçüm akışı sürsün.
	if get_tree().paused:
		Oyun.duraklat_degistir()
	var simdi: int = Time.get_ticks_usec()
	if not _olcum:
		_onceki_us = simdi
		return
	var mekan: String = "bitis" if Oyun.tamamlandi else Oyun.mekan
	if not _sureler.has(mekan):
		_sureler[mekan] = PackedFloat64Array()
		_ornekler[mekan] = []
		_sira.append(mekan)
	if _onceki_us > 0:
		# Paketli diziler değer tipidir; kopyaya ekleyip geri yazılır.
		var sureler: PackedFloat64Array = _sureler[mekan]
		sureler.append(float(simdi - _onceki_us) / 1000.0)
		_sureler[mekan] = sureler
	_onceki_us = simdi
	_kare += 1
	if _kare % int(_v["ornek_aralik"]) == 0:
		var ornek: Dictionary = {}
		for ad: String in IZLENENLER:
			ornek[ad] = Performance.get_monitor(IZLENENLER[ad])
		(_ornekler[mekan] as Array).append(ornek)

func _istatistik(sureler: PackedFloat64Array, ornekler: Array) -> Dictionary:
	var sirali: PackedFloat64Array = sureler.duplicate()
	sirali.sort()
	var toplam: float = 0.0
	for s: float in sirali:
		toplam += s
	var n: int = sirali.size()
	var sonuc: Dictionary = {"kare": n}
	if n > 0:
		sonuc["ort_ms"] = toplam / n
		sonuc["p95_ms"] = sirali[mini(n - 1, int(ceil(n * float(_v["yuzdelik"]))) - 1)]
		sonuc["en_kotu_ms"] = sirali[n - 1]
		sonuc["ort_fps"] = 1000.0 / (toplam / n)
		# Sahne yükleme anları gibi tek seferlik takılmalar.
		var takilma: int = 0
		for s: float in sirali:
			if s > float(_v["takilma_ms"]):
				takilma += 1
		sonuc["takilma"] = takilma
	for ad: String in IZLENENLER:
		var tepe: float = 0.0
		var top: float = 0.0
		for ornek: Dictionary in ornekler:
			tepe = maxf(tepe, float(ornek[ad]))
			top += float(ornek[ad])
		sonuc[ad + "_tepe"] = tepe
		sonuc[ad + "_ort"] = top / ornekler.size() if ornekler.size() > 0 else 0.0
	return sonuc

func _ozet(tamam: bool) -> Dictionary:
	var hepsi: PackedFloat64Array = PackedFloat64Array()
	var tum_ornekler: Array = []
	var mekanlar: Dictionary = {}
	for mekan: String in _sira:
		hepsi.append_array(_sureler[mekan])
		tum_ornekler.append_array(_ornekler[mekan])
		mekanlar[mekan] = _istatistik(_sureler[mekan], _ornekler[mekan])
	var bellek: Dictionary = OS.get_memory_info()
	return {
		"tamam": tamam,
		"genel": _istatistik(hepsi, tum_ornekler),
		"mekanlar": mekanlar,
		"sira": _sira,
		"kosullar": {
			"godot": Engine.get_version_info()["string"],
			"ikili": OS.get_executable_path(),
			"debug": OS.is_debug_build(),
			"surucu": RenderingServer.get_current_rendering_driver_name(),
			"yontem": RenderingServer.get_current_rendering_method(),
			"gpu": RenderingServer.get_video_adapter_name(),
			"gpu_uretici": RenderingServer.get_video_adapter_vendor(),
			"api": RenderingServer.get_video_adapter_api_version(),
			"pencere_modu": DisplayServer.window_get_mode(),
			"pencere": DisplayServer.window_get_size(),
			"viewport": get_viewport().get_visible_rect().size,
			"ekran": DisplayServer.screen_get_size(),
			"vsync": DisplayServer.window_get_vsync_mode(),
			"time_scale": Engine.time_scale,
			"cpu": OS.get_processor_name(),
			"cpu_cekirdek": OS.get_processor_count(),
			"ram_fiziksel": bellek.get("physical", -1),
			"ram_kullanilabilir": bellek.get("available", -1),
			"os": OS.get_name() + " " + OS.get_version(),
		},
	}
