class_name BagEkrani
extends Window
const TEMA: Theme = preload("res://arayuz/tema.tres")
var _icerik: VBoxContainer
var _panel: PanelContainer
var _karartma: ColorRect
var _onay: ConfirmationDialog
var _hedef: String = ""
var _kaynak: String = ""
var _organ: String = "yanki"
var _diger_kaynak: String = ""
var _odak: Control
var _onay_etkin: bool = false
var _dugmeler: Array[Button] = []
var _pasiflik: Array[bool] = []
var _aktar_dugmesi: Button

func _ready() -> void:
	visible = false
	title = tr("bag.baslik")
	size = Vector2i(TEMA.get_constant("bag_en", "Arayuz"), TEMA.get_constant("bag_boy", "Arayuz"))
	transient = true
	exclusive = true
	_panel = PanelContainer.new()
	_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(_panel)
	var kenar: MarginContainer = MarginContainer.new()
	_panel.add_child(kenar)
	var kaydir: ScrollContainer = ScrollContainer.new()
	kaydir.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	kenar.add_child(kaydir)
	_icerik = VBoxContainer.new()
	_icerik.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	kaydir.add_child(_icerik)
	_karartma = ColorRect.new()
	_karartma.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_karartma.color = TEMA.get_color("karartma", "Arayuz")
	_karartma.mouse_filter = Control.MOUSE_FILTER_STOP
	_karartma.hide()
	add_child(_karartma)
	_onay = ConfirmationDialog.new()
	_onay.transient = true
	_onay.exclusive = true
	_onay.size = Vector2i(TEMA.get_constant("onay_en", "Arayuz"), TEMA.get_constant("onay_boy", "Arayuz"))
	_onay.title = tr("bag.onay")
	_onay.ok_button_text = tr("bag.onayla")
	_onay.cancel_button_text = tr("bag.vazgec")
	_onay.confirmed.connect(_onaylandi)
	_onay.canceled.connect(_onay_iptal)
	_onay.visibility_changed.connect(_onay_gorunurluk)
	add_child(_onay)
	close_requested.connect(kapat)

func ac() -> void:
	_goster()
	Oyun.arayuz_acik = true
	popup_centered()
	if is_instance_valid(_aktar_dugmesi):
		_aktar_dugmesi.grab_focus()

func kapat() -> void:
	_onay.hide()
	_onay_bitti()
	hide()
	Oyun.arayuz_acik = false

func _goster() -> void:
	_aktar_dugmesi = null
	for cocuk: Node in _icerik.get_children():
		_icerik.remove_child(cocuk)
		cocuk.queue_free()
	var yer: String = Oyun.kese_konumu
	_satir(tr("bag.yanki") + " — " + tr("yer." + yer.to_lower()), "yanki", true)
	_satir(tr("bag.yanki_oyuncu") % [Ayarlar.sayi("tarama_yaricap"), Ayarlar.sayi("tarama_sure"), Ayarlar.sayi("tarama_bekleme")], "oyuncu")
	_satir(tr("bag.yanki_canli"), "canli")
	if yer != Oyun.BULUNMADI:
		_hedef = Oyun.CANLI if yer == Oyun.OYUNCU else Oyun.OYUNCU
		_satir(tr("bag.sonuc_canli" if _hedef == Oyun.CANLI else "bag.sonuc_oyuncu"), "sonuc")
		_dugme("bag.aktar", _iste.bind("yanki"))
	else:
		_satir(tr("bag.bulunmadi"))
	_icerik.add_child(HSeparator.new())
	var soluk_yer: String = Oyun.soluk_konumu
	_satir(tr("bag.soluk") + " — " + tr("yer." + soluk_yer.to_lower()), "soluk", true)
	_satir(tr("bag.soluk_oyuncu") % [Ayarlar.denge["asama2"]["soluk_sure"], Ayarlar.denge["asama2"]["soluk_bekleme"]], "oyuncu")
	_satir(tr("bag.soluk_canli"), "canli")
	if soluk_yer != Oyun.BULUNMADI:
		_satir(tr("bag.soluk_sonuc_canli" if soluk_yer == Oyun.OYUNCU else "bag.soluk_sonuc_oyuncu"), "sonuc")
		_dugme("bag.aktar", _iste.bind("soluk"))
	else:
		_satir(tr("bag.soluk_sonuc"), "sonuc")
	_satir(tr("bag.tek_yuva"), "bilgi")
	_dugme("bag.kapat", kapat)

