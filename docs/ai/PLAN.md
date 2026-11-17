# PLAN: Phase 1 (security, runAI, Docker)

Branch `phase-1`. Scope and decisions: DECISIONS.md D1, D5–D8, D11–D15. Spec: AI-PROVIDERS.md (Gemini only, no BYOK, no embeddings this phase).

**Done when:** every AI call goes through `runAI()` (no `@google/genai` import outside `src/lib/ai`), the app routes redirect signed-out users, `npm run build` passes, and all 6 tools still work.

Rules for every task: never edit `.env`; new Prisma migrations only; keep each feature's inputs and output shape the same; no prompt or output content in logs.

**Out of scope (later phases):** BYOK and `UserApiKey`, providers other than Gemini, embeddings, wiring dashboard/tools/chat to real data, citation fields in outputs (D8 sources), server-side quiz scoring (D10), industry insights (D9).

---

### 1. BACKEND: Restore route guards and lock `/api/chat`
- **Files:** `src/middleware.js`, `src/app/api/chat/route.js`
- **What:** Protect `/dashboard`, `/resume`, `/resume-parser`, `/interview`, `/cover-letter`, `/cold-email`, `/roadmap`, `/tools`, `/onboarding` and `/chat` (all subpaths). `/api/chat` returns 401 JSON when the user is signed out (no redirect), and validates its request body with zod (400 on bad input). The mock reply logic stays as it is for now (D4 replaces it later).
- **Why:** This is problem #1 in CONTEXT.md: route shells currently render for signed-out users, and the chat API is open.
- **Test:** In a signed-out browser, visiting each route redirects to `/sign-in`. `curl -X POST localhost:3000/api/chat` returns 401. Signed in, every page and the chat still work.

### 2. BACKEND: The `runAI()` core in `src/lib/ai`
- **Files:** `package.json` (add `@langchain/google-genai`, `@langchain/core`), new `src/lib/ai/index.js`, `providers.js`, `keys.js`, `tasks.js`
- **What:** This follows the AI-PROVIDERS.md spec, but supports only the `google` provider. It has:
  - Tasks `fast` (temp 0) and `write` (temp 0.4), routed by `AI_ROUTE_FAST` and `AI_ROUTE_WRITE`.
  - A key pool from `GEMINI_API_KEYS` that falls back to the existing `GEMINI_API_KEY`, with round-robin and a 60s cooldown when a key hits a rate limit.
  - Fallback on 429, 5xx and timeouts.
  - A helper `runAIStructured(task, zodSchema, buildMessages, { userId })` that validates the output and retries once on a parse failure.
  - Support for an inline PDF part (needed by the ATS parser).
  - Model names come only from env. The final error is clear and never includes keys.
- **Why:** D5, D7, D15 and the "single `runAI()`" rule.
- **Test:** The script from task 7 prints `google: ok`.

### 3. BACKEND: `AiUsage` table and redacted logger
- **Files:** `prisma/schema.prisma`, a new migration, `src/lib/ai/log.js`
- **What:** Add the `AiUsage` model (`userId`, `task`, `provider`, `model`, `ok`, `latencyMs`, `errorCode?`, `createdAt`), with one row per attempt written by `runAI`. The logger prints only those metadata fields. Prompt or output content is logged only when `AI_DEBUG=1` and `NODE_ENV !== "production"`.
- **Why:** D14, and problem #3 in CONTEXT.md (privacy).
- **Test:** `npx prisma migrate dev` applies cleanly. After one tool run, a row appears in `AiUsage` and the server logs contain no resume text.

### 4. BACKEND: Migrate interview and ATS
- **Files:** `src/actions/Interview.js`, `src/actions/ResumeParser.js`, and a new `src/lib/ai/schemas.js`
- **What:**
  - Quiz generation and the improvement tip move to `runAI`.
  - The quiz gets a zod schema for 10 questions with options, a correct answer and an explanation.
  - ATS analysis moves to `runAI` with a zod schema matching the current `ATSScore` fields.
  - Fix the bug where `atsScore` 0 is treated as a failure (`:207`), and change the revalidate path from `/ats-scores` to `/resume-parser` (`:234`).
  - Remove the raw logs (`Interview.js:115`, `ResumeParser.js:186,190`).
