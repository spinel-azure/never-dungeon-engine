import {
  START_X,
  START_Y,
  DIRS
} from "./config.js";
import {
  explored,
  inBounds,
  wallOnCell
} from "./dungeon.js";
import {
  state,
  turn,
  tryMove,
  turnToward
} from "./player.js";

const options = {
  autoReturnBtn: null,
  say: () => {}
};

export function configureAutoReturn(config) {
  Object.assign(options, config);
}

export function startAutoReturn() {
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

export function continueAutoReturn() {
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

export function cancelAutoReturn(arrived) {
  if (!state.autoReturning && !state.autoPath.length) return;
  state.autoReturning = false;
  state.autoPath = [];
  updateAutoReturnButton();
  if (arrived) options.say("スタート地点へ戻った。");
}

export function updateAutoReturnButton() {
  if (!options.autoReturnBtn) return;
  options.autoReturnBtn.disabled = state.autoReturning;
  options.autoReturnBtn.textContent = state.autoReturning ? "帰還中..." : "帰還";
}

export function findExploredPathToStart() {
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
