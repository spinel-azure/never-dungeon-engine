import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#chestScene");
const openButton = document.querySelector("#openButton");
const closeButton = document.querySelector("#closeButton");
const eventButton = document.querySelector("#eventButton");
const typeButton = document.querySelector("#typeButton");
const scaleSlider = document.querySelector("#scaleSlider");
const rotationSlider = document.querySelector("#rotationSlider");
const lidSlider = document.querySelector("#lidSlider");
const scaleValue = document.querySelector("#scaleValue");
const rotationValue = document.querySelector("#rotationValue");
const lidValue = document.querySelector("#lidValue");
const typeValue = document.querySelector("#typeValue");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050606);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const materials = {
  outer: new THREE.MeshStandardMaterial({ color: 0xf52a18, roughness: 0.58, metalness: 0 }),
  inner: new THREE.MeshStandardMaterial({ color: 0x7f211c, roughness: 0.72, metalness: 0 }),
};

const CHEST_TYPES = [
  { key: "red", label: "RED", outer: 0xf52a18, inner: 0x7f211c },
  { key: "black", label: "BLACK", outer: 0x111111, inner: 0x030303 },
  { key: "gold", label: "GOLD", outer: 0xd7a72f, inner: 0x795510 },
];
const MAX_LID_ANGLE = 102;
const EVENT_SPIN_MS = 900;
const EVENT_OPEN_MS = 460;

const chest = new THREE.Group();
scene.add(chest);
let lidPivot;

const dimensions = {
  width: 3.25,
  bodyHeight: 1.45,
  depth: 1.85,
  lidHeight: 0.48,
  wallThickness: 0.12,
};

buildChest();

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.42 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

scene.add(new THREE.HemisphereLight(0xc8f4ff, 0x2d1008, 1.2));

const keyLight = new THREE.DirectionalLight(0xffedc0, 2.15);
keyLight.position.set(3.3, 4.6, 4.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x4bf5ff, 1.35, 9);
rimLight.position.set(-3.7, 2.3, -2.4);
scene.add(rimLight);

let targetLidValue = Number(lidSlider.value);
let currentLidValue = targetLidValue;
let targetScale = Number(scaleSlider.value) / 100;
let targetRotation = THREE.MathUtils.degToRad(Number(rotationSlider.value));
let chestTypeIndex = 0;
let eventAnimation = null;

openButton.addEventListener("click", () => {
  cancelEventAnimation();
  targetLidValue = 100;
  lidSlider.value = String(targetLidValue);
});

closeButton.addEventListener("click", () => {
  cancelEventAnimation();
  targetLidValue = 0;
  lidSlider.value = String(targetLidValue);
});

eventButton.addEventListener("click", startEventAnimation);

typeButton.addEventListener("click", () => {
  chestTypeIndex = (chestTypeIndex + 1) % CHEST_TYPES.length;
  applyChestType();
});

scaleSlider.addEventListener("input", () => {
  cancelEventAnimation();
  targetScale = Number(scaleSlider.value) / 100;
  updateReadouts();
});

rotationSlider.addEventListener("input", () => {
  cancelEventAnimation();
  targetRotation = THREE.MathUtils.degToRad(Number(rotationSlider.value));
  updateReadouts();
});

lidSlider.addEventListener("input", () => {
  cancelEventAnimation();
  targetLidValue = Number(lidSlider.value);
  updateReadouts();
});

window.addEventListener("resize", resize);
resize();
applyChestType();
updateReadouts();
animate();

