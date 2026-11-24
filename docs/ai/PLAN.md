# PLAN: Happy-flow redesign

Branch `redesign-happy-flow`. Inputs: docs/ai/REDESIGN-AUDIT.md, docs/ai/CONTEXT.md, design/ascendai-happy-flow.html (scenes 0–8, `renderScene(i, t)`), design/ascendai-pixel.html (PixelScene generator, landing/dashboard style).

Owner decisions (2026-11-23):
- D-HF1 bots keep running server-side after the user leaves (resume from saved pipeline state).
- D-HF2 notifications are in-app only (table, bell, toast, needs-you item). No email/push.
- D-HF3 voice answers use browser speech recognition, with a live waveform from the mic level and a text fallback.
- D-HF4 the six tools leave home and are reachable from the sidebar, ⌘K and contextual links on each job.
- From the spec: one-screen onboarding, pasted job shows as an in-place card, undo instead of confirm, interview questions from job + projects, bot status on home, full offer screen (compare + negotiation draft).

Rules: never touch `.env` or real data; never remove a feature (dark theme stays: derive dark tokens from the palette); copy lowercase, short, no hype, no emoji; pastels only inside scenes; respect prefers-reduced-motion; every screen has loading (Skeleton + PipStatus), empty (Pip + one action) and error (retry) states; works at 390px with touch.

Per-screen loop (frontend tasks 3–13): screenshot the matching reference scene at 2–3 moments → build → run with seed data → Playwright screenshots at 1440 and 390 → compare side by side in `docs/ai/shots/<screen>/` → fix layout, spacing, type and motion → lint + build → commit.

---

## Tasks

### 1. BACKEND: foundations for the flow
- Demo seed script (`npm run seed:demo`): one user with a parsed resume, 4 applications across stages, one finished pipeline run, one quiet-5-days application, one offer. Writes only to the dev database.
- `GET /home-state` (or a server action) returning progress stage (dawn/noon/sunset/night), needs-you, applications with next action, the week's tasks and bot status in one call. Needs-you is derived once.
- `Notification` model + migration; list/mark-read actions.
- Generic undo: accept/restore helpers that return an undo token (tailor accept uses the existing resume restore, Resume.js:555).
**Test:** seed runs on a clean dev db; unit tests for home-state stage mapping and undo round-trip; `npm run build`.

