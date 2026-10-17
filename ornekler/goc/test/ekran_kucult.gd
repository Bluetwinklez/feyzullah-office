extends SceneTree

## README ekran görüntüleri: `godot --headless --path . --script res://test/ekran_kucult.gd -- kaynak.png=hedef.png ...`
## Her kareyi en çok `ekran_goruntusu.genislik` piksele oranı koruyarak küçültür ve PNG yazar.
func _initialize() -> void:
	var denge: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/denge.json")) as Dictionary
	var genislik: int = int(denge["ekran_goruntusu"]["genislik"])
	var hata: int = 0
	for cift: String in OS.get_cmdline_user_args():
		var resim: Image = Image.load_from_file(cift.get_slice("=", 0))
		if resim == null or resim.is_empty():
			hata += 1
			continue
		if resim.get_width() > genislik:
			resim.resize(genislik, roundi(float(resim.get_height()) * genislik / resim.get_width()), Image.INTERPOLATE_LANCZOS)
		resim.convert(Image.FORMAT_RGB8)
		DirAccess.make_dir_recursive_absolute(cift.get_slice("=", 1).get_base_dir())
		hata += int(resim.save_png(cift.get_slice("=", 1)) != OK)
		print(JSON.stringify({"ekran": cift.get_slice("=", 1), "boyut": [resim.get_width(), resim.get_height()]}))
	quit(hata)
