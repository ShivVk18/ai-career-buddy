# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-2` (after Phase 1: 206ea41..c3be81b). Read-only. Paths are repo-relative. Env values were never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript. `next.config.mjs`: `output: "standalone"`, server action body limit 10mb (:15).
- React 19.1.0, Tailwind ^4, Radix/shadcn (`src/components/ui`), framer-motion, recharts, sonner, next-themes.
- Forms: react-hook-form + zod ^4 on the client (`src/app/lib/schema.js`). Server zod only for AI output (`src/lib/ai/schemas.js`).
- Auth: Clerk `@clerk/nextjs` ^6.31.10. `src/middleware.js` (protected list :4-15). Server code uses `auth()`.
- DB: PostgreSQL, Prisma ^6.16.2, 7 migrations. Newest `20261117000000_ai_usage` is not applied yet.
- AI: `@langchain/core` ^1.4.1 and `@langchain/google-genai` ^2.3.6, wrapped in `src/lib/ai/`. `@google/genai` is gone. `openai` ^6.2.0 is installed but unused.
- Background jobs: none (`@upstash/qstash`, `resend` unused). Tests: `npm run test:ai` is a live smoke test (`scripts/test-ai-providers.js`); no unit tests.
- Docker: multi-stage `Dockerfile` (node:20 deps and builder, node:20 runner). Container runs `prisma migrate deploy` then `server.js` (:57).

## 2. Folder map
- `src/app/(auth)/` Clerk sign-in and sign-up.
- `src/app/(main)/` shell: `layout.jsx` (AppSidebar + main), `error.jsx` (Pip error boundary), `loading.jsx`, `onboarding/` (outside the gate).
- `src/app/(main)/(gated)/` all feature pages. `layout.jsx:13` is the onboarding gate. Includes `tools/` (6 mock pages).
- `src/app/api/chat/route.js` the only API route (SSE, mock). `src/app/chat/page.jsx` Pip chat, not gated. `src/app/page.js` landing.
- `src/actions/` "use server" modules: User, Resume, ResumeParser, Interview, CoverLetter, ColdEmail, CareerRoadmap.
- `src/lib/ai/` AI layer: `index.js` (runAI, runAIText, runAIStructured), `tasks.js` (routes), `providers.js`, `keys.js` (key rotation), `log.js` (AiUsage and redacted logs), `schemas.js`.
- `src/lib/` `prisma.js` (client), `utils.js` (`safeErr`), `mock.ts` (fake data), `checkUser.js` (unused).
- `src/components/` `shared/` (AppSidebar, ResumePaperDoc), `chat/` (ChatSlideOver, ChatMessage, ToolResultCard), `pixel/` (Pip scene), `ui/`, `landingPage/`. `SideBar.jsx` and `Header.jsx` are unused.
- `prisma/` schema and migrations. `seeder/` manual seeds. `scripts/` CDP screenshots and `test-ai-providers.js`.
- `docs/ai/` plans. `design/` pixel HTML reference. `.claude/agents/` subagent prompts. `.env.example` template. `src/services/AiServices.js` was deleted in Phase 1.

