# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-0-understand`. Read-only. Paths are repo-relative. Env values were never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript (no TS in app code). `next.config.mjs`: `output: "standalone"`, server action body limit 10mb (:15).
- React 19.1.0, Tailwind ^4, Radix/shadcn primitives (`src/components/ui`), framer-motion + motion, lucide and tabler icons, recharts, tsparticles, sonner toasts, next-themes.
- Forms: react-hook-form + zod ^4 (client only, see `src/app/lib/schema.js`).
- Auth: Clerk `@clerk/nextjs` ^6.31.10. Middleware `src/middleware.js`. Server code uses `auth()` / `currentUser()`.
- DB: PostgreSQL via Prisma ^6.16.2. Schema `prisma/schema.prisma`, 6 migrations (no pgvector anywhere).
- AI: `@google/genai` ^1.18.0, model `gemini-2.5-flash` everywhere. LangChain/LangGraph (BUILD_PLAN) NOT installed. `openai` ^6.2.0 installed but unused.
- Background jobs: none. `@upstash/qstash` and `resend` installed, unused.
- Docker: multi-stage `Dockerfile` (node:20 deps, node:18 builder/runner), `docker-compose.yml`.
- Tests: none. No `test` script (README and TESTING.md mention `npm run test`).

## 2. Folder map
- `src/app/(auth)/` Clerk sign-in and sign-up pages.
- `src/app/(main)/` app pages (dashboard, onboarding, resume, resume-parser, interview, cover-letter, cold-email, roadmap). `layout.jsx` renders `AppSidebar`.
- `src/app/(main)/tools/` six demo pages that run on mock data (ats, cold-email, cover-letter, interview, resume, roadmap).
- `src/app/api/chat/route.js` only API route (SSE, mock). `src/app/chat/page.jsx` Pip chat page.
- `src/app/page.js` landing page (client). `src/app/lib/` zod form schemas and a markdown helper.
- `src/actions/` "use server" modules: User, Resume, ResumeParser, Interview, CoverLetter, ColdEmail, CareerRoadmap. All DB and AI work for features lives here.
- `src/services/AiServices.js` Gemini wrapper plus ~10 prompt builders (mostly dead).
- `src/lib/` `prisma.js` (client singleton), `checkUser.js` (unused), `mock.ts` (fake data), `utils.js`.
- `src/components/` `ui/` primitives, `shared/` AppSidebar and ResumePaperDoc, `chat/` slide-over and tool cards, `pixel/` Pip scene, `landingPage/` marketing, `SideBar.jsx` and `Header.jsx` (unused).
- `src/hooks/` `use-fetch.js`, `use-speech-to-text.js`. `src/data/` static landing content.
- `prisma/` schema and migrations. `seeder/` `seed.js`, `seedTemplates.js` (manual run, no script).
- `scripts/` CDP screenshot tools (target `localhost:3001`).
- `design/ascendai-pixel.html` visual reference. `docs/ai/` planning docs. `.claude/agents/` subagent prompts. `public/pip/` mascot SVGs.

