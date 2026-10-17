class_name SonYolculuk
extends CanvasLayer

var _onay: ConfirmationDialog
var _kararma: ColorRect
var _calisiyor: bool = false
var oyuncu: Oyuncu

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_onay = ConfirmationDialog.new()
	_onay.title = tr("yolculuk.baslik")
	_onay.dialog_text = tr("yolculuk.onay")
	_onay.ok_button_text = tr("bag.onayla")
	_onay.cancel_button_text = tr("bag.vazgec")
	_onay.exclusive = true
	_onay.confirmed.connect(_onaylandi)
	_onay.canceled.connect(_iptal)
	add_child(_onay)
	_kararma = ColorRect.new()
	_kararma.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_kararma.color = Color.BLACK
	_kararma.hide()
	add_child(_kararma)

func iste() -> bool:
	if _calisiyor or Oyun.arayuz_acik or not Oyun.yolculuga_hazir():
		Olaylar.bilgi.emit("bilgi.sira")
		return false
	Oyun.arayuz_acik = true
	_onay.popup_centered()
	_onay.get_cancel_button().grab_focus()
	return true

func _iptal() -> void:
	if not _calisiyor:
		Oyun.arayuz_acik = false

func _onaylandi() -> void:
	if not Oyun.yolculuk_baslat(true):
		_iptal()
		return
	_calisiyor = true
	_kararma.show()
	_kararma.modulate.a = 0.0
	var veri: Dictionary = Ayarlar.denge["asama3"]["ilerleme"]
	var gecis: Tween = create_tween().set_parallel(true)
	gecis.tween_property(_kararma, "modulate:a", 1.0, float(veri["yolculuk_sure"]))
	if is_instance_valid(oyuncu):
		gecis.tween_property(oyuncu.model, "position:z", -float(veri["yolculuk_mesafe"]), float(veri["yolculuk_sure"]))
	await gecis.finished
	# Kararma aynı katmanda bitiş ekranını örtmesin.
	var bitis: BitisEkrani = BitisEkrani.new()
	bitis.layer = layer + 1
	add_child(bitis)
