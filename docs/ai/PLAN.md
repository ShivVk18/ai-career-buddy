# PLAN: Redesign (premium, minimal, vibrant)

Branch `redesign`, built on `ux-flow-pass`. Decisions: D64–D67 in DECISIONS.md. Frontend only; no backend, schema or copy-honesty changes.

**Done when:**
- `docs/ai/DESIGN.md` defines the system: tokens, type, spacing, radius, elevation, motion and components.
- Light and dark themes both work and follow the system setting.
- The landing page, app shell, home, jobs, needs you, applications and onboarding use the new system with indigo + lime, premium cards and restrained motion.
- The six tools pick it up through the shared primitives and still work.
- Text contrast meets WCAG AA, motion respects reduced-motion, and everything works at 390px.
- Lint, build and tests pass, and screenshots of the key pages in light and dark are captured for review.

Rules: never edit `.env`; no feature removed; no backend or action changes; copy stays honest (D48: no invented numbers, samples labelled); Pip kept (D64); every Aceternity-derived component is adapted to the tokens, keeps its MIT notice, and adds no heavy dependency (framer-motion/motion is already installed); performance matters (no huge background canvases on every page).

---

### 1. FRONTEND: Design system foundation
- **Files:** `src/app/globals.css`, `src/app/layout.js`, `src/components/ui/*` (shadcn primitives), a new `docs/ai/DESIGN.md`, and a theme toggle in the settings page and ⌘K
- **What:**
  - CSS tokens for light and dark (D65): background, surface, card, border, muted, foreground, primary indigo, accent lime, success, warning, danger, ring, and a glow.
  - Scales for radius, shadow and elevation, plus a spacing rhythm.
  - Type: Geist for the UI, a display face for headings (keep Newsreader, or use Geist at a heavier weight, whichever reads more premium), and Pixelify Sans only for Pip accents.
  - next-themes follows the system by default, with a toggle.
  - Restyle the primitives to the tokens: button (primary, secondary, ghost, outline, plus a gradient or glow variant), input, textarea, card, badge, tabs, dialog, sheet, tooltip, dropdown, command and sonner.
  - Visible focus rings.
  - `DESIGN.md` documents all of this, plus do's and don'ts.
- **Test:** the primitives render correctly in both themes, and contrast meets AA (check the lime and indigo pairings).

### 2. FRONTEND: Aceternity-style component kit
- **Files:** a new `src/components/ui/aceternity/*`
- **What:** A small, curated kit adapted to the tokens, each with reduced-motion fallbacks:
  - **Spotlight:** the hero background.
  - **BentoGrid:** feature tiles.
  - **CardSpotlight / GlowCard:** a cursor glow on hover, which becomes the standard "premium card".
  - **HoverBorderGradient:** for the primary CTA.
  - **TextGenerateEffect:** for one hero line only.
  - **BackgroundGrid / Dots:** a subtle backdrop.
  - **AnimatedBeam or MovingBorder:** used sparingly, e.g. in the pipeline.

  Keep the MIT attribution in each file header. No component may require fake data.
- **Test:** each component renders, degrades gracefully with reduced motion, and has no layout shift.

### 3. FRONTEND: Landing page
- **Files:** `src/app/page.js`, `src/components/landingPage/*`, `ResumePaperDoc.jsx` (restyle only)
- **What:** A premium, minimal layout:
  1. Hero: a spotlight background, a sharp headline with the promise "nothing invented, every line cites a source", one primary CTA plus a secondary one, and Pip small and tasteful.
  2. A "How it works" strip: paste a job → bots work → you approve → apply.
  3. A bento grid of the six tools and the job flow, using glow cards.
  4. A trust section: sources, never auto-sends, your data and deletion.
  5. A product preview that's clearly labelled as a sample.
  6. Honest pricing (50 AI actions a day).
  7. The FAQ and the footer.

  Rewrite the copy for clarity, but keep every claim true (D48). Make it responsive down to 390px.
- **Test:** no unlabelled fake data, Lighthouse-friendly (no giant images, fonts through next/font), and both themes.

### 4. FRONTEND: App shell
- **Files:** `AppSidebar.jsx`, the header, the mobile bottom bar, `CommandMenu.jsx`, `ChatSlideOver.jsx` and its chat components, and `(main)/layout.jsx`
- **What:**
  - A minimal sidebar with clear groups (Home, Jobs/Applications, Needs you, the 6 tools, Settings) and an active state in an indigo pill with a lime dot.
  - The needs-you badge.
  - A compact header with ⌘K, the theme toggle and the user menu.
  - A polished mobile bottom bar.
  - The ⌘K palette and the chat slide-over restyled as premium surfaces, with tool cards as glow cards.
- **Test:** keyboard navigation, 390px and both themes.

### 5. FRONTEND: Home
- **Files:** `(gated)/dashboard/**`
- **What:**
  - A hero input card ("paste a job link, or ask pip anything") with a glow and focus states.
  - A "needs you" section with the count, a row of applications as cards showing status chips and their one next action, this week's tasks, and the follow-ups.
  - The greeting scene becomes a slim, tasteful Pip banner, keeping the night state on an offer.
  - Skeletons and empty and error states in the new style.
- **Test:** the real-data flows are unchanged.

### 6. FRONTEND: Jobs and applications
- **Files:** `(gated)/jobs/[id]/**`, `(gated)/applications/**`
- **What:**
  - Job page: a header card with editable chips, pipeline progress as a 4-step timeline (an animated beam or moving border while a step runs, Pip's outfit on each step), the action buttons, and the status taps with a celebration on an offer (confetti only if reduced motion is off).
  - Board: columns as soft surfaces, glow cards, drag affordances, and the "Move to" menu.
- **Test:** the pipeline, statuses, undo and board moves still work, and the layout works at 390px.

### 7. FRONTEND: Needs you and onboarding
- **Files:** `(gated)/needs-you/**`, `TrackedChanges.jsx`, `LetterReview`, `(main)/onboarding/**`, `EditableChips.jsx`, `SourceChips.jsx`
- **What:**
  - Needs you: a premium queue with item cards. Tracked changes in clean diff colors (insertions in lime or green, deletions in red), source tooltips, inline editing, and tone chips.
  - Onboarding: a large, inviting drop zone, the moment where Pip parses your resume, chip groups and the strength ring with the indigo-to-lime gradient.
- **Test:** every interaction still works, and focus and contrast are fine.

### 8. FRONTEND: Shared states, six-tool consistency and QA screenshots
- **Files:** `EmptyState`, `PageSkeleton`, `PageError`, toasts, the six tools' page headers and top-level cards, and `scripts/capture_screenshots.js`
- **What:**
  - Restyle the shared states.
  - Give each of the six tools a consistent page header (title, short description, primary action) and card containers. No deep internal rework.
  - Update the screenshot script to capture landing, home, a job, needs you, applications and onboarding in light and dark at 1440px and 390px. It's only run if the dev server can start, and it never touches `.env`.
- **Test:** all six tools still work, and lint, build and tests pass.

---

**New env vars:** none. **Migrations:** none. **New dependencies:** none expected; any addition needs a reason.
