import { describe, it, expect, vi, beforeEach } from "vitest";

const logAttempt = vi.fn();
const checkDailyLimit = vi.fn();
vi.mock("../log.js", () => ({ logAttempt: (...a) => logAttempt(...a), debugLog: () => {} }));
vi.mock("../limit.js", () => ({ checkDailyLimit: (...a) => checkDailyLimit(...a) }));
vi.mock("../tasks.js", () => ({
  TASKS: { write: { temperature: 0.4 } },
  getRoute: () => [{ provider: "google", model: "m" }],
}));
vi.mock("../providers.js", () => ({ isSupportedProvider: () => true, createModel: () => ({}) }));
vi.mock("../keys.js", () => ({
  getKeys: () => ["k"],
  nextKey: (_p, tried) => (tried.has(0) ? null : { index: 0, key: "k" }),
  coolDown: () => {},
}));

const { runAI, withAiAction, AIError } = await import("../index.js");

beforeEach(() => {
  logAttempt.mockReset();
  checkDailyLimit.mockReset().mockResolvedValue("ok");
});

describe("one cap check and one actionId per user action", () => {
  it("3 calls in one action = 1 cap check, same actionId, all 3 logged", async () => {
    await withAiAction(async () => {
      await runAI("write", async () => 1, { userId: "u" });
      await runAI("write", async () => 2, { userId: "u" });
      await runAI("write", async () => 3, { userId: "u" });
    });
    expect(checkDailyLimit).toHaveBeenCalledTimes(1);
    expect(logAttempt).toHaveBeenCalledTimes(3);
    const ids = new Set(logAttempt.mock.calls.map((c) => c[0].actionId));
    expect(ids.size).toBe(1);
    expect([...ids][0]).toBeTruthy();
  });
  it("a limit reached mid-action does not block a retry in the same action", async () => {
    await withAiAction(async () => {
      await runAI("write", async () => 1, { userId: "u" });
      checkDailyLimit.mockResolvedValue("over");
      await expect(runAI("write", async () => 2, { userId: "u" })).resolves.toBe(2);
    });
  });
  it("the next action is blocked when over the limit, and nothing is logged", async () => {
    checkDailyLimit.mockResolvedValue("over");
    await expect(withAiAction(() => runAI("write", async () => 1, { userId: "u" }))).rejects.toMatchObject({ code: "AI_LIMIT" });
    expect(logAttempt).not.toHaveBeenCalled();
  });
  it("unavailable usage blocks with AI_UNAVAILABLE and is re-checked next time", async () => {
    checkDailyLimit.mockResolvedValue("unavailable");
    const err = await withAiAction(() => runAI("write", async () => 1, { userId: "u" })).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect(err.code).toBe("AI_UNAVAILABLE");
  });
  it("separate actions get separate ids and separate checks", async () => {
    await withAiAction(() => runAI("write", async () => 1, { userId: "u" }));
    await withAiAction(() => runAI("write", async () => 1, { userId: "u" }));
    expect(checkDailyLimit).toHaveBeenCalledTimes(2);
    expect(logAttempt.mock.calls[0][0].actionId).not.toBe(logAttempt.mock.calls[1][0].actionId);
  });
  it("a call outside an action is its own action", async () => {
    await runAI("write", async () => 1, { userId: "u" });
    await runAI("write", async () => 1, { userId: "u" });
    expect(checkDailyLimit).toHaveBeenCalledTimes(2);
  });
  it("nested actions join the outer one", async () => {
    await withAiAction(() => withAiAction(async () => {
      await runAI("write", async () => 1, { userId: "u" });
      await runAI("write", async () => 1, { userId: "u" });
    }));
    expect(checkDailyLimit).toHaveBeenCalledTimes(1);
  });
});
