import { CARDS } from "./cards.js";
import { getCardEffectById } from "./card-effects.js";

export function getCardById(cardId) {
  return Object.values(CARDS).find((card) => card.id === cardId) ?? null;
}

export function getCardViewData(cardId) {
  const card = getCardById(cardId);
  if (!card) return null;
  return Object.freeze({
    ...card,
    effect: getCardEffectById(card.effectId),
  });
}
