export function drawMinimap(ctx, {
  W,
  MAP_W,
  MAP_H,
  cells,
  explored,
  state,
  roundRect,
  size = 126,
  ox = W - size - 16,
  oy = 16,
  alpha = .82
}) {
  const cell = size / MAP_W;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(4,5,5,.68)";
  roundRect(ox - 8, oy - 8, size + 16, size + 16, 8);
  ctx.fill();

  ctx.fillStyle = "#151d19";
  ctx.fillRect(ox, oy, size, size);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const x1 = ox + x * cell;
      const y1 = oy + y * cell;
      if (explored[y][x]) {
        ctx.fillStyle = "#14201b";
        ctx.fillRect(x1 + 1, y1 + 1, cell - 2, cell - 2);
        ctx.strokeStyle = "rgba(174,160,126,.13)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x1 + .5, y1 + .5, cell, cell);
      } else {
        drawUnknownMapCell(ctx, x1, y1, cell, x, y);
      }
    }
  }

  ctx.strokeStyle = "#b8a77f";
  ctx.lineWidth = 2;
  ctx.lineCap = "square";
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!explored[y][x]) continue;
      const c = cells[y][x];
      const x1 = ox + x * cell;
      const y1 = oy + y * cell;
      const x2 = x1 + cell;
      const y2 = y1 + cell;
      if (c.walls.N) line(ctx, x1, y1, x2, y1);
      if (c.walls.W) line(ctx, x1, y1, x1, y2);
      if (c.walls.E) line(ctx, x2, y1, x2, y2);
      if (c.walls.S) line(ctx, x1, y2, x2, y2);
    }
  }

  const px = ox + (state.x / MAP_W) * size;
  const py = oy + (state.y / MAP_H) * size;
  ctx.fillStyle = "#d9a44c";
  ctx.beginPath();
  ctx.moveTo(px + Math.cos(state.angle) * 7, py + Math.sin(state.angle) * 7);
  ctx.lineTo(px + Math.cos(state.angle + 2.45) * 6, py + Math.sin(state.angle + 2.45) * 6);
  ctx.lineTo(px + Math.cos(state.angle - 2.45) * 6, py + Math.sin(state.angle - 2.45) * 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(ox - 1, oy - 1, size + 2, size + 2);
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(ox - 5, oy - 5, size + 10, size + 10);
  ctx.restore();
}

export function drawUnknownMapCell(ctx, x, y, size, gx, gy) {
  const noise = hashNoise(gx, gy);
  const base = 58 + Math.floor(noise * 28);
  ctx.fillStyle = `rgb(${base},${base},${base})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

  ctx.fillStyle = `rgba(18,18,18,${.18 + noise * .18})`;
  ctx.fillRect(x + 1, y + size * .52, size - 2, size * .22);

  ctx.fillStyle = `rgba(205,205,205,${.08 + noise * .05})`;
  const dots = 3 + Math.floor(noise * 4);
  for (let i = 0; i < dots; i++) {
    const px = x + 2 + ((hashNoise(gx + i * 3, gy + 7) * (size - 4)) | 0);
    const py = y + 2 + ((hashNoise(gx + 11, gy + i * 5) * (size - 4)) | 0);
    ctx.fillRect(px, py, 1.2, 1.2);
  }
}

export function getMinimapBounds(W, size = 126, margin = 16, pad = 8) {
  return {
    x: W - size - margin - pad,
    y: margin - pad,
    w: size + pad * 2,
    h: size + pad * 2
  };
}

export function hashNoise(x, y) {
  const n = Math.sin((x + 1) * 127.1 + (y + 1) * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
