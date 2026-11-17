# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-4` (after Phase 3: 2d5f8dc..417ff08). Read-only. Repo-relative paths. Env values never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript, standalone output, server action body 10mb. React 19.1, Tailwind 4, Radix/shadcn (`src/components/ui`), sonner, `@uiw/react-md-editor` (letter and email preview).
- Forms: react-hook-form + zod ^4 (`src/app/lib/schema.js`). Server zod for AI output (`src/lib/ai/schemas.js`), quiz and chat input. Clerk ^6.31.10 (`src/middleware.js:4-15`), server code calls `auth()`.
- DB: PostgreSQL, Prisma ^6.16.2, 9 migrations. Not confirmed applied: `20261117000000_ai_usage`, `20261117010000_quiz_session`, `20261118000000_phase3_sources` (D22: owner applies).
- AI: `@langchain/core` + `@langchain/google-genai` behind `src/lib/ai/`. PDF text: `unpdf` ^2.2.1 (new, pure JS). `openai` installed, unused. Background jobs: none (`@upstash/qstash`, `resend` unused). Docker: multi-stage, node:20, `prisma migrate deploy` then `server.js`.

## 2. Folder map
- `src/app/(auth)/`, `src/app/page.js` landing, `src/app/chat/` (outside gate). `src/app/(main)/(gated)/`: feature pages, `layout.jsx:13` onboarding gate, `tools/` six previews on `src/lib/mock.ts` (see §11). `src/app/api/chat/route.js`: only API route (SSE). `src/actions/`: "use server" actions.
- `src/lib/ai/`: `index.js` (runAI*), `tasks.js`, `providers.js`, `keys.js`, `log.js`, `limit.js` (daily cap), `schemas.js`, `chatContext.js`; Phase 3: `sources.js` (catalog, id checks), `paragraphs.js` (sourced paragraphs), `pdf.js`, `numberCheck.js`.
- `src/lib/clerkEmail.js` (primary email or null). `src/components/shared/`: SourceChips.jsx, generationError.js, ResumePaperDoc.jsx, AppSidebar.jsx. `scripts/selfcheck-matching.mjs`: node self-check for numberCheck and matching.

## 3. Features
| Feature | Page(s) | Server action / API | AI call (path:line) |
|---|---|---|---|
| Resume builder | `/resume`, `/tools/resume` | saveResume `Resume.js:50`, getResume `:97`, improveWithAI `:159` (text + sources), duplicateResume `:278` | `Resume.js:221` write, plain text |
| Interview prep | `/interview`, `/interview/mock`, `/tools/interview` | generateQuiz `Interview.js:25`, submitQuiz `:143`, getAssessments `:230` | `:80` fast, zod; tip `:140`, called `:211` |
| Cover letter | `/cover-letter` (+new, [id]), `/tools/cover-letter` | generateCoverLetter `CoverLetter.js:21`, list, get, delete | `CoverLetter.js:75` to `paragraphs.js:48` |
| Cold email | `/cold-email` (+new, [id]), `/tools/cold-email` | generateColdEmail `ColdEmail.js:22`, list, get, delete | `ColdEmail.js:75` to `paragraphs.js:48` |
| Career roadmap | `/roadmap`, `/roadmap/[id]`, `/tools/roadmap` | generateCareerRoadmap `CareerRoadmap.js:20`, completeRoadmapStep `:280`, generateProgressRecommendations `:337` (no UI) | `:149` write, zod; progress text `:376` |
| Resume parser / ATS | `/resume-parser`, `/tools/ats` | createATSAnalysis `ResumeParser.js:65` (PDF check `:85`); list `:309`, get `:341`, delete `:367`, analytics `:399`, updateATSScore `:454` (no UI) | `:238` fast, PDF inline, zod + quote check |
| Dashboard, chat, onboarding | `/dashboard`, `/chat`, `/onboarding` | getDashboardData `Dashboard.js:12`; POST `/api/chat` `route.js:25`; updateUser `User.js:9` | `route.js:64` write 0.2, zod; others none |
| Industry insights | none (FAQ says no reports yet, `faqs.js:15`) | none | none; zero rows only (`User.js:22-29`) |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId, email `String?` @unique (nullable since Phase 3), industry, bio, experience, skills[]. Owns most rows.
- `Resume` (:55, one per user): content = JSON of the builder form (`ResumeBuilder.jsx:275`), templateId, contactInfo, summary, skills, experience/education/projects Json[]. `ResumeTemplate` (:89). `ResumeVersion` (:129): write-only (`Resume.js:296`).
- `CoverLetter` (:146), `ColdEmail` (:353): content, jobTitle, companyName, status, **sources Json?** (new, :155, :362).
- `CareerPath` (:162): steps Json (sourceIds and source snapshot per step), milestones, resources, timeline, progress.
- `ATSScore` (:323): scores, strengths/weaknesses (plain text), recommendations Json[], **evidence Json?** (new, :338), missingSkills, job fields.
- `Assessment` (:41): quizScore, category, questions Json, improvementTip. `QuizSession` (:384): questions Json incl. correctAnswer; unsubmitted rows older than 7 days pruned at generation (`Interview.js:91-100`).
- `AiUsage` (:369): userId (no relation), task, model, ok; read by the daily cap. `IndustryInsight` (:294): zeros only. Unused: MockInterview :207, SkillGapAnalysis :180, PracticeSession :238, CareerGoal :263.

