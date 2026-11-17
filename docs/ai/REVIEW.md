# Phase 1 Review (phase-1, 64bc610..HEAD)

Summary: lint passes (0 errors, 1 warning in src/app/layout.js), `npm run build` passes, 0 must-fix found. 6 nice-to-haves. Caveat: node_modules is not readable by the reviewer, so the LangChain options and the PDF media block were checked only by the build and by reading the code, not against the library source.

## MUST-FIX
None.

## NICE-TO-HAVE
| # | Owner | File:line | Problem | Fix |
|---|-------|-----------|---------|-----|
| 1 | BACKEND | src/lib/ai/index.js:158 (pdfPart) | Inline PDF block `{type:"media", mimeType, data}` is unverified against @langchain/google-genai ^2.3.6. Build cannot catch a wrong block shape. | Run one real ATS upload (or add a PDF case to test:ai). If rejected, use `{type:"file", mimeType, data}` or `{type:"image_url"}` per the installed converter. |
| 2 (RESOLVED in 9cc2866) | BACKEND | src/lib/ai/index.js:14-20 (classify) | Regex `\b5\d\d\b` on the error message can misread text such as "500 characters" as a 5xx and retry or fall back. | Check numeric status first and only use the message regex for 429/quota. |
| 3 (RESOLVED in 9cc2866) | BACKEND | src/actions/Resume.js:~202, CoverLetter.js, ColdEmail.js, Interview.js:65 | Parity drift: resume improve was temp 0.7 with maxOutputTokens 300, now `write` 0.4 with no token cap. Cover letter and cold email were 0.3 (now 0.4). Quiz was 0.3 (now 0). | Accept as D5/D15 consequence, or add an optional `maxOutputTokens` override in runAI. Mention in the changelog. |
| 4 | BACKEND | src/actions/ResumeParser.js:187 | `analyzedBy` changed from "Gemini-2.5-Flash" to "AI". Existing rows differ from new ones. | Store the real model name (return it from runAI) or leave it. |
| 5 (RESOLVED in 9cc2866) | BACKEND | src/actions/ResumeParser.js:371, Interview.js:143, ResumeParser.js:236-377 | Still `console.error(error)` with full error objects, and a stale `revalidatePath("/ats-scores/${id}")`. These are DB errors, not AI content, but a Prisma error can echo query values. | Log `error?.code` only. Change the revalidate path to `/resume-parser`. |
| 6 | BACKEND | Dockerfile (builder stage) | `npm run build` runs in Docker with no env (.env is excluded). If Clerk keys are needed to prerender `/chat` or `/`, the image build may fail. Not testable here. | Pass NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as a build ARG, or confirm `docker compose up --build` works. |

## Checklist results
- Middleware: all 10 listed prefixes use `(.*)`, so subpaths are covered. `/api/chat` is not matched by the redirect. The route itself returns 401 JSON (signed out), 400 for bad JSON or a bad body, with zod validation. OK.
- (gated) layout: `/onboarding` is in `(main)` outside `(gated)`, so no redirect loop. Signed-out "Unauthorized" passes through only because middleware has already redirected. Other errors rethrow to error.jsx. `/chat` is outside the gate (auth only), consistent with the plan. OK.
- runAI: route comes from env only, no hardcoded models. Fallback on 429/5xx/timeout, immediate throw otherwise (per spec). 60s cooldown only on rate limit, round-robin with a per-call tried set. Structured retry-once on parse or schema failure. Error messages contain provider and code only, with no keys or content. `maxRetries: 0` is set so retries are not hidden. AIOutputError is declared after use but only invoked at runtime, so there is no TDZ issue.
- Privacy: content is logged only through debugLog (AI_DEBUG=1 and not production). Raw logs removed from Interview, ResumeParser and CareerRoadmap. Client-facing errors are generic. Roadmap recommendations fall back to a canned string on AI failure, which is the same behavior class as before.
- Parity: all 6 actions keep their inputs. Quiz returns an array of 10 questions (sliced). ATS returns `{success, data}`, and atsScore 0 is now accepted. Cover letter, cold email and resume improve return the same shapes. Cover letter now throws a generic Error instead of the raw one. No dangling imports of AiServices (grep clean).
- Prisma: migration SQL matches the AiUsage model (columns, nullability, both indexes). Added as a new migration only.
- Docker: port 3000:3000, node:20-alpine in all stages, .env and .env.* excluded except .env.example, `prisma migrate deploy` runs before `node server.js`, env via env_file at runtime. OK.
- Secrets: .env is not tracked, and only .env.example is in git.

## Done-when
- No `@google/genai` outside src/lib/ai: PASS (zero matches in src, scripts, package.json; the dependency was removed).
- Every AI call via runAI: PASS.
- Routes redirect signed-out users: PASS (by code review; not browser-tested).
- npm run build: PASS.
- All 6 tools still work: PASS by code review; live behavior (especially the PDF block, nice-to-have 1) not run.

## Follow-up round (9cc2866)
Lint: 0 errors, 1 warning (same layout.js font warning). Build: PASS. MUST-FIX: none. Nice-to-haves 2, 3 and 5 are resolved.

- (a) Override works: `tempOverride ?? TASKS[task].temperature` (so an explicit 0 is honored); `maxOutputTokens` is added to the Google constructor only when truthy, so it is omitted otherwise. runAIText and runAIStructured both forward the options.
- (b) Quiz 0.3; improveWithAI 0.7 with 300 tokens. Cover letter and cold email use the default (write, 0.4), as intended.
- (c) classify now takes only a 3-digit numeric status from status/statusCode/response.status/code, and 5xx is limited to 500-599. The message regex no longer matches `5\d\d`. 429, 5xx and timeouts are still retried. Retrying "fetch failed" and ECONNRESET is reasonable: they are transient network errors, and the fallback to the next key or model is cheap. Nit: `\b429\b` in the message text can still match, for example "429 characters". This is low risk and was not changed.
- (d) The `/ats-scores/${id}` revalidate is gone (grep clean). No `console.error` in src/actions logs a whole error object. They log `error?.message` or `code`/`name`. Nit: `error?.message` on a Prisma error can echo query values, so `error?.code` would be safer. The earlier log text also reads oddly ("Error saving quiz result failed").
- (e) No returned shapes changed (the diff touches only logging, params and classify). Build passes.
