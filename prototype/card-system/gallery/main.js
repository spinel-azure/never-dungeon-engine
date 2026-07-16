import { CARD_DISPLAY_MODES, CARD_RARITIES, CARDS } from "../data/cards.js";
import { drawCard } from "../renderers/card-renderer.js";
import {
  clearAllRenderCaches,
  clearCardCache,
  getRenderCacheStats,
} from "../renderers/cache/render-cache.js";
import { createRenderDebugMonitor } from "../renderers/debug/render-debug.js";
import { GALLERY_MAX_FPS } from "../renderers/render-config.js";

const canvas = document.querySelector("#cardCanvas");
const context = canvas.getContext("2d");
const galleryModeButton = document.querySelector("#galleryModeButton");
const deckModeButton = document.querySelector("#deckModeButton");
const modeMessage = document.querySelector("#modeMessage");
const debugPanel = document.querySelector("#debugPanel");
const cardHeading = document.querySelector("#cardHeading");

const CARD_RECT = Object.freeze({
  x: 16,
  y: 14,
  width: 328,
  height: 512,
  radius: 22,
});

const FRAME_INTERVAL = 1000 / GALLERY_MAX_FPS;
const urlParameters = new URLSearchParams(globalThis.location?.search ?? "");
const debugEnabled = urlParameters.get("debug") === "1";
const debugMonitor = createRenderDebugMonitor(debugPanel, debugEnabled);

function resolveSelectedCard() {
  const entries = Object.entries(CARDS);
  const requestedCard = urlParameters.get("card");
  const requestedRarity = urlParameters.get("rarity")?.toUpperCase();
  const cardEntry = entries.find(([key, card]) => key === requestedCard || card.id === requestedCard);
  if (cardEntry) return cardEntry[1];
  if (requestedRarity && CARD_RARITIES[requestedRarity]) {
    const rarityCard = entries.find(([, card]) => card.rarity === requestedRarity);
    if (rarityCard) return rarityCard[1];
  }
  return entries[0]?.[1] ?? null;
}

const selectedCard = resolveSelectedCard();

const state = {
  mode: CARD_DISPLAY_MODES.GALLERY,
  animationFrameId: null,
  redrawFrameId: null,
  lastGalleryDrawTime: Number.NEGATIVE_INFINITY,
  flashStartedAt: Number.NEGATIVE_INFINITY,
  pointer: { x: 0.5, y: 0.45 },
};

function getCurrentTime() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function render(time = 0) {
  if (!selectedCard) return;
  const drawStartedAt = getCurrentTime();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#040711";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawCard(context, selectedCard, CARD_RECT, {
    mode: state.mode,
    time,
    themeId: "default",
    glow: true,
    pointer: state.pointer,
    flashStartedAt: state.flashStartedAt,
  });
  const drawTime = getCurrentTime() - drawStartedAt;
  debugMonitor.recordFrame(time || drawStartedAt, drawTime, state.mode, getRenderCacheStats());
}

function updateCardInformation() {
  if (!selectedCard) return;
  const rarityName = CARD_RARITIES[selectedCard.rarity]?.name ?? selectedCard.rarity;
  cardHeading.textContent = `${rarityName} / ${selectedCard.name}`;
  canvas.setAttribute("aria-label", `レアリティ${selectedCard.rarity}、${selectedCard.name}カード`);
  document.title = `NDE Card Gallery - ${selectedCard.name}`;
}

function updatePointer(event) {
  const bounds = canvas.getBoundingClientRect();
  state.pointer.x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
  state.pointer.y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
}

function animate(time) {
  state.animationFrameId = null;
  const elapsed = time - state.lastGalleryDrawTime;
  if (!Number.isFinite(state.lastGalleryDrawTime) || elapsed >= FRAME_INTERVAL) {
    render(time);
    state.lastGalleryDrawTime = Number.isFinite(elapsed)
      ? time - (elapsed % FRAME_INTERVAL)
      : time;
  }
  if (state.mode === CARD_DISPLAY_MODES.GALLERY && !document.hidden) {
    state.animationFrameId = requestAnimationFrame(animate);
  }
}

function startGalleryAnimation() {
  if (state.animationFrameId === null && !document.hidden) {
    state.lastGalleryDrawTime = Number.NEGATIVE_INFINITY;
    state.animationFrameId = requestAnimationFrame(animate);
  }
}

function stopGalleryAnimation() {
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
}

function cancelStaticRedraw() {
  if (state.redrawFrameId !== null) {
    cancelAnimationFrame(state.redrawFrameId);
    state.redrawFrameId = null;
  }
}

function requestStaticRedraw() {
  if (state.redrawFrameId !== null) return;
  state.redrawFrameId = requestAnimationFrame((time) => {
    state.redrawFrameId = null;
    if (state.mode === CARD_DISPLAY_MODES.DECK) render(time);
  });
}

function updateControls() {
  const galleryActive = state.mode === CARD_DISPLAY_MODES.GALLERY;
  galleryModeButton.setAttribute("aria-pressed", String(galleryActive));
  deckModeButton.setAttribute("aria-pressed", String(!galleryActive));
  modeMessage.textContent = galleryActive
    ? `GALLERY VIEW / EFFECT ON / MAX ${GALLERY_MAX_FPS} FPS`
    : "DECK VIEW / STATIC CACHED RENDER";
}

function setMode(mode) {
  if (state.mode === mode) return;
  stopGalleryAnimation();
  cancelStaticRedraw();
  state.mode = mode;
  updateControls();

  if (mode === CARD_DISPLAY_MODES.GALLERY) {
    render(0);
    startGalleryAnimation();
  } else {
    requestStaticRedraw();
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopGalleryAnimation();
    cancelStaticRedraw();
  } else if (state.mode === CARD_DISPLAY_MODES.GALLERY) {
    startGalleryAnimation();
  } else {
    requestStaticRedraw();
  }
}

galleryModeButton.addEventListener("click", () => setMode(CARD_DISPLAY_MODES.GALLERY));
deckModeButton.addEventListener("click", () => setMode(CARD_DISPLAY_MODES.DECK));
canvas.addEventListener("pointermove", updatePointer);
canvas.addEventListener("pointerdown", (event) => {
  updatePointer(event);
  state.flashStartedAt = getCurrentTime();
  if (state.mode === CARD_DISPLAY_MODES.GALLERY) render(state.flashStartedAt);
});
canvas.addEventListener("pointerleave", () => {
  state.pointer.x = 0.5;
  state.pointer.y = 0.45;
});
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pagehide", () => {
  stopGalleryAnimation();
  cancelStaticRedraw();
});
window.addEventListener("resize", () => {
  clearAllRenderCaches();
  if (state.mode === CARD_DISPLAY_MODES.DECK) requestStaticRedraw();
});

if (debugMonitor.enabled) {
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "c") return;
    clearAllRenderCaches();
    if (state.mode === CARD_DISPLAY_MODES.DECK) {
      requestStaticRedraw();
    } else {
      render(0);
    }
  });
}

updateCardInformation();
updateControls();
render(0);
document.fonts?.ready.then(() => {
  clearCardCache();
  if (state.mode === CARD_DISPLAY_MODES.DECK) requestStaticRedraw();
});
startGalleryAnimation();