## 3. Features
| Feature | Page(s) | Server action / API | AI call |
|---|---|---|---|
| Resume builder | `/resume` (real), `/tools/resume` (mock) | `saveResume`, `getResume`, `improveWithAI`, `deleteResume`, `duplicateResume` (`src/actions/Resume.js:46,93,145,217,242`) | `Resume.js:204` write |
| Interview prep | `/interview`, `/interview/mock`, `/tools/interview` (mock) | `generateQuiz`, `saveQuizResult`, `getAssessments`, `getLatestQuiz` (`src/actions/Interview.js:9,101,150,177`) | quiz `Interview.js:66` fast; tip `:98` write |
| Cover letter | `/cover-letter` (+ `/new`, `/[id]`), `/tools/cover-letter` (mock) | `generateCoverLetter`, `getCoverLetters`, `getCoverLetter`, `deleteCoverLetter` (`CoverLetter.js:8,90,110,128`) | `CoverLetter.js:70` write |
| Cold email | `/cold-email` (+ `/new`, `/[id]`), `/tools/cold-email` (mock) | `generateColdEmail`, `getColdEmails`, `getColdEmail`, `deleteColdEmail` (`ColdEmail.js:9,99,119,137`) | `ColdEmail.js:79` write |
| Career roadmap | `/roadmap`, `/roadmap/[id]`, `/tools/roadmap` (mock) | `generateCareerRoadmap`, `getCareerRoadmaps`, `getCareerRoadmap`, `updateRoadmapProgress`, `completeRoadmapStep`, `deleteCareerRoadmap`, `generateProgressRecommendations` (`CareerRoadmap.js:9,148,168,186,220,259,277`) | `:114` structured write; `:316` text write |
| Resume parser / ATS | `/resume-parser` (real), `/tools/ats` (mock) | `createATSAnalysis`, `getUserATSScores`, `getATSScoreById`, `deleteATSScore`, `getATSAnalytics`, `updateATSScore` (`ResumeParser.js:12,211,243,269,301,346`) | `ResumeParser.js:163` fast, PDF inline |
| Onboarding | `/onboarding` | `updateUser`, `getUserOnboardingStatus` (`User.js:8,70`) | none |
| Dashboard | `/dashboard` | none (`DashboardView.jsx` is mock) | none |
| Chat with Pip | `/chat`, `ChatSlideOver` | `POST /api/chat` (`route.js:12`): Clerk auth, zod body, keyword-routed mock | none |
| Industry insights | none | none. Placeholder row only (`User.js:21-44`) | none |
| Landing, auth | `/`, `/sign-in`, `/sign-up` | Clerk | none |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId, email (@unique, :14), industry, bio, experience, skills[]. Has many Assessment, CoverLetter, CareerPath, ATSScore, ColdEmail. One Resume. Industry links to IndustryInsight.
- `Assessment`: quizScore, questions Json, improvementTip. Belongs to User.
- `Resume` (one per user), `ResumeTemplate` (usageCount), `ResumeVersion` (unused).
- `CoverLetter`, `ColdEmail`: content, companyName, jobTitle, status. Belong to User.
- `CareerPath`: steps, milestones, resources, timeline (Json), progress, currentStep. Belongs to User.
- `ATSScore`: atsScore, strengths, weaknesses, improvements, finalSummary, jobTitle, companyName. Belongs to User.
- `IndustryInsight`: industry unique. Rows hold placeholder zeros.
- `AiUsage` (new, not applied): userId (no relation), task, provider, model, ok, latencyMs, errorCode, createdAt. Indexes on userId and createdAt.
- Unused: SkillGapAnalysis, MockInterview, PracticeSession, CareerGoal.

