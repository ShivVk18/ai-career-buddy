# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-23, branch `redesign-happy-flow` (HEAD `abf93fc`). Read-only pass. Paths are repo-relative. `.env`, `node_modules`, `.next`, `.clerk`, lockfile not read.
Untracked: `design/ascendai-happy-flow.html` (the target scenes). Also in `design/`: `ascendai-pixel.html`.

## 1. Stack
- **Framework:** Next.js ^15.5.9 App Router, JavaScript (no TS), `output: "standalone"`, Turbopack for dev and build (`next.config.mjs`). React 19.1.10.
- **Auth:** Clerk `@clerk/nextjs` ^6.31.10. Middleware `src/middleware.js:4-20` protects listed routes; `src/app/api/chat/route.js:27` calls `auth()` itself.
- **DB:** PostgreSQL via Prisma ^6.16.2. Schema `prisma/schema.prisma`, 14 migration folders in `prisma/migrations/`. Client singleton `src/lib/prisma.js`.
- **AI:** `@langchain/core` ^1.4.1 + `@langchain/google-genai` ^2.3.6. Gemini only. Layer in `src/lib/ai/` (see §5).
- **Forms and validation:** react-hook-form ^7.62 + `@hookform/resolvers`, zod ^4.1.5 (client `src/app/lib/schema.js`, server `src/lib/ai/schemas.js`).
- **Styling:** Tailwind 4 CSS-first, `@tailwindcss/postcss`, `tw-animate-css`. No `tailwind.config`. Theme tokens are `@theme inline` in `src/app/globals.css:6-60` mapped to CSS variables (`--bg`, `--panel`, `--pip`, `--lime`, `--sky-*`, ...). Dark mode via `.dark` class (`next-themes`, `src/components/Theme-Provider.jsx`).
- **Fonts:** `next/font/google` in `src/app/layout.js:2-9`: Geist (`--nf-sans`), Newsreader (`--nf-doc`, serif for documents), Pixelify Sans (`--nf-pixel`, pixel labels). Clash/General names appear in class strings but are not loaded (unverified).
- **UI kit:** Radix (`radix-ui` plus per-package deps), shadcn-style primitives in `src/components/ui/` (`components.json`), lucide-react (79 importers), `@tabler/icons-react` (2), sonner toasts (`src/components/ui/sonner.jsx`), `@uiw/react-md-editor`, recharts, `react-spinners`, `@tsparticles` (1 importer).
- **Animation:** `framer-motion` ^12 (9 importers) and `motion` ^12 (6 importers), both present. Aceternity-style components in `src/components/ui/aceternity/`. Pixel canvas scenes: `src/components/pixel/PixelScene.jsx` (9 palettes, lines 23-130). Pip avatars: `public/pip/*.svg` (6: coffee, detective, headphones, rocket, thinking, wizard).
- **Docs/PDF:** `unpdf` (PDF text, `src/lib/ai/pdf.js`), `jspdf` ^4, `html2canvas-pro`.
- **Errors:** `@sentry/nextjs` ^11.13, active only with DSN (`src/instrumentation*.js`, `src/lib/sentryScrub.js`).
- **Background jobs:** none. No Inngest, cron, queue or email provider. Every AI call runs inline in a server action (`runAI` timeout 90 s, `src/lib/ai/index.js:9`).
- **Docker and deploy:** multi-stage `Dockerfile` (node:20; runs `prisma migrate deploy` then `server.js`), `docker-compose.yml`, `vercel.json`.
- **Commands** (`package.json` scripts): `npm run dev` (next dev --turbopack), `npm run build`, `npm start`, `npm run lint` (eslint ^9), `npm test` (vitest run; 26 test files under `__tests__/`), `npm run test:ai` (live provider check, `scripts/test-ai-providers.js`).
- **Playwright:** NOT installed (no dependency, no config). `scripts/capture_via_cdp.js` drives a local Chrome over DevTools for screenshots.
- **Seed data:** no npm script. `seeder/seed.js` and `seeder/seedTemplates.js` upsert only `ResumeTemplate` rows (no npm script; run directly with node after migrations, not verified here). No demo user, jobs or applications exist; `dummy_test_data.md` is a manual test handbook.
- **Env names** (values never read): `DATABASE_URL`, Clerk keys, `GEMINI_API_KEYS` / `GEMINI_API_KEY`, `AI_ROUTE_FAST`, `AI_ROUTE_WRITE` (format `provider:model`, `src/lib/ai/tasks.js:8-26`), `AI_DAILY_LIMIT`, `AI_DEBUG`, Sentry vars. Source: `.env.example`.

