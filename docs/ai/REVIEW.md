# Review: Phase 2 (branch phase-2, a5a40e6..HEAD)

Phase 1 results: see git history of this file (commit a2cfd0c and earlier); Phase 1 had no open must-fix items.

Summary: lint pass (0 errors, 1 pre-existing font warning in src/app/layout.js), build pass. 1 MUST-FIX, 7 NICE-TO-HAVE. Code review only; migration not applied, so nothing was run against a DB.

## MUST-FIX

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 1 (RESOLVED in fix round 1) | BACKEND + FRONTEND | src/actions/Interview.js:100,142,167,205; src/app/(main)/(gated)/interview/mock/page.jsx:35-41; src/app/(main)/(gated)/interview/_components/Quiz.jsx:~84 (useFetch toast) | Next.js masks thrown server-action messages in production. The `AI_LIMIT:` prefix check in mock/page.jsx and the "Quiz already submitted" / "Quiz not found" messages only work in dev. In production the user sees a generic masked error, so the daily-limit UX the contract promises (API-CONTRACT s4) is broken for the quiz. The cap itself still blocks the request. | BACKEND: make `generateQuiz` and `submitQuiz` return `{ error, code }` for expected failures (`AI_LIMIT`, `ALREADY_SUBMITTED`, `NOT_FOUND`, `INVALID`, `FAILED`) instead of throwing; keep throwing only for `Unauthorized`. Update API-CONTRACT s2/s4. FRONTEND: branch on `result.code` in mock/page.jsx and Quiz.jsx (do not use `useFetch`'s `toast.error(error.message)` for these); show the friendly limit message on `AI_LIMIT`. |

## NICE-TO-HAVE

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 1 | FRONTEND | src/app/(main)/(gated)/interview/_components/Quiz.jsx (removed Explain button) | Mid-quiz "Explain" hint is gone (see verdict below). Needs owner sign-off against "never remove a feature". | Optional: BACKEND `explainAnswer(quizId, index, answer)` that only returns the explanation after the user has locked an answer; FRONTEND restores the button. Otherwise record the removal in DECISIONS.md. |
| 2 RESOLVED | FRONTEND | src/app/(main)/(gated)/dashboard/_component/DashboardView.jsx:131-136 | "ask pip" quick input shows toast "pip received your request!" and opens chat, but the typed text is never sent (a leftover from the mock). Misleading. | Pass the text to `ChatSlideOver` as an initial message (auto-send) or drop the toast. |
| 3 RESOLVED | FRONTEND | src/app/(main)/(gated)/interview/_components/QuizGenerateForm.jsx | Component has no importers (dead code; its `generateQuiz` call is untouched except the prop pass-through). | Delete it or wire it up; do not leave two generate paths. |
| 4 RESOLVED | BACKEND | src/actions/Interview.js:163-206 | If the process dies between the claim and the `Assessment` insert, the session stays "submitted" with no result (release only runs on caught errors). | Do the claim and `assessment.create` in one `db.$transaction` (generate the tip before it). |
| 5 RESOLVED | BACKEND | src/actions/Interview.js:10,45-49 | All-empty skills (e.g. `["  "]`) pass zod and produce a prompt with no skills. Contract says 1-100 chars. | `.min(1)` after trim, and reject when the cleaned list is empty. |
| 6 | BACKEND | prisma QuizSession | Abandoned (never submitted) sessions accumulate with correct answers in the DB. | Periodic cleanup of unsubmitted rows older than e.g. 7 days. |
| 7 | FRONTEND | src/components/shared/ResumePaperDoc.jsx:8-10 | "Aarav Sharma" sample is still used on the public landing page (src/app/page.js) and /tools/resume. The landing use has no "sample" label. | Label it as a sample on the landing page. |

## Checks that passed

- Contract parity: Dashboard fields/hrefs, quiz generate/submit shapes, chat SSE events (`step`, `text`, `tool_result`, `done`, terminal `error` with `AI_LIMIT`), all 5 card types and their hrefs (`/resume-parser`, `/cover-letter/<id>`, `/cold-email/<id>`, `/roadmap/<id>`, `/interview`) match the consumers. Unknown card types render nothing.
- Scoping: every query in Dashboard.js, Interview.js (QuizSession `findFirst` and `updateMany` include `userId`) and chatContext.js is scoped by the user's DB id. Clerk auth on `/api/chat`, `getDashboardData`, `generateQuiz`, `submitQuiz`.
- Quiz: `generateQuiz` returns only `{question, options}`; correct answers and explanations stay server-side. Score is computed on the server; the claim is atomic (`updateMany ... submittedAt: null`, count must be 1) and is released if the Assessment insert fails. The tip failure does not fail the submit. Zod on `skills`, `quizId`, `answers`, and chat `message`.
- Chat: system prompt restricts answers to the USER DATA block, treats it as data, and forbids inventing facts. Cards are resolved from a server-built index (foreign, unknown, wrong-type and duplicate ids dropped, max 3). The only write is `AiUsage` (via `runAI`). Errors are friendly codes; no raw messages.
- Nothing invented: `grep -rn "lib/mock" src` only matches the 6 `src/app/(main)/(gated)/tools/*/page.jsx` files. No fake names, companies or scores in the dashboard, sidebar or chat.
- Daily cap: counts today's (UTC) `AiUsage` rows by the same Clerk id that `logAttempt` writes; returns false (no cap) when `AI_DAILY_LIMIT` is unset or invalid; fails open with one warning if the table or client is missing.
- Migration `20261117010000_quiz_session` matches schema.prisma (columns, `QuizSession_userId_idx`, FK to User with RESTRICT/CASCADE as Prisma generates).
- `/tools/*` layout shows the non-dismissable preview banner with a link to the real route; the sidebar main nav uses real routes and keeps a Previews group.

## Feature-removal verdicts

1. Quiz "Explain" button: a real user capability was lost. Before, after picking an answer the user could click Explain and read the coach explanation for that question mid-quiz. Now explanations only appear in the results screen after submit. This is required by D20: sending explanations (which reveal the answer) before submit would defeat server-side scoring. Verdict: acceptable but needs owner sign-off (nice-to-have 1).
2. `getLatestQuiz` fallback in Quiz.jsx: no user-facing capability lost. `Quiz` is only mounted from interview/mock/page.jsx, which always passes `initialQuestions` (an array, even when empty, so the old `!initialQuestions` branch never ran). Resuming or re-showing a previous quiz was never reachable. `getLatestQuiz` is still exported and unchanged but now has no callers. The Assessment history on /interview is unaffected.
3. Local task toggle on the dashboard: mock behavior only. It flipped local React state on hard-coded mock tasks and persisted nothing. Real roadmap steps are completed on /roadmap/<id>; the dashboard now links each task there. Nothing real was lost.
4. Old mock chat cards (`resume_edit`, `interview_question`, `roadmap_task`): mock only. They displayed invented data and wrote nothing real. The user can no longer see canned "edit/question/task" cards; they now get real ATS, cover letter, cold email, roadmap and assessment cards that link to the real record. Nothing real was lost.


## Fix round 1 (23282b5..HEAD)

Summary: lint pass (0 errors, 1 pre-existing font warning), build pass. 0 MUST-FIX. MUST-FIX 1 and NICE-TO-HAVE 2, 3, 4, 5 are resolved; D23/D24 match the code.

Verified:
- (a) generateQuiz/submitQuiz return `{error, code}`; only Unauthorized throws (submitQuiz auth is outside the try, so it throws as intended). mock/page.jsx and Quiz.jsx branch on `code` and never treat an error object as quiz/result (they check quizId/questions and results). AI_LIMIT and ALREADY_SUBMITTED are returned values, so they work in production.
- (b) Claim (`updateMany ... submittedAt: null`, count must be 1) and Assessment insert run in one `$transaction`; the AI tip is generated before it. A loser of a concurrent submit gets count 0 and ALREADY_SUBMITTED; a failure rolls back the claim, so retry works. Only one submit can succeed.
- (c) Skills: trim, 1-100 chars, 1-20 items, rejected not dropped, matches contract.
- (d) Footer links all go to existing routes (/resume, /interview, /cover-letter, /cold-email, /roadmap, /resume-parser).
- (e) The ref guard prevents a double send under StrictMode; the parent clears pendingMessage after sending; empty input only opens the chat.
- (f) No importers of QuizGenerateForm remain.
- (g) Quiz.jsx: answer selection, progress and results screen unchanged.

| Severity | File:line | Problem | Fix |
|---|---|---|---|
| nit | src/components/chat/ChatSlideOver.jsx:160-167 | If the chat is already mid-request (isWorking) when an initial message arrives, handleSend returns early and the message is silently dropped (the ref and onInitialMessageSent still fire). Edge case only. | Owner FRONTEND: skip marking sent while isWorking, or queue it. |
| nit | src/actions/Interview.js:132-147 | Two concurrent submits both spend an AI tip call before one loses the claim. Correctness is unaffected. | Owner BACKEND: optional. |
