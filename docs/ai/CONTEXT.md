# CONTEXT: ai-career-buddy (AscendAI)

Scout map, 2026-11-17, branch `phase-5` (Phase 4 done: `46e2af0..5c2bdc1`). Read-only. Repo-relative paths. Env values never read.

## 1. Stack
- Next.js ^15.5.9 App Router, JavaScript, standalone output, server action body 10mb. React 19.1, Tailwind 4, Radix/shadcn (`src/components/ui`), sonner, `@uiw/react-md-editor` (letter/email preview), jspdf (resume PDF, `ResumeBuilder.jsx:54`).
- Forms: react-hook-form + zod ^4 (`src/app/lib/schema.js`). Server zod for AI output (`src/lib/ai/schemas.js`). Clerk ^6.31.10 (`src/middleware.js:4-15`); server code calls `auth()`.
- DB: PostgreSQL, Prisma ^6.16.2, 9 migrations. Not confirmed applied: `20261117000000_ai_usage`, `20261117010000_quiz_session`, `20261118000000_phase3_sources` (D22: owner applies). Phase 4 added no migration.
- AI: `@langchain/core` + `@langchain/google-genai` behind `src/lib/ai/`. PDF text: `unpdf` (pure JS). `openai` installed, unused. Background jobs: none (`@upstash/qstash`, `resend` unused); all AI runs inline. Docker: multi-stage, node:20, `prisma migrate deploy` then `server.js`.

## 2. Folder map
- `src/app/(auth)/`, `src/app/page.js` landing (tool cards `:55-102`, footer `:615-620`), `src/app/chat/` (outside gate).
- `src/app/(main)/(gated)/`: feature pages; `layout.jsx:13` onboarding gate; `resume/` (ResumeBuilder + `_components/` TailorPanel, VersionsPanel, MatchCard, ResumeToolsPanel); `resume-parser/` (AtsHistory, AtsResult); `tools/` six previews on `src/lib/mock.ts` (§11.5).
- `src/app/api/chat/route.js`: only API route (SSE). `src/actions/`: "use server" actions.
- `src/lib/ai/`: `index.js` (runAI*, cap check), `tasks.js`, `providers.js`, `keys.js`, `log.js`, `limit.js` (daily cap), `schemas.js`, `chatContext.js`, `sources.js` (catalog, id checks), `paragraphs.js`, `pdf.js`, `numberCheck.js`.
- Phase 4: `src/lib/match.js` (D37 keyword match, no AI), `src/lib/ats/weights.js` (level weights, read by prompt and UI), `src/lib/entryIds.js` (legacy entry ids, shared client/server). `src/components/shared/`: SourceChips.jsx, generationError.js, ResumePaperDoc.jsx, AppSidebar.jsx. `scripts/selfcheck-matching.mjs`: node self-check.

