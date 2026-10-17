extends SceneTree

## Eski 19 testi değiştirmeyen, gerçek sahne ve gerçek dosya hatasıyla regresyon denemesi.
func _initialize() -> void:
	call_deferred("_baslat")

func _baslat() -> void:
	var oyun: Node = root.get_node("Oyun")
	var kayit: Node = root.get_node("Kayit")
	var olaylar: Node = root.get_node("Olaylar")
	var ayarlar: Node = root.get_node("Ayarlar")
	var denge: Dictionary = ayarlar.get("denge")
	var kimlik: String = Crypto.new().generate_random_bytes(16).hex_encode()
	# Test yalnız proje içindeki yazılabilir build klasörüne yazar.
	DirAccess.make_dir_recursive_absolute("res://build/kilit-duzeltme")
	kayit.set("kayit_yolu", "res://build/kilit-duzeltme/" + kimlik + ".json")
	olaylar.set("gunluk_yolu", "res://build/kilit-duzeltme/" + kimlik + ".jsonl")
	oyun.call("yeni_oyun")
	var veri: Dictionary = oyun.call("kayit_verisi")
	# Geçerli, ilerlemiş bir kayıttan gerçek bölgeyi kur; organ kaybı da denetlensin.
	veri["gorev_asamasi"] = 3
	veri["organlar"]["yanki"] = "CANLI"
	veri["gecit_acik"] = true
	veri["kestirme_acik"] = true
	veri["kehribar"] = 1
	oyun.call("kayittan_uygula", veri)
	var bolge: Node = (load("res://sahneler/bolge.tscn") as PackedScene).instantiate()
	root.add_child(bolge)
	current_scene = bolge
	await physics_frame
	var oyuncu: Node = bolge.get_node("Oyuncu")
	# Sessizce takılan sahne değişimi testi sonsuza dek çalıştırmasın.
	var gozcu: SceneTreeTimer = create_timer(float(denge["test_zaman_asimi"]))
	gozcu.timeout.connect(_zaman_asimi, CONNECT_ONE_SHOT)
	oyuncu.call("hasar_al", float(oyuncu.get("can")))
	await scene_changed
	gozcu.timeout.disconnect(_zaman_asimi)
	var yeni_oyuncu: Node = current_scene.get_node("Oyuncu")
	var dosya: Variant = JSON.parse_string(FileAccess.get_file_as_string(kayit.get("kayit_yolu")))
	var dondu: bool = oyun.get("mekan") == "merkez" and float(yeni_oyuncu.get("can")) == float(denge["oyuncu_can"])
	dondu = dondu and oyun.get("kese_konumu") == "CANLI" and oyun.get("gecit_acik") and oyun.get("kestirme_acik") and oyun.get("kehribar") == 1
	dondu = dondu and dosya is Dictionary and float(dosya["oyuncu"]["can"]) == float(denge["oyuncu_can"])
	if not dondu:
		print(TranslationServer.translate("test.kilit_olum_kaldi"))
		quit(1)
		return
	print(TranslationServer.translate("test.kilit_olum_gecti"))
	# Var olmayan üst dizin: gerçek FileAccess hatası, sahte servis kullanılmaz.
	kayit.set("kayit_yolu", "res://build/kilit-duzeltme/" + kimlik + "/kayit.json")
	var ilk: bool = oyun.call("cikis_iste")
	if ilk or kayit.get("son_hata") != "kayit.yazilamadi":
		print(TranslationServer.translate("test.kilit_cikis_kaldi"))
		quit(1)
		return
	var ikinci: bool = oyun.call("cikis_iste")
	if not ikinci:
		print(TranslationServer.translate("test.kilit_cikis_kaldi"))
		quit(1)
		return
	print(TranslationServer.translate("test.kilit_cikis_gecti"))

func _zaman_asimi() -> void:
	print(TranslationServer.translate("test.kilit_olum_kaldi"))
	quit(1)
