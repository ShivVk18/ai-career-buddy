# PLAN: Phase 6 (interview + roadmap parity, retire the last previews, honest landing page)

Branch `phase-6`. Decisions: D44–D48 in DECISIONS.md. Inputs: CONTEXT.md §11.1–11.6.

**Done when:**
- Every real-data feature of the interview and roadmap previews works in the real routes: open questions, typed and voice answers, the timer, rubric scoring with verified quotes, weak areas, the weekly checklist, toggle with undo, "closes gaps for", and gaps ranked by frequency.
- Every `/tools/*` URL redirects, and `mock.ts` and the tools folder are gone.
- The landing page has no unlabelled fake data or claims that contradict the limits.
- `npm run build` passes, and all 6 tools still work (the MCQ quiz is kept).

Rules: never edit `.env`; migrations are SQL files only and are never applied; every query is scoped by userId; zod on every input; expected failures return `{error, code}`; sources rules D26–D28 and `inventedNumbers` apply to every generator; every AI call goes through runAI (so the cap applies); no audio upload; no feature removed; the MCQ flow stays as it is.

**Out of scope:** industry insights; any new job-target model (D18 still derives targets).

---

### 1. BACKEND: Contract, `InterviewAnswer` model and open questions
- **Files:** `docs/ai/API-CONTRACT.md` (§9), `prisma/schema.prisma`, new migration `interview_answer` (SQL only), `src/actions/Interview.js` (or a new `src/actions/Practice.js`), `src/lib/ai/schemas.js`
- **What:**
  - Add the `InterviewAnswer` model (D45): `id`, `userId`, `sessionId`, `questionIndex`, `question`, `topic`, `answerText`, `rubric` Json, `overall`, `createdAt`, with `@@unique([sessionId, questionIndex])` and an index on `(userId, topic)`.
  - `generateOpenQuestions({count=5 (3–10), jobDescription?})` asks one `write` call for questions, each with `{question, topic, timeLimitSec, sourceIds}`. Sources are job-description lines or profile skills. Unsourced questions are dropped with one retry (D28).
  - The questions are stored in `QuizSession` with `type:"open"`. The action returns `{sessionId, questions}` (no answers or rubric).
- **Why:** D45 and D46.
- **Test:** `prisma validate` passes. A generated session has 5 sourced questions, and the MCQ `generateQuiz` is unchanged.

### 2. BACKEND: Scoring, history and weak areas
- **Files:** the same actions file, new `src/lib/interview/rubric.js` (the weights constant, shared with the UI)
- **What:**
  - `scoreOpenAnswer(sessionId, index, answerText)` is owner-scoped and scores each question once (the unique index; a repeat returns `ALREADY_SCORED` with the stored result). It makes one `fast` call.
  - The zod rubric is `{criteria:[{name, score, quote, feedback}], overall}`, with weights from `rubric.js` (clarity 30, depth 40, evidence 30). The overall score is recomputed on the server from the weights.
  - Each `quote` must appear verbatim (after normalization) in `answerText`; otherwise that criterion's quote is dropped. Feedback passes `inventedNumbers` against the answer and the question.
  - The result is saved as an `InterviewAnswer`.
  - `getOpenSession(sessionId)` returns the questions and any scored answers. `getPracticeHistory()` returns them too.
  - `getWeakAreas()` averages the overall score per topic across your own `InterviewAnswer` rows, with no AI. It needs at least 2 answers per topic and returns the counts.
- **Why:** D46, plus the weak-areas feature.
- **Test:** A quote not found in the answer is dropped, and the overall score matches the weights. A second score call returns `ALREADY_SCORED`. Weak areas reflect only real answers.

### 3. BACKEND: Roadmap undo, gap frequency and "closes gaps for"
- **Files:** `src/actions/CareerRoadmap.js`, `src/actions/ResumeParser.js` (read only, or a new helper)
- **What:**
  - `setRoadmapStepDone(id, stepId, done)` is owner-scoped and recomputes progress. Also fix `updateRoadmapProgress`, which currently ignores its `progress` argument.
  - `getGapFrequency()` counts normalized `missingSkills` across your ATS results and returns `[{skill, count}]` plus `resultCount`, with no AI.
  - `getStepTargets(roadmapId)`: for each step, it finds your targets (D18: ATS, cover letters and cold emails, with company and role) whose stored job description mentions the step's skill or title. It returns `{stepId: [{company, role, jdExcerpt}]}`. This is deterministic, uses `normalizeText`, and uses no AI.
- **Why:** roadmap parity (CONTEXT §11.2).
- **Test:** Toggling a step done and then undoing it updates progress. Gap counts match your ATS rows. Targets appear only where a job description really names the skill.

