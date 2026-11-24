// Round-robin key pool per provider with a cooldown for rate-limited keys.
const COOLDOWN_MS = 60_000;

const ENV_BY_PROVIDER = {
  google: ["GEMINI_API_KEYS", "GEMINI_API_KEY"],
};

const cursor = new Map(); // provider -> next index
const cooldownUntil = new Map(); // `${provider}:${index}` -> timestamp

export function getKeys(provider) {
  const names = ENV_BY_PROVIDER[provider];
  if (!names) return [];
  for (const name of names) {
    const raw = process.env[name];
    if (raw && raw.trim()) {
      return raw.split(",").map((k) => k.trim()).filter(Boolean);
    }
  }
  return [];
}

export function hasProvider(provider) {
  return Boolean(ENV_BY_PROVIDER[provider]);
}

/** Returns the next usable key as { key, index }, or null if none are available. */
export function nextKey(provider, skip = new Set()) {
  const keys = getKeys(provider);
  if (keys.length === 0) return null;
  const now = Date.now();
  const start = cursor.get(provider) || 0;
  for (let n = 0; n < keys.length; n++) {
    const index = (start + n) % keys.length;
    if (skip.has(index)) continue;
    if ((cooldownUntil.get(`${provider}:${index}`) || 0) > now) continue;
    cursor.set(provider, (index + 1) % keys.length);
    return { key: keys[index], index };
  }
  return null;
}

export function coolDown(provider, index) {
  cooldownUntil.set(`${provider}:${index}`, Date.now() + COOLDOWN_MS);
}