### 2. FRONTEND: design system + components
Tailwind theme tokens (bg #FBFAF7, panel #FFF, soft #F4F2EC, line #ECEAE4, text #23222B, muted #6D6B75, faint #A8A6AE, accent #2F9E77 / soft #E3F4EC / ink #1E7356, warn #FFF4CC/#8A6A00, gap #FDE7EE/#B23A62, dark variants); next/font Geist, Pixelify Sans, Newsreader; radii 18–20 / 9 / pill.
Components in `src/components/ui`: PixelScene (9 variants, seeded, crisp, redraw on resize, ported from design/ascendai-pixel.html), AppWindow, StepCaption, PipAvatar (6 outfits, hop), PipStatus, Chip (inline edit/remove/add), ProgressRing, BotStepList, TrackedChangeDoc, KanbanBoard (drag + tap), UndoToast, Confetti, EmptyState, Skeleton.
Add a dev-only `/dev/ui` gallery page showing every component and state.
**Test:** `/dev/ui` screenshots at 1440/390 next to scene stills; keyboard focus visible on Chip/Kanban; reduced-motion disables hop/sweep/confetti; lint + build.

### 3. FRONTEND: app shell
Sidebar (home, applications, interview, roadmap, the six tools, settings), ⌘K entries for every tool and flow step, notifications bell, chat slide-over restyled. Mobile: bottom bar + drawer.
**Test:** every route reachable by sidebar and ⌘K at 1440 and 390; bell shows seeded notifications.

### 4. FRONTEND: onboarding (scene 1)
One screen: drop zone (click works too) → PipStatus detective "reading…" → chips for skills, projects and roles, filling a ProgressRing → two tap questions (target role, stage) → one suggested next step ("connect github"). Replaces the five phases in OnboardingFlow.jsx; keeps the existing parse action.
**Test:** sign up a fresh user, upload a sample resume, edit/remove/add a chip, reach home with ≤2 taps of questions and 0 typed fields; compare against scene 1.

### 5. BACKEND: intake + server runner
- Intake accepts a URL, pasted text or a question, and classifies it (URL/job text → extract job + auto-create application; question → chat). Return chips: company, role, location, requirement count.
- Server-side pipeline runner (checker → tailor → writer → connector): kicked off on intake, resumable from Pipeline CAS state, idempotent per step; the next visit or a cron route picks up stalled runs. Writes a Notification on finish or failure.
- Results per step returned as chip-ready data; tailor returns an invented-claims count (from numberCheck).
**Test:** paste a seed job URL, close the tab, reopen: the run completed and a notification exists; unit tests for classification and step idempotency.

### 6. FRONTEND: home + paste job (scene 2)
PixelScene background from progress stage; one input ("paste a job link, or ask pip anything"); a paste turns optimistically into an in-place job card with chips; below it: needs-you inbox, applications (one next action each), this week's tasks, compact bot team status row. Tool cards removed from home (D-HF4).
**Test:** seeded home matches scene 2; paste URL → card within 100ms (optimistic) then real chips; a question opens chat; empty state for a new user.

### 7. FRONTEND: bots working (scene 3)
BotStepList with chip results, big PipAvatar changing outfit per step, "you can leave, we'll notify you" (true per D-HF1), live progress via polling.
**Test:** watch a seed run step through; navigate away and back mid-run; failure shows retry.

### 8. FRONTEND: review (scene 4)
TrackedChangeDoc (Newsreader) on the left with highlight sweep, strike, handwritten typed rewrite, source footnotes with tooltip, per-line accept/reject/edit; on the right the requirement list (have / partial / gap → "add to roadmap"); "0 things invented" from the backend count; accept all → UndoToast "3 edits accepted · nothing sent yet". Merges the AtsResult requirement view in.
**Test:** accept all then undo restores the resume; reject a line; gap → roadmap item created; compare against scene 4.

### 9. BACKEND: track, interview, offer support
- One-tap mark applied (optimistic, undoable); quiet-for-5-days flag on applications; a follow-up draft becomes a needs-you item with approve & copy (one action).
- Interview questions built from job + user's projects (Practice.js:113-127); save weak spot → a task dated next Monday.
- Offer: compare action (offer vs targets/other offers) and negotiation draft; rejection → gaps become tasks dated next week (not only roadmap).
**Test:** unit tests per action; seed data exercises each.

### 10. FRONTEND: track (scene 5)
KanbanBoard saved → applied → interviewing → offer/closed, drag and one-tap "mark applied", quiet badge, follow-up card in needs-you with approve & copy, UndoToast for moves.
**Test:** drag and tap at 1440 and 390 (touch); undo a move; compare against scene 5.

### 11. FRONTEND: interview (scene 6)
Invite toast; one question at a time; voice (browser speech + mic waveform + timer) or text; rubric dots with quoted reasons; "weak spot saved → monday's plan".
**Test:** text answer full loop; voice in Chrome; fallback when speech is unsupported; compare against scene 6.

### 12. FRONTEND: offer + rejection (scene 7)
Sky turns to night stars, pixel Confetti (offer only, reduced-motion safe), offer card, offer helper (compare + negotiation draft, copy). Rejection: calm card, gaps listed as next week's tasks.
**Test:** seeded offer and rejection screens; compare against scenes 7–8.

### 13. FRONTEND: restyle the six tools + chat
Resume builder, interview prep, cover letter, cold email, career roadmap, resume parser/ATS restyled on the system. Cut typed fields: prefill from profile/job, chips over inputs, collapse optional fields. Chat slide-over with rich result cards (job card, edit summary, task). Each tool still works standalone.
**Test:** run each tool end to end from the sidebar without a job; field counts before/after recorded in the audit.

### 14. FRONTEND: landing page
Rebuild landing in the system using design/ascendai-pixel.html and scene 0/8 framing (PixelScene hero, AppWindow, flow strip, honest copy).
**Test:** 1440/390 screenshots; Lighthouse accessibility ≥ 95.

---

## After building
Reviewer: lint + build, six tools standalone, no lost features, forms reduced, every flow step reachable, a11y (focus, contrast, labels). Fix must-fix issues, max 2 rounds. Then a before/after table: screens, typed fields and clicks from sign-up to approved application (target < 2 min, < 5 typed fields), and what's left.
