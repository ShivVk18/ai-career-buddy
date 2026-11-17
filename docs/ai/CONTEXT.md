# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `ux-flow-pass` (HEAD `6bc3423`, Phase 8 done). Read-only. Repo-relative paths. Env values, `.env` and the DB were never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript, Turbopack dev/build, standalone output (`next.config.mjs`). React 19.1.10, Tailwind 4, Radix/shadcn (`src/components/ui`), sonner, `@uiw/react-md-editor`, jspdf (resume PDF, `ResumeBuilder.jsx:54`), recharts, framer-motion and motion.
- Forms: react-hook-form + zod ^4 (`src/app/lib/schema.js`). Server zod for AI output (`src/lib/ai/schemas.js`) and profile (`src/actions/User.js:10-15`).
- Auth: Clerk ^6.31.10. Middleware (`src/middleware.js:4-15`) guards `/dashboard`, `/resume`, `/resume-parser`, `/interview`, `/cover-letter`, `/cold-email`, `/roadmap`, `/tools`, `/onboarding`, `/chat`. `/api/chat` is not in that list; the route calls `auth()` itself (`src/app/api/chat/route.js:27`).
- DB: PostgreSQL, Prisma ^6.16.2, 13 migration folders (§4 and DEPLOY.md §1).
- AI: `@langchain/core` ^1.4.1 and `@langchain/google-genai` ^2.3.6 behind `src/lib/ai/`. Gemini only (D5). PDF text: `unpdf`.
- Errors: `@sentry/nextjs` ^11.13.0. Active only with a DSN; scrubbed (`src/lib/sentryScrub.js`, `src/instrumentation*.js`, D51).
- Tests: Vitest ^5.1.0 (`npm test`, `vitest.config.mjs`). REVIEW.md reports 83 passing.
- Background jobs: none. Every AI call runs inline in a server action (`runAI` timeout 90 s). No cron, no queue.
- Docker: multi-stage node:20. `Dockerfile:57` runs `prisma migrate deploy`, then `server.js`.
- Vercel: `vercel.json` (`npm ci`; build `npx prisma generate && npm run build`). No migrate step at build (D52).
- Removed in Phase 7 (`package.json`): openai, resend, @upstash/qstash, html2pdf.js, @react-pdf/renderer, react-markdown, @tabler/core, @clerk/themes.

## 2. Folder map
- `src/app/page.js`: landing. Sample data labelled per D48; `ResumePaperDoc` sample at `:253`.
- `src/app/(auth)/`: Clerk `SignIn` and `SignUp` pages (default components, no one-tap setup in code).
- `src/app/(main)/`: shell `layout.jsx` (sidebar and mobile bottom nav), `error.jsx` (Try again), `loading.jsx`, `onboarding/` (profile form).
- `src/app/(main)/(gated)/`: onboarding gate `layout.jsx:7-13`. Feature folders: `dashboard/`, `resume/`, `resume-parser/`, `interview/` (`mock/`, `practice/`, `practice/[sessionId]/`), `cover-letter/`, `cold-email/`, `roadmap/` (+ `[id]`).
- `src/app/chat/` (outside gate) and `src/app/api/chat/route.js`: the only API route (SSE).
- `src/actions/`: 9 "use server" modules (User, Dashboard, Resume, ResumeParser, CoverLetter, ColdEmail, CareerRoadmap, Interview, Practice).
- `src/lib/ai/`: `index.js` (runAI, runAIText, runAIStructured), `action.js` (withAiAction), `limit.js` (daily cap), `paragraphs.js` (sourced paragraphs), `sources.js` (catalog), `schemas.js`, `numberCheck.js`, `pdf.js`, `providers.js`, `keys.js`, `tasks.js`, `log.js`, `chatContext.js`, `__tests__/`.
- `src/lib/`: `interview/` (rubric, verify, prune), `roadmap/derive.js`, `writing.js`, `match.js`, `ats/weights.js`, `entryIds.js`, `sentryScrub.js`, `clerkEmail.js`, `prisma.js`. Dead: `checkUser.js`.
- `src/components/shared/`: AppSidebar, SourceChips, WritingHints, ResumePaperDoc, generationError.js. `components/chat/`: ChatSlideOver, ChatMessage, ToolResultCard. `components/pixel/`: PixelScene, PipStatus. Dead: `components/SideBar.jsx`, `Header.jsx`.
- `src/hooks/`: use-speech-to-text (browser only, D46), use-fetch. `src/data/`: faqs, features, industries.
- `prisma/`: schema and migrations. `docs/ai/`: DEPLOY, DECISIONS, PLAN, REVIEW, API-CONTRACT, CONTEXT. `scripts/`: selfcheck-matching.mjs, test-ai-providers.js, capture_*.js. `seeder/`.

