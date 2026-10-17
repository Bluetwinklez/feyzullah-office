extends RefCounted

var _agac: SceneTree
var _sonuclar: Array[Dictionary] = []
var _klasor: String
var _eski_kayit: String
var _eski_gunluk: String
var _kurtarma_sayisi: int = 0

func calistir(agac: SceneTree) -> Array[Dictionary]:
	_agac = agac
	_eski_kayit = Kayit.kayit_yolu
	_eski_gunluk = Olaylar.gunluk_yolu
	_klasor = "res://build/test_asama2/" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(_klasor)
	Kayit.kayit_yolu = _klasor + "/kayit.json"
	Olaylar.gunluk_yolu = _klasor + "/olaylar.jsonl"
	Kayit.kurtarma_gerekli.connect(_kurtarma)
	Oyun.yeni_oyun()
	await _git("merkez")
	_ekle("test.a2_sira", await _yanlis_sira())
	_ekle("test.a2_kestirmesiz", await _kestirmesiz())
	_ekle("test.a2_ekran", _ekran())
	_ekle("test.a2_aktar", await _aktar())
	_ekle("test.a2_canli_donus", await _canli_donus())
	_ekle("test.a2_kalici", await _kalici())
	_ekle("test.a2_kayit", await _kayit())
	_ekle("test.a2_bozuk", await _bozuk("{"))
	var eksik: Dictionary = Oyun.kayit_verisi()
	eksik.erase("organlar")
	_ekle("test.a2_eksik", await _bozuk(JSON.stringify(eksik)))
	_ekle("test.a2_bos", await _bozuk(""))
	_ekle("test.a2_yeni_onay", _yeni_onay())
	_ekle("test.a2_olum", await _olum())
	_ekle("test.a2_gunluk", _gunluk())
	_ekle("test.ui_tema", _ui_tema())
	_ekle("test.ui_modal", await _ui_modal())
	_ekle("test.ui_istem", _ui_istem())
	await _temizle()
	return _sonuclar

func _ekle(ad: String, gecti: bool) -> void:
	_sonuclar.append({"ad": ad, "gecti": gecti})

func _kurtarma(_neden: String) -> void:
	_kurtarma_sayisi += 1

func _oyuncu() -> Oyuncu:
	return _agac.current_scene.get_node("Oyuncu") as Oyuncu

func _sahne() -> Node3D:
	return _agac.current_scene as Node3D

func _imza() -> Array[Variant]:
	return [Oyun.kese_konumu, int(Oyun.gorev.durum), Oyun.gecit_acik, Oyun.kestirme_acik, Oyun.kehribar, Oyun.sise_kapasitesi]

func _bekle() -> void:
	for _kare: int in range(int(Ayarlar.sayi("test_senkron_kare"))):
		await _agac.physics_frame
		await _agac.process_frame

func _git(hedef: String) -> bool:
	if not Oyun.yer_degistir(hedef):
		return false
	await _agac.scene_changed
	_oyuncu().set_physics_process(false)
	var avci: Avci = _sahne().get_node_or_null("Avci") as Avci
	if avci != null:
		avci.set_physics_process(false)
	await _bekle()
	return Oyun.mekan == hedef

func _kapidan_don() -> bool:
	var kapi: EtkilesimNoktasi = _sahne().get_node("Asama2/DonusKapisi") as EtkilesimNoktasi
	_oyuncu().global_position = kapi.global_position
	if not kapi.etkiles(_oyuncu()):
		return false
	await _agac.scene_changed
	_oyuncu().set_physics_process(false)
	await _bekle()
	return Oyun.mekan == "merkez"

func _yanlis_sira() -> bool:
	var once: Array[Variant] = _imza()
	var ret: bool = not Oyun.aktar(Oyun.CANLI, true) and not Oyun.yanki_bul()
	ret = not Oyun.gorev.gecis(&"yanki_baglandi") and ret and _imza() == once
	await _git("bolge")
	ret = not Oyun.yanki_bul() and ret and _imza() == once
	ret = await _kapidan_don() and ret # BULUNMADI ve M0 bile dönüşü kapatmaz.
	ret = Oyun.tasiyiciyi_dinle() and ret
	once = _imza()
	return not Oyun.tasiyiciyi_dinle() and _imza() == once and ret

