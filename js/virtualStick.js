const DEAD_ZONE = 24;
const MAX_RADIUS = 40;

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
  let inputLocked = false;

  function begin(e) {
    if (activePointerId !== null) return;
    activePointerId = e.pointerId;
    inputLocked = false;
    const rect = stickEl.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    stickEl.setPointerCapture(e.pointerId);
    update(e);
  }

  function update(e) {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const limited = Math.min(distance, MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const knobX = distance ? Math.cos(angle) * limited : 0;
    const knobY = distance ? Math.sin(angle) * limited : 0;

    if (knob) knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    if (distance < DEAD_ZONE) {
      inputLocked = false;
      return;
    }
    if (inputLocked) return;

    inputLocked = true;
    if (Math.abs(dx) > Math.abs(dy)) {
      manualTurn(dx < 0 ? -1 : 1);
    } else {
      manualMove(dy < 0 ? 1 : -1);
    }
  }

  function end(e) {
    if (e.pointerId !== activePointerId) return;
    if (stickEl.hasPointerCapture(e.pointerId)) {
      stickEl.releasePointerCapture(e.pointerId);
    }
    activePointerId = null;
    inputLocked = false;
    if (knob) knob.style.transform = "translate(0, 0)";
  }

  stickEl.addEventListener("pointerdown", begin);
  stickEl.addEventListener("pointermove", update);
  stickEl.addEventListener("pointerup", end);
  stickEl.addEventListener("pointercancel", end);
}
