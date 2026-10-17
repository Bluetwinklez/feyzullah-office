class_name SonKarsilasma
extends Node3D

## Son karşılaşmanın düşmanları oluşturulunca yayılır.
signal basladi
## Bütün karşılaşma düşmanları öldüğünde yayılır.
signal temizlendi
@export var oyuncu_yolu: NodePath
@onready var oyuncu: Oyuncu = get_node_or_null(oyuncu_yolu) as Oyuncu
var tetiklendi: bool = false
var kalan_dusman: int = 0

func tetikle() -> bool:
	if tetiklendi or not Oyun.gecit_acik or not is_instance_valid(oyuncu) or oyuncu.can <= 0.0:
		return false
	tetiklendi = true
	var sira: int = 0
	for veri: Dictionary in Ayarlar.denge["asama3"]["son_karsilasma"]["dusmanlar"]:
		var kimlik: String = "derin_gecit:son:" + str(sira)
		sira += 1
		if Oyun.yenilen_dusmanlar.has(kimlik):
			continue
		var dusman: Node3D = (load(veri["sahne"]) as PackedScene).instantiate() as Node3D
		add_child(dusman)
		dusman.position = Ayarlar.diziden_vektor(veri["konum"])
		if dusman is Avci:
			(dusman as Avci).hedef = oyuncu
			(dusman as Avci).oldu.connect(_yenildi, CONNECT_ONE_SHOT)
		elif dusman is YeniDusman:
			(dusman as YeniDusman).hedef = oyuncu
			(dusman as YeniDusman).oldu.connect(_yenildi, CONNECT_ONE_SHOT)
		SeferDusmani.bagla(dusman as CharacterBody3D, "avci" if dusman is Avci else "agir", kimlik)
		kalan_dusman += 1
	basladi.emit()
	if kalan_dusman == 0:
		temizlendi.emit()
	return true

func _yenildi() -> void:
	kalan_dusman -= 1
	if kalan_dusman == 0:
		temizlendi.emit()

func _physics_process(_delta: float) -> void:
	if tetiklendi or not is_instance_valid(oyuncu):
		return
	var veri: Dictionary = Ayarlar.denge["asama3"]["son_karsilasma"]
	if oyuncu.global_position.distance_to(Ayarlar.diziden_vektor(veri["tetik_konum"])) <= float(veri["tetik_yaricap"]):
		tetikle()
