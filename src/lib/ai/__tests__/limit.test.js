import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const queryRaw = vi.fn();
vi.mock("../../prisma.js", () => ({ db: { $queryRaw: (...a) => queryRaw(...a) } }));

const { checkDailyLimit, getDailyLimit, countActionsToday } = await import("../limit.js");

const env = { ...process.env };
beforeEach(() => {
  queryRaw.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  delete process.env.AI_DAILY_LIMIT;
});
afterEach(() => {
  process.env = { ...env };
});

describe("getDailyLimit", () => {
  it("defaults to 50, 0 disables, junk falls back", () => {
    expect(getDailyLimit()).toBe(50);
    process.env.AI_DAILY_LIMIT = "0";
    expect(getDailyLimit()).toBeNull();
    process.env.AI_DAILY_LIMIT = "7";
    expect(getDailyLimit()).toBe(7);
    process.env.AI_DAILY_LIMIT = "abc";
    expect(getDailyLimit()).toBe(50);
  });
});

describe("checkDailyLimit (counts actions, D50)", () => {
  it("is ok below the limit and over at the limit", async () => {
    process.env.AI_DAILY_LIMIT = "3";
    queryRaw.mockResolvedValueOnce([{ used: 2n }]);
    expect(await checkDailyLimit("u1")).toBe("ok");
    queryRaw.mockResolvedValueOnce([{ used: 3n }]);
    expect(await checkDailyLimit("u1")).toBe("over");
  });
  it("skips the query when disabled or without a user", async () => {
    process.env.AI_DAILY_LIMIT = "0";
    expect(await checkDailyLimit("u1")).toBe("ok");
    delete process.env.AI_DAILY_LIMIT;
    expect(await checkDailyLimit(undefined)).toBe("ok");
    expect(queryRaw).not.toHaveBeenCalled();
  });
  it("queries distinct actionIds plus null-id rows, scoped to the user and today (UTC)", async () => {
    queryRaw.mockResolvedValueOnce([{ used: 4n }]);
    const start = new Date(Date.UTC(2026, 10, 17));
    expect(await countActionsToday("u1", start)).toBe(4);
    const [strings, ...values] = queryRaw.mock.calls[0];
    const sql = strings.join("?");
    expect(sql).toContain('COUNT(DISTINCT "actionId")');
    expect(sql).toContain('"actionId" IS NULL');
    expect(values).toEqual(["u1", start]);
  });
  it("fails closed in production when usage is unreadable (D33)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    queryRaw.mockRejectedValueOnce(new Error("no table"));
    expect(await checkDailyLimit("u1")).toBe("unavailable");
    vi.unstubAllEnvs();
  });
  it("fails open in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
    queryRaw.mockRejectedValueOnce(new Error("no table"));
    expect(await checkDailyLimit("u1")).toBe("ok");
    vi.unstubAllEnvs();
  });
});
