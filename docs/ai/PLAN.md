# PLAN: Phase 2 (real data)

Branch `phase-2`. Decisions: D16–D22 in DECISIONS.md. Inputs: CONTEXT.md §11 "Phase 2 inputs".

**Done when:** `src/lib/mock.ts` is imported only by `/tools/*` pages; the dashboard and Pip chat show only the signed-in user's real records (empty states otherwise); the quiz score is computed on the server; the daily AI cap blocks requests over the limit; `npm run build` passes; all 6 tools still work.

Rules: never edit `.env`; migrations are SQL files only and are never applied (D22); every query is scoped by userId; zod on every input; no feature removed; chat is read-only; nothing invented. When there's no data, show an empty state, not a sample.

**Out of scope:** moving `/tools/*` features into the real routes, citations in generated text (D8), industry insights (D9), BYOK, providers other than Gemini.

---

### 1. BACKEND: Write the API contract first
- **Files:** `docs/ai/API-CONTRACT.md`
- **What:** Define these shapes before any code, so the frontend agent builds against them:
  - `getDashboardData()` return shape.
  - `generateQuiz()` and `submitQuiz(quizId, answers)` input and return shapes.
  - `/api/chat` request, SSE events (keep `step`, `text`, `tool_result`, `done`, add `error {code, message}`) and every tool card's data shape, built only from real records.
  - The `AI_LIMIT` error the UI must handle.
- **Why:** The frontend tasks depend on these shapes, and the contract stops the two agents drifting apart.
- **Test:** The reviewer checks that the code in tasks 2–5 matches the contract.

### 2. BACKEND: Dashboard data action
- **Files:** new `src/actions/Dashboard.js`
- **What:** `getDashboardData()` returns:
  - `firstName` from Clerk.
  - `targets[]`, derived from the user's ATSScore, CoverLetter and ColdEmail rows: company and role, deduplicated, with the latest activity date and which documents exist (with ids for links).
  - `nextTasks[]`: incomplete CareerPath steps, max 5.
  - `avgAtsScore` (null if there are no scores).
  - Counts per tool.

  Everything is scoped by userId with no AI calls.
- **Why:** D18. The dashboard is entirely mock today.
- **Test:** A brand-new user gets empty arrays and `avgAtsScore: null`. After one ATS run and one cover letter, `targets` lists those companies.

### 3. BACKEND: Server-side quiz scoring
- **Files:** `prisma/schema.prisma`, new migration SQL (`quiz_session`), `src/actions/Interview.js`
- **What:**
  - Add a `QuizSession` model (`id`, `userId`, `questions` Json with answers, `createdAt`, `submittedAt?`).
  - `generateQuiz` stores the session and returns `{ quizId, questions }` without `correctAnswer` or `explanation`.
  - `submitQuiz(quizId, answers[])` validates with zod and checks ownership. It rejects a session that's already submitted. It computes the score on the server and saves the `Assessment` (same shape as before, with the tip via runAI). It returns per-question results including the correct answers and explanations.
  - Keep `saveQuizResult` only if something else still calls it; otherwise the reviewer confirms nothing calls it before removal.
  - Keep `getAssessments` and `getLatestQuiz` unchanged.
- **Why:** D20. The score can currently be forged.
- **Test:** The quiz payload in the browser network tab contains no correct answers. Submitting returns the score. A second submit of the same `quizId` is rejected. Editing the request to claim 10/10 has no effect.

### 4. BACKEND: Per-user daily AI cap
- **Files:** new `src/lib/ai/limit.js`, `src/lib/ai/index.js`, `.env.example`
- **What:** Before the first attempt, `runAI` (when it has a userId) counts today's `AiUsage` rows for that user. If the count is at or over `AI_DAILY_LIMIT`, it throws `AIError` with code `AI_LIMIT`. If the env var is unset, there's no cap. If the table is missing, it skips the cap with one warning (D21). Add `AI_DAILY_LIMIT` to `.env.example`.
- **Why:** D21. A real chat lets users spend your key.
- **Test:** With `AI_DAILY_LIMIT=1` and the migration applied, the second AI request of the day fails with `AI_LIMIT`. Without the table, requests still work and one warning is logged.

