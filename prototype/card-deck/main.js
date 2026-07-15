"use strict";

const DECK_CONFIG = Object.freeze({
  maxCards: 6,
  maxCost: 48,
  cardWidth: 180,
  cardHeight: 260,
});

const CARD_CATALOG = Object.freeze({
  capricorn: { id: "capricorn", rarity: "Z", cost: 8, name: "CAPRICORN" },
  aquarius: { id: "aquarius", rarity: "Z", cost: 8, name: "AQUARIUS" },
  pisces: { id: "pisces", rarity: "Z", cost: 8, name: "PISCES" },
  aries: { id: "aries", rarity: "Z", cost: 8, name: "ARIES" },
});

const deckSlots = [
  CARD_CATALOG.capricorn,
  CARD_CATALOG.aquarius,
  CARD_CATALOG.pisces,
  CARD_CATALOG.aries,
  null,
  null,
];

const state = {
  cursorIndex: 3,
  confirmedIndex: null,
  confirmationTimer: null,
};

const elements = {
  grid: document.querySelector("#deckGrid"),
  deckCost: document.querySelector("#deckCost"),
  totalCost: document.querySelector("#totalCost"),
  status: document.querySelector("#statusMessage"),
  actions: [...document.querySelectorAll("[data-action]")],
};

const THEME = Object.freeze({
  gold: "#e6bd54",
  brightGold: "#fff4ad",
  deepGold: "#704b17",
});

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createStars(seed, count = 34) {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: 0.08 + random() * 0.84,
    y: 0.15 + random() * 0.68,
    radius: 0.35 + random() * 1.05,
    phase: random() * Math.PI * 2,
  }));
}

const cardStars = Object.freeze({
  capricorn: createStars(0xca91c0),
  aquarius: createStars(0xa90117),
  pisces: createStars(0x915ce5),
  aries: createStars(0xa21e50),
});

function roundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function applySymbolStyle(context, size) {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = Math.max(3, size * 0.06);
  context.shadowColor = "rgba(255, 220, 95, 0.95)";
  context.shadowBlur = 13;
}

function drawAriesSymbol(context, centerX, centerY, size) {
  context.save();
  applySymbolStyle(context, size);
  const split = centerY - size * 0.08;
  context.beginPath();
  context.moveTo(centerX, centerY + size * 0.42);
  context.lineTo(centerX, split);
  context.bezierCurveTo(centerX, centerY - size * 0.47, centerX - size * 0.43, centerY - size * 0.48, centerX - size * 0.43, centerY);
  context.bezierCurveTo(centerX - size * 0.43, centerY + size * 0.17, centerX - size * 0.23, centerY + size * 0.16, centerX - size * 0.23, centerY + size * 0.04);
  context.moveTo(centerX, split);
  context.bezierCurveTo(centerX, centerY - size * 0.47, centerX + size * 0.43, centerY - size * 0.48, centerX + size * 0.43, centerY);
  context.bezierCurveTo(centerX + size * 0.43, centerY + size * 0.17, centerX + size * 0.23, centerY + size * 0.16, centerX + size * 0.23, centerY + size * 0.04);
  context.stroke();
  context.restore();
}

function drawCapricornSymbol(context, centerX, centerY, size) {
  context.save();
  applySymbolStyle(context, size);
  context.beginPath();
  context.moveTo(centerX - size * 0.43, centerY - size * 0.2);
  context.quadraticCurveTo(centerX - size * 0.27, centerY - size * 0.38, centerX - size * 0.18, centerY - size * 0.04);
  context.lineTo(centerX - size * 0.02, centerY + size * 0.37);
  context.lineTo(centerX + size * 0.09, centerY - size * 0.06);
  context.bezierCurveTo(centerX + size * 0.19, centerY - size * 0.38, centerX + size * 0.45, centerY - size * 0.13, centerX + size * 0.34, centerY + size * 0.14);
  context.bezierCurveTo(centerX + size * 0.26, centerY + size * 0.34, centerX + size * 0.04, centerY + size * 0.27, centerX + size * 0.05, centerY + size * 0.1);
  context.bezierCurveTo(centerX + size * 0.07, centerY - size * 0.03, centerX + size * 0.29, centerY, centerX + size * 0.41, centerY + size * 0.31);
  context.stroke();
  context.restore();
}

