import { CARD_DISPLAY_MODES, CARD_RARITIES } from "../data/cards.js";
import { drawTorchIcon } from "./icons/torch.js";

const THEME = Object.freeze({
  gold: "#e9ae25",
  brightGold: "#ffe678",
  whiteGold: "#fff8c8",
  deepGold: "#6c430f",
  frameGlow: "rgba(255, 190, 42, 0.68)",
});

const legendaryIconDrawers = Object.freeze({
  torch: drawTorchIcon,
});

function createStars(count, seed) {
  let value = seed >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };

  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    radius: 0.35 + random() * 1.25,
    alpha: 0.2 + random() * 0.55,
    phase: random() * Math.PI * 2,
  }));
}

const STARS = createStars(76, 0x1e6e4d);

function roundedRectPath(context, rect, inset = 0) {
  context.beginPath();
  context.roundRect(
    rect.x + inset,
    rect.y + inset,
    rect.width - inset * 2,
    rect.height - inset * 2,
    Math.max(0, rect.radius - inset),
  );
}

function drawLegendaryBackground(context, rect, time, mode) {
  const animated = mode === CARD_DISPLAY_MODES.GALLERY;
  const drift = animated ? Math.sin(time * 0.00022) * rect.width * 0.22 : 0;
  const gradient = context.createLinearGradient(
    rect.x - rect.width * 0.15 + drift,
    rect.y,
    rect.x + rect.width * 1.15 + drift,
    rect.y + rect.height,
  );
  gradient.addColorStop(0, "#491053");
  gradient.addColorStop(0.16, "#a40d45");
  gradient.addColorStop(0.33, "#e14b14");
  gradient.addColorStop(0.5, "#e6a815");
  gradient.addColorStop(0.66, "#25a852");
  gradient.addColorStop(0.82, "#087d91");
  gradient.addColorStop(1, "#17295f");
  context.fillStyle = gradient;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);

  const shade = context.createRadialGradient(
    rect.x + rect.width * 0.52,
    rect.y + rect.height * 0.45,
    20,
    rect.x + rect.width * 0.52,
    rect.y + rect.height * 0.45,
    rect.width * 0.72,
  );
  shade.addColorStop(0, "rgba(255, 191, 45, 0.16)");
  shade.addColorStop(0.52, "rgba(8, 8, 17, 0.08)");
  shade.addColorStop(1, "rgba(2, 4, 13, 0.72)");
  context.fillStyle = shade;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function drawStars(context, rect, time, mode) {
  const animated = mode === CARD_DISPLAY_MODES.GALLERY;
  for (const star of STARS) {
    const twinkle = animated
      ? 0.35 + 0.65 * ((Math.sin(time * 0.002 + star.phase) + 1) / 2)
      : 0.72;
    context.globalAlpha = star.alpha * twinkle;
    context.fillStyle = star.x > 0.58 ? "#d9fff0" : "#fff1a3";
    context.beginPath();
    context.arc(
      rect.x + 16 + star.x * (rect.width - 32),
      rect.y + 18 + star.y * (rect.height - 36),
      star.radius,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawDoubleCircle(context, rect) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height * 0.49;
  context.save();
  context.strokeStyle = "rgba(255, 225, 111, 0.2)";
  context.lineWidth = 1.2;
  for (const radius of [104, 135]) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.setLineDash([2, 6]);
  context.beginPath();
  context.arc(centerX, centerY, 119, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawRarityBadge(context, rect, rarity) {
  const x = rect.x + 23;
  const y = rect.y + 24;
  const size = 48;
  context.save();
  context.fillStyle = "rgba(9, 7, 12, 0.88)";
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = 2.5;
  context.shadowColor = THEME.frameGlow;
  context.shadowBlur = 12;
  context.fillRect(x, y, size, size);
  context.strokeRect(x, y, size, size);
  context.shadowBlur = 0;
  context.strokeStyle = THEME.deepGold;
  context.lineWidth = 1;
  context.strokeRect(x + 6, y + 6, size - 12, size - 12);
  context.fillStyle = THEME.whiteGold;
  context.font = "34px NdePixel, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(rarity, x + size / 2, y + size / 2 + 1);
  context.restore();
}

function drawCostBadge(context, rect, cost) {
  const centerX = rect.x + rect.width - 48;
  const centerY = rect.y + 49;
  context.save();
  const fill = context.createRadialGradient(centerX - 5, centerY - 7, 2, centerX, centerY, 27);
  fill.addColorStop(0, "#fff0a0");
  fill.addColorStop(0.28, "#b47518");
  fill.addColorStop(1, "#130c08");
  context.fillStyle = fill;
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = 3;
  context.shadowColor = THEME.frameGlow;
  context.shadowBlur = 12;
  context.beginPath();
  context.arc(centerX, centerY, 27, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 249, 197, 0.72)";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(centerX, centerY, 20, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#fffbe0";
  context.font = "29px NdePixel, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(cost), centerX, centerY + 1);
  context.restore();
}

function drawLegendaryLabel(context, rect) {
  const centerX = rect.x + rect.width / 2;
  const y = rect.y + 50;
  context.save();
  context.fillStyle = THEME.whiteGold;
  context.font = "17px NdePixel, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = THEME.frameGlow;
  context.shadowBlur = 8;
  context.fillText(CARD_RARITIES.L.name, centerX, y);
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 223, 106, 0.58)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(centerX - 66, y + 17);
  context.lineTo(centerX - 18, y + 17);
  context.moveTo(centerX + 18, y + 17);
  context.lineTo(centerX + 66, y + 17);
  context.stroke();
  context.translate(centerX, y + 17);
  context.rotate(Math.PI / 4);
  context.fillStyle = THEME.brightGold;
  context.fillRect(-3, -3, 6, 6);
  context.restore();
}

function drawFooter(context, rect, name) {
  const lineY = rect.y + rect.height - 78;
  const centerX = rect.x + rect.width / 2;
  context.save();
  const line = context.createLinearGradient(rect.x + 30, 0, rect.x + rect.width - 30, 0);
  line.addColorStop(0, "rgba(255, 214, 73, 0)");
  line.addColorStop(0.2, THEME.gold);
  line.addColorStop(0.5, THEME.whiteGold);
  line.addColorStop(0.8, THEME.gold);
  line.addColorStop(1, "rgba(255, 214, 73, 0)");
  context.strokeStyle = line;
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(rect.x + 28, lineY);
  context.lineTo(rect.x + rect.width - 28, lineY);
  context.stroke();
  context.fillStyle = THEME.whiteGold;
  context.font = "18px NdePixel, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = THEME.frameGlow;
  context.shadowBlur = 7;
  context.fillText(name, centerX, lineY + 40);
  context.restore();
}

function drawGalleryHologram(context, rect, time) {
  const cycle = (time * 0.00009) % 1;
  const beamX = rect.x - 100 + cycle * (rect.width + 200);
  context.save();
  roundedRectPath(context, rect, 7);
  context.clip();
  context.globalCompositeOperation = "screen";

  context.translate(beamX, rect.y + rect.height / 2);
  context.rotate(-0.38);
  const beam = context.createLinearGradient(-60, 0, 60, 0);
  beam.addColorStop(0, "rgba(255, 255, 255, 0)");
  beam.addColorStop(0.48, "rgba(255, 245, 194, 0.13)");
  beam.addColorStop(0.52, "rgba(215, 250, 255, 0.18)");
  beam.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = beam;
  context.fillRect(-60, -rect.height, 120, rect.height * 2);
  context.restore();
}

function drawFrontFrame(context, rect) {
  context.save();
  roundedRectPath(context, rect, 1.5);
  context.strokeStyle = THEME.brightGold;
  context.lineWidth = 4;
  context.shadowColor = THEME.frameGlow;
  context.shadowBlur = 18;
  context.stroke();
  context.shadowBlur = 0;
  roundedRectPath(context, rect, 8);
  context.strokeStyle = THEME.deepGold;
  context.lineWidth = 2;
  context.stroke();
  roundedRectPath(context, rect, 13);
  context.strokeStyle = "rgba(255, 245, 174, 0.72)";
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

export function drawLegendaryCard(context, card, cardRect, options = {}) {
  const mode = options.mode ?? CARD_DISPLAY_MODES.DECK;
  const time = options.time ?? 0;

  context.save();
  roundedRectPath(context, cardRect);
  context.clip();
  drawLegendaryBackground(context, cardRect, time, mode);
  drawStars(context, cardRect, time, mode);
  drawDoubleCircle(context, cardRect);
  context.restore();

  const drawIcon = legendaryIconDrawers[card.icon];
  if (drawIcon) {
    drawIcon(
      context,
      cardRect.x + cardRect.width / 2,
      cardRect.y + cardRect.height * 0.49,
      250,
    );
  }

  if (mode === CARD_DISPLAY_MODES.GALLERY) {
    drawGalleryHologram(context, cardRect, time);
  }

  drawRarityBadge(context, cardRect, card.rarity);
  drawLegendaryLabel(context, cardRect);
  drawCostBadge(context, cardRect, card.cost);
  drawFooter(context, cardRect, card.name);
  drawFrontFrame(context, cardRect);
}
