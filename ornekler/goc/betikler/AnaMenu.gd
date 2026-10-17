extends Control
var _bilgi: Label
var _onay: ConfirmationDialog

func _ready() -> void:
	var kutu: VBoxContainer = VBoxContainer.new()
	kutu.position = Vector2.ONE * Ayarlar.sayi("hud_kenar")
	kutu.custom_minimum_size.x = Ayarlar.sayi("hud_genislik")
	add_child(kutu)
	_bilgi = Label.new()
	_bilgi.text = tr("oyun.ad")
	_bilgi.theme_type_variation = &"Baslik"
	kutu.add_child(_bilgi)
	_dugme(kutu, "menu.yeni", _yeni_iste)
	_dugme(kutu, "menu.yukle", _yukle.bind(false))
	_dugme(kutu, "menu.yedek", _yukle.bind(true))
	_onay = ConfirmationDialog.new()
	_onay.dialog_text = tr("kayit.yeni_onay")
	_onay.ok_button_text = tr("bag.onayla")
	_onay.cancel_button_text = tr("bag.vazgec")
	_onay.confirmed.connect(_yeni_baslat)
	add_child(_onay)
	Kayit.kurtarma_gerekli.connect(_hata)
	Kayit.kayit_hatasi.connect(_hata)

func _dugme(kutu: VBoxContainer, anahtar: String, islev: Callable) -> void:
	var dugme: Button = Button.new()
	dugme.text = tr(anahtar)
	dugme.pressed.connect(islev)
	kutu.add_child(dugme)

func _yeni_iste() -> void:
	if FileAccess.file_exists(Kayit.kayit_yolu) or FileAccess.file_exists(Kayit.kayit_yolu + ".bak"):
		_onay.popup_centered()
	else:
		_yeni_baslat()

func _yeni_baslat() -> void:
	if Kayit.yeni_oyun(true):
		Oyun.mekan = ""
		Oyun.yer_degistir("merkez")

func _yukle(yedek: bool) -> void:
	Kayit.yukle(yedek)

func _hata(anahtar: String) -> void:
	_bilgi.text = tr(anahtar) + "\n" + tr("kayit.kurtarma")

func _exit_tree() -> void:
	if Kayit.kurtarma_gerekli.is_connected(_hata):
		Kayit.kurtarma_gerekli.disconnect(_hata)
	if Kayit.kayit_hatasi.is_connected(_hata):
		Kayit.kayit_hatasi.disconnect(_hata)
