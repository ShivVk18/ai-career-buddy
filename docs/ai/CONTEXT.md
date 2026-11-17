# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-3` (after Phase 2: a2cfd0c..60bb347). Read-only. Paths are repo-relative. Env values were never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript. `next.config.mjs`: `output: "standalone"`, server action body limit 10mb (:15).
- React 19.1.0, Tailwind ^4, Radix/shadcn (`src/components/ui`), framer-motion, recharts, sonner, next-themes, `@uiw/react-md-editor` (cover letter and cold email preview).
- Forms: react-hook-form + zod ^4 on the client (`src/app/lib/schema.js`). Server zod for AI output (`src/lib/ai/schemas.js`) and for quiz and chat inputs.
- Auth: Clerk `@clerk/nextjs` ^6.31.10. `src/middleware.js` (protected list :4-15). Server code uses `auth()`.
- DB: PostgreSQL, Prisma ^6.16.2, 8 migrations. `20261117000000_ai_usage` and `20261117010000_quiz_session` are not confirmed applied (D22: owner applies).
- AI: `@langchain/core` and `@langchain/google-genai`, wrapped in `src/lib/ai/`. `openai` is installed but unused.
- Background jobs: none (`@upstash/qstash`, `resend` unused). Tests: `npm run test:ai` is a live smoke test; no unit tests.
- Docker: multi-stage `Dockerfile`, node:20. Container runs `prisma migrate deploy` then `server.js`.

## 2. Folder map
- `src/app/(auth)/` Clerk sign-in and sign-up. `src/app/page.js` landing. `src/app/chat/` Pip chat page, outside `(gated)`.
- `src/app/(main)/` shell: `layout.jsx` (AppSidebar), `error.jsx`, `loading.jsx`, `onboarding/` (outside the gate).
- `src/app/(main)/(gated)/` feature pages. `layout.jsx:13` is the onboarding gate. `dashboard/` real. `tools/` six previews; `tools/layout.jsx` adds the preview banner.
- `src/app/api/chat/route.js` the only API route (SSE).
- `src/actions/` "use server": User, Resume, ResumeParser, Interview, CoverLetter, ColdEmail, CareerRoadmap, Dashboard (new).
- `src/lib/ai/` AI layer: `index.js` (runAI, runAIText, runAIStructured), `tasks.js`, `providers.js`, `keys.js`, `log.js` (AiUsage), `schemas.js`, `limit.js` (daily cap, new), `chatContext.js` (grounded chat data and cards, new).
- `src/components/` `shared/` (AppSidebar, ResumePaperDoc), `chat/`, `pixel/`, `ui/`, `landingPage/`. `components/SideBar.jsx` and `components/Header.jsx` are unused.
- `prisma/` schema and migrations; `seeder/` manual seeds; `scripts/` screenshots and `test-ai-providers.js`; `docs/ai/` plans, `API-CONTRACT.md` (Phase 2 contract), `REVIEW.md`.

