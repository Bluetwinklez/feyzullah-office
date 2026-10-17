extends Node

## Yalnız açık debug argümanıyla çalışır; test/ release paketinden dışlanır.
var _tur: String
var _oyuncu: Oyuncu
var _sahne: Node3D
var _kare: int = 0
var _klasor: String
var _kayit: String
var _gunluk: String

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if not OS.is_debug_build():
		get_tree().quit(1)
		return
	for arguman: String in OS.get_cmdline_user_args():
		if arguman.begins_with("--asama3-demo="):
			_tur = arguman.get_slice("=", 1)
	if not _tur in ["kuyu_salonu", "son_karsilasma", "bitis"]:
		get_tree().quit(1)
		return
	get_viewport().gui_embed_subwindows = true
	_kayit = Kayit.kayit_yolu
	_gunluk = Olaylar.gunluk_yolu
	_klasor = "res://build/kayit/asama3/gecici_" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(_klasor)
	Kayit.kayit_yolu = _klasor + "/kayit.json"
	Olaylar.gunluk_yolu = _klasor + "/olaylar.jsonl"
	Oyun.yeni_oyun()
	var veri: Dictionary = Oyun.kayit_verisi()
	veri["gorev_asamasi"] = Gorev.Durum.M3_DERIN_GECIT
	veri["organlar"]["yanki"] = Oyun.CANLI
	veri["gecit_acik"] = true
	var demo: Dictionary = Ayarlar.denge["demo_asama3"]
	if _tur == "kuyu_salonu":
		veri["gorev_asamasi"] = Gorev.Durum.M1_TESISE_IN
		veri["organlar"]["yanki"] = Oyun.BULUNMADI
		veri["gecit_acik"] = false
	if _tur == "bitis":
		veri["gorev_asamasi"] = Gorev.Durum.M5_YOLCULUK
		veri["organlar"]["soluk"] = Oyun.CANLI
		veri["sure_sn"] = demo["bitis_sure"]
		veri["olum_sayisi"] = demo["bitis_olum"]
	Oyun.kayittan_uygula(veri)
	var yol: String = "res://sahneler/" + ("merkez" if _tur == "bitis" else "derin_gecit" if _tur == "son_karsilasma" else "kuyu_salonu") + ".tscn"
	_sahne = (load(yol) as PackedScene).instantiate() as Node3D
	add_child(_sahne)
	_oyuncu = _sahne.get_node("Oyuncu") as Oyuncu
	_oyuncu.set_physics_process(false)
	_oyuncu.position = Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["dinle_konum"]) if _tur == "bitis" else Ayarlar.diziden_vektor(demo[_tur + "_oyuncu"])
	var kamera: Camera3D = _sahne.get_node("Kamera") as Camera3D
	kamera.position = _oyuncu.position + kamera.basis.z * float(Ayarlar.denge["gorsel"]["kamera"]["mesafe"])

func _physics_process(_delta: float) -> void:
	# Yalnız kayıt senaryosunda hareketsiz hedefi yaşat; normal oyun etkilenmez.
	if is_instance_valid(_oyuncu) and _tur != "bitis":
		_oyuncu.can = Ayarlar.sayi("oyuncu_can")

func _process(_delta: float) -> void:
	# Movie kaydında pencere odağı senaryoyu durdurmasın; yalnız debug sahnesi.
	if get_tree().paused:
		Oyun.duraklat_degistir()
	if _tur != "bitis" or not is_instance_valid(_sahne):
		return
	_kare += 1
	var demo: Dictionary = Ayarlar.denge["demo_asama3"]
	if _kare == int(demo["onay_kare"]):
		(_sahne.get_node("Tasiyici") as EtkilesimNoktasi).etkiles(_oyuncu)
	elif _kare == int(demo["kabul_kare"]):
		for n: Node in _sahne.get_children():
			if n is SonYolculuk:
				(n.get("_onay") as ConfirmationDialog).get_ok_button().pressed.emit()

func _exit_tree() -> void:
	if _klasor.is_empty():
		return
	for ad: String in DirAccess.get_files_at(_klasor):
		DirAccess.remove_absolute(_klasor.path_join(ad))
	DirAccess.remove_absolute(_klasor)
	Kayit.kayit_yolu = _kayit
	Olaylar.gunluk_yolu = _gunluk
