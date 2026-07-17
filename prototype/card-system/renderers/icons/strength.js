const DEFAULT_THEME = Object.freeze({
  light: "#e9f6ff",
  middle: "#7894a8",
  dark: "#162838",
  outline: "#dff5ff",
  glow: "rgba(137, 211, 255, 0.62)",
});

export function drawStrengthIcon(context, centerX, centerY, size, options = {}) {
  const theme = { ...DEFAULT_THEME, ...options.theme };
  const scale = size / 360;
  const glow = options.glow === false ? 0 : 15;

  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.lineCap = "round";
  context.lineJoin = "round";

  const fill = context.createLinearGradient(-100, -115, 105, 100);
  fill.addColorStop(0, theme.light);
  fill.addColorStop(0.38, theme.middle);
  fill.addColorStop(1, theme.dark);
  context.fillStyle = fill;
  context.strokeStyle = theme.outline;
  context.lineWidth = 7;
  context.shadowColor = theme.glow;
  context.shadowBlur = glow;

  context.beginPath();
  context.moveTo(-119, 82);
  context.bezierCurveTo(-99, 50, -92, 10, -76, -31);
  context.lineTo(-98, -54);
  context.bezierCurveTo(-111, -67, -109, -85, -96, -98);
  context.lineTo(-84, -110);
  context.bezierCurveTo(-77, -117, -65, -117, -57, -109);
  context.bezierCurveTo(-49, -121, -31, -119, -24, -106);
  context.bezierCurveTo(-12, -111, 1, -104, 3, -91);
  context.bezierCurveTo(15, -88, 20, -73, 13, -62);
  context.lineTo(-16, -31);
  context.bezierCurveTo(6, -48, 29, -62, 55, -58);
  context.bezierCurveTo(82, -55, 101, -37, 106, -13);
  context.bezierCurveTo(129, -2, 142, 22, 136, 47);
  context.bezierCurveTo(130, 75, 105, 93, 73, 93);
  context.lineTo(-79, 93);
  context.bezierCurveTo(-96, 93, -110, 89, -119, 82);
  context.closePath();
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(239, 250, 255, 0.68)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-64, 52);
  context.bezierCurveTo(-36, 25, -6, 20, 22, 35);
  context.bezierCurveTo(47, 49, 75, 48, 96, 31);
  context.stroke();

  context.strokeStyle = "rgba(10, 24, 36, 0.54)";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-17, -31);
  context.bezierCurveTo(-4, -17, 3, 0, 4, 17);
  context.stroke();
  context.restore();
}
