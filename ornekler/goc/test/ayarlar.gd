extends RefCounted

## AŞAMA 4 (1) ayarlar denemeleri. Gerçek user://ayarlar.cfg yerine geçici proje içi yol kullanılır ve silinir.
const GERCEK_YOL: String = "user://ayarlar.cfg"
const TEMA: Theme = preload("res://arayuz/tema.tres")
var agac: SceneTree
var sonuclar: Array[Dictionary] = []
var _klasor: String

func calistir(hedef_agac: SceneTree) -> Array[Dictionary]:
	agac = hedef_agac
	var eski_yol: String = Ayarlar.ayar_yolu
	var gercek_var: bool = FileAccess.file_exists(GERCEK_YOL)
	var gercek_zaman: int = FileAccess.get_modified_time(GERCEK_YOL) if gercek_var else 0
	_klasor = "res://build/test_ayarlar/" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(_klasor)
	Ayarlar.ayar_yolu = _klasor.path_join("ayarlar.cfg")
	_ekle("test.ayar_kayit", _kayit())
	_ekle("test.ayar_eksik_dosya", _eksik_dosya())
	_ekle("test.ayar_bozuk", _bozuk())
	_ekle("test.ayar_eksik_anahtar", _eksik_anahtar())
	_ekle("test.ayar_uygula", _uygula())
	_ekle("test.ayar_sarsinti", await _sarsinti())
	_ekle("test.ayar_ekran", await _ekran())
	for ad: String in DirAccess.get_files_at(_klasor):
		DirAccess.remove_absolute(_klasor.path_join(ad))
	DirAccess.remove_absolute(_klasor)
	Ayarlar.ayar_yolu = eski_yol
	Ayarlar.yukle()
	Ayarlar.uygula()
	var dokunulmadi: bool = FileAccess.file_exists(GERCEK_YOL) == gercek_var
	if gercek_var:
		dokunulmadi = dokunulmadi and FileAccess.get_modified_time(GERCEK_YOL) == gercek_zaman
	_ekle("test.ayar_gercek_dosya", dokunulmadi and not DirAccess.dir_exists_absolute(_klasor))
	return sonuclar

func _ekle(ad: String, gecti: bool) -> void:
	sonuclar.append({"ad": ad, "gecti": gecti})
	print(JSON.stringify({"kabul": ad, "gecti": gecti}))

func _kontrol(kosul: bool, ayrinti: String) -> bool:
	if not kosul:
		print(JSON.stringify({"kabul_detay": ayrinti}))
	return kosul

func _varsayilan_mi() -> bool:
	var v: Dictionary = Ayarlar.denge["ayarlar"]
	return is_equal_approx(Ayarlar.ses_duzeyi, float(v["ses_duzeyi"])) and Ayarlar.sarsinti == bool(v["sarsinti"]) \
		and Ayarlar.tam_ekran == bool(v["tam_ekran"]) and Ayarlar.cozunurluk == Vector2i(int(v["cozunurluk"][0]), int(v["cozunurluk"][1]))

## Varsayılandan farklı, geçerli bir değer kümesi yazar.
func _farkli_degerler() -> void:
	var liste: Array[Vector2i] = Ayarlar.cozunurlukler()
	Ayarlar.varsayilanlar()
	Ayarlar.ses_duzeyi = Ayarlar.ses_duzeyi * 0.5 if Ayarlar.ses_duzeyi > 0.0 else 1.0
	Ayarlar.sarsinti = not Ayarlar.sarsinti
	Ayarlar.tam_ekran = not Ayarlar.tam_ekran
	Ayarlar.cozunurluk = liste[(liste.find(Ayarlar.cozunurluk) + 1) % liste.size()]

func _kayit() -> bool:
	_farkli_degerler()
	var beklenen: Array[Variant] = [Ayarlar.ses_duzeyi, Ayarlar.sarsinti, Ayarlar.tam_ekran, Ayarlar.cozunurluk]
	if not _kontrol(Ayarlar.kaydet() == OK and FileAccess.file_exists(Ayarlar.ayar_yolu), "kaydet"):
		return false
	Ayarlar.varsayilanlar()
	var okundu: bool = Ayarlar.yukle()
	var simdi: Array[Variant] = [Ayarlar.ses_duzeyi, Ayarlar.sarsinti, Ayarlar.tam_ekran, Ayarlar.cozunurluk]
	return _kontrol(okundu and simdi == beklenen and not _varsayilan_mi(), "kaydet_yukle")

