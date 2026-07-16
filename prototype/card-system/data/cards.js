export const CARD_DISPLAY_MODES = Object.freeze({
  GALLERY: "gallery",
  DECK: "deck",
});

export const CARD_RARITIES = Object.freeze({
  L: Object.freeze({
    id: "L",
    name: "Legendary",
    defaultCost: 6,
    frameStyle: "legendary",
  }),
});

export const CARDS = Object.freeze({
  legendaryUnlimitedTorchGauge: Object.freeze({
    id: "legendary_unlimited_torch_gauge",
    rarity: "L",
    cost: 6,
    name: "UNLIMITED TORCH GAUGE",
    footerText: "UNLIMITED TORCH GAUGE",
    nameJa: "たいまつゲージ無制限",
    category: "exploration",
    iconId: "torch",
    effectId: "unlimited_torch_gauge",
  }),
});
