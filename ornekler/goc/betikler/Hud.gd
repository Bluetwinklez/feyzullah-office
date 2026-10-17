extends CanvasLayer
const TEMA: Theme = preload("res://arayuz/tema.tres")
@export var oyuncu_yolu: NodePath
@onready var oyuncu: Oyuncu = get_node_or_null(oyuncu_yolu) as Oyuncu if not oyuncu_yolu.is_empty() else null
var _can: Label
var _kacin: Label
var _tarama: Label
var _menu: PanelContainer
var _hedef: Label
var _bilgi: Label
var _siseler: Label
var _olum_kaybi: Label
var _yanki_ikon: TextureRect
var _soluk_ikon: ArayuzSimgesi
var istem: IstemGosterici
var ayarlar_ekrani: AyarlarEkrani
var _devam: Button
var _ayarlar_dugmesi: Button
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var kutu: VBoxContainer = VBoxContainer.new()
	kutu.position = Vector2.ONE * Ayarlar.sayi("hud_kenar")
	kutu.mouse_filter = Control.MOUSE_FILTER_IGNORE
	kutu.custom_minimum_size.x = TEMA.get_constant("hud_genislik", "Arayuz")
	add_child(kutu)
	_can = _etiket(kutu, "")
	_kacin = _etiket(kutu, "")
	var tarama_satiri: HBoxContainer = HBoxContainer.new()
	tarama_satiri.mouse_filter = Control.MOUSE_FILTER_IGNORE
	kutu.add_child(tarama_satiri)
	var ikon_yolu: String = Ayarlar.denge["yanki_ikon"]
	if ResourceLoader.exists(ikon_yolu):
		var ikon: TextureRect = TextureRect.new()
		_yanki_ikon = ikon
		ikon.name = "YankiIkon"
		ikon.texture = load(ikon_yolu) as Texture2D
		ikon.custom_minimum_size = Vector2.ONE * Ayarlar.sayi("hud_ikon_boy")
		ikon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		ikon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		ikon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		tarama_satiri.add_child(ikon)
	_soluk_ikon = ArayuzSimgesi.new()
	_soluk_ikon.tur = "soluk"
	_soluk_ikon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tarama_satiri.add_child(_soluk_ikon)
	_tarama = _etiket(tarama_satiri, "")
	_hedef = _etiket(kutu, "")
	_bilgi = _etiket(kutu, "")
	_siseler = _etiket(kutu, "")
	var iyiles: Button = Button.new()
	iyiles.text = tr("hud.iyiles")
	iyiles.pressed.connect(Oyun.iyiles)
	kutu.add_child(iyiles)
	Olaylar.durum_degisti.connect(_durum)
	Olaylar.bilgi.connect(_bilgi_goster)
	Kayit.kayit_hatasi.connect(_bilgi_goster)
	_durum()
	if not Kayit.son_hata.is_empty():
		_bilgi_goster(Kayit.son_hata)
	_menu = PanelContainer.new()
	# Satır kaydıran ölüm kaybı metni paneli daraltmasın; HUD satırlarının üstüne binmesin.
	_menu.custom_minimum_size.x = Ayarlar.sayi("hud_genislik")
	_menu.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_menu.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_menu.grow_vertical = Control.GROW_DIRECTION_BOTH
	add_child(_menu)
	var icerik: VBoxContainer = VBoxContainer.new()
	_menu.add_child(icerik)
	_etiket(icerik, tr("menu.duraklat"))
	_olum_kaybi = _etiket(icerik, "")
	_devam = Button.new()
	_devam.name = "Devam"
	_devam.text = tr("menu.devam")
	_devam.pressed.connect(Oyun.duraklat_degistir)
	_devam.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	# Düğmeler yan yana: panel yüksekliği artıp HUD satırlarına binmesin.
	var dugmeler: HBoxContainer = HBoxContainer.new()
	icerik.add_child(dugmeler)
	dugmeler.add_child(_devam)
	_ayarlar_dugmesi = Button.new()
	_ayarlar_dugmesi.name = "AyarlarDugmesi"
	_ayarlar_dugmesi.text = tr("menu.ayarlar")
	_ayarlar_dugmesi.pressed.connect(_ayarlari_ac)
	_ayarlar_dugmesi.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dugmeler.add_child(_ayarlar_dugmesi)
	ayarlar_ekrani = AyarlarEkrani.new()
	ayarlar_ekrani.name = "AyarlarEkrani"
	add_child(ayarlar_ekrani)
	ayarlar_ekrani.kapandi.connect(_ayarlar_kapandi)
	Olaylar.duraklatma_degisti.connect(_duraklat)
	_duraklat(get_tree().paused)
	_istem_kur()

