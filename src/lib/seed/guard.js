// Safety check for the demo seed: only ever a local/dev database. Pure, unit tested.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "host.docker.internal", "postgres", "db"]);
const PROD_HINTS = /(prod|production|rds\.amazonaws|neon\.tech|supabase|railway|vercel-storage|render\.com|azure|cloud\.google|planetscale|digitalocean)/i;

/** @returns {{ ok: true } | { ok: false, reason: string }} */
export function checkSeedTarget(env) {
  if (env.NODE_ENV === "production") return { ok: false, reason: "NODE_ENV is production." };
  const url = env.DATABASE_URL;
  if (!url) return { ok: false, reason: "DATABASE_URL is not set." };
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { ok: false, reason: "DATABASE_URL is not a valid URL." };
  }
  if (PROD_HINTS.test(host)) return { ok: false, reason: "DATABASE_URL host looks like a production host." };
  if (!LOCAL_HOSTS.has(host)) return { ok: false, reason: `DATABASE_URL host "${host}" is not a local database.` };
  return { ok: true };
}
