import { bindVirtualControls } from "./controls/virtual-controls.js";
import { createCommandMenu } from "./menu/command-menu.js";

const message = document.querySelector("#message"); const commandRegion = document.querySelector("#commandRegion"); const optionsView = document.querySelector("#optionsView"); let view = "dungeon";
function setMessage(text) { message.textContent = text; }
function showCommands() { view = "commands"; optionsView.hidden = true; commandRegion.hidden = false; menu.open(); setMessage("コマンドを選択してください。Bボタンで閉じます。"); }
function showDungeon() { view = "dungeon"; optionsView.hidden = true; commandRegion.hidden = false; menu.close(); setMessage("Bボタンでコマンドメニューを開きます。"); }
function showOptions() { view = "options"; commandRegion.hidden = true; optionsView.hidden = false; menu.close(); setMessage("オプション確認中。Bボタンで戻ります。"); }
function runCommand(command) {
  if (!command.implemented) { setMessage(`${command.label}は未実装です。`); return; }
  if (command.view === "options") { showOptions(); return; }
  if (command.href) window.location.href = command.href;
}
const menu = createCommandMenu({ root: commandRegion, onCommand: runCommand });
function cancel() { if (view === "options") showCommands(); else if (view === "commands") showDungeon(); else showCommands(); }
function confirm() { if (view === "commands") menu.execute(); else if (view === "dungeon") setMessage("ダンジョンアクション（検証画面では未接続）"); }
function direction(direction) { if (view === "commands") menu.move(direction); }
bindVirtualControls({ stick: document.querySelector("#virtualStick"), buttonA: document.querySelector("#buttonA"), buttonB: document.querySelector("#buttonB"), onDirection: direction, onConfirm: confirm, onCancel: cancel });
window.addEventListener("keydown", (event) => { const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right" }; if (map[event.key]) { event.preventDefault(); direction(map[event.key]); } if (["Enter","x","X"].includes(event.key)) confirm(); if (["Escape","z","Z"].includes(event.key)) cancel(); });
document.querySelectorAll("[data-option]").forEach((button) => button.addEventListener("click", () => { const state = button.querySelector("span"); if (state) state.textContent = state.textContent === "ON" ? "OFF" : "ON"; }));
showDungeon();