func _kestirmesiz() -> bool:
	await _git("bolge")
	var avlu_duvar: KirilganDuvar = _sahne().get_node("KirilganDuvar") as KirilganDuvar
	var avlu_kapali: bool = not avlu_duvar.yikildi_mi() and not Oyun.kestirme_acik
	await _git("koridor")
	await _git("kuyu_salonu")
	var p: Oyuncu = _oyuncu()
	var buluntu: EtkilesimNoktasi = _sahne().get_node("KuyuSalonuBuluntusu") as EtkilesimNoktasi
	var kapi: EtkilesimNoktasi = _sahne().get_node("DonusKapisi") as EtkilesimNoktasi
	var duvar: KirilganDuvar = _sahne().get_node("KirilganDuvar") as KirilganDuvar
	var acik_yol: bool = not p.test_move(p.global_transform, buluntu.global_position - p.global_position)
	p.global_position = buluntu.global_position
	var alindi: bool = buluntu.etkiles(p) and Oyun.kese_konumu == Oyun.OYUNCU
	acik_yol = not p.test_move(p.global_transform, kapi.global_position - p.global_position) and acik_yol
	var duvar_kapali: bool = avlu_kapali and not duvar.yikildi_mi() and not Oyun.kestirme_acik
	var soluk_yok: bool = Oyun.kayit_verisi()["organlar"]["soluk"] == Oyun.BULUNMADI
	p.global_position = kapi.global_position
	if not kapi.etkiles(p):
		return false
	await _agac.scene_changed
	_oyuncu().set_physics_process(false)
	await _bekle()
	return Oyun.mekan == "merkez" and acik_yol and alindi and duvar_kapali and soluk_yok

func _ekran() -> bool:
	_oyuncu().position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"])
	var ekran: BagEkrani
	for dugum: Node in _sahne().get_children():
		if dugum is BagEkrani:
			ekran = dugum
	if ekran == null:
		return false
	ekran.ac()
	var metinler: Array[String] = []
	for dugum: Node in ekran.find_children("*", "Label", true, false):
		metinler.append((dugum as Label).text)
	var yanki: String = tr("bag.yanki_oyuncu") % [Ayarlar.sayi("tarama_yaricap"), Ayarlar.sayi("tarama_sure"), Ayarlar.sayi("tarama_bekleme")]
	var soluk: String = tr("bag.soluk_oyuncu") % [Ayarlar.denge["asama2"]["soluk_sure"], Ayarlar.denge["asama2"]["soluk_bekleme"]]
	var bilgi: bool = yanki in metinler and soluk in metinler and not "%" in yanki and not "%" in soluk
	bilgi = tr("bag.yanki_canli") in metinler and tr("bag.sonuc_canli") in metinler and bilgi
	bilgi = (tr("bag.yanki") + " — " + tr("yer.oyuncu")) in metinler and bilgi
	var once: Array[Variant] = _imza()
	for dugum: Node in ekran.find_children("*", "Button", true, false):
		if (dugum as Button).text == tr("bag.aktar"):
			(dugum as Button).pressed.emit()
	var onay: ConfirmationDialog
	for dugum: Node in ekran.get_children():
		if dugum is ConfirmationDialog:
			onay = dugum
	bilgi = onay != null and onay.visible and _imza() == once and bilgi
	if onay != null:
		onay.get_cancel_button().pressed.emit()
	bilgi = _imza() == once and bilgi
	ekran.kapat()
	return bilgi

func _tek_gorsel(dugum: Node) -> int:
	var sayi: int = 1 if dugum is YankiKesesi and dugum.is_visible_in_tree() else 0
	for cocuk: Node in dugum.get_children():
		sayi += _tek_gorsel(cocuk)
	return sayi

func _aktar() -> bool:
	var p: Oyuncu = _oyuncu()
	p.position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"])
	var dogru: bool = true
	for hedef: String in [Oyun.CANLI, Oyun.OYUNCU, Oyun.CANLI]:
		var once: Array[Variant] = _imza()
		dogru = not Oyun.aktar(hedef, false) and _imza() == once and dogru
		dogru = Oyun.aktar(hedef, true) and Oyun.kese_konumu == hedef and dogru
		p.yanki.bekleme = 0.0 # Burada yetki sınanır; bekleme zaten Aşama 1 testindedir.
		var taradi: bool = p.yanki.tara()
		dogru = taradi == (hedef == Oyun.OYUNCU) and _tek_gorsel(_sahne()) == 1 and dogru
		await _bekle()
		var hud: Node = _sahne().get_node("HUD")
		var etiket: Label = hud.get("_tarama") as Label
		var beklenen: String = tr("hud.tarama") % p.yanki.bekleme if hedef == Oyun.OYUNCU else tr("hud.kese_yok") % tr("yer.canli")
		dogru = etiket.text == beklenen and dogru
	return dogru

func _canli_donus() -> bool:
	await _git("bolge")
	var ret: bool = not _oyuncu().yanki.tara()
	return await _kapidan_don() and ret and Oyun.kese_konumu == Oyun.CANLI

