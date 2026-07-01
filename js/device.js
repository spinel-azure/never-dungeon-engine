const LAYOUT_CLASSES = ["layout-mobile", "layout-tablet", "layout-pc"];
const INPUT_CLASSES = ["input-touch", "input-pointer"];
const ORIENTATION_CLASSES = ["orientation-portrait", "orientation-landscape"];

let currentInfo = null;
let configured = false;

export function configureDevice() {
  updateDeviceClasses();
  if (configured) return;
  configured = true;
  window.addEventListener("resize", updateDeviceClasses);
}

export function getDeviceInfo() {
  if (!currentInfo) currentInfo = detectDeviceInfo();
  return { ...currentInfo };
}

function updateDeviceClasses() {
  currentInfo = detectDeviceInfo();
  if (!document.body) return;

  document.body.classList.remove(...LAYOUT_CLASSES, ...INPUT_CLASSES, ...ORIENTATION_CLASSES);
  document.body.classList.add(
    `layout-${currentInfo.layout}`,
    `input-${currentInfo.input}`,
    `orientation-${currentInfo.orientation}`
  );
}

function detectDeviceInfo() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const layout = width <= 680 ? "mobile" : width <= 1024 ? "tablet" : "pc";
  const isTouchDevice = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const input = isTouchDevice ? "touch" : "pointer";
  const orientation = height > width ? "portrait" : "landscape";

  return {
    width,
    height,
    layout,
    input,
    orientation,
    isMobileLayout: layout === "mobile",
    isTabletLayout: layout === "tablet",
    isPcLayout: layout === "pc",
    isTouchDevice,
    isPortrait: orientation === "portrait",
    isLandscape: orientation === "landscape"
  };
}