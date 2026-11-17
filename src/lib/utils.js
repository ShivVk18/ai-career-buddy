import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Safe error metadata for logs: never includes error.message (Prisma messages can echo query values).
// Also hands the CODE (never the message or the error object) to the error monitor when one is active
// (registered by sentry.server.config.js only when SENTRY_DSN is set; otherwise a no-op).
export function safeErr(error) {
  const code = String(error?.code ?? error?.name ?? "unknown");
  try {
    globalThis.__reportErrorCode?.(code);
  } catch {
    // monitoring must never break a request
  }
  return code;
}
