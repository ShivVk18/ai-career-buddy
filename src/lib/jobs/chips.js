// Chip-ready data for intake and pipeline steps. Pure: no I/O.
import { normalizePipeline, publicError, STEPS, STALE_CLAIM_MS, TERMINAL } from "./pipeline.js";

const REQ_HEAD = /^\s*(?:#+\s*)?(?:key\s+)?(requirements?|qualifications?|what you(?:'|’)?ll (?:need|bring)|what we(?:'|’)?re looking for|must[- ]haves?|minimum qualifications?|basic qualifications?|preferred qualifications?|nice to haves?|who you are|you have|skills|your profile)\b[^\n]{0,40}:?\s*$/i;
const ANY_HEAD = /^\s*(?:#+\s*)?[A-Z][A-Za-z '’&/-]{2,50}:?\s*$/;
const BULLET = /^\s*(?:[-*•·▪◦–]|\d+[.)])\s+\S/;

/** How many requirement lines the posting lists (bullets under a requirements-style heading; else bullets overall). */
export function countRequirements(jdText) {
  const lines = String(jdText ?? "").split(/\r?\n/);
  let inReq = false;
  let inReqCount = 0;
  let allBullets = 0;
  for (const line of lines) {
    if (REQ_HEAD.test(line)) {
      inReq = true;
      continue;
    }
    if (BULLET.test(line)) {
      allBullets++;
      if (inReq) inReqCount++;
      continue;
    }
    if (inReq && line.trim() && ANY_HEAD.test(line) && !BULLET.test(line)) inReq = false;
  }
  return Math.min(inReqCount > 0 ? inReqCount : allBullets, 50);
}

const EMPLOYMENT = [
  [/\bfull[\s-]?time\b/i, "full-time"],
  [/\bpart[\s-]?time\b/i, "part-time"],
  [/\b(?:internship|intern)\b/i, "internship"],
  [/\b(?:contract(?:or)?|fixed[\s-]term)\b/i, "contract"],
  [/\bfreelance\b/i, "freelance"],
  [/\btemporary\b/i, "temporary"],
];

/** Employment type exactly as the posting words it (first match, in a fixed order), or null. No guessing. */
export function sniffEmploymentType(jdText) {
  const t = String(jdText ?? "");
  for (const [re, label] of EMPLOYMENT) if (re.test(t)) return label;
  return null;
}

/** Years of experience the posting asks for: "3-5 yrs" or "3+ yrs" (first mention), or null. */
export function sniffExperience(jdText) {
  const t = String(jdText ?? "");
  const range = /\b(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/i.exec(t);
  if (range && Number(range[1]) < Number(range[2])) return `${Number(range[1])}-${Number(range[2])} yrs`;
  const plus = /\b(\d{1,2})\s*\+\s*(?:years?|yrs?)\b/i.exec(t) ?? /\b(?:at least|minimum(?: of)?|min\.?)\s*(\d{1,2})\s*(?:years?|yrs?)\b/i.exec(t);
  if (plus) return `${Number(plus[1])}+ yrs`;
  return null;
}

/** employmentType and experience are present only when the job text has them. */
export function intakeChips(job, jdText) {
  const employmentType = sniffEmploymentType(jdText);
  const experience = sniffExperience(jdText);
  return {
    company: job?.company ?? null, role: job?.title ?? null, location: job?.location ?? null, requirementCount: countRequirements(jdText),
    ...(employmentType ? { employmentType } : {}),
    ...(experience ? { experience } : {}),
  };
}

const META = {
  CHECKER: { id: "checker", label: "Checker", task: "Checks your resume against the job" },
  TAILOR: { id: "tailor", label: "Tailor", task: "Suggests resume edits" },
  WRITER: { id: "writer", label: "Writer", task: "Drafts your cover letter" },
  CONNECTOR: { id: "connector", label: "Connector", task: "Drafts a cold email" },
};

const SKIP_TEXT = { NO_RESUME: "No resume yet" };
const chip = (label, value, tone = "neutral") => ({ label, value: value == null ? null : String(value), tone });

/** Result chips for one step: [{ label, value, tone: neutral|good|warn|bad }]. Empty until the step has a result. */
export function stepChips(step, st) {
  if (!st) return [];
  if (st.status === "skipped") return [chip(SKIP_TEXT[st.reason] ?? "Skipped", null, "warn")];
  if (st.status === "failed") return [chip("Needs a retry", null, "bad")];
  if (st.status !== "done") return [];
  const o = st.output ?? {};
  const out = [];
  if (step === "CHECKER") {
    // Match, ATS and Gaps all come from the one ATS analysis (output.source === "ats"); a chip with no data is omitted.
    const fromAts = o.source === "ats";
    if (fromAts && Number.isFinite(o.matchPercent)) out.push(chip("Match", `${Math.round(o.matchPercent)}%`, o.matchPercent >= 60 ? "good" : "warn"));
    if (Number.isFinite(o.atsScore)) out.push(chip("ATS", o.atsScore));
    if (fromAts && Array.isArray(o.missing)) out.push(chip("Gaps", o.missing.length, o.missing.length ? "warn" : "good"));
  } else if (step === "TAILOR") {
    if (o.proposalCount != null) out.push(chip("Edits", o.proposalCount));
    if (o.inventedCount != null) out.push(chip("Invented", o.inventedCount, o.inventedCount === 0 ? "good" : "bad"));
  } else if (step === "WRITER") {
    out.push(chip("Cover letter", "drafted", "good"));
  } else if (step === "CONNECTOR") {
    out.push(chip("Cold email", "drafted", "good"));
  }
  return out;
}

/**
 * Polling shape. run: "idle" | "running" | "needs_you" | "done" | "failed".
 * steps: [{ id, step, label, task, status: pending|running|done|skipped|failed, chips, ids, needsYou, error, startedAt, finishedAt }]
 */
export function pipelineStatus(app, now = Date.now()) {
  const p = normalizePipeline(app.pipeline);
  const steps = STEPS.map((s) => {
    const st = p.steps[s];
    const fresh = st.status === "running" && now - Date.parse(st.startedAt ?? 0) < STALE_CLAIM_MS;
    const status = st.status === "running" && !fresh ? "pending" : st.status;
    return {
      ...META[s],
      step: s,
      status,
      chips: stepChips(s, { ...st, status }),
      ids: st.ids ?? {},
      needsYou: st.needsYou === true,
      error: status === "failed" ? publicError(st, now) : null,
      startedAt: st.startedAt ?? null,
      finishedAt: st.finishedAt ?? null,
    };
  });
  const done = steps.filter((x) => TERMINAL.has(x.status)).length;
  let run = "idle";
  if (steps.some((x) => x.status === "failed")) run = "failed";
  else if (done === steps.length) run = steps.some((x) => x.needsYou) ? "needs_you" : "done";
  else if (p.run) run = "running";
  // Review can open as soon as tailor is done, while writer/connector keep running.
  const tailor = steps.find((x) => x.step === "TAILOR");
  const draftId = tailor?.status === "done" && typeof tailor.ids?.draftId === "string" ? tailor.ids.draftId : null;
  return { applicationId: app.id, jobId: app.jobId, run, completedCount: done, total: steps.length, reviewReady: draftId !== null, draftId, steps };
}
