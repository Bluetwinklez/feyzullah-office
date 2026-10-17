extends SceneTree

## Tipli sahne testlerini autoload kayıtlarından sonra yükler.
func _initialize() -> void:
	call_deferred("_baslat")

func _baslat() -> void:
	var senaryolar: GDScript = load("res://test/senaryolar.gd") as GDScript
	if senaryolar == null or not senaryolar.can_instantiate():
		print(TranslationServer.translate("test.sonuc") % [0, 1])
		quit(1)
		return
	var bot: Node = senaryolar.new() as Node
	bot.set("varlik_testleri", load("res://test/varliklar.gd") as GDScript)
	bot.set("asama2_testleri", load("res://test/asama2.gd") as GDScript)
	bot.set("asama3_testleri", load("res://test/asama3.gd") as GDScript)
	bot.set("ayarlar_testleri", load("res://test/ayarlar.gd") as GDScript)
	bot.set("k8_testi", load("res://test/k8.gd") as GDScript)
	root.add_child(bot)
