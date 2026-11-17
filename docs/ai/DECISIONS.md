# Decisions

Owner decisions from Phase 0 (2026-11-17). Context: [CONTEXT.md](CONTEXT.md), questions: [QUESTIONS.md](QUESTIONS.md).
Earlier decisions in BUILD_PLAN.md and AI-PROVIDERS.md still stand unless overridden below.

## Product & routing

| # | Topic | Decision |
|---|-------|----------|
| D1 | Route protection | Restore the Clerk middleware guard on all `(main)` routes plus `/chat` and `/api/chat`. |
| D2 | Mock data | Wire the dashboard and tools to the real server actions, then delete `src/lib/mock.ts`. |
| D3 | Canonical routes | The real routes (`/resume`, `/interview`, `/cover-letter`, `/cold-email`, `/roadmap`, `/resume-parser`) are canonical; the sidebar links to them. `/tools/*` is retired. |
| D4 | Pip chat | Replace the keyword mock in `/api/chat` with calls to the real actions, behind Clerk auth and zod validation. |

## AI layer

| # | Topic | Decision |
|---|-------|----------|
| D5 | Providers | Start with **Gemini only** in `runAI()`. Add OpenAI, Anthropic, Groq and OpenRouter later. |
| D6 | BYOK | **Later.** v1 runs on server-held env keys. Build `UserApiKey` (AES-256-GCM) in a later milestone. This overrides the v1 BYOK in AI-PROVIDERS.md. |
| D7 | LangChain | Use LangChain chat models inside `runAI()` now. Add LangGraph only when a multi-step agent is needed. |
| D8 | Validation | Validate every AI output with zod and retry or reject on failure. Every resume or ATS claim needs a source. |
| D9 | Industry insights | Generate through `runAI()` with a source-citation field, and cache with a real `nextUpdate`. |
| D10 | Quiz scoring | Store the questions server-side and compute the score from the stored answers. Don't trust scores sent by the client. |

## Deployment

| # | Topic | Decision |
|---|-------|----------|
| D11 | Target | **Both:** Vercel for production, Docker for local runs. Fix the Docker setup: compose port 3000, a migrate step, and `.env` in `.dockerignore`. |

## Phase 1 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D12 | Phase 1 scope | No BUILD-PLAN.md exists, so Phase 1 uses the proposed scope: security fixes (route guards, removing resume-content logs), the `runAI()` layer in `src/lib/ai` (Gemini, LangChain, zod), and the Docker fixes. **Done when:** every AI call goes through `runAI()`, the app routes redirect signed-out users, `npm run build` passes, and all 6 tools still work. |
| D13 | Owner WIP | The uncommitted work was committed as one baseline (`725f52d`) before the agents ran. |
| D14 | Logging | Remove raw content logs. Add a redacted logger that records only metadata (task, provider, model, ms, ok/error). Full content is logged only when `AI_DEBUG` is set, outside production. |
| D15 | Migration | All 7 Gemini call sites move to `runAI()` in Phase 1. Dead `AiServices` methods may be removed only if nothing references them, since no feature is removed. |

## Phase 2 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D16 | Phase 2 scope | No BUILD-PLAN.md exists, so Phase 2 is **"real data"**: real dashboard, read-only grounded Pip chat, server-side quiz scoring, a per-user AI cap, and labelling `/tools/*` as previews. **Done when:** `mock.ts` is imported only by `/tools/*` pages, the dashboard and chat show only the signed-in user's real records (empty states otherwise), the quiz score is computed on the server, the daily cap blocks requests over the limit, `npm run build` passes, and all 6 tools still work. |
| D17 | `/tools/*` (amends D2/D3) | Redirecting would remove features, so `/tools/*` **stays reachable as a labelled preview** ("Preview: sample data"). The sidebar links to the real routes. Tool features move into the real routes in a later phase, and `/tools/*` and `mock.ts` are retired only after that. |
| D18 | Job pipeline | No new model. Derive "targets" from the user's ATS scores, cover letters and cold emails (company and role, deduplicated), plus incomplete roadmap steps and the average ATS score. |
| D19 | Pip chat (refines D4) | **Read-only and grounded.** It answers via `runAI` using the user's real profile, ATS scores and roadmaps. Tool cards are built on the server from real records only, never from AI-invented data. Chat never creates or changes anything; it links to the tool pages. |
| D20 | Quiz scoring (D10) | Done in Phase 2. Generated quizzes are stored on the server, correct answers never reach the browser before submit, and the score is computed on the server. One quiz can't be submitted twice. |
| D21 | AI usage cap | A per-user daily cap counts today's `AiUsage` rows against `AI_DAILY_LIMIT`. Over the limit, `runAI` throws `AIError` with code `AI_LIMIT`. If the table is missing (migration not applied), the cap is skipped with a warning. |
| D22 | Migrations | Agents write migration SQL only. The owner applies `AiUsage` and the Phase 2 migration after resolving the dev DB drift. |
| D23 | Quiz "Explain" | Accepted: explanations show on the results screen after submit, not mid-quiz, because they would reveal answers (D20). |
| D24 | Small leftovers | The landing footer links go to the real routes, and the dashboard "ask pip" box sends the typed text to chat. Both are fixed in the Phase 2 fix round. |
