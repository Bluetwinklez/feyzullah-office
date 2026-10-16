// Izgara üzerinde en kısa yol (BFS, 4 yön). grid[y][x] = yürünebilir mi. Saf.
export function findPath(grid, [sx, sy], [tx, ty]) {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h && grid[y][x];
  if (!ok(sx, sy) || !ok(tx, ty)) return null;
  const prev = new Map([[sy * w + sx, -1]]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) {
      const path = [];
      for (let k = y * w + x; k !== -1; k = prev.get(k)) path.push([k % w, Math.floor(k / w)]);
      return path.reverse();
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (ok(nx, ny) && !prev.has(ny * w + nx)) { prev.set(ny * w + nx, y * w + x); queue.push([nx, ny]); }
    }
  }
  return null;
}