## 3. Features
| Feature | Page | Server action (line) | AI call (line) |
|---|---|---|---|
| Resume builder | `/resume` | saveResume `Resume.js:106`, getResume `:153`, improveWithAI `:216`, versions `:512-624`, computeMatch `:674`, tailorResume `:743`, saveTailoredVersion `:898`, deleteResume `:315` (no UI) | improve `Resume.js:282`; tailor `Resume.js:832` |
| ATS scan | `/resume-parser` | createATSAnalysis `ResumeParser.js:317`, getUserATSScores `:393`, getATSScoreById `:444`, deleteATSScore `:475`, updateATSScore `:553`, proposeAtsFix `:680`, applyAtsFix `:803`, getATSAnalytics `:498` (no UI) | score `ResumeParser.js:212` (fast); fix `:751` (write) |
| Cover letter | `/cover-letter` | generateCoverLetter `CoverLetter.js:103`, list/get/update/delete `:155/:176/:223/:196`, regenerate `:254`, shorten `:310` | paragraphs `CoverLetter.js:128,281`; shorten `:361` |
| Cold email | `/cold-email` | generateColdEmail `ColdEmail.js:76`, list/get/delete/update `:205/:226/:249/:277`, follow-up `:343` | paragraphs `ColdEmail.js:161`; mailto client-only `ColdEmailPreview.jsx:109` |
| Career roadmap | `/roadmap`, `/roadmap/[id]` | generateCareerRoadmap `CareerRoadmap.js:24`, get `:217/:237`, updateRoadmapProgress `:255`, setRoadmapStepDone `:412`, deleteCareerRoadmap `:327` (no UI), getGapFrequency `:456`, getStepTargets `:481`, progress text `:346` (no UI) | roadmap `CareerRoadmap.js:157`; progress text `:389` (no UI) |
| Interview MCQ | `/interview`, `/interview/mock` | generateQuiz `Interview.js:28`, submitQuiz `:144`, getAssessments `:239` | quiz `Interview.js:87` (fast); tip `:140` |
| Interview practice | `/interview/practice`, `/interview/practice/[sessionId]` | generateOpenQuestions `Practice.js:96`, scoreOpenAnswer `:247`, getOpenSession `:348`, history `:378`, getWeakAreas `:419` | questions `Practice.js:137`; rubric `Practice.js:304` (per answer) |
| Dashboard | `/dashboard` | getDashboardData `Dashboard.js:13`; follow-ups `:62-82` | none |
| Chat | `/chat`; slide-over in `AppSidebar.jsx:277`; dashboard ask box `DashboardView.jsx:174` | POST `/api/chat` `route.js:25` | `route.js:64` (write, temp 0.2), read-only (D19) |
| Onboarding / profile | `/onboarding` (sidebar "profile") | updateUser `User.js:23`, getUserOnboardingStatus `:68` | none |
| Industry insights | removed (D54) | none | none |
| Six tools | sidebar `AppSidebar.jsx:41-46`; `/tools/*` redirects `next.config.mjs:18-27` | | |
Not built: jobs, applications, needs-you queue, notifications, Gmail, GitHub, digest, Scout (§8 item 14).

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId @unique, email, industry String? (plain text, no relation, D54), experience Int?, bio, skills String[]. Owns the rows below.
- `Resume` (:55, one per user, JSON content with entry ids). `ResumeTemplate` (:89). `ResumeVersion` (:129): saved and tailored versions in a JSON envelope; drafts purged after 24 h (`Resume.js:514-528`).
- `CoverLetter` (:146): content, jobTitle, companyName, sources Json?. Tone lives inside sources (no column).
- `ColdEmail` (:324): content, status, sources Json?, recipientName/Role/Email, subject, followUpAt.
- `ATSScore` (:294): scores, recommendations Json[], missingSkills String[], jobDescription, evidence Json? (resume text, appliedFix). Resume text purged after 90 days (D42).
- `CareerPath` (:162): steps Json (sourceIds), milestones, resources, timeline, progress.
- `Assessment` (:41): MCQ quizScore, questions, category, improvementTip.
- `QuizSession` (:364): questions Json (MCQ or `type:"open"`), submittedAt, answers relation. Unsubmitted rows older than 7 days pruned (`src/lib/interview/prune.js:14`).
- `InterviewAnswer` (:378): userId (RESTRICT), sessionId (CASCADE), questionIndex, question, topic, answerText, rubric Json?, overall Float?. Unique (sessionId, questionIndex).
- `AiUsage` (:346): userId (no relation), task, provider, model, ok, latencyMs, errorCode?, actionId? (D50). Read by the daily cap.
- Unused, no references in src or scripts: SkillGapAnalysis (:180), MockInterview (:207), PracticeSession (:238), CareerGoal (:263).
- Not in schema yet (needed by the flow): Job, Application, Task, Proof, Notification, integration tokens.

