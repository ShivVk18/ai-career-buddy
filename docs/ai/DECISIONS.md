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

## Phase 3 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D25 | Phase 3 scope | No BUILD-PLAN.md exists, so Phase 3 is **trust + hardening**: sources on every AI output, PDF upload checks, the email collision fix, a default AI cap, and dead-code cleanup. Tools parity moves to Phase 4, industry insights to Phase 5. **Done when:** every new ATS item, improved resume text, cover letter and cold email body paragraph, and roadmap step carries at least one valid source; the server drops unsourced items (retrying once); records from before Phase 3 show a "created before sources" label; invalid PDFs are rejected; no placeholder or empty emails are written; `npm run build` passes; all 6 tools still work. |
| D26 | Citation granularity | **Per item, with linked evidence.** Sources come from a server-built catalog (resume entries, profile fields, job-description lines, or resume-PDF quotes checked against the extracted text). The server rejects any source id or quote it can't verify. Resume entries get a stable `id` inside the existing JSON (no migration). |
| D27 | Letters and emails | **Per paragraph.** Each body paragraph carries source ids, shown as chips under the paragraph. Greeting and closing paragraphs don't need sources. If the user edits the text so paragraphs no longer line up, show a "Based on" list instead. |
| D28 | Unsourced output | The server drops items with no valid source and retries once if too few remain. Nothing unsourced reaches the user. |
| D29 | Pre-Phase-3 records | Show a subtle "Created before sources were added" label. Nothing is regenerated or changed. |
| D30 | AI cap default (amends D21) | Unset `AI_DAILY_LIMIT` now means **50 calls per user per day**; `0` disables the cap. |
| D31 | FAQ copy | Reword the landing FAQ now to describe what exists. Restore the weekly-insights promise when insights ship. |

## Phase 4 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D32 | Phase 4 scope | No BUILD-PLAN.md exists, so Phase 4 is **Resume + ATS parity, including the large items**: tailoring with accept/strike, computed match %, resume versions, the ATS requirement checklist, candidate level, the weights panel, score history, re-run and the 1-click fix with a real re-score. Also fix lost cover letter and cold email edits, and make the cap fail closed in production. The other 4 tools' parity, `/tools/*` retirement and insights come later. **Done when:** every Resume and ATS preview feature that has a real-data equivalent works in `/resume` and `/resume-parser` with sources and no auto-apply; letter and email edits persist; the cap fails closed in production; `npm run build` passes; all 6 tools still work. |
| D33 | Cap safety (amends D21) | In production, if `AiUsage` can't be read, AI calls are blocked with a clear "temporarily unavailable" error. In dev it fails open with a warning. |
| D34 | Cold email (later phase) | When cold email parity is built: one migration adds optional recipient name, role and email, subject and `followUpAt`. The recipient email is only ever typed by the user. The follow-up is a dashboard reminder and never sends. |
| D35 | mailto (later phase) | "Open in mail client" is allowed on an explicit click only, with the address the user typed. It never opens automatically and never sends. |
| D36 | Tailoring | The AI proposes sourced bullet edits, and the user accepts or strikes each. Accepted edits are saved as a `ResumeVersion` for that job. The main resume is untouched until the user chooses "Restore this version", which first snapshots the current resume as a version. |
| D37 | Match % | Deterministic keyword overlap between the job description and the resume, with no AI. Show the % plus the matched and missing terms. |
| D38 | ATS 1-click fix | The AI proposes a sourced rewrite of one flagged bullet. Once the user accepts it, the bullet is applied to the analyzed resume text (stored in `evidence`) and a real `fast` re-score runs. The result is saved as a new ATS result linked to the old one. The main resume is never changed automatically. Scores from before the stored text existed must be re-uploaded to use the fix. |
| D39 | ATS fix signing key | Use a dedicated `ATS_FIX_SIGNING_SECRET` env var, required in production (fail closed if missing), with a purpose-derived key. It no longer reuses `CLERK_SECRET_KEY`. All 8 Phase 4 nice-to-haves are fixed in a follow-up round. |

