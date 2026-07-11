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
  updateAnimation,
  manualMove,
  manualTurn
} from "./player.js";
import { configureRenderer, startRenderLoop } from "./renderer.js";
import { drawMinimap, getMinimapBounds } from "./minimap.js";
import { configureInput } from "./input.js";
import { configureVirtualStick } from "./virtualStick.js";
import { configureCompass, drawCompass } from "./compass.js";
import {
  configureAutoReturn,
  startAutoReturn,
  continueAutoReturn,
  cancelAutoReturn,
  updateAutoReturnButton
} from "./autoReturn.js";
import { configureEvents, messageFor, say } from "./events.js";
import { configureDevice } from "./device.js";

(() => {
  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d", { alpha: false });
  const W = canvas.width;


  buildBoundaryWallMap();
  let startDir = chooseStartDirection();

  resetPlayer(startDir);


  const posEl = document.getElementById("pos");
  const msgEl = document.getElementById("message");
  const torchMeterEl = document.getElementById("torchMeter");
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
  configureDevice();
  configureEvents({ messageEl: msgEl });
  configureCompass({ canvas: compassCanvas, state });
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
    say("新しいランダムダンジョンを生成した。");
    updateHud();
  }

  function updateHud() {
    posEl.textContent = `X:${state.gridX} Y:${state.gridY}`;
    drawCompass();
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










