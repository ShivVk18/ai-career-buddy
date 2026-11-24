// Usage: npm run test:ai (never prints keys)
import { z } from "zod";
import { runAIStructured } from "../src/lib/ai/index.js";
import { getRoute } from "../src/lib/ai/tasks.js";

const schema = z.object({ ok: z.boolean() });
let failed = false;

try {
  const providers = [...new Set(getRoute("fast").map((r) => r.provider))];
  for (const p of providers) {
    try {
      await runAIStructured("fast", schema, () => [
        ["user", 'Reply with only this JSON: {"ok": true}'],
      ]);
      console.log(`${p}: ok`);
    } catch (e) {
      failed = true;
      console.log(`${p}: fail (${e?.code || e?.name || "error"})`);
    }
  }
} catch (e) {
  failed = true;
  console.log(`fail: ${e.message}`);
}
process.exit(failed ? 1 : 0);
