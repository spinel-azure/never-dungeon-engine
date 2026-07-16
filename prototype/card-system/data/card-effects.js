export const CARD_EFFECTS = Object.freeze({
  unlimitedTorchGauge: Object.freeze({
    id: "unlimited_torch_gauge",
    nameJa: "たいまつゲージ無制限",
    descriptionJa: "探索中、たいまつゲージを消費しない。",
  }),
});

export function getCardEffectById(effectId) {
  return Object.values(CARD_EFFECTS).find((effect) => effect.id === effectId) ?? null;
}
