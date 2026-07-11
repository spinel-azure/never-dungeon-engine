const menu = {
  root: null,
  mainPanel: null,
  optionsPanel: null,
  mainItems: [],
  optionItems: [],
  mainIndex: 3,
  optionIndex: 0,
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
    updateSelection();
    return;
  }
  if (action === "down") {
    updateSelection();
    return;
  }
  if (action === "confirm" && selectedMainKey() === "options") {
    menu.view = "options";
    menu.optionIndex = 0;
    updateMenuView();
  }
}

function handleOptionsInput(action) {
  if (action === "cancel") {
    menu.view = "main";
    updateMenuView();
    return;
  }
  if (action === "up") {
    menu.optionIndex = (menu.optionIndex + menu.optionItems.length - 1) % menu.optionItems.length;
    updateSelection();
    return;
  }
  if (action === "down") {
    menu.optionIndex = (menu.optionIndex + 1) % menu.optionItems.length;
    updateSelection();
    return;
  }
  if (action === "confirm" || action === "left" || action === "right") {
    executeOption(selectedOptionKey());
  }
}

function selectedMainKey() {
  return menu.mainItems[menu.mainIndex]?.dataset.menuMain || "";
}

function selectedOptionKey() {
  return menu.optionItems[menu.optionIndex]?.dataset.option || "";
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
      updateSelection();
      handleMainInput("confirm");
    });
  });
  menu.optionItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      menu.optionIndex = index;
      updateSelection();
      executeOption(item.dataset.option);
    });
  });
}

function bindBackButtons() {
  menu.root?.querySelectorAll("[data-menu-back]").forEach((button) => {
    button.addEventListener("click", () => {
      if (menu.view === "options") {
        menu.view = "main";
        updateMenuView();
      } else {
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
    item.classList.toggle("is-selected", menu.view === "main" && index === menu.mainIndex);
  });
  menu.optionItems.forEach((item, index) => {
    item.classList.toggle("is-selected", menu.view === "options" && index === menu.optionIndex);
  });
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
