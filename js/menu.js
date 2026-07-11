const ACTION_FEEDBACK_MS = 260;
const ON_MARK = "\u{1F518}";
const OFF_MARK = "\u26ab";
const OPTION_PAGE_COUNT = 2;

const menu = {
  root: null,
  mainPanel: null,
  optionsPanel: null,
  mainItems: [],
  optionPages: [],
  optionItems: [],
  mainBackButton: null,
  optionNavButtons: [],
  pageIndicator: null,
  mainIndex: 3,
  mainCursor: 0,
  optionCursor: 0,
  optionPage: 0,
  view: "dungeon",
  compassVisible: true,
  readoutVisible: false,
  actionActive: {
    random: false,
    autoReturn: false,
    torchFull: false
  },
  generateRandomDungeon: () => {},
  startAutoReturn: () => {},
  refillTorch: () => {}
};

export function configureMenu(options) {
  Object.assign(menu, options);
  menu.mainPanel = menu.root?.querySelector('[data-menu-view="main"]') || null;
  menu.optionsPanel = menu.root?.querySelector('[data-menu-view="options"]') || null;
  menu.mainItems = Array.from(menu.mainPanel?.querySelectorAll("[data-menu-main]") || []);
  menu.optionPages = Array.from(menu.optionsPanel?.querySelectorAll("[data-option-page]") || []);
  menu.mainBackButton = menu.mainPanel?.querySelector("[data-menu-back]") || null;
  menu.optionNavButtons = Array.from(menu.optionsPanel?.querySelectorAll("[data-option-nav]") || []);
  menu.pageIndicator = menu.optionsPanel?.querySelector("[data-page-indicator]") || null;
  bindMenuButtons();
  bindOptionButtons();
  bindBackButtons();
  bindVolumeSliders();
  applyDisplayOptions();
  updateOptionItems();
  updateMenuView();
}

export function isMenuOpen() {
  return menu.view !== "dungeon";
}

export function openCampMenu() {
  menu.view = "main";
  menu.mainIndex = findMainOptionIndex();
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
  if (action === "up" || action === "down") {
    menu.mainCursor = (menu.mainCursor + 1) % 2;
    updateSelection();
    return;
  }
  if (action === "confirm") {
    if (menu.mainCursor === 0) {
      menu.view = "options";
      setOptionPage(0);
      return;
    }
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
  if (action === "left" || action === "right") {
    adjustSelectedOption(action === "right" ? 1 : -1);
    return;
  }
  if (action === "confirm") {
    if (isOptionNavSelected()) {
      executeOptionNav(selectedOptionNavKey());
      return;
    }
    executeOption(selectedOptionKey());
  }
}

function findMainOptionIndex() {
  const index = menu.mainItems.findIndex(item => item.dataset.menuMain === "options");
  return index >= 0 ? index : 0;
}

function setOptionPage(page) {
  menu.optionPage = Math.max(0, Math.min(OPTION_PAGE_COUNT - 1, page));
  menu.optionCursor = 0;
  updateOptionItems();
  updateMenuView();
}

function updateOptionItems() {
  menu.optionPages.forEach((page, index) => {
    page.hidden = index !== menu.optionPage;
  });
  const currentPage = menu.optionPages[menu.optionPage];
  menu.optionItems = Array.from(currentPage?.querySelectorAll("[data-option]") || []);
}

function selectedOptionKey() {
  return menu.optionItems[menu.optionCursor]?.dataset.option || "";
}

function optionChoiceCount() {
  return menu.optionItems.length + menu.optionNavButtons.length;
}

function isOptionNavSelected() {
  return menu.optionCursor >= menu.optionItems.length;
}

function selectedOptionNavKey() {
  const navIndex = menu.optionCursor - menu.optionItems.length;
  return menu.optionNavButtons[navIndex]?.dataset.optionNav || "";
}

function executeOptionNav(key) {
  if (key === "back") {
    if (menu.optionPage === 0) {
      menu.view = "main";
      updateMenuView();
    } else {
      setOptionPage(0);
    }
    return;
  }
  if (key === "next") {
    if (menu.optionPage === 0) setOptionPage(1);
    else closeCampMenu();
  }
}

function executeOption(key) {
  if (key === "language") return;
  if (key === "random") {
    triggerAction("random", () => {
      menu.generateRandomDungeon();
      closeCampMenu();
    });
    return;
  }
  if (key === "bgmVolume" || key === "seVolume") return;
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
    triggerAction("autoReturn", () => {
      closeCampMenu();
      menu.startAutoReturn();
    });
    return;
  }
  if (key === "torchFull") {
    triggerAction("torchFull", () => {
      menu.refillTorch();
      closeCampMenu();
    });
  }
}

