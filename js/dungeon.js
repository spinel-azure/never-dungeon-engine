import {
  MAP_W,
  MAP_H,
  START_X,
  START_Y,
  DIRS,
  DIR_BY_KEY,
  EXTRA_OPENINGS,
  NORMAL_DOOR_COUNT
} from "./config.js";
import { getNpcById } from "../data/npcs.js";

export const cells = makeCells(MAP_W, MAP_H);
export const explored = makeExplored(MAP_W, MAP_H);

export function makeCells(w, h) {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => ({
      x,
      y,
      type: "floor",
      npc: null,
      walls: { N: true, E: true, S: true, W: true },
      doors: { N: null, E: null, S: null, W: null }
    }))
  );
}

export function makeExplored(w, h) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => false));
}

export function markExplored(x, y) {
  if (inBounds(x, y)) explored[y][x] = true;
}

export function resetExplored() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) explored[y][x] = false;
  }
}

export function buildBoundaryWallMap() {
  resetAllWalls();
  carvePerfectMaze();
  addLoopOpenings(EXTRA_OPENINGS);
  if (countReachableCells(START_X, START_Y) !== MAP_W * MAP_H) {
    resetAllWalls();
    carvePerfectMaze();
    addLoopOpenings(EXTRA_OPENINGS);
  }
  placeStairs();
  placeNpc();
  placeNormalDoors(NORMAL_DOOR_COUNT);
}

export function resetAllWalls() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      cells[y][x].type = "floor";
      cells[y][x].npc = null;
      cells[y][x].walls = { N: true, E: true, S: true, W: true };
      cells[y][x].doors = { N: null, E: null, S: null, W: null };
    }
  }
}

export function placeStairs() {
  resetCellTypes();
  cells[START_Y][START_X].type = "stairsUp";
  const stairsDown = findFarthestReachableCell(7);
  if (stairsDown) cells[stairsDown.y][stairsDown.x].type = "stairsDown";
}

export function placeNpc() {
  resetNpcs();
  const distances = makeDistanceMap(START_X, START_Y);
  const candidates = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (x === START_X && y === START_Y) continue;
      if (cells[y][x].type !== "floor") continue;
      if (distances[y][x] < 4) continue;
      // NPCs currently behave as impassable cells. Reject placements that
      // would disconnect any other cell from the dungeon entrance.
      if (countReachableCells(START_X, START_Y, { x, y }) !== MAP_W * MAP_H - 1) continue;
      candidates.push({ x, y, distance: distances[y][x] });
    }
  }

  const selected = shuffled(candidates)[0];
  if (selected) cells[selected.y][selected.x].npc = "NPC_01";
}

export function getCellType(x, y) {
  if (!inBounds(x, y)) return "wall";
  return cells[y][x].type;
}

export function getNpcAt(x, y) {
  if (!inBounds(x, y)) return null;
  return getNpcById(cells[y][x].npc);
}

export function removeNpcAt(x, y) {
  if (!inBounds(x, y) || !cells[y][x].npc) return false;
  cells[y][x].npc = null;
  return true;
}

export function findFarthestReachableCell(minDistance = 7) {
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

export function resetCellTypes() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) cells[y][x].type = "floor";
  }
}

export function resetNpcs() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) cells[y][x].npc = null;
  }
}

export function placeNormalDoors(count = NORMAL_DOOR_COUNT) {
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
        if (cells[y][x].npc || cells[ny][nx].npc) continue;
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

export function resetDoors() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      cells[y][x].doors = { N: null, E: null, S: null, W: null };
    }
  }
}

export function isStairCell(x, y) {
  return inBounds(x, y) && (cells[y][x].type === "stairsUp" || cells[y][x].type === "stairsDown");
}

export function makeDistanceMap(startX, startY) {
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

export function carvePerfectMaze() {
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

export function addLoopOpenings(count) {
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

export function countReachableCells(startX, startY, blockedCell = null) {
  if (blockedCell?.x === startX && blockedCell?.y === startY) return 0;
  const queue = [{ x: startX, y: startY }];
  const seen = new Set([`${startX},${startY}`]);
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const dir of DIRS) {
      const nx = cur.x + dir.dx;
      const ny = cur.y + dir.dy;
      const key = `${nx},${ny}`;
      if (!inBounds(nx, ny)) continue;
      if (blockedCell?.x === nx && blockedCell?.y === ny) continue;
      if (wallOnCell(cur.x, cur.y, dir.key)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen.size;
}

export function shuffled(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function chooseStartDirection() {
  for (const key of ["S", "E", "N", "W"]) {
    const dirIndex = DIRS.findIndex(dir => dir.key === key);
    if (dirIndex >= 0 && !wallOnCell(START_X, START_Y, key)) return dirIndex;
  }
  return 2;
}

export function setWall(x, y, dirKey, value) {
  if (!inBounds(x, y)) return;
  const dir = DIR_BY_KEY[dirKey];
  cells[y][x].walls[dirKey] = value;
  const nx = x + dir.dx;
  const ny = y + dir.dy;
  if (inBounds(nx, ny)) cells[ny][nx].walls[dir.opposite] = value;
}

export function setDoor(x, y, dirKey, value) {
  if (!inBounds(x, y)) return;
  const dir = DIR_BY_KEY[dirKey];
  cells[y][x].doors[dirKey] = value;
  const nx = x + dir.dx;
  const ny = y + dir.dy;
  if (inBounds(nx, ny)) cells[ny][nx].doors[dir.opposite] = value;
}

export function getDoorState(x, y, dirKey) {
  if (!inBounds(x, y)) return null;
  return cells[y][x].doors[dirKey];
}

export function closedDoorOnCell(x, y, dirKey) {
  return getDoorState(x, y, dirKey) === "closed";
}

export function lockedDoorOnCell(x, y, dirKey) {
  return getDoorState(x, y, dirKey) === "locked";
}

export function openDoorOnCell(x, y, dirKey) {
  return getDoorState(x, y, dirKey) === "open";
}

export function openDoor(x, y, dirKey) {
  if (closedDoorOnCell(x, y, dirKey)) setDoor(x, y, dirKey, "open");
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

export function wallOnCell(x, y, dirKey) {
  if (!inBounds(x, y)) return true;
  const doorState = getDoorState(x, y, dirKey);
  if (doorState === "open") return false;
  if (doorState === "closed" || doorState === "locked") return true;
  return cells[y][x].walls[dirKey];
}
