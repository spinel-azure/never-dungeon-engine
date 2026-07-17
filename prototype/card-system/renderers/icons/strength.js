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
  context.moveTo(-121, 91);
  context.bezierCurveTo(-110, 55, -96, 7, -78, -40);
  context.lineTo(-101, -61);
  context.bezierCurveTo(-115, -74, -112, -91, -99, -102);
  context.lineTo(-87, -113);
  context.bezierCurveTo(-78, -121, -64, -119, -57, -108);
  context.bezierCurveTo(-50, -123, -31, -124, -22, -110);
  context.bezierCurveTo(-9, -118, 6, -110, 8, -96);
  context.bezierCurveTo(22, -94, 29, -78, 20, -65);
  context.bezierCurveTo(15, -57, 6, -52, -3, -51);
  context.lineTo(-25, -39);
  context.bezierCurveTo(-34, -34, -36, -22, -28, -14);
  context.bezierCurveTo(-18, -4, -20, 9, -29, 18);
  context.bezierCurveTo(-39, 30, -49, 51, -52, 68);
  context.bezierCurveTo(-27, 31, 2, -17, 48, -22);
  context.bezierCurveTo(81, -26, 106, -8, 113, 22);
  context.lineTo(125, 22);
  context.lineTo(125, 94);
  context.lineTo(-82, 94);
  context.bezierCurveTo(-100, 98, -114, 97, -121, 91);
  context.closePath();
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(239, 250, 255, 0.68)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-107, 82);
  context.bezierCurveTo(-91, 75, -71, 72, -52, 68);
  context.bezierCurveTo(-27, 31, 2, -7, 43, -10);
  context.bezierCurveTo(70, -12, 91, 3, 99, 24);
  context.stroke();

  context.strokeStyle = "rgba(10, 24, 36, 0.54)";
  context.lineWidth = 4.5;
  context.beginPath();
  context.moveTo(-80, -102);
  context.bezierCurveTo(-72, -93, -71, -84, -74, -76);
  context.moveTo(-54, -108);
  context.bezierCurveTo(-47, -98, -46, -89, -49, -80);
  context.moveTo(-27, -102);
  context.bezierCurveTo(-18, -93, -17, -83, -22, -74);
  context.moveTo(-27, -38);
  context.bezierCurveTo(-16, -34, -7, -28, -1, -19);
  context.moveTo(-52, 68);
  context.bezierCurveTo(-61, 76, -71, 84, -82, 94);
  context.stroke();
  context.restore();
}