function drawAquariusSymbol(context, centerX, centerY, size) {
  context.save();
  applySymbolStyle(context, size);
  for (const offset of [-size * 0.15, size * 0.17]) {
    context.beginPath();
    context.moveTo(centerX - size * 0.44, centerY + offset);
    for (let index = 0; index < 4; index += 1) {
      const x = centerX - size * 0.44 + size * 0.22 * index;
      context.lineTo(x + size * 0.11, centerY + offset - size * 0.13);
      context.lineTo(x + size * 0.22, centerY + offset);
    }
    context.stroke();
  }
  context.restore();
}

function drawPiscesSymbol(context, centerX, centerY, size) {
  context.save();
  applySymbolStyle(context, size);
  context.beginPath();
  context.moveTo(centerX - size * 0.38, centerY - size * 0.39);
  context.bezierCurveTo(centerX - size * 0.12, centerY - size * 0.18, centerX - size * 0.12, centerY + size * 0.18, centerX - size * 0.38, centerY + size * 0.39);
  context.moveTo(centerX + size * 0.38, centerY - size * 0.39);
  context.bezierCurveTo(centerX + size * 0.12, centerY - size * 0.18, centerX + size * 0.12, centerY + size * 0.18, centerX + size * 0.38, centerY + size * 0.39);
  context.moveTo(centerX - size * 0.36, centerY);
  context.lineTo(centerX + size * 0.36, centerY);
  context.stroke();
  context.restore();
}

const zodiacDrawers = Object.freeze({
  capricorn: drawCapricornSymbol,
  aquarius: drawAquariusSymbol,
  pisces: drawPiscesSymbol,
  aries: drawAriesSymbol,
});

