const PRESENCE_MAX = 100;
const STEP_MIN = 5;
const STEP_MAX = 10;
const ENCOUNTER_MESSAGE = "＊　何者かと遭遇した！　＊（戦闘は未実装です）";

let presence = 0;
const hooks = {
  onChange: () => {},
  onEncounter: () => {}
};

export function configurePresence(callbacks) {
  Object.assign(hooks, callbacks);
  hooks.onChange(presence);
}

export function getPresence() {
  return presence;
}

export function addPresence(amount) {
  const increase = Math.max(0, Math.floor(Number(amount) || 0));
  presence = Math.min(PRESENCE_MAX, presence + increase);
  hooks.onChange(presence);
  if (presence < PRESENCE_MAX) return false;
  triggerEncounter();
  return true;
}

export function resetPresence() {
  presence = 0;
  hooks.onChange(presence);
}

export function onPlayerStep(random = Math.random) {
  const amount = Math.floor(random() * (STEP_MAX - STEP_MIN + 1)) + STEP_MIN;
  return addPresence(amount);
}

export function triggerEncounter() {
  hooks.onEncounter(ENCOUNTER_MESSAGE);
  resetPresence();
}
