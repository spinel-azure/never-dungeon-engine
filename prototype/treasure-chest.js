import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#chestScene");
const openButton = document.querySelector("#openButton");
const closeButton = document.querySelector("#closeButton");
const scaleSlider = document.querySelector("#scaleSlider");
const rotationSlider = document.querySelector("#rotationSlider");
const lidSlider = document.querySelector("#lidSlider");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050606);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const materials = {
  red: new THREE.MeshStandardMaterial({ color: 0xf52a18, roughness: 0.48, metalness: 0.04 }),
  redSide: new THREE.MeshStandardMaterial({ color: 0x9e221d, roughness: 0.56, metalness: 0.05 }),
  inner: new THREE.MeshStandardMaterial({ color: 0x170706, roughness: 0.82, metalness: 0.02 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xf6d43a, roughness: 0.28, metalness: 0.62 }),
  goldDark: new THREE.MeshStandardMaterial({ color: 0x9e850f, roughness: 0.42, metalness: 0.48 }),
  black: new THREE.MeshStandardMaterial({ color: 0x080806, roughness: 0.46, metalness: 0.12 }),
};

const chest = new THREE.Group();
scene.add(chest);

const dimensions = {
  width: 3.25,
  bodyHeight: 1.15,
  depth: 1.55,
  lidRadius: 0.78,
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
let lidPivot;

openButton.addEventListener("click", () => {
  targetLidValue = 100;
  lidSlider.value = String(targetLidValue);
});

closeButton.addEventListener("click", () => {
  targetLidValue = 0;
  lidSlider.value = String(targetLidValue);
});

scaleSlider.addEventListener("input", () => {
  targetScale = Number(scaleSlider.value) / 100;
});

rotationSlider.addEventListener("input", () => {
  targetRotation = THREE.MathUtils.degToRad(Number(rotationSlider.value));
});

lidSlider.addEventListener("input", () => {
  targetLidValue = Number(lidSlider.value);
});

window.addEventListener("resize", resize);
resize();
animate();

function buildChest() {
  const { width, bodyHeight, depth, lidRadius } = dimensions;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  const body = addBox(chest, width, bodyHeight, depth, 0, bodyHeight / 2, 0, materials.red);
  body.castShadow = true;

  addBox(chest, width + 0.08, 0.12, depth + 0.08, 0, 0.06, 0, materials.goldDark);
  addBox(chest, width + 0.08, 0.12, depth + 0.1, 0, bodyHeight + 0.02, 0, materials.gold);
  addBox(chest, width + 0.16, 0.12, 0.12, 0, bodyHeight * 0.48, halfDepth + 0.055, materials.gold);
  addBox(chest, width + 0.16, 0.12, 0.12, 0, 0.15, halfDepth + 0.055, materials.goldDark);

  addBox(chest, 0.14, bodyHeight + 0.1, depth + 0.12, -halfWidth - 0.02, bodyHeight / 2, 0, materials.goldDark);
  addBox(chest, 0.14, bodyHeight + 0.1, depth + 0.12, halfWidth + 0.02, bodyHeight / 2, 0, materials.goldDark);
  addBox(chest, 0.52, 0.42, 0.12, 0, bodyHeight * 0.55, halfDepth + 0.12, materials.gold);
  addBox(chest, 0.12, 0.24, 0.14, 0, bodyHeight * 0.46, halfDepth + 0.19, materials.black);

  const keyTop = new THREE.Mesh(new THREE.CircleGeometry(0.09, 28), materials.black);
  keyTop.position.set(0, bodyHeight * 0.66, halfDepth + 0.195);
  chest.add(keyTop);

  const inside = addBox(chest, width - 0.42, 0.1, depth - 0.36, 0, bodyHeight + 0.08, -0.02, materials.inner);
  inside.receiveShadow = true;

  lidPivot = new THREE.Group();
  lidPivot.position.set(0, bodyHeight + 0.02, -halfDepth);
  chest.add(lidPivot);

  const lidGroup = new THREE.Group();
  lidGroup.position.z = halfDepth;
  lidPivot.add(lidGroup);

  const lidMesh = createArchedLid(width, lidRadius, depth, 40);
  lidGroup.add(lidMesh);

  addLidCaps(lidGroup, width, lidRadius);
  addLidHardware(lidGroup, width, lidRadius, depth);
}

function addBox(parent, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createLidShape(radius, segments) {
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(radius, 0);
  for (let index = 0; index <= segments; index += 1) {
    const angle = (Math.PI * index) / segments;
    shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  shape.closePath();
  return shape;
}

function createArchedLid(width, radius, depth, segments) {
  const shape = createLidShape(radius, segments);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: false,
    steps: 1,
  });

  geometry.rotateY(Math.PI / 2);
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  const centerX = (box.min.x + box.max.x) / 2;
  const minY = box.min.y;
  const centerZ = (box.min.z + box.max.z) / 2;
  geometry.translate(-centerX, -minY, -centerZ);

  const lid = new THREE.Mesh(geometry, materials.red);
  lid.castShadow = true;
  lid.receiveShadow = true;
  lid.scale.z = depth / (radius * 2);
  return lid;
}

function addLidCaps(parent, width, radius) {
  const capShape = createLidShape(radius, 40);
  const capGeometry = new THREE.ShapeGeometry(capShape);

  const leftCap = new THREE.Mesh(capGeometry, materials.redSide);
  leftCap.position.x = -width / 2 - 0.01;
  leftCap.rotation.y = -Math.PI / 2;
  leftCap.castShadow = true;
  parent.add(leftCap);

  const rightCap = leftCap.clone();
  rightCap.position.x = width / 2 + 0.01;
  rightCap.rotation.y = Math.PI / 2;
  parent.add(rightCap);
}

function addLidHardware(parent, width, radius, depth) {
  const frontZ = depth / 2 + 0.06;
  const backZ = -depth / 2 - 0.03;

  addBox(parent, width + 0.16, 0.12, 0.13, 0, 0.04, frontZ, materials.gold);
  addBox(parent, width + 0.1, 0.1, 0.12, 0, radius + 0.02, 0, materials.gold);
  addBox(parent, width + 0.12, 0.1, 0.12, 0, 0.04, backZ, materials.goldDark);

  addBox(parent, 0.13, radius + 0.04, depth + 0.14, -width / 2 - 0.02, radius / 2, 0, materials.gold);
  addBox(parent, 0.13, radius + 0.04, depth + 0.14, width / 2 + 0.02, radius / 2, 0, materials.gold);

  const centerBand = addBox(parent, 0.14, radius + 0.06, depth + 0.16, 0, radius / 2, 0, materials.gold);
  centerBand.castShadow = true;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.set(width < 700 ? 4.8 : 4.2, width < 700 ? 2.9 : 2.6, width < 700 ? 7.2 : 6.2);
  camera.lookAt(0, 0.78, 0);
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);

  currentLidValue += (targetLidValue - currentLidValue) * 0.12;
  const openRatio = currentLidValue / 100;
  lidPivot.rotation.x = -THREE.MathUtils.degToRad(102) * openRatio;

  const currentScale = chest.scale.x + (targetScale - chest.scale.x) * 0.1;
  chest.scale.setScalar(currentScale);
  chest.rotation.y += (targetRotation - chest.rotation.y) * 0.12;

  renderer.render(scene, camera);
}
