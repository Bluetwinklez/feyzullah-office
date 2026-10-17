extends "res://test/asama3_destek.gd"

var _klasor: String
var _bitmis: Dictionary
var _yerlesimler: Array[Dictionary] = []

func calistir(agac: SceneTree) -> Array[Dictionary]:
	self.agac = agac
	var eski_kayit: String = Kayit.kayit_yolu
	var eski_gunluk: String = Olaylar.gunluk_yolu
	var eski_hiz: float = Engine.time_scale
	_klasor = "res://build/test_asama3/" + Crypto.new().generate_random_bytes(16).hex_encode()
	DirAccess.make_dir_recursive_absolute(_klasor)
	Kayit.kayit_yolu = _klasor + "/kayit.json"
	Olaylar.gunluk_yolu = _klasor + "/olaylar.jsonl"
	Engine.time_scale = ayar("hizlandirma")
	var tam: bool = await _akis(true)
	_ekle("test.k1", tam)
	if tam:
		_ekle("test.k2", await _olum())
		_ekle("test.k3", await _kayit())
		_ekle("test.k4", await _organlar())
		_ekle("test.k5", await _kilitlenme())
		_ekle("test.k6", await _akis(false) and not "sis_cebi" in mekanlar and not Oyun.nefes_kesesi_alindi and not Oyun.kestirme_acik)
		_ekle("test.k7", await _duraklat_tekrar())
	else:
		for anahtar: String in ["test.k2", "test.k3", "test.k4", "test.k5", "test.k6", "test.k7"]:
			_ekle(anahtar, false)
	birak()
	agac.paused = false
	Oyun.set_physics_process(true)
	var sahne: Node = agac.current_scene
	agac.current_scene = null
	if is_instance_valid(sahne):
		sahne.queue_free()
	await kare()
	Oyun.oturum_aktif = false
	Oyun.arayuz_acik = false
	for ad: String in DirAccess.get_files_at(_klasor):
		DirAccess.remove_absolute(_klasor.path_join(ad))
	DirAccess.remove_absolute(_klasor)
	Kayit.kayit_yolu = eski_kayit
	Olaylar.gunluk_yolu = eski_gunluk
	Engine.time_scale = eski_hiz
	return sonuclar

func _ekle(ad: String, gecti: bool) -> void:
	sonuclar.append({"ad": ad, "gecti": gecti})
	print(JSON.stringify({"kabul": ad, "gecti": gecti}))

