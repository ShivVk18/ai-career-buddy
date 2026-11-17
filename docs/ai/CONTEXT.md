# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-7` (Phase 6 done: `7bc0fdc..6417e3e`). Read-only. Repo-relative paths. Env values and DB never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript, standalone output, server action body 10mb. React 19.1, Tailwind 4, Radix/shadcn (`src/components/ui`), sonner, `@uiw/react-md-editor`, jspdf (`ResumeBuilder.jsx:54`).
- Forms: react-hook-form + zod ^4 (`src/app/lib/schema.js`). Server zod for AI output (`src/lib/ai/schemas.js`). Clerk ^6.31.10 (`src/middleware.js:4-15`); server code calls `auth()`.
- DB: PostgreSQL, Prisma ^6.16.2, 11 migration folders. FIVE not confirmed applied (D22), in apply order: `20261117000000_ai_usage`, `20261117010000_quiz_session`, `20261117020000_phase3_sources`, `20261117030000_cold_email_fields`, `20261117040000_interview_answer`.
- AI: `@langchain/core` + `@langchain/google-genai` behind `src/lib/ai/`. PDF text: `unpdf`. Unused deps: `openai`, `resend`, `@upstash/qstash`. Background jobs: none; all AI runs inline. Docker: multi-stage, node:20, `prisma migrate deploy` then `server.js` (`Dockerfile:57`). No `vercel.json`.

## 2. Folder map
- `src/app/page.js` landing (tool cards, demo, FAQ link); `src/app/(auth)/`; `src/app/chat/` (outside gate).
- `src/app/(main)/(gated)/`: feature pages behind onboarding gate `layout.jsx:13`. `resume/`, `resume-parser/`, `cover-letter/`, `cold-email/`, `dashboard/` (`_component/DashboardView.jsx`), `roadmap/` (+ `[id]`, `_components/GapFrequency.jsx`), `interview/` (MCQ at `mock/`; `practice/` + `[sessionId]/`; `_components/` PracticeHistory, WeakAreas).
- `tools/` deleted. Redirects for all `/tools*` paths: `next.config.mjs:15-22`. `src/middleware.js:12` still guards `/tools(.*)`.
- `src/app/api/chat/route.js`: only API route (SSE). `src/actions/`: "use server" actions (`Practice.js` new in Phase 6).
- `src/lib/ai/`: `index.js` (runAI*, cap), `limit.js`, `schemas.js`, `sources.js` (catalog), `paragraphs.js`, `numberCheck.js`, `pdf.js`, `providers.js`, `keys.js`, `tasks.js`, `log.js`, `chatContext.js`.
- `src/lib/interview/`: `rubric.js` (weights, 20-char min), `verify.js` (quote and sentence checks), `prune.js` (old session cleanup). `src/lib/roadmap/derive.js` (gap keys, step targets). `src/lib/`: `writing.js`, `match.js`, `ats/weights.js`, `entryIds.js`.
- `src/components/shared/`: SourceChips, WritingHints, generationError.js, ResumePaperDoc.jsx, AppSidebar.jsx. `src/hooks/use-speech-to-text.js`. `src/data/faqs.js`. `scripts/`: selfcheck-matching.mjs, test-ai-providers.js, capture_*.js.

