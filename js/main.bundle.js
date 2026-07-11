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
  const NORMAL_DOOR_COUNT = 6;
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
        walls: { N: true, E: true, S: true, W: true },
        doors: { N: null, E: null, S: null, W: null }
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
    placeNormalDoors(NORMAL_DOOR_COUNT);
  }
  
  function resetAllWalls() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        cells[y][x].type = "floor";
        cells[y][x].walls = { N: true, E: true, S: true, W: true };
        cells[y][x].doors = { N: null, E: null, S: null, W: null };
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

  function placeNormalDoors(count = NORMAL_DOOR_COUNT) {
    resetDoors();
    const distances = makeDistanceMap(START_X, START_Y);
    const candidates = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        for (const dir of [DIR_BY_KEY.E, DIR_BY_KEY.S]) {
          const nx = x + dir.dx;
          const ny = y + dir.dy;
          if (!inBounds(nx, ny)) continue;
          if (cells[y][x].walls[dir.key]) continue;
          if (isStairCell(x, y) || isStairCell(nx, ny)) continue;
          if (distances[y][x] < 3 || distances[ny][nx] < 3) continue;
          candidates.push({ x, y, dir: dir.key });
        }
      }
    }

    shuffled(candidates).slice(0, count).forEach(door => {
      setWall(door.x, door.y, door.dir, true);
      setDoor(door.x, door.y, door.dir, "closed");
    });
  }

  function resetDoors() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        cells[y][x].doors = { N: null, E: null, S: null, W: null };
      }
    }
  }

  function isStairCell(x, y) {
    return inBounds(x, y) && (cells[y][x].type === "stairsUp" || cells[y][x].type === "stairsDown");
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

  function setDoor(x, y, dirKey, value) {
    if (!inBounds(x, y)) return;
    const dir = DIR_BY_KEY[dirKey];
    cells[y][x].doors[dirKey] = value;
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (inBounds(nx, ny)) cells[ny][nx].doors[dir.opposite] = value;
  }

  function getDoorState(x, y, dirKey) {
    if (!inBounds(x, y)) return null;
    return cells[y][x].doors[dirKey];
  }

  function closedDoorOnCell(x, y, dirKey) {
    return getDoorState(x, y, dirKey) === "closed";
  }

  function lockedDoorOnCell(x, y, dirKey) {
    return getDoorState(x, y, dirKey) === "locked";
  }

  function openDoorOnCell(x, y, dirKey) {
    return getDoorState(x, y, dirKey) === "open";
  }

  function openDoor(x, y, dirKey) {
    if (closedDoorOnCell(x, y, dirKey)) setDoor(x, y, dirKey, "open");
  }
  
  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  }
  
  function wallOnCell(x, y, dirKey) {
    if (!inBounds(x, y)) return true;
    const doorState = getDoorState(x, y, dirKey);
    if (doorState === "open") return false;
    if (doorState === "closed" || doorState === "locked") return true;
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
  const DOOR_OPEN_MS = 520;
  
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
    } else if (a.type === "turn") {
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
      } else if (a.type === "turn") {
        state.dir = a.toDir;
        state.angle = DIRS[state.dir].angle;
      } else if (a.type === "door") {
        openDoor(a.x, a.y, a.dirKey);
        hooks.say("\u6249\u304c\u3000\u3072\u3089\u3044\u305f\u3002");
      }
      state.anim = null;
      if (state.autoReturning) hooks.continueAutoReturn();
    }
  }
  
  function tryMove(amount, automated = false) {
    if (state.anim) return;
    if (!automated) hooks.cancelAutoReturn(false);
    const currentDir = amount > 0 ? DIRS[state.dir] : DIRS[(state.dir + 2) % 4];
    if (closedDoorOnCell(state.gridX, state.gridY, currentDir.key)) {
      state.anim = {
        type: "door",
        start: performance.now(),
        duration: DOOR_OPEN_MS,
        x: state.gridX,
        y: state.gridY,
        dirKey: currentDir.key
      };
      state.shake = amount > 0 ? -3 : 3;
      hooks.say("\u30ae\u30a3\u2026\u2026");
      return;
    }
    if (wallOnCell(state.gridX, state.gridY, currentDir.key)) {
      state.shake = amount > 0 ? -7 : 5;
      hooks.say("\u30bb\u30eb\u5883\u754c\u306e\u58c1\u306b\u884c\u304f\u624b\u3092\u963b\u307e\u308c\u305f\u3002");
      return;
    }
    const nx = state.gridX + currentDir.dx;
    const ny = state.gridY + currentDir.dy;
    if (!inBounds(nx, ny)) {
      state.shake = amount > 0 ? -7 : 5;
      hooks.say("\u5916\u5468\u306e\u5411\u3053\u3046\u306f\u95c7\u306b\u9589\u3056\u3055\u308c\u3066\u3044\u308b\u3002");
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
      hooks.say("\u5e30\u9084\u3092\u4e2d\u65ad\u3057\u305f\u3002");
    }
    if (!state.anim) tryMove(amount);
  }
  
  function manualTurn(amount) {
    if (state.autoReturning) {
      hooks.cancelAutoReturn(false);
      hooks.say("\u5e30\u9084\u3092\u4e2d\u65ad\u3057\u305f\u3002");
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
  
  function configureRenderer(options) {
    Object.assign(renderer, options);
    renderer.W = renderer.canvas.width;
    renderer.H = renderer.canvas.height;
    renderer.wallTexture = makeWallTexture();
    renderer.doorTexture = makeDoorTexture();
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
    ctx.fillText("\u3042\u305f\u308a\u306f\u304f\u3089\u3084\u307f\u306b\u3000\u3064\u3064\u307e\u308c\u305f\u2026\u3002", W / 2, H / 2);
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

  function drawCellEvents() {
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
    const y = Math.max(H * .5, Math.min(H * .94, H / 2 + projectedWallH / 2));
    const size = Math.max(14, Math.min(104, (H * .32) / Math.max(.8, forward)));
    const alpha = Math.max(.52, Math.min(1, 1 - forward / (MAX_DIST * 1.45)));
    return { x, y, size, alpha, forward };
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
    const label = isUp ? "\u2191" : "\u2193";
    const r = event.size * .52;
    const ringY = event.y;
    const glowY = event.y - r * .2;

    ctx.save();
    ctx.globalAlpha = event.alpha;
    const glow = ctx.createRadialGradient(event.x, glowY, 2, event.x, glowY, r * 2.15);
    glow.addColorStop(0, isUp ? "rgba(142,212,255,.68)" : "rgba(243,177,90,.68)");
    glow.addColorStop(.5, isUp ? "rgba(142,212,255,.24)" : "rgba(243,177,90,.24)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(event.x, glowY, r * 2.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,.26)";
    ctx.beginPath();
    ctx.ellipse(event.x, ringY + r * .18, r * 1.28, r * .46, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, event.size * .06);
    ctx.beginPath();
    ctx.ellipse(event.x, ringY, r * 1.15, r * .46, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(14, event.size * .88)}px GameFont, sans-serif`;
    ctx.shadowColor = color;
    ctx.shadowBlur = event.size * .32;
    ctx.fillText(label, event.x, ringY - r * .55);
    ctx.restore();
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
  
  function makeHit(dist, u, dirKey, side, angle, type = "wall", doorState = null, cellX = null, cellY = null) {
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

  function makeDoorTexture() {
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

  function isDoorEdgeSample(u) {
    return u < 0.12 || u > 0.88 || (u > .47 && u < .53);
  }

  function isDoorPanelSample(u) {
    return u >= 0.28 && u <= 0.72;
  }

  function isDoorPanelEdgeSample(u) {
    return (u > 0.28 && u < 0.31) || (u > 0.69 && u < 0.72) || (u > .49 && u < .51);
  }

  function normalizeDoorSample(u) {
    return Math.max(0, Math.min(1, (u - 0.28) / 0.44));
  }

  function getDoorOpeningProgress(hit) {
    const a = renderer.state?.anim;
    if (!a || a.type !== "door") return 0;
    if (a.x !== hit.cellX || a.y !== hit.cellY || a.dirKey !== hit.dirKey) return 0;
    const p = Math.max(0, Math.min(1, (performance.now() - a.start) / a.duration));
    return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  function isDoorOpeningGap(doorU, opening) {
    if (opening <= 0) return false;
    const halfGap = opening * .46;
    return Math.abs(doorU - .5) < halfGap;
  }

  function isDoorOpeningEdge(doorU, opening) {
    if (opening <= 0) return false;
    const halfGap = opening * .46;
    const distance = Math.abs(Math.abs(doorU - .5) - halfGap);
    return distance < .035;
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
      options.say("\u3059\u3067\u306b\u30b9\u30bf\u30fc\u30c8\u5730\u70b9\u306b\u3044\u308b\u3002");
      return;
    }
    const path = findExploredPathToStart();
    if (!path.length) {
      options.say("\u8e0f\u7834\u6e08\u307f\u306e\u9053\u3060\u3051\u3067\u306f\u30b9\u30bf\u30fc\u30c8\u5730\u70b9\u3078\u623b\u308c\u306a\u3044\u3002");
      return;
    }
    state.autoReturning = true;
    state.autoPath = path;
    updateAutoReturnButton();
    options.say("\u8e0f\u7834\u6e08\u307f\u306e\u9053\u3092\u305f\u3069\u3063\u3066\u5e30\u9084\u3059\u308b\u3002");
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
      options.say("\u5e30\u9084\u7d4c\u8def\u3092\u898b\u5931\u3063\u305f\u3002");
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
    if (arrived) options.say("\u30b9\u30bf\u30fc\u30c8\u5730\u70b9\u3078\u623b\u3063\u305f\u3002");
  }
  
  function updateAutoReturnButton() {
    if (!options.autoReturnBtn) return;
    options.autoReturnBtn.disabled = state.autoReturning;
    options.autoReturnBtn.textContent = state.autoReturning ? "\u5e30\u9084\u4e2d..." : "\u5e30\u9084";
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
    bindControl(buttonA, () => say("A\u30dc\u30bf\u30f3\u3092\u62bc\u3057\u305f\u3002"));
    bindControl(buttonB, () => say("B\u30dc\u30bf\u30f3\u3092\u62bc\u3057\u305f\u3002"));
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

    ctx.lineCap = "round";
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (!explored[y][x]) continue;
        const c = cells[y][x];
        const x1 = ox + x * cell;
        const y1 = oy + y * cell;
        const x2 = x1 + cell;
        const y2 = y1 + cell;
        drawDoorMark(ctx, x1, y1, x2, y1, c.doors.N, cell);
        drawDoorMark(ctx, x2, y1, x2, y2, c.doors.E, cell);
        drawDoorMark(ctx, x1, y2, x2, y2, c.doors.S, cell);
        drawDoorMark(ctx, x1, y1, x1, y2, c.doors.W, cell);
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

  function drawDoorMark(ctx, x1, y1, x2, y2, state, cellSize) {
    if (!state) return;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.max(4, cellSize * .46);
    const half = length / 2;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const color = state === "locked" ? "#c78dff" : state === "open" ? "#dfc18a" : "#f0b35a";
    ctx.save();

    ctx.strokeStyle = "#151d19";
    ctx.lineWidth = Math.max(3, cellSize * .34);
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(mx - half, my);
      ctx.lineTo(mx + half, my);
    } else {
      ctx.moveTo(mx, my - half);
      ctx.lineTo(mx, my + half);
    }
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.8, cellSize * .18);
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(mx - half * .62, my);
      ctx.lineTo(mx + half * .62, my);
    } else {
      ctx.moveTo(mx, my - half * .62);
      ctx.lineTo(mx, my + half * .62);
    }
    ctx.stroke();

    if (state === "open") {
      ctx.strokeStyle = "rgba(255,239,194,.76)";
      ctx.lineWidth = Math.max(1.2, cellSize * .1);
      ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(mx - half * .12, my);
      ctx.lineTo(mx + half * .48, my + half * .52);
    } else {
      ctx.moveTo(mx, my + half * .12);
      ctx.lineTo(mx + half * .52, my - half * .48);
      }
      ctx.stroke();
    }
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
    "4,1": "\u8584\u3044\u58c1\u306e\u5411\u3053\u3046\u304b\u3089\u51b7\u305f\u3044\u98a8\u304c\u6f0f\u308c\u3066\u3044\u308b\u3002",
    "6,4": "\u5e8a\u77f3\u306b\u53e4\u3044\u7d0b\u7ae0\u304c\u523b\u307e\u308c\u3066\u3044\u308b\u3002",
    "8,6": "\u5883\u754c\u58c1\u306e\u5411\u3053\u3046\u3067\u9396\u306e\u9cf4\u308b\u97f3\u304c\u3057\u305f\u3002",
    "2,8": "\u6e7f\u3063\u305f\u82d4\u304c\u8db3\u97f3\u3092\u5438\u3044\u8fbc\u3080\u3002",
    "8,8": "\u58c1\u7dda\u306e\u5207\u308c\u76ee\u306b\u53e4\u3044\u50b7\u8de1\u304c\u3042\u308b\u3002"
  };
  
  function configureEvents({ messageEl: element }) {
    messageEl = element;
  }
  
  function messageFor(x, y, cellType = "floor") {
    if (cellType === "stairsUp") return "\u4e0a\u308a\u968e\u6bb5\u304c\u3042\u308b\u3002";
    if (cellType === "stairsDown") return "\u4e0b\u308a\u968e\u6bb5\u304c\u3042\u308b\u3002";
    const key = `${x},${y}`;
    return cellMessages[key] || "\u305f\u3044\u307e\u3064\u306e\u706b\u304c\u58c1\u9762\u3092\u3086\u3089\u3057\u305f\u3002";
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
    closedDoorOnCell,
    openDoorOnCell,
    getDoorState,
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
    say("\u65b0\u3057\u3044\u30e9\u30f3\u30c0\u30e0\u30c0\u30f3\u30b8\u30e7\u30f3\u3092\u751f\u6210\u3057\u305f\u3002");
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









