import {
  TAU,
  STEP_MS,
  TURN_MS,
  START_X,
  START_Y,
  DIRS
} from "./config.js";
import {
  getCellType,
  markExplored,
  inBounds,
  wallOnCell,
  closedDoorOnCell,
  openDoor
} from "./dungeon.js";

const hooks = {
  say: () => {},
  cancelAutoReturn: () => {},
  continueAutoReturn: () => {},
  messageFor: () => ""
};

const TORCH_FUEL_MAX = 100;
const TORCH_FUEL_STEP = 1;
const DOOR_OPEN_MS = 520;

export const state = createPlayerState(2);

export function configurePlayer(callbacks) {
  Object.assign(hooks, callbacks);
}

export function createPlayerState(startDir) {
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

export function resetPlayer(startDir) {
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

export function updateAnimation(now) {
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
      hooks.say("扉が　ひらいた。");
    }
    state.anim = null;
    if (state.autoReturning) hooks.continueAutoReturn();
  }
}

export function tryMove(amount, automated = false) {
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
    hooks.say("ギィ……");
    return;
  }
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

export function turn(amount, automated = false) {
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

export function manualMove(amount) {
  if (state.autoReturning) {
    hooks.cancelAutoReturn(false);
    hooks.say("帰還を中断した。");
  }
  if (!state.anim) tryMove(amount);
}

export function manualTurn(amount) {
  if (state.autoReturning) {
    hooks.cancelAutoReturn(false);
    hooks.say("帰還を中断した。");
  }
  if (!state.anim) turn(amount);
}

export function turnToward(from, to) {
  const diff = (to - from + 4) % 4;
  return diff === 3 ? -1 : 1;
}

export function normalize(a) {
  while (a <= -Math.PI) a += TAU;
  while (a > Math.PI) a -= TAU;
  return a;
}

export function angleDelta(from, to) {
  return normalize(to - from);
}
