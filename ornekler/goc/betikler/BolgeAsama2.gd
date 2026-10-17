class_name BolgeAsama2
extends Node3D

func kur(oyuncu: Oyuncu, avci: Avci) -> void:
	Oyun.oyuncu_bagla(oyuncu, "bolge")
	var veri: Dictionary = Ayarlar.denge["asama2"]
	var kapi: EtkilesimNoktasi = _nokta("DonusKapisi", &"kapi", "etkilesim.merkez", veri["bolge_kapi"])
	kapi.kullanildi.connect(_merkeze_git)
	for kapi_veri: Dictionary in Ayarlar.denge["asama3"]["avlu_kapilar"]:
		Mekan.kapi_ekle(self, kapi_veri)
	var gecit: DerinGecit = DerinGecit.new()
	gecit.name = "DerinGecit"
	add_child(gecit)
	gecit.position = Ayarlar.diziden_vektor(veri["gecit_konum"])
	SeferDusmani.bagla(avci, "avci", "bolge:avci")

func _nokta(ad: String, eylem: StringName, metin: String, konum: Array[Variant]) -> EtkilesimNoktasi:
	var nokta: EtkilesimNoktasi = EtkilesimNoktasi.new()
	nokta.name = ad
	nokta.eylem = eylem
	nokta.metin_anahtari = metin
	add_child(nokta)
	nokta.position = Ayarlar.diziden_vektor(konum)
	return nokta

func _merkeze_git(_oyuncu: Oyuncu) -> void:
	Oyun.yer_degistir("merkez")
