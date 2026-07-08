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
  }, { passive: false });

  forwardBtn.addEventListener("click", () => manualMove(1));
  backBtn.addEventListener("click", () => manualMove(-1));
  leftBtn.addEventListener("click", () => manualTurn(-1));
  rightBtn.addEventListener("click", () => manualTurn(1));
  autoReturnBtn.addEventListener("click", startAutoReturn);
  randomGenerateBtn.addEventListener("click", generateRandomDungeon);
  buttonA.addEventListener("click", () => say("Aボタンを押した。"));
  buttonB.addEventListener("click", () => say("Bボタンを押した。"));
  configureTouchGuards();
}

function configureTouchGuards() {
  let lastTouchEnd = 0;

  function isTouchLayout() {
    return document.body.classList.contains("layout-mobile")
      || document.body.classList.contains("layout-tablet");
  }

  document.addEventListener("touchend", (e) => {
    if (!isTouchLayout()) return;
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  document.querySelectorAll(".virtual-stick, .action-buttons, .pad, button, canvas").forEach((el) => {
    el.addEventListener("contextmenu", (e) => {
      if (isTouchLayout()) e.preventDefault();
    });
  });
}