## 3. Features
| Feature | Page(s) | Server action / API (line) | AI call (path:line) |
|---|---|---|---|
| Resume builder | `/resume` | saveResume `Resume.js:106`, improveWithAI `:215`, computeMatch `:669`, tailorResume `:737`, versions `:507-619` | `Resume.js:277` improve; `:822` tailor |
| ATS scan | `/resume-parser` | createATSAnalysis `ResumeParser.js:316`, getUserATSScores `:388`, getATSScoreById `:439`, deleteATSScore `:470`, getATSAnalytics `:493` (no UI), updateATSScore `:548`, proposeAtsFix `:674`, applyAtsFix `:792` | scoreResume `:212` (fast); fix `:741` (write) |
| Cover letter | `/cover-letter` | generateCoverLetter `CoverLetter.js:102`, list `:150`, get `:171`, delete `:191`, updateCoverLetter `:218`, regenerateCoverLetter `:248`, shortenCoverLetter `:299` | `CoverLetter.js:123`, `:271` (via `paragraphs.js:77`); shorten `:346` |
| Cold email | `/cold-email` | generateColdEmail `ColdEmail.js:74` (column probe `:97-108`, before AI), list `:199`, get `:220`, delete `:243`, updateColdEmail `:271`, setColdEmailFollowUp `:337` | `ColdEmail.js:8` imports `paragraphs.js:77` (body + subject); mailto is client-only `ColdEmailPreview.jsx:109-120` |
| Career roadmap | `/roadmap`, `/roadmap/[id]` | generateCareerRoadmap `CareerRoadmap.js:23`, getCareerRoadmap(s) `:212`/`:232`, updateRoadmapProgress `:250` (trusts caller number), completeRoadmapStep `:283`, setRoadmapStepDone `:402`, getGapFrequency `:446`, getStepTargets `:471`, generateProgressRecommendations `:340` (no UI) | `:152` write; progress text `:379` (no UI) |
| Interview MCQ | `/interview`, `/interview/mock` | generateQuiz `Interview.js:27`, submitQuiz `:138` (rejects open sessions), getAssessments `:229` | `Interview.js:82` fast; tip `:135` |
| Interview practice (Phase 6) | `/interview/practice`, `/interview/practice/[sessionId]` | generateOpenQuestions `Practice.js:95`, scoreOpenAnswer `:241`, getOpenSession `:338`, getPracticeHistory `:368`, getWeakAreas `:409` | questions `Practice.js:132` write; rubric `:294` fast, one call per answer |
| Dashboard | `/dashboard` | getDashboardData `Dashboard.js:13`; dueFollowUps `:67` | none |
| Chat, onboarding | `/chat`, `/onboarding` | POST `/api/chat` `route.js:25`; updateUser `User.js:9` | chat `route.js:64` write 0.2 |
| Industry insights | none (FAQ `faqs.js:5` still promises it) | none | none; placeholder rows only (`User.js:28-42`) |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId, email @unique, industry FK to IndustryInsight (:17-18), experience, skills[]. Owns most rows, incl. `interviewAnswers`.
- `Resume` (:55, one per user), `ResumeTemplate` (:89). `ResumeVersion` (:129): tailoredContent JSON envelope (no migration); drafts purged after 24 h (`Resume.js:514-523`).
- `CoverLetter` (:146): content, jobTitle, companyName, sources Json? (:155); tone lives inside sources, no column.
- `ColdEmail` (:353): content, status, sources Json?, recipientName/Role/Email, subject, followUpAt (:362-367). New columns need `cold_email_fields`.
- `ATSScore` (:323): scores, recommendations Json[], missingSkills String[] (:336), jobDescription, evidence Json? (:338, needs `phase3_sources`).
- `CareerPath` (:162): steps Json (sourceIds), milestones, resources, timeline, progress.
- `Assessment` (:41): quizScore, questions Json[], category, improvementTip. MCQ rows.
- `QuizSession` (:391): questions Json (MCQ items, or `type:"open"` items), submittedAt; `answers` relation. Unsubmitted rows older than 7 days pruned (`prune.js`).
- `InterviewAnswer` (:405, pending `interview_answer`): userId (RESTRICT: account deletion must remove answers first), sessionId (CASCADE to QuizSession), questionIndex, question, topic, answerText, rubric Json?, overall Float?. Unique (sessionId, questionIndex); index (userId, topic). Null rubric/overall = claim row.
- `AiUsage` (:376, pending `ai_usage`): userId (no relation), task, model, ok; read by the daily cap.
- `IndustryInsight` (:295): zero real rows (see §11a).
- Unused, zero references in src/scripts: MockInterview (:207), SkillGapAnalysis (:180), PracticeSession (:238), CareerGoal (:263).