## 3. Features
| Feature | Page(s) | Server action / API (line) | AI call (path:line) |
|---|---|---|---|
| Resume builder | `/resume` tabs tailor, template, form; `/tools/resume` preview | saveResume `Resume.js:106`, getResume `:153`, improveWithAI `:215`, duplicateResume `:335`, computeMatch `:669`, tailorResume `:737`, saveTailoredVersion `:888`, list/save/get/restore version `:507/:556/:586/:619` | `Resume.js:277` improve; `:822` tailor |
| ATS scan | `/resume-parser` (form, AtsHistory, AtsResult); `/tools/ats` preview | createATSAnalysis `ResumeParser.js:277`, getUserATSScores `:348`, getATSScoreById `:396`, deleteATSScore `:422` (no UI), getATSAnalytics `:454` (no UI), updateATSScore `:509`, proposeAtsFix `:635`, applyAtsFix `:753` | `:212` scoreResume (fast); fix `:702` (write) |
| Cover letter | `/cover-letter` (+new, [id]); `/tools/cover-letter` | generateCoverLetter `CoverLetter.js:22`, list `:100`, get `:120`, delete `:138`, updateCoverLetter `:165` | `CoverLetter.js:76` to `paragraphs.js:48` |
| Cold email | `/cold-email` (+new, [id]); `/tools/cold-email` | generateColdEmail `ColdEmail.js:23`, list `:100`, get `:120`, delete `:138`, updateColdEmail `:165` | `ColdEmail.js:76` to `paragraphs.js:48` |
| Career roadmap | `/roadmap`, `/roadmap/[id]`; `/tools/roadmap` | generateCareerRoadmap `CareerRoadmap.js:20`, updateRoadmapProgress `:247` (ignores progress), completeRoadmapStep `:281`, generateProgressRecommendations `:338` (no UI) | `:149` write, zod; progress text `:377` |
| Interview prep | `/interview`, `/interview/mock`; `/tools/interview` | generateQuiz `Interview.js:26`, submitQuiz `:145`, getAssessments `:232` | `:81` fast, zod; tip `:142` (from `:123`) |
| Dashboard, chat, onboarding | `/dashboard`, `/chat`, `/onboarding` | getDashboardData `Dashboard.js:12`; updateUser `User.js:9`; POST `/api/chat` `route.js:25` | chat `route.js:64` write 0.2, zod; others none |
| Industry insights | none (FAQ says so, `src/data/faqs.js:13-15`) | none | none; zero rows only (`User.js:21-42`) |

## 4. Prisma models (`prisma/schema.prisma`)
- `User` (:11): clerkUserId, email `String?` @unique, industry `String?` FK to IndustryInsight (:17-18), experience `Int?` (:23), bio, skills[]. Owns most rows.
- `Resume` (:55, one per user): form JSON (content, templateId, contactInfo, summary, skills, experience/education/projects Json[]). `ResumeTemplate` (:89, usageCount).
- `ResumeVersion` (:129): jobTitle, companyName, jobDescription, matchPercentage, atsScore, tailoredContent = JSON envelope `{kind: version|draft|legacy, label, content, applied, proposals}` (no migration). Drafts purged after 24 h (`Resume.js:514-523`).
- `CoverLetter` (:146), `ColdEmail` (:353): content, jobTitle, companyName, status, **sources Json?** (:155, :362; migration phase3).
- `CareerPath` (:162): steps Json (sourceIds + source snapshot), milestones, resources, timeline, progress.
- `ATSScore` (:323): scores, strengths/weaknesses (text), recommendations Json[], missingSkills, jobDescription, **evidence Json?** (:338; migration phase3): sourced strengths/weaknesses/recommendations, requirements, candidateLevel, **resumeText** (full PDF text, server-only), previousScoreId, appliedFix.
- `Assessment` (:41), `QuizSession` (:384): questions Json incl. correctAnswer; unsubmitted rows older than 7 days pruned (`Interview.js:92-100`).
- `AiUsage` (:369): userId (no relation), task, model, ok; read by the daily cap.
- `IndustryInsight` (:294): zero rows only (§11.6). Unused: MockInterview :207, SkillGapAnalysis :180, PracticeSession :238, CareerGoal :263.

