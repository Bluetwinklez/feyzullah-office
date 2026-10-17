extends RefCounted

## TASARIM §15 kabul (8) başsız kısmı: export ön koşulları, test dosyalarının paketten dışlanması,
## dışa aktarılan paketin editörsüz (--main-pack) başsız açılması. EXE'nin pencereli çalıştırılması ayrı adımdır.
const ON_AYAR: String = "res://export_presets.cfg"
var sonuclar: Array[Dictionary] = []

func calistir(_agac: SceneTree) -> Array[Dictionary]:
	var v: Dictionary = Ayarlar.denge["test_k8"]
	var klasor: String = "res://build/test_k8/" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(klasor)
	var paket: String = ProjectSettings.globalize_path(klasor.path_join(String(v["paket_adi"])))
	var gecti: bool = _kontrol(_on_ayar(v), "on_ayar")
	var cikti: Array = []
	var kod: int = OS.execute(OS.get_executable_path(), ["--headless", "--path", ProjectSettings.globalize_path("res://"), "--export-pack", String(v["on_ayar_adi"]), paket], cikti, true)
	# CI'da export şablonu kurulmaz. Godot paketi şablonsuz üretemezse yalnız bu kısım açıkça atlanır;
	# ön ayar denetimi yine yapılır. Şablon varken (yerel) başarısızlık her zaman testi düşürür.
	var sablon_yok: bool = kod != 0 and String(v["sablon_hatasi"]) in "\n".join(PackedStringArray(cikti)).to_lower()
	if sablon_yok:
		print(JSON.stringify({"not": TranslationServer.translate("test.k8_sablon_yok")}))
	else:
		gecti = _kontrol(kod == 0 and FileAccess.file_exists(paket), "export_pack") and gecti
	if FileAccess.file_exists(paket):
		gecti = _kontrol(_icerik(paket, v), "paket_icerigi") and gecti
		gecti = _kontrol(_ac(paket, v), "main_pack") and gecti
	# Varsa son dışa aktarılan EXE'nin gömülü paketi de editör ikilisiyle başsız açılır.
	var exe: String = ProjectSettings.globalize_path(String(v["exe_yolu"]))
	if FileAccess.file_exists(exe):
		gecti = _kontrol(_ac(exe, v), "exe_main_pack") and gecti
	else:
		print(JSON.stringify({"not": TranslationServer.translate("test.k8_exe_yok")}))
	for ad: String in DirAccess.get_files_at(klasor):
		DirAccess.remove_absolute(klasor.path_join(ad))
	DirAccess.remove_absolute(klasor)
	_ekle("test.k8", gecti and not DirAccess.dir_exists_absolute(klasor))
	return sonuclar

func _ekle(ad: String, gecti: bool) -> void:
	sonuclar.append({"ad": ad, "gecti": gecti})
	print(JSON.stringify({"kabul": ad, "gecti": gecti}))

func _kontrol(kosul: bool, ayrinti: String) -> bool:
	if not kosul:
		print(JSON.stringify({"kabul_detay": ayrinti}))
	return kosul

func _on_ayar(v: Dictionary) -> bool:
	var cfg: ConfigFile = ConfigFile.new()
	if cfg.load(ON_AYAR) != OK:
		return false
	var dislanan: PackedStringArray = String(cfg.get_value("preset.0", "exclude_filter", "")).split(",")
	return cfg.get_value("preset.0", "name", "") == v["on_ayar_adi"] and cfg.get_value("preset.0", "platform", "") == v["on_ayar_adi"] \
		and cfg.get_value("preset.0", "export_path", "") == String(v["exe_yolu"]).trim_prefix("res://") \
		and cfg.get_value("preset.0.options", "binary_format/embed_pck", false) == true \
		and dislanan.has("test/*") and dislanan.has("build/*") and dislanan.has("docs/*")

## Paket test/, build/ ve docs/ dosyası içermez; oyunun veri ve sahneleri vardır.
func _icerik(paket: String, v: Dictionary) -> bool:
	var zip: ZIPReader = ZIPReader.new()
	if zip.open(paket) != OK:
		return false
	var dosyalar: PackedStringArray = zip.get_files()
	zip.close()
	for ad: String in dosyalar:
		if ad.begins_with("test/") or ad.begins_with("build/") or ad.begins_with("docs/"):
			return _kontrol(false, "pakette:" + ad)
	for gerekli: String in v["gerekli_dosyalar"]:
		if not dosyalar.has(gerekli):
			return _kontrol(false, "eksik:" + gerekli)
	return true

func _ac(paket: String, v: Dictionary) -> bool:
	var cikti: Array = []
	var kod: int = OS.execute(OS.get_executable_path(), ["--headless", "--main-pack", paket, "--quit-after", str(int(v["kare"]))], cikti, true)
	var metin: String = "\n".join(PackedStringArray(cikti))
	for yasak: String in v["yasak_gunluk"]:
		if yasak in metin:
			return _kontrol(false, "gunluk:" + yasak)
	return kod == 0
