extends Node

## Gerçek Avlu örnekleriyle, bağımsız ve girişten çağrılabilir kabul denemeleri.
@onready var root: Window = get_tree().root
var paused: bool:
	get:
		return get_tree().paused
	set(deger):
		get_tree().paused = deger
var _denge: Dictionary = {}
var _gecen: int
var _kalan: int
var _hasar_olaylari: int
var _hazirlik_olaylari: int
var _olum_olaylari: int
var _tarama_olaylari: int
var _vurus_id: String = ""
var _avlu: Node3D
var varlik_testleri: GDScript
var asama2_testleri: GDScript
var asama3_testleri: GDScript
var ayarlar_testleri: GDScript
var k8_testi: GDScript

func _ready() -> void:
	_denge = JSON.parse_string(FileAccess.get_file_as_string("res://data/denge.json")) as Dictionary
	_gecen = 0
	_kalan = _gecen
	call_deferred("_calistir")

func _sayi(anahtar: String) -> float:
	return float(_denge[anahtar])

func _metin(anahtar: String) -> String:
	return TranslationServer.translate(anahtar)

func _fizik_bekle() -> void:
	for _kare: int in range(int(_sayi("test_senkron_kare"))):
		await get_tree().physics_frame
		await get_tree().process_frame

func _bekle(sure: float) -> void:
	await get_tree().create_timer(sure).timeout
	await _fizik_bekle()