## 5. How AI is called now
Only path: `src/lib/ai/index.js`. `runAI` checks the cap when userId is set (`:56-59`: "over" gives AI_LIMIT, "unavailable" gives AI_UNAVAILABLE), walks `AI_ROUTE_<TASK>`, rotates keys, 90 s timeout (`:7`). Tasks: fast temp 0, write temp 0.4. Every attempt writes AiUsage. Google only.
| Call site | Task | Output validation |
|---|---|---|
| `Resume.js:277` improveWithAI | write | numberCheck, one retry, INVENTED_DETAIL (`:286-294`); sources = input |
| `Resume.js:822` tailorResume | write | tailorSchema; entryId#bulletIndex must be a real bullet; jd id required; numberCheck; retry `:827`; proposals kept in a server draft |
| `ResumeParser.js:212` scoreResume (create, apply re-score) | fast; weights text from `weights.js` | atsSchema; quotes checked in stored PDF text (`:33`); requirements (`:65`); retry `:234` |
| `ResumeParser.js:702` proposeAtsFix | write | atsFixSchema; original line from stored text; jd id; numberCheck (`:621`); retry `:711` |
| `paragraphs.js:48` (CoverLetter.js:76, ColdEmail.js:76) | write | paragraphsSchema; each paragraph needs a valid sourceId; one retry; NO_SOURCES if none |
| `Interview.js:81` generateQuiz | fast 0.3 | quizSchema; bad answers dropped |
| `Interview.js:142` tip | write | none; failure ignored |
| `CareerRoadmap.js:149` | write | roadmapSchema; sourceIds checked; unsourced steps dropped; retry |
| `CareerRoadmap.js:377` progress text | write | none; no UI caller |
| `route.js:64` chat | write 0.2 | chatOutputSchema; cards resolved server-side |

## 6. Env (names only, `.env.example`)
- DATABASE_URL(_DOCKER), Clerk keys, GEMINI_API_KEY(S), AI_ROUTE_FAST/WRITE, AI_DEBUG.
- AI_DAILY_LIMIT: unset = 50 (D30), "0" = off. Production fails closed when AiUsage is unreadable (D33, `limit.js:31-33`); dev fails open with one warning.
- ATS_FIX_SIGNING_SECRET (Phase 4, D39): HMAC key for 1-click fix tokens, at least 32 chars (`ResumeParser.js:582-596`). Missing in production: fixes return FIX_UNAVAILABLE. Dev: ephemeral key, tokens die on restart.

## 7. Build and run
- `npm run dev|build|start|lint`; local DB `npx prisma migrate dev`; Docker `docker compose up --build -d`, port 3000. Phase 4 added no migration; the three in §1 still gate deploy.

## 8. Top problems (open, ranked)
1. HIGH: Deploy gate. Missing `AiUsage` now blocks every AI call in production (`limit.js:31-33`, `index.js:58-59`). Missing `ATSScore.evidence` breaks ATS create, fix and re-score (`ResumeParser.js:327`, `:860`). Missing `sources` breaks letter and email saves (`CoverLetter.js:81`, `ColdEmail.js:81`). Apply all three before deploy.
2. MED (privacy): full resume text is stored at rest in `ATSScore.evidence.resumeText` (`ResumeParser.js:252`). No UI can delete a result (`deleteATSScore` `:422` has no caller). Retention is undecided.
3. MED: One fix cycle can spend up to 6 capped AI calls: tailor 2 (`Resume.js:822-827`), propose 2 (`ResumeParser.js:702-711`), re-score 2 (`:212-234`). Cap is 50 per day, and retries count.
4. MED: `updateUser` writes skills, experience and bio without zod (`User.js:53-56`). It also creates an IndustryInsight row for any industry string (`User.js:21-42`).
5. MED: Letter and email sources map by paragraph index after an edit. `ParagraphSources` checks only the paragraph count (`SourceChips.jsx:81-82`), so same-count edited text shows wrong chips (`CoverLetterPreview.jsx:192`, `ColdEmailPreview.jsx:180`).
6. MED: Previews make unsupported claims until retired: "65%+ open rate" (`tools/cold-email/page.jsx:140`), "pip will notify your dashboard" (`:203`), invented ATS bullet (`tools/ats/page.jsx:49`), "3 years exp" literal (`:163`).
7. LOW: Cross-instance double apply can spend one extra capped re-score (`ResumeParser.js:761-762`; lock `:836-837`).
8. LOW: Legacy entry ids use array index (`entryIds.js:20`). Deleting an entry renumbers later legacy ids, so pending proposals return RESUME_CHANGED (`Resume.js:926-929`).
9. LOW: Word targets disagree. Cold email 120 (`tools/cold-email/page.jsx:42`) vs 100-140 (`ColdEmail.js:55`). Cover letter 250-320 (`tools/cover-letter/page.jsx:167`) vs 250-350 (`CoverLetter.js:57`).
10. LOW: `usageCount` increments on every save and restore (`Resume.js:136`, `:643`), so template sort is save count.
11. LOW: No caller or UI: `generateProgressRecommendations` (`CareerRoadmap.js:338`), `getATSAnalytics` (`ResumeParser.js:454`). `updateRoadmapProgress` ignores progress (`CareerRoadmap.js:247`).
12. LOW: Landing FAQ promises "industry-specific insights" (`src/data/faqs.js:5`), but no insight feature exists (D9).
13. LOW: Dead code: `components/SideBar.jsx`, `components/Header.jsx`, `lib/checkUser.js`. Unused deps: `openai`, `resend`, `@upstash/qstash`, `react-markdown`, `@react-pdf/renderer`, `@tabler/core`, `html2pdf.js`, `@clerk/themes`. No root `error.jsx` or `not-found`.