## 3. Features
| Feature | Page(s) | Server action / API | AI call |
|---|---|---|---|
| Resume builder | `/resume` (real), `/tools/resume` (preview) | `saveResume`, `getResume`, `improveWithAI`, `deleteResume`, `duplicateResume` (`Resume.js:46,93,145,217,242`) | `Resume.js:204` |
| Interview prep | `/interview` (real quiz), `/interview/mock` (quiz UI), `/tools/interview` (preview) | `generateQuiz` (`Interview.js:25`), `submitQuiz` (:132), `getAssessments` (:224) | quiz `Interview.js:80` fast; tip `:129` write |
| Cover letter | `/cover-letter` (+ `/new`, `/[id]`), `/tools/cover-letter` | `generateCoverLetter` (`CoverLetter.js:8`), list, get, delete | `CoverLetter.js:70` |
| Cold email | `/cold-email` (+ `/new`, `/[id]`), `/tools/cold-email` | `generateColdEmail` (`ColdEmail.js:9`), list, get, delete | `ColdEmail.js:79` |
| Career roadmap | `/roadmap`, `/roadmap/[id]`, `/tools/roadmap` | `generateCareerRoadmap` (`CareerRoadmap.js:9`), `completeRoadmapStep` (:220), others | `:114` structured, `:316` text |
| Resume parser / ATS | `/resume-parser` (real), `/tools/ats` | `createATSAnalysis` (`ResumeParser.js:12`), list, get, delete, analytics | `ResumeParser.js:163` fast, PDF inline |
| Dashboard | `/dashboard` (real, `DashboardView.jsx`) | `getDashboardData` (`Dashboard.js:12`) | none |
| Chat with Pip | `/chat`, `ChatSlideOver` | `POST /api/chat` (`route.js:25`): Clerk, zod, SSE | `route.js:64` structured, read-only |
| Onboarding | `/onboarding` | `updateUser`, `getUserOnboardingStatus` (`User.js:8,70`) | none |
| Industry insights | none | none | none. Zeroed rows only (`User.js:21-44`) |
| Landing, auth | `/`, `/sign-in`, `/sign-up` | Clerk | none |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId, email (@unique), industry, bio, experience, skills[]. Has many Assessment, QuizSession, CoverLetter, CareerPath, ATSScore, ColdEmail; one Resume.
- `Assessment` (:41): quizScore, category, questions Json, improvementTip. Belongs to User.
- `QuizSession` (:381, new): userId, questions Json (holds correctAnswer), submittedAt. Never deleted.
- `Resume` (:55, one per user): content, contactInfo Json, summary, skills, experience/education/projects Json[]. `ResumeTemplate` (:89, usageCount). `ResumeVersion` (:129) is written by `duplicateResume` (`Resume.js:260`) and never read.
- `CoverLetter` (:146), `ColdEmail` (:351): content, companyName, jobTitle, status. Belong to User.
- `CareerPath` (:161): steps, milestones, resources, timeline (Json), progress, currentStep.
- `ATSScore` (:322): atsScore, matchPercentage, strengths, weaknesses, improvements, missingSkills, recommendations Json[], finalSummary, jobTitle, companyName.
- `AiUsage` (:366): userId (no relation), task, provider, model, ok, latencyMs, errorCode, createdAt. Read by the daily cap (`limit.js:19`).
- `IndustryInsight` (:293): industry (unique), growthRate, demandLevel, topSkills, salaryRanges, jobAvailability, hiringTrends, nextUpdate. Holds zeros only.
- Unused: `MockInterview` (:206), `SkillGapAnalysis` (:179), `PracticeSession` (:237), `CareerGoal` (:262).