## 3. Features
| Feature | Page(s) | Server action / API | AI call |
|---|---|---|---|
| Resume builder | `/resume` (real), `/tools/resume` (mock) | `saveResume`, `getResume`, `improveWithAI`, `deleteResume`, `duplicateResume` (`src/actions/Resume.js:47,93,145,230,255`) | `Resume.js:204` |
| Interview prep | `/interview`, `/interview/mock`, `/tools/interview` (mock) | `generateQuiz`, `saveQuizResult`, `getAssessments`, `getLatestQuiz` (`src/actions/Interview.js:43,139,188,215`) | `Interview.js:101`; tip via `AiServices.js:178` (`Interview.js:164`) |
| Cover letter | `/cover-letter` (+ `/new`, `/[id]`), `/tools/cover-letter` (mock) | `generateCoverLetter`, `getCoverLetters`, `getCoverLetter`, `deleteCoverLetter` (`src/actions/CoverLetter.js:12,101,121,139`) | `CoverLetter.js:74` |
| Cold email | `/cold-email` (+ `/new`, `/[id]`), `/tools/cold-email` (mock, uses mailto) | `generateColdEmail`, `getColdEmails`, `getColdEmail`, `deleteColdEmail` (`src/actions/ColdEmail.js:11,109,129,147`) | `ColdEmail.js:81` |
| Career roadmap | `/roadmap`, `/roadmap/[id]`, `/tools/roadmap` (mock) | `generateCareerRoadmap`, `getCareerRoadmaps`, `getCareerRoadmap`, `updateRoadmapProgress`, `completeRoadmapStep`, `deleteCareerRoadmap`, `generateProgressRecommendations` (`src/actions/CareerRoadmap.js:35,196,216,234,268,307,325`) | `CareerRoadmap.js:140`; progress via `AiServices.js:661` |
| Resume parser / ATS | `/resume-parser` (real), `/tools/ats` (mock) | `createATSAnalysis`, `getUserATSScores`, `getATSScoreById`, `deleteATSScore`, `getATSAnalytics`, `updateATSScore` (`src/actions/ResumeParser.js:14,244,276,302,334,379`) | `ResumeParser.js:180` (PDF inline) |
| Onboarding and profile | `/onboarding` | `updateUser`, `getUserOnboardingStatus` (`src/actions/User.js:7,69`) | none |
| Dashboard | `/dashboard` | none. `DashboardView.jsx` is entirely mock (`:10-13,34`) | none |
| Chat with Pip | `/chat`, `ChatSlideOver` | `POST /api/chat` (`src/app/api/chat/route.js:6`), keyword-routed mock | none |
| Industry insights | no page | none. Placeholder row created by `User.js:26-43`. Generator `AiServices.js:223` has 0 callers | none |
| Landing, auth | `/`, `/sign-in`, `/sign-up` | Clerk | none |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId unique, email unique, industry to IndustryInsight, bio, experience, skills[]. Has many Assessment, CoverLetter, CareerPath, ATSScore, ColdEmail. One Resume.
- `Assessment` (:40): quiz result (quizScore, questions Json[], improvementTip). Belongs to User.
- `Resume` (:54): one per User (`userId` unique). content, template ref, contact/experience/education/projects JSON, atsScore. Has ResumeVersion[].
- `ResumeTemplate` (:88): templateKey unique, html/css, usageCount. Seeded by `seeder/`. `ResumeVersion` (:128) is unused.
- `CoverLetter` (:145) and `ColdEmail` (:350): content, companyName, jobTitle, jobDescription, status.
- `CareerPath` (:160): currentRole, targetRole, steps, milestones, resources, timeline (Json), progress, currentStep.
- `SkillGapAnalysis` (:178), `MockInterview` (:205), `PracticeSession` (:236), `CareerGoal` (:261): defined, no code uses them.
- `IndustryInsight` (:292): industry unique. Rows are created with placeholder zeros (`User.js:26-43`).
- `ATSScore` (:321): atsScore, strengths/weaknesses/improvements, finalSummary, jobTitle, companyName, jobDescription.
- Missing per docs: `AiUsage`, `UserApiKey`, embeddings or pgvector.

## 5. How AI is called now (all Gemini, `gemini-2.5-flash`)
| Call site | Purpose | Output validation |
|---|---|---|
| `src/services/AiServices.js:3` client, `:65-101` `generateContent` | shared wrapper, in-memory 30/min limit (`:22-31`) | none on raw text |
| `src/actions/Resume.js:8` client, `:204` | `improveWithAI` (summary, skills, bullets) | none; regex strips `^\d+:` (`:223`) |
| `src/actions/ColdEmail.js:9`, `:81` | cold email text | none, raw text saved |
| `src/actions/CoverLetter.js:8`, `:74` | cover letter markdown | none, raw text saved |
| `src/actions/CareerRoadmap.js:9`, `:140` | roadmap JSON | JSON clean, checks `steps` array only (`:162`) |
| `src/actions/Interview.js:10`, `:101` | 10-question quiz JSON | JSON clean, array check, slices to 10 (`:121-129`) |
| `src/actions/ResumeParser.js:10`, `:180` | ATS JSON from PDF | parse plus `atsScore` truthy check (`:207`) |
| `AiServices.js:178` (quiz tip), `:661` (progress) | short text | returns null or fallback |
- Dead in AiServices: generateQuiz, generateCoverLetter, generateIndustryInsights, improveResumeContent, generateCareerRoadmap, generateSkillRecommendations, resumeParser (`:735`, passes an object where a string is expected), generateColdEmail.
- Seven separate `GoogleGenAI` clients. No `runAI`, no retry or fallback, no usage logging, no zod on any AI output.

