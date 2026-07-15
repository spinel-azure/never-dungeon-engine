import { drawLegendaryCard } from "./legendary-card.js";

const rarityRenderers = Object.freeze({
  L: drawLegendaryCard,
});

export function drawCard(context, card, cardRect, options = {}) {
  if (!context) throw new TypeError("A CanvasRenderingContext2D is required.");
  if (!card) throw new TypeError("Card data is required.");

  const renderer = rarityRenderers[card.rarity];
  if (!renderer) {
    throw new RangeError(`No renderer is registered for rarity: ${card.rarity}`);
  }

  renderer(context, card, cardRect, options);
}