- **Why:** D8, D15, and problems #3 and #8.
- **Test:** Generate a quiz on `/interview/mock`, finish it, and check that the result saves with a tip. Upload a PDF on `/resume-parser` and check that the score and lists render and save.

### 5. BACKEND: Migrate the resume, cover letter and cold email writers
- **Files:** `src/actions/Resume.js`, `src/actions/CoverLetter.js`, `src/actions/ColdEmail.js`
- **What:** `improveWithAI`, `generateCoverLetter` and `generateColdEmail` move to `runAI("write", …)` and return the same shapes as before. Errors returned to the client become generic messages instead of raw errors (`CoverLetter.js:94-97`).
- **Why:** D15 (3 of the 6 tools).
- **Test:** On `/resume`, "improve with AI" works. On `/cover-letter/new` and `/cold-email/new`, a document is generated, saved and opens at its `[id]` page.

### 6. BACKEND: Migrate the roadmap and remove the old clients
- **Files:** `src/actions/CareerRoadmap.js`, `src/services/AiServices.js`
- **What:**
  - Roadmap generation and progress recommendations move to `runAI` with a zod roadmap schema.
  - Remove the raw log (`CareerRoadmap.js:157`).
  - In `AiServices.js`, delete `DEBUG_MODE`, the `GoogleGenAI` client and the dead methods, but only methods with zero references (the agent greps before deleting). If nothing still uses the file, delete the file.
- **Why:** D15 and the done-when grep.
- **Test:** Create a roadmap on `/roadmap`, open it and complete a step. Grepping for `@google/genai` outside `src/lib/ai` finds no matches.

### 7. BACKEND: `.env.example` and the provider test script
- **Files:** new `.env.example`, new `scripts/test-ai-providers.js`, and a `test:ai` script in `package.json`
- **What:** `.env.example` lists every variable name with a placeholder value: existing ones plus `GEMINI_API_KEYS`, `AI_ROUTE_FAST`, `AI_ROUTE_WRITE` and `AI_DEBUG`. The script runs `runAI("fast")` with a tiny zod schema and prints ok or fail per provider. It never prints keys.
- **Why:** AI-PROVIDERS.md "Test", and the missing `.env.example` noted in CONTEXT.md.
- **Test:** `npm run test:ai` prints `google: ok`.

### 8. BACKEND: Fix Docker
- **Files:** `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- **What:**
  - The compose port becomes `3000:3000`.
  - Add `.env*` (except `.env.example`) to `.dockerignore`.
  - Use one Node version (20) in every stage.
  - Run `prisma migrate deploy` on start.
  - Env comes in through compose `env_file` at runtime, not baked into the image.
- **Why:** D11 and problem #10.
- **Test:** `docker compose up --build`, and `localhost:3000` loads. `docker run --rm <image> ls -a` shows no `.env` inside the image.

### 9. FRONTEND: Restore the onboarding gate in the app shell
- **Files:** `src/app/(main)/layout.jsx`
- **What:** On the server, check `getUserOnboardingStatus()` and redirect users who haven't onboarded to `/onboarding`. Keep the new `AppSidebar` shell and skip the check on `/onboarding` itself, so the redirect can't loop.
- **Why:** The WIP removed the gate (CONTEXT.md §8), so new users currently land in tools with no profile.
- **Test:** A newly signed-up user goes to `/dashboard` and is sent to `/onboarding`. After onboarding, `/dashboard` loads.

### 10. FRONTEND: Friendly error boundary for the app routes
- **Files:** new `src/app/(main)/error.jsx`
- **What:** A client error boundary in the style of `design/ascendai-pixel.html`, with a Pip illustration, a short message and a "Try again" button that calls `reset()`. It never shows raw error text.
- **Why:** `runAI` now throws clear errors when every provider fails, and there is no `error.jsx` anywhere (problem #11).
- **Test:** Set `AI_ROUTE_FAST` to a bad model locally, run a quiz, and check that the friendly screen appears and "Try again" recovers once the env is fixed.

---

**New env var names (you add the values):** `GEMINI_API_KEYS` (optional; `GEMINI_API_KEY` still works), `AI_ROUTE_FAST`, `AI_ROUTE_WRITE`, `AI_DEBUG` (optional).