## 6. Env vars (names only)
- `GEMINI_API_KEY`: 7 references (`AiServices.js:4` and every action client).
- `DATABASE_URL`: `prisma/schema.prisma` datasource. `DATABASE_URL_DOCKER`: `docker-compose.yml:14`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: Clerk, named in README only.
- `NODE_ENV`: `src/lib/prisma.js:5`.
- A root `.env` exists (gitignored). No `.env.example`. Vars planned in AI-PROVIDERS.md are absent.

## 7. Build and run
- `npm install`, `npm run dev` (next dev --turbopack), `npm run build`, `npm start`, `npm run lint`.
- Prisma: `npx prisma migrate dev` and `npx prisma generate` are not in scripts. Seeds run by hand.
- Docker: `docker compose up --build -d`. Broken as-is: compose maps `3001:3001` (`docker-compose.yml:10`) but the container listens on 3000 (`Dockerfile:50`). No `prisma migrate deploy`. `.dockerignore` (`:12-15`) omits `.env`, and `COPY . .` (`Dockerfile:13`) copies it into the builder stage.

## 8. Uncommitted work (22 entries in git status)
- Modified: landing (`src/app/page.js`, `layout.js`, `globals.css`), `Header.jsx`, `Footer.jsx`, `dashboard/page.jsx` and `DashboardView.jsx` (now mock), `(main)/layout.jsx` (old SideNavbar and onboarding gate removed), `resume/page.jsx`, `src/middleware.js`.
- Middleware diff removes protection for `/dashboard`, `/resume`, `/interview`, `/cover-letter`, `/roadmap`, `/resume-parser`. Only `/onboarding` is protected now (`src/middleware.js:4-7`).
- Untracked: `src/app/api/chat` (mock SSE), `src/app/chat`, `src/components/chat`, `src/components/pixel`, `src/components/shared` (AppSidebar), `src/app/(main)/tools` (6 mock pages), `src/lib/mock.ts` (320 lines, fake profile "Aarav Sharma", Indian tech companies), plus `design/`, `docs/`, `.claude/`, `public/pip/`, `scripts/`.
- Net effect: the new shell and the dashboard are mock. `AppSidebar.jsx:41-46` links to the `/tools/*` mocks, not the real routes.