## 5. How AI is called now
Only path: `src/lib/ai/index.js`. runAI checks the daily cap when userId is set (`:56`), walks `AI_ROUTE_<TASK>`, rotates keys, 90 s timeout. Tasks: fast temp 0, write temp 0.4. Every attempt writes AiUsage. Only provider: Google, models from env.
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:221` improveWithAI | write 0.7, 300 tok | numberCheck (`numberCheck.js:46`), one retry, then INVENTED_DETAIL (`Resume.js:230-240`); sources = input:current |
| `paragraphs.js:48` (CoverLetter.js:75, ColdEmail.js:75) | write | zod paragraphsSchema; each body paragraph needs a valid sourceId; one retry; unsourced dropped; NO_SOURCES if none |
| `Interview.js:80` generateQuiz | fast 0.3 | zod quizSchema; bad answers dropped (`:86-88`) |
| `Interview.js:140` tip (called `:211`) | write | none; failure ignored; claim happens first (`:172-205`) |
| `CareerRoadmap.js:149` | write | zod roadmapSchema; sourceIds checked; unsourced steps dropped; retry `:159` |
| `CareerRoadmap.js:376` progress tips | write | none; no UI caller |
| `ResumeParser.js:238` ATS | fast, PDF inline (checked `:85`) | zod atsSchema; quotes verified in PDF text (`verifySources` `:30`); retry `:256-262` |
| `route.js:64` chat | write 0.2 | zod chatOutputSchema; cards resolved server-side (`chatContext.js:150`) |

## 6. Env
- Env names (`.env.example`): DATABASE_URL(_DOCKER), Clerk keys, GEMINI_API_KEY(S), AI_ROUTE_FAST/WRITE, AI_DEBUG, AI_DAILY_LIMIT (unset = 50, "0" = off, `limit.js:10-14`).

## 7. Build and run
- `npm run dev|build|start|lint`; local DB `npx prisma migrate dev`; Docker `docker compose up --build -d`, port 3000.

## 8. Top problems (open, ranked)
1. HIGH: Phase 3 code writes columns that exist only after migration `20261118000000_phase3_sources` (not applied): `CoverLetter.js:77-80`, `ColdEmail.js:77-80`, `ResumeParser.js:278-289`. Migrate before deploy.
2. HIGH: Daily cap fails open when AiUsage cannot be read (`limit.js:24-31`), so spend is uncapped until `20261117000000_ai_usage` is applied.
3. MED: Letter and email edits are never saved; no update action (`CoverLetterPreview.jsx:23,128-136`, `ColdEmailPreview.jsx:12,118-119`). After an edit, paragraph sources map by index onto new text (`CoverLetterPreview.jsx:158`).
4. MED: `updateUser` writes skills, experience and bio without zod (`User.js:53-56`).
5. MED: Previews make unsupported claims: "65%+ open rate" (`tools/cold-email/page.jsx:140`), "pip will notify your dashboard" (`:203`, nothing sends), invented bullet in 1-click fix (`tools/ats/page.jsx:49`), +7 literal (`:56`). Goes away when previews retire (§11.7).
6. LOW: Word targets disagree. Cold email: 120 (`tools/cold-email/page.jsx:42`), prompt 100-140 (`ColdEmail.js:55`), tip "under 100" (`ColdEmailPreview.jsx:165`). Cover letter: 250-320 (`tools/cover-letter/page.jsx:167`) vs prompt 250-350 (`CoverLetter.js:57`).
7. LOW: Retries add a second AI call against the cap: `paragraphs.js:53-57`, `ResumeParser.js:256-262`, `CareerRoadmap.js:159`.
8. LOW: `usageCount` increments on every save (`Resume.js:80`), so template sort (`:137`) is save count.
9. LOW: `updateRoadmapProgress` ignores `progress` (`CareerRoadmap.js:246`). `generateProgressRecommendations` (`:337`) has no caller, unvalidated text.
10. LOW: ATS list, analytics, delete, updateATSScore have no UI (`ResumeParser.js:309,367,399,454`). ResumeVersion write-only (`Resume.js:296`).
11. LOW: Dead code: `components/SideBar.jsx`, `components/Header.jsx`, `lib/checkUser.js` (no importers). Unused deps: `@react-pdf/renderer`, `@tabler/core`, `html2pdf.js`, `openai`, `react-markdown`, `resend`, `@upstash/qstash`, `@clerk/themes`. No root `error.jsx` or `not-found`.

## 9. Frontend notes
- Sidebar main nav uses real routes (`AppSidebar.jsx:40-47`). Previews group (`:49-56`) renders at `:155-160` and `:257-259`. Middleware protects `/tools` (`middleware.js:12`).
- Shared: `SourceChips.jsx` (chips, `ParagraphSources`, `LegacySourcesLabel` for rows made before Phase 3). `generationError.js` maps NO_SOURCES and AI_LIMIT to copy. ResumePaperDoc has a "Sample" label (`:75`). State is local `useState`; no skeletons on list pages; `loading.jsx` only at root and `(main)`.

## 10. Backend notes
- Every feature is a "use server" action: `auth()`, scoped by user.id. Generators return `{error, code}` (NO_SOURCES, AI_LIMIT, INVALID_FILE, INVENTED_DETAIL, NOT_FOUND, FAILED); Resume and ATS getters still throw.
- Trust pattern: AI output carries sourceIds or quotes, checked against the catalog (`sources.js:120`) or PDF text (`ResumeParser.js:30`). updateATSScore takes only job fields (`ResumeParser.js:445-481`). Only API route: `/api/chat`. AI runs synchronously; no queue, jobs, or pagination.

## 11. Phase 4 inputs: tools parity
Scope (D17, D25): move preview features into real routes, then retire `/tools/*`. Each missing feature gives (a) preview file:line, (b) real route today, (c) backend work, (d) S/M/L, (e) trust conflict (sources on AI output D26-28, nothing invented, no auto-send or auto-apply, daily cap).

### 11.1 Resume: `tools/resume` vs `/resume` (already there: PDF `ResumeBuilder.jsx:289`, 6 templates `:88-133`, autosave `:207-209`)
- Tailor to a JD, per-bullet edits. (a) `page.jsx:22,38-61` (fake 1 s timer). (b) no job field. (c) `tailorResume(jd)`, write task; each edit sourced to a resume quote and jd id; numberCheck. (d) L. (e) proposes only; user accepts; cap per run.
- Match % per job. (a) `page.jsx:34-35` (92%, 78% literals). (b) none. (c) deterministic keyword overlap, no AI, list matched terms. (d) M. (e) must be computed, never typed.
- Per-bullet accept or strike. (a) `ResumePaperDoc.jsx:58-64,136-177` (sample data). (b) field-level improve only (`AITextarea.jsx`, `EntryForm.jsx`). (c) UI-only; saved state = `accepted` in entry Json, no migration. (d) S. (e) accept is a user action.
- Source footnotes panel. (a) `page.jsx:193-233` (telemetry facts the user never gave). (b) SourceChips "Based on" (`AITextarea.jsx:106`, `EntryForm.jsx:305`). (c) list resume catalog items (`sources.js:78`). (d) S. (e) never port the sample facts.
- Version history and switch. (a) `page.jsx:28,154-191` (switch only highlights). (b) ResumeVersion write-only, labels "Copy"/"Duplicate". (c) list read; restore (form JSON, so saveResume path works). (d) S read, M restore. (e) labels user-entered; no AI.

### 11.2 ATS: `tools/ats` vs `/resume-parser` (already there: score, matchPercentage, evidence chips `ResumeParserForm.jsx:277-352`)
- Upload a new PDF and re-score. (a) `page.jsx:29-39,146-156` (fake 800 ms, no call). (b) full run needs company, title, JD (`ResumeParserForm.jsx:105-117`). (c) UI-only, reuse form with saved JD. (d) S. (e) same cap.
- Score history per job. (a) `page.jsx:90-93` (score from MOCK_JOBS). (b) getUserATSScores `:309`, getATSScoreById `:341`, no UI. (c) UI-only list. (d) S. (e) none.
- Requirement checklist, matched or gap. (a) `page.jsx:181-237` (MOCK_ATS_REQUIREMENTS). (b) strengths, weaknesses, missingSkills only. (c) `requirements[]` in atsSchema, checked by verifySources `:30`, stored in evidence Json (no migration). (d) M. (e) matched needs a verified resume quote; gap needs a jd id.
- 1-click fix: rewrite and re-score. (a) `page.jsx:41-67` (invented bullet `:49`, +7 literal `:56`). (b) none; updateATSScore edits job fields only. (c) `proposeAtsFix(scoreId, idx)`: write task, bullet from resume text only, numberCheck; user accepts; fast re-score; do not widen updateATSScore. (d) L. (e) HIGH: rewrites resume; never auto-apply; delta must come from a real re-score.
- Candidate level and years. (a) `page.jsx:159-178` ("3 years exp" literal `:163`). (b) candidateLevel returned (`schemas.js`), not stored (`ResumeParser.js:278`). (c) UI from profile (S); persist level needs ATSScore column (migration). (d) S / M. (e) user data only.
- Weights panel. (a) `page.jsx:263-281` (40/40/20). (b) level-based weights in prompt (`ResumeParser.js:144-160`). (c) show real weights per level, or drop. (d) S. (e) must match the prompt.

### 11.3 Cover letter: `tools/cover-letter` vs `/cover-letter` (already there: copy `CoverLetterPreview.jsx:28`, TXT download `:37-43`, paragraph chips `:158`)
- Tone selector. (a) `page.jsx:21,139-158,63-71` (3 static variants `:26-59`). (b) no tone input (`CoverLetterGen.jsx:100-133`). (c) `tone` enum in inputSchema (`CoverLetter.js:13`) + prompt line; UI selector. (d) S + S. (e) a switch is a new AI call; facts stay sourced.
- More formal, regenerate. (a) `page.jsx:194-205`. (b) none. (c) reuse generateCoverLetter; needs a replace path or rows pile up. (d) S. (e) each click counts toward cap.
- Shorter (-60 words). (a) `page.jsx:73-84,188-193` (drops paragraph 2, fake). (b) none. (c) `rewriteParagraph(id, idx)` reusing stored sources. (d) S. (e) keep sourceIds; numberCheck.
- Word count (ideal 250-320). (a) `page.jsx:91,166-168`. (b) none; prompt 250-350 (`CoverLetter.js:57`). (c) UI-only, one range. (d) S. (e) none.
- Save edits. (a) `page.jsx:176-181` (state only). (b) edits lost on reload (`CoverLetterPreview.jsx:23,128-136`); no update action. (c) `updateCoverLetter(id, content)`; re-map sources when paragraphs change. (d) S. (e) index-based sources go stale.
- Flagged clichés. (a) `page.jsx:226-254` (static examples). (b) none. (c) deterministic phrase check on saved text, no AI; fix via rewrite. (d) S. (e) "resolved" examples are fake.

### 11.4 Cold email: `tools/cold-email` vs `/cold-email` (already there: copy `ColdEmailPreview.jsx:17`, tips `:165`, `:207`, paragraph chips)
- Recipient name, role, email. (a) `page.jsx:21-23,96-136` (email in header `:155`). (b) none; ColdEmailGen has company, title, JD only (`:100-133`). (c) 3 optional columns (migration); greeting uses first name in prompt. (d) M. (e) email typed by user only; never from AI or profile.
- Subject line. (a) `page.jsx:24,140-147` (65%+ open-rate claim `:140`). (b) prompt says no subject (`ColdEmail.js:58`). (c) `subject` from generator or user column (migration). (d) S-M. (e) drop the open-rate claim.
- Live word counter (120). (a) `page.jsx:41-42,158-170`. (b) none; prompt 100-140 (`ColdEmail.js:55`). (c) UI-only, one target everywhere. (d) S. (e) none.
- Matched-project highlight. (a) `page.jsx:175-184` (UrbanPiper literal). (b) paragraph chips (SourceChips.jsx). (c) UI-only: highlight paragraphs whose sources hit proj: ids. (d) S. (e) none.
- Follow-up reminder. (a) `page.jsx:25,187-205`; promise `:203`. (b) none; no job runner, no notifications. (c) `followUpAt` column (migration) and dashboard due list (S read). (d) M. (e) pull reminder only; never sends.
- Open in mail client. (a) `page.jsx:49-55,216-221` (mailto). (b) none. (c) UI-only. (d) S. (e) mailto is a send path: explicit click only, recipient typed by user, no auto-open; long bodies truncate.

### 11.5 Interview: `tools/interview` vs `/interview`, `/interview/mock` (already there: 10-question MCQ at `/interview/mock`, PerformanceChart.jsx)
- Open-ended questions, one at a time. (a) `page.jsx:21-33,139-165` (mock.ts questions). (b) MCQ only, generateQuiz `Interview.js:25`. (c) `generateOpenQuestions`, zod, sourceIds per question; store in QuizSession.questions with a type flag (no migration). (d) M. (e) each question cites a JD line or profile skill.
- Typed answer. (a) `page.jsx:213-224`. (b) MCQ answers only. (c) with the row above. (d) in M. (e) none.
- Voice record. (a) `page.jsx:24,53-64,181-209` (hardcoded transcript `:57`). (b) none in interview; hook used only by resume (see §11.7). (c) UI-only: reuse hook; transcript editable before scoring. (d) S. (e) no audio upload; server STT (M) would store candidate audio.
- 120 s timer per question. (a) `page.jsx:27,36-51,94` (reset ignores timeLimit). (b) none. (c) UI-only. (d) S. (e) none.
- Rubric scoring (30/40/30). (a) `page.jsx:66-87,230,248-301` (literals `:78-84`). (b) MCQ scoring only, submitQuiz `Interview.js:143`. (c) `scoreAnswer`: zod rubric; quotes checked against answer text (pattern `ResumeParser.js:30`); store in QuizSession or new table. (d) L. (e) label as AI estimate; quote verbatim; one call per submit.
- Weak areas from practice. (a) `page.jsx:356-375` (literal text). (b) improvementTip `Interview.js:211`; per-question isCorrect; no topic. (c) `topic` in quiz zod and prompt (no migration); aggregate wrong answers. (d) S-M. (e) real answers only.

### 11.6 Roadmap: `tools/roadmap` vs `/roadmap`, `/roadmap/[id]` (already there: step completion `RoadmapDetailView.jsx:284-296`, progress bar `:113-146`, estimatedDuration `:108`)
- Weekly grouped checklist. (a) `page.jsx:81-162` (MOCK_WEEKLY_ROADMAP). (b) flat steps; phaseBreakdown (`RoadmapDetailView.jsx:154-160`). (c) UI grouping from phaseBreakdown, or `weeks[]` in roadmapSchema stored in timeline Json. (d) S or M. (e) week counts labelled as AI estimate.
- Task toggle with undo. (a) `page.jsx:30-38,131` (local state, not saved). (b) complete-only per step (`CareerRoadmap.js:280`), button hidden when done. (c) `setRoadmapStepDone(id, stepId, done)` with ownership check. (d) S. (e) do not keep an unsaved toggle.
- Closes gaps for (companies). (a) `page.jsx:110-123` (closedFor mock). (b) none. (c) needs saved job targets (D18); jd ids as sources. (d) M. (e) claims cite pasted JD lines.
- Gaps ranked by frequency. (a) `page.jsx:22-28,187-216` (literal counts). (b) none; per-run missingSkills stored (`ResumeParser.js:287`). (c) read-only aggregate over ATSScore rows, no AI; targets need D18. (d) M. (e) counts from real rows only.

### 11.7 Retiring /tools/* and answers
- Delete `src/app/(main)/(gated)/tools/` (6 pages, `layout.jsx` banner `:27`, 1682 lines) and `src/lib/mock.ts` (imported only by those pages). Sidebar `previews` array `AppSidebar.jsx:49-56`, render `:155-160`, `:257-259`.
- Re-point landing tool hrefs `src/app/page.js:55-102` and footer `:615-620`; real resume link `resume/page.jsx:31`; middleware `src/middleware.js:12`; scripts `scripts/capture_screenshots.js:16-21`, `scripts/capture_via_cdp.js:15-20`. Keep `ResumePaperDoc.jsx` (landing uses it, `src/app/page.js:253`). No `/tools` links in chat or dashboard. Optional `/tools/*` redirects (S). Size S-M, gated by the rows above.
- ResumeVersion as version switch: partly. Fields jobTitle and companyName (required), jobDescription, tailoredContent, atsScore, matchPercentage (`schema.prisma:129-143`). tailoredContent can hold form JSON, so restore works. Needs a list read (S) and real labels (duplicateResume writes "Copy"/"Duplicate", `Resume.js:296-302`). Autosave overwrites Resume, so versions need an explicit "save version". No migration.
- Speech hook `src/hooks/use-speech-to-text.js`: NOT used by the real interview. Only `resume/_components/AITextarea.jsx:13` and `EntryForm.jsx:54` use it.
- Fake-only, no real equivalent until user data or a new generator exists: telemetry sources (`tools/resume/page.jsx:205-229`), open-rate claim (`cold-email:140`), notify promise (`:203`), invented ATS bullet (`ats:49`), roadmap closedFor and gap counts (`roadmap:22-28`, mock), rubric literals (`interview:78-84`), weak areas (`:356-375`), cliche examples (`cover-letter:226-254`).