function buildChest() {
  const { width, bodyHeight, depth, lidHeight, wallThickness } = dimensions;
  const halfDepth = depth / 2;

  // Build the lower half as an open rectangular container instead of a
  // decorated solid block, so the empty interior is visible when opened.
  addBox(chest, width, wallThickness, depth, 0, wallThickness / 2, 0, materials.inner);
  addBox(chest, width, bodyHeight, wallThickness, 0, bodyHeight / 2, halfDepth - wallThickness / 2, materials.outer);
  addBox(chest, width, bodyHeight, wallThickness, 0, bodyHeight / 2, -halfDepth + wallThickness / 2, materials.inner);
  addBox(chest, wallThickness, bodyHeight, depth - wallThickness * 2, -width / 2 + wallThickness / 2, bodyHeight / 2, 0, materials.outer);
  addBox(chest, wallThickness, bodyHeight, depth - wallThickness * 2, width / 2 - wallThickness / 2, bodyHeight / 2, 0, materials.outer);

  lidPivot = new THREE.Group();
  lidPivot.position.set(0, bodyHeight, -halfDepth);
  chest.add(lidPivot);

  const lidGroup = new THREE.Group();
  lidGroup.position.z = halfDepth;
  lidPivot.add(lidGroup);

  addBox(
    lidGroup,
    width + 0.04,
    lidHeight,
    depth + 0.04,
    0,
    lidHeight / 2,
    0,
    materials.outer
  );
}

function addBox(parent, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.set(width < 700 ? 4.8 : 4.2, width < 700 ? 2.9 : 2.6, width < 700 ? 7.2 : 6.2);
  camera.lookAt(0, 0.95, 0);
  camera.updateProjectionMatrix();
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  if (eventAnimation) {
    updateEventAnimation(now);
  } else {
    currentLidValue += (targetLidValue - currentLidValue) * 0.12;
    chest.rotation.y += (targetRotation - chest.rotation.y) * 0.12;
  }

  const openRatio = currentLidValue / 100;
  lidPivot.rotation.x = -THREE.MathUtils.degToRad(MAX_LID_ANGLE) * openRatio;

  const currentScale = chest.scale.x + (targetScale - chest.scale.x) * 0.1;
  chest.scale.setScalar(currentScale);
  updateReadouts(eventAnimation ? currentLidValue : targetLidValue);

  renderer.render(scene, camera);
}

function startEventAnimation() {
  targetLidValue = 0;
  currentLidValue = 0;
  lidSlider.value = "0";
  chest.rotation.y = targetRotation;
  eventAnimation = {
    start: performance.now(),
    rotation: targetRotation,
  };
}

function updateEventAnimation(now) {
  const elapsed = now - eventAnimation.start;
  if (elapsed < EVENT_SPIN_MS) {
    const progress = elapsed / EVENT_SPIN_MS;
    chest.rotation.y = eventAnimation.rotation + Math.PI * 4 * easeInOutCubic(progress);
    currentLidValue = 0;
    return;
  }

  const openProgress = Math.min(1, (elapsed - EVENT_SPIN_MS) / EVENT_OPEN_MS);
  chest.rotation.y = eventAnimation.rotation + Math.PI * 4;
  currentLidValue = 100 * easeOutCubic(openProgress);
  lidSlider.value = String(Math.round(currentLidValue));

  if (openProgress >= 1) {
    chest.rotation.y = eventAnimation.rotation;
    targetLidValue = 100;
    currentLidValue = 100;
    lidSlider.value = "100";
    eventAnimation = null;
  }
}

function cancelEventAnimation() {
  if (!eventAnimation) return;
  eventAnimation = null;
  targetRotation = chest.rotation.y;
  rotationSlider.value = String(Math.round(THREE.MathUtils.radToDeg(targetRotation) % 360));
}

function applyChestType() {
  const type = CHEST_TYPES[chestTypeIndex];
  materials.outer.color.setHex(type.outer);
  materials.inner.color.setHex(type.inner);
  typeValue.textContent = type.label;
  typeButton.setAttribute("aria-label", `Treasure chest type: ${type.label}`);
}

function updateReadouts(displayLidValue = targetLidValue) {
  scaleValue.textContent = `${Math.round(targetScale * 100)}%`;
  lidValue.textContent = `${Math.round((displayLidValue / 100) * MAX_LID_ANGLE)}°`;
  rotationValue.textContent = `${Math.round(Number(rotationSlider.value))}°`;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
