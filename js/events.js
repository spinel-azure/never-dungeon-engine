let messageEl = null;

export function configureEvents({ messageEl: element }) {
  messageEl = element;
}

export function messageFor(x, y, cellType = "floor") {
  if (cellType === "stairsUp") return "上り階段がある。";
  if (cellType === "stairsDown") return "下り階段がある。";
  return "";
}

export function say(text) {
  if (messageEl) messageEl.textContent = text;
}
