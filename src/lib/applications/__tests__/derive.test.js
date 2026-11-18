import { describe, it, expect } from "vitest";
import { followUpDueAt, nextAction, gapSteps, uniqueSkills, parseDateInput, DAY_MS } from "../derive.js";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const applied = (extra = {}) => ({ status: "APPLIED", jobId: "j1", appliedAt: new Date(NOW - 6 * DAY_MS), nextActionAt: null, followUpCount: 0, ...extra });

describe("follow-ups", () => {
  it("is due 5 quiet days after applying, at most twice", () => {
    expect(followUpDueAt(applied()).getTime()).toBe(NOW - DAY_MS);
    expect(followUpDueAt(applied({ followUpCount: 2 }))).toBeNull();
    expect(followUpDueAt({ ...applied(), status: "SAVED" })).toBeNull();
  });
  it("is not due before 5 days", () => {
    const a = applied({ appliedAt: new Date(NOW - 2 * DAY_MS) });
    expect(nextAction(a, NOW).label).toBe("Waiting for a reply");
    expect(nextAction(applied(), NOW).label).toBe("Follow up");
  });
  it("uses the last follow-up date when set", () => {
    const a = applied({ followUpCount: 1, nextActionAt: new Date(NOW + 3 * DAY_MS) });
    expect(nextAction(a, NOW).label).toBe("Waiting for a reply");
  });
});

describe("misc", () => {
  it("suggests interview prep only when upcoming", () => {
    const i = { status: "INTERVIEWING", jobId: "j", interviewAt: new Date(NOW + DAY_MS), prepSessionId: null };
    expect(nextAction(i, NOW).label).toBe("Prepare for your interview");
    expect(nextAction({ ...i, prepSessionId: "s" }, NOW).label).toBe("Practice for your interview");
    expect(nextAction({ ...i, interviewAt: new Date(NOW - 5 * DAY_MS) }, NOW).label).toBe("Add the result");
    expect(nextAction({ ...i, prepSessionId: "s" }, NOW).href).toBe("/interview/practice?session=s");
    expect(nextAction({ ...i, interviewAt: null }, NOW).label).toBe("Add your interview date");
    expect(nextAction({ status: "CLOSED", jobId: "j" }, NOW)).toBeNull();
  });
  it("turns gaps into new steps without duplicating", () => {
    expect(uniqueSkills([["React", "react "], ["Docker"]])).toEqual(["React", "Docker"]);
    const steps = [{ id: 3, title: "Learn React" }];
    const added = gapSteps(["React", "Docker"], steps, { company: "Acme", title: "Dev", jobId: "j" });
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ id: 4, title: "Learn Docker", completed: false });
  });
  it("parses dates", () => {
    expect(parseDateInput("2026-12-01").toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(parseDateInput("2026-02-31")).toBeNull();
    expect(parseDateInput("tomorrow")).toBeNull();
  });
});
