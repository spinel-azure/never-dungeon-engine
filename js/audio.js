export const SE = Object.freeze({
  battleStart: "battle_start.wav",
  attackHit: "damage.wav",
  spellAttack: "fire_attack.wav",
  playerDamage: "my_damage.wav",
  guard: "bassdrum.wav",
  attackMiss: "miss.wav",
  buff: "charge.wav",
  enemyDefeated: "arawaru.wav",
  battleVictory: "fanfare.wav",
  step: "ashioto.wav",
  blocked: "doon.wav",
  door: "door1.wav",
  stairs: "zaza.wav",
  cursorMove: "cursor_7.wav",
  confirm: "cursor_1.wav",
  cancel: "cancel.wav",
  item: "item_3.wav",
  heal: "little_cure.wav"
});

const audio = {
  enabled: true,
  volume: .1,
  sources: new Map()
};

export function configureAudio() {
  Object.entries(SE).forEach(([key, file]) => {
    const source = new Audio(`se/${file}`);
    source.preload = "auto";
    audio.sources.set(key, source);
  });
}

export function setSeOptions({ enabled, volume } = {}) {
  if (typeof enabled === "boolean") audio.enabled = enabled;
  if (Number.isFinite(volume)) audio.volume = Math.max(0, Math.min(1, volume));
}

export function playSe(key) {
  if (!audio.enabled || audio.volume <= 0) return Promise.resolve(false);
  const source = audio.sources.get(key);
  if (!source) {
    console.warn(`Unknown SE key: ${key}`);
    return Promise.resolve(false);
  }
  const sound = source.cloneNode(true);
  sound.volume = audio.volume;
  return sound.play().then(() => true).catch(() => false);
}

export async function playSeSequence(key, count = 1) {
  const repeats = Math.max(0, Math.floor(count));
  for (let index = 0; index < repeats; index += 1) {
    if (!audio.enabled || audio.volume <= 0) return false;
    await playSeToEnd(key);
  }
  return true;
}

function playSeToEnd(key) {
  const source = audio.sources.get(key);
  if (!source) return Promise.resolve(false);
  const sound = source.cloneNode(true);
  sound.volume = audio.volume;
  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(result);
    };
    const timeout = window.setTimeout(() => finish(false), 10000);
    sound.addEventListener("ended", () => finish(true), { once: true });
    sound.addEventListener("error", () => finish(false), { once: true });
    sound.play().catch(() => finish(false));
  });
}
