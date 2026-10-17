shader_type spatial;
render_mode specular_disabled;

uniform vec4 tas_renk : source_color;
uniform vec4 yol_renk : source_color;
uniform vec4 derz_renk : source_color;
uniform float karo_boyut;
uniform float derz_eni;
uniform float cesitlilik;
uniform float yol_yari_en;
uniform float yol_gecis;
uniform float puruzluluk;
varying vec3 dunya_konumu;

void vertex() {
	dunya_konumu = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 karo = dunya_konumu.xz / karo_boyut;
	vec2 hucre = floor(karo);
	vec2 ara = fract(karo);
	float sinir = min(ara.x, ara.y);
	float derz = smoothstep(derz_eni / karo_boyut, derz_eni / karo_boyut + fwidth(sinir), sinir);
	float degisim = mix(1.0 - cesitlilik, 1.0, mod(hucre.x + hucre.y, 2.0));
	float yol = 1.0 - smoothstep(yol_yari_en, yol_yari_en + yol_gecis, abs(dunya_konumu.x));
	vec3 tas = mix(tas_renk.rgb, yol_renk.rgb, yol) * degisim;
	ALBEDO = mix(derz_renk.rgb, tas, derz);
	ROUGHNESS = puruzluluk;
}