## 2. Folder map
- `src/app/page.js`: public landing (241 lines). Sections in `src/components/landingPage/` (Sections, HeroWindow, SampleDemo, LandingNav, Reveal).
- `src/app/(auth)/`: Clerk `SignIn` / `SignUp` catch-all pages.
- `src/app/(main)/layout.jsx`: app shell (AppSidebar + `<main>`). `loading.jsx`, `error.jsx` at this level.
- `src/app/(main)/(gated)/`: onboarding gate `layout.jsx:5-15`. Feature routes below.
- `src/app/(main)/onboarding/`: profile setup (`OnboardingFlow.jsx`, 558 lines).
- `src/app/chat/`: full-page chat (outside gate, still in middleware list).
- `src/app/api/chat/route.js`: the only API route (SSE).
- `src/actions/`: 14 `"use server"` modules (Account, Applications, CareerRoadmap, ColdEmail, CoverLetter, Dashboard, Interview, Jobs, Onboarding, Practice, Pipeline, Resume, ResumeParser, User).
- `src/lib/ai/`: LLM layer (index, providers, keys, tasks, limit, log, action, schemas, sources, paragraphs, numberCheck, pdf, chatContext) + tests.
- `src/lib/jobs/`: intake (`classify.js`), public-page fetch with SSRF guard (`fetch.js`), chips/meta (`meta.js`), pipeline state (`pipeline.js`).
- `src/lib/applications/`: `derive.js` (next action, statuses), `needsYou.js` (derived inbox).
- `src/lib/ats/`, `src/lib/interview/` (rubric, verify, prune), `src/lib/roadmap/derive.js`, `src/lib/onboarding/chips.js`, `src/lib/profile/strength.js`, `src/lib/softDelete.js`, `src/lib/writing.js`, `src/lib/match.js`.
- `src/components/shared/`: AppSidebar, CommandMenu, EditableChips, JobStart, TrackedChanges, SourceChips, EmptyState, PageError, PageSkeleton, undoDelete, letterActions, generationError.
- `src/components/pixel/`: PixelScene, PipStatus. `src/components/chat/`: ChatSlideOver, ChatMessage, ToolResultCard.
- `src/components/ui/`: shadcn primitives plus unused extras (see §8).
- `src/hooks/`: use-speech-to-text (browser Web Speech only), use-fetch.
- `prisma/`, `seeder/`, `scripts/`, `design/`, `docs/ai/`.