function drawStars(context, stars, time) {
  for (const star of stars) {
    const alpha = 0.2 + 0.48 * ((Math.sin(time * 0.002 + star.phase) + 1) / 2);
    context.globalAlpha = alpha;
    context.fillStyle = "#e5f5ff";
    context.beginPath();
    context.arc(star.x * DECK_CONFIG.cardWidth, star.y * DECK_CONFIG.cardHeight, star.radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawMiniCard(context, card, time) {
  const width = DECK_CONFIG.cardWidth;
  const height = DECK_CONFIG.cardHeight;
  context.clearRect(0, 0, width, height);

  roundedRectPath(context, 3, 3, width - 6, height - 6, 8);
  context.fillStyle = THEME.deepGold;
  context.fill();

  roundedRectPath(context, 7, 7, width - 14, height - 14, 6);
  const body = context.createLinearGradient(0, 0, width, height);
  body.addColorStop(0, "#201a2e");
  body.addColorStop(0.5, "#0d1920");
  body.addColorStop(1, "#090812");
  context.fillStyle = body;
  context.fill();

  context.save();
  roundedRectPath(context, 8, 8, width - 16, height - 16, 5);
  context.clip();
  drawStars(context, cardStars[card.id], time);

  context.strokeStyle = "rgba(227, 190, 83, 0.13)";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(width / 2, height * 0.49, 54, 0, Math.PI * 2);
  context.arc(width / 2, height * 0.49, 74, 0, Math.PI * 2);
  context.stroke();

  const sheenX = ((time * 0.035) % (width + 100)) - 50;
  const sheen = context.createLinearGradient(sheenX - 35, 0, sheenX + 35, height);
  sheen.addColorStop(0, "rgba(100, 205, 255, 0)");
  sheen.addColorStop(0.5, "rgba(166, 231, 255, 0.08)");
  sheen.addColorStop(1, "rgba(255, 122, 218, 0)");
  context.globalCompositeOperation = "screen";
  context.fillStyle = sheen;
  context.fillRect(7, 7, width - 14, height - 14);
  context.globalCompositeOperation = "source-over";
  context.restore();

  zodiacDrawers[card.id](context, width / 2, height * 0.5, 76);

  context.fillStyle = "rgba(5, 6, 11, 0.88)";
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = 1.5;
  context.fillRect(14, 15, 25, 25);
  context.strokeRect(14, 15, 25, 25);
  context.fillStyle = THEME.brightGold;
  context.font = "19px NdePixel, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(card.rarity, 26.5, 28);

  const costX = width - 27;
  const costY = 28;
  context.fillStyle = "#5f4319";
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(costX, costY, 13, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#fffbdc";
  context.font = "17px NdePixel, monospace";
  context.fillText(String(card.cost), costX, costY + 1);

  context.fillStyle = THEME.brightGold;
  context.font = "9px NdePixel, monospace";
  context.fillText("Zodiac", width / 2, 28);

  context.strokeStyle = "rgba(238, 197, 87, 0.7)";
  context.beginPath();
  context.moveTo(22, height - 43);
  context.lineTo(width - 22, height - 43);
  context.stroke();
  context.fillStyle = "#fff7c7";
  context.font = `${card.name.length > 8 ? 13 : 15}px NdePixel, monospace`;
  context.fillText(card.name, width / 2, height - 25);

  roundedRectPath(context, 3, 3, width - 6, height - 6, 8);
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = 2;
  context.shadowColor = "rgba(255, 215, 91, 0.55)";
  context.shadowBlur = 8;
  context.stroke();
}

function calculateDeckCost() {
  return deckSlots.reduce((total, card) => total + (card?.cost ?? 0), 0);
}

function getSlotLabel(card, index) {
  return card
    ? `スロット${index + 1}: ${card.name}、コスト${card.cost}`
    : `スロット${index + 1}: カードを追加`;
}

function createSlot(card, index) {
  const slot = document.createElement("button");
  slot.type = "button";
  slot.className = `card-slot${card ? "" : " is-empty"}`;
  slot.dataset.slotIndex = String(index);
  slot.setAttribute("aria-label", getSlotLabel(card, index));

  if (card) {
    const canvas = document.createElement("canvas");
    canvas.width = DECK_CONFIG.cardWidth;
    canvas.height = DECK_CONFIG.cardHeight;
    canvas.dataset.cardId = card.id;
    slot.append(canvas);
  } else {
    const label = document.createElement("span");
    label.textContent = "ADD CARD";
    slot.append(label);
  }

  slot.addEventListener("click", () => handleSlotPress(index));
  return slot;
}

function renderSlots() {
  elements.grid.replaceChildren(...deckSlots.map(createSlot));
  updateCursor();
}

function updateCursor() {
  const slots = [...elements.grid.querySelectorAll(".card-slot")];
  slots.forEach((slot, index) => {
    slot.classList.toggle("is-cursor", index === state.cursorIndex);
    slot.classList.toggle("is-confirmed", index === state.confirmedIndex);
    slot.setAttribute("aria-current", index === state.cursorIndex ? "true" : "false");
  });
}

function setStatus(message) {
  elements.status.textContent = message;
}

function confirmSlot(index) {
  const card = deckSlots[index];
  state.confirmedIndex = index;
  window.clearTimeout(state.confirmationTimer);
  setStatus(card ? `${card.name} SELECTED` : "ADD CARD SELECTED / NOT IMPLEMENTED");
  updateCursor();
  state.confirmationTimer = window.setTimeout(() => {
    state.confirmedIndex = null;
    updateCursor();
  }, 650);
}

function handleSlotPress(index) {
  if (state.cursorIndex === index) {
    confirmSlot(index);
    return;
  }

  state.cursorIndex = index;
  state.confirmedIndex = null;
  const card = deckSlots[index];
  setStatus(card ? card.name : "EMPTY SLOT");
  updateCursor();
}

function handleAction(action) {
  const messages = {
    back: "BACK / NOT IMPLEMENTED",
    add: "ADD CARD / NOT IMPLEMENTED",
    remove: "REMOVE CARD / NOT IMPLEMENTED",
  };
  setStatus(messages[action]);
}

function drawCards(time) {
  const canvases = elements.grid.querySelectorAll("canvas[data-card-id]");
  canvases.forEach((canvas) => {
    const card = CARD_CATALOG[canvas.dataset.cardId];
    drawMiniCard(canvas.getContext("2d"), card, time);
  });
  requestAnimationFrame(drawCards);
}

function initialize() {
  elements.deckCost.value = String(calculateDeckCost());
  elements.totalCost.value = String(DECK_CONFIG.maxCost);
  renderSlots();
  elements.actions.forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
  requestAnimationFrame(drawCards);
}

initialize();