## 5. How AI is called now
Only path: `src/lib/ai/index.js` (`runAI` :52, `runAIText` :143, `runAIStructured` :158). The cap is checked once per user action (`withAiAction`, `src/lib/ai/action.js:12`, D50). Tasks: fast (temp 0 or 0.3), write (temp 0.4). Every attempt writes AiUsage. Google only.
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:282` improveWithAI | write | numberCheck, one retry, INVENTED_DETAIL |
| `Resume.js:832` tailorResume (impl `:747`) | write | tailorSchema; entryId#bulletIndex real; JD ids; numberCheck; retry |
| `ResumeParser.js:212` scoreResume (called `:356`, `:885`) | fast | atsSchema; quotes checked in stored PDF text (`:33`); retry |
| `ResumeParser.js:751` proposeAtsFix | write | atsFixSchema; original line from stored text; numberCheck; retry |
| `paragraphs.js:78` via `CoverLetter.js:128,281` and `ColdEmail.js:161` | write | paragraphsSchema; sourceIds per paragraph; invented numbers; retry; subject checked |
| `CoverLetter.js:361` shortenCoverLetter | write | shortenSchema; no new ids; only shorter rewrites kept |
| `Interview.js:87` generateQuiz | fast 0.3 | quizSchema; bad answers dropped |
| `Interview.js:140` MCQ tip | write, text | none; failure ignored |
| `Practice.js:137` generateOpenQuestions | write | openQuestionsSchema; sourceIds real (D28); invented numbers; dedupe; one retry |
| `Practice.js:304` scoreOpenAnswer | fast | rubricSchema; quotes must appear in the answer (`verify.js:13`); overall recomputed (`rubric.js`) |
| `CareerRoadmap.js:157` roadmap | write | roadmapSchema; sourceIds checked; unsourced steps dropped; retry |
| `CareerRoadmap.js:389` progress text | write, text | none; no UI |
| `src/app/api/chat/route.js:64` chat | write 0.2 | chatOutputSchema; cards resolved server-side from real records |

## 6. Env (names only, `.env.example`)
- DATABASE_URL, DATABASE_URL_DOCKER, Clerk keys (4), GEMINI_API_KEYS / GEMINI_API_KEY, AI_ROUTE_FAST / AI_ROUTE_WRITE, AI_DEBUG (must be off in production).
- AI_DAILY_LIMIT: unset = 50 user actions per day (D30, D50); "0" = off. Production fails closed when AiUsage is unreadable (`limit.js`, D33).
- ATS_FIX_SIGNING_SECRET (D39, >= 32 chars). SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN (empty = off). SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT (build upload only).

## 7. Build and run
- `npm run dev|build|start|lint|test`. `npm run test:ai` calls live providers (manual, not a unit test).
- Local DB: `npx prisma migrate dev`. Never `migrate dev` or `reset` on production (DEPLOY.md).
- Docker: `docker compose up --build -d`, port 3000; the container runs `migrate deploy` at start.
- Production: DEPLOY.md runbook (backup, `migrate status`, `resolve` only for drift, `migrate deploy` by hand, D52).

## 8. Top problems (open, ranked)
1. HIGH: Deploy gate. Seven migrations not confirmed applied (DEPLOY.md §1, folders `20261117000000` to `20261117060000`). Vercel has no migrate step (`vercel.json`). Production AI is blocked without AiUsage (`limit.js`, D33).
2. HIGH (security): `seedResumeTemplates` (`src/actions/Resume.js:377`) is an exported server action with no `auth()` check. It upserts global `ResumeTemplate` rows. Gate it or remove the export.
3. MED (privacy): ATS resume text is kept up to 90 days (`ResumeParser.js:290` purge, called `:354`, `:400`). The purge runs only on the owner's own ATS calls; there is no scheduled purge.
4. MED (privacy): no account or all-data deletion. `deleteResume` (`Resume.js:315`) has no UI caller.
5. MED: `DashboardView.jsx:40` falls back to EMPTY_DATA when `getDashboardData` fails (`dashboard/page.jsx:4-14`). A failed load reads as "no targets", with no retry button.
6. MED: SourceChips maps legacy records by index (`SourceChips.jsx:88-89`). Hash mapping covers new records only.
7. LOW: `updateRoadmapProgress` (`CareerRoadmap.js:255`) stores the caller's number, not a value recomputed from steps. Owner-scoped.
8. LOW: `getUserATSScores` (`ResumeParser.js:393`) writes on read (purge at `:400`) and loads resume text for 50 rows.
9. LOW: The gate layout passes `Unauthorized` through (`(gated)/layout.jsx:9-11`). Middleware covers it.
10. LOW: No caller and no UI: getATSAnalytics `ResumeParser.js:498`, generateProgressRecommendations `CareerRoadmap.js:346`, deleteCareerRoadmap `:327`, duplicateResume `Resume.js:340`.
11. LOW: Resume entry delete has no confirm and no undo (`EntryForm.jsx:88-91`).
12. LOW: Landing copy "<120 word" (`src/app/page.js:85`) vs the 100-140 range (`writing.js:8`).
13. LOW: Dead code: `components/SideBar.jsx`, `components/Header.jsx`, `lib/checkUser.js`.
14. Not built (product gaps, see the flow audit in the scout report): jobs and applications, needs-you queue, notifications, background work, Gmail, GitHub, digest, Scout.
Resolved since the last map: per-action cap (D50); profile zod (`User.js:10-15`); IndustryInsight placeholder rows and FAQ promise removed (D54, `faqs.js`); migration folders renamed to 2026-11-17 (`f2fd61c`, were dated 11-18 to 11-20); unused deps removed; Vitest added; Sentry scrubbed; hash-based source mapping for new records.

## 9. Frontend notes
- Routing: App Router with `(main)` shell and `(gated)` onboarding gate. Sidebar: home `/dashboard`, applications `/dashboard#applications`, chat, profile `/onboarding`, six tools (`AppSidebar.jsx:34-46`). Mobile: top bar and bottom tab bar (`AppSidebar.jsx:173`, `:228`).
- Loading: `(main)/loading.jsx`, plus Suspense in the gated layouts. Error: `(main)/error.jsx` (Try again). No root `app/error.jsx`.
- Empty states: lists have them (cover letter, cold email, roadmap, quiz, dashboard targets, practice history). Missing on `/resume` and `/resume-parser` (no Pip-and-action state).
- Shared: SourceChips, WritingHints, generationError.js (error code to copy), AlertDialog for deletes, regenerate, shorten and restore.
- State: react-hook-form for forms. Optimistic UI only for roadmap steps (`RoadmapDetailView.jsx:64`, Undo toast `:83`) and cold email follow-up (`ColdEmailPreview.jsx:88-100`).
- Practice: one question at a time (`practice/page.jsx:107`), speech into an editable textarea, timer never submits (`practice/page.jsx:24-41`), RubricCard labelled "AI estimate".
- Cover letter: tone radios (`CoverLetterGen.jsx:147`), MDEditor, Copy and Download TXT (`CoverLetterPreview.jsx:96-113`), regenerate, formal and shorten behind AlertDialog (`:37-41`, `:231`).
- Not wired: ⌘K, Esc handling beyond Radix, tracked changes on the real resume (only the landing sample), Undo beyond roadmap steps.

## 10. Backend notes
- Every feature is a "use server" action. `auth()` is checked in each action except `seedResumeTemplates` (`Resume.js:377`) and the global read `getResumeTemplates` (`Resume.js:188`). Failures return `{error, code}`, or throw "Unauthorized" for signed-out callers (`User.js`).
- Owner scope: every query filters by the caller's user id.
- Practice scoring: a unique claim row is inserted before the AI call and deleted on failure (`Practice.js` impl `:251`). `submittedAt` is set when all answers are scored.
- Trust pattern: sourceIds or quotes checked against the catalog (`sources.js:121`), stored PDF text (`ResumeParser.js:33`), or the typed answer (`verify.js:13`). Numbers: `numberCheck.js`.
- Cap: `checkDailyLimit` counts distinct actionIds per UTC day (`limit.js:1-2`). AiUsage logs every call.
- Retention: `purgeOldResumeText` runs in batches of 50. Quiz prune runs from generateQuiz and generateOpenQuestions (`prune.js:14`).
- No queue or cron. AI runs synchronously inside the request. `vercel.json` sets no maxDuration. List queries use take limits only.
