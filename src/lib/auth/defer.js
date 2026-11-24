import { after } from "next/server";

/** Runs slow side effects (sending email) after the response so response time doesn't reveal which path ran. */
export async function defer(fn) {
  const run = async () => {
    try {
      await fn();
    } catch (e) {
      console.error("deferred auth task failed:", e?.name || "Error");
    }
  };
  try {
    after(run);
  } catch {
    await run(); // outside a request scope (scripts, tests)
  }
}
