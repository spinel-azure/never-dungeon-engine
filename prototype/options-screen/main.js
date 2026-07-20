import { bindVirtualControls } from "../dungeon-command-menu/controls/virtual-controls.js";

const buttons = [...document.querySelectorAll("[data-option]")];
const returnTarget = new URLSearchParams(location.search).get("return") || "../dungeon-command-menu/";
let cursor = 0;

function render() {
  buttons.forEach((button, index) => button.classList.toggle("is-selected", index === cursor));
  buttons[cursor].focus({ preventScroll: true });
}
function move(direction) {
  if (direction === "up") cursor = (cursor + buttons.length - 1) % buttons.length;
  if (direction === "down") cursor = (cursor + 1) % buttons.length;
  render();
}
function confirm() {
  const output = buttons[cursor].querySelector("output");
  if (buttons[cursor].dataset.option === "language") return;
  output.value = output.value === "ON" ? "OFF" : "ON";
  output.textContent = output.value;
}
function back() { location.href = returnTarget; }

buttons.forEach((button, index) => button.addEventListener("click", () => { cursor = index; confirm(); render(); }));
document.querySelector("#backButton").addEventListener("click", back);
bindVirtualControls({ stick: document.querySelector("#virtualStick"), buttonA: document.querySelector("#buttonA"), buttonB: document.querySelector("#buttonB"), onDirection: move, onConfirm: confirm, onCancel: back });
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); move(event.key === "ArrowUp" ? "up" : "down"); }
  if (["Enter", "x", "X"].includes(event.key)) confirm();
  if (["Escape", "z", "Z"].includes(event.key)) back();
});
render();