func _eksik_dosya() -> bool:
	DirAccess.remove_absolute(Ayarlar.ayar_yolu)
	_farkli_degerler()
	return _kontrol(not Ayarlar.yukle() and _varsayilan_mi(), "eksik_dosya")

func _bozuk() -> bool:
	var gecti: bool = true
	for icerik: String in ["[ayarlar\nses_duzeyi = = ((", "\u0001çöp\u0002", "[ayarlar]\nses_duzeyi = Vector2i(", ""]:
		var dosya: FileAccess = FileAccess.open(Ayarlar.ayar_yolu, FileAccess.WRITE)
		dosya.store_string(icerik)
		dosya.close()
		_farkli_degerler()
		Ayarlar.yukle()
		gecti = _kontrol(_varsayilan_mi(), "bozuk:" + icerik.c_escape()) and gecti
	return gecti

func _eksik_anahtar() -> bool:
	var v: Dictionary = Ayarlar.denge["ayarlar"]
	var ses: float = float(v["ses_duzeyi"]) * 0.5
	var dosya: ConfigFile = ConfigFile.new()
	dosya.set_value("ayarlar", "ses_duzeyi", ses)
	dosya.set_value("ayarlar", "sarsinti", "evet")
	dosya.set_value("ayarlar", "cozunurluk", Vector2i(-1, -1))
	dosya.save(Ayarlar.ayar_yolu)
	_farkli_degerler()
	var okundu: bool = Ayarlar.yukle()
	var dogru: bool = okundu and is_equal_approx(Ayarlar.ses_duzeyi, ses) and Ayarlar.sarsinti == bool(v["sarsinti"]) \
		and Ayarlar.tam_ekran == bool(v["tam_ekran"]) and Ayarlar.cozunurluk == Vector2i(int(v["cozunurluk"][0]), int(v["cozunurluk"][1]))
	var bos: ConfigFile = ConfigFile.new()
	bos.set_value("baska", "anahtar", 1)
	bos.save(Ayarlar.ayar_yolu)
	_farkli_degerler()
	return _kontrol(dogru and Ayarlar.yukle() and _varsayilan_mi(), "eksik_anahtar")

func _uygula() -> bool:
	var bus: int = AudioServer.get_bus_index("Master")
	var basiz: bool = DisplayServer.get_name() == "headless"
	var gecti: bool = true
	_farkli_degerler()
	Ayarlar.ses_duzeyi = 0.5
	Ayarlar.tam_ekran = true
	Ayarlar.uygula()
	gecti = _kontrol(is_equal_approx(AudioServer.get_bus_volume_db(bus), linear_to_db(0.5)) and not AudioServer.is_bus_mute(bus), "ses_db") and gecti
	gecti = _kontrol(Ayarlar.istenen_pencere_modu == DisplayServer.WINDOW_MODE_FULLSCREEN, "istenen_tam") and gecti
	if not basiz:
		gecti = _kontrol(DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN, "pencere_tam") and gecti
	Ayarlar.ses_duzeyi = 0.0
	Ayarlar.tam_ekran = false
	Ayarlar.cozunurluk = Ayarlar.cozunurlukler().back()
	Ayarlar.uygula()
	gecti = _kontrol(AudioServer.is_bus_mute(bus), "ses_sessiz") and gecti
	gecti = _kontrol(Ayarlar.istenen_pencere_modu == DisplayServer.WINDOW_MODE_WINDOWED and Ayarlar.istenen_boyut == Ayarlar.cozunurluk, "istenen_pencere") and gecti
	if basiz:
		print(JSON.stringify({"not": TranslationServer.translate("test.ayar_basiz_not")}))
	else:
		gecti = _kontrol(DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_WINDOWED and DisplayServer.window_get_size() == Ayarlar.cozunurluk, "pencere_boyut") and gecti
	return gecti

