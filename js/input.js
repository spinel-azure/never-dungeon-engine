export function configureInput({
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
    if (e.code === "KeyX") { e.preventDefault(); actionA(say); }
    if (e.code === "KeyZ") { e.preventDefault(); actionB(say); }
  }, { passive: false });

  bindControl(forwardBtn, () => manualMove(1));
  bindControl(backBtn, () => manualMove(-1));
  bindControl(leftBtn, () => manualTurn(-1));
  bindControl(rightBtn, () => manualTurn(1));
  bindControl(autoReturnBtn, startAutoReturn);
  bindControl(randomGenerateBtn, generateRandomDungeon);
  bindControl(buttonA, () => actionA(say));
  bindControl(buttonB, () => actionB(say));
  configureTouchGuards();
}

function actionA(say) {
  say("決定した。");
}

function actionB(say) {
  say("キャンプメニューを開いた。");
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