## 5. How AI is called now
- Only path: `src/lib/ai/index.js`. `runAI` (:46) walks the `AI_ROUTE_<TASK>` list, rotates keys, cools a rate-limited key for 60 s (`keys.js:43`), and times out at 90 s (:6).
- Tasks (`tasks.js:3-4`): `fast` temp 0, `write` temp 0.4. Only provider: google.
- `runAIStructured` (:140) validates with zod and retries once on bad JSON. `runAIText` (:125) returns trimmed text.
- Every attempt logs metadata and writes AiUsage fire and forget (`log.js:7-18`). Content is logged only with `AI_DEBUG=1` outside production (`log.js:5,21`).
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:204` improveWithAI | write, 0.7, 300 tokens | none. Regex strips `^\d+:` (:216) |
| `CoverLetter.js:70` | write | none, raw text saved |
| `ColdEmail.js:79` | write | none, raw text saved. Sends the user's email to the model (:33) |
| `Interview.js:66` generateQuiz | fast, 0.3 | zod quizSchema (min 10 questions) |
| `Interview.js:98` tip (via :126) | write | none |
| `CareerRoadmap.js:114` | write | zod roadmapSchema |
| `CareerRoadmap.js:316` progress tips | write | none |
| `ResumeParser.js:163` ATS | fast, PDF as inline part | zod atsSchema |
- The chat route makes no AI call. No quota or per-user limit exists. AiUsage is written but never read.

## 6. Env vars (names only, from `.env.example`)
- DB: `DATABASE_URL`, `DATABASE_URL_DOCKER` (used by `docker-compose.yml:14`).
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.
- AI: `GEMINI_API_KEYS` (comma list, preferred) or `GEMINI_API_KEY` (`keys.js:5`). `AI_ROUTE_FAST`, `AI_ROUTE_WRITE` as `provider:model,...` (models live only here, `tasks.js:11`). `AI_DEBUG` (1 = log content, non-prod).
- `.env` is gitignored and excluded by `.dockerignore`. `.env.example` is allowed in.

## 7. Build and run
- `npm install`, `npm run dev` (next dev --turbopack), `npm run build`, `npm start`, `npm run lint`. `npm run test:ai` makes live calls, needs `.env`, prints ok or fail per provider, never keys.
- Local DB: `npx prisma migrate dev` (applies AiUsage). Docker runs `migrate deploy` on start. Seeds are manual. Docker: `docker compose up --build -d`, port 3000.

## 8. Top problems (open, ranked)
1. HIGH: Fabricated data shown as real. `DashboardView.jsx:34,39,119`, six `tools/*` pages (`mock.ts`), chat claims "kredx" and "78/100 zomato" (`route.js:71,143`). Breaks the "nothing invented" rule.
2. HIGH: Quiz score trusted. `saveQuizResult` takes questions, answers and score from the client (`Interview.js:101,111-117,136`). The browser computes the score (`Quiz.jsx:90-96`).
3. MED: AiUsage migration not applied. Until it is, `log.js:13-17` warns on every AI call.
4. MED: No quota or cost cap on AI. Key cooldown is per process (`keys.js`). Any signed-in user can call `/api/chat` and the AI actions without limit.
5. MED: Placeholder and empty emails collide with `@unique` (`prisma/schema.prisma:14`): `ResumeParser.js:24,31` (`${userId}@placeholder.com`), `User.js:86` (`""`).
6. MED: Unvalidated input. `createATSAnalysis` has no PDF type or size check (`ResumeParser.js:12`; only the 10mb body cap). `updateUser` writes skills and experience unchecked (`User.js:8,52-55`).
7. MED: `/chat` is outside `(gated)`, so it skips the onboarding gate (`src/app/chat/page.jsx`). `dashboard/page.jsx:9-11` swallows errors.
8. MED: Chat is slow and fake. About 1.2 s of sleeps before content (`route.js:50,58,67,113,139,169`). Keyword routing (`:61,107,133`).
9. MED: Template usage inflates. `Resume.js:76` increments usageCount on every save, and sort order depends on it (:133).
10. LOW: `updateRoadmapProgress` ignores its `progress` argument (`CareerRoadmap.js:186`). Empty steps give NaN (`:205`).
11. LOW: Dead code and deps. `checkUser.js`, `SideBar.jsx`, `Header.jsx`, unused `MOCK_ATS_REQUIREMENTS` import (`DashboardView.jsx:12`). Unused: qstash, resend, openai, react-pdf, html2pdf.js, react-markdown.
12. LOW: Error pages. `(main)/error.jsx` covers only the shell. No root `error.jsx` or `not-found`.

## 9. Frontend notes
- Routing: `(main)` shell, `(gated)` group with onboarding gate. Middleware protects `/chat`, `/tools`, and all feature paths (`middleware.js:4-15`).
- `AppSidebar.jsx` reads the Clerk user (:28). Its tool links still point to `/tools/*` (:41-46).
- State is local `useState` only; actions are called from clients with try/catch and sonner toasts. `loading.jsx` only at root and `(main)`. Hard-coded colors in `(main)/layout.jsx:5`.

## 10. Backend notes
- Every feature is a `"use server"` action. Each calls `auth()` and scopes queries by `user.id`. Error styles are mixed: some throw "Unauthorized", others return objects.
- Only API route: `/api/chat` (Clerk auth, zod body, SSE). AI runs synchronously inside actions. No queue, no jobs, no pagination.

## 11. Phase 2 inputs
**Dashboard and sidebar mock.** `DashboardView.jsx` runs on `MOCK_JOBS` (:34; pipeline list, scene and status text :46-64, :256), `MOCK_WEEKLY_ROADMAP[1].tasks` (:38-40, :337), a hard-coded "88/100" (:119), and an "Aarav" name fallback (:42).
- Jobs: no job-tracking model. Closest are ATSScore (companyName, jobTitle) and CoverLetter/ColdEmail (companyName, status). Needs a new model.
- Tasks: `getCareerRoadmaps` (`CareerRoadmap.js:148`) and `completeRoadmapStep` (:220) on CareerPath.
- Score: `getATSAnalytics` (`ResumeParser.js:301`) average. Name: Clerk `user.firstName` only. `AppSidebar` has no mock data.

**/tools/* vs real routes.** Redirecting would lose:
- resume: per-job tailoring with match %, tracked bullet accept/strike, per-bullet source footnotes, version switch, paper-doc view (`tools/resume/page.jsx`). Real `/resume` has jsPDF export but none of the rest. `resume/page.jsx:31` links to `/tools/resume`.
- ats: requirement checklist, "1-click fix" (mock). Real `/resume-parser` has real upload and a JD box. `updateATSScore` has no UI caller.
- cover-letter: tone switch and "make shorter". Real has copy only (`CoverLetterPreview.jsx:26`).
- cold-email: follow-up days and mailto. Real has copy only (`ColdEmailPreview.jsx:15`).
- interview: 120 s timer, voice answers, per-question rubric. Real `/interview` is a quiz.
- roadmap: weekly grouped checklist. Real `RoadmapDetailView` has `completeRoadmapStep` but no weekly view.

**/api/chat, ChatSlideOver, chat page.**
- Request: `POST /api/chat`, JSON `{message}` (string, max 4000, passthrough). 401 or 400 JSON before the stream.
- Response: `text/event-stream`, `data: <json>` lines. Events: `step` {step, text} (detective, thinking, wizard, headphones, coffee); `text` {content}; `tool_call` {name, status} (ignored by client); `tool_result` {tool, data}; `done`. No `error` event. Client throws only on non-2xx (`ChatSlideOver.jsx:48-88`).
- Tool cards (`ChatMessage.jsx:54-57`, `ToolResultCard.jsx:12-27`): `resume_edit` {company, role, matchRate, bullets[]}; `ats_score` {score, company, role, requirements[]}; `interview_question` {question}; `roadmap_task` {roadmap[]}. Cards link to `/tools/*`.
- Real actions the chat could call server-side (no fetch): `improveWithAI` (`Resume.js:145`) for resume_edit, `getUserATSScores` (`ResumeParser.js:211`) for ats_score, `getCareerRoadmaps` (`CareerRoadmap.js:148`) for roadmap_task, `generateCoverLetter` (`CoverLetter.js:8`) and `generateColdEmail` (`ColdEmail.js:9`). `generateQuiz` returns correctAnswer to the client, so it is not a safe source for interview cards.

