## Uygulama boyunca denge verisini, çevirileri ve oyuncu ayarlarını sağlar. Oynanış durumu tutmaz.
## Ayarlar açılışta `ayar_yolu`ndan okunur ve uygulanır; varsayılanlar yalnız denge.json `ayarlar` alanındadır.
extends Node
const BOLUM: String = "ayarlar"
var denge: Dictionary = {}
## Testler gerçek kullanıcı dosyasına dokunmamak için bu yolu değiştirir.
var ayar_yolu: String = "user://ayarlar.cfg"
## Ana ses düzeyi, lineer 0..1; Master bus'a dB olarak uygulanır.
var ses_duzeyi: float
var sarsinti: bool
var tam_ekran: bool
var cozunurluk: Vector2i
## Başsız modda pencere ölçülemediği için son uygulanmak istenen değerler.
var istenen_pencere_modu: DisplayServer.WindowMode = DisplayServer.WINDOW_MODE_WINDOWED
var istenen_boyut: Vector2i

func _ready() -> void:
	denge = JSON.parse_string(FileAccess.get_file_as_string("res://data/denge.json")) as Dictionary
	# CSV içe aktarımı bu kaynağı üretir; ham CSV release paketinde bulunmayabilir.
	var ceviri: Translation = load("res://data/metinler.tr.translation") as Translation
	TranslationServer.add_translation(ceviri)
	TranslationServer.set_locale("tr")
	yukle()
	uygula()
func sayi(anahtar: String) -> float:
	return float(denge[anahtar])
func vektor(anahtar: String) -> Vector3:
	var a: Array[Variant] = denge[anahtar]
	return Vector3(float(a.front()), float(a[1]), float(a.back()))

func diziden_vektor(dizi: Array[Variant]) -> Vector3:
	return Vector3(float(dizi[0]), float(dizi[1]), float(dizi[2]))

func ayar_sayi(anahtar: String) -> float:
	return float(denge[BOLUM][anahtar])

func cozunurlukler() -> Array[Vector2i]:
	var liste: Array[Vector2i] = []
	for boyut: Array in denge[BOLUM]["cozunurlukler"]:
		liste.append(Vector2i(int(boyut[0]), int(boyut[1])))
	return liste

func varsayilanlar() -> void:
	var v: Dictionary = denge[BOLUM]
	ses_duzeyi = float(v["ses_duzeyi"])
	sarsinti = bool(v["sarsinti"])
	tam_ekran = bool(v["tam_ekran"])
	cozunurluk = Vector2i(int(v["cozunurluk"][0]), int(v["cozunurluk"][1]))

## Dosya yoksa, bozuksa ya da anahtar eksik/geçersizse ilgili değer varsayılan kalır. Dosya okunduysa true.
func yukle() -> bool:
	varsayilanlar()
	var dosya: ConfigFile = ConfigFile.new()
	if not FileAccess.file_exists(ayar_yolu) or dosya.load(ayar_yolu) != OK:
		return false
	var ses: Variant = dosya.get_value(BOLUM, "ses_duzeyi", ses_duzeyi)
	if ses is float or ses is int:
		ses_duzeyi = clampf(float(ses), 0.0, 1.0)
	var sars: Variant = dosya.get_value(BOLUM, "sarsinti", sarsinti)
	if sars is bool:
		sarsinti = sars
	var tam: Variant = dosya.get_value(BOLUM, "tam_ekran", tam_ekran)
	if tam is bool:
		tam_ekran = tam
	var boyut: Variant = dosya.get_value(BOLUM, "cozunurluk", cozunurluk)
	if boyut is Vector2i and cozunurlukler().has(boyut):
		cozunurluk = boyut
	return true

func kaydet() -> Error:
	var dosya: ConfigFile = ConfigFile.new()
	dosya.set_value(BOLUM, "ses_duzeyi", ses_duzeyi)
	dosya.set_value(BOLUM, "sarsinti", sarsinti)
	dosya.set_value(BOLUM, "tam_ekran", tam_ekran)
	dosya.set_value(BOLUM, "cozunurluk", cozunurluk)
	return dosya.save(ayar_yolu)

func uygula() -> void:
	var bus: int = AudioServer.get_bus_index("Master")
	AudioServer.set_bus_mute(bus, ses_duzeyi <= 0.0)
	if ses_duzeyi > 0.0:
		AudioServer.set_bus_volume_db(bus, linear_to_db(ses_duzeyi))
	istenen_pencere_modu = DisplayServer.WINDOW_MODE_FULLSCREEN if tam_ekran else DisplayServer.WINDOW_MODE_WINDOWED
	istenen_boyut = cozunurluk
	if DisplayServer.get_name() == "headless":
		return
	DisplayServer.window_set_mode(istenen_pencere_modu)
	if not tam_ekran:
		DisplayServer.window_set_size(istenen_boyut)
		var ekran: Rect2i = DisplayServer.screen_get_usable_rect(DisplayServer.window_get_current_screen())
		DisplayServer.window_set_position(ekran.position + (ekran.size - istenen_boyut) / 2)