func _akis(yan_alan: bool) -> bool:
	dusmanlari_durdur = false
	birak()
	Oyun.yeni_oyun()
	m0 = Oyun.kayit_verisi()
	mekanlar.clear()
	if not Oyun.yer_degistir("merkez"):
		return false
	await agac.scene_changed
	await kare()
	if not await etkiles("Tasiyici") or Oyun.gorev.durum != Gorev.Durum.M1_TESISE_IN:
		return false
	if not await kapi("DonusKapisi", "bolge") or not await savas():
		return false
	if not await kapi("KoridorKapisi", "koridor") or not await savas():
		return false
	if not await kapi("KuyuKapisi", "kuyu_salonu") or not await savas():
		return false
	if not await etkiles("KuyuSalonuBuluntusu") or Oyun.gorev.durum != Gorev.Durum.M2_YANKIYI_GETIR:
		return false
	m2 = Oyun.kayit_verisi()
	if not await kapi("DonusKapisi", "merkez") or not await bag("yanki", Oyun.CANLI):
		return false
	m3 = Oyun.kayit_verisi()
	if not Oyun.gecit_acik or not await kapi("DonusKapisi", "bolge"):
		return false
	if not await kapi("DerinGecitKapisi", "derin_gecit"):
		return false
	var tetik: Vector3 = Ayarlar.diziden_vektor(Ayarlar.denge["asama3"]["son_karsilasma"]["tetik_konum"])
	var yaklasim: Vector3 = tetik + Vector3.BACK * float(Ayarlar.denge["asama3"]["son_karsilasma"]["tetik_yaricap"]) * 0.5
	if not await yuru(yaklasim, Ayarlar.sayi("test_yakin_uzaklik")):
		return false
	await kare()
	var son: SonKarsilasma = agac.current_scene.get_node("SonKarsilasma") as SonKarsilasma
	if not son.tetiklendi or not await savas() or son.kalan_dusman != 0:
		return false
	if not await kapi("CekirdekKapisi", "cekirdek_odasi") or not await etkiles("SolukCekirdegi"):
		return false
	if yan_alan:
		if not await kapi("DonusKapisi", "merkez") or not await kapi("DonusKapisi", "bolge"):
			return false
		if not await kapi("KoridorKapisi", "koridor") or not await savas() or not await kapi("SisKapisi", "sis_cebi"):
			return false
		if not p().organ_kullan() or not await etkiles("NefesKesesi"):
			return false
	if not await kapi("DonusKapisi", "merkez"):
		return false
	m4 = Oyun.kayit_verisi()
	if not await bag("soluk", Oyun.CANLI):
		return false
	m5 = Oyun.kayit_verisi()
	if Oyun.tamamlandi or Oyun.yolculuk_baslat(false):
		return false
	if not await etkiles("Tasiyici"):
		return false
	var yol: SonYolculuk = _yol()
	var onay: ConfirmationDialog = yol.get("_onay") as ConfirmationDialog
	if not onay.visible or Oyun.tamamlandi:
		return false
	onay.get_ok_button().pressed.emit()
	await agac.create_timer(float(Ayarlar.denge["asama3"]["ilerleme"]["yolculuk_sure"]) + Ayarlar.sayi("test_kisa_sure")).timeout
	_bitmis = Oyun.kayit_verisi()
	var ekran: BitisEkrani = _bitis()
	if ekran == null:
		return false
	var ozet: String = tr("bitis.ozet") % [Oyun.sure_sn, Oyun.olum_sayisi]
	if not kontrol(ekran.visible and ekran.layer > yol.layer, "bitis_kararma_ustunde"):
		return false
	return kontrol(Oyun.tamamlandi and Oyun.gorev.durum == Gorev.Durum.M6_BITTI and _etiket_var(ekran, ozet) and _buton(ekran, "bitis.tekrar") != null and _buton(ekran, "bitis.cik") != null, "bitis_icerigi")

func _yol() -> SonYolculuk:
	for n: Node in agac.current_scene.get_children():
		if n is SonYolculuk:
			return n
	return null

func _bitis() -> BitisEkrani:
	for n: Node in agac.current_scene.get_children():
		if n is BitisEkrani:
			return n
		if n is SonYolculuk:
			for cocuk: Node in n.get_children():
				if cocuk is BitisEkrani:
					return cocuk
	return null

func _etiket_var(kok: Node, metin: String) -> bool:
	for n: Node in kok.find_children("*", "Label", true, false):
		if (n as Label).text == metin:
			return true
	return false

func _buton(kok: Node, anahtar: String) -> Button:
	for n: Node in kok.find_children("*", "Button", true, false):
		if (n as Button).text == tr(anahtar):
			return n as Button
	return null

func _olum() -> bool:
	if not await yukle(m4) or not await kapi("DonusKapisi", "bolge") or not await savas():
		return false
	var once: Dictionary = Oyun.kayit_verisi()
	var kayip: int = ceili(float(once["sefer_kehribari"]) * float(Ayarlar.denge["asama3"]["ilerleme"]["kaynak_kayip_orani"]))
	p().hasar_al(p().can)
	await agac.scene_changed
	await kare()
	var sonra: Dictionary = Oyun.kayit_verisi()
	var korundu: bool = sonra["organlar"] == once["organlar"] and sonra["gorev_asamasi"] == once["gorev_asamasi"] and sonra["gecit_acik"] == once["gecit_acik"] and sonra["nefes_kesesi_alindi"] == once["nefes_kesesi_alindi"] and sonra["sise_kapasitesi"] == once["sise_kapasitesi"]
	var dogru: bool = Oyun.mekan == "merkez" and p().can == Ayarlar.sayi("oyuncu_can") and p().position.distance_to(Ayarlar.diziden_vektor(Ayarlar.denge["asama2"]["merkez_dogum"])) <= Ayarlar.sayi("test_tolerans")
	dogru = dogru and Oyun.kehribar == int(once["kehribar"]) - kayip and Oyun.olum_sayisi == int(once["olum_sayisi"]) + 1 and Oyun.sise_sayisi == Oyun.sise_kapasitesi
	return kontrol(korundu and dogru and await kapi("DonusKapisi", "bolge"), "olum_kaynak_organ_donus")

