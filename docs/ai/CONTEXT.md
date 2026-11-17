# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-6` (Phase 5 done: `78cadf2..2293ce1`). Read-only. Repo-relative paths. Env values never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript, standalone output, server action body 10mb. React 19.1, Tailwind 4, Radix/shadcn (`src/components/ui`), sonner, `@uiw/react-md-editor` (letter/email preview), jspdf (`ResumeBuilder.jsx:54`).
- Forms: react-hook-form + zod ^4 (`src/app/lib/schema.js`). Server zod for AI output (`src/lib/ai/schemas.js`). Clerk ^6.31.10 (`src/middleware.js:4-15`); server code calls `auth()`.
- DB: PostgreSQL, Prisma ^6.16.2, 10 migrations. Not confirmed applied (D22): `20261117000000_ai_usage`, `20261117010000_quiz_session`, `20261118000000_phase3_sources` (deploy gate), and `20261119000000_cold_email_fields` (Phase 5).
- AI: `@langchain/core` + `@langchain/google-genai` behind `src/lib/ai/`. PDF text: `unpdf`. `openai` installed, unused. Background jobs: none (`@upstash/qstash`, `resend` unused); all AI runs inline. Docker: multi-stage, node:20, `prisma migrate deploy` then `server.js`.

## 2. Folder map
- `src/app/page.js` landing (tool cards `:55-102`, footer `:615-620`); `src/app/(auth)/`; `src/app/chat/` (outside gate).
- `src/app/(main)/(gated)/`: feature pages behind `layout.jsx:13` onboarding gate. `resume/`, `resume-parser/` (+ DeleteAtsButton), `cover-letter/`, `cold-email/`, `dashboard/`, `interview/`, `roadmap/`.
- `tools/`: only `interview/page.jsx` and `roadmap/page.jsx` remain (mock previews, `src/lib/mock.ts`) with banner `layout.jsx:23`. Redirects for the 4 retired previews: `next.config.mjs:15-22`.
- `src/app/api/chat/route.js`: only API route (SSE). `src/actions/`: "use server" actions.
- `src/lib/ai/`: `index.js` (runAI*, cap), `limit.js` (daily cap), `schemas.js`, `sources.js` (catalog, id checks), `paragraphs.js` (sourced paragraphs for letters and emails), `numberCheck.js`, `pdf.js`, `providers.js`, `keys.js`, `tasks.js`, `log.js`, `chatContext.js`.
- `src/lib/`: `writing.js` (Phase 5: word ranges, tones, cliche list; shared by prompts, actions, UI), `match.js` (D37), `ats/weights.js`, `entryIds.js`, `mock.ts` (§11.5). `src/components/shared/`: SourceChips, WritingHints (WordCount, ClicheCheck), generationError.js, ResumePaperDoc.jsx, AppSidebar.jsx. `src/hooks/use-speech-to-text.js`.

