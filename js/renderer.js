import {
  FOV,
  RAYS,
  MAX_DIST
} from "./config.js";

const renderer = {
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,
  state: null,
  wallOnCell: () => true,
  closedDoorOnCell: () => false,
  openDoorOnCell: () => false,
  getDoorState: () => null,
  inBounds: () => false,
  updateAnimation: () => {},
  updateHud: () => {},
  drawMinimap: () => {},
  getMinimapOptions: () => ({}),
  getMinimapBounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  minimapOverlayVisible: false,
  lastCanvasTouchAt: 0,
  wallTexture: null,
  doorTexture: null
};

export function configureRenderer(options) {
  Object.assign(renderer, options);
  renderer.W = renderer.canvas.width;
  renderer.H = renderer.canvas.height;
  renderer.wallTexture = makeWallTexture();
  renderer.doorTexture = makeDoorTexture();
  renderer.canvas.addEventListener("pointerup", handleCanvasPointerUp);
  renderer.canvas.addEventListener("touchend", handleCanvasTouchEnd, { passive: false });
}

export function startRenderLoop() {
  requestAnimationFrame(drawScene);
}

export function drawScene(now) {
  const { ctx, W, H, state } = renderer;
  renderer.updateAnimation(now);
  ctx.save();
  ctx.fillStyle = "#070909";
  ctx.fillRect(0, 0, W, H);

  const sway = Math.sin(now * 0.005) * 2 + state.shake;
  state.shake *= 0.86;
  state.torch = Math.sin(now * 0.007) * 0.035 + Math.sin(now * 0.013) * 0.02;
  ctx.translate(0, sway);

  drawCeiling();
  drawFloor();
  drawBoundaryWalls();
  drawCellEvents();
  drawMist();
  renderer.drawMinimap(ctx, {
    ...renderer.getMinimapOptions(),
    roundRect
  });
  if (renderer.minimapOverlayVisible) drawMinimapOverlay();
  if (state.torchFuel <= 0) drawDarknessMessage();
  ctx.restore();
  drawFrame();
  renderer.updateHud();
  requestAnimationFrame(drawScene);
}

function handleCanvasPointerUp(e) {
  if (Date.now() - renderer.lastCanvasTouchAt < 450) return;
  handleCanvasActivation(e.clientX, e.clientY);
}

function handleCanvasTouchEnd(e) {
  const touch = e.changedTouches[0];
  if (!touch) return;
  renderer.lastCanvasTouchAt = Date.now();
  handleCanvasActivation(touch.clientX, touch.clientY);
}

function handleCanvasActivation(clientX, clientY) {
  const { canvas, W, H, state } = renderer;

  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * W;
  const y = ((clientY - rect.top) / rect.height) * H;
  if (renderer.minimapOverlayVisible) {
    renderer.minimapOverlayVisible = false;
    return;
  }

  const bounds = renderer.getMinimapBounds(W);
  if (
    x >= bounds.x && x <= bounds.x + bounds.w &&
    y >= bounds.y && y <= bounds.y + bounds.h
  ) {
    renderer.minimapOverlayVisible = true;
  }
}

function drawMinimapOverlay() {
  const { ctx, W, H } = renderer;
  const size = Math.min(W * .58, H * .72, 360);
  const ox = (W - size) / 2;
  const oy = (H - size) / 2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.58)";
  ctx.fillRect(0, 0, W, H);
  renderer.drawMinimap(ctx, {
    ...renderer.getMinimapOptions(),
    H,
    roundRect,
    size,
    ox,
    oy,
    alpha: .96
  });
  ctx.restore();
}

function drawDarknessMessage() {
  const { ctx, W, H } = renderer;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.8)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f0eadc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 34px GameFont, sans-serif";
  ctx.fillText("あたりはくらやみに　つつまれた…。", W / 2, H / 2);
  ctx.restore();
}

export function drawCeiling() {
  const { ctx, W, H } = renderer;
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.52);
  g.addColorStop(0, "#151918");
  g.addColorStop(0.58, "#0d1010");
  g.addColorStop(1, "#050606");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H / 2);

  ctx.strokeStyle = "rgba(116, 106, 88, .12)";
  ctx.lineWidth = 1;
  for (let y = 38; y < H / 2; y += 39) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + Math.sin(y) * 5);
    ctx.stroke();
  }
}