func _iste(organ: String = "yanki") -> void:
	_organ = organ
	_kaynak = Oyun.organ_konumu(organ)
	_diger_kaynak = Oyun.organ_konumu("soluk" if organ == "yanki" else "yanki")
	_hedef = Oyun.CANLI if _kaynak == Oyun.OYUNCU else Oyun.OYUNCU
	var onek: String = "bag.soluk_sonuc_" if organ == "soluk" else "bag.sonuc_"
	_onay.dialog_text = tr(onek + ("canli" if _hedef == Oyun.CANLI else "oyuncu"))
	_odak = gui_get_focus_owner()
	_dugmeler.clear()
	_pasiflik.clear()
	for dugum: Node in _icerik.find_children("*", "Button", true, false):
		var dugme: Button = dugum as Button
		_dugmeler.append(dugme)
		_pasiflik.append(dugme.disabled)
		dugme.disabled = true
	_panel.hide()
	_karartma.show()
	_onay_etkin = true
	_onay.popup_centered()
	_onay.get_cancel_button().grab_focus()

func onay_acik_mi() -> bool:
	return _onay_etkin

func alt_panel_gizli_mi() -> bool:
	return not _panel.visible

func _onay_gorunurluk() -> void:
	if not _onay.visible:
		_onay_bitti()

func _onay_iptal() -> void:
	_onay.hide()
	_onay_bitti()

func _onay_bitti() -> void:
	if not _onay_etkin:
		return
	_onay_etkin = false
	_karartma.hide()
	_panel.show()
	for i: int in range(_dugmeler.size()):
		if is_instance_valid(_dugmeler[i]):
			_dugmeler[i].disabled = _pasiflik[i]
	if is_instance_valid(_odak) and _odak.is_visible_in_tree():
		_odak.grab_focus()

func _onaylandi() -> void:
	_onay_bitti()
	if _kaynak != Oyun.organ_konumu(_organ) or _diger_kaynak != Oyun.organ_konumu("soluk" if _organ == "yanki" else "yanki"):
		Olaylar.bilgi.emit("bilgi.sira")
	elif Oyun.organ_aktar(_organ, _hedef, true):
		Olaylar.bilgi.emit("bilgi.baglandi" if _hedef == Oyun.CANLI else "bilgi.geri_alindi")
	_goster()
	if is_instance_valid(_aktar_dugmesi):
		_aktar_dugmesi.grab_focus()

func _satir(metin: String, simge: String = "bilgi", baslik: bool = false) -> void:
	var satir: HBoxContainer = HBoxContainer.new()
	_icerik.add_child(satir)
	if simge == "yanki":
		var ikon: TextureRect = TextureRect.new()
		ikon.texture = load(Ayarlar.denge["yanki_ikon"]) as Texture2D
		ikon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		ikon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		ikon.custom_minimum_size = Vector2.ONE * TEMA.get_constant("organ_simge_boy", "Arayuz")
		satir.add_child(ikon)
	else:
		var ikon: ArayuzSimgesi = ArayuzSimgesi.new()
		ikon.tur = simge
		satir.add_child(ikon)
	var etiket: Label = Label.new()
	etiket.text = metin
	etiket.theme_type_variation = &"AltBaslik" if baslik else &"Govde"
	etiket.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	etiket.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	satir.add_child(etiket)

func _dugme(anahtar: String, islev: Callable) -> void:
	var dugme: Button = Button.new()
	dugme.text = tr(anahtar)
	if anahtar == "bag.aktar":
		dugme.theme_type_variation = &"Vurgu"
		if not is_instance_valid(_aktar_dugmesi):
			_aktar_dugmesi = dugme
	dugme.pressed.connect(islev)
	_icerik.add_child(dugme)
