# Redesign audit: current app vs happy flow

Target: design/ascendai-happy-flow.html (scenes 1–7). Branch: redesign-happy-flow.
Source: scout pass, 2026-11-23. See CONTEXT.md for stack, QUESTIONS.md for decision details.

## Per-step verdicts

| Step | Verdict | Matches | Gaps |
|---|---|---|---|
| 1 Onboarding | partial | drag-drop, editable chips, two tap questions (OnboardingFlow.jsx:340-349, :409-495, :472-515) | five phases, not one screen (OnboardingFlow.jsx:80); ring only on last step (:45-75, :529) |
| 2 Home | partial | single input, intake, needs-you, applications with next action, weekly tasks (DashboardView.jsx:305, :404-449, :452+, :603-660) | job opens by navigation, not in-place card (:251); no bot status; six tool cards still on home (:171-228); scene is time-of-day, not progress (:148-167); home calls getDashboardData + getNeedsYou, both derive needs-you (:92-95) |
| 3 Bots working | partial | four steps, Pip avatars (PipelineProgress.jsx:9-14) | results are text, not chips (:34-45); no "you can leave"; run stops when page closes (JobView.jsx:45-79) |
| 4 Review | partial | tracked lines with sources, per-line accept/reject/edit, accept all (TrackedChanges.jsx:26-124, TailorReview.jsx:130-147) | no "0 things invented"; no undo on accept (TailorReview.jsx ~55-80); requirement list on separate page, Matched/Gap only, no partial or roadmap link (AtsResult.jsx:41-67) |
| 5 Track | partial | kanban, drag, next-action chip (ApplicationsBoard.jsx:19-25, :53-59, :94-102); follow-up draft (NeedsYouQueue.jsx:254-266) | mark applied takes two taps through a menu (:73-91); no quiet-5-days badge (derive.js:58-60); approve and copy are separate |
| 6 Interview | partial | voice, timer, quoted rubric (practice/page.jsx:25-40, :66-81; RubricCard.jsx) | no waveform; projects never used as source (Practice.js:113-127); weak spots not saved to plan (WeakAreas.jsx read-only) |
| 7 Offer | missing | status button, congrats line (StatusActions.jsx:118, :153) | no offer card, compare or negotiation draft; no night sky or confetti; rejection gaps go to roadmap, not next week (Applications.js:420-460) |

Other surfaces:
- Chat with Pip: matches (ChatSlideOver.jsx, chat route.js:25)
- ⌘K menu: matches (CommandMenu.jsx:53)
- Six tools: present, partial (form-heavy, old style)
- Landing: partial (app/page.js)
- Loading/error states: present on most routes
- Mobile at 390px: not checked yet

## Forms (24 surfaces, ~70 typed fields)

| Form | Typed fields | Location |
|---|---|---|
| Cold email generate | 6 | ColdEmailGen.jsx:112-191 |
| Cold email preview | 4 + date + editor | ColdEmailPreview.jsx:235-334 |
| Resume builder | 6 + 2 per social row | ResumeBuilder.jsx:775-909 |
| EntryForm (x3 uses) | 5 each | EntryForm.jsx:188-302; ResumeBuilder.jsx:973-1021 |
| Create roadmap modal | 4 | CreateRoadmapModal.jsx:191-252 |
| Tailor panel | 4 | TailorPanel.jsx:126-159 |
| ATS parser | 3 | ResumeParserForm.jsx:225-248 |
| Cover letter generate | 3 | CoverLetterGen.jsx:113-145 |
| Versions panel | 3 | VersionsPanel.jsx:194-196 |
| Interview practice | 3 | practice/page.jsx:232-295 |
| Job fields | 3 | JobView.jsx:250 |
| Home input | 1 | DashboardView.jsx:305 |
| Mock interview | 1 | mock/page.jsx:78 |
| Skills dialog | 1 | SkillsDialog.jsx:47 |
| Settings confirm | 1 | SettingsView.jsx:80 |
| Applied date | 1 | ApplicationsBoard.jsx:34 |
| Status date | 1 | StatusActions.jsx:184 |
| Tailor line edit | 1 | TrackedChanges.jsx:65 |
| Letter edit | 1 | LetterReview.jsx:171 |
| Match card | 1 | MatchCard.jsx:95 |
| Chat | 1 | ChatSlideOver.jsx:258 |
| Command search | 1 | CommandMenu.jsx:141 |
| Onboarding chips (x6) | 1 each | EditableChips.jsx:19 |

Also: 4 JobStart selects, 3 file inputs, 4 checkboxes.

## Backend

Exists: intake with auto-create of job + application (Jobs.js:83-163), SSRF-guarded fetch, pipeline state with CAS (Pipeline.js:28-34), derived needs-you (needsYou.js), undo for status moves and letters, resume restore (Resume.js:555).

Missing:
- background runner so bots continue after the tab closes; notifications (no table, email or push)
- undo wiring for tailor accept
- projects as an interview question source
- offer compare and negotiation draft action
- weak spot → plan write
- "next week" dates on roadmap/task steps
- invented-claims count returned to UI (numberCheck exists)
- demo seed data (seeder has templates only)
- single home-state endpoint (needs-you is derived twice)

## Top risks
1. HIGH: "you can leave, we'll notify you" is false today (JobView.jsx:45-79).
2. MED: interview ignores projects (Practice.js:113-127).
3. MED: tailor accept has no undo.

## Forms after (task 13)

Typed fields per form, before then after. "with job" = a job picked (chip or `?job=<id>`); "standalone" = no job. Every tool still works standalone from the sidebar.

| Form | Before | After |
|---|---|---|
| Cover letter generate | 3 (company, title, JD) + tone | with job 0; standalone 1 (JD), company and role optional; tone is chips |
| Cold email generate | 6 | with job 0; standalone 1 (JD); company, role and 3 recipient fields optional under "more" |
| Cold email preview | 4 + date + editor | 0 by default (recipient and subject shown as a summary, follow-up as date chips); fields behind "edit"; editor unchanged |
| Resume builder contact | 4 + 2 per social row | 0 when name, email, phone are prefilled (chips); linkedin and links under "more"; link platform is a quick-add chip |
| EntryForm (x3) | 5 + checkbox | 3 (title, org, description); dates and "currently here" under "more" |
| Create roadmap modal | 4 | 0 when profile is filled (editable chips, timeline chips); 3 inputs only if the profile is empty |
| Resume scan (ATS) | 3 + PDF | with job 0 and saved resume chip; standalone 1 (JD) + PDF only if no saved resume |
| Quick quiz skills | 1 (comma text) | 0 (profile skills as chips, optional add) |
| Letter review (needs-you) | 1 | 1 (restyle only) |
| Interview open practice | 3 | restyled earlier (task 11) |

Not changed: tailor panel, versions panel, job fields, roadmap detail page (outside the six tool screens).