## 3. Features
| Feature | Page | Server action (file:line) | AI call (file:line) |
|---|---|---|---|
| Home, paste or ask | `/dashboard` | `intakeJob` `Jobs.js:83`; `getDashboardData` `Dashboard.js:18`; `getNeedsYou` `Applications.js:53` | `Jobs.js:128` (fast) |
| Onboarding | `/onboarding` (`?edit=1`) | `parseResumeToProfile` `Onboarding.js:28`; `saveProfileChips` `:133`; `saveOnboardingAnswers` `:223`; `getProfileStrength` `:238` | `Onboarding.js:60` (write) |
| Job page and bot run | `/jobs/[id]` | `getJob` `Jobs.js:166`; `updateJobField` `:195`; `runNextStep` `Pipeline.js:158`; `getPipeline` `:219` | via steps `Pipeline.js:71-141` |
| Applications board | `/applications` | `getApplications` `Applications.js:470`; `setApplicationStatus` `:176`; `markApplied` `:214`; `closeApplication` `:389` | `createInterviewPrep` `:291` (wraps prep) |
| Needs you inbox | `/needs-you` | `getNeedsYou` `:53`; `approveNeedsYou` `:70`; `createFollowUpDraft` `:318` | none direct |
| Resume builder | `/resume` | `saveResume` `Resume.js:109`; `improveWithAI` `:223`; `tailorResume` `:676`; versions `:443-555`; `computeMatch` `:606` | `Resume.js:289` (write, text); `:770` (write, tailor) |
| ATS scan | `/resume-parser` | `createATSAnalysis` `ResumeParser.js:94`; `proposeAtsFix` `:513`; `applyAtsFix` `:636` | `scoreResume` `lib/ats/score.js:192` (fast); `ResumeParser.js:584` (write) |
| Interview MCQ | `/interview`, `/interview/mock` | `generateQuiz` `Interview.js:28`; `submitQuiz` `:144` | `Interview.js:87` (fast); tip `:140` (write, text) |
| Interview practice | `/interview/practice[/sessionId]` | `generateOpenQuestions` `Practice.js:96`; `scoreOpenAnswer` `:247`; `getOpenSession` `:348`; `getWeakAreas` `:419` | `Practice.js:137` (write); rubric `:304` (fast) |
| Cover letter | `/cover-letter[/new,/id]` | `generateCoverLetter` `CoverLetter.js:116`; `shortenCoverLetter` `:360`; `regenerateCoverLetter` `:303`; `undoLetterChange` `:464` | `paragraphs.js:78` via `:147,:330`; `CoverLetter.js:411` (write) |
| Cold email | `/cold-email[/new,/id]` | `generateColdEmail` `ColdEmail.js:78`; `updateColdEmail` `:316`; `setColdEmailFollowUp` `:382` | `paragraphs.js:78` via `ColdEmail.js:170` |
| Career roadmap | `/roadmap[/id]` | `generateCareerRoadmap` `CareerRoadmap.js:25`; `setRoadmapStepDone` `:445`; `getStepTargets` `:514` | `CareerRoadmap.js:158` (write); progress text `:422` (write, text) |
| Chat with Pip | `/chat`, slide-over (`AppSidebar`) | POST `/api/chat` `route.js:25` | `route.js:64` (write, temp 0.2) |
| Settings, delete data | `/settings` | `deleteAllMyData` `Account.js:61`; `deleteAccount` `:82` | none |
| Command menu | ⌘K / Ctrl-K `CommandMenu.jsx:53` | reads `getApplications` | none |
| Six tools | sidebar `AppSidebar.jsx:64-69`; `/tools/*` redirects `next.config.mjs:18-27` | | |
Removed: industry insights (migration `20261117060000`). Not built: notifications, email, background runs, offer comparison, negotiation draft.

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId unique, email, industry, bio, experience, skills[], targetRole, jobSearchStage (enum). Owns almost every row.
- `Job` (:62): url, jdText, company, title, location, `sources` JSON (field origin), soft delete. Has `Application` (1:1), CoverLetter, ColdEmail, ATSScore, ResumeVersion.
- `Application` (:87): one per Job (jobId unique), status enum SAVED|APPLIED|INTERVIEWING|OFFER|CLOSED, appliedAt, interviewAt, nextActionAt, followUpCount, closedReason, gapTasksAddedAt, prepSessionId (no FK), `pipeline` JSON (4 bot steps).
- `Resume` (:127, one per user, JSON `content`, contact/summary/experience/education/projects columns). `ResumeTemplate` (:162). `ResumeVersion` (:202): saved or tailored versions; optional job link.
- `CoverLetter` (:222), `ColdEmail` (:414): text, sources JSON, soft delete, jobId (SetNull). ColdEmail has recipient fields and followUpAt.
- `CareerPath` (:243): roadmap with `steps` JSON, progress, status, soft delete. `SkillGapAnalysis` (:264), `CareerGoal` (:347): unused by current UI (unverified).
- `ATSScore` (:378): score, strengths, weaknesses, missingSkills, `evidence` JSON, jobId (SetNull), soft delete.
- `Assessment` (:113), `QuizSession` (:459), `InterviewAnswer` (:473, unique per session+question), `PracticeSession` (:322), `MockInterview` (:291): interview data. `MockInterview` and `PracticeSession` look unused (unverified).
- `AiUsage` (:441): per-call log, `actionId` for the daily cap.