## 9. Frontend notes
- Sidebar main nav uses real routes (`src/components/shared/AppSidebar.jsx`). Previews group `:49-56`, render `:158-160` and `:257-259`. Middleware protects `/tools` (`src/middleware.js:12`).
- `/resume`: Tabs in `ResumeBuilder.jsx:532` (tailor `:559`, template, form). `ResumeToolsPanel.jsx:16-18` renders MatchCard, TailorPanel (accept or strike per bullet) and VersionsPanel (list, save, restore). Restore reloads the page (`VersionsPanel.jsx:152-153`).
- `/resume-parser`: ResumeParserForm (`:147` opens a result, `:131` re-run prefill), AtsHistory (list, re-run), AtsResult (score, LevelAndWeights, RequirementChecklist, WeaknessFix propose and accept).
- Shared: `generationError.js` maps NO_SOURCES, AI_LIMIT, AI_UNAVAILABLE, FIX_UNAVAILABLE, ALREADY_APPLIED, NEEDS_REUPLOAD, STALE, NOT_RESTORABLE. Edits save via `updateCoverLetter` and `updateColdEmail`. State is local `useState`; no skeletons on list pages; `loading.jsx` only at root and `(main)`; no root error boundary.

## 10. Backend notes
- Every feature is a "use server" action, owner-scoped by user.id. Phase 4 actions throw on no auth; generators and fixes return `{error, code}`. `getResume` still throws.
- Trust pattern: AI output carries sourceIds or quotes, checked against the catalog (`sources.js:121`) or stored PDF text (`ResumeParser.js:33`). Tailoring and fixes take ids or signed tokens from the client, never proposal text. Drafts are server-side (`Resume.js:845-858`); fix tokens are HMAC-signed (`ResumeParser.js:600-618`), and apply re-checks the line in stored text.
- Transactions: draft swap (`Resume.js:845`); fix apply uses `pg_advisory_xact_lock` and a re-check (`ResumeParser.js:836-849`). Versions and fixes never write `Resume` or the old ATS row; only saveResume (autosave, restore) writes `Resume`.
- AI runs synchronously. No queue, jobs or pagination (versions `take:100`, ATS history `take:50`, `ResumeParser.js:360`).

## 11. Phase 5 inputs
Scope: parity for cover letter, cold email, interview and roadmap (Resume and ATS done in Phase 4), then retire `/tools/*` (D17, D25). Per item: (a) preview file:line, (b) real route today, (c) backend work, (d) S/M/L, (e) trust conflict. D34 (cold email migration) and D35 (mailto on explicit click) are recorded for later.

