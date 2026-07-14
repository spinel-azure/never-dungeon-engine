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
  openDoor,
  getNpcAt,
  removeNpcAt
} from "./dungeon.js";
import { getNpcEncounter } from "../data/npcs.js";
import { onPlayerStep, resetPresence } from "./presence.js";

const hooks = {
  say: () => {},
  cancelAutoReturn: () => {},
  continueAutoReturn: () => {},
  messageFor: () => ""
};

const NPC_AWARENESS_MESSAGE = "前方に何かいるようだ";

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
    autoPath: [],
    overlayEvent: null,
    npcAwarenessShown: false,
    npcEncounterCounts: {},
    stairsPromptDismissed: false
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
  state.overlayEvent = null;
  state.npcAwarenessShown = false;
  state.stairsPromptDismissed = false;
  markExplored(START_X, START_Y);
}

export function refillTorch() {
  state.torchFuel = TORCH_FUEL_MAX;
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
      if (a.npcRetreat) {
        markExplored(state.gridX, state.gridY);
        updateNpcAwareness();
      } else {
        markExplored(state.gridX, state.gridY);
        const movedInDarkness = state.torchFuel <= 0;
        state.torchFuel = Math.max(0, state.torchFuel - TORCH_FUEL_STEP);
        const npc = getNpcAt(state.gridX, state.gridY);
        const isStairs = a.cellType === "stairsUp" || a.cellType === "stairsDown";
        const isSpecialEventCell = Boolean(npc) || isStairs;
        const encounterTriggered = !isSpecialEventCell && onPlayerStep({ inDarkness: movedInDarkness });
        if (encounterTriggered) hooks.cancelAutoReturn(false);
        if (npc) {
          startNpcTalkEvent(npc, a.fromGX, a.fromGY);
        } else if (isStairs) {
          startStairsPrompt(a.cellType);
        } else if (encounterTriggered) {
          state.npcAwarenessShown = false;
        } else {
          hooks.say(hooks.messageFor(state.gridX, state.gridY, a.cellType));
          updateNpcAwareness();
        }
      }
    } else if (a.type === "turn") {
      state.dir = a.toDir;
      state.angle = DIRS[state.dir].angle;
      updateNpcAwareness();
    } else if (a.type === "door") {
      openDoor(a.x, a.y, a.dirKey);
      hooks.say("扉が　ひらいた。");
      updateNpcAwareness();
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
    state.shake = amount > 0 ? -12 : 9;
    hooks.say("そちらには進めない。");
    return;
  }
  const nx = state.gridX + currentDir.dx;
  const ny = state.gridY + currentDir.dy;
  if (!inBounds(nx, ny)) {
    state.shake = amount > 0 ? -7 : 5;
    hooks.say("外周の向こうは闇に閉ざされている。");
    return;
  }
  state.stairsPromptDismissed = false;
  state.anim = {
    type: "move",
    start: performance.now(),
    duration: STEP_MS,
    fromX: state.x,
    fromY: state.y,
    fromGX: state.gridX,
    fromGY: state.gridY,
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
  if (state.overlayEvent) return;
  if (state.autoReturning) {
    hooks.cancelAutoReturn(false);
    hooks.say("帰還を中断した。");
  }
  if (!state.anim) tryMove(amount);
}

export function manualTurn(amount) {
  if (state.overlayEvent) return;
  if (state.autoReturning) {
    hooks.cancelAutoReturn(false);
    hooks.say("帰還を中断した。");
  }
  if (!state.anim) turn(amount);
}

export function handleOverlayEventInput(action) {
  if (!state.overlayEvent) return false;
  if (action === "cancel") {
    cancelOverlayEvent();
    return true;
  }
  if (action === "confirm") {
    if (state.overlayEvent.type === "npcTalk") advanceNpcTalkEvent();
    else if (state.overlayEvent.type === "stairsPrompt") confirmStairsPrompt();
    else if (state.overlayEvent.type === "randomEncounter") confirmRandomEncounter();
    return true;
  }
  return true;
}

export function startRandomEncounterNotice(message) {
  startOverlayEvent({
    type: "randomEncounter",
    showOverlay: false,
    message: `${message}\n＊Aボタンで次へ`
  });
}