export function drawFloor() {
  const { ctx, W, H } = renderer;
  const horizon = H / 2;
  const floorGrad = ctx.createLinearGradient(0, horizon, 0, H);
  floorGrad.addColorStop(0, "#0c0a08");
  floorGrad.addColorStop(0.42, "#292316");
  floorGrad.addColorStop(1, "#413419");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizon, W, H / 2);

  ctx.strokeStyle = "rgba(236,195,116,.07)";
  ctx.lineWidth = 1;
  for (let y = horizon + 18; y < H; y += 18) {
    const spread = (y - horizon) / (H - horizon);
    ctx.beginPath();
    ctx.moveTo(W * (0.5 - spread * 0.52), y);
    ctx.lineTo(W * (0.5 + spread * 0.52), y);
    ctx.stroke();
  }
}

export function drawBoundaryWalls() {
  const { ctx, W, H, wallTexture, doorTexture, state } = renderer;
  const colW = W / RAYS;
  for (let i = 0; i < RAYS; i++) {
    const t = i / (RAYS - 1);
    const angle = state.angle - FOV / 2 + FOV * t;
    const hit = castRay(angle);
    const wallH = Math.min(H * 1.85, H / hit.corrected);
    const y1 = (H - wallH) / 2;
    const x = Math.floor(i * colW);
    const wallSampleX = Math.floor(hit.u * wallTexture.width) % wallTexture.width;
    const shade = Math.max(0.18, 1 - hit.dist / MAX_DIST);
    const orientationShade = hit.side === 0 ? 0.82 : 0.68;
    const light = Math.min(1.12, shade * orientationShade + 0.13 + state.torch);

    ctx.drawImage(wallTexture, wallSampleX, 0, 1, wallTexture.height, x, y1, Math.ceil(colW) + 1, wallH);
    ctx.fillStyle = `rgba(0,0,0,${1 - light})`;
    ctx.fillRect(x, y1, Math.ceil(colW) + 1, wallH);

    if (hit.type === "door" && isDoorPanelSample(hit.u)) {
      const doorU = normalizeDoorSample(hit.u);
      const opening = getDoorOpeningProgress(hit);
      if (isDoorOpeningGap(doorU, opening)) {
        ctx.fillStyle = "rgba(0,0,0,.72)";
        ctx.fillRect(x, y1, Math.ceil(colW) + 1, wallH);
      } else {
        const doorSampleX = Math.floor(doorU * doorTexture.width) % doorTexture.width;
        const doorLight = Math.min(1.12, shade * orientationShade + 0.2 + state.torch);
        ctx.drawImage(doorTexture, doorSampleX, 0, 1, doorTexture.height, x, y1, Math.ceil(colW) + 1, wallH);
        ctx.fillStyle = `rgba(0,0,0,${1 - doorLight})`;
        ctx.fillRect(x, y1, Math.ceil(colW) + 1, wallH);
        if (isDoorPanelEdgeSample(hit.u) || isDoorOpeningEdge(doorU, opening)) {
          ctx.fillStyle = "rgba(255,219,143,.16)";
          ctx.fillRect(x, y1, Math.ceil(colW) + 1, wallH);
        }
      }
    } else if (isEdgeSample(hit.u)) {
      ctx.fillStyle = "rgba(0,0,0,.24)";
      ctx.fillRect(x, y1, Math.ceil(colW) + 1, wallH);
    }
  }
}

export function drawMist() {
  const { ctx, W, H } = renderer;
  const glow = ctx.createRadialGradient(W / 2, H * .52, 20, W / 2, H * .52, W * .58);
  glow.addColorStop(0, "rgba(231,172,88,.11)");
  glow.addColorStop(.45, "rgba(0,0,0,0)");
  glow.addColorStop(1, "rgba(0,0,0,.72)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(3,4,4,.20)";
  ctx.fillRect(0, 0, W, H);
}

export function drawCellEvents() {
  const { ctx, W, H, state } = renderer;
  const {
    MAP_W,
    MAP_H,
    cells
  } = renderer.getMinimapOptions();
  if (!cells) return;

  const events = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const cell = cells[y][x];
      if (cell.type !== "stairsUp" && cell.type !== "stairsDown") continue;
      const projected = projectCellCenter(x, y);
      if (!projected) continue;
      if (!hasLineOfSightToCell(x, y)) continue;
      events.push({ ...projected, type: cell.type });
    }
  }

  events
    .sort((a, b) => b.forward - a.forward)
    .forEach(event => drawStairsEventMarker(ctx, W, H, event));
}