**mock.ts imports.** `src/lib/mock.ts` is imported by: `api/chat/route.js:4`; `ChatSlideOver.jsx:8` (`MOCK_CHAT_PROMPTS`, used at :178); `DashboardView.jsx:10-13`; the six `tools/*/page.jsx` files (`resume:7`, `ats:6`, `cover-letter:6`, `cold-email:6`, `interview:6`, `roadmap:6`). Exports: MOCK_JOBS (:20), MOCK_PROFILE (:141), MOCK_CHAT_PROMPTS (:222), MOCK_INTERVIEW_QUESTIONS (:229), MOCK_WEEKLY_ROADMAP (:271), MOCK_ATS_REQUIREMENTS (:313).

**Quiz scoring trust.** The browser computes the score (`Quiz.jsx:90-96`). `generateQuiz` returns correctAnswer to the client (`Interview.js:71`). `saveQuizResult` (`:101`) trusts the questions, answers and score it receives. Nothing is stored server-side, so any score can be saved. Phase 2 fix: store the generated quiz server-side (or sign it) and recompute the score.

**Citations.** None in real code. "source" fields exist only as invented mock data (`route.js:92,100`; `tools/resume/page.jsx:209,219,229`). The zod schemas have no evidence field. Grounding needs an evidence id in the schema, checked against the Resume JSON ids.

**Industry insights.** No reader and no generator. `User.js:21-44` creates zeroed rows. `improveWithAI` loads `industryInsight` (`Resume.js:153`) but the prompt uses only `user.industry` (:15-16). The landing FAQ promises weekly updates (`src/data/faqs.js:15`), which the code does not do.
