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
