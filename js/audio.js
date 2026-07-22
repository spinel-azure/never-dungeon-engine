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
  urls: new Map(),
  sounds: new Map(),
  pendingSounds: new Set()
};

export function configureAudio() {
  Object.entries(SE).forEach(([key, file]) => {
    audio.urls.set(key, `se/${file}`);
  });
}

export function setSeOptions({ enabled, volume } = {}) {
  if (typeof enabled === "boolean") audio.enabled = enabled;
  if (Number.isFinite(volume)) audio.volume = Math.max(0, Math.min(1, volume));
  if (!audio.enabled || audio.volume <= 0) {
    audio.sounds.forEach(sound => sound.pause());
  }
}

export function playSe(key) {
  if (!audio.enabled || audio.volume <= 0) return Promise.resolve(false);
  const url = audio.urls.get(key);
  if (!url) {
    console.warn(`Unknown SE key: ${key}`);
    return Promise.resolve(false);
  }
  let sound = audio.sounds.get(key);
  if (!sound) {
    sound = new Audio(url);
    sound.preload = "metadata";
    audio.sounds.set(key, sound);
  }
  if (audio.pendingSounds.has(key) || (!sound.paused && !sound.ended)) return Promise.resolve(false);
  try { sound.currentTime = 0; } catch (_error) {}
  sound.volume = audio.volume;
  audio.pendingSounds.add(key);
  const playback = sound.play();
  if (!playback?.then) {
    audio.pendingSounds.delete(key);
    return Promise.resolve(true);
  }
  return playback
    .then(() => true)
    .catch(() => false)
    .finally(() => audio.pendingSounds.delete(key));
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
  const url = audio.urls.get(key);
  if (!url) return Promise.resolve(false);
  const sound = new Audio(url);
  sound.preload = "metadata";
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
