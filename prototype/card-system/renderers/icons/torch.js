const DEFAULT_TORCH_THEME = Object.freeze({
  gold: "#f5bd2c",
  brightGold: "#ffe875",
  whiteHot: "#fffce1",
  deepGold: "#8d5512",
  glow: "rgba(255, 190, 36, 0.92)",
});

function drawOuterFlame(context, theme) {
  const flame = context.createLinearGradient(0, -158, 0, 28);
  flame.addColorStop(0, theme.whiteHot);
  flame.addColorStop(0.42, theme.brightGold);
  flame.addColorStop(1, theme.gold);

  context.beginPath();
  context.moveTo(0, 27);
  context.bezierCurveTo(-49, 21, -70, -20, -42, -67);
  context.bezierCurveTo(-45, -37, -25, -27, -22, -64);
  context.bezierCurveTo(-18, -104, 17, -113, 5, -156);
  context.bezierCurveTo(40, -125, 18, -96, 42, -70);
  context.bezierCurveTo(74, -35, 56, 14, 22, 27);
  context.bezierCurveTo(39, -3, 30, -30, 13, -48);
  context.bezierCurveTo(18, -16, -9, -6, 0, 27);
  context.closePath();
  context.fillStyle = flame;
  context.strokeStyle = theme.whiteHot;
  context.lineWidth = 3;
  context.shadowColor = theme.glow;
  context.shadowBlur = 24;
  context.fill();
  context.stroke();
}

function drawInnerFlame(context, theme) {
  context.beginPath();
  context.moveTo(-9, 18);
  context.bezierCurveTo(-28, -7, -5, -23, -11, -52);
  context.bezierCurveTo(13, -33, 4, -12, 20, 2);
  context.bezierCurveTo(29, 11, 12, 27, -9, 18);
  context.closePath();
  context.fillStyle = theme.whiteHot;
  context.shadowColor = "rgba(255, 255, 214, 0.95)";
  context.shadowBlur = 14;
  context.fill();
}

function drawBrazier(context, theme) {
  context.shadowColor = theme.glow;
  context.shadowBlur = 12;
  context.fillStyle = theme.brightGold;
  context.strokeStyle = theme.whiteHot;
  context.lineWidth = 2;

  context.beginPath();
  context.moveTo(-48, 30);
  context.lineTo(48, 30);
  context.lineTo(41, 40);
  context.lineTo(-41, 40);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(-39, 43);
  context.bezierCurveTo(-32, 68, 32, 68, 39, 43);
  context.lineTo(-39, 43);
  context.closePath();
  context.fillStyle = theme.gold;
  context.fill();
  context.stroke();

  context.fillStyle = theme.brightGold;
  context.fillRect(-28, 68, 56, 9);
}

function drawHandle(context, theme) {
  context.shadowColor = theme.glow;
  context.shadowBlur = 9;
  context.strokeStyle = theme.brightGold;
  context.fillStyle = theme.deepGold;
  context.lineWidth = 4;

  context.beginPath();
  context.moveTo(-17, 79);
  context.lineTo(17, 79);
  context.lineTo(12, 151);
  context.lineTo(0, 169);
  context.lineTo(-12, 151);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = theme.whiteHot;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-8, 88);
  context.lineTo(-5, 145);
  context.moveTo(8, 88);
  context.lineTo(5, 145);
  context.stroke();

  context.fillStyle = theme.brightGold;
  for (const x of [-13, 0, 13]) {
    context.save();
    context.translate(x, 148);
    context.rotate(Math.PI / 4);
    context.fillRect(-4, -4, 8, 8);
    context.restore();
  }

  context.beginPath();
  context.moveTo(-9, 157);
  context.lineTo(9, 157);
  context.lineTo(0, 176);
  context.closePath();
  context.fill();
}

function drawTorchSpark(context, x, y, radius, theme) {
  context.save();
  context.translate(x, y);
  context.fillStyle = theme.whiteHot;
  context.shadowColor = theme.glow;
  context.shadowBlur = 12;
  context.beginPath();
  context.moveTo(0, -radius);
  context.lineTo(radius * 0.26, -radius * 0.26);
  context.lineTo(radius, 0);
  context.lineTo(radius * 0.26, radius * 0.26);
  context.lineTo(0, radius);
  context.lineTo(-radius * 0.26, radius * 0.26);
  context.lineTo(-radius, 0);
  context.lineTo(-radius * 0.26, -radius * 0.26);
  context.closePath();
  context.fill();
  context.restore();
}

export function drawTorchIcon(context, centerX, centerY, size, options = {}) {
  const theme = { ...DEFAULT_TORCH_THEME, ...options.theme };
  const scale = size / 360;

  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.lineCap = "round";
  context.lineJoin = "round";
  drawOuterFlame(context, theme);
  drawInnerFlame(context, theme);
  drawBrazier(context, theme);
  drawHandle(context, theme);
  drawTorchSpark(context, -64, -68, 10, theme);
  drawTorchSpark(context, 62, -90, 8, theme);
  drawTorchSpark(context, 70, -24, 5, theme);
  context.restore();
}