function projectCellCenter(cellX, cellY) {
  return projectWorldPoint(cellX + .5, cellY + .5);
}

function projectWorldPoint(worldX, worldY) {
  const { W, H, state } = renderer;
  const dx = worldX - state.x;
  const dy = worldY - state.y;
  const forward = dx * Math.cos(state.angle) + dy * Math.sin(state.angle);
  if (forward <= .25 || forward > MAX_DIST) return null;

  const side = dx * -Math.sin(state.angle) + dy * Math.cos(state.angle);
  const focalLength = (W / 2) / Math.tan(FOV / 2);
  const x = W / 2 + (side / forward) * focalLength;
  if (x < -W * .08 || x > W * 1.08) return null;

  const projectedWallH = Math.min(H * 1.85, H / forward);
  const floorY = Math.max(H * .5, Math.min(H * .94, H / 2 + projectedWallH / 2));
  const ceilingY = Math.min(H * .5, Math.max(H * .06, H / 2 - projectedWallH / 2));
  const size = Math.max(14, Math.min(104, (H * .32) / Math.max(.8, forward)));
  const alpha = Math.max(.52, Math.min(1, 1 - forward / (MAX_DIST * 1.45)));
  return { x, y: floorY, floorY, ceilingY, size, alpha, forward };
}

function hasLineOfSightToCell(targetCellX, targetCellY) {
  return hasLineOfSightToPoint(targetCellX + .5, targetCellY + .5, targetCellX, targetCellY);
}

function hasLineOfSightToPoint(targetX, targetY, targetCellX = Math.floor(targetX), targetCellY = Math.floor(targetY)) {
  const { state } = renderer;
  let prevX = Math.floor(state.x);
  let prevY = Math.floor(state.y);
  const dx = targetX - state.x;
  const dy = targetY - state.y;
  const steps = Math.max(8, Math.ceil(Math.hypot(dx, dy) * 12));

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const sampleX = state.x + dx * t;
    const sampleY = state.y + dy * t;
    const cellX = Math.floor(sampleX);
    const cellY = Math.floor(sampleY);
    if (cellX === prevX && cellY === prevY) continue;

    const dirKey = directionKeyBetween(prevX, prevY, cellX, cellY);
    if (!dirKey || renderer.wallOnCell(prevX, prevY, dirKey)) return false;
    prevX = cellX;
    prevY = cellY;
    if (prevX === targetCellX && prevY === targetCellY) return true;
  }
  return prevX === targetCellX && prevY === targetCellY;
}

function directionKeyBetween(fromX, fromY, toX, toY) {
  if (toX > fromX) return "E";
  if (toX < fromX) return "W";
  if (toY > fromY) return "S";
  if (toY < fromY) return "N";
  return null;
}

function drawStairsEventMarker(ctx, W, H, event) {
  const isUp = event.type === "stairsUp";
  const color = isUp ? "#8ed4ff" : "#f3b15a";
  const centerY = isUp ? event.ceilingY : event.floorY;
  const glowY = isUp ? centerY + event.size * .22 : centerY - event.size * .22;

  ctx.save();
  ctx.globalAlpha = event.alpha;
  const glow = ctx.createRadialGradient(event.x, glowY, 2, event.x, glowY, event.size * 1.55);
  glow.addColorStop(0, isUp ? "rgba(142,212,255,.68)" : "rgba(243,177,90,.68)");
  glow.addColorStop(.5, isUp ? "rgba(142,212,255,.24)" : "rgba(243,177,90,.24)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(event.x, glowY, event.size * 1.55, 0, Math.PI * 2);
  ctx.fill();

  if (isUp) {
    drawCeilingStairsOpening(ctx, event.x, centerY, event.size, color);
  } else {
    drawFloorStairsOpening(ctx, event.x, centerY, event.size, color);
  }
  ctx.restore();
}

function drawFloorStairsOpening(ctx, x, y, size, color) {
  const topY = y - size * .72;
  const bottomY = y + size * .16;
  const topW = size * .84;
  const bottomW = size * 1.62;
  const sideInset = size * .13;

  ctx.fillStyle = "rgba(0,0,0,.46)";
  drawQuad(ctx, x - topW / 2, topY, x + topW / 2, topY, x + bottomW / 2, bottomY, x - bottomW / 2, bottomY);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * .06);
  ctx.shadowColor = color;
  ctx.shadowBlur = size * .22;
  drawQuad(ctx, x - topW / 2, topY, x + topW / 2, topY, x + bottomW / 2, bottomY, x - bottomW / 2, bottomY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,226,158,.42)";
  ctx.lineWidth = Math.max(1, size * .025);
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const rowY = topY + (bottomY - topY) * t;
    const rowW = topW + (bottomW - topW) * t;
    ctx.beginPath();
    ctx.moveTo(x - rowW / 2 + sideInset * t, rowY);
    ctx.lineTo(x + rowW / 2 - sideInset * t, rowY);
    ctx.stroke();
  }
}

