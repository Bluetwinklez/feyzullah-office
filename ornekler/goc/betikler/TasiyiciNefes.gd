class_name TasiyiciNefes
extends Node3D
var _zaman: float = 0.0
var _ses: AudioStreamPlayer3D
var _isik: OmniLight3D

func _ready() -> void:
	var model: MerkezModeli = MerkezModeli.new()
	model.name = "Model"
	add_child(model)
	model.kur("tasiyici_nefes_kesesi")
	_isik = OmniLight3D.new()
	_isik.light_color = Color(Ayarlar.denge["asama2"]["amber"])
	_isik.omni_range = float(Ayarlar.denge["asama2"]["tepki_menzil"])
	_isik.shadow_enabled = false
	add_child(_isik)
	_ses = AudioStreamPlayer3D.new()
	_ses.stream = _nefes_sesi()
	add_child(_ses)
	_ses.play()
	Olaylar.durum_degisti.connect(_guncelle)
	_guncelle()

func _nefes_sesi() -> AudioStream:
	var yol: String = Ayarlar.denge["asama3"]["ilerleme"]["nefes_ses_yolu"]
	if ResourceLoader.exists(yol):
		var mp3: AudioStreamMP3 = load(yol) as AudioStreamMP3
		if mp3 != null:
			mp3 = mp3.duplicate() as AudioStreamMP3
			mp3.loop = true
			return mp3
	var veri: Dictionary = Ayarlar.denge["asama2"]
	var akis: AudioStreamWAV = AudioStreamWAV.new()
	var hiz: int = int(Ayarlar.sayi("ses_ornek_hiz"))
	var sayi: int = int(float(veri["nefes_ses_sure"]) * hiz)
	var pcm: PackedByteArray = PackedByteArray()
	pcm.resize(sayi * Geometri.PCM_ORNEK_BAYT)
	for i: int in range(sayi):
		var oran: float = float(i) / float(sayi)
		var deger: float = sin(TAU * float(veri["nefes_frekans"]) * float(i) / hiz) * sin(PI * oran) * float(veri["nefes_ses_genlik"])
		pcm.encode_s16(i * Geometri.PCM_ORNEK_BAYT, int(deger * Geometri.PCM_S16_TEPE))
	akis.format = AudioStreamWAV.FORMAT_16_BITS
	akis.mix_rate = hiz
	akis.data = pcm
	akis.loop_mode = AudioStreamWAV.LOOP_FORWARD
	akis.loop_begin = 0
	akis.loop_end = sayi
	return akis

func _guncelle() -> void:
	_isik.light_energy = float(Ayarlar.denge["asama2"]["tepki_enerji"]) if Oyun.kese_konumu == Oyun.CANLI or Oyun.soluk_konumu == Oyun.CANLI else 0.0
	_ses.pitch_scale = float(Ayarlar.denge["asama2"]["nefes_ses_bagli"]) if Oyun.kese_konumu == Oyun.CANLI else 1.0
	if Oyun.soluk_konumu == Oyun.CANLI:
		_ses.pitch_scale = float(Ayarlar.denge["asama3"]["ilerleme"]["saglikli_nefes_ses"])

func _physics_process(delta: float) -> void:
	var veri: Dictionary = Ayarlar.denge["asama2"]
	var periyot: float = float(veri["nefes_bagli_periyot"] if Oyun.kese_konumu == Oyun.CANLI else veri["nefes_periyot"])
	if Oyun.soluk_konumu == Oyun.CANLI:
		periyot = float(Ayarlar.denge["asama3"]["ilerleme"]["saglikli_nefes_periyot"])
	_zaman = fmod(_zaman + delta / periyot, 1.0)
	scale.y = 1.0 + sin(TAU * _zaman) * float(veri["nefes_genlik"])

func _exit_tree() -> void:
	if is_instance_valid(_ses):
		_ses.stop()
		_ses.stream = null
	if Olaylar.durum_degisti.is_connected(_guncelle):
		Olaylar.durum_degisti.disconnect(_guncelle)
