/** Only same-origin relative paths are allowed as a post-sign-in destination. Anything else becomes null. */
export function safeNext(raw) {
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f]/.test(raw)) return null;
  if (raw === "/sign-in" || raw === "/sign-up" || raw.startsWith("/sign-in?") || raw.startsWith("/sign-up?")) return null;
  return raw;
}
