(() => {
  const LAYOUT_CLASSES = ["layout-mobile", "layout-tablet", "layout-pc"];
  const INPUT_CLASSES = ["input-touch", "input-pointer"];
  const ORIENTATION_CLASSES = ["orientation-portrait", "orientation-landscape"];
  let currentDeviceInfo = null;
  let deviceConfigured = false;

  function configureDevice() {
    updateDeviceClasses();
    if (deviceConfigured) return;
    deviceConfigured = true;
    window.addEventListener("resize", updateDeviceClasses);
  }

  function getDeviceInfo() {
    if (!currentDeviceInfo) currentDeviceInfo = detectDeviceInfo();
    return { ...currentDeviceInfo };
  }

  function updateDeviceClasses() {
    currentDeviceInfo = detectDeviceInfo();
    if (!document.body) return;
    document.body.classList.remove(...LAYOUT_CLASSES, ...INPUT_CLASSES, ...ORIENTATION_CLASSES);
    document.body.classList.add(
      `layout-${currentDeviceInfo.layout}`,
      `input-${currentDeviceInfo.input}`,
      `orientation-${currentDeviceInfo.orientation}`
    );
  }

  function detectDeviceInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const layout = width <= 680 ? "mobile" : width <= 1024 ? "tablet" : "pc";
    const isTouchDevice = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const input = isTouchDevice ? "touch" : "pointer";
    const orientation = height > width ? "portrait" : "landscape";
    return {
      width,
      height,
      layout,
      input,
      orientation,
      isMobileLayout: layout === "mobile",
      isTabletLayout: layout === "tablet",
      isPcLayout: layout === "pc",
      isTouchDevice,
      isPortrait: orientation === "portrait",
      isLandscape: orientation === "landscape"
    };
  }
  const TAU = Math.PI * 2;
  const FOV = Math.PI / 3.08;
  const RAYS = 260;
  const MAX_DIST = 15;
  const MAP_W = 10;
  const MAP_H = 10;
  const STEP_MS = 170;
  const TURN_MS = 150;
  const EXTRA_OPENINGS = 14;
  const START_X = 1;
  const START_Y = 1;
  
  const DIRS = [
    { key: "N", label: "N", angle: -Math.PI / 2, dx: 0, dy: -1, opposite: "S" },
    { key: "E", label: "E", angle: 0, dx: 1, dy: 0, opposite: "W" },
    { key: "S", label: "S", angle: Math.PI / 2, dx: 0, dy: 1, opposite: "N" },
    { key: "W", label: "W", angle: Math.PI, dx: -1, dy: 0, opposite: "E" }
  ];
  
  const DIR_BY_KEY = Object.fromEntries(DIRS.map(dir => [dir.key, dir]));
  
  const cells = makeCells(MAP_W, MAP_H);
  const explored = makeExplored(MAP_W, MAP_H);
  
  function makeCells(w, h) {
    return Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => ({
        x,
        y,
        type: "floor",
        walls: { N: true, E: true, S: true, W: true }
      }))
    );
  }
  
  function makeExplored(w, h) {
    return Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  }
  
  function markExplored(x, y) {
    if (inBounds(x, y)) explored[y][x] = true;
  }
  
  function resetExplored() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) explored[y][x] = false;
    }
  }
  
  function buildBoundaryWallMap() {
    resetAllWalls();
    carvePerfectMaze();
    addLoopOpenings(EXTRA_OPENINGS);
    if (countReachableCells(START_X, START_Y) !== MAP_W * MAP_H) {
      resetAllWalls();
      carvePerfectMaze();
      addLoopOpenings(EXTRA_OPENINGS);
    }
    placeStairs();
  }
  
  function resetAllWalls() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        cells[y][x].type = "floor";
        cells[y][x].walls = { N: true, E: true, S: true, W: true };
      }
    }
  }

  function placeStairs() {
    resetCellTypes();
    cells[START_Y][START_X].type = "stairsUp";
    const stairsDown = findFarthestReachableCell(7);
    if (stairsDown) cells[stairsDown.y][stairsDown.x].type = "stairsDown";
  }

  function getCellType(x, y) {
    if (!inBounds(x, y)) return "wall";
    return cells[y][x].type;
  }

  function findFarthestReachableCell(minDistance = 7) {
    const distances = makeDistanceMap(START_X, START_Y);
    let farthest = null;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const distance = distances[y][x];
        if (distance < minDistance) continue;
        if (x === START_X && y === START_Y) continue;
        if (!farthest || distance > farthest.distance) {
          farthest = { x, y, distance };
        }
      }
    }
    return farthest;
  }

  function resetCellTypes() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) cells[y][x].type = "floor";
    }
  }

  function makeDistanceMap(startX, startY) {
    const distances = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => -1));
    const queue = [{ x: startX, y: startY }];
    distances[startY][startX] = 0;

    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      const currentDistance = distances[cur.y][cur.x];
      for (const dir of DIRS) {
        const nx = cur.x + dir.dx;
        const ny = cur.y + dir.dy;
        if (!inBounds(nx, ny)) continue;
        if (wallOnCell(cur.x, cur.y, dir.key)) continue;
        if (distances[ny][nx] >= 0) continue;
        distances[ny][nx] = currentDistance + 1;
        queue.push({ x: nx, y: ny });
      }
    }
    return distances;
  }
  
  function carvePerfectMaze() {
    const visited = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => false));
    const stack = [{ x: START_X, y: START_Y }];
    visited[START_Y][START_X] = true;
  
    while (stack.length) {
      const current = stack[stack.length - 1];
      const choices = shuffled(DIRS).filter(dir => {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        return inBounds(nx, ny) && !visited[ny][nx];
      });
  
      if (!choices.length) {
        stack.pop();
        continue;
      }
  
      const dir = choices[0];
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      setWall(current.x, current.y, dir.key, false);
      visited[ny][nx] = true;
      stack.push({ x: nx, y: ny });
    }
  }
  
  function addLoopOpenings(count) {
    const candidates = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        for (const dir of [DIR_BY_KEY.E, DIR_BY_KEY.S]) {
          const nx = x + dir.dx;
          const ny = y + dir.dy;
          if (inBounds(nx, ny) && wallOnCell(x, y, dir.key)) {
            candidates.push({ x, y, dir: dir.key });
          }
        }
      }
    }
  
    shuffled(candidates).slice(0, count).forEach(opening => {
      setWall(opening.x, opening.y, opening.dir, false);
    });
  }
  
  function countReachableCells(startX, startY) {
    const queue = [{ x: startX, y: startY }];
    const seen = new Set([`${startX},${startY}`]);
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      for (const dir of DIRS) {
        const nx = cur.x + dir.dx;
        const ny = cur.y + dir.dy;
        const key = `${nx},${ny}`;
        if (!inBounds(nx, ny)) continue;
        if (wallOnCell(cur.x, cur.y, dir.key)) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
    return seen.size;
  }
  
  function shuffled(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  function chooseStartDirection() {
    for (const key of ["S", "E", "N", "W"]) {
      const dirIndex = DIRS.findIndex(dir => dir.key === key);
      if (dirIndex >= 0 && !wallOnCell(START_X, START_Y, key)) return dirIndex;
    }
    return 2;
  }
  
  function setWall(x, y, dirKey, value) {
    if (!inBounds(x, y)) return;
    const dir = DIR_BY_KEY[dirKey];
    cells[y][x].walls[dirKey] = value;
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (inBounds(nx, ny)) cells[ny][nx].walls[dir.opposite] = value;
  }
  
  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  }
  
  function wallOnCell(x, y, dirKey) {
    if (!inBounds(x, y)) return true;
    return cells[y][x].walls[dirKey];
  }
  
  const hooks = {
    say: () => {},
    cancelAutoReturn: () => {},
    continueAutoReturn: () => {},
    messageFor: () => ""
  };

  const TORCH_FUEL_MAX = 100;
  const TORCH_FUEL_STEP = 1;
  
  const state = createPlayerState(2);
  
  function configurePlayer(callbacks) {
    Object.assign(hooks, callbacks);
  }
  
  function createPlayerState(startDir) {
    return {
      gridX: START_X,
      gridY: START_Y,
      dir: startDir,
      x: START_X + .5,
      y: START_Y + .5,
      angle: DIRS[startDir].angle,
      anim: null,
      shake: 0,
      torch: 0,
      torchFuel: TORCH_FUEL_MAX,
      autoReturning: false,
      autoPath: []
    };
  }
  
  function resetPlayer(startDir) {
    state.anim = null;
    state.gridX = START_X;
    state.gridY = START_Y;
    state.dir = startDir;
    state.x = START_X + .5;
    state.y = START_Y + .5;
    state.angle = DIRS[startDir].angle;
    state.shake = 0;
    state.torchFuel = TORCH_FUEL_MAX;
    state.autoPath = [];
    markExplored(START_X, START_Y);
  }
  
  function updateAnimation(now) {
    if (!state.anim) return;
    const a = state.anim;
    const p = Math.min(1, (now - a.start) / a.duration);
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    if (a.type === "move") {
      state.x = a.fromX + (a.toX - a.fromX) * e;
      state.y = a.fromY + (a.toY - a.fromY) * e;
    } else {
      state.angle = normalize(a.fromA + angleDelta(a.fromA, a.toA) * e);
    }
    if (p >= 1) {
      if (a.type === "move") {
        state.gridX = a.toGX;
        state.gridY = a.toGY;
        state.x = state.gridX + .5;
        state.y = state.gridY + .5;
        markExplored(state.gridX, state.gridY);
        state.torchFuel = Math.max(0, state.torchFuel - TORCH_FUEL_STEP);
        hooks.say(hooks.messageFor(state.gridX, state.gridY, a.cellType));
      } else {
        state.dir = a.toDir;
        state.angle = DIRS[state.dir].angle;
      }
      state.anim = null;
      if (state.autoReturning) hooks.continueAutoReturn();
    }
  }
  
  function tryMove(amount, automated = false) {
    if (state.anim) return;
    if (!automated) hooks.cancelAutoReturn(false);
    const currentDir = amount > 0 ? DIRS[state.dir] : DIRS[(state.dir + 2) % 4];
    if (wallOnCell(state.gridX, state.gridY, currentDir.key)) {
      state.shake = amount > 0 ? -7 : 5;
      hooks.say("セル境界の壁に行く手を阻まれた。");
      return;
    }
    const nx = state.gridX + currentDir.dx;
    const ny = state.gridY + currentDir.dy;
    if (!inBounds(nx, ny)) {
      state.shake = amount > 0 ? -7 : 5;
      hooks.say("外周の向こうは闇に閉ざされている。");
      return;
    }
    state.anim = {
      type: "move",
      start: performance.now(),
      duration: STEP_MS,
      fromX: state.x,
      fromY: state.y,
      toX: nx + .5,
      toY: ny + .5,
      toGX: nx,
      toGY: ny,
      cellType: getCellType(nx, ny)
    };
    state.shake = amount > 0 ? 3 : -2;
  }
  
  function turn(amount, automated = false) {
    if (state.anim) return;
    if (!automated) hooks.cancelAutoReturn(false);
    const next = (state.dir + amount + 4) % 4;
    state.anim = {
      type: "turn",
      start: performance.now(),
      duration: TURN_MS,
      fromA: state.angle,
      toA: DIRS[next].angle,
      toDir: next
    };
    state.shake = amount > 0 ? 2 : -2;
  }
  
  function manualMove(amount) {
    if (state.autoReturning) {
      hooks.cancelAutoReturn(false);
      hooks.say("帰還を中断した。");
    }
    if (!state.anim) tryMove(amount);
  }
  
  function manualTurn(amount) {
    if (state.autoReturning) {
      hooks.cancelAutoReturn(false);
      hooks.say("帰還を中断した。");
    }
    if (!state.anim) turn(amount);
  }
  
  function turnToward(from, to) {
    const diff = (to - from + 4) % 4;
    return diff === 3 ? -1 : 1;
  }
  
  function normalize(a) {
    while (a <= -Math.PI) a += TAU;
    while (a > Math.PI) a -= TAU;
    return a;
  }
  
  function angleDelta(from, to) {
    return normalize(to - from);
  }
  
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
  
  function configureRenderer(options) {
    Object.assign(renderer, options);
    renderer.W = renderer.canvas.width;
    renderer.H = renderer.canvas.height;
    renderer.wallTexture = makeWallTexture();
    renderer.canvas.addEventListener("pointerup", handleCanvasPointerUp);
    renderer.canvas.addEventListener("touchend", handleCanvasTouchEnd, { passive: false });
  }
  
  function startRenderLoop() {
    requestAnimationFrame(drawScene);
  }
  
  function drawScene(now) {
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
  
  function drawCeiling() {
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
  
  function drawFloor() {
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
  
  function drawBoundaryWalls() {
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
  
  function drawMist() {
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
  
  function drawFrame() {
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
  
  function castRay(angle) {
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
  
  function makeHit(dist, u, dirKey, side, angle) {
    const corrected = Math.max(0.001, dist * Math.cos(angle - renderer.state.angle));
    return {
      dist,
      corrected,
      u: ((u % 1) + 1) % 1,
      side,
      dirKey
    };
  }
  
  function makeWallTexture() {
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
  
  function roundRect(x, y, w, h, r) {
    const { ctx } = renderer;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  
  function isEdgeSample(u) {
    return u < 0.035 || u > 0.965;
  }
  
  const options = {
    autoReturnBtn: null,
    say: () => {}
  };
  
  function configureAutoReturn(config) {
    Object.assign(options, config);
  }
  
  function startAutoReturn() {
    if (state.anim) return;
    if (state.gridX === START_X && state.gridY === START_Y) {
      options.say("すでにスタート地点にいる。");
      return;
    }
    const path = findExploredPathToStart();
    if (!path.length) {
      options.say("踏破済みの道だけではスタート地点へ戻れない。");
      return;
    }
    state.autoReturning = true;
    state.autoPath = path;
    updateAutoReturnButton();
    options.say("踏破済みの道をたどって帰還する。");
    continueAutoReturn();
  }
  
  function continueAutoReturn() {
    if (!state.autoReturning || state.anim) return;
    if (state.gridX === START_X && state.gridY === START_Y) {
      cancelAutoReturn(true);
      return;
    }
    const nextDirKey = state.autoPath[0];
    if (!nextDirKey) {
      cancelAutoReturn(false);
      options.say("帰還経路を見失った。");
      return;
    }
    const targetDir = DIRS.findIndex(d => d.key === nextDirKey);
    if (targetDir < 0) {
      cancelAutoReturn(false);
      return;
    }
    if (state.dir !== targetDir) {
      turn(turnToward(state.dir, targetDir), true);
      return;
    }
    state.autoPath.shift();
    tryMove(1, true);
  }
  
  function cancelAutoReturn(arrived) {
    if (!state.autoReturning && !state.autoPath.length) return;
    state.autoReturning = false;
    state.autoPath = [];
    updateAutoReturnButton();
    if (arrived) options.say("スタート地点へ戻った。");
  }
  
  function updateAutoReturnButton() {
    if (!options.autoReturnBtn) return;
    options.autoReturnBtn.disabled = state.autoReturning;
    options.autoReturnBtn.textContent = state.autoReturning ? "帰還中..." : "帰還";
  }
  
  function findExploredPathToStart() {
    const startKey = `${state.gridX},${state.gridY}`;
    const goalKey = `${START_X},${START_Y}`;
    const queue = [{ x: state.gridX, y: state.gridY }];
    const prev = new Map([[startKey, null]]);
  
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      if (`${cur.x},${cur.y}` === goalKey) break;
      for (const dir of DIRS) {
        const nx = cur.x + dir.dx;
        const ny = cur.y + dir.dy;
        const key = `${nx},${ny}`;
        if (!inBounds(nx, ny)) continue;
        if (!explored[ny][nx]) continue;
        if (wallOnCell(cur.x, cur.y, dir.key)) continue;
        if (prev.has(key)) continue;
        prev.set(key, { x: cur.x, y: cur.y, dir: dir.key });
        queue.push({ x: nx, y: ny });
      }
    }
  
    if (!prev.has(goalKey)) return [];
    const reversed = [];
    let key = goalKey;
    while (key !== startKey) {
      const step = prev.get(key);
      reversed.push(step.dir);
      key = `${step.x},${step.y}`;
    }
    return reversed.reverse();
  }
  
  function configureInput({
    forwardBtn,
    backBtn,
    leftBtn,
    rightBtn,
    autoReturnBtn,
    randomGenerateBtn,
    manualMove,
    manualTurn,
    startAutoReturn,
    generateRandomDungeon,
    buttonA,
    buttonB,
    say
  }) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); manualMove(1); }
      if (e.key === "ArrowDown") { e.preventDefault(); manualMove(-1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); manualTurn(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); manualTurn(1); }
    }, { passive: false });
  
    bindControl(forwardBtn, () => manualMove(1));
    bindControl(backBtn, () => manualMove(-1));
    bindControl(leftBtn, () => manualTurn(-1));
    bindControl(rightBtn, () => manualTurn(1));
    bindControl(autoReturnBtn, startAutoReturn);
    bindControl(randomGenerateBtn, generateRandomDungeon);
    bindControl(buttonA, () => say("Aボタンを押した。"));
    bindControl(buttonB, () => say("Bボタンを押した。"));
    configureTouchGuards();
  }

  function bindControl(el, action) {
    let handledTouch = false;

    function isTouchLayout() {
      return document.body.classList.contains("layout-mobile")
        || document.body.classList.contains("layout-tablet");
    }

    el.addEventListener("touchend", (e) => {
      if (!isTouchLayout()) return;
      e.preventDefault();
      e.stopPropagation();
      handledTouch = true;
      action();
      window.setTimeout(() => {
        handledTouch = false;
      }, 350);
    }, { passive: false });

    el.addEventListener("click", (e) => {
      if (handledTouch) {
        e.preventDefault();
        return;
      }
      action();
    });
  }

  function configureTouchGuards() {
    const guardedSelector = ".shell, .game, .controls, .pad, button, canvas, .virtual-stick, .virtual-stick *, .action-buttons, .action-button";
    let lastTouchEnd = 0;
    let lastTouchStart = 0;

    function isTouchLayout() {
      return document.body.classList.contains("layout-mobile")
        || document.body.classList.contains("layout-tablet");
    }

    function isGuardedTarget(target) {
      return target instanceof Element && !!target.closest(guardedSelector);
    }

    function preventGuardedTouch(e) {
      if (!isTouchLayout() || !isGuardedTarget(e.target)) return;
      e.preventDefault();
    }

    document.addEventListener("touchstart", (e) => {
      if (!isTouchLayout() || !isGuardedTarget(e.target)) return;
      const now = Date.now();
      e.preventDefault();
      if (now - lastTouchStart <= 300) e.stopPropagation();
      lastTouchStart = now;
    }, { passive: false });

    document.addEventListener("touchmove", preventGuardedTouch, { passive: false });

    document.addEventListener("touchend", (e) => {
      if (!isTouchLayout() || !isGuardedTarget(e.target)) return;
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });

    ["gesturestart", "gesturechange", "gestureend", "selectstart", "dragstart"].forEach((type) => {
      document.addEventListener(type, (e) => {
        if (isTouchLayout()) e.preventDefault();
      }, { passive: false });
    });

    document.querySelectorAll(".virtual-stick, .action-buttons, .pad, button, canvas").forEach((el) => {
      el.addEventListener("contextmenu", (e) => {
        if (isTouchLayout()) e.preventDefault();
      });
    });
  }

  const DEAD_ZONE = 24;
  const MAX_RADIUS = 40;
  const MOVE_REPEAT_MS = 90;
  const HORIZONTAL_TURN_MIN = 34;
  const VERTICAL_MOVE_MIN = 24;
  const VERTICAL_CROSS_LIMIT = 18;
  const HORIZONTAL_CROSS_LIMIT = 12;

  function configureVirtualStick({
    stickEl,
    manualMove,
    manualTurn
  }) {
    if (!stickEl) return;

    const knob = stickEl.querySelector(".virtual-stick-knob");
    let activePointerId = null;
    let centerX = 0;
    let centerY = 0;
    let activeInputKey = null;
    let activeInputType = null;
    let repeatTimer = null;

    function begin(e) {
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      beginAt(e.clientX, e.clientY);
      stickEl.setPointerCapture(e.pointerId);
    }

    function update(e) {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      updateAt(e.clientX, e.clientY);
    }

    function end(e) {
      if (e.pointerId !== activePointerId) return;
      if (stickEl.hasPointerCapture(e.pointerId)) {
        stickEl.releasePointerCapture(e.pointerId);
      }
      finishInput();
    }

    function touchBegin(e) {
      if (activePointerId !== null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      e.preventDefault();
      activePointerId = `touch:${touch.identifier}`;
      beginAt(touch.clientX, touch.clientY);
    }

    function touchUpdate(e) {
      const touch = findActiveTouch(e.changedTouches);
      if (!touch) return;
      e.preventDefault();
      updateAt(touch.clientX, touch.clientY);
    }

    function touchEnd(e) {
      const touch = findActiveTouch(e.changedTouches);
      if (!touch) return;
      e.preventDefault();
      finishInput();
    }

    function beginAt(clientX, clientY) {
      activeInputKey = null;
      activeInputType = null;
      const rect = stickEl.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      updateAt(clientX, clientY);
    }

    function updateAt(clientX, clientY) {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const direction = getDirection(dx, dy, distance);

      moveKnob(direction, dx, dy);
      handleDirection(direction);
    }

    function finishInput() {
      activePointerId = null;
      activeInputKey = null;
      activeInputType = null;
      stopRepeat();
      if (knob) knob.style.transform = "translate(0, 0)";
    }

    function findActiveTouch(touches) {
      if (typeof activePointerId !== "string" || !activePointerId.startsWith("touch:")) return null;
      const activeTouchId = Number(activePointerId.slice(6));
      return Array.from(touches).find(touch => touch.identifier === activeTouchId) || null;
    }

    function moveKnob(direction, dx, dy) {
      if (!knob) return;
      if (!direction) {
        knob.style.transform = "translate(0, 0)";
        return;
      }

      if (direction.type === "move") {
        const y = Math.max(-MAX_RADIUS, Math.min(MAX_RADIUS, dy));
        knob.style.transform = `translate(0, ${y}px)`;
        return;
      }

      const x = Math.max(-MAX_RADIUS, Math.min(MAX_RADIUS, dx));
      knob.style.transform = `translate(${x}px, 0)`;
    }

    function handleDirection(direction) {
      if (!direction) {
        activeInputKey = null;
        activeInputType = null;
        stopRepeat();
        return;
      }

      if (activeInputType && direction.type !== activeInputType) return;

      const inputKey = `${direction.type}:${direction.amount}`;
      if (inputKey === activeInputKey) return;

      activeInputKey = inputKey;
      activeInputType = direction.type;
      if (direction.type === "move") {
        startMoveRepeat(direction.amount);
        return;
      }

      stopRepeat();
      manualTurn(direction.amount);
    }

    function getDirection(dx, dy, distance) {
      if (distance < DEAD_ZONE) return null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absY >= VERTICAL_MOVE_MIN && absX <= VERTICAL_CROSS_LIMIT) {
        return { type: "move", amount: dy < 0 ? 1 : -1 };
      }
      if (absX >= HORIZONTAL_TURN_MIN && absY <= HORIZONTAL_CROSS_LIMIT) {
        return { type: "turn", amount: dx < 0 ? -1 : 1 };
      }
      return null;
    }

    function startMoveRepeat(amount) {
      stopRepeat();
      manualMove(amount);
      repeatTimer = window.setInterval(() => manualMove(amount), MOVE_REPEAT_MS);
    }

    function stopRepeat() {
      if (!repeatTimer) return;
      window.clearInterval(repeatTimer);
      repeatTimer = null;
    }

    stickEl.addEventListener("pointerdown", begin);
    stickEl.addEventListener("pointermove", update);
    stickEl.addEventListener("pointerup", end);
    stickEl.addEventListener("pointercancel", end);
    stickEl.addEventListener("touchstart", touchBegin, { passive: false });
    stickEl.addEventListener("touchmove", touchUpdate, { passive: false });
    stickEl.addEventListener("touchend", touchEnd, { passive: false });
    stickEl.addEventListener("touchcancel", touchEnd, { passive: false });
  }
  
  function drawMinimap(ctx, {
    W,
    H,
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
        if (c.type === "stairsUp" || c.type === "stairsDown") {
          drawStairsMark(ctx, x1, y1, cell, c.type);
        }
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

  function getMinimapBounds(W, size = 126, margin = 16, pad = 8) {
    return {
      x: W - size - margin - pad,
      y: margin - pad,
      w: size + pad * 2,
      h: size + pad * 2
    };
  }
  
  function drawUnknownMapCell(ctx, x, y, size, gx, gy) {
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

  function drawStairsMark(ctx, x, y, size, type) {
    const label = type === "stairsUp" ? "U" : "D";
    ctx.save();
    ctx.fillStyle = type === "stairsUp" ? "#87c7ff" : "#f0b35a";
    ctx.font = `700 ${Math.max(8, size * .62)}px GameFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + size / 2, y + size / 2);
    ctx.restore();
  }
  
  function hashNoise(x, y) {
    const n = Math.sin((x + 1) * 127.1 + (y + 1) * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  
  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  let messageEl = null;
  
  const cellMessages = {
    "4,1": "薄い壁の向こうから冷たい風が漏れている。",
    "6,4": "床石に古い紋章が刻まれている。",
    "8,6": "境界壁の向こうで鎖の鳴る音がした。",
    "2,8": "湿った苔が足音を吸い込む。",
    "8,8": "壁線の切れ目に古い傷跡がある。"
  };
  
  function configureEvents({ messageEl: element }) {
    messageEl = element;
  }
  
  function messageFor(x, y, cellType = "floor") {
    if (cellType === "stairsUp") return "上り階段がある。";
    if (cellType === "stairsDown") return "下り階段がある。";
    const key = `${x},${y}`;
    return cellMessages[key] || "たいまつの火が壁面をゆらした。";
  }
  
  function say(text) {
    if (messageEl) messageEl.textContent = text;
  }

  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d", { alpha: false });
  const W = canvas.width;


  buildBoundaryWallMap();
  let startDir = chooseStartDirection();

  resetPlayer(startDir);


  const posEl = document.getElementById("pos");
  const dirEl = document.getElementById("dir");
  const msgEl = document.getElementById("message");
  const torchMeterEl = document.getElementById("torchMeter");
  const forwardBtn = document.getElementById("forward");
  const backBtn = document.getElementById("back");
  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const autoReturnBtn = document.getElementById("autoReturn");
  const randomGenerateBtn = document.getElementById("randomGenerate");
  const virtualStickEl = document.getElementById("virtualStick");
  const buttonA = document.getElementById("buttonA");
  const buttonB = document.getElementById("buttonB");
  configureDevice();
  configureEvents({ messageEl: msgEl });
  configureRenderer({
    canvas,
    ctx,
    state,
    wallOnCell,
    inBounds,
    updateAnimation,
    updateHud,
    drawMinimap,
    getMinimapOptions: () => ({
      W,
      H: canvas.height,
      MAP_W,
      MAP_H,
      cells,
      explored,
      state
    }),
    getMinimapBounds
  });
  configureAutoReturn({ autoReturnBtn, say });
  configurePlayer({ say, cancelAutoReturn, continueAutoReturn, messageFor });

  function generateRandomDungeon() {
    cancelAutoReturn(false);
    buildBoundaryWallMap();
    startDir = chooseStartDirection();
    resetExplored();
    resetPlayer(startDir);
    updateAutoReturnButton();
    say("新しいランダムダンジョンを生成した。");
    updateHud();
  }

  function updateHud() {
    posEl.textContent = `X:${state.gridX} Y:${state.gridY}`;
    dirEl.textContent = DIRS[state.dir].label;
    torchMeterEl.style.width = `${state.torchFuel}%`;
  }

  configureInput({
    forwardBtn,
    backBtn,
    leftBtn,
    rightBtn,
    autoReturnBtn,
    randomGenerateBtn,
    manualMove,
    manualTurn,
    startAutoReturn,
    generateRandomDungeon,
    buttonA,
    buttonB,
    say
  });
  configureVirtualStick({
    stickEl: virtualStickEl,
    manualMove,
    manualTurn
  });

  updateAutoReturnButton();
  startRenderLoop();
})();