## 5. How AI is called now
- Only path: `src/lib/ai/index.js`. `runAI` (:47) checks the daily cap when `userId` is set (:56), walks the `AI_ROUTE_<TASK>` list, rotates keys, cools a rate-limited key 60 s (`keys.js:43`), and times out at 90 s (:7).
- Tasks (`tasks.js:3-4`): `fast` temp 0, `write` temp 0.4; call sites override temp. Only provider: google. Every attempt writes AiUsage fire and forget (`log.js:7-17`).
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:204` improveWithAI | write 0.7, 300 tok | none. Regex strips `^\d+:` (:210) |
| `CoverLetter.js:70` | write | none, raw text saved |
| `ColdEmail.js:79` | write | none, raw text saved. User email in prompt (:33) |
| `Interview.js:80` generateQuiz | fast 0.3 | zod quizSchema (min 10), drops bad answers (:87), accepts 5+ (:89) |
| `Interview.js:129` tip (in submitQuiz) | write | none. Failure does not fail the submit |
| `CareerRoadmap.js:114` | write | zod roadmapSchema |
| `CareerRoadmap.js:316` progress tips | write | none |
| `ResumeParser.js:163` ATS | fast, PDF inline | zod atsSchema |
| `route.js:64` chat | write 0.2 | zod chatOutputSchema; cards resolved server-side (`chatContext.js:150`) |

## 6. Env vars (names only, from `.env.example`)
- DB: `DATABASE_URL`, `DATABASE_URL_DOCKER`. Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, sign-in and sign-up URLs.
- AI: `GEMINI_API_KEYS` or `GEMINI_API_KEY` (`keys.js:5`). `AI_ROUTE_FAST`, `AI_ROUTE_WRITE`. `AI_DEBUG` (non-prod only). `AI_DAILY_LIMIT` (new; blank in `.env.example:20`, so no cap).

## 7. Build and run
- `npm install`, `npm run dev`, `npm run build`, `npm start`, `npm run lint`. Local DB: `npx prisma migrate dev`. Docker: `docker compose up --build -d`, port 3000, runs `migrate deploy` on start.

## 8. Top problems (open, ranked)
1. HIGH: AI spend has no ceiling by default. `AI_DAILY_LIMIT` is blank (`.env.example:20`), and the cap fails open until the AiUsage migration is applied (`limit.js:21-26`).
2. MED: Unvalidated PDF upload. `createATSAnalysis` checks only that a PDF is present (`ResumeParser.js:39-41`), with no type or size check. The inline PDF goes to Gemini (:169). Only the 10mb body cap applies.
3. MED: Placeholder and empty emails collide with `@unique` on User.email: `ResumeParser.js:24,31` (`${userId}@placeholder.com`), `User.js:86` (`""`).
4. MED: `updateUser` writes skills, experience and bio without zod (`User.js:52-55`).
5. MED: Template usage inflates. `Resume.js:76` increments usageCount on every save, and sort order depends on it (:133).
6. LOW: Quiz sessions pile up. QuizSession rows are never deleted, and unsubmitted rows keep correctAnswer (`Interview.js:91`).
7. LOW: Six `/tools/*` pages still run on `mock.ts` (e.g. `tools/roadmap/page.jsx:6`). They are labelled as previews (`tools/layout.jsx:27`).
8. LOW: `updateRoadmapProgress` ignores its `progress` argument (`CareerRoadmap.js:186`). Empty steps give NaN (:205).
9. LOW: Dead exports. `getLatestQuiz` (`Interview.js:251`) has no callers. `saveQuizResult` (:220) throws. `updateATSScore` (`ResumeParser.js:346`) has no UI caller.
10. LOW: Landing FAQ promises weekly insight updates and names "Sensai" (`faqs.js:5,13-15`). No code updates insights.
11. LOW: Concurrent submits both spend a tip call before one loses the claim (`Interview.js:132-147`).
12. LOW: Error pages. `(main)/error.jsx` covers only the shell. No root `error.jsx` or `not-found`.
13. LOW: Sample data on public pages. "Aarav Sharma" is the default in `ResumePaperDoc.jsx:8-10`, used on the landing page (`src/app/page.js:253`) with no sample label.
14. LOW: Dead files and deps. `components/SideBar.jsx`, `components/Header.jsx`, `lib/checkUser.js`. Unused deps: `@react-pdf/renderer`, `@tabler/core`, `html2pdf.js`, `openai`, `react-markdown`, `resend`, `@upstash/qstash`, `@clerk/themes`.

## 9. Frontend notes
- Routing: `(main)` shell, `(gated)` onboarding gate. Middleware protects `/chat`, `/tools` and feature paths (`middleware.js:12-14`).
- Sidebar main nav uses real routes (`AppSidebar.jsx:34-46`); its Previews group points to `/tools/*` (:50-55). Footer uses real routes (`Footer.jsx:30-35`).
- Dashboard is real, with empty states. `dashboard/page.jsx:9-17` shows an error banner when the action throws. Ask-pip sends its text, and chat queues it while a request is in flight (`ChatSlideOver.jsx:160-167`).
- State is local `useState`. `loading.jsx` only at root and `(main)`. No skeletons on dashboard or list pages.

## 10. Backend notes
- Every feature is a `"use server"` action that calls `auth()` and scopes by `user.id`. Dashboard and quiz actions return `{error, code}` for expected failures and throw only "Unauthorized". Resume, cover letter and others still throw.
- Quiz claim and Assessment insert share one `$transaction` (`Interview.js:172`). Score is computed on the server; correct answers stay out of the browser until submit.
- Only API route: `/api/chat` (Clerk, zod, SSE, terminal `error` event with code). AI runs synchronously. No queue, jobs, or pagination.

## 11. Phase 3 inputs
**Citations (D8).** Where evidence can attach:
- Resume `improveWithAI` (`Resume.js:145`): input is one free-text field plus `type`. The prompt uses only `user.industry`; `industryInsight` is loaded (:153) but unused. No Resume JSON is read. Output is plain text into a textarea (`AITextarea.jsx:33`, `EntryForm.jsx:91`). Attach: return `{text, sourceIds}`.
- CoverLetter (`CoverLetter.js:8-70`): profile (industry, experience, skills, bio, :24-27) and the form's job description (:30). Output is markdown in the MDEditor preview (`CoverLetterPreview.jsx`). Attach: a `sources Json` column, or footnote chips.
- ColdEmail (`ColdEmail.js:9-79`): profile including email (:33), company, title. Markdown preview (`ColdEmailPreview.jsx`). Attach: `sources Json`.
- ATS (`ResumeParser.js:12-163`): inline PDF plus JD (:62). strengths, weaknesses and recommendations are plain strings in `atsSchema`, shown as lists (`ResumeParserForm.jsx:262-270`). Attach: `{text, evidence}` items. `ATSScore.recommendations` is already Json[].
- CareerRoadmap (`CareerRoadmap.js:9-114`): currentRole, targetRole, industry, skills (:15). Steps carry a numeric `id` in `CareerPath.steps` Json. Resources are strings. Attach: `sourceSkill` on steps, URLs on resources.
- Stable ids: Resume JSON has none. Entries (`schema.js:37-44`) are title, organization, dates, `current`, and one description blob. Builder keys are array indexes (`EntryForm.jsx:110`). Add an `id` per entry and per bullet inside the existing Json arrays (no migration).
- Reuse pattern: chat resolves cards by id from a server index (`chatContext.js:150`). Chat renders plain text (`ChatMessage.jsx:50`).

**Industry insights (D9).**
- `IndustryInsight` (`schema.prisma:293`) has no source field and no generator. Other columns: salaryRanges, demandLevel, topSkills, marketOutlook, keyTrends, recommendedSkills, jobAvailability, hiringTrends, hybridWorkTrends, lastUpdated.
- Rows are created in onboarding with zeros and nextUpdate one year out (`User.js:21-44`). The only reader is an unused include (`Resume.js:153`).
- Could show: a dashboard industry card (`DashboardView.jsx`) or a new insights page. No component exists. Needs a `runAIStructured` writer plus a sources column.
- FAQ (`faqs.js:13-15`) promises weekly updates with salary, skills and growth data. Either build it or change the copy.

**/tools/* parity (D17).** Missing feature: backend need, size.
- Resume (`tools/resume/page.jsx`): per-job tailoring with match % needs a new action (L). Bullet accept/strike is UI-only (S), or M if saved. Per-bullet footnotes need citations (L). Version switch: ResumeVersion is never read, so a read action (S). Paper view is UI-only (S), but its data is sample.
- ATS (`tools/ats/page.jsx`): requirement checklist needs `requirements[]` in atsSchema (M). 1-click fix that rewrites and re-scores needs a new action and UI for `updateATSScore` (L).
- Cover letter (`tools/cover-letter/page.jsx`): tone switch needs a tone param in generation (S backend, S UI). "Make shorter" is a rewrite action (S).
- Cold email (`tools/cold-email/page.jsx`): follow-up days, mailto and live word cap are UI-only (S each). Storing follow-up days or recipient needs a field (S). The under-120 rule should move into the prompt (S).
- Interview (`tools/interview/page.jsx`): 120 s timer is UI-only (S). Voice answers are browser speech UI (S), or server transcription (M). Open-ended questions with a clarity, depth and evidence rubric need a generator, scorer and storage (L).
- Roadmap (`tools/roadmap/page.jsx`): weekly grouped checklist needs `weeks[]` in roadmapSchema, stored in timeline Json (M), or derived in UI (S). Gap ranking by frequency needs job targets (D18, M). Task toggles exist via `completeRoadmapStep` (UI, S).

**Leftovers.**
- QuizSession rows are never deleted. Pruning unsubmitted rows older than N days inside `generateQuiz` is S. No job runner exists for a cron.
- Remove `getLatestQuiz` (`Interview.js:251`) and the `saveQuizResult` stub (:220) (S).
- Remove unused models (MockInterview, SkillGapAnalysis, PracticeSession, CareerGoal; M with migration) and the unused deps in §8 item 14. `ResumeVersion` is write-only.
- Docker: the Dockerfile has no ARG at all, so no Clerk build ARG exists. Confirm whether `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is needed at build time.
- Open from REVIEW.md: QuizSession cleanup (#6), landing sample label (#7), double tip call (nit).
