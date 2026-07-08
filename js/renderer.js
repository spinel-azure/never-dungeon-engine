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
  inBounds: () => false,
  updateAnimation: () => {},
  updateHud: () => {},
  drawMinimap: () => {},
  getMinimapOptions: () => ({}),
  getMinimapBounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  minimapOverlayVisible: false,
  lastCanvasTouchAt: 0,
  wallTexture: null
};

export function configureRenderer(options) {
  Object.assign(renderer, options);
  renderer.W = renderer.canvas.width;
  renderer.H = renderer.canvas.height;
  renderer.wallTexture = makeWallTexture();
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

  if (state.torchFuel <= 0) {
    renderer.minimapOverlayVisible = false;
    drawDarknessMessage();
    ctx.restore();
    drawFrame();
    renderer.updateHud();
    requestAnimationFrame(drawScene);
    return;
  }

  const sway = Math.sin(now * 0.005) * 2 + state.shake;
  state.shake *= 0.86;
  state.torch = Math.sin(now * 0.007) * 0.035 + Math.sin(now * 0.013) * 0.02;
  ctx.translate(0, sway);

  drawCeiling();
  drawFloor();
  drawBoundaryWalls();
  drawMist();
  renderer.drawMinimap(ctx, {
    ...renderer.getMinimapOptions(),
    roundRect
  });
  if (renderer.minimapOverlayVisible) drawMinimapOverlay();
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
  if (state.torchFuel <= 0) return;

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
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f0eadc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 34px GameFont, sans-serif";
  ctx.fillText("なにも　みえない！", W / 2, H / 2);
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
  const { ctx, W, H, wallTexture, state } = renderer;
  const colW = W / RAYS;
  for (let i = 0; i < RAYS; i++) {
    const t = i / (RAYS - 1);
    const angle = state.angle - FOV / 2 + FOV * t;
    const hit = castRay(angle);
    const wallH = Math.min(H * 1.85, H / hit.corrected);
    const y1 = (H - wallH) / 2;
    const x = Math.floor(i * colW);
    const sampleX = Math.floor(hit.u * wallTexture.width) % wallTexture.width;
    const shade = Math.max(0.18, 1 - hit.dist / MAX_DIST);
    const orientationShade = hit.side === 0 ? 0.82 : 0.68;
    const light = Math.min(1.12, shade * orientationShade + 0.13 + state.torch);

    ctx.drawImage(wallTexture, sampleX, 0, 1, wallTexture.height, x, y1, Math.ceil(colW) + 1, wallH);
    ctx.fillStyle = `rgba(0,0,0,${1 - light})`;
    ctx.fillRect(x, y1, Math.ceil(colW) + 1, wallH);

    if (isEdgeSample(hit.u)) {
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
      if (renderer.wallOnCell(cellX, cellY, dirKey)) {
        const hitY = state.y + rayY * dist;
        return makeHit(dist, hitY - Math.floor(hitY), dirKey, 0, angle);
      }
      cellX += stepX;
      if (!renderer.inBounds(cellX, cellY)) return makeHit(dist, 0, dirKey, 0, angle);
      sideX += deltaX;
    } else {
      const dirKey = stepY > 0 ? "S" : "N";
      const dist = sideY;
      if (renderer.wallOnCell(cellX, cellY, dirKey)) {
        const hitX = state.x + rayX * dist;
        return makeHit(dist, hitX - Math.floor(hitX), dirKey, 1, angle);
      }
      cellY += stepY;
      if (!renderer.inBounds(cellX, cellY)) return makeHit(dist, 0, dirKey, 1, angle);
      sideY += deltaY;
    }
  }
  return makeHit(MAX_DIST, 0, "N", 1, angle);
}

export function makeHit(dist, u, dirKey, side, angle) {
  const corrected = Math.max(0.001, dist * Math.cos(angle - renderer.state.angle));
  return {
    dist,
    corrected,
    u: ((u % 1) + 1) % 1,
    side,
    dirKey
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
