class_name Gorev
extends RefCounted

## Ana görev yalnız beklenen olayla ileri gider; aktarım geri alınınca gerilemez.
enum Durum { M0_UYANIS, M1_TESISE_IN, M2_YANKIYI_GETIR, M3_DERIN_GECIT, M4_NEFES, M5_YOLCULUK, M6_BITTI }
var durum: Durum = Durum.M0_UYANIS

func gecis(olay: StringName) -> bool:
	var beklenen: Array[StringName] = [&"tasiyici_dinlendi", &"yanki_bulundu", &"yanki_baglandi", &"soluk_bulundu", &"soluk_baglandi", &"yolculuk_onaylandi"]
	if int(durum) >= beklenen.size() or olay != beklenen[durum]:
		return false
	durum = (int(durum) + 1) as Durum
	return true

func hedef_anahtari() -> String:
	return ["hedef.m0", "hedef.m1", "hedef.m2", "hedef.m3", "hedef.m4", "hedef.m5", "hedef.m6"][durum]
