import {
  MAP_W,
  MAP_H
} from "./config.js";
import {
  cells,
  explored,
  resetExplored,
  buildBoundaryWallMap,
  chooseStartDirection,
  inBounds,
  wallOnCell,
  closedDoorOnCell,
  openDoorOnCell,
  getDoorState
} from "./dungeon.js";
import {
  state,
  configurePlayer,
  resetPlayer,
  refillTorch,
  updateAnimation,
  manualMove,
  manualTurn,
  openDoorAhead,
  handleOverlayEventInput,
  resumeDismissedStairsPrompt,
  startRandomEncounterNotice
} from "./player.js";
import { configureRenderer, startRenderLoop } from "./renderer.js";
import { drawMinimap, getMinimapBounds } from "./minimap.js";
import { configureInput } from "./input.js";
import { configureVirtualStick } from "./virtualStick.js";
import { configureCompass, drawCompass } from "./compass.js";
import { configureMenu, handleMenuInput } from "./menu.js";
import {
  configureAutoReturn,
  startAutoReturn,
  continueAutoReturn,
  cancelAutoReturn,
  updateAutoReturnButton
} from "./autoReturn.js";
import { configureEvents, messageFor, say } from "./events.js";
import { configureDevice } from "./device.js";
import {
  configurePresence,
  getPresence,
  resetPresence
} from "./presence.js";

(() => {
  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d", { alpha: false });
  const eventOverlayCanvas = document.getElementById("eventOverlay");
  const eventOverlayCtx = eventOverlayCanvas.getContext("2d");
  const W = canvas.width;


  buildBoundaryWallMap();
  let startDir = chooseStartDirection();

  resetPlayer(startDir);


  const posEl = document.getElementById("pos");
  const depthEl = document.getElementById("depth");
  const brandEl = document.querySelector(".brand");
  const msgEl = document.getElementById("message");
  const torchMeterEl = document.getElementById("torchMeter");
  const presenceMeterEl = document.getElementById("presenceMeter");
  const compassCanvas = document.getElementById("compass");
  const forwardBtn = document.getElementById("forward");
  const backBtn = document.getElementById("back");
  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const autoReturnBtn = document.getElementById("autoReturn");
  const randomGenerateBtn = document.getElementById("randomGenerate");
  const virtualStickEl = document.getElementById("virtualStick");
  const buttonA = document.getElementById("buttonA");
  const buttonB = document.getElementById("buttonB");
  const menuScreen = document.getElementById("menuScreen");
  let currentDepth = 1;
  configureDevice();
  configureEvents({ messageEl: msgEl });
  configurePresence({
    onEncounter: startRandomEncounterNotice
  });
  configureCompass({ canvas: compassCanvas, state });
  configureRenderer({
    canvas,
    ctx,
    eventOverlayCanvas,
    eventOverlayCtx,
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
  configurePlayer({ say, cancelAutoReturn, continueAutoReturn, messageFor, descendFloor });

  function resetDungeon(message = "") {
    cancelAutoReturn(false);
    buildBoundaryWallMap();
    startDir = chooseStartDirection();
    resetExplored();
    resetPlayer(startDir);
    resetPresence();
    updateAutoReturnButton();
    updateHud();
    if (message) say(message);
  }

  function generateRandomDungeon() {
    resetDungeon();
  }

  function descendFloor() {
    currentDepth += 1;
    resetDungeon(`B${currentDepth}Fへ降りた。`);
  }

  function updateHud() {
    posEl.textContent = `X:${state.gridX} Y:${state.gridY}`;
    depthEl.textContent = `B${currentDepth}F`;
    brandEl.textContent = `RANDOM MAZE TEST B${currentDepth}F`;
    drawCompass();
    torchMeterEl.style.width = `${state.torchFuel}%`;
    const presence = getPresence();
    presenceMeterEl.style.setProperty("--presence", `${presence}%`);
    presenceMeterEl.setAttribute("aria-valuenow", String(presence));
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
    handleOverlayInput: handleOverlayEventInput,
    handleDoorInput: openDoorAhead,
    handleMenuInput
  });
  configureMenu({
    root: menuScreen,
    generateRandomDungeon,
    startAutoReturn,
    refillTorch,
    onReturnToDungeon: resumeDismissedStairsPrompt
  });
  configureVirtualStick({
    stickEl: virtualStickEl,
    manualMove,
    manualTurn,
    handleMenuInput
  });

  updateAutoReturnButton();
  startRenderLoop();
})();