func _yeni_avlu() -> void:
	paused = false
	root.get_node("Oyun").kestirme_acik = false
	_hasar_olaylari = 0
	_hazirlik_olaylari = 0
	_olum_olaylari = 0
	_tarama_olaylari = 0
	_vurus_id = ""
	_avlu = (load("res://sahneler/bolge.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(_avlu)
	await _fizik_bekle()

func _temizle() -> void:
	paused = false
	Input.action_release("ileri")
	Input.action_release("sag")
	if is_instance_valid(_avlu):
		_avlu.queue_free()
	await _fizik_bekle()

func _kaydet(anahtar: String, gecti: bool) -> void:
	if gecti:
		_gecen += 1
	else:
		_kalan += 1
	print(_metin("test.satir") % [_metin(anahtar), _metin("test.gecti" if gecti else "test.kaldi")])

func _kontrol(kosul: bool, anahtar: String) -> bool:
	if not kosul:
		print(_metin("test.detay") % _metin(anahtar))
	return kosul

func _can_kaydi(_can: float) -> void:
	_hasar_olaylari += 1

func _hazirlik_kaydi() -> void:
	_hazirlik_olaylari += 1

func _olum_kaydi() -> void:
	_olum_olaylari += 1

func _tarama_kaydi(_yaricap: float) -> void:
	_tarama_olaylari += 1

func _saldiri_kaydi(_adim: int, kimlik: String) -> void:
	_vurus_id = kimlik

func _hareket() -> bool:
	var p: Oyuncu = _avlu.get_node("Oyuncu") as Oyuncu
	var duz: Vector3 = p.hareket_vektoru_hesapla(Vector2.RIGHT) * _sayi("hiz")
	var capraz: Vector3 = p.hareket_vektoru_hesapla(Vector2.ONE) * _sayi("hiz")
	return _kontrol(absf(duz.length() - capraz.length()) <= _sayi("test_tolerans") and absf(duz.length() - _sayi("hiz")) <= _sayi("test_tolerans") and p.hareket_vektoru_hesapla(Vector2.ZERO).is_zero_approx(), "test.hareket_detay")

func _tek_vurus() -> bool:
	var p: Oyuncu = _avlu.get_node("Oyuncu") as Oyuncu
	var e: Avci = _avlu.get_node("Avci") as Avci
	p.set_physics_process(false)
	e.set_physics_process(false)
	p.position = Vector3.ZERO
	p.rotation = Vector3.ZERO
	e.position = Vector3.FORWARD * _sayi("test_hedef_uzaklik")
	p.saldirdi.connect(_saldiri_kaydi)
	e.can_degisti.connect(_can_kaydi)
	await _fizik_bekle()
	var once: float = e.can
	var kabul: bool = p.saldir()
	var hasarlar: Array[Variant] = _denge["hasarlar"]
	var hasar: float = float(hasarlar.front())
	var ilk: bool = kabul and not _vurus_id.is_empty() and absf(once - e.can - hasar) <= _sayi("test_tolerans")
	e.hasar_al(hasar, _vurus_id)
	e.hasar_al(hasar, _vurus_id)
	return _kontrol(ilk and absf(once - e.can - hasar) <= _sayi("test_tolerans") and _hasar_olaylari == 1, "test.vurus_detay")

func _olu_dusman() -> bool:
	var p: Oyuncu = _avlu.get_node("Oyuncu") as Oyuncu
	var e: Avci = _avlu.get_node("Avci") as Avci
	p.set_physics_process(false)
	p.position = Vector3.ZERO
	e.position = Vector3.FORWARD * _sayi("test_yakin_uzaklik")
	e.saldiri_hazirlaniyor.connect(_hazirlik_kaydi)
	e.oldu.connect(_olum_kaydi)
	e.can_degisti.connect(_can_kaydi)
	await _fizik_bekle()
	var zaman: float = 0.0
	while _hazirlik_olaylari == 0 and zaman < _sayi("test_zaman_asimi"):
		await _fizik_bekle()
		zaman += root.get_physics_process_delta_time() * _sayi("test_senkron_kare")
	var basladi: bool = _hazirlik_olaylari > 0
	e.hasar_al(_sayi("avci_can"), "test.olum")
	var konum: Vector3 = e.global_position
	var once: float = p.can
	var olay: int = _hasar_olaylari
	var hazirlik: int = _hazirlik_olaylari
	e.hasar_al(_sayi("avci_hasar"), "test.olum_tekrar")
	await _bekle(_sayi("avci_hazirlik") + _sayi("avci_atilma_sure") + _sayi("avci_bekleme"))
	return _kontrol(basladi and p.can == once and e.can == 0.0 and _hasar_olaylari == olay and _hazirlik_olaylari == hazirlik and _olum_olaylari == 1 and e.collision_layer == 0 and e.collision_mask == 0 and not e.is_physics_processing() and e.global_position.distance_to(konum) <= _sayi("test_tolerans"), "test.olum_detay")

func _tarama() -> bool:
	var p: Oyuncu = _avlu.get_node("Oyuncu") as Oyuncu
	var e: Avci = _avlu.get_node("Avci") as Avci
	var d: KirilganDuvar = _avlu.get_node("KirilganDuvar") as KirilganDuvar
	e.set_physics_process(false)
	p.set_physics_process(false)
	p.position = d.position + Vector3.BACK * _sayi("test_hedef_uzaklik")
	await _fizik_bekle()
	p.yanki.tarama_yapildi.connect(_tarama_kaydi)
	var ilk: bool = p.yanki.tara() and d.gorunur_mu()
	var bekleme: float = p.yanki.bekleme
	var erken: bool = not p.yanki.tara() and p.yanki.bekleme == bekleme and _tarama_olaylari == 1
	await _bekle(_sayi("tarama_bekleme") - _sayi("test_erken_pay"))
	var sure_bitmedi: bool = p.yanki.bekleme > 0.0 and not p.yanki.tara() and not d.gorunur_mu()
	await _bekle(_sayi("test_erken_pay") + _sayi("test_kisa_sure"))
	var tekrar: bool = p.yanki.tara() and d.gorunur_mu() and _tarama_olaylari == 1 + 1
	return _kontrol(ilk and erken and sure_bitmedi and tekrar, "test.tarama_detay")

func _duvar() -> bool:
	var p: Oyuncu = _avlu.get_node("Oyuncu") as Oyuncu
	var e: Avci = _avlu.get_node("Avci") as Avci
	var d: KirilganDuvar = _avlu.get_node("KirilganDuvar") as KirilganDuvar
	# Fare yönlendirmesini ayır; gerçek saldırı zamanlayıcısı işlemeye devam etsin.
	p.kamera = null
	e.set_physics_process(false)
	p.position = Vector3(0.0, 0.0, d.position.z + _sayi("test_hedef_uzaklik"))
	p.rotation = Vector3.ZERO
	await _fizik_bekle()
	var once: float = d.can
	var yol: Vector3 = Vector3.FORWARD * _sayi("test_yol_uzunluk")
	var kapali: bool = p.test_move(p.global_transform, yol)
	var hasarlar: Array[Variant] = _denge["hasarlar"]
	var deneme: int = int(ceil(_sayi("duvar_can") / float(hasarlar.front())))
	var kabul: bool = true
	for _adim: int in range(deneme):
		kabul = p.saldir() and kabul
		await _bekle(_sayi("saldiri_aralik") + _sayi("test_kisa_sure"))
	var gizli: bool = kabul and d.can == once and not d.yikildi_mi() and kapali
	var tarandi: bool = p.yanki.tara() and d.gorunur_mu()
	for _adim: int in range(deneme):
		if d.yikildi_mi():
			break
		kabul = p.saldir() and kabul
		await _bekle(_sayi("saldiri_aralik") + _sayi("test_kisa_sure"))
	await _fizik_bekle()
	var acik: bool = not p.test_move(p.global_transform, yol)
	return _kontrol(gizli and tarandi and kabul and d.yikildi_mi() and d.collision_layer == 0 and d.collision_mask == 0 and acik and bool(root.get_node("Oyun").kestirme_acik), "test.duvar_detay")

func _duraklatma() -> bool:
	var p: Oyuncu = _avlu.get_node("Oyuncu") as Oyuncu
	var e: Avci = _avlu.get_node("Avci") as Avci
	Input.action_press("sag")
	await _bekle(_sayi("test_kisa_sure"))
	var hiz: bool = p.velocity.length() > 0.0 and e.velocity.length() > 0.0
	p.yanki.tara()
	root.get_node("Oyun").duraklat_degistir()
	var durdu: bool = paused
	var p_once: Vector3 = p.position
	var e_once: Vector3 = e.position
	var bekleme: float = p.yanki.bekleme
	await _bekle(_sayi("test_duraklat_sure"))
	durdu = durdu and p.position.distance_to(p_once) <= _sayi("test_tolerans") and e.position.distance_to(e_once) <= _sayi("test_tolerans") and p.yanki.bekleme == bekleme
	root.get_node("Oyun").duraklat_degistir()
	var devam: bool = not paused and p.position == p_once and e.position == e_once
	await _fizik_bekle()
	var adim: float = _sayi("hiz") * root.get_physics_process_delta_time() * _sayi("test_senkron_kare") + _sayi("test_tolerans")
	var mesafe: float = p.position.distance_to(p_once)
	devam = devam and mesafe > _sayi("test_tolerans") and mesafe <= adim and e.position.distance_to(e_once) > _sayi("test_tolerans") and p.yanki.bekleme < bekleme
	return _kontrol(hiz and durdu and devam, "test.duraklat_detay")

func _calistir() -> void:
	await _yeni_avlu()
	_kaydet("test.hareket", _hareket())
	await _temizle()
	await _yeni_avlu()
	_kaydet("test.vurus", await _tek_vurus())
	await _temizle()
	await _yeni_avlu()
	_kaydet("test.olum", await _olu_dusman())
	await _temizle()
	await _yeni_avlu()
	_kaydet("test.tarama", await _tarama())
	await _temizle()
	await _yeni_avlu()
	_kaydet("test.duvar", await _duvar())
	await _temizle()
	await _yeni_avlu()
	_kaydet("test.duraklat", await _duraklatma())
	await _temizle()
	await _bekle(_sayi("ses_sure"))
	var varlik_botu: RefCounted = varlik_testleri.new() as RefCounted
	var varlik_sonuclari: Array[Dictionary] = await varlik_botu.call("calistir", get_tree(), _denge)
	var asama3_varliklari: Array[Dictionary] = []
	for sonuc: Dictionary in varlik_sonuclari:
		if sonuc.get("asama", 1) == 3:
			asama3_varliklari.append(sonuc)
		else:
			_kaydet(sonuc["ad"], sonuc["gecti"])
	await _bekle(_sayi("ses_sure"))
	print(_metin("test.asama1_ozet") % [_gecen, _kalan])
	var asama2_botu: RefCounted = asama2_testleri.new() as RefCounted
	var asama2_sonuclari: Array[Dictionary] = await asama2_botu.call("calistir", get_tree())
	var once_gecen: int = _gecen
	var once_kalan: int = _kalan
	for sonuc: Dictionary in asama2_sonuclari:
		_kaydet(sonuc["ad"], sonuc["gecti"])
	print(_metin("test.asama2_ozet") % [_gecen - once_gecen, _kalan - once_kalan])
	once_gecen = _gecen
	once_kalan = _kalan
	for sonuc: Dictionary in asama3_varliklari:
		_kaydet(sonuc["ad"], sonuc["gecti"])
	var asama3_botu: RefCounted = asama3_testleri.new() as RefCounted
	var asama3_sonuclari: Array[Dictionary] = await asama3_botu.call("calistir", get_tree())
	for sonuc: Dictionary in asama3_sonuclari:
		_kaydet(sonuc["ad"], sonuc["gecti"])
	print(_metin("test.asama3_ozet") % [_gecen - once_gecen, _kalan - once_kalan])
	once_gecen = _gecen
	once_kalan = _kalan
	var ayarlar_botu: RefCounted = ayarlar_testleri.new() as RefCounted
	var ayarlar_sonuclari: Array[Dictionary] = await ayarlar_botu.call("calistir", get_tree())
	for sonuc: Dictionary in ayarlar_sonuclari:
		_kaydet(sonuc["ad"], sonuc["gecti"])
	print(_metin("test.ayarlar_ozet") % [_gecen - once_gecen, _kalan - once_kalan])
	once_gecen = _gecen
	once_kalan = _kalan
	var k8_botu: RefCounted = k8_testi.new() as RefCounted
	var k8_sonuclari: Array[Dictionary] = await k8_botu.call("calistir", get_tree())
	for sonuc: Dictionary in k8_sonuclari:
		_kaydet(sonuc["ad"], sonuc["gecti"])
	print(_metin("test.kabul_ozet") % [_gecen - once_gecen, _kalan - once_kalan])
	print(_metin("test.sonuc") % [_gecen, _kalan])
	get_tree().quit(0 if _kalan == 0 else 1)
