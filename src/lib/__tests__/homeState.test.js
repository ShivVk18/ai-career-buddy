import { describe, it, expect } from "vitest";
import { progressStage, botStatusFor, summarizeBots } from "../home/state.js";

describe("progressStage", () => {
  it("maps statuses to the highest stage reached", () => {
    expect(progressStage([])).toBe("dawn");
    expect(progressStage(["SAVED", "CLOSED"])).toBe("dawn");
    expect(progressStage(["SAVED", "APPLIED"])).toBe("noon");
    expect(progressStage(["APPLIED", "INTERVIEWING"])).toBe("sunset");
    expect(progressStage(["APPLIED", "INTERVIEWING", "OFFER"])).toBe("night");
    expect(progressStage(undefined)).toBe("dawn");
  });
});

describe("botStatusFor", () => {
  const now = Date.parse("2026-11-23T12:00:00Z");
  const done = { status: "done" };
  it("idle when never started", () => {
    expect(botStatusFor({ pipeline: null }, now)).toMatchObject({ state: "idle", completedCount: 0, total: 4 });
  });
  it("running with a fresh claim, idle with a stale one", () => {
    const fresh = { run: { actionId: "a" }, steps: { CHECKER: done, TAILOR: { status: "running", startedAt: new Date(now - 1000).toISOString() } } };
    expect(botStatusFor({ pipeline: fresh }, now)).toMatchObject({ state: "running", step: "TAILOR", completedCount: 1 });
    const stale = { run: { actionId: "a" }, steps: { CHECKER: done, TAILOR: { status: "running", startedAt: new Date(now - 10 * 60000).toISOString() } } };
    expect(botStatusFor({ pipeline: stale }, now)).toMatchObject({ state: "idle", step: "TAILOR" });
  });
  it("failed, needs_you and done", () => {
    expect(botStatusFor({ pipeline: { run: {}, steps: { CHECKER: { status: "failed" } } } }, now).state).toBe("failed");
    const all = { CHECKER: done, TAILOR: { status: "done", needsYou: true }, WRITER: done, CONNECTOR: { status: "skipped" } };
    expect(botStatusFor({ pipeline: { run: {}, steps: all } }, now)).toMatchObject({ state: "needs_you", completedCount: 4 });
    all.TAILOR = done;
    expect(botStatusFor({ pipeline: { run: {}, steps: all } }, now).state).toBe("done");
  });
  it("summarizes", () => {
    expect(summarizeBots([{ state: "running" }, { state: "done" }, { state: "running" }])).toMatchObject({ running: 2, done: 1, failed: 0, needsYou: 0 });
  });
});
