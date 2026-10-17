class_name MekanKapisi
extends EtkilesimNoktasi

@export var hedef: String
@export var muhur_gerekli: bool = false
@export var kestirme_gerekli: bool = false

func _ready() -> void:
	super._ready()
	kullanildi.connect(_gec)

func _gec(_oyuncu: Oyuncu) -> void:
	if muhur_gerekli and not Oyun.gecit_acik:
		Olaylar.bilgi.emit("bilgi.muhur_kapali")
		return
	if kestirme_gerekli and not Oyun.kestirme_acik:
		Olaylar.bilgi.emit("bilgi.kestirme_kapali")
		return
	Oyun.yer_degistir(hedef)
