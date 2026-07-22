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
  sources: new Map(),
  voices: new Map(),
  nextVoice: new Map()
};

const VOICE_COUNTS = { step: 1, cursorMove: 2 };
const DEFAULT_VOICE_COUNT = 3;

export function configureAudio() {
  Object.entries(SE).forEach(([key, file]) => {
    const source = new Audio(`se/${file}`);
    source.preload = "auto";
    audio.sources.set(key, source);
    const count = VOICE_COUNTS[key] || DEFAULT_VOICE_COUNT;
    const voices = Array.from({ length: count }, () => {
      const voice = source.cloneNode(true);
      voice.preload = "auto";
      return voice;
    });
    audio.voices.set(key, voices);
    audio.nextVoice.set(key, 0);
  });
}

export function setSeOptions({ enabled, volume } = {}) {
  if (typeof enabled === "boolean") audio.enabled = enabled;
  if (Number.isFinite(volume)) audio.volume = Math.max(0, Math.min(1, volume));
  if (!audio.enabled || audio.volume <= 0) {
    audio.voices.forEach(voices => voices.forEach(voice => voice.pause()));
  }
}

export function playSe(key) {
  if (!audio.enabled || audio.volume <= 0) return Promise.resolve(false);
  const voices = audio.voices.get(key);
  if (!voices?.length) {
    console.warn(`Unknown SE key: ${key}`);
    return Promise.resolve(false);
  }
  let voiceIndex = voices.findIndex(voice => voice.paused || voice.ended);
  if (voiceIndex < 0) voiceIndex = audio.nextVoice.get(key) || 0;
  const sound = voices[voiceIndex];
  audio.nextVoice.set(key, (voiceIndex + 1) % voices.length);
  sound.pause();
  try { sound.currentTime = 0; } catch (_error) {}
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