func _kayit() -> bool:
	if not await yukle(m4):
		return false
	Oyun.set_physics_process(false)
	p().set_physics_process(false)
	p().soluk.set_physics_process(false)
	var once: Dictionary = Oyun.kayit_verisi()
	var dogru: bool = Kayit.kaydet() and Kayit.kaydet()
	var disk: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(Kayit.kayit_yolu)) as Dictionary
	if not _esit(disk, once):
		print(JSON.stringify({"disk_once": once, "disk_sonra": disk}, "", true, true))
	dogru = kontrol(dogru and _esit(disk, once), "kayit_disk") and kontrol(int(disk["surum"]) == Kayit.SURUM and FileAccess.file_exists(Kayit.kayit_yolu + ".bak") and not FileAccess.file_exists(Kayit.kayit_yolu + ".tmp"), "kayit_tmp_bak_surum")
	Oyun.yeni_oyun()
	if not Kayit.yukle():
		return false
	await agac.scene_changed
	agac.paused = true
	var sonra: Dictionary = Oyun.kayit_verisi()
	if not _esit(sonra, once):
		print(JSON.stringify({"kayit_once": once, "kayit_sonra": sonra}))
		for anahtar: String in once:
			if anahtar == "oyuncu":
				for alan: String in once[anahtar]:
					if once[anahtar][alan] != sonra[anahtar][alan]:
						print(JSON.stringify({"fark": alan, "delta": float(once[anahtar][alan]) - float(sonra[anahtar][alan])}, "", true, true))
			elif once[anahtar] != sonra[anahtar]:
				print(JSON.stringify({"fark": anahtar, "once": once[anahtar], "sonra": sonra[anahtar]}, "", true, true))
	dogru = kontrol(_esit(sonra, once), "kayit_geri_yukleme") and dogru
	agac.paused = false
	var eski: Dictionary = m3.duplicate(true)
	eski["surum"] = 1
	for anahtar: String in ["sise_sayisi", "hazirlik_artisi", "sefer_kehribari", "olum_sayisi", "sure_sn"]:
		eski.erase(anahtar)
	eski["oyuncu"].erase("soluk_kalan")
	eski["oyuncu"].erase("soluk_bekleme")
	dogru = kontrol(await yukle(eski), "kayit_eski_surum_yukle") and dogru
	dogru = kontrol(Oyun.gorev.durum == Gorev.Durum.M3_DERIN_GECIT and Oyun.kese_konumu == Oyun.CANLI and Oyun.soluk_konumu == Oyun.BULUNMADI and Oyun.olum_sayisi == 0, "kayit_eski_surum_durum") and dogru
	if not await yukle(_bitmis):
		return false
	dogru = kontrol(Oyun.tamamlandi and Oyun.gorev.durum == Gorev.Durum.M6_BITTI and _bitis() != null and _esit(Oyun.sure_sn, _bitmis["sure_sn"]) and Oyun.olum_sayisi == int(_bitmis["olum_sayisi"]), "kayit_bitmis_oyun") and dogru
	Oyun.set_physics_process(true)
	return kontrol(dogru, "kayit_tum_alanlar_atomik_tasima")

func _esit(a: Variant, b: Variant) -> bool:
	# JSON sayıları float okur; Dictionary == ise 1 ile 1.0'ı farklı sayar.
	# Tam sayılar/bayraklar birebir; kesirli zamanlarda JSON parserinin tek ULP
	# yuvarlaması için mevcut test toleransı kullanılır (fizik adımından çok küçük).
	if a is Dictionary and b is Dictionary:
		if a.size() != b.size():
			return false
		for anahtar: Variant in a:
			if not b.has(anahtar) or not _esit(a[anahtar], b[anahtar]):
				return false
		return true
	if (a is float or a is int) and (b is float or b is int):
		if float(a) == floorf(float(a)) and float(b) == floorf(float(b)):
			return a == b
		return absf(float(a) - float(b)) <= Ayarlar.sayi("test_tolerans")
	return a == b