func _istem_kur() -> void:
	var kok: Control = Control.new()
	kok.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	kok.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(kok)
	var kenar: MarginContainer = MarginContainer.new()
	kenar.theme_type_variation = &"AltIstemKenari"
	kenar.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	kenar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	kok.add_child(kenar)
	var dikey: VBoxContainer = VBoxContainer.new()
	dikey.alignment = BoxContainer.ALIGNMENT_END
	dikey.mouse_filter = Control.MOUSE_FILTER_IGNORE
	kenar.add_child(dikey)
	var yatay: HBoxContainer = HBoxContainer.new()
	yatay.alignment = BoxContainer.ALIGNMENT_CENTER
	yatay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dikey.add_child(yatay)
	istem = IstemGosterici.new()
	istem.name = "EtkilesimIstemi"
	yatay.add_child(istem)
	istem.oyuncu = oyuncu
func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_durum):
		Olaylar.durum_degisti.disconnect(_durum)
	if Olaylar.bilgi.is_connected(_bilgi_goster):
		Olaylar.bilgi.disconnect(_bilgi_goster)
	if Kayit.kayit_hatasi.is_connected(_bilgi_goster):
		Kayit.kayit_hatasi.disconnect(_bilgi_goster)
	if Olaylar.duraklatma_degisti.is_connected(_duraklat):
		Olaylar.duraklatma_degisti.disconnect(_duraklat)
func _etiket(ebeveyn: Node, metin: String) -> Label:
	var etiket: Label = Label.new()
	etiket.text = metin
	etiket.theme_type_variation = &"Govde"
	etiket.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	etiket.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	etiket.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ebeveyn.add_child(etiket)
	return etiket
func _duraklat(deger: bool) -> void:
	_menu.visible = deger
	ayarlar_ekrani.visible = false
	if deger:
		_devam.grab_focus()
	_olum_kaybi.text = tr("menu.olum_kaybi") % [float(Ayarlar.denge["asama3"]["ilerleme"]["kaynak_kayip_orani"]) * 100.0, Oyun.olum_kaybi()]
func _ayarlari_ac() -> void:
	_menu.visible = false
	ayarlar_ekrani.ac()
func _ayarlar_kapandi() -> void:
	# Ayarlar yalnız duraklatma menüsünden açılır; kapanınca oraya dönülür.
	_menu.visible = true
	_ayarlar_dugmesi.grab_focus()
func _physics_process(_delta: float) -> void:
	if not is_instance_valid(oyuncu):
		return
	_can.text = tr("hud.can") % [oyuncu.can, Ayarlar.sayi("oyuncu_can")]
	_kacin.text = tr("hud.kacin") % oyuncu.kacin_bekleme
	_tarama.text = tr("hud.tarama") % oyuncu.yanki.bekleme if Oyun.kese_konumu == Oyun.OYUNCU else tr("hud.kese_yok") % tr("yer." + Oyun.kese_konumu.to_lower())
	if Oyun.soluk_konumu == Oyun.OYUNCU:
		_tarama.text = tr("hud.soluk") % [oyuncu.soluk.kalan, oyuncu.soluk.bekleme]
	_siseler.text = tr("hud.siseler") % [Oyun.sise_sayisi, Oyun.kehribar, Oyun.hazirlik_artisi]

func _durum() -> void:
	_hedef.text = tr(Oyun.gorev.hedef_anahtari() if Oyun.oturum_aktif else "hud.hedef")
	_soluk_ikon.visible = Oyun.soluk_konumu == Oyun.OYUNCU
	if is_instance_valid(_yanki_ikon):
		_yanki_ikon.visible = not _soluk_ikon.visible

func _bilgi_goster(anahtar: String) -> void:
	_bilgi.text = tr(anahtar)