func _kalici() -> bool:
	_oyuncu().position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"])
	var geri: bool = Oyun.aktar(Oyun.OYUNCU, true) and Oyun.gecit_acik
	await _git("bolge")
	var gecit: DerinGecit = _sahne().get_node("Asama2/DerinGecit") as DerinGecit
	var muhur: StaticBody3D = gecit.get_node("Muhur") as StaticBody3D
	var rota: Node3D = gecit.get_node("RotaIsareti") as Node3D
	var acik: bool = gecit.acik and muhur.collision_layer == 0 and muhur.collision_mask == 0 and rota.visible
	return await _kapidan_don() and geri and acik

func _kayit() -> bool:
	var once: Array[Variant] = _imza()
	var ilk: bool = Kayit.kaydet() and Kayit.kaydet()
	var veri: Variant = JSON.parse_string(FileAccess.get_file_as_string(Kayit.kayit_yolu))
	var atomik: bool = veri is Dictionary and veri.get("surum") == Kayit.SURUM and FileAccess.file_exists(Kayit.kayit_yolu + ".bak") and not FileAccess.file_exists(Kayit.kayit_yolu + ".tmp")
	Oyun.yeni_oyun() # Bayrağın yalnız RAM'deki eski true sayesinde geçmesini önler.
	if not Kayit.yukle():
		return false
	await _agac.scene_changed
	_oyuncu().set_physics_process(false)
	await _bekle()
	var ayni: bool = _imza() == once and Oyun.gecit_acik
	await _git("bolge")
	var muhur: StaticBody3D = _sahne().get_node("Asama2/DerinGecit/Muhur") as StaticBody3D
	ayni = muhur.collision_layer == 0 and ayni
	await _kapidan_don()
	return ilk and atomik and ayni

func _bozuk(icerik: String) -> bool:
	if not Kayit.kaydet() or not Kayit.kaydet():
		return false
	var once: Array[Variant] = _imza()
	var sayi: int = _kurtarma_sayisi
	var dosya: FileAccess = FileAccess.open(Kayit.kayit_yolu, FileAccess.WRITE)
	dosya.store_string(icerik)
	dosya.close()
	var ret: bool = not Kayit.yukle() and _imza() == once and _kurtarma_sayisi == sayi + 1
	if not Kayit.yukle(true):
		return false
	await _agac.scene_changed
	_oyuncu().set_physics_process(false)
	await _bekle()
	return ret and _imza() == once

func _yeni_onay() -> bool:
	var once: Array[Variant] = _imza()
	return not Kayit.yeni_oyun(false) and _imza() == once and Kayit.son_hata == "kayit.yeni_onay"

func _olum() -> bool:
	var korundu: bool = true
	for hedef: String in [Oyun.OYUNCU, Oyun.CANLI]:
		_oyuncu().position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"])
		if Oyun.kese_konumu != hedef:
			korundu = Oyun.aktar(hedef, true) and korundu
		var once: Array[Variant] = _imza()
		await _git("bolge")
		_oyuncu().hasar_al(_oyuncu().can)
		await _agac.scene_changed
		_oyuncu().set_physics_process(false)
		await _bekle()
		korundu = _imza() == once and _oyuncu().can == Ayarlar.sayi("oyuncu_can") and Oyun.mekan == "merkez" and korundu
	return korundu

func _gunluk() -> bool:
	var alanlar: Array[String] = ["ilgili", "olay", "oturum", "sure_sn", "surum"]
	var satirlar: PackedStringArray = FileAccess.get_file_as_string(Olaylar.gunluk_yolu).strip_edges().split("\n")
	if satirlar.is_empty() or Olaylar.son_hata != OK:
		return false
	for satir: String in satirlar:
		var veri: Variant = JSON.parse_string(satir)
		if not veri is Dictionary:
			return false
		var anahtarlar: Array[Variant] = veri.keys()
		anahtarlar.sort()
		if anahtarlar != alanlar or not veri["olay"] in Olaylar.OLAYLAR or str(veri["oturum"]).is_empty():
			return false
	return true

func _temizle() -> void:
	Kayit.kurtarma_gerekli.disconnect(_kurtarma)
	var sahne: Node = _agac.current_scene
	_agac.current_scene = null
	sahne.queue_free()
	await _bekle()
	# Yalnız bu çalışmanın rastgele oluşturduğu dizindeki kendi dosyalarını kaldır.
	for ad: String in DirAccess.get_files_at(_klasor):
		DirAccess.remove_absolute(_klasor.path_join(ad))
	DirAccess.remove_absolute(_klasor)
	Kayit.kayit_yolu = _eski_kayit
	Olaylar.gunluk_yolu = _eski_gunluk
	Oyun.oturum_aktif = false

func _bag_ekrani() -> BagEkrani:
	for dugum: Node in _sahne().get_children():
		if dugum is BagEkrani:
			return dugum as BagEkrani
	return null