## 5. How AI is called now
Provider: Gemini only (`src/lib/ai/providers.js:3-12`). Model names come from env `AI_ROUTE_FAST` and `AI_ROUTE_WRITE`, never from code. Tasks: fast = temp 0, write = temp 0.4 (`tasks.js:3-4`). Keys rotate with cooldown (`keys.js`). Daily cap via `AiUsage` (`limit.js`, one cap check per user action, D50). `runAIStructured` validates with zod and retries once on bad JSON (`index.js:158-175`). `runAIText` has no schema.

| Call site | Task | Output validated? |
|---|---|---|
| `src/app/api/chat/route.js:64` | write, 0.2 | zod (`chatOutputSchema`) |
| `src/actions/Onboarding.js:60` | write | zod (`resumeChipsSchema`) + number check in `lib/onboarding/chips.js` |
| `src/actions/Jobs.js:128` | fast | zod (`jobMetaSchema`) + `verifyJobField` source check |
| `src/actions/Resume.js:289` | write, text, 0.7 | number check with one retry (`Resume.js:298-303`) |
| `src/actions/Resume.js:770` | write | zod (`tailorSchema`) + `inventedNumbers` (`:753`) |
| `src/actions/Interview.js:87` | fast | zod (`quizSchema`) |
| `src/actions/Interview.js:140` | write, text | none |
| `src/actions/Practice.js:137` | write | zod + `inventedQuestionNumbers` (`:147`) |
| `src/actions/Practice.js:304` | fast | zod (`rubricSchema`) + quote check |
| `src/lib/ats/score.js:192` (called from `Pipeline.js:85`, `ResumeParser.js:150`) | fast | zod (`atsSchema`) + sources |
| `src/actions/ResumeParser.js:584` | write | zod (`atsFixSchema`) + `inventedNumbers` (`:501`) |
| `src/actions/CareerRoadmap.js:158` | write | zod (`roadmapSchema`) |
| `src/actions/CareerRoadmap.js:422` | write, text | none |
| `src/lib/ai/paragraphs.js:78` (used by CoverLetter and ColdEmail) | write | sourced paragraphs, number check (`:27,:47`) |
| `src/actions/CoverLetter.js:411` | write | zod (`shortenSchema`) + `inventedNumbers` (`:418`) |

## 6. Problems found
- **HIGH** Bot run stops when the page is left: `src/app/(main)/(gated)/jobs/[id]/_components/JobView.jsx:45-79` (client loop, `aliveRef`). No worker or notification exists, so "you can leave, we'll notify you" is not true today.
- **HIGH** No ownership gap found in the 14 action modules: all reads and writes are scoped by `userId` (e.g. `Applications.js:26`, `Jobs.js:205`, `Resume.js:377`). Recorded as a check, not a bug.
- **MED** Practice questions use only job-description lines and profile skills, never projects: `src/actions/Practice.js:113-127` (D28). Target scene 6 needs projects.
- **MED** Unvalidated AI text: `src/actions/Interview.js:140`, `src/actions/CareerRoadmap.js:422` (no zod, no number check).
- **MED** Tailor accept has no undo: `src/app/(main)/(gated)/needs-you/_components/TailorReview.jsx` (save path around `:55-80`). Letter edits and dismiss do have Undo (`LetterReview.jsx:103`, `NeedsYouQueue.jsx:125`).
- **MED** Home does double work: `DashboardView.jsx:92-95` calls `getDashboardData` and `getNeedsYou`, and `Dashboard.js:95-120` derives needsYou count again.
- **MED** Reads cause writes: `Dashboard.js:43` (`pruneDeleted`), `src/lib/applications/needsYou.js:27-40` (follow-up dates written on read).
- **MED** Gate query on every gated navigation: `src/app/(main)/(gated)/layout.jsx:8` (`getUserOnboardingStatus`, uncached).
- **LOW** Duplicate DOM id `timeline`: `CreateRoadmapModal.jsx:171` and `:253` (different branches).
- **LOW** Hard-coded colors and id in StrengthRing: `OnboardingFlow.jsx:53-55`.
- **LOW** Duplicate MD editor CSS: `cold-email/_components/ColdEmailPreview.jsx:456-492` and `cover-letter/_components/CoverLetterPreview.jsx:352-388`.
- **LOW** Dead files (no importers): `src/components/SideBar.jsx`, `src/components/Header.jsx`, `src/components/FeatureSections.jsx`, `src/components/Loader.jsx`, `src/lib/checkUser.js`. Unused ui: lamp, sparkles, background-beams, infinite-moving-cards, animated-tooltip, text-generate-effect, alert-dialog, progress, accordion, radio-group, field.
- **LOW** Two animation libs (framer-motion and motion) and two icon libs (lucide and tabler).
- **LOW** Middleware still protects `/tools(.*)` (`src/middleware.js:12`) though those routes only redirect.

