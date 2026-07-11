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
camera.position.set(4.2, 2.6, 6.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const chest = new THREE.Group();
scene.add(chest);

const materials = {
  red: new THREE.MeshStandardMaterial({
    color: 0xf22618,
    roughness: 0.52,
    metalness: 0.06,
  }),
  darkRed: new THREE.MeshStandardMaterial({
    color: 0x8c221f,
    roughness: 0.58,
    metalness: 0.08,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xf8d736,
    roughness: 0.32,
    metalness: 0.55,
  }),
  black: new THREE.MeshStandardMaterial({
    color: 0x0c0c0a,
    roughness: 0.48,
    metalness: 0.18,
  }),
  inner: new THREE.MeshStandardMaterial({
    color: 0x1b0906,
    roughness: 0.8,
    metalness: 0.02,
  }),
};

const body = addBox(chest, 2.85, 1.25, 1.55, 0, 0.63, 0, materials.red);
body.castShadow = true;
body.receiveShadow = true;

addBox(chest, 2.95, 0.12, 1.64, 0, 1.3, 0, materials.gold);
addBox(chest, 3.02, 0.12, 1.64, 0, 0.06, 0, materials.gold);
addBox(chest, 0.13, 1.42, 1.68, -1.48, 0.68, 0, materials.gold);
addBox(chest, 0.13, 1.42, 1.68, 1.48, 0.68, 0, materials.gold);
addBox(chest, 2.95, 0.12, 0.12, 0, 0.7, 0.84, materials.gold);

const lockPlate = addBox(chest, 0.5, 0.43, 0.1, 0, 0.74, 0.84, materials.gold);
lockPlate.castShadow = true;
addBox(chest, 0.12, 0.22, 0.13, 0, 0.67, 0.9, materials.black);
const keyTop = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), materials.black);
keyTop.position.set(0, 0.84, 0.91);
keyTop.rotation.y = 0;
chest.add(keyTop);

const innerWell = addBox(chest, 2.5, 0.1, 1.22, 0, 1.29, 0, materials.inner);
innerWell.receiveShadow = true;

const lidPivot = new THREE.Group();
lidPivot.position.set(0, 1.25, -0.78);
chest.add(lidPivot);

const lid = createHalfCylinderLid(1.55, 0.78, 36);
lid.position.set(0, 0, 0.78);
lidPivot.add(lid);

addLidTrim(lidPivot);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.42 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

const ambient = new THREE.HemisphereLight(0xbfefff, 0x32110c, 1.25);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff0c2, 2.15);
keyLight.position.set(3.3, 4.6, 4.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x51f6ff, 1.2, 9);
rimLight.position.set(-3.6, 2.3, -2.4);
scene.add(rimLight);

let targetLidValue = Number(lidSlider.value);
let currentLidValue = targetLidValue;
let targetScale = Number(scaleSlider.value) / 100;
let targetRotation = THREE.MathUtils.degToRad(Number(rotationSlider.value));

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

function addBox(parent, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createHalfCylinderLid(length, radius, segments) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  for (let index = 0; index <= segments; index += 1) {
    const angle = Math.PI - (Math.PI * index) / segments;
    shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  shape.lineTo(radius, 0);
  shape.lineTo(-radius, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.center();
  geometry.rotateY(Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, materials.red);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 0;
  group.add(mesh);

  const frontCap = new THREE.Mesh(new THREE.CircleGeometry(radius, 36, 0, Math.PI), materials.darkRed);
  frontCap.position.set(0, 0, length / 2 + 0.014);
  frontCap.rotation.z = Math.PI;
  group.add(frontCap);

  const backCap = frontCap.clone();
  backCap.position.z = -length / 2 - 0.014;
  backCap.rotation.y = Math.PI;
  group.add(backCap);

  return group;
}

function addLidTrim(parent) {
  const trim = new THREE.Group();
  trim.position.set(0, 0, 0.78);
  parent.add(trim);

  addBox(trim, 0.12, 0.12, 1.66, -1.48, 0.08, 0, materials.gold);
  addBox(trim, 0.12, 0.12, 1.66, 1.48, 0.08, 0, materials.gold);
  addBox(trim, 0.12, 0.12, 1.7, 0, 0.76, 0, materials.gold);
  addBox(trim, 3.06, 0.12, 0.12, 0, 0.03, 0.83, materials.gold);
  addBox(trim, 3.06, 0.12, 0.12, 0, 0.03, -0.83, materials.gold);

  const bandLeft = addBox(trim, 0.12, 0.88, 1.72, -1.48, 0.36, 0, materials.gold);
  bandLeft.rotation.z = -0.42;
  const bandRight = addBox(trim, 0.12, 0.88, 1.72, 1.48, 0.36, 0, materials.gold);
  bandRight.rotation.z = 0.42;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.set(width < 700 ? 4.8 : 4.2, width < 700 ? 2.9 : 2.6, width < 700 ? 7.2 : 6.2);
  camera.lookAt(0, 0.8, 0);
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
