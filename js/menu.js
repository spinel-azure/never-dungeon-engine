const menu = {
  root: null,
  mainPanel: null,
  optionsPanel: null,
  mainItems: [],
  optionItems: [],
  mainBackButton: null,
  optionBackButton: null,
  mainIndex: 3,
  optionIndex: 0,
  mainCursor: 0,
  optionCursor: 0,
  view: "dungeon",
  compassVisible: true,
  readoutVisible: false,
  generateRandomDungeon: () => {},
  startAutoReturn: () => {},
  refillTorch: () => {}
};

export function configureMenu(options) {
  Object.assign(menu, options);
  menu.mainPanel = menu.root?.querySelector('[data-menu-view="main"]') || null;
  menu.optionsPanel = menu.root?.querySelector('[data-menu-view="options"]') || null;
  menu.mainItems = Array.from(menu.root?.querySelectorAll("[data-menu-main]") || []);
  menu.optionItems = Array.from(menu.root?.querySelectorAll("[data-option]") || []);
  menu.mainBackButton = menu.mainPanel?.querySelector("[data-menu-back]") || null;
  menu.optionBackButton = menu.optionsPanel?.querySelector("[data-menu-back]") || null;
  bindMenuButtons();
  bindBackButtons();
  bindVolumeSliders();
  applyDisplayOptions();
  updateMenuView();
}

export function isMenuOpen() {
  return menu.view !== "dungeon";
}

export function openCampMenu() {
  menu.view = "main";
  menu.mainIndex = 3;
  menu.mainCursor = 0;
  updateMenuView();
}

export function closeCampMenu() {
  menu.view = "dungeon";
  updateMenuView();
}

export function handleMenuInput(action) {
  if (!isMenuOpen()) {
    if (action === "cancel") {
      openCampMenu();
      return true;
    }
    return false;
  }

  if (menu.view === "main") handleMainInput(action);
  if (menu.view === "options") handleOptionsInput(action);
  return true;
}

function handleMainInput(action) {
  if (action === "cancel") {
    closeCampMenu();
    return;
  }
  if (action === "up") {
    menu.mainCursor = (menu.mainCursor + 1) % 2;
    updateSelection();
    return;
  }
  if (action === "down") {
    menu.mainCursor = (menu.mainCursor + 1) % 2;
    updateSelection();
    return;
  }
  if (action === "confirm" && menu.mainCursor === 0) {
    menu.view = "options";
    menu.optionCursor = 0;
    updateMenuView();
    return;
  }
  if (action === "confirm" && menu.mainCursor === 1) {
    closeCampMenu();
  }
}

function handleOptionsInput(action) {
  if (action === "cancel") {
    menu.view = "main";
    updateMenuView();
    return;
  }
  if (action === "up") {
    menu.optionCursor = (menu.optionCursor + optionChoiceCount() - 1) % optionChoiceCount();
    updateSelection();
    return;
  }
  if (action === "down") {
    menu.optionCursor = (menu.optionCursor + 1) % optionChoiceCount();
    updateSelection();
    return;
  }
  if (action === "confirm" || action === "left" || action === "right") {
    if (menu.optionCursor === menu.optionItems.length) {
      menu.view = "main";
      updateMenuView();
      return;
    }
    executeOption(selectedOptionKey());
  }
}

function selectedMainKey() {
  return menu.mainItems[menu.mainIndex]?.dataset.menuMain || "";
}

function selectedOptionKey() {
  return menu.optionItems[menu.optionCursor]?.dataset.option || "";
}

function optionChoiceCount() {
  return menu.optionItems.length + 1;
}

function executeOption(key) {
  if (key === "random") {
    menu.generateRandomDungeon();
    closeCampMenu();
    return;
  }
  if (key === "compass") {
    menu.compassVisible = !menu.compassVisible;
    applyDisplayOptions();
    updateOptionStates();
    return;
  }
  if (key === "readout") {
    menu.readoutVisible = !menu.readoutVisible;
    applyDisplayOptions();
    updateOptionStates();
    return;
  }
  if (key === "autoReturn") {
    closeCampMenu();
    menu.startAutoReturn();
    return;
  }
  if (key === "torchFull") {
    menu.refillTorch();
    closeCampMenu();
  }
}

function bindMenuButtons() {
  menu.mainItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      if (item.dataset.menuMain !== "options") return;
      menu.mainIndex = index;
      menu.mainCursor = 0;
      updateSelection();
      handleMainInput("confirm");
    });
  });
  menu.optionItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      menu.optionCursor = index;
      updateSelection();
      executeOption(item.dataset.option);
    });
  });
}

function bindBackButtons() {
  menu.root?.querySelectorAll("[data-menu-back]").forEach((button) => {
    button.addEventListener("click", () => {
      if (menu.view === "options") {
        menu.optionCursor = menu.optionItems.length;
        menu.view = "main";
        updateMenuView();
      } else {
        menu.mainCursor = 1;
        closeCampMenu();
      }
    });
  });
}

function bindVolumeSliders() {
  menu.root?.querySelectorAll(".volume-row input").forEach((slider) => {
    const valueLabel = slider.parentElement?.querySelector("span");
    slider.addEventListener("input", () => {
      if (valueLabel) valueLabel.textContent = `${slider.value}%`;
    });
  });
}

function updateMenuView() {
  if (!menu.root || !menu.mainPanel || !menu.optionsPanel) return;
  const open = isMenuOpen();
  document.body.classList.toggle("menu-open", open);
  menu.root.hidden = !open;
  menu.mainPanel.hidden = menu.view !== "main";
  menu.optionsPanel.hidden = menu.view !== "options";
  updateSelection();
}

function updateSelection() {
  menu.mainItems.forEach((item, index) => {
    item.classList.toggle("is-selected", menu.view === "main" && menu.mainCursor === 0 && index === menu.mainIndex);
  });
  menu.optionItems.forEach((item, index) => {
    item.classList.toggle("is-selected", menu.view === "options" && index === menu.optionCursor);
  });
  menu.mainBackButton?.classList.toggle("is-selected", menu.view === "main" && menu.mainCursor === 1);
  menu.optionBackButton?.classList.toggle("is-selected", menu.view === "options" && menu.optionCursor === menu.optionItems.length);
  updateOptionStates();
}

function updateOptionStates() {
  const compassState = menu.root?.querySelector('[data-option-state="compass"]');
  const readoutState = menu.root?.querySelector('[data-option-state="readout"]');
  if (compassState) compassState.textContent = menu.compassVisible ? "ON 🔘　OFF ⚫" : "ON ⚫　OFF 🔘";
  if (readoutState) readoutState.textContent = menu.readoutVisible ? "ON 🔘　OFF ⚫" : "ON ⚫　OFF 🔘";
}

function applyDisplayOptions() {
  document.body.classList.toggle("hide-compass", !menu.compassVisible);
  document.body.classList.toggle("show-readout", menu.readoutVisible);
}
