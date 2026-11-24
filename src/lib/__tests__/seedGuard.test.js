import { describe, it, expect } from "vitest";
import { checkSeedTarget } from "../seed/guard.js";

const url = (h) => `postgresql://u:p@${h}:5432/ascendai`;
describe("checkSeedTarget", () => {
  it("allows local databases", () => {
    expect(checkSeedTarget({ DATABASE_URL: url("localhost") }).ok).toBe(true);
    expect(checkSeedTarget({ DATABASE_URL: url("host.docker.internal"), NODE_ENV: "development" }).ok).toBe(true);
  });
  it("refuses production and remote hosts", () => {
    expect(checkSeedTarget({ DATABASE_URL: url("localhost"), NODE_ENV: "production" }).ok).toBe(false);
    expect(checkSeedTarget({ DATABASE_URL: url("ep-1.neon.tech") }).ok).toBe(false);
    expect(checkSeedTarget({ DATABASE_URL: url("db.prod.example.com") }).ok).toBe(false);
    expect(checkSeedTarget({ DATABASE_URL: url("10.0.0.5") }).ok).toBe(false);
    expect(checkSeedTarget({}).ok).toBe(false);
    expect(checkSeedTarget({ DATABASE_URL: "nonsense" }).ok).toBe(false);
  });
});
