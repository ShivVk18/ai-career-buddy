import { describe, it, expect } from "vitest";

// The original script is kept (node scripts/selfcheck-matching.mjs); this runs every one of its cases
// under the test runner so `npm test` covers them too.
describe("scripts/selfcheck-matching.mjs", () => {
  it("passes all legacy self-check cases", async () => {
    await expect(import("../../../scripts/selfcheck-matching.mjs")).resolves.toBeDefined();
  });
});
