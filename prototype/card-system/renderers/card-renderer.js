import { CARD_DISPLAY_MODES } from "../data/cards.js";
import { getCachedCard } from "./cache/card-cache.js";
import { drawCachedIcon } from "./cache/icon-cache.js";
import { drawLegendaryCard } from "./legendary-card.js";
import { drawZodiacCard } from "./zodiac-card.js";

const rarityRenderers = new Map([
  ["L", drawLegendaryCard],
  ["Z", drawZodiacCard],
]);
const warnedRarities = new Set();

export function registerCardRenderer(rarityId, renderer) {
  if (typeof rarityId !== "string" || !rarityId) {
    throw new TypeError("rarityId must be a non-empty string.");
  }
  if (typeof renderer !== "function") {
    throw new TypeError(`Card renderer for ${rarityId} must be a function.`);
  }
  rarityRenderers.set(rarityId, renderer);
}

function drawUnknownRarityCard(context, card, cardRect) {
  context.save();
  context.beginPath();
  context.roundRect(cardRect.x, cardRect.y, cardRect.width, cardRect.height, cardRect.radius ?? 12);
  context.fillStyle = "#111522";
  context.strokeStyle = "#b9c0d0";
  context.lineWidth = 2;
  context.fill();
  context.stroke();
  drawCachedIcon(
    context,
    "unknown",
    cardRect.x + cardRect.width / 2,
    cardRect.y + cardRect.height / 2,
    Math.min(cardRect.width, cardRect.height) * 0.52,
    { variant: "unknown-rarity", glow: false },
  );
  context.fillStyle = "#eef2ff";
  context.font = `${Math.max(12, Math.round(cardRect.width * 0.06))}px NdePixel, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(card.footerText ?? card.name ?? "UNKNOWN CARD", cardRect.x + cardRect.width / 2, cardRect.y + cardRect.height * 0.88);
  context.restore();
}

function drawCardUncached(context, card, cardRect, options) {
  const renderer = rarityRenderers.get(card.rarity);
  if (!renderer) {
    if (!warnedRarities.has(card.rarity)) {
      warnedRarities.add(card.rarity);
      console.warn(`No renderer is registered for rarity: ${card.rarity}. Using fallback card.`);
    }
    drawUnknownRarityCard(context, card, cardRect);
    return;
  }
  renderer(context, card, cardRect, options);
}

export function drawCard(context, card, cardRect, options = {}) {
  if (!context) throw new TypeError("A CanvasRenderingContext2D is required.");
  if (!card) throw new TypeError("Card data is required.");

  const mode = options.mode ?? CARD_DISPLAY_MODES.DECK;
  const shouldCacheWholeCard = mode === CARD_DISPLAY_MODES.DECK && options.cache !== false;
  if (shouldCacheWholeCard) {
    const cachedCard = getCachedCard(
      card,
      cardRect.width,
      cardRect.height,
      { ...options, mode, radius: cardRect.radius },
      drawCardUncached,
    );
    if (cachedCard) {
      context.drawImage(cachedCard, cardRect.x, cardRect.y, cardRect.width, cardRect.height);
      return;
    }
  }

  drawCardUncached(context, card, cardRect, { ...options, mode });
}