## 7. Frontend notes
- **Routing:** App Router. Shell in `(main)/layout.jsx`, gate in `(gated)/layout.jsx`. Chat at `src/app/chat` is outside the gate. Redirects for old `/tools/*` in `next.config.mjs`.
- **Loading and error:** `loading.jsx` and `error.jsx` at `(main)` and on most feature folders (applications, cold-email, cover-letter, dashboard, interview, jobs/[id], needs-you, resume, resume-parser, roadmap, roadmap/[id], settings, onboarding, chat). Empty states in `components/shared/EmptyState.jsx` and inline.
- **State:** local `useState` plus server actions called straight from client components. No global store, no react-query or SWR. Optimistic updates with rollback in `ApplicationsBoard.jsx:145-181`, `NeedsYouQueue.jsx:100-125`.
- **Shared:** `AppSidebar.jsx` (desktop sidebar plus mobile tab bar, nav at `:55-69`), `CommandMenu.jsx`, `EditableChips.jsx` (chip input), `TrackedChanges.jsx` (per-line accept, reject, edit), `SourceChips.jsx`, `JobStart.jsx` (job picker), `PixelScene`, `PipStatus`.
- **Home scene:** time-of-day scene from application data (`DashboardView.jsx:148-167`), not from bot or pipeline state. Its badge text says "pipeline:" but shows time of day (`:281`).
- **Mobile:** tab bar exists. 390px behaviour not verified by this pass.
- **Duplicated forms:** cold email and cover letter generators share the same JD/company/title shape (`ColdEmailGen.jsx`, `CoverLetterGen.jsx`).

## 8. Backend notes
- **Server actions** are the main API (14 modules, `"use server"`). The only route handler is `/api/chat`. Auth pattern: `auth()` from Clerk, or `requireUser()` (`src/lib/jobs/common.js`) which returns `{ clerkUserId, user }`.
- **Result shape:** actions return `{ error, code }` objects for expected failures, mapped on the client by `components/shared/generationError.js`.
- **Patterns:** soft delete with `deletedAt` and 7-day purge (`src/lib/softDelete.js`, D60). Compare-and-swap on `updatedAt` for pipeline claims (`Pipeline.js:28-34`) and follow-up counts (`Applications.js:370`). One `actionId` per user action for the AI cap (`src/lib/ai/action.js`).
- **Job intake:** `intakeJob` (`Jobs.js:83-163`) classifies input (question → chat, URL → fetch, text → use). Fetch is SSRF-guarded: https only, every address must be public, IP pinned (`src/lib/jobs/fetch.js:3-5`). Creates Job and Application(SAVED) in one write (`Jobs.js:145-157`).
- **Bots:** four steps CHECKER, TAILOR, WRITER, CONNECTOR (`Pipeline.js:143`). One step per `runNextStep` call; the browser calls it in a loop. No background worker.
- **Needs you:** derived, not stored (`src/lib/applications/needsYou.js:43-142`). Follow-up due = applied + 5 days (`derive.js:4`).
- **Background jobs:** none. Follow-up reminders are read-time only. No email or push.
- **Gaps for the redesign:** notifications, background runs, offer comparison and negotiation draft, "0 things invented" claim (no UI string), projects as interview source, waveform, bot status on home.