function drawCeilingStairsOpening(ctx, x, y, size, color) {
  const topY = y - size * .16;
  const bottomY = y + size * .72;
  const topW = size * 1.5;
  const bottomW = size * .78;
  const sideInset = size * .11;

  ctx.fillStyle = "rgba(0,0,0,.5)";
  drawQuad(ctx, x - topW / 2, topY, x + topW / 2, topY, x + bottomW / 2, bottomY, x - bottomW / 2, bottomY);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * .06);
  ctx.shadowColor = color;
  ctx.shadowBlur = size * .22;
  drawQuad(ctx, x - topW / 2, topY, x + topW / 2, topY, x + bottomW / 2, bottomY, x - bottomW / 2, bottomY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(203,237,255,.42)";
  ctx.lineWidth = Math.max(1, size * .025);
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const rowY = topY + (bottomY - topY) * t;
    const rowW = topW + (bottomW - topW) * t;
    ctx.beginPath();
    ctx.moveTo(x - rowW / 2 + sideInset * (1 - t), rowY);
    ctx.lineTo(x + rowW / 2 - sideInset * (1 - t), rowY);
    ctx.stroke();
  }
}

function drawQuad(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
}

export function drawFrame() {
  const { ctx, W, H } = renderer;
  ctx.save();
  ctx.strokeStyle = "rgba(236, 209, 151, .18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = 16;
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();
}

export function castRay(angle) {
  const { state } = renderer;
  const rayX = Math.cos(angle);
  const rayY = Math.sin(angle);
  let cellX = Math.floor(state.x);
  let cellY = Math.floor(state.y);

  const stepX = rayX < 0 ? -1 : 1;
  const stepY = rayY < 0 ? -1 : 1;
  const deltaX = Math.abs(1 / (Math.abs(rayX) < 0.00001 ? 0.00001 : rayX));
  const deltaY = Math.abs(1 / (Math.abs(rayY) < 0.00001 ? 0.00001 : rayY));
  let sideX = rayX < 0 ? (state.x - cellX) * deltaX : (cellX + 1 - state.x) * deltaX;
  let sideY = rayY < 0 ? (state.y - cellY) * deltaY : (cellY + 1 - state.y) * deltaY;

  for (let i = 0; i < 80; i++) {
    if (sideX < sideY) {
      const dirKey = stepX > 0 ? "E" : "W";
      const dist = sideX;
      const doorState = renderer.getDoorState(cellX, cellY, dirKey);
      if (renderer.wallOnCell(cellX, cellY, dirKey)) {
        const hitY = state.y + rayY * dist;
        return makeHit(dist, hitY - Math.floor(hitY), dirKey, 0, angle, doorState ? "door" : "wall", doorState, cellX, cellY);
      }
      cellX += stepX;
      if (!renderer.inBounds(cellX, cellY)) return makeHit(dist, 0, dirKey, 0, angle);
      sideX += deltaX;
    } else {
      const dirKey = stepY > 0 ? "S" : "N";
      const dist = sideY;
      const doorState = renderer.getDoorState(cellX, cellY, dirKey);
      if (renderer.wallOnCell(cellX, cellY, dirKey)) {
        const hitX = state.x + rayX * dist;
        return makeHit(dist, hitX - Math.floor(hitX), dirKey, 1, angle, doorState ? "door" : "wall", doorState, cellX, cellY);
      }
      cellY += stepY;
      if (!renderer.inBounds(cellX, cellY)) return makeHit(dist, 0, dirKey, 1, angle);
      sideY += deltaY;
    }
  }
  return makeHit(MAX_DIST, 0, "N", 1, angle);
}

export function makeHit(dist, u, dirKey, side, angle, type = "wall", doorState = null, cellX = null, cellY = null) {
  const corrected = Math.max(0.001, dist * Math.cos(angle - renderer.state.angle));
  return {
    dist,
    corrected,
    u: ((u % 1) + 1) % 1,
    side,
    dirKey,
    type,
    doorState,
    cellX,
    cellY
  };
}