func _ui_tema() -> bool:
	var yol: String = ProjectSettings.get_setting("gui/theme/custom", "")
	var tema: Theme = load(yol) as Theme
	if yol != "res://arayuz/tema.tres" or tema == null:
		return false
	var panel: StyleBoxFlat = tema.get_stylebox("panel", "AcceptDialog") as StyleBoxFlat
	var tarama: Label = _sahne().get_node("HUD").get("_tarama") as Label
	var hud_okunur: bool = tarama.size.x >= tema.get_constant("hud_genislik", "Arayuz") * 0.5
	return hud_okunur and tema.default_font_size >= 22 and panel != null and is_equal_approx(panel.bg_color.a, 1.0) and tema.get_type_variation_base("Baslik") == &"Label"

func _ui_modal() -> bool:
	var ekran: BagEkrani = _bag_ekrani()
	var p: Oyuncu = _oyuncu()
	p.position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"])
	ekran.ac()
	var dugme: Button = ekran.get("_aktar_dugmesi") as Button
	dugme.grab_focus()
	dugme.pressed.emit()
	var onay: ConfirmationDialog = ekran.get("_onay") as ConfirmationDialog
	var golge: ColorRect = ekran.get("_karartma") as ColorRect
	var korundu: bool = ekran.onay_acik_mi() and ekran.alt_panel_gizli_mi() and dugme.disabled and golge.visible and golge.mouse_filter == Control.MOUSE_FILTER_STOP and onay.exclusive and Oyun.arayuz_acik
	var detay: Dictionary = {"acilis": korundu}
	# Önceki testin fizik durdurmasını kaldır; kilidi gerçek hareket girdisiyle dene.
	var fizik_once: bool = p.is_physics_processing()
	p.set_physics_process(true)
	var once: Vector3 = p.position
	Input.action_press("sag")
	await _agac.create_timer(Ayarlar.sayi("test_kisa_sure")).timeout
	Input.action_release("sag")
	korundu = p.position.distance_to(once) <= Ayarlar.sayi("test_tolerans") and not p.etkiles() and korundu
	detay["hareket_mesafesi"] = p.position.distance_to(once)
	onay.get_cancel_button().pressed.emit()
	korundu = not ekran.onay_acik_mi() and not ekran.alt_panel_gizli_mi() and not dugme.disabled and ekran.gui_get_focus_owner() == dugme and korundu
	detay["iptal_odak"] = ekran.gui_get_focus_owner() == dugme
	detay["iptal_panel"] = not ekran.alt_panel_gizli_mi()
	dugme.pressed.emit()
	onay.get_ok_button().pressed.emit()
	var yeni_dugme: Button = ekran.get("_aktar_dugmesi") as Button
	korundu = not ekran.onay_acik_mi() and not ekran.alt_panel_gizli_mi() and not yeni_dugme.disabled and ekran.gui_get_focus_owner() == yeni_dugme and korundu
	detay["onay_odak"] = ekran.gui_get_focus_owner() == yeni_dugme
	detay["onay_panel"] = not ekran.alt_panel_gizli_mi()
	ekran.kapat()
	p.set_physics_process(fizik_once)
	if not korundu:
		print(JSON.stringify(detay))
	return korundu and not Oyun.arayuz_acik

func _ui_istem() -> bool:
	var hud: Node = _sahne().get_node("HUD")
	var istem: IstemGosterici = hud.get("istem") as IstemGosterici
	_oyuncu().position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"])
	istem.guncelle()
	var eski: Array[InputEvent] = InputMap.action_get_events("etkilesim")
	var ilk_ad: String = istem.tus_adi()
	var dogru: bool = istem.visible and not ilk_ad.is_empty() and ilk_ad in istem.metin()
	var baska_tus: InputEventKey = InputEventKey.new()
	baska_tus.physical_keycode = KEY_F9
	InputMap.action_erase_events("etkilesim")
	InputMap.action_add_event("etkilesim", baska_tus)
	istem.guncelle()
	dogru = OS.get_keycode_string(KEY_F9) in istem.metin() and dogru
	InputMap.action_erase_events("etkilesim")
	for olay: InputEvent in eski:
		InputMap.action_add_event("etkilesim", olay)
	var ekran: BagEkrani = _bag_ekrani()
	ekran.ac()
	istem.guncelle()
	dogru = not istem.visible and dogru
	(ekran.get("_aktar_dugmesi") as Button).pressed.emit()
	istem.guncelle()
	dogru = ekran.onay_acik_mi() and not istem.visible and dogru
	ekran.kapat()
	istem.guncelle()
	dogru = istem.visible and ilk_ad in istem.metin() and dogru
	var once: Vector3 = _oyuncu().position
	_oyuncu().position.y += float(Ayarlar.denge["asama2"]["etkilesim_menzil"]) * 2.0
	istem.guncelle()
	dogru = not istem.visible and dogru
	_oyuncu().position = once
	return dogru