function adjustSelectedOption(amount) {
  if (isOptionNavSelected()) return;
  const key = selectedOptionKey();
  if (key === "bgmVolume" || key === "seVolume") {
    adjustVolume(key, amount);
    return;
  }
  if (key === "compass" || key === "readout") executeOption(key);
}

function adjustVolume(key, amount) {
  const slider = menu.root?.querySelector(`#${key}`);
  if (!slider) return;
  const step = Number(slider.step || 10);
  const min = Number(slider.min || 0);
  const max = Number(slider.max || 100);
  slider.value = String(Math.max(min, Math.min(max, Number(slider.value) + amount * step)));
  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function triggerAction(key, action) {
  if (!Object.prototype.hasOwnProperty.call(menu.actionActive, key)) return;
  menu.actionActive[key] = true;
  updateActionStates();
  window.setTimeout(() => {
    menu.actionActive[key] = false;
    updateActionStates();
    action();
  }, ACTION_FEEDBACK_MS);
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
}

function bindOptionButtons() {
  menu.optionPages.forEach((page) => {
    Array.from(page.querySelectorAll("[data-option]")).forEach((item) => {
      item.addEventListener("click", (event) => {
        if (item.matches(".volume-row") && event.target?.matches("input")) return;
        const index = menu.optionItems.indexOf(item);
        if (index < 0) return;
        menu.optionCursor = index;
        updateSelection();
        executeOption(item.dataset.option);
      });
    });
  });
  menu.optionNavButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      menu.optionCursor = menu.optionItems.length + index;
      updateSelection();
      executeOptionNav(button.dataset.optionNav);
    });
  });
}

function bindBackButtons() {
  if (!menu.mainBackButton) return;
  menu.mainBackButton.addEventListener("click", () => {
    menu.mainCursor = 1;
    closeCampMenu();
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
  updatePager();
  updateSelection();
}

function updatePager() {
  if (menu.pageIndicator) menu.pageIndicator.textContent = `${menu.optionPage + 1}/${OPTION_PAGE_COUNT}`;
  const nextButton = menu.optionNavButtons.find(button => button.dataset.optionNav === "next");
  if (nextButton) nextButton.textContent = menu.optionPage === 0 ? "NEXT" : "MAIN";
}

function updateSelection() {
  menu.mainItems.forEach((item, index) => {
    item.classList.toggle("is-selected", menu.view === "main" && menu.mainCursor === 0 && index === menu.mainIndex);
  });
  menu.optionItems.forEach((item, index) => {
    item.classList.toggle("is-selected", menu.view === "options" && index === menu.optionCursor);
  });
  menu.optionNavButtons.forEach((button, index) => {
    button.classList.toggle("is-selected", menu.view === "options" && menu.optionCursor === menu.optionItems.length + index);
  });
  menu.mainBackButton?.classList.toggle("is-selected", menu.view === "main" && menu.mainCursor === 1);
  updateOptionStates();
}

function updateOptionStates() {
  const compassState = menu.root?.querySelector('[data-option-state="compass"]');
  const readoutState = menu.root?.querySelector('[data-option-state="readout"]');
  if (compassState) compassState.textContent = menu.compassVisible ? `ON ${ON_MARK}　OFF ${OFF_MARK}` : `ON ${OFF_MARK}　OFF ${ON_MARK}`;
  if (readoutState) readoutState.textContent = menu.readoutVisible ? `ON ${ON_MARK}　OFF ${OFF_MARK}` : `ON ${OFF_MARK}　OFF ${ON_MARK}`;
  updateActionStates();
}

function updateActionStates() {
  Object.keys(menu.actionActive).forEach((key) => {
    const state = menu.root?.querySelector(`[data-action-state="${key}"]`);
    if (state) state.textContent = `ON ${menu.actionActive[key] ? ON_MARK : OFF_MARK}`;
  });
}

function applyDisplayOptions() {
  document.body.classList.toggle("hide-compass", !menu.compassVisible);
  document.body.classList.toggle("show-readout", menu.readoutVisible);
}
