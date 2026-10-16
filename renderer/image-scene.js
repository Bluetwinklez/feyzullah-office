// Görsel arka planlı sahne (assets/office/ofis.png, 2752×1536): oturma noktaları ve yürüme ağı.
// Koordinatlar 1100 px genişlikli önizlemede ölçüldü (K ile tam çözünürlüğe çevrilir).
// Karakterler kapıdan girer, koridor düğümleri üzerinden yürür (ızgara yerine yol ağı).

/** Önizleme (1100 px) koordinatlarıyla verilen tanımdan sahne üretir. */
export function makeScene(def) {
  // pad: [üst, alt] — görsel yukarı/aşağı genişletildiyse eklenen piksel (tam çözünürlük); koordinatlar özgün görsele göredir.
  const [OY, OB] = def.pad ?? [0, 0];
  const IMG = { w: def.w, h: def.h + OY + OB, src: def.src };
  const K = IMG.w / 1100;
  const P = (x, y) => [Math.round(x * K), Math.round(y * K) + OY];
  const rect = (r) => r.map((v, i) => Math.round(v * K) + (i === 1 ? OY : 0)); // [x, y, genişlik, yükseklik]
  const desk = ([seat, face, stand, screen = null]) => ({ pos: P(...seat), face, stand: P(...stand), screen: screen && rect(screen) });
  const spot = ([x, y, face]) => ({ pos: P(x, y), face });
  const SPOTS = { desks: def.desks.map(desk), lounge: def.lounge.map(spot), kitchen: def.kitchen.map(spot), door: P(...def.door) };
  const NODES = def.nodes.map(([x, y]) => P(x, y));
  const ADJ = NODES.map(() => []);
  for (const [a, b] of def.edges) { ADJ[a].push(b); ADJ[b].push(a); }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const nearest = (p) => NODES.reduce((best, n, i) => (dist(p, n) < dist(p, NODES[best]) ? i : best), 0);
  function nodePath(from, to) {
    const prev = new Map([[from, -1]]);
    const q = [from];
    while (q.length) {
      const n = q.shift();
      if (n === to) break;
      for (const m of ADJ[n]) if (!prev.has(m)) { prev.set(m, n); q.push(m); }
    }
    const path = [];
    for (let n = to; n !== -1 && n !== undefined; n = prev.get(n)) path.unshift(n);
    return path;
  }
  /** Karakterin hedefi { pos, face } (dinlenenler zaman zaman mutfağa kahveye gider). */
  function targetPx(agent, index = 0, t = 0, seed = 0) {
    if (agent.place === 'desk' && agent.desk != null) { const d = SPOTS.desks[agent.desk]; return { pos: d.pos, face: d.face }; }
    if (agent.place === 'standing') {
      if (agent.desk != null) return { pos: SPOTS.desks[agent.desk].stand, face: 'down' };
      return { pos: P(def.corridor[0] + (index % 8) * 40, def.corridor[1]), face: 'down' };
    }
    if (agent.activity === 'resting' && Math.floor((t / 1000 + seed * 13) / 30) % 3 === 1) return SPOTS.kitchen[index % SPOTS.kitchen.length];
    const seats = [...SPOTS.lounge, ...SPOTS.kitchen];
    return seats[index % seats.length];
  }
  const newActorPx = (pos) => ({ x: pos[0], y: pos[1], dir: 'down', walking: false, arrived: false, path: null, goal: null, step: 0 });
  const SPEED = 260; // px/sn (tam çözünürlük)
  function advancePx(actor, target, dt) {
    const a = { ...actor };
    const goal = target.pos.join(',');
    if (a.goal !== goal) {
      a.path = [...nodePath(nearest([a.x, a.y]), nearest(target.pos)).map((i) => NODES[i]), target.pos];
      a.goal = goal;
      a.arrived = false;
    }
    let budget = (SPEED * dt) / 1000;
    while (budget > 0 && a.path.length) {
      const [nx, ny] = a.path[0];
      const dx = nx - a.x; const dy = ny - a.y;
      const d = Math.hypot(dx, dy);
      if (d <= budget) { a.x = nx; a.y = ny; budget -= d; a.path = a.path.slice(1); }
      else { a.x += (dx / d) * budget; a.y += (dy / d) * budget; budget = 0; }
      if (d > 0) a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    if (!a.path.length) { a.x = target.pos[0]; a.y = target.pos[1]; a.walking = false; a.arrived = true; a.dir = target.face; }
    else { a.walking = true; a.step += dt; }
    return a;
  }
  const BOARD = def.board ? rect(def.board) : null; // duvardaki görev panosu
  // Arkası dönük oturanların önüne çizilecek arka plan parçaları (tam çözünürlük): tanımlı koltuklar + masa sandalyeleri.
  const OCCLUDERS = !def.occluders ? [] : [
    ...def.occluders.map((o) => ({ at: P(...o.at), rect: rect(o.rect) })),
    ...def.desks.filter(([, face]) => face === 'up').map(([[x, y]]) => ({ at: P(x, y), rect: rect([x - 15, y - 10, 30, 18]) })),
  ];
  return { IMG, SPOTS, targetPx, advancePx, newActorPx, BOARD, OCCLUDERS };
}

// Piksel ofis (assets/office/ofis.png): 0–5 masa grubu, 6–8 tekli masalar (gri ekranlı), 9 köşe masası (yönetici)
export const PIXEL_DEF = {
  w: 2752, h: 1536, src: '../assets/office/ofis.png',
  desks: [
    [[162, 262], 'up', [200, 300]], [[157, 167], 'up', [120, 190]], [[280, 167], 'up', [320, 200]],
    [[380, 307], 'up', [420, 330]], [[477, 262], 'up', [520, 290]], [[195, 115], 'up', [240, 130]],
    [[315, 378], 'up', [360, 380], [288, 291, 54, 30]], [[503, 378], 'up', [548, 380], [476, 291, 54, 30]],
    [[408, 492], 'up', [455, 495], [382, 412, 54, 30]],
    [[978, 160], 'up', [1020, 175]],
  ],
  lounge: [[720, 322, 'down'], [765, 322, 'down'], [655, 340, 'right'], [820, 355, 'left'], [667, 440, 'up'], [782, 442, 'up']],
  kitchen: [[932, 390, 'up'], [967, 390, 'up'], [1002, 390, 'up'], [890, 345, 'up']],
  door: [550, 600],
  corridor: [200, 560],
  nodes: [[550, 590], [130, 560], [130, 330], [110, 210], [330, 560], [600, 450], [600, 250], [620, 175], [1000, 175], [900, 560], [970, 440], [640, 500], [820, 500], [250, 470]],
  edges: [[0, 4], [0, 9], [0, 5], [4, 1], [1, 2], [2, 3], [4, 13], [13, 2], [5, 6], [6, 7], [7, 8], [5, 11], [11, 12], [12, 9], [9, 10], [6, 3]],
};

export const PIXEL = makeScene(PIXEL_DEF);
export const { IMG, SPOTS, targetPx, advancePx } = PIXEL;
export const newActorPx = PIXEL.newActorPx;

// Gerçekçi ofis (assets/realistic/ofis.png, Krea): 4 sıra düz masa. 0–2: 2. sıra, 3–4: 3. sıra, 5–7: 4. sıra,
// 8: üst sıranın ortası, 9: köşe masası (yönetici). Ekran dikdörtgenleri [x, y, g, y] önizleme pikseli.
export const REAL_DEF = {
  w: 2752, h: 1536, src: '../assets/realistic/ofis.png',
  desks: [
    [[202, 270], 'up', [250, 285], [177, 177, 57, 30]], [[345, 270], 'up', [390, 285], [317, 177, 57, 30]], [[480, 268], 'up', [528, 285], [452, 177, 56, 30]],
    [[325, 382], 'up', [372, 395], [297, 290, 58, 30]], [[520, 382], 'up', [568, 395], [490, 290, 60, 30]],
    [[295, 510], 'up', [345, 520], [267, 416, 61, 32]], [[422, 510], 'up', [470, 520], [393, 416, 60, 32]], [[557, 510], 'up', [605, 520], [526, 416, 61, 32]],
    [[360, 167], 'up', [405, 180], [333, 92, 54, 29]],
    [[1012, 158], 'up', [1050, 172]],
  ],
  lounge: [[735, 330, 'down'], [780, 330, 'down'], [670, 350, 'right'], [850, 365, 'left'], [684, 450, 'up'], [806, 452, 'up']],
  kitchen: [[965, 388, 'up'], [1000, 388, 'up'], [1035, 388, 'up'], [915, 360, 'up']],
  door: [550, 600],
  corridor: [180, 565],
  nodes: [[550, 590], [120, 560], [120, 300], [120, 195], [300, 560], [610, 560], [610, 300], [610, 185], [990, 172], [900, 560], [980, 440], [650, 520], [830, 520], [240, 440], [250, 292]],
  edges: [[0, 4], [0, 5], [0, 9], [4, 1], [4, 13], [13, 2], [1, 2], [2, 3], [2, 14], [14, 6], [5, 6], [6, 7], [7, 8], [3, 7], [5, 11], [11, 12], [12, 9], [9, 10]],
};
export const REAL = makeScene(REAL_DEF);

// Piksel ofis, odalı (assets/office/ofis-oda.png, Krea): soldaki masa sıraları eskisiyle aynı; mola köşesi ve mutfak
// arkada (pencereler önünde), yönetici sağ önde cam duvarlı özel odasında. Masa sırası: 0–2 2. sıra, 3–4 3. sıra,
// 5–7 4. sıra, 8 üst sıranın ortası, 9 yönetici (oda, yüzü sola), 10–11 üst sıranın solu/sağı.
// occluders: oturan karakterin önüne yeniden çizilen arka plan parçası (koltuk/sandalye arkalığı) — "içine oturma".
export const PIXEL2_DEF = {
  // Krea ile yukarı (tuğla duvar/tavan) ve aşağı (ahşap zemin) genişletilmiş sürüm; ortası özgün ofis-oda.png ile birebir aynı.
  w: 2752, h: 1536, pad: [250, 414], src: '../assets/office/ofis-oda-genis.png',
  desks: [
    [[202, 265], 'up', [250, 280], [175, 179, 57, 27]], [[342, 265], 'up', [390, 280], [315, 179, 57, 27]], [[475, 265], 'up', [523, 280], [447, 179, 57, 27]],
    [[324, 382], 'up', [372, 395], [294, 289, 59, 30]], [[515, 382], 'up', [563, 395], [486, 289, 59, 30]],
    [[295, 505], 'up', [343, 518], [266, 415, 59, 30]], [[420, 505], 'up', [468, 518], [391, 415, 59, 30]], [[552, 505], 'up', [600, 518], [524, 415, 59, 30]],
    [[357, 172], 'up', [403, 184], [331, 97, 52, 27]],
    [[995, 440], 'left', [985, 472]],
    [[227, 172], 'up', [273, 184], [202, 97, 52, 27]], [[482, 172], 'up', [528, 184], [456, 97, 52, 27]],
  ],
  lounge: [[720, 172, 'down'], [765, 172, 'down'], [810, 172, 'down'], [660, 195, 'right'], [860, 195, 'left'], [670, 266, 'up'], [803, 262, 'up']],
  kitchen: [[932, 240, 'up'], [966, 240, 'up'], [1002, 240, 'up']],
  door: [600, 590],
  corridor: [200, 560],
  nodes: [[600, 590], [120, 560], [120, 300], [120, 195], [300, 560], [640, 560], [640, 300], [600, 185], [852, 268], [960, 265], [852, 410], [980, 402], [240, 440], [250, 292], [860, 235]],
  edges: [[0, 4], [0, 5], [4, 1], [4, 12], [12, 2], [1, 2], [2, 3], [2, 13], [13, 6], [5, 6], [6, 7], [3, 7], [6, 8], [8, 9], [8, 10], [10, 11], [8, 14]],
  board: [150, 5, 300, 82], // sol üst tuğla duvar (boruların önünde)
  occluders: [
    { at: [670, 266], rect: [647, 262, 66, 58] }, // sol koltuk arkalığı
    { at: [803, 262], rect: [767, 260, 68, 32] }, // sağ koltuk arkalığı
  ],
};
export const PIXEL2 = makeScene(PIXEL2_DEF);
