import { CARD_DISPLAY_MODES, CARDS } from "./data/cards.js";
import { drawCard } from "./renderers/card-renderer.js";

const canvas = document.querySelector("#cardCanvas");
const context = canvas.getContext("2d");
const galleryModeButton = document.querySelector("#galleryModeButton");
const deckModeButton = document.querySelector("#deckModeButton");
const modeMessage = document.querySelector("#modeMessage");

const CARD_RECT = Object.freeze({
  x: 16,
  y: 14,
  width: 328,
  height: 512,
  radius: 22,
});

const state = {
  mode: CARD_DISPLAY_MODES.GALLERY,
  animationFrameId: null,
};

function render(time = 0) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#040711";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawCard(context, CARDS.legendaryUnlimitedTorchGauge, CARD_RECT, {
    mode: state.mode,
    time,
  });
}

function animate(time) {
  state.animationFrameId = null;
  render(time);
  if (state.mode === CARD_DISPLAY_MODES.GALLERY && !document.hidden) {
    state.animationFrameId = requestAnimationFrame(animate);
  }
}

function startGalleryAnimation() {
  if (state.animationFrameId === null && !document.hidden) {
    state.animationFrameId = requestAnimationFrame(animate);
  }
}

function stopGalleryAnimation() {
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
}

function updateControls() {
  const galleryActive = state.mode === CARD_DISPLAY_MODES.GALLERY;
  galleryModeButton.setAttribute("aria-pressed", String(galleryActive));
  deckModeButton.setAttribute("aria-pressed", String(!galleryActive));
  modeMessage.textContent = galleryActive
    ? "GALLERY VIEW / RAINBOW EFFECT ON"
    : "DECK VIEW / STATIC LOW-LOAD RENDER";
}

function setMode(mode) {
  if (state.mode === mode) return;
  stopGalleryAnimation();
  state.mode = mode;
  updateControls();
  render(0);
  if (mode === CARD_DISPLAY_MODES.GALLERY) startGalleryAnimation();
}

galleryModeButton.addEventListener("click", () => setMode(CARD_DISPLAY_MODES.GALLERY));
deckModeButton.addEventListener("click", () => setMode(CARD_DISPLAY_MODES.DECK));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopGalleryAnimation();
  } else if (state.mode === CARD_DISPLAY_MODES.GALLERY) {
    startGalleryAnimation();
  }
});

updateControls();
render(0);
document.fonts?.ready.then(() => render(0));
startGalleryAnimation();
