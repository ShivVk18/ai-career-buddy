// Browser Sentry. NEXT_PUBLIC_SENTRY_DSN is inlined at build time, so without it this file does nothing and
// the SDK is not loaded (D51).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Promise.all([import("@sentry/nextjs"), import("./lib/sentryScrub.js")]).then(([Sentry, { SAFE_SENTRY_OPTIONS }]) => {
    Sentry.init({
      dsn,
      ...SAFE_SENTRY_OPTIONS,
      // No session replay and no feedback widgets: they would capture what the user sees and types.
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      integrations: (defaults) => defaults.filter((i) => !["Replay", "Feedback"].includes(i.name)),
    });
  });
}

export const onRouterTransitionStart = () => {};