func _organlar() -> bool:
	if not await yukle(m4) or not await yaklas(nokta("BagDuzenegi")):
		return false
	var ekran: BagEkrani
	for n: Node in agac.current_scene.get_children():
		if n is BagEkrani:
			ekran = n
	ekran.ac()
	var bilgi: bool = _etiket_var(ekran, tr("bag.soluk_oyuncu") % [Ayarlar.denge["asama2"]["soluk_sure"], Ayarlar.denge["asama2"]["soluk_bekleme"]]) and _etiket_var(ekran, tr("bag.soluk_canli")) and _etiket_var(ekran, tr("bag.soluk_sonuc_canli")) and _etiket_var(ekran, tr("bag.soluk") + " — " + tr("yer.oyuncu"))
	var once: Dictionary = Oyun.kayit_verisi()
	bilgi = bilgi and not Oyun.organ_aktar("soluk", Oyun.CANLI, false) and Oyun.kayit_verisi()["organlar"] == once["organlar"]
	var dugmeler: Array[Button] = []
	for n: Node in (ekran.get("_icerik") as Node).find_children("*", "Button", true, false):
		if (n as Button).text == tr("bag.aktar"):
			dugmeler.append(n as Button)
	dugmeler.back().pressed.emit()
	bilgi = bilgi and ekran.onay_acik_mi() and Oyun.soluk_konumu == Oyun.OYUNCU
	(ekran.get("_onay") as ConfirmationDialog).get_cancel_button().pressed.emit()
	bilgi = bilgi and Oyun.soluk_konumu == Oyun.OYUNCU
	dugmeler.back().pressed.emit()
	(ekran.get("_onay") as ConfirmationDialog).get_ok_button().pressed.emit()
	bilgi = Oyun.soluk_konumu == Oyun.CANLI and Oyun.gorev.durum == Gorev.Durum.M5_YOLCULUK and bilgi
	ekran.kapat()
	_yerlesimler = [m0.duplicate(true), m2.duplicate(true), m3.duplicate(true), m4.duplicate(true)]
	_yerlesimler.append(Oyun.kayit_verisi())
	bilgi = await bag("yanki", Oyun.OYUNCU) and bilgi
	_yerlesimler.append(Oyun.kayit_verisi())
	bilgi = not Oyun.organ_aktar("soluk", Oyun.OYUNCU, true) and bilgi
	for veri: Dictionary in _yerlesimler:
		if not await yukle(veri):
			return false
		bilgi = _gorunen_organ("yanki") == (0 if Oyun.kese_konumu == Oyun.BULUNMADI else 1) and _gorunen_organ("soluk") == (0 if Oyun.soluk_konumu == Oyun.BULUNMADI else 1) and bilgi
	if not await kapi("DonusKapisi", "bolge") or not await savas():
		return false
	var duvar: KirilganDuvar = agac.current_scene.get_node("KirilganDuvar") as KirilganDuvar
	var konum: Vector3 = duvar.position
	konum.y = 0.0
	konum.z += Ayarlar.sayi("test_hedef_uzaklik")
	if not await yuru(konum, Ayarlar.sayi("test_tolerans") + Ayarlar.sayi("govde_yaricap")):
		return false
	bilgi = p().organ_kullan() and bilgi
	p().look_at(Vector3(duvar.position.x, 0.0, duvar.position.z), Vector3.UP)
	var zaman: float = 0.0
	while not duvar.yikildi_mi() and zaman < ayar("savas_zaman_asimi"):
		p().saldir()
		await kare()
		zaman += p().get_physics_process_delta_time()
	bilgi = duvar.yikildi_mi() and Oyun.kestirme_acik and bilgi
	return kontrol(bilgi, "organ_tek_konum_onay_bilgileri")

func _gorunen_organ(organ: String) -> int:
	var sayi: int = 0
	for n: Node in agac.current_scene.find_children("*", "Node3D", true, false):
		if organ == "yanki" and n is YankiKesesi and n.is_visible_in_tree():
			sayi += 1
		if organ == "soluk" and n is OrganGorseli and n.kimlik == "soluk_cekirdegi" and n.is_visible_in_tree():
			sayi += 1
	return sayi

