class_name IstemGosterici
extends PanelContainer
var oyuncu: Oyuncu
var _tus: Label
var _eylem: Label

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var satir: HBoxContainer = HBoxContainer.new()
	satir.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(satir)
	var kutu: PanelContainer = PanelContainer.new()
	kutu.theme_type_variation = &"TusKutusu"
	kutu.mouse_filter = Control.MOUSE_FILTER_IGNORE
	satir.add_child(kutu)
	_tus = Label.new()
	_tus.theme_type_variation = &"Tus"
	_tus.mouse_filter = Control.MOUSE_FILTER_IGNORE
	kutu.add_child(_tus)
	_eylem = Label.new()
	_eylem.theme_type_variation = &"Istem"
	_eylem.mouse_filter = Control.MOUSE_FILTER_IGNORE
	satir.add_child(_eylem)
	hide()

func tus_adi() -> String:
	for olay: InputEvent in InputMap.action_get_events("etkilesim"):
		if olay is InputEventKey:
			var tus: InputEventKey = olay as InputEventKey
			return OS.get_keycode_string(tus.physical_keycode if tus.keycode == KEY_NONE else tus.keycode)
	return ""

func metin() -> String:
	return _tus.text + " " + _eylem.text

func guncelle() -> void:
	if not is_instance_valid(oyuncu) or oyuncu.can <= 0.0 or get_tree().paused or Oyun.arayuz_acik:
		hide()
		return
	var yakin: EtkilesimNoktasi
	var uzaklik: float = INF
	# Oyuncu.etkiles ile aynı okunabilir mesafe koşulu; etkileşim tetiklenmez.
	for dugum: Node in get_tree().get_nodes_in_group("etkilesilebilir"):
		if dugum is EtkilesimNoktasi and dugum.erisilebilir(oyuncu):
			var mesafe: float = oyuncu.global_position.distance_squared_to(dugum.global_position)
			if mesafe < uzaklik:
				yakin = dugum
				uzaklik = mesafe
	visible = yakin != null
	if yakin != null:
		_tus.text = tr("hud.istem_tus") % tus_adi()
		_eylem.text = tr(yakin.metin_anahtari)

func _physics_process(_delta: float) -> void:
	guncelle()
