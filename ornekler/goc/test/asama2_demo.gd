extends Node

## Yalnız açık demo argümanıyla çalışır; release export test/ klasörünü dışlar.
var _merkez: Node3D
var _ekran: BagEkrani
var _kare: int = 0
var _aktarma: bool = false
var _klasor: String
var _eski_kayit: String
var _eski_gunluk: String

func _ready() -> void:
	var argumanlar: PackedStringArray = OS.get_cmdline_user_args()
	if not "--asama2-demo=merkez" in argumanlar and not "--asama2-demo=aktarma" in argumanlar:
		get_tree().quit(1)
		return
	_aktarma = "--asama2-demo=aktarma" in argumanlar
	get_viewport().gui_embed_subwindows = true
	_eski_kayit = Kayit.kayit_yolu
	_eski_gunluk = Olaylar.gunluk_yolu
	_klasor = "res://build/kayit/asama2/gecici_" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(_klasor)
	Kayit.kayit_yolu = _klasor + "/kayit.json"
	Olaylar.gunluk_yolu = _klasor + "/olaylar.jsonl"
	Oyun.yeni_oyun()
	if _aktarma:
		# Yalnız demo başlangıç verisi: geçerli M2 / oyuncuda kese.
		var veri: Dictionary = Oyun.kayit_verisi()
		veri["gorev_asamasi"] = Gorev.Durum.M2_YANKIYI_GETIR
		veri["organlar"]["yanki"] = Oyun.OYUNCU
		Oyun.kayittan_uygula(veri)
	_merkez = (load("res://sahneler/merkez.tscn") as PackedScene).instantiate() as Node3D
	add_child(_merkez)
	if _aktarma:
		var p: Oyuncu = _merkez.get_node("Oyuncu") as Oyuncu
		p.position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["bag_konum"]) + Vector3.BACK * float(Ayarlar.denge["asama2"]["etkilesim_menzil"]) * 0.5
	else:
		var p: Oyuncu = _merkez.get_node("Oyuncu") as Oyuncu
		p.position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["dinle_konum"]) + Vector3.BACK * float(Ayarlar.denge["asama2"]["etkilesim_menzil"]) * 0.5
	for cocuk: Node in _merkez.get_children():
		if cocuk is BagEkrani:
			_ekran = cocuk

func _process(_delta: float) -> void:
	if not _aktarma or _ekran == null:
		return
	_kare += 1
	var veri: Dictionary = Ayarlar.denge["asama2_demo"]
	if _kare == int(veri["bilgi_kare"]):
		_ekran.ac()
	elif _kare == int(veri["onay_kare"]):
		var dugmeler: Array[Node] = _ekran.find_children("*", "Button", true, false)
		for dugum: Node in dugmeler:
			var dugme: Button = dugum as Button
			if dugme.text == tr("bag.aktar"):
				dugme.pressed.emit()
	elif _kare == int(veri["aktar_kare"]):
		for dugum: Node in _ekran.get_children():
			if dugum is ConfirmationDialog:
				(dugum as ConfirmationDialog).get_ok_button().pressed.emit()
		print(JSON.stringify({"demo": "aktarma", "kese": Oyun.kese_konumu, "gecit_acik": Oyun.gecit_acik}))
	elif _kare == int(veri["kapat_kare"]):
		_ekran.kapat()

func _exit_tree() -> void:
	if _klasor.is_empty():
		return
	for ad: String in DirAccess.get_files_at(_klasor):
		DirAccess.remove_absolute(_klasor.path_join(ad))
	DirAccess.remove_absolute(_klasor)
	Kayit.kayit_yolu = _eski_kayit
	Olaylar.gunluk_yolu = _eski_gunluk
