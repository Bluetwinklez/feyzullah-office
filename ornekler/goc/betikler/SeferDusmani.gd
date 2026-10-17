class_name SeferDusmani
extends RefCounted

## Aynı seferde öldürülen örnekleri tekrar ödüllendirmez; Avcı davranışını değiştirmez.
static func bagla(dusman: CharacterBody3D, tur: String, kimlik: String) -> void:
	if not Oyun.oturum_aktif:
		return
	if Oyun.yenilen_dusmanlar.has(kimlik):
		dusman.set("can", 0.0)
		dusman.collision_layer = 0
		dusman.collision_mask = 0
		dusman.set_physics_process(false)
		dusman.hide()
		return
	if dusman.has_signal(&"oldu"):
		dusman.connect(&"oldu", Oyun.kehribar_kazan.bind(tur, kimlik), CONNECT_ONE_SHOT)
