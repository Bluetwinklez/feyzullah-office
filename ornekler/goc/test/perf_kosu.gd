extends SceneTree

## Yalnız hata ayıklama ölçümü: `godot --path . --script res://test/perf_kosu.gd -- --perf-kosu`.
## test/ release paketinden dışlıdır; argüman olmadan hiçbir şey yapmadan çıkar.
func _initialize() -> void:
	call_deferred("_baslat")

func _baslat() -> void:
	if not OS.is_debug_build() or not "--perf-kosu" in OS.get_cmdline_user_args():
		quit(1)
		return
	var olcer: GDScript = load("res://test/perf_olcer.gd") as GDScript
	root.add_child(olcer.new() as Node)