### 5. BACKEND: Real, read-only Pip chat
- **Files:** `src/app/api/chat/route.js`, new `src/lib/ai/chatContext.js`
- **What:**
  - Remove the `mock.ts` import and the canned replies.
  - Build context from the user's real records: profile (industry, skills, experience), the latest 3 ATS scores, active roadmaps and next steps.
  - Call `runAIStructured("write", …)`. The output schema is `{ reply, cards: [{ type, recordId }] }`. The server fills each card's data from the record with that id, and drops any id that isn't the user's.
  - Stream with the same SSE event shapes, plus an `error` event (including `AI_LIMIT`).
  - The system prompt says: answer only from the given context; say when you don't know; never invent companies, scores or facts.
  - Nothing is written to the database except `AiUsage`.
- **Why:** D19 and the "nothing invented" promise. This is the top HIGH problem.
- **Test:** A new user asking "what's my ATS score?" is told there are no scores yet and gets no card. After an ATS run, the answer cites the real score and shows one card for that record.

### 6. FRONTEND: Real dashboard
- **Files:** `src/app/(main)/(gated)/dashboard/page.jsx`, `_component/DashboardView.jsx`
- **What:**
  - The page calls `getDashboardData()` on the server and passes the result to the view.
  - Remove the `mock.ts` imports, the hard-coded "88/100" and the "Aarav" fallback.
  - The pipeline shows derived targets that link to their real documents. Tasks come from the roadmap. The score is `avgAtsScore` or "No score yet".
  - Each empty section points to the relevant tool.
  - Keep the Pip scene and layout per `design/ascendai-pixel.html`.
- **Why:** D18 and the fabricated-data problem.
- **Test:** A new user sees empty states with no fake companies. With real data, the dashboard shows real records and the links open them.

### 7. FRONTEND: Sidebar goes to the real routes
- **Files:** `src/components/shared/AppSidebar.jsx`, `src/app/(main)/(gated)/resume/page.jsx` (the `/tools/resume` link)
- **What:**
  - The main nav links to `/resume`, `/resume-parser`, `/interview`, `/cover-letter`, `/cold-email` and `/roadmap`.
  - A small secondary "Previews" group keeps `/tools/*` reachable.
  - Label the resume page's link to `/tools/resume` as "Preview".
- **Why:** D3 and D17.
- **Test:** Every main sidebar link opens a real page, and the previews are still reachable.

### 8. FRONTEND: Preview banner on `/tools/*`
- **Files:** new `src/app/(main)/(gated)/tools/layout.jsx` (and a shared banner component if needed)
- **What:** One layout puts a clear, non-dismissable banner above every tool page: "Preview: sample data, not yours." It links to the real version of that tool. The tool pages themselves don't change.
- **Why:** D17. Mock data must never pass for real data.
- **Test:** All 6 `/tools/*` pages show the banner, and its link goes to the matching real route.

### 9. FRONTEND: Quiz UI on server scoring
- **Files:** `src/app/(main)/(gated)/interview/**` (the Quiz component and anything that calls `saveQuizResult`)
- **What:** Use `{ quizId, questions }` from `generateQuiz`, send only `answers[]` to `submitQuiz`, and render the score and per-question results (correct answer and explanation) from the server's response. The browser no longer computes a score.
- **Why:** D20.
- **Test:** Take a quiz end to end. The result screen and assessment history match the server's score.

### 10. FRONTEND: Chat UI for real replies
- **Files:** `src/components/chat/ChatSlideOver.jsx`, `ChatMessage.jsx`, `ToolResultCard.jsx`, `src/app/chat/page.jsx`
- **What:**
  - Replace `MOCK_CHAT_PROMPTS` with neutral suggested prompts defined in the component, such as "What's my latest ATS score?". They must contain no fake data.
  - Handle the new `error` event with a friendly message, plus a specific "daily limit reached" message for `AI_LIMIT`.
  - Render the card shapes from API-CONTRACT.md, and have cards link to the real routes instead of `/tools/*`.
  - No `mock.ts` import remains in the chat components.
- **Why:** D19.
- **Test:** A new user gets a grounded "no data yet" reply. Errors show a message, not a crash. Cards open the real record.

---

**New env var names:** `AI_DAILY_LIMIT` (optional; unset means no cap).
**New migration (you apply it, with `AiUsage`):** `quiz_session`.
