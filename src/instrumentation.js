// Next.js instrumentation hook. Error monitoring is inert unless SENTRY_DSN is set: nothing is imported,
// initialised or sent otherwise (D51).
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.server.config.js");
  }
}

export async function onRequestError(...args) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
