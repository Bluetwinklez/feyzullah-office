class_name AyarlarEkrani
extends PanelContainer
## Duraklatma menüsünden açılan ayarlar paneli. Her değişiklik hemen uygulanır ve kaydedilir.
## Kapatma düğmesi ya da Escape panelı gizler ve `kapandi` yayar; duraklatma menüsü odağı geri alır.
signal kapandi
var ses: HSlider
var sarsinti: CheckButton
var pencere_modu: OptionButton
var cozunurluk: OptionButton
var kapat_dugmesi: Button
var _ses_etiketi: Label
var _hata: Label

func _ready() -> void:
	visible = false
	custom_minimum_size.x = Ayarlar.sayi("hud_genislik")
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	grow_horizontal = Control.GROW_DIRECTION_BOTH
	grow_vertical = Control.GROW_DIRECTION_BOTH
	var icerik: VBoxContainer = VBoxContainer.new()
	add_child(icerik)
	var baslik: Label = _etiket(icerik, tr("ayarlar.baslik"))
	baslik.theme_type_variation = &"Baslik"
	_ses_etiketi = _etiket(icerik, "")
	ses = HSlider.new()
	ses.name = "Ses"
	ses.min_value = 0.0
	ses.max_value = 1.0
	ses.step = Ayarlar.ayar_sayi("ses_adim")
	ses.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	icerik.add_child(ses)
	sarsinti = CheckButton.new()
	sarsinti.name = "Sarsinti"
	sarsinti.text = tr("ayarlar.sarsinti")
	icerik.add_child(sarsinti)
	pencere_modu = OptionButton.new()
	pencere_modu.name = "PencereModu"
	pencere_modu.add_item(tr("ayarlar.pencere"))
	pencere_modu.add_item(tr("ayarlar.tam_ekran"))
	_satir(icerik, tr("ayarlar.gorunum"), pencere_modu)
	cozunurluk = OptionButton.new()
	cozunurluk.name = "Cozunurluk"
	for boyut: Vector2i in Ayarlar.cozunurlukler():
		cozunurluk.add_item(tr("ayarlar.boyut") % [boyut.x, boyut.y])
	_satir(icerik, tr("ayarlar.cozunurluk"), cozunurluk)
	_hata = _etiket(icerik, "")
	kapat_dugmesi = Button.new()
	kapat_dugmesi.name = "Kapat"
	kapat_dugmesi.text = tr("ayarlar.kapat")
	icerik.add_child(kapat_dugmesi)
	_degerleri_yaz()
	ses.value_changed.connect(_ses_degisti)
	sarsinti.toggled.connect(_sarsinti_degisti)
	pencere_modu.item_selected.connect(_pencere_degisti)
	cozunurluk.item_selected.connect(_cozunurluk_degisti)
	kapat_dugmesi.pressed.connect(kapat)

func ac() -> void:
	_degerleri_yaz()
	_hata.text = ""
	visible = true
	ses.grab_focus()

func kapat() -> void:
	if not visible:
		return
	visible = false
	kapandi.emit()

func _input(olay: InputEvent) -> void:
	if visible and (olay.is_action_pressed("duraklat") or olay.is_action_pressed("ui_cancel")):
		get_viewport().set_input_as_handled()
		kapat()

func _degerleri_yaz() -> void:
	ses.set_value_no_signal(Ayarlar.ses_duzeyi)
	sarsinti.set_pressed_no_signal(Ayarlar.sarsinti)
	pencere_modu.select(int(Ayarlar.tam_ekran))
	cozunurluk.select(Ayarlar.cozunurlukler().find(Ayarlar.cozunurluk))
	_ses_yazisi()

func _ses_yazisi() -> void:
	_ses_etiketi.text = tr("ayarlar.ses") % roundi(Ayarlar.ses_duzeyi * 100.0)

func _ses_degisti(deger: float) -> void:
	Ayarlar.ses_duzeyi = deger
	_ses_yazisi()
	_uygula()

func _sarsinti_degisti(acik: bool) -> void:
	Ayarlar.sarsinti = acik
	_uygula()

func _pencere_degisti(sira: int) -> void:
	Ayarlar.tam_ekran = sira == 1
	_uygula()

func _cozunurluk_degisti(sira: int) -> void:
	Ayarlar.cozunurluk = Ayarlar.cozunurlukler()[sira]
	_uygula()

func _uygula() -> void:
	Ayarlar.uygula()
	_hata.text = "" if Ayarlar.kaydet() == OK else tr("ayarlar.kayit_hatasi")

func _satir(ebeveyn: Node, metin: String, kontrol: Control) -> void:
	var satir: HBoxContainer = HBoxContainer.new()
	ebeveyn.add_child(satir)
	_etiket(satir, metin)
	kontrol.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	satir.add_child(kontrol)

func _etiket(ebeveyn: Node, metin: String) -> Label:
	var etiket: Label = Label.new()
	etiket.text = metin
	etiket.theme_type_variation = &"Govde"
	etiket.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	etiket.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	etiket.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ebeveyn.add_child(etiket)
	return etiket
