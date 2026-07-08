const DEAD_ZONE = 24;
const MAX_RADIUS = 40;
const MOVE_REPEAT_MS = 90;
const HORIZONTAL_TURN_RATIO = 1.6;
const VERTICAL_MOVE_RATIO = 0.65;

export function configureVirtualStick({
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
    const rect = stickEl.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    updateAt(clientX, clientY);
  }

  function updateAt(clientX, clientY) {
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const limited = Math.min(distance, MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const knobX = distance ? Math.cos(angle) * limited : 0;
    const knobY = distance ? Math.sin(angle) * limited : 0;

    if (knob) knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    handleDirection(dx, dy, distance);
  }

  function finishInput() {
    activePointerId = null;
    activeInputKey = null;
    stopRepeat();
    if (knob) knob.style.transform = "translate(0, 0)";
  }

  function findActiveTouch(touches) {
    if (typeof activePointerId !== "string" || !activePointerId.startsWith("touch:")) return null;
    const activeTouchId = Number(activePointerId.slice(6));
    return Array.from(touches).find(touch => touch.identifier === activeTouchId) || null;
  }

  function handleDirection(dx, dy, distance) {
    const direction = getDirection(dx, dy, distance);
    if (!direction) {
      activeInputKey = null;
      stopRepeat();
      return;
    }

    const inputKey = `${direction.type}:${direction.amount}`;
    if (inputKey === activeInputKey) return;

    activeInputKey = inputKey;
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
    if (absY >= absX * VERTICAL_MOVE_RATIO) {
      return { type: "move", amount: dy < 0 ? 1 : -1 };
    }
    if (absX >= absY * HORIZONTAL_TURN_RATIO) {
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