export function makeWallTexture() {
  const tex = document.createElement("canvas");
  tex.width = 96;
  tex.height = 160;
  const c = tex.getContext("2d");
  c.fillStyle = "#817667";
  c.fillRect(0, 0, tex.width, tex.height);
  for (let y = 0; y < tex.height; y += 20) {
    const offset = (y / 20) % 2 ? 20 : 0;
    c.fillStyle = y % 40 ? "#716756" : "#8b806f";
    c.fillRect(0, y, tex.width, 20);
    c.strokeStyle = "rgba(28,26,23,.62)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(tex.width, y);
    c.stroke();
    for (let x = -offset; x < tex.width; x += 40) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 20);
      c.stroke();
    }
  }
  c.fillStyle = "rgba(236,220,181,.12)";
  for (let i = 0; i < 230; i++) {
    const x = Math.random() * tex.width;
    const y = Math.random() * tex.height;
    c.fillRect(x, y, Math.random() * 2 + .6, Math.random() * 2 + .6);
  }
  c.fillStyle = "rgba(0,0,0,.16)";
  for (let i = 0; i < 80; i++) {
    c.fillRect(Math.random() * tex.width, Math.random() * tex.height, Math.random() * 3 + 1, 1);
  }
  return tex;
}

export function makeDoorTexture() {
  const tex = document.createElement("canvas");
  tex.width = 96;
  tex.height = 160;
  const c = tex.getContext("2d");
  const grad = c.createLinearGradient(0, 0, tex.width, 0);
  grad.addColorStop(0, "#3b2416");
  grad.addColorStop(.5, "#7a4a28");
  grad.addColorStop(1, "#2f1c12");
  c.fillStyle = grad;
  c.fillRect(0, 0, tex.width, tex.height);

  c.strokeStyle = "rgba(16,9,5,.72)";
  c.lineWidth = 3;
  for (let x = 18; x < tex.width; x += 20) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x + Math.sin(x) * 2, tex.height);
    c.stroke();
  }

  c.fillStyle = "rgba(0,0,0,.36)";
  c.fillRect(0, 0, 8, tex.height);
  c.fillRect(tex.width - 8, 0, 8, tex.height);
  c.fillRect(0, 0, tex.width, 10);
  c.fillRect(0, tex.height - 12, tex.width, 12);

  c.strokeStyle = "rgba(226,178,92,.34)";
  c.lineWidth = 4;
  c.strokeRect(12, 14, tex.width - 24, tex.height - 28);

  c.fillStyle = "#cda14d";
  c.beginPath();
  c.arc(tex.width * .73, tex.height * .52, 5, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "rgba(255,225,148,.09)";
  for (let i = 0; i < 80; i++) {
    c.fillRect(Math.random() * tex.width, Math.random() * tex.height, Math.random() * 2 + .5, 1);
  }
  return tex;
}

export function roundRect(x, y, w, h, r) {
  const { ctx } = renderer;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function isEdgeSample(u) {
  return u < 0.035 || u > 0.965;
}

export function isDoorEdgeSample(u) {
  return u < 0.12 || u > 0.88 || (u > .47 && u < .53);
}

export function isDoorPanelSample(u) {
  return u >= 0.28 && u <= 0.72;
}

export function isDoorPanelEdgeSample(u) {
  return (u > 0.28 && u < 0.31) || (u > 0.69 && u < 0.72) || (u > .49 && u < .51);
}

export function normalizeDoorSample(u) {
  return Math.max(0, Math.min(1, (u - 0.28) / 0.44));
}

export function getDoorOpeningProgress(hit) {
  const a = renderer.state?.anim;
  if (!a || a.type !== "door") return 0;
  if (a.x !== hit.cellX || a.y !== hit.cellY || a.dirKey !== hit.dirKey) return 0;
  const p = Math.max(0, Math.min(1, (performance.now() - a.start) / a.duration));
  return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

export function isDoorOpeningGap(doorU, opening) {
  if (opening <= 0) return false;
  const halfGap = opening * .46;
  return Math.abs(doorU - .5) < halfGap;
}

export function isDoorOpeningEdge(doorU, opening) {
  if (opening <= 0) return false;
  const halfGap = opening * .46;
  const distance = Math.abs(Math.abs(doorU - .5) - halfGap);
  return distance < .035;
}