function confirmRandomEncounter() {
  state.overlayEvent = null;
  resetPresence();
  hooks.say("");
  updateNpcAwareness();
}

function startStairsPrompt(cellType) {
  state.stairsPromptDismissed = false;
  startOverlayEvent({
    type: "stairsPrompt",
    showOverlay: false,
    message: hooks.messageFor(state.gridX, state.gridY, cellType),
    canCancel: true
  });
}

function confirmStairsPrompt() {
  state.stairsPromptDismissed = false;
  state.overlayEvent = null;
  hooks.say("まだ実装されていません。");
}

export function resumeDismissedStairsPrompt() {
  if (!state.stairsPromptDismissed || state.overlayEvent || state.anim) return false;
  const cellType = getCellType(state.gridX, state.gridY);
  if (cellType !== "stairsUp" && cellType !== "stairsDown") {
    state.stairsPromptDismissed = false;
    return false;
  }
  startStairsPrompt(cellType);
  return true;
}

function startNpcTalkEvent(npc, fromGX, fromGY) {
  const encounterCount = getNpcEncounterCount(npc.id);
  const encounter = getNpcEncounter(npc, encounterCount);
  const greeting = npc.greeting ? `${npc.name}「${npc.greeting}」\n` : "";
  startOverlayEvent({
    type: "npcTalk",
    imageId: npc.imageId,
    npc,
    fromGX,
    fromGY,
    npcGX: state.gridX,
    npcGY: state.gridY,
    dialogue: encounter?.dialogue || [],
    dialogueIndex: -1,
    encounterCount,
    leaveAfterTalk: encounter?.leaveAfterTalk || false,
    message: `${greeting}＊Aボタンで会話　Bボタンで抜けます`,
    canCancel: npc.canCancel,
    retreatOnCancel: npc.retreatOnCancel
  });
}

function advanceNpcTalkEvent() {
  const event = state.overlayEvent;
  const nextIndex = event.dialogueIndex + 1;
  if (nextIndex < event.dialogue.length) {
    event.dialogueIndex = nextIndex;
    hooks.say(`${event.npc.name}「${event.dialogue[nextIndex]}」\n＊Aボタンで次へ`);
    return;
  }

  state.npcEncounterCounts[event.npc.id] = event.encounterCount + 1;
  state.overlayEvent = null;
  if (event.leaveAfterTalk) {
    removeNpcAt(event.npcGX, event.npcGY);
    hooks.say(`${event.npc.name}は去っていった。`);
    return;
  }

  hooks.say("");
  startNpcRetreat(event);
}

export function getNpcEncounterCount(npcId) {
  return state.npcEncounterCounts[npcId] || 0;
}

export function startOverlayEvent(event) {
  state.overlayEvent = {
    canCancel: false,
    retreatOnCancel: false,
    showOverlay: true,
    ...event
  };
  state.npcAwarenessShown = false;
  hooks.cancelAutoReturn(false);
  if (state.overlayEvent.message) hooks.say(state.overlayEvent.message);
}

function cancelOverlayEvent() {
  const event = state.overlayEvent;
  if (!event?.canCancel) return;
  if (event.type === "stairsPrompt") state.stairsPromptDismissed = true;
  state.overlayEvent = null;
  hooks.say("");
  if (event.retreatOnCancel) startNpcRetreat(event);
}

function startNpcRetreat(event) {
  if (state.anim) return;
  state.anim = {
    type: "move",
    start: performance.now(),
    duration: STEP_MS,
    fromX: state.x,
    fromY: state.y,
    toX: event.fromGX + .5,
    toY: event.fromGY + .5,
    toGX: event.fromGX,
    toGY: event.fromGY,
    cellType: getCellType(event.fromGX, event.fromGY),
    npcRetreat: true
  };
}

function updateNpcAwareness() {
  if (state.overlayEvent) return;
  const dir = DIRS[state.dir];
  const isBlocked = wallOnCell(state.gridX, state.gridY, dir.key);
  const npc = isBlocked ? null : getNpcAt(state.gridX + dir.dx, state.gridY + dir.dy);
  if (npc) {
    state.npcAwarenessShown = true;
    hooks.say(NPC_AWARENESS_MESSAGE);
  } else if (state.npcAwarenessShown) {
    state.npcAwarenessShown = false;
    hooks.say("");
  }
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