## 3. Features
| Feature | Page(s) | Server action / API (line) | AI call (path:line) |
|---|---|---|---|
| Resume builder | `/resume` (tailor, template, form) | saveResume `Resume.js:106`, improveWithAI `:215`, computeMatch `:669`, tailorResume `:737`, versions `:507-619`, saveTailoredVersion `:888` | `Resume.js:277` improve; `:822` tailor |
| ATS scan | `/resume-parser` | createATSAnalysis `ResumeParser.js:316`, getUserATSScores `:388`, getATSScoreById `:439`, deleteATSScore `:470` (DeleteAtsButton), getATSAnalytics `:493` (no UI), updateATSScore `:548`, proposeAtsFix `:674`, applyAtsFix `:792` | scoreResume `:212` (fast); fix `:741` (write) |
| Cover letter | `/cover-letter` (+new, [id]) | generateCoverLetter `CoverLetter.js:102`, list `:150`, get `:171`, delete `:191`, updateCoverLetter `:218`, regenerateCoverLetter `:248` (tone, formal), shortenCoverLetter `:299` | `CoverLetter.js:123` gen, `:271` regen (both via `paragraphs.js:74`); shorten `:346` |
| Cold email | `/cold-email` (+new, [id]) | generateColdEmail `ColdEmail.js:74`, list `:186`, get `:207`, delete `:230`, updateColdEmail `:258` (recipient, subject), setColdEmailFollowUp `:324` | `ColdEmail.js:142` (body + subject); mailto is client-only `ColdEmailPreview.jsx:109-120` |
| Career roadmap | `/roadmap`, `/roadmap/[id]` | generateCareerRoadmap `CareerRoadmap.js:20`, updateRoadmapProgress `:247` (ignores progress), completeRoadmapStep `:281`, generateProgressRecommendations `:338` (no UI) | `:149` write, zod; progress text `:377` |
| Interview prep | `/interview`, `/interview/mock` (MCQ only) | generateQuiz `Interview.js:26`, submitQuiz `:145`, getAssessments `:232` | `:81` fast, zod; tip `:142` |
| Dashboard | `/dashboard` | getDashboardData `Dashboard.js:13`; dueFollowUps `:67` (reminders only) | none |
| Chat, onboarding | `/chat`, `/onboarding` | POST `/api/chat` `route.js:25`; updateUser `User.js:9` | chat `route.js:64` write 0.2, zod |
| Industry insights | none (FAQ promises it, `src/data/faqs.js:5`) | none | none; zero rows (`User.js:21-42`) |
| Tool previews | `/tools/interview`, `/tools/roadmap` | none (mock data) | none |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId, email @unique, industry FK to IndustryInsight (:17-18), experience Int? (:23), skills[]. Owns most rows.
- `Resume` (:55, one per user), `ResumeTemplate` (:89). `ResumeVersion` (:129): tailoredContent JSON envelope (no migration); drafts purged after 24 h (`Resume.js:514-523`).
- `CoverLetter` (:146): content, jobTitle, companyName, sources Json? (:155; `tone` lives inside it, no column).
- `ColdEmail` (:353): content, jobTitle, companyName, status, sources Json? (:362); Phase 5 columns recipientName, recipientRole, recipientEmail, subject, followUpAt (:363-367, index :372). Migration pending.
- `ATSScore` (:323): scores, recommendations Json[], missingSkills String[] (:336), jobDescription, evidence Json? (:338: sourced items, requirements, candidateLevel, resumeText, resumePurgedAt, previousScoreId, appliedFix).
- `CareerPath` (:162): steps Json (sourceIds), milestones, resources, timeline, progress.
- `Assessment` (:41): quizScore, questions Json[], category, improvementTip. `QuizSession` (:390): questions Json (MCQ incl. correctAnswer), submittedAt; unsubmitted rows older than 7 days pruned (`Interview.js:92-100`).
- `AiUsage` (:375): userId (no relation), task, model, ok; read by the cap. `IndustryInsight` (:294): zero rows. Unused: MockInterview :207, SkillGapAnalysis :180, PracticeSession :238, CareerGoal :263.