func _kilitlenme() -> bool:
	dusmanlari_durdur = true
	var dogru: bool = true
	for veri: Dictionary in _yerlesimler:
		if not await yukle(veri):
			return false
		if not await kapi("DonusKapisi", "bolge") or not await kapi("KoridorKapisi", "koridor") or not await kapi("KuyuKapisi", "kuyu_salonu") or not await kapi("DonusKapisi", "merkez"):
			return false
		if Oyun.gecit_acik:
			if not await kapi("DonusKapisi", "bolge") or not await kapi("DerinGecitKapisi", "derin_gecit") or not await kapi("CekirdekKapisi", "cekirdek_odasi") or not await kapi("DonusKapisi", "merkez"):
				return false
		else:
			dogru = not Oyun.yer_degistir("derin_gecit") and dogru
	for cift: Array[Variant] in [[Oyun.BULUNMADI, Oyun.OYUNCU], [Oyun.BULUNMADI, Oyun.CANLI], [Oyun.OYUNCU, Oyun.OYUNCU]]:
		var bozuk: Dictionary = m4.duplicate(true)
		bozuk["organlar"] = {"yanki": cift.front(), "soluk": cift.back()}
		var once: Dictionary = Oyun.kayit_verisi()
		dogru = not Kayit.dogrula(bozuk) and dogru
		Oyun.kayittan_uygula(bozuk)
		dogru = Oyun.kayit_verisi()["organlar"] == once["organlar"] and dogru
	dusmanlari_durdur = false
	return kontrol(dogru, "alti_gecerli_uc_gecersiz_yerlesim")

func _duraklatma_okunur() -> bool:
	# Panel görünür, başlığı tek satır, HUD düğmeleriyle çakışmaz.
	for n: Node in agac.current_scene.get_children():
		if n is CanvasLayer and n.get("_menu") is PanelContainer:
			var menu: PanelContainer = n.get("_menu") as PanelContainer
			var baslik: Label
			for etiket: Node in menu.find_children("*", "Label", true, false):
				if (etiket as Label).text == tr("menu.duraklat"):
					baslik = etiket as Label
			var cakisma: bool = false
			for dugme: Node in n.find_children("*", "Button", true, false):
				if not menu.is_ancestor_of(dugme) and (dugme as Button).is_visible_in_tree() and (dugme as Button).get_global_rect().intersects(menu.get_global_rect()):
					cakisma = true
			return menu.visible and menu.size.x >= Ayarlar.sayi("hud_genislik") and baslik != null and baslik.get_line_count() == 1 and not cakisma
	return false

func _duraklat_tekrar() -> bool:
	var ekran: BitisEkrani = _bitis()
	if ekran == null:
		return false
	_buton(ekran, "bitis.tekrar").pressed.emit()
	await agac.scene_changed
	await kare()
	var temiz: bool = Oyun.gorev.durum == Gorev.Durum.M0_UYANIS and Oyun.kese_konumu == Oyun.BULUNMADI and Oyun.soluk_konumu == Oyun.BULUNMADI and not Oyun.gecit_acik and not Oyun.nefes_kesesi_alindi and Oyun.kehribar == 0 and Oyun.olum_sayisi == 0 and not Oyun.tamamlandi
	p().kamera = null
	hareket(Vector3.RIGHT)
	await agac.create_timer(Ayarlar.sayi("test_kisa_sure")).timeout
	Oyun.duraklat_degistir()
	var konum: Vector3 = p().position
	var sure: float = Oyun.sure_sn
	await agac.create_timer(Ayarlar.sayi("test_duraklat_sure")).timeout
	var durdu: bool = agac.paused and p().position == konum and Oyun.sure_sn == sure
	durdu = kontrol(_duraklatma_okunur(), "duraklatma_paneli_okunur") and durdu
	Oyun.duraklat_degistir()
	var ayni: bool = p().position == konum
	await kare()
	var adim: float = Ayarlar.sayi("hiz") * p().get_physics_process_delta_time() * 2.0 + Ayarlar.sayi("test_tolerans")
	var mesafe: float = p().position.distance_to(konum)
	birak()
	var olaylar: Array[String] = []
	for satir: String in FileAccess.get_file_as_string(Olaylar.gunluk_yolu).strip_edges().split("\n"):
		var veri: Dictionary = JSON.parse_string(satir) as Dictionary
		var alanlar: Array[Variant] = veri.keys()
		alanlar.sort()
		temiz = alanlar == ["ilgili", "olay", "oturum", "sure_sn", "surum"] and temiz
		olaylar.append(veri["olay"])
	for olay: String in Olaylar.OLAYLAR:
		temiz = kontrol(olay in olaylar, "gunluk:" + olay) and temiz
	return kontrol(temiz and durdu and ayni and mesafe > 0.0 and mesafe <= adim, "duraklat_ve_temiz_tekrar")
