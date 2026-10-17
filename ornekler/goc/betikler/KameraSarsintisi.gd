class_name KameraSarsintisi
extends Node
## Tüm ekran sarsıntılarının tek giriş noktası `sars()`tır. Ayarlar.sarsinti kapalıyken kamera ofsetine dokunulmaz.
## Kamera konumu takip için her karede yazıldığından sarsıntı yalnız h_offset/v_offset ile verilir.
const DUGUM_ADI: StringName = &"Sarsinti"
var kamera: Camera3D
var _guc: float
var _sure: float
var _kalan: float
var _rastgele: RandomNumberGenerator = RandomNumberGenerator.new()

## Sarsıntı başladıysa true; ayar kapalıysa ya da kamera yoksa false. Negatif değer denge.json varsayılanıdır.
static func sars(hedef: Camera3D, guc: float = -1.0, sure: float = -1.0) -> bool:
	if not Ayarlar.sarsinti or not is_instance_valid(hedef):
		return false
	if guc < 0.0:
		guc = Ayarlar.ayar_sayi("sarsinti_guc")
	if sure < 0.0:
		sure = Ayarlar.ayar_sayi("sarsinti_sure")
	if guc <= 0.0 or sure <= 0.0:
		return false
	var sarsinti: KameraSarsintisi = hedef.get_node_or_null(NodePath(DUGUM_ADI)) as KameraSarsintisi
	if sarsinti == null:
		sarsinti = KameraSarsintisi.new()
		sarsinti.name = DUGUM_ADI
		sarsinti.kamera = hedef
		hedef.add_child(sarsinti)
	sarsinti._guc = maxf(sarsinti._guc if sarsinti._kalan > 0.0 else 0.0, guc)
	sarsinti._sure = sure
	sarsinti._kalan = sure
	return true

func _process(delta: float) -> void:
	if _kalan <= 0.0:
		return
	_kalan = maxf(0.0, _kalan - delta)
	if not Ayarlar.sarsinti or _kalan <= 0.0:
		_kalan = 0.0
		kamera.h_offset = 0.0
		kamera.v_offset = 0.0
		return
	var genlik: float = _guc * _kalan / _sure
	kamera.h_offset = _rastgele.randf_range(-genlik, genlik)
	kamera.v_offset = _rastgele.randf_range(-genlik, genlik)