## 5. How AI is called now
Only path: `src/lib/ai/index.js`. `runAI` checks the cap when userId is set (`:56-59`), walks `AI_ROUTE_<TASK>`, rotates keys, 90 s timeout (`:7`). Tasks: fast temp 0, write temp 0.4. Every attempt writes AiUsage. Google only.
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:277` improveWithAI | write | numberCheck, one retry, INVENTED_DETAIL |
| `Resume.js:822` tailorResume | write | tailorSchema; entryId#bulletIndex real; jd ids; numberCheck; retry |
| `ResumeParser.js:212` scoreResume (create, re-score) | fast | atsSchema; quotes checked in stored PDF text (`:33`); requirements; retry |
| `ResumeParser.js:741` proposeAtsFix | write | atsFixSchema; original line from stored text; numberCheck; retry |
| `paragraphs.js:77` (CoverLetter `:123,:271`; ColdEmail `:142`) | write | paragraphsSchema; sourceIds per body paragraph; inventedNumbers; one retry; NO_SOURCES. Email: `emailParagraphsSchema` (`schemas.js:103`) adds subject, checked for claims, length, numbers, ids (`paragraphs.js:37-49`) |
| `CoverLetter.js:346` shortenCoverLetter | write | shortenSchema (`schemas.js:108`); body paragraphs by index; stored sourceIds kept; inventedNumbers; only shorter rewrites kept; retry |
| `Interview.js:81` generateQuiz | fast 0.3 | quizSchema; bad answers dropped |
| `Interview.js:142` tip | write | none; failure ignored |
| `CareerRoadmap.js:149` | write | roadmapSchema; sourceIds checked; unsourced steps dropped; retry |
| `CareerRoadmap.js:377` progress text | write | none; no UI caller |
| `route.js:64` chat | write 0.2 | chatOutputSchema; cards resolved server-side |

## 6. Env (names only, `.env.example`)
- DATABASE_URL(_DOCKER), Clerk keys, GEMINI_API_KEY(S), AI_ROUTE_FAST/WRITE, AI_DEBUG. Phase 5 added none.
- AI_DAILY_LIMIT: unset = 50 calls per user per day (D30), "0" = off; retries count. Production fails closed when AiUsage is unreadable (D33, `limit.js:31-33`).
- ATS_FIX_SIGNING_SECRET (D39): HMAC key, >= 32 chars (`ResumeParser.js:620-632`). Missing in production: FIX_UNAVAILABLE.

## 7. Build and run
- `npm run dev|build|start|lint`; local DB `npx prisma migrate dev`; Docker `docker compose up --build -d`, port 3000. `npm run build` is the Phase 5 done check (D40). The four migrations in §1 still gate deploy.

## 8. Top problems (open, ranked)
1. HIGH: Deploy gate. Four migrations unapplied. Cold email create needs `cold_email_fields` (`ColdEmail.js:160`), ATS create needs `evidence` (`ResumeParser.js:356`), letter and email saves need `sources` (`CoverLetter.js:131`, `ColdEmail.js:160`), and in production AI calls are blocked without AiUsage (`limit.js:31-33`).
2. MED: Cold email spends the AI call before the insert that fails on a missing column: AI at `ColdEmail.js:142`, insert at `:160`, MIGRATION_PENDING at `:58`. A pending migration burns a capped call per try. Check the column first.
3. MED: Invented data on the two remaining previews, linked from landing (`src/app/page.js:70,94`) and sidebar (`AppSidebar.jsx:50-51`): transcript `tools/interview/page.jsx:57`, score literals `:78-84`, weak areas `:359-372`; gap counts `tools/roadmap/page.jsx:23-28`, copy `:182`. Labelled "sample data" (`tools/layout.jsx:23`).
4. MED: Landing and pricing claims. `PricingSection.jsx:75` "Unlimited AI Credits" vs 50/day cap. Demo at `src/app/page.js:22-50,218-224` is unlabelled with hard-coded match % (`:33,41,49`). `ResumePaperDoc.jsx:12-46` has metric bullets, labelled only "Sample" (`:75`).
5. MED: One action can spend several capped calls. Tailor 2 (`Resume.js:822-827`), propose 2 and re-score 2 (`ResumeParser.js:212,741`), shorten 2 (`CoverLetter.js:346`), regenerate 2 (`paragraphs.js:77`). Retries count against the 50/day cap.
6. MED (privacy): Resume text kept up to 90 days (`ResumeParser.js:278-307`). Purge runs only on the owner's own ATS calls (`:349`, `:395`), so inactive users keep it. Delete button exists (DeleteAtsButton).
7. MED: `updateUser` writes skills, experience, bio without zod (`User.js:53-56`) and creates an IndustryInsight row for any industry string (`User.js:21-42`).
8. MED: Letter and email chips map by paragraph index after user edits; `SourceChips.jsx:81-82` checks count only (used by `CoverLetterPreview.jsx`, `ColdEmailPreview.jsx`).
9. LOW: `getUserATSScores` writes on read (`:395`) and loads evidence incl. resumeText for 50 rows (`:401`).
10. LOW: `setColdEmailFollowUp` (`ColdEmail.js:324`) and `updateColdEmail` (`:258`) return a raw row on success but `{error, code}` on failure; other actions return `{success}`.
11. LOW: No caller or UI: getATSAnalytics `ResumeParser.js:493`, generateProgressRecommendations `CareerRoadmap.js:338`. updateRoadmapProgress ignores progress (`:247`). Unused mock exports (§11.5).
12. LOW: Landing copy vs product: `src/app/page.js:77` "tone slider" (UI is a select), `:85` "<120 word" (range is 100-140, `writing.js:8`). FAQ promises industry insights (`faqs.js:5`, D9).
13. LOW: Legacy entry ids use array index (`entryIds.js:20`). usageCount increments on save (`Resume.js:136`, `:643`). Cross-instance double apply can spend one extra re-score (`ResumeParser.js:870`).
14. LOW: Dead code and unused deps (`components/SideBar.jsx`, `components/Header.jsx`, `lib/checkUser.js`; `openai`, `resend`, `@upstash/qstash`). `/tools` root has no page (404).

## 9. Frontend notes
- Sidebar main nav uses real routes. Previews group `AppSidebar.jsx:49-51`, render `:151-160` and `:253-258`. Middleware protects `/tools` (`src/middleware.js:12`).
- Cover letter: tone chips `CoverLetterGen.jsx:22,54,153`; regenerate and shorten with confirm dialog `CoverLetterPreview.jsx:79-80,228-245`; WordCount and ClicheCheck (`WritingHints.jsx:7,30`).
- Cold email: follow-up `ColdEmailPreview.jsx:93`; mailto on explicit click `:109-120,302-311`. Dashboard follow-ups `DashboardView.jsx:330-345`. ATS: years and purge notes `AtsHistory.jsx:57,71`, `AtsResult.jsx:98-100,139-150`.
- generationError.js handles NOT_SHORTENABLE and MIGRATION_PENDING. No skeletons on list pages; no root error.jsx.

## 10. Backend notes
- Every feature is a "use server" action, owner-scoped by user.id. New Phase 5 actions throw on no auth and return `{error, code}` for failures. `getResume` still throws.
- Trust pattern unchanged: sourceIds or quotes checked against the catalog (`sources.js:121`) or stored PDF text (`ResumeParser.js:33`). Shorten and regenerate keep or replace stored sources; shorten never adds ids (`CoverLetter.js:299`).
- Retention: `purgeOldResumeText` (`ResumeParser.js:290`, batch 50). Fix actions refuse results past 90 days (`:690`, `:844`); apply re-reads the row under lock (`:876-890`). AI runs synchronously. No queue or pagination beyond take limits (versions `take:100`, ATS history `take:50`).

## 11. Phase 6 inputs: interview + roadmap parity, then retire the last previews
Per item: (a) preview file:line, (b) real route today, (c) backend work, (d) S/M/L, (e) trust conflicts (D26-D28, inventedNumbers, the 50/day cap, nothing invented, no audio upload).

### 11.1 Interview (`tools/interview`)
- Open-ended questions, typed answers. (a) `page.jsx:6,32-33,139-165,214-216` (MOCK_INTERVIEW_QUESTIONS, textarea). (b) MCQ only: `/interview/mock` via generateQuiz `Interview.js:26`. (c) `generateOpenQuestions` (zod: question, topic, sourceIds from JD lines or profile skills); stored per §11.3. (d) M. (e) D26/D28: unsourced questions dropped; one generation call.
- Voice answer. (a) `page.jsx:53-63` (hard-coded transcript `:57`), button `:196-199`. (b) none; `use-speech-to-text.js` is used by resume only (`AITextarea.jsx:14`, `EntryForm.jsx:55`). (c) UI only: browser STT fills the textarea, user edits before scoring. (d) S. (e) no audio upload; server STT would store audio.
- 120 s timer. (a) `page.jsx:27,36-51,94` (reset at `:94` ignores timeLimit; mock.ts has 120/180/150 at `mock.ts:234,247,260`). (b) none. (c) UI only; per-question timeLimit from the generator. (d) S. (e) none; time-out must not auto-score unsaved text.
- Rubric scoring with verified quotes. (a) `page.jsx:69-88` (setTimeout, literals `:78-84`), weights text `:230`, card `:248-301`. (b) none; submitQuiz `Interview.js:145` is MCQ only. (c) `scoreOpenAnswer`: zod rubric; each quote must be a substring of the typed answer (locateQuote pattern `ResumeParser.js:595`); feedback through inventedNumbers; `fast`; one call per answer. (d) L. (e) D26 quotes verbatim; label as AI estimate; a 10-question session is about 11 capped calls.
- Weak areas by topic. (a) `page.jsx:359-372` (literal). (b) improvementTip only (`Interview.js:142`), no topic. (c) topic in question zod; aggregate across the user's scored open answers, no AI; MCQ rows excluded. (d) M. (e) only topics with real scored answers.
- Total: L x1, M x2, S x2.

### 11.2 Roadmap (`tools/roadmap`)
- Weekly grouped checklist. (a) `page.jsx:81-131` (MOCK_WEEKLY_ROADMAP, `mock.ts:271`). (b) flat steps (`schemas.js:53`), grouped only by `RoadmapDetailView.jsx:154-160`. (c) UI grouping from timeline.phaseBreakdown (S), or weeks[] in roadmapSchema plus regenerate (M). (d) M. (e) week counts labelled AI estimate.
- Task toggle with undo. (a) `page.jsx:30-38,128-131` (local state, lost on reload). (b) complete-only: `completeRoadmapStep` `CareerRoadmap.js:281`; updateRoadmapProgress `:247` ignores progress. (c) `setRoadmapStepDone(id, stepId, done)` with owner check; undo calls it with the old value. (d) S. (e) no unsaved toggles; failed save reverts.
- "Closes gaps for" companies. (a) `page.jsx:115-123` (closedFor literals, `mock.ts:276,289,302`). (b) none. (c) needs job targets per D18 (ATSScore, cover letters, cold emails; company and role, deduped); step sourceIds point to JD lines. (d) M. (e) claim only where the stored JD names the gap; needs a real job target (D18).
- Gaps ranked by frequency. (a) `page.jsx:22-28,197-207` (literal counts), copy `:182`. (b) none; missingSkills stored per run (`schema.prisma:336`); getATSAnalytics `ResumeParser.js:493` does not select it. (c) new read-only action: count missingSkills across the user's ATSScore rows, normalised, no AI. (d) M. (e) counts from real rows only; show how many results were counted.
- Total: M x3, S x1.

### 11.3 Storing open sessions (no migration unless noted)
- QuizSession.questions is Json (`schema.prisma:395`). Put open items in the same array with `type: "open"` per item; legacy items have no type and mean MCQ. Keeps the `Array.isArray` check (`Interview.js:162`) working. Answers and rubric results go back into the item, so server-only fields stay server-side. submittedAt marks the whole session, so each answer needs its own save.
- Assessment (`schema.prisma:41`) can hold rubric results without a migration: category "open", per-answer objects in questions[]. Caveat: getAssessments (`Interview.js:232`, used by `interview/page.jsx:18`) returns every row, so filter by category. Add a new InterviewAnswer model (M, one migration) only if weak-area queries get slow.

### 11.4 Coexistence with MCQ (keep it)
- Keep generateQuiz `Interview.js:26`, submitQuiz `:145`, Quiz.jsx and `/interview/mock`. Open flow gets its own actions and route (for example `/interview/practice`). getAssessments and PerformanceChart filter by category. improvementTip (`:142`) serves both.

### 11.5 Retirement touch list (last previews)
- Delete `src/app/(main)/(gated)/tools/` (both pages; layout banner `:23`, REAL_ROUTES `:7-10`). Delete `src/lib/mock.ts` (MOCK_PROFILE `:141`, MOCK_CHAT_PROMPTS `:222`, MOCK_ATS_REQUIREMENTS `:313` have no importers already).
- `AppSidebar.jsx` previews array `:49-51`, groups `:151-160` and `:253-258`. `src/middleware.js:12` `/tools(.*)` after redirects land.
- Landing: `src/app/page.js:70,94` hrefs, footer `:616,619`, jobsData demo `:22-50` and "live interactive demo" `:218-224`. Dashboard and chat have no /tools links. Scripts: `scripts/capture_screenshots.js:17,20`, `scripts/capture_via_cdp.js:16,19`.
- Redirects to add in `next.config.mjs:15-22`: `/tools/interview` to `/interview`, `/tools/roadmap` to `/roadmap`, and `/tools` (no index today) to a chosen page. Size S.

### 11.6 Fake data outside /tools (grep: mock, sample, names, numbers)
- `src/app/page.js:22-50,218-224`: hard-coded job demo with match % (`:33,41,49`), unlabelled. Replace with real data or drop.
- `src/components/shared/ResumePaperDoc.jsx:12-46`: fixed company "Razorpay" and metric bullets; only "Sample" at `:75`; used at `page.js:253`.
- `src/components/landingPage/PricingSection.jsx:75`: "Unlimited AI Credits", "1-on-1 AI Career Coaching" conflict with the cap (D30). `src/app/page.js:77,85`: copy does not match the product (see §8.12).
- `src/components/MicroAnimation.jsx:372-377` "60%" decorative. `ResumeBuilder.jsx:607` template thumbnail sample contact (low). Dead after retirement: mock.ts exports (§11.5).
- Phase 6 totals: features L x1, M x5, S x3; retirement S x1; total L x1, M x5, S x4.