## 9. Top problems (ranked)
1. HIGH: Auth gap. Middleware no longer guards dashboard, resume, interview, cover-letter, roadmap, or resume-parser (`src/middleware.js:4-7`, uncommitted). `(main)/layout.jsx:1-16` has no gate. `dashboard/page.jsx:5-12` hides errors. Data actions still check `auth()`, but shells render for signed-out users.
2. HIGH: `/api/chat` has no auth and no input validation (`src/app/api/chat/route.js:6-8`). It returns hard-coded claims such as "kredx" and "78/100 for zomato" (`:48`, `:120`), which breaks the "nothing invented" rule.
3. HIGH: Privacy. `ResumeParser.js:186` logs the full AI output (resume contents) and `:190` logs a snippet. Similar raw logs: `Interview.js:115`, `CareerRoadmap.js:157`, `AiServices.js:13` (`DEBUG_MODE = true`).
4. HIGH: Fabricated data presented as real. `DashboardView.jsx:10-13,34,39`, six `tools/*` pages, `mock.ts:141-142`, `tools/ats/page.jsx:21,24`, `tools/cold-email/page.jsx:21-23`.
5. HIGH: Trusted client input. `saveQuizResult` accepts questions (with correctAnswer), answers and score from the client (`Interview.js:139,149-155,174`). Scores can be forged.
6. MED: No zod on server actions (`Resume.js:47`, `User.js:7`, `ResumeParser.js:14`, `CareerRoadmap.js:35`). `updateUser` writes skills and experience unchecked.
7. MED: Seven Gemini clients and no central `runAI`. Rate limit only in AiServices (`:22-31`). Duplicate JSON helpers (`Interview.js:12-41` vs `AiServices.js:34-60`).
8. MED: ATS save bugs. `ResumeParser.js:207` treats atsScore 0 as failure. `:234` revalidates `/ats-scores`, which does not exist. `:26,33` writes placeholder emails `${userId}@placeholder.com`.
9. MED: `User.js:85` creates users with `email: ""` fallback, but `User.email` is `@unique` (`prisma/schema.prisma:14`). A second such user will fail.
10. MED: Docker: port mismatch (`docker-compose.yml:10` vs `Dockerfile:50`), no migrate step, `.env` not excluded (`.dockerignore`, `Dockerfile:13`).
11. MED: No `error.jsx` anywhere, so server errors fall to default error pages. `loading.jsx` only at root and `(main)`.
12. MED: Template usage inflation. `Resume.js:73-83` increments `usageCount` on every save, and that count drives sort order (`:132-135`).
13. LOW: `CareerRoadmap.js:234` ignores its `progress` argument. `:253` gives NaN for empty steps. `stepId` is unbounded.
14. LOW: `Resume.js:223` regex deletes leading "N:" from user text. `Interview.js:60` assumes `skills` is an array.
15. LOW: `CoverLetter.js:94-97` rethrows raw errors to the client. `ColdEmail.js:35` sends the user's email to the LLM.
16. LOW: Dead code: 8 AiServices methods, `checkUser.js`, `SideBar.jsx`, `Header.jsx`, `FeatureSections.jsx`, `EditorialContentGrid.jsx`, `ui/lamp.jsx`, `data/featureCard.js`, `data/howitWorks.js`, 4 unused models. Unused deps: qstash, resend, openai, @react-pdf/renderer, html2pdf.js, react-markdown.
17. LOW: No tests and no test script.
18. LOW: Slow spots. Chat route sleeps 350+400+400 ms (`route.js:27,35,44`). Quiz save runs the tip call before the write (`Interview.js:164`). PDFs go inline as base64 on every ATS call. List actions have no pagination.

## 10. Frontend notes
- Root `src/app/layout.js`: ClerkProvider, ThemeProvider (light default), Toaster. `(main)/layout.jsx` renders AppSidebar plus `<main>`.
- Client-heavy: DashboardView, ChatSlideOver, all `tools/*`, landing. Actions are called straight from client components with try/catch and sonner toasts.
- State is local `useState` only. No global store. Hooks: `use-fetch.js`, `use-speech-to-text.js`.
- Missing: `error.jsx`, `not-found`, most per-route loading states. Hard-coded colors in `(main)/layout.jsx` bypass theme tokens.
- Two UI generations coexist: old `SideBar.jsx` and `Header.jsx` (unused), new `AppSidebar`.

## 11. Backend notes
- Pattern: `"use server"` actions. Each calls `auth()`, looks up the user by `clerkUserId`, and scopes queries by `user.id`. Read, update and delete on CareerRoadmap, CoverLetter and ColdEmail are scoped (e.g. `CareerRoadmap.js:245`).
- Error styles differ: some throw "Unauthorized", some return `{success,message}` (`ResumeParser.js:236-239`), some return null (`Resume.js:96,124`).
- Only one API route (`/api/chat`), unauthenticated. Middleware matches `/api` but applies no rule to it.
- DB: single Prisma client. One transaction (`User.js:18`). No pagination.
- No background jobs. AI runs synchronously inside requests. No queue.
- Rate limiting is in-memory and per process.
