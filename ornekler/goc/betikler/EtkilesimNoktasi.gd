class_name EtkilesimNoktasi
extends Node3D
## Mesafe denetiminden geçmiş etkileşimi sahne sahibine iletir.
signal kullanildi(oyuncu: Oyuncu)
@export var eylem: StringName
@export var metin_anahtari: String
var etkin: bool = true

func _ready() -> void:
	add_to_group("etkilesilebilir")

func erisilebilir(oyuncu: Oyuncu) -> bool:
	return etkin and is_instance_valid(oyuncu) and oyuncu.can > 0.0 and oyuncu.global_position.distance_to(global_position) <= float(Ayarlar.denge["asama2"]["etkilesim_menzil"])

func etkiles(oyuncu: Oyuncu) -> bool:
	if get_tree().paused or Oyun.arayuz_acik or not erisilebilir(oyuncu):
		return false
	kullanildi.emit(oyuncu)
	return true