### 11.1 Cover letter (`tools/cover-letter`). Save edits: DONE (`updateCoverLetter` `CoverLetter.js:165`), but sources are not re-mapped (§8.5).
- Tone selector. (a) `page.jsx:21,139-158`. (b) no tone input (`CoverLetterGen.jsx:100-133`). (c) `tone` enum in `CoverLetter.js:13` + prompt line. (d) S. (e) a switch is a new AI call; facts stay sourced.
- Regenerate, more formal. (a) `page.jsx:194-205`. (b) none. (c) reuse generateCoverLetter; needs a replace path or rows pile up. (d) S. (e) each click counts against the cap.
- Shorter (-60 words). (a) `page.jsx:73-84,188-193` (fake, drops paragraph 2). (b) none. (c) `rewriteParagraph(id, idx)` keeping stored sourceIds; numberCheck. (d) S. (e) keep sourceIds.
- Word count, one range (250-320 vs prompt 250-350 `CoverLetter.js:57`). (a) `page.jsx:91,166-168`. (b) none. (c) UI-only. (d) S. (e) none.
- Flagged clichés. (a) `page.jsx:226-254` (static). (b) none. (c) deterministic phrase check on saved text, no AI. (d) S. (e) examples are fake.
- Total: S x5, M x0, L x0.
### 11.2 Cold email (`tools/cold-email`). Save edits: DONE (`updateColdEmail` `ColdEmail.js:165`).
- Recipient name, role, email. (a) `page.jsx:21-23,96-136`. (b) none (ColdEmailGen takes company, title, JD). (c) D34 migration: 3 optional columns. (d) M. (e) email typed by the user only, never AI or profile.
- Subject line. (a) `page.jsx:24,140-147` (open-rate claim `:140`). (b) prompt forbids a subject (`ColdEmail.js:58`). (c) generated, then stored via D34 migration. (d) M (S if not stored). (e) drop the open-rate claim.
- Follow-up reminder. (a) `page.jsx:25,187-205` (promise `:203`). (b) none. (c) D34 `followUpAt` + dashboard due list (S read). (d) M. (e) reminder only; never sends (D34).
- Open in mail client. (a) `page.jsx:49-55,216-221` (mailto). (b) none. (c) UI-only; explicit click, typed address (D35). (d) S. (e) no auto-open; long bodies truncate.
- Live word counter (target 120 vs 100-140 `ColdEmail.js:55`). (a) `page.jsx:41-42,158-170`. (b) none. (c) UI-only, one target. (d) S. (e) none.
- Matched-project highlight. (a) `page.jsx:175-184` (UrbanPiper literal). (b) paragraph chips (SourceChips.jsx). (c) UI-only: highlight paragraphs whose sources hit `proj:` ids. (d) S. (e) none.
- Total: M x3 (one D34 migration), S x3.
### 11.3 Interview (`tools/interview`). Phase 4: AI_UNAVAILABLE copy only.
- Open-ended questions, one at a time, typed answers. (a) `page.jsx:21-33,139-165,213-224`. (b) MCQ only (`Interview.js:26`). (c) `generateOpenQuestions`, zod, sourceIds per question; QuizSession.questions with a type flag (no migration). (d) M. (e) each question cites a JD line or profile skill.
- Voice record. (a) `page.jsx:24,53-64,181-209` (hardcoded transcript `:57`). (b) none; hook used only by resume (`AITextarea.jsx:13`). (c) UI-only; editable transcript before scoring. (d) S. (e) no audio upload; server STT would store audio.
- 120 s timer per question. (a) `page.jsx:27,36-51,94` (reset ignores timeLimit). (b) none. (c) UI-only. (d) S. (e) none.
- Rubric scoring (30/40/30). (a) `page.jsx:66-87,230,248-301` (literals `:78-84`). (b) MCQ scoring only (`submitQuiz` `Interview.js:145`). (c) `scoreAnswer`: zod rubric; quotes checked against the answer (pattern `ResumeParser.js:33`). (d) L. (e) label as AI estimate; quotes verbatim.
- Weak areas from practice. (a) `page.jsx:356-375` (literal). (b) improvementTip `Interview.js:142`; no topic. (c) `topic` in quiz zod + prompt; aggregate wrong answers. (d) M (S-M). (e) real answers only.
- Total: L x1, M x2, S x2 (typed answers fold into open questions).
### 11.4 Roadmap (`tools/roadmap`). Phase 4: none.
- Weekly grouped checklist. (a) `page.jsx:81-162` (MOCK_WEEKLY_ROADMAP). (b) flat steps; phaseBreakdown (`RoadmapDetailView.jsx:154-160`). (c) UI grouping, or `weeks[]` in roadmapSchema. (d) M (S-M). (e) week counts labelled AI estimate.
- Task toggle with undo. (a) `page.jsx:30-38,131` (local, not saved). (b) complete-only (`completeRoadmapStep` `CareerRoadmap.js:281`). (c) `setRoadmapStepDone(id, stepId, done)`, owner check. (d) S. (e) no unsaved toggles.
- Closes gaps for companies. (a) `page.jsx:110-123` (closedFor mock). (b) none. (c) needs saved job targets (D18); JD ids as sources. (d) M. (e) claims cite pasted JD lines.
- Gaps ranked by frequency. (a) `page.jsx:22-28,187-216` (literal counts). (b) none; missingSkills stored per ATS run (`ResumeParser.js:325`). (c) read-only aggregate over ATSScore, no AI. (d) M. (e) counts from real rows only.
- Total: M x3, S x1.
### 11.5 Retirement readiness: `/tools/resume` and `/tools/ats`
- `/tools/resume`: covered in `/resume` (tailor with accept or strike, match %, versions with restore, sources for accepted edits, PDF). Missing: nothing required. Total: 0.
- `/tools/ats`: covered in `/resume-parser` (re-run upload, score history, requirement checklist, 1-click fix with real re-score, level and weights). Missing: "3 years exp" (`tools/ats/page.jsx:163`); the real route shows level only. `User.experience` (`schema.prisma:23`) can show years, no AI. Optional: history is a flat list, not per job. Total: S x1 (+ optional S).
- Retire touch list: delete `src/app/(main)/(gated)/tools/` (6 pages + `layout.jsx`, banner `:27`); delete `src/lib/mock.ts` (only tools import it); `AppSidebar.jsx` previews `:49-56`, render `:158-160`, `:257-259`; `src/app/page.js` tool hrefs `:62,70,78,86,94,102` and footer `:615-620` (keep ResumePaperDoc import `:253`); `src/app/(main)/(gated)/resume/page.jsx:31`; `src/middleware.js:12`; `scripts/capture_screenshots.js:16-21`; `scripts/capture_via_cdp.js:15-20`. Keep `src/components/shared/ResumePaperDoc.jsx`. Optional `/tools/*` redirects (none today, S). Size S-M.
### 11.6 Industry insights (D9)
- Schema (`schema.prisma:294-322`): IndustryInsight keyed by unique `industry`; salaryRanges, growthRate, demandLevel, topSkills, marketOutlook, keyTrends, recommendedSkills, jobAvailability, hiringTrends, remoteWorkPercentage, hybridWorkTrends, lastUpdated, nextUpdate. No source fields. `User.industry` is an FK (`:17-18`).
- Current state: zero rows only, written on each industry save with nextUpdate +365 days (`User.js:21-42`). No route, no UI, no AI. FAQ `faqs.js:13-15` says no reports yet (D31 done); `faqs.js:5` still promises industry insights (§8.12).
- Minimal sourced version (M): owner curates 3-5 sources per industry (URL, title, date) in repo; migration adds `sources Json`, `generatedAt`, `model`, and makes growthRate and demandLevel nullable so zero rows read as "no data"; one action reads the cache, refreshes on read when nextUpdate passes via runAI write, and verifies quotes like ATS (`ResumeParser.js:33`); one `/insights` page with sources and "last updated"; restore the FAQ promise only when shipped (D31). Not minimal (L): live web search or model grounding, scheduled refresh (no job runner exists). An LLM alone is not a source: unsourced numbers must not render.
- Total: M x1 (minimal), L x1 (live).
