import { drawTorchIcon } from "./icons/torch.js";
import { drawUnknownIcon } from "./icons/unknown.js";

const iconDrawers = new Map([
  ["torch", drawTorchIcon],
  ["unknown", drawUnknownIcon],
]);

export function registerIconDrawer(iconId, drawer) {
  if (typeof iconId !== "string" || !iconId) {
    throw new TypeError("iconId must be a non-empty string.");
  }
  if (typeof drawer !== "function") {
    throw new TypeError(`Icon drawer for ${iconId} must be a function.`);
  }
  iconDrawers.set(iconId, drawer);
}

export function getIconDrawer(iconId) {
  return iconDrawers.get(iconId) ?? null;
}

export function getUnknownIconDrawer() {
  return drawUnknownIcon;
}

export function getRegisteredIconCount() {
  return iconDrawers.size;
}
