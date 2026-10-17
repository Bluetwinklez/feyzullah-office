class_name SolukCekirdegi
extends Node3D

## Başarılı kalkan açılışında koruma süresini bildirir.
signal kalkan_acildi(sure: float)
var kalan: float = 0.0
var bekleme: float = 0.0
var aktif: bool:
	get:
		return kalan > 0.0 and Oyun.soluk_konumu == Oyun.OYUNCU
var _gorsel: OrganGorseli

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	position = Ayarlar.vektor("organ_konum")
	_gorsel = OrganGorseli.new()
	_gorsel.name = "Gorsel"
	add_child(_gorsel)
	Olaylar.durum_degisti.connect(_guncelle)
	_guncelle()

func kullan() -> bool:
	var oyuncu: Oyuncu = Oyun.etkin_oyuncu()
	if get_tree().paused or Oyun.arayuz_acik or not is_instance_valid(oyuncu) or oyuncu.can <= 0.0 or Oyun.soluk_konumu != Oyun.OYUNCU or bekleme > 0.0:
		return false
	kalan = float(Ayarlar.denge["asama2"]["soluk_sure"])
	bekleme = float(Ayarlar.denge["asama2"]["soluk_bekleme"])
	Geometri.ses(self, "ses_sis_kalkani")
	Olaylar.yaz("organ_kullanildi", "soluk")
	kalkan_acildi.emit(kalan)
	return true

func _physics_process(delta: float) -> void:
	kalan = maxf(0.0, kalan - delta)
	bekleme = maxf(0.0, bekleme - delta)

func _guncelle() -> void:
	visible = Oyun.soluk_konumu == Oyun.OYUNCU
	if not visible:
		kalan = 0.0

func _exit_tree() -> void:
	if Olaylar.durum_degisti.is_connected(_guncelle):
		Olaylar.durum_degisti.disconnect(_guncelle)
