// Server/edge Sentry init. Imported by instrumentation.js ONLY when SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";
import { SAFE_SENTRY_OPTIONS } from "./lib/sentryScrub.js";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  ...SAFE_SENTRY_OPTIONS,
  // No console capture, no request body capture.
  maxRequestBodySize: "none",
});

// safeErr() (src/lib/utils.js) hands over the error CODE only; it is reported as a tagged message-less error.
globalThis.__reportErrorCode = (code) => {
  const err = new Error(String(code).slice(0, 80));
  err.name = "SafeErr";
  Sentry.captureException(err, { tags: { kind: "safe_err" } });
};