### 4. BACKEND: The cold email migration check and redirects
- **Files:** `src/actions/ColdEmail.js`, `next.config.mjs`, `src/middleware.js`, `scripts/capture_screenshots.js`, `scripts/capture_via_cdp.js`
- **What:**
  - Before the AI call in `generateColdEmail`, run a cheap check of the Phase 5 columns (e.g. a `findFirst` selecting `subject` with `take:1`). On P2022, return `MIGRATION_PENDING` without spending an AI call (CONTEXT §8 MED).
  - Add redirects: `/tools/interview`→`/interview`, `/tools/roadmap`→`/roadmap`, `/tools`→`/dashboard`.
  - Keep the middleware's `/tools(.*)` guard harmless, or remove it once the redirects cover everything.
  - Point the capture scripts at the real routes.
- **Why:** D44, and the scout's MED problem.
- **Test:** With no migration applied, generate returns `MIGRATION_PENDING` and no `AiUsage` row. All `/tools/*` URLs redirect.

### 5. FRONTEND: Interview practice route
- **Files:** new `(gated)/interview/practice/**`, plus a link from `(gated)/interview/page.jsx`
- **What:**
  - Setup: an optional job description and a question count (3–10, default 5).
  - Then one question at a time, showing its topic and `SourceChips`, and a per-question timer that shows "time's up" and never auto-submits (D46).
  - A typed answer box plus a voice button using `src/hooks/use-speech-to-text.js` that fills the editable textarea, with no upload.
  - Submit leads to a rubric card: per-criterion score, quote highlighted inside the answer, feedback, and an overall score labelled "AI estimate".
  - Show the cap and other errors via `generationError.js` (`ALREADY_SCORED` shows the stored result).
- **Why:** D46.
- **Test:** Complete a 3-question session with one typed and one voice answer. Quotes highlight inside the answers, and the timer never submits on its own.

### 6. FRONTEND: Practice history and weak areas on `/interview`
- **Files:** `(gated)/interview/page.jsx` and its components (PerformanceChart and the like)
- **What:**
  - Add an "Open practice" history section (sessions, scores, and a link to review each).
  - Add a weak areas panel from `getWeakAreas` (topic, average and count), with an empty state until there's enough data.
  - The existing MCQ history and chart stay unchanged.
- **Why:** the weak-areas feature.
- **Test:** After two sessions, weak areas show real topics with counts. The MCQ quiz still works.

### 7. FRONTEND: Roadmap parity UI
- **Files:** `(gated)/roadmap/**` (`RoadmapDetailView.jsx`, the list page)
- **What:**
  - A weekly or phase-grouped checklist built from the existing phase breakdown, labelled as an AI estimate (D47).
  - A step toggle with undo using `setRoadmapStepDone`, which reverts if the save fails.
  - "Closes gaps for" chips from `getStepTargets`, with the job-description excerpt as a tooltip.
  - A "Gaps ranked by frequency" panel on `/roadmap` from `getGapFrequency`, reading "based on N ATS results", with an empty state.
- **Why:** roadmap parity.
- **Test:** Toggle and undo survive a reload, and the targets and gap counts match real data.

### 8. FRONTEND: Retire the last previews and `mock.ts`
- **Files:** delete `src/app/(main)/(gated)/tools/` and `src/lib/mock.ts`; edit `AppSidebar.jsx` (remove the Previews group), and `src/app/page.js` (hrefs at :70,94 and the footer)
- **What:**
  - Remove the remaining previews and every reference to them.
  - Grep `src` and `scripts` for `tools/` and `lib/mock` and confirm both are empty.
- **Why:** D41 and D44.
- **Test:** The build route list has no `/tools`, and the old URLs redirect.

### 9. FRONTEND: An honest landing page
- **Files:** `src/app/page.js` (job demo at :22-50, "live interactive demo" at :218-224, copy at :77,85), `src/components/shared/ResumePaperDoc.jsx`, `src/components/landingPage/PricingSection.jsx`
- **What:**
  - Label the job demo and the paper resume "Sample", and replace real company names with fictional ones.
  - Reword "live interactive demo" if it isn't live.
  - Reword the pricing bullets ("Unlimited AI Credits", "1-on-1 AI Career Coaching") to match reality: 50 AI actions per day by default, and Pip as an AI assistant.
  - Align the copy at :77,85 with the actual features.
  - No layout or design change (D48).
- **Why:** D48 and the "nothing invented" promise.
- **Test:** The landing page shows no unlabelled fake data or claims that contradict the limits.

---

**New env var names:** none.
**New migration (you apply it):** `interview_answer`.
