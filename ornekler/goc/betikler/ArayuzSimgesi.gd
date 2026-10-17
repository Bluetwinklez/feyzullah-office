class_name ArayuzSimgesi
extends Control
## Metni destekleyen yerel geometri; renk tek başına anlam taşımaz.
var tur: String = "bilgi"

func _ready() -> void:
	custom_minimum_size = Vector2.ONE * get_theme_constant("simge_boy", "Arayuz")
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _draw() -> void:
	var renk: Color = get_theme_color("vurgu", "Arayuz")
	var merkez: Vector2 = Vector2(size.x, minf(size.y, size.x)) * 0.5
	var yari: float = size.x * 0.25
	if tur == "sonuc":
		draw_line(merkez + Vector2(-yari, -yari), merkez + Vector2(yari, -yari), renk, 2.0)
		draw_line(merkez + Vector2(0.0, -yari * 2.0), merkez, renk, 2.0)
		draw_line(merkez + Vector2(-yari, yari), merkez + Vector2(yari, yari), renk, 2.0)
	elif tur == "canli":
		draw_colored_polygon(PackedVector2Array([merkez + Vector2.UP * yari, merkez + Vector2.RIGHT * yari, merkez + Vector2.DOWN * yari, merkez + Vector2.LEFT * yari]), renk)
	elif tur == "oyuncu":
		draw_circle(merkez - Vector2(0.0, yari * 0.5), yari * 0.5, renk)
		draw_line(merkez, merkez + Vector2.DOWN * yari, renk, yari)
	elif tur == "soluk":
		draw_arc(merkez, yari, 0.0, TAU, 24, renk, 2.0)
		draw_line(merkez + Vector2.LEFT * yari, merkez + Vector2.RIGHT * yari, renk, 2.0)
	else:
		draw_circle(merkez, yari * 0.5, renk)
