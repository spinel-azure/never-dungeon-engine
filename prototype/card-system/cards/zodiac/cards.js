const ZODIAC_DEFINITIONS = Object.freeze([
  ["aries", "ARIES"],
  ["taurus", "TAURUS"],
  ["gemini", "GEMINI"],
  ["cancer", "CANCER"],
  ["leo", "LEO"],
  ["virgo", "VIRGO"],
  ["libra", "LIBRA"],
  ["scorpio", "SCORPIO"],
  ["sagittarius", "SAGITTARIUS"],
  ["capricorn", "CAPRICORN"],
  ["aquarius", "AQUARIUS"],
  ["pisces", "PISCES"],
]);

export const ZODIAC_CARDS = Object.freeze(Object.fromEntries(
  ZODIAC_DEFINITIONS.map(([zodiac, name]) => [
    `zodiac${name[0]}${name.slice(1).toLowerCase()}`,
    Object.freeze({
      id: `zodiac_${zodiac}`,
      rarity: "Z",
      cost: 8,
      name,
      footerText: name,
      zodiac,
      category: "zodiac",
      version: 1,
    }),
  ]),
));
