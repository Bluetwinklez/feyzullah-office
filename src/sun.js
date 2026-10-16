// Gün doğumu/batımı (NOAA gün doğumu denklemi, ±birkaç dk) ve ofis ışık seviyesi. Saf, bağımlılık yok.
const RAD = Math.PI / 180;

/** now (ms) gününün gün doğumu/batımı (UTC ms). Kutup gününde/gecesinde null. */
export function sunTimes(now, lat, lon) {
  const jd = now / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545.0 + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const decl = Math.asin(Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD));
  const cosH = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(decl)) / (Math.cos(lat * RAD) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH) / RAD;
  const toMs = (j) => (j - 2440587.5) * 86400000;
  return { sunrise: toMs(jTransit - H / 360), sunset: toMs(jTransit + H / 360) };
}

const FADE = 45 * 60_000; // alacakaranlık geçişi

/** 0 (gece) … 1 (gündüz). */
export function daylight(now, lat, lon) {
  const t = sunTimes(now, lat, lon);
  if (!t) return 1;
  const ramp = (x) => Math.min(1, Math.max(0, x));
  return Math.min(ramp((now - t.sunrise + FADE / 2) / FADE), ramp((t.sunset + FADE / 2 - now) / FADE));
}