## Phase 5 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D40 | Phase 5 scope | No BUILD-PLAN.md exists, so Phase 5 is **the writing tools plus retiring 4 previews**. Cover letter parity: tone, regenerate/more formal, shorter, one word-count range and a cliché check. Cold email parity: the D34 migration (recipient, subject, follow-up), mailto (D35), a word counter and a project highlight. Then retire `/tools/resume`, `/tools/ats`, `/tools/cover-letter` and `/tools/cold-email`. Interview and roadmap parity go to Phase 6. **Done when:** every real-data feature of those 4 previews works in the real routes with sources; the 4 previews redirect to their real routes; ATS results can be deleted and stored resume text is purged after 90 days; `npm run build` passes; all 6 tools still work. |
| D41 | Retiring previews | Each preview is removed once its real route has every real-data feature, with a redirect from `/tools/<x>` to the real page. `mock.ts` is removed when the last preview goes (Phase 6). |
| D42 | Stored resume text | Add "Delete result" to ATS history. Strip `evidence.resumeText` from results older than 90 days, opportunistically per user (there's no job runner). Those results then need a re-upload to use the fix. |
| D43 | Cover letter regenerate | Regenerate, more formal, a tone change and "shorter" replace the same letter in place, with new sources, after a confirm dialog warning that edits will be lost. |

## Phase 6 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D44 | Phase 6 scope | Interview and roadmap parity, then retire the last previews and `mock.ts`, plus make the landing page honest. **Done when:** every real-data feature of the interview and roadmap previews works in the real routes (sources, number check and cap apply); every `/tools/*` URL redirects; `mock.ts` and the tools folder are gone; the landing page has no unlabelled fake data or claims that contradict the limits; `npm run build` passes; all 6 tools still work (the MCQ quiz is kept). |
| D45 | Open interview storage | A **new `InterviewAnswer` model** (one migration) holds each scored open answer: session, question index, topic, answer text, rubric and overall score. Generated open questions live in `QuizSession` with `type:"open"`. The MCQ flow is unchanged. |
| D46 | Practice sessions | Default 5 open questions (the user can pick 3–10). Each answer is scored when submitted (one `fast` call), labelled "AI estimate", and every rubric quote must appear verbatim in the user's answer. The timer shows "time's up" but never auto-submits. Voice uses browser speech-to-text only, with no audio upload, and the transcript is editable. |
| D47 | Roadmap weeks | Group the existing steps in the UI by the roadmap's phase breakdown, labelled as an AI estimate. No regeneration and no schema change. |
| D48 | Honest landing page | Label demos "Sample", use fictional company names, and reword pricing bullets to match real limits (50 AI actions per day by default). No design change. |

## Phase 7 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D49 | Phase 7 scope | **Production readiness and quality.** Covers the migration order and runbook, a test runner, Sentry with scrubbing, Vercel config, dependency cleanup, profile validation, counting the cap per action, stable paragraph source mapping and the UI nits. Industry insights moves to Phase 8. **Done when:** `npm test` runs unit tests for the trust helpers; migrations are dated in order and documented in `docs/ai/DEPLOY.md`; the cap counts one per user action; Sentry does nothing without a DSN and scrubs personal data; `vercel.json` exists with no DB access at build time; unused dependencies are removed; the UI nits are fixed; `npm run build` passes; all 6 tools still work. |
| D50 | Cap counting (amends D21/D30) | Count **one per user action**. Every `runAI` call inside one server action shares an `actionId`, and the cap counts distinct action ids per user per day. `AiUsage` still logs every call. |
| D51 | Error monitoring | `@sentry/nextjs`, enabled only when a DSN is set. `beforeSend` strips request bodies, resume, job-description, answer and letter text, emails and Clerk ids, so only error codes, routes and stack frames are sent. |
| D52 | Vercel migrations | Migrations are never run during the build. `docs/ai/DEPLOY.md` is the runbook: back up, `prisma migrate status`, `resolve` only for drift, then `prisma migrate deploy` by hand before promoting. |
| D53 | Test runner | Vitest (default choice, no question needed). The existing self-check cases move into unit tests, and the script stays. |

## Phase 8 (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D54 | Industry insights removed (supersedes D9, D31) | The owner chose to remove industry insights entirely. A new migration removes the `User.industry` → `IndustryInsight` foreign key and drops the `IndustryInsight` table. It held only placeholder rows; no real data. `User.industry` stays as plain text. Remove the placeholder-row creation, the unused `industryInsight` include, the seeds and any FAQ or landing copy promising insights. The D31 "restore the FAQ promise" is dropped. |

## UX flow pass (2026-11-17)

| # | Topic | Decision |
|---|-------|----------|
| D55 | Jobs and applications (supersedes D18) | Add `Job` and `Application` models (one migration). Pasting a job creates both, with the application in SAVED. Letters, emails, ATS scores and versions may link to a job. The old derived targets stay as a fallback for older data. |
| D56 | Job links | Fetch any public **https** URL on the server with guards: block private, loopback, link-local and metadata IPs (re-checked after DNS and on every redirect); 5 s timeout; 2 MB cap; at most 3 redirects; `text/html` only; no cookies or credentials. If the site blocks it or the page is empty, ask the user to paste the text. The URL is saved for "Open job page". Extracted company, title and location carry job-description line sources (D26). |
| D57 | Pipeline | Checker → Tailor → Writer → Connector run as **resumable steps** saved in the database, with no new infrastructure. The open page runs the next step, and leaving pauses it until you return. Outputs land in "needs you". The whole run counts as **one** daily-limit action (D50). No background notifications yet. |
| D58 | Integrations | Gmail, GitHub, Scout and the daily digest are deferred. "Mark applied" and "I got an interview" are one manual tap. D35 (never send) still holds. |
| D59 | Onboarding | Replace the profile form with a resume drop, parsed into editable sourced chips (roles, projects, skills, years), plus 2 tap questions (target role, suggested from the resume; stage: just starting / applying / interviewing) and a profile-strength ring with one next action. A manual path lets users add chips by hand without a long form. The resume is parsed in memory; only the chips and builder data are stored. Onboarding counts as done when there's a resume or the 2 questions are answered, so existing users aren't re-onboarded. |
| D60 | Undo instead of confirm (amends D43) | Deletes become soft deletes with a 5 s Undo. Regenerate, more formal, shorten and warmer save the previous letter first, then offer Undo. Restoring a version gets Undo. The only remaining confirm is deleting the account or all data. |
| D61 | Deleting data | Settings gets "Delete all my data" (keeps the account) and "Delete account" (also deletes the Clerk user), each behind a typed confirmation. |
| D62 | Chat stays read-only (keeps D19) | The home input sends job text or a URL to the job-creation step and questions to chat. Chat itself never creates records. |
| D63 | Accept all (keeps D36) | Per-line accept and "Accept all" on tracked changes save a resume **version**. The main resume changes only on "Restore". |
