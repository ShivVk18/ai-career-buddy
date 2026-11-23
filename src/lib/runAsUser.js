// Lets server-side background work (the pipeline runner, the cron route) call the existing user actions
// without a browser session. The override lives in AsyncLocalStorage and can only be set by server code
// that already verified ownership (runner.js); the browser cannot reach it.
import { AsyncLocalStorage } from "node:async_hooks";
import { auth } from "@clerk/nextjs/server";

const storage = new AsyncLocalStorage();

/** Runs fn as the given Clerk user. */
export const runAsUser = (clerkUserId, fn) => storage.run({ userId: clerkUserId }, fn);

/** Drop-in for `await auth()` in actions the runner calls: { userId } from the override, else from Clerk. */
export async function authUser() {
  const o = storage.getStore();
  if (o?.userId) return { userId: o.userId };
  return auth();
}
