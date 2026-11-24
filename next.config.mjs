/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Always define the browser DSN (empty when unset) so the bundler inlines it and removes the Sentry
  // branch in src/instrumentation-client.js; otherwise the SDK chunk ships even with no DSN (D51).
  env: { NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "" },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

  // D41: the retired /tools previews go to their real routes. Redirects run before pages, so these work
  // even while the old preview pages still exist.
  async redirects() {
    return [
      { source: "/tools/resume", destination: "/resume", permanent: true },
      { source: "/tools/ats", destination: "/resume-parser", permanent: true },
      { source: "/tools/cover-letter", destination: "/cover-letter", permanent: true },
      { source: "/tools/cold-email", destination: "/cold-email", permanent: true },
      // Phase 6 (D44): the last two previews and the (index-less) /tools root.
      { source: "/tools/interview", destination: "/interview", permanent: true },
      { source: "/tools/roadmap", destination: "/roadmap", permanent: true },
      { source: "/tools", destination: "/dashboard", permanent: true },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

// D51: Sentry's build plugin (source-map upload) is only wrapped in when the upload credentials are set.
// Without them the config is exported untouched, so the build does no Sentry work and makes no network call.
// Runtime error reporting is separate and needs only SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN (see src/instrumentation.js).
const canUpload = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

let finalConfig = nextConfig;
if (canUpload) {
  const { withSentryConfig } = await import("@sentry/nextjs");
  finalConfig = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    telemetry: false,
    sourcemaps: { deleteSourcemapsAfterUpload: true },
  });
}

export default finalConfig;
