// Browser Sentry. NEXT_PUBLIC_SENTRY_DSN is inlined at build time. The literal `process.env.NEXT_PUBLIC_SENTRY_DSN`
// test below lets the bundler delete the whole branch (and so the SDK chunk) when it is unset (D51).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Promise.all([import("@sentry/nextjs"), import("./lib/sentryScrub.js")]).then(([Sentry, { SAFE_SENTRY_OPTIONS }]) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      ...SAFE_SENTRY_OPTIONS,
      // No session replay and no feedback widgets: they would capture what the user sees and types.
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      integrations: (defaults) => defaults.filter((i) => !["Replay", "Feedback"].includes(i.name)),
    });
  });
}

export const onRouterTransitionStart = () => {};
