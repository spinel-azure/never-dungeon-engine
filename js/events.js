let messageEl = null;

const cellMessages = {
  "4,1": "薄い壁の向こうから冷たい風が漏れている。",
  "6,4": "床石に古い紋章が刻まれている。",
  "8,6": "境界壁の向こうで鎖の鳴る音がした。",
  "2,8": "湿った苔が足音を吸い込む。",
  "8,8": "壁線の切れ目に古い傷跡がある。"
};

export function configureEvents({ messageEl: element }) {
  messageEl = element;
}

export function messageFor(x, y) {
  const key = `${x},${y}`;
  return cellMessages[key] || "たいまつの火が壁面をゆらした。";
}

export function say(text) {
  if (messageEl) messageEl.textContent = text;
}
