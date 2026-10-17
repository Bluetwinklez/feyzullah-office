class_name BitisEkrani
extends CanvasLayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	Oyun.arayuz_acik = true
	var arka: PanelContainer = PanelContainer.new()
	arka.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(arka)
	var merkez: CenterContainer = CenterContainer.new()
	arka.add_child(merkez)
	var kutu: VBoxContainer = VBoxContainer.new()
	merkez.add_child(kutu)
	var baslik: Label = Label.new()
	baslik.theme_type_variation = &"Baslik"
	baslik.text = tr("bitis.baslik")
	kutu.add_child(baslik)
	var ozet: Label = Label.new()
	ozet.theme_type_variation = &"Govde"
	ozet.text = tr("bitis.ozet") % [Oyun.sure_sn, Oyun.olum_sayisi]
	kutu.add_child(ozet)
	var tekrar: Button = Button.new()
	tekrar.text = tr("bitis.tekrar")
	tekrar.theme_type_variation = &"Vurgu"
	tekrar.pressed.connect(Oyun.tekrar_oyna)
	kutu.add_child(tekrar)
	var cik: Button = Button.new()
	cik.text = tr("bitis.cik")
	cik.pressed.connect(Oyun.cikis_iste)
	kutu.add_child(cik)
	tekrar.grab_focus()