## 5. How AI is called now
Only path: `src/lib/ai/index.js`. `runAI` checks the cap when userId is set, walks `AI_ROUTE_<TASK>`, rotates keys, 90 s timeout. Tasks: fast temp 0 or 0.3, write temp 0.4. Every attempt writes AiUsage (counts against the cap). Google only.
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:277` improveWithAI | write | numberCheck, one retry, INVENTED_DETAIL |
| `Resume.js:822` tailorResume | write | tailorSchema; entryId#bulletIndex real; jd ids; numberCheck; retry |
| `ResumeParser.js:212` scoreResume | fast | atsSchema; quotes checked in stored PDF text (`:33`); retry |
| `ResumeParser.js:741` proposeAtsFix | write | atsFixSchema; original line from stored text; numberCheck; retry |
| `paragraphs.js:77` (CoverLetter `:123,:271`; ColdEmail) | write | paragraphsSchema; sourceIds per paragraph; inventedNumbers; retry; email subject checked |
| `CoverLetter.js:346` shortenCoverLetter | write | shortenSchema; ids never added; only shorter rewrites kept; retry |
| `Interview.js:82` generateQuiz; `:135` tip | fast 0.3; write | quizSchema, bad answers dropped; tip has no validation, failure ignored |
| `Practice.js:132` generateOpenQuestions | write | openQuestionsSchema; sourceIds real (D28); inventedQuestionNumbers; dedupe; one retry (max 2 calls) |
| `Practice.js:294` scoreOpenAnswer | fast | rubricSchema; quotes via `verify.js:13` (must appear in answer); overall recomputed (`rubric.js`), model overall ignored; feedback via `verify.js:32` |
| `CareerRoadmap.js:152` roadmap; `:379` progress text | write | roadmapSchema, sourceIds checked, unsourced steps dropped, retry; progress text has no validation and no UI |
| `route.js:64` chat | write 0.2 | chatOutputSchema; cards resolved server-side |

## 6. Env (names only, `.env.example`)
- DATABASE_URL(_DOCKER), Clerk keys (4), GEMINI_API_KEYS / GEMINI_API_KEY, AI_ROUTE_FAST/WRITE, AI_DEBUG (must be off in production), AI_DAILY_LIMIT, ATS_FIX_SIGNING_SECRET. Phase 6 added none.
- AI_DAILY_LIMIT: unset = 50 calls per user per day (D30), "0" = off. Production fails closed when AiUsage is unreadable (`limit.js:31-33`).
- ATS_FIX_SIGNING_SECRET (D39): HMAC key, >= 32 chars. Missing in production: FIX_UNAVAILABLE.

## 7. Build and run
- `npm run dev|build|start|lint`; local DB `npx prisma migrate dev`. `npm run test:ai` calls live providers (not a unit test). Only automated check: `node scripts/selfcheck-matching.mjs`.
- Docker `docker compose up --build -d`, port 3000 (runs `migrate deploy` at start).

## 8. Top problems (open, ranked)
Fixed since the last map, removed: cold email column pre-check, /tools previews and mock.ts, pricing and demo copy, speech-hook finals.
1. HIGH: Deploy gate. Five migrations unapplied. Cold email create and probe need `cold_email_fields` (`ColdEmail.js:105`), ATS create needs `evidence` (`ResumeParser.js:356`), letter and email saves need `sources` (`CoverLetter.js:131`, `ColdEmail.js:173`), practice needs `interview_answer`, and production AI is blocked without AiUsage (`limit.js:31-33`). Vercel has no migrate step.
2. MED: One action spends several capped calls. Practice: up to 2 write calls plus one fast call per answer (`Practice.js:132,294`). Tailor 2 (`Resume.js:822-827`), propose and re-score 2 each (`ResumeParser.js:212,741`), shorten 2 (`CoverLetter.js:346`), regenerate 2 (`paragraphs.js:77`). Retries count against 50/day.
3. MED (privacy): Resume text kept up to 90 days (`ResumeParser.js:278-307`). Purge runs only on the owner's own ATS calls (`:349`, `:395`). Delete button exists (DeleteAtsButton).
4. MED: `updateUser` writes skills, experience, bio without zod (`User.js:53-56`) and creates IndustryInsight placeholder rows for any industry string (growthRate 0, "Medium", "Neutral", `User.js:28-42`).
5. MED: Landing FAQ promises industry insights (`src/data/faqs.js:5`), contradicting `faqs.js:13` and D31.
6. MED: Letter and email chips map by paragraph index after user edits; `SourceChips.jsx:81-82` checks count only.
7. LOW: `updateRoadmapProgress` (`CareerRoadmap.js:250`) stores the caller's progress number, not recomputed from steps. Owner-scoped.
8. LOW: `getUserATSScores` writes on read (`ResumeParser.js:395`) and loads resumeText for 50 rows (`:401`).
9. LOW: `setColdEmailFollowUp` (`ColdEmail.js:337`) and `updateColdEmail` (`:271`) return a raw row on success but `{error, code}` on failure.
10. LOW: No caller or UI: getATSAnalytics `ResumeParser.js:493`, generateProgressRecommendations `CareerRoadmap.js:340`.
11. LOW: Legacy entry ids use array index (`entryIds.js:20`). usageCount increments on save (`Resume.js:136`, `:643`). Cross-instance double apply can spend one extra re-score (`ResumeParser.js:870`).
12. LOW: Landing copy: `src/app/page.js:85` "<120 word" vs 100-140 range (`writing.js:8`).
13. LOW: Dead code and unused deps: `components/SideBar.jsx`, `components/Header.jsx`, `lib/checkUser.js`; deps with zero imports: `openai`, `resend`, `@upstash/qstash`, `html2pdf.js`, `@react-pdf/renderer`, `@tabler/core`, `react-markdown`, `@clerk/themes`.

## 9. Frontend notes
- Sidebar uses real routes (previews group gone, `AppSidebar.jsx`). No skeletons on list pages; no root error.jsx.
- Interview: `/interview/practice` setup (JD or profile skills), timer (60-300 s), Speak via `use-speech-to-text.js` into an editable textarea, RubricCard labelled "AI estimate", SCORING_IN_PROGRESS shows Check again, history and weak areas. Timer shows "Time's up" and never auto-submits (`practice/page.jsx:25-44`).
- Roadmap: phase checklist with optimistic toggle, revert on error, Undo toast; GapFrequency and step targets.
- Cover letter: tone chips, regenerate and shorten behind confirm dialogs, WordCount and ClicheCheck. Cold email: follow-up, mailto on explicit click. `generationError.js` handles NOT_SHORTENABLE and MIGRATION_PENDING.

## 10. Backend notes
- Every feature is a "use server" action, owner-scoped by user.id. New Phase 6 actions call `auth()` and throw "Unauthorized" or return `{error, code}`. `getResume` still throws.
- Practice scoring: unique insert of a claim row before the AI call (`Practice.js:34` stale after 2 min); claim deleted on AI failure; readers count only rows with overall set; session `submittedAt` set when all questions are scored. MCQ `submitQuiz` refuses open sessions.
- `pruneOldSessions` (`src/lib/interview/prune.js`) runs from generateQuiz and generateOpenQuestions. MCQ and answerless open parts are independent; take 200 each.
- Trust pattern: sourceIds or quotes checked against the catalog (`sources.js:121`), stored PDF text (`ResumeParser.js:33`) or the typed answer (`verify.js:13`). Numbers: `numberCheck.js`.
- Retention: `purgeOldResumeText` (`ResumeParser.js:290`, batch 50). AI runs synchronously. No queue; list take limits only.

## 11. Phase 7 candidates
Each: size (S/M/L), files, trust conflicts. Pick any subset.

**(a) Industry insights (D9).**
- Today: `IndustryInsight` (`schema.prisma:295`) has salaryRanges, growthRate, demandLevel, topSkills, marketOutlook, keyTrends, jobAvailability, hiringTrends, nextUpdate, and no source or citation field. Zero real rows. `User.js:28-42` creates placeholder rows (growthRate 0, "Medium", "Neutral") that would look like data. Could show on the dashboard (`dashboard/_component/DashboardView.jsx`), a new `/insights` page, or as context in resume improve (`Resume.js:277`) and practice questions (`Practice.js:132`).
- Minimal sourced version needs one of: (1) owner-curated sources, each fact with a URL, read-only page, no AI. Size M. (2) AI summary with quote verification like ATS (`ResumeParser.js:33`), which needs fetched source text (new scraping trust). Size L. Refresh without a job runner: lazy refresh on read when `nextUpdate` has passed, behind the cap, or a manual refresh button. A scheduled route needs a runner decision.
- Trust conflicts: D9 requires cited sources; model-written salary or growth numbers are unbacked unless quoted (D26, inventedNumbers); placeholder rows must be removed first; 50/day cap.
- FAQ copy to restore (D31) only when insights ship. Old text is in commit `a567193` (`src/data/faqs.js`): "We update our industry insights weekly using advanced AI analysis..." Current `faqs.js:13` says "We don't publish weekly market or salary reports yet". `faqs.js:5` still says "industry-specific insights" and should change either way (S).

**(b) Production readiness.**
- Migrations (S to apply, M if drift). Run `prisma migrate status` against production first (read-only). If only the five above are pending, `prisma migrate deploy` applies them in folder order: ai_usage, quiz_session, phase3_sources, cold_email_fields, interview_answer. That order is forced: InterviewAnswer needs QuizSession. All five SQL files are additive (CREATE TABLE, ADD COLUMN, DROP NOT NULL on `User.email`), with no DROP. Back up first. Baseline or resolve is needed only if status reports drift or a table or column already exists (the D22 dev drift); then use `prisma migrate resolve --applied <name>` per migration already present. Never `migrate reset` or `migrate dev` on production. Files: `prisma/migrations/*`, `Dockerfile:57`.
- Folder `20261117040000_interview_answer` is dated after today (REVIEW nice #7). Rename before any later migration lands (S).
- Tests (M): none. No test runner in `package.json`; `TESTING.md:66` mentions a `__tests__` directory that does not exist. Unit targets: `rubric.js` computeOverall, `verify.js`, `prune.js`, `numberCheck.js`, `derive.js` matchStepToJd. Start by moving `scripts/selfcheck-matching.mjs` into the runner. Trust conflicts: none.
- Error monitoring (S to add a provider, M with scrubbing): none today; errors go to `console.error` via `safeErr`. Trust conflict: the provider must never receive resume text, JD text, or Clerk ids.
- Docker and Vercel (D11, M): Docker done (`Dockerfile:57` migrate, `.dockerignore` excludes `.env` and `*.md`). Vercel not set up: no `vercel.json`, no migrate step, so the five migrations need a manual or build step. Owner decides the Vercel build and migrate command. Trust conflict: secrets must live in the platform, not an image.
- Env checklist (S): every name in `.env.example` set in production; AI_DEBUG unset; ATS_FIX_SIGNING_SECRET >= 32 chars; AI_DAILY_LIMIT decided (D30).
- `npm audit`-level risk (S, owner runs it; not run here): `next` ^15.5.9 and `react` 19.1.0 are caret-ranged, so check the lockfile version against advisories. Also `framer-motion` and `motion` both installed, and three PDF libraries (`jspdf`, `html2pdf.js`, `@react-pdf/renderer`).
- Unused deps and models (S): drop the zero-import deps in §8.13. Drop unused models (MockInterview, SkillGapAnalysis, PracticeSession, CareerGoal) only after the owner confirms no data (a migration).

**(c) Remaining quality gaps (from REVIEW nits).**
- Practice submit enabled under 20 chars: `practice/page.jsx:256` checks only non-empty; server min is 20 (`rubric.js`). Disable or show a hint. Size S.
- Typing while recording gets overwritten: `practice/page.jsx:70-73` sets the base on start, then the hook callback replaces the text (`use-speech-to-text.js`). Same pattern in `resume/_components/AITextarea.jsx` and `EntryForm.jsx`. Fix: stop recording on manual edit. Size S. Trust: none.
- Generic copy: `derive.js:70` titlePhrases can yield "customer facing" (extend generic lists, S); `src/app/page.js:101` "1-click fixes that count up live" is vague; `:85` "<120 word" vs 100-140 (`writing.js:8`) (S).

**(d) Other HIGH/MED.** Deploy gate (HIGH, §8.1) is covered by (b), no separate item.
- Multi-call spend (MED, §8.2): options are raise the cap, count only successful calls, or cut retries. Files: `Resume.js:822`, `ResumeParser.js:212,741`, `CoverLetter.js:346`, `paragraphs.js:77`, `Practice.js:132`. Size M. Trust: D30 cap.
- Resume text retention (MED, §8.3): purge on a schedule or on sign-in. Needs a runner decision (see (a)). Files: `ResumeParser.js:278-307`, `:349`, `:395`. Size M. Trust: privacy claim.
- updateUser validation and placeholder rows (MED, §8.4): zod on `User.js:53-56` and stop creating IndustryInsight rows. Size S. Trust: none, but required before (a).
- SourceChips index mapping (MED, §8.6): store paragraph ids on each chip. Files: `SourceChips.jsx:81-82`, `CoverLetterPreview.jsx`, `ColdEmailPreview.jsx`. Size M.