func _sarsinti() -> bool:
	var kamera: Camera3D = Camera3D.new()
	agac.root.add_child(kamera)
	var kare: int = int(Ayarlar.ayar_sayi("test_sarsinti_kare"))
	Ayarlar.sarsinti = false
	var kapali_basladi: bool = KameraSarsintisi.sars(kamera)
	var kapali_degisti: bool = false
	for i: int in kare:
		await agac.process_frame
		kapali_degisti = kapali_degisti or kamera.h_offset != 0.0 or kamera.v_offset != 0.0
	var gecti: bool = _kontrol(not kapali_basladi and not kapali_degisti and kamera.get_child_count() == 0, "kapali")
	Ayarlar.sarsinti = true
	var acik_basladi: bool = KameraSarsintisi.sars(kamera)
	var acik_degisti: bool = false
	for i: int in kare:
		await agac.process_frame
		acik_degisti = acik_degisti or kamera.h_offset != 0.0 or kamera.v_offset != 0.0
	gecti = _kontrol(acik_basladi and acik_degisti, "acik") and gecti
	# Sarsıntı sürerken kapatılırsa ofset hemen sıfırlanır.
	Ayarlar.sarsinti = false
	await agac.process_frame
	gecti = _kontrol(kamera.h_offset == 0.0 and kamera.v_offset == 0.0, "yarida_kapali") and gecti
	kamera.queue_free()
	# Tek giriş noktası: kamera ofsetini yalnız KameraSarsintisi yazar.
	for ad: String in DirAccess.get_files_at("res://betikler"):
		if ad.get_extension() != "gd" or ad == "KameraSarsintisi.gd":
			continue
		var kaynak: String = FileAccess.get_file_as_string("res://betikler".path_join(ad))
		gecti = _kontrol(not ("h_offset" in kaynak or "v_offset" in kaynak), "tek_nokta:" + ad) and gecti
	return gecti

func _ekran() -> bool:
	var hud: CanvasLayer = (load("res://betikler/Hud.gd") as GDScript).new() as CanvasLayer
	agac.root.add_child(hud)
	await agac.process_frame
	Olaylar.duraklatma_degisti.emit(true)
	await agac.process_frame
	var menu: Control = hud.get("_menu") as Control
	var devam: Button = menu.find_child("Devam", true, false) as Button
	var dugme: Button = menu.find_child("AyarlarDugmesi", true, false) as Button
	var ekran: AyarlarEkrani = hud.get("ayarlar_ekrani") as AyarlarEkrani
	var gecti: bool = _kontrol(menu.visible and not ekran.visible and agac.root.gui_get_focus_owner() == devam, "menu_odak")
	dugme.pressed.emit()
	await agac.process_frame
	gecti = _kontrol(ekran.visible and not menu.visible and agac.root.gui_get_focus_owner() == ekran.ses, "ekran_acik") and gecti
	gecti = _kontrol(_tema_uygun(ekran), "tema") and gecti
	var sarsinti: bool = Ayarlar.sarsinti
	ekran.sarsinti.button_pressed = not sarsinti
	var kayitli: ConfigFile = ConfigFile.new()
	gecti = _kontrol(Ayarlar.sarsinti != sarsinti and kayitli.load(Ayarlar.ayar_yolu) == OK and kayitli.get_value("ayarlar", "sarsinti") == Ayarlar.sarsinti, "degisiklik_kaydi") and gecti
	var kacis: InputEventAction = InputEventAction.new()
	kacis.action = &"duraklat"
	kacis.pressed = true
	agac.root.push_input(kacis)
	await agac.process_frame
	gecti = _kontrol(not ekran.visible and menu.visible and agac.root.gui_get_focus_owner() == dugme and not agac.paused, "escape_donus") and gecti
	Olaylar.duraklatma_degisti.emit(false)
	hud.queue_free()
	await agac.process_frame
	return gecti

## Gövde yazısı ≥22 px, yerel stil geçersiz kılması yok, odak ortak temanın amber kutusu.
func _tema_uygun(ekran: AyarlarEkrani) -> bool:
	var odak: StyleBox = TEMA.get_stylebox("focus", "Button")
	var gecti: bool = ekran.ses.get_theme_stylebox("grabber_area_highlight") == TEMA.get_stylebox("grabber_area_highlight", "HSlider")
	for dugum: Node in ekran.find_children("*", "Control", true, false):
		var kontrol: Control = dugum as Control
		if kontrol.has_theme_font_size_override("font_size") or kontrol.has_theme_color_override("font_color") or kontrol.has_theme_stylebox_override("focus"):
			return _kontrol(false, "yerel_stil:" + kontrol.name)
		if kontrol is Label:
			gecti = _kontrol(kontrol.get_theme_font_size("font_size") >= int(Ayarlar.ayar_sayi("test_govde_px")), "yazi:" + kontrol.name) and gecti
		if kontrol is Button:
			gecti = _kontrol(kontrol.get_theme_stylebox("focus") == odak and kontrol.focus_mode == Control.FOCUS_ALL, "odak:" + kontrol.name) and gecti
	return gecti and ekran.ses.focus_mode == Control.FOCUS_ALL
