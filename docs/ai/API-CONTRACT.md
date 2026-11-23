# API Contract (Phase 2, plus Phase 3 Sources in section 6, Phase 6 in section 9, UX flow pass in section 11)

Source of truth for frontend and backend. Branches `phase-2`, `phase-3`. Decisions: D18-D21, D25-D31 in DECISIONS.md.

Conventions
- All server actions run on the server, require a signed-in Clerk user, and scope every query by the user's DB id. Unauthenticated: they throw `Error("Unauthorized")` (actions) or return HTTP 401 (routes).
- Dates returned by the new actions (`getDashboardData`, `submitQuiz`, `/api/chat`) are ISO-8601 strings, never `Date` objects.
- Nothing here is invented by AI except the chat `reply` text and the quiz content. Every record shown (targets, tasks, scores, cards) comes from the user's own rows.
- Missing data is an empty array, `null` or `0`, never a sample value.

---

## 1. `getDashboardData()`  (`src/actions/Dashboard.js`, server action)

Input: none. No AI calls.

Returns:

```ts
{
  firstName: string | null,          // Clerk firstName; null if unset (UI must not invent a name)
  avgAtsScore: number | null,        // rounded integer 0-100; null when the user has no ATS scores
  counts: {
    atsScores: number,
    coverLetters: number,
    coldEmails: number,
    roadmaps: number,                // active roadmaps (status "active")
    assessments: number,
    hasResume: boolean
  },
  targets: Target[],                 // max 10, newest activity first; [] for a new user
  totalTargets: number,              // before the 10 cap
  nextTasks: NextTask[]              // max 5; [] if no active roadmap or all steps done
}

Target = {
  key: string,                       // lowercased "company|role", stable for React keys
  company: string,                   // original casing of the most recent doc; "" if unknown
  role: string,                      // "" if unknown
  lastActivityAt: string,            // ISO date of newest document for this pair
  ats:         { id: string, score: number, href: "/resume-parser" } | null,        // latest ATS score for the pair
  coverLetter: { id: string, href: string } | null,   // href = "/cover-letter/<id>"
  coldEmail:   { id: string, href: string } | null    // href = "/cold-email/<id>"
}

NextTask = {
  roadmapId: string,
  roadmapTitle: string,              // "<targetRole>" of that roadmap
  stepId: number,
  title: string,
  category: string,                  // "" if absent
  priority: string,                  // "" if absent
  href: string                       // "/roadmap/<roadmapId>"
}
```

Dedup rule: a target is a (company, role) pair compared case-insensitively and trimmed. Documents with both company and role empty are skipped. ATS rows may have null company/role; they are matched as "".

Empty-state example (new user):
`{ firstName: "Sam", avgAtsScore: null, counts: {atsScores:0,coverLetters:0,coldEmails:0,roadmaps:0,assessments:0,hasResume:false}, targets: [], totalTargets: 0, nextTasks: [] }`

Errors: throws `Error("Unauthorized")` when signed out. If the DB user row does not exist it returns the empty-state object (not an error). Other failures throw `Error("Failed to load dashboard")`.

---

## 2. Interview quiz (`src/actions/Interview.js`, server actions)

### `generateQuiz(skills)`
- Input: `skills: string[]` (max 20 items, each trimmed, 1-100 chars; list must have at least 1 item; blank or over-long items are rejected, not dropped). Invalid input returns `{ error, code: "INVALID" }`.
- Returns:

```ts
{
  quizId: string,                    // QuizSession id
  questions: { question: string, options: string[] }[]   // 5-10 items; NO correctAnswer, NO explanation
}
```

- Breaking change: it used to return the bare `Question[]` array including `correctAnswer`/`explanation`.
- Errors: only signed-out THROWS (`Error("Unauthorized")`). Expected failures are RETURNED (Next masks thrown messages in production):

```ts
{ error: string, code: "AI_LIMIT" | "NOT_FOUND" | "INVALID" | "FAILED" }
```

Examples:
`{ error: "Daily AI limit reached. Please try again tomorrow.", code: "AI_LIMIT" }`
`{ error: "Please provide 1-20 skills, each 1-100 characters.", code: "INVALID" }`
`{ error: "Failed to generate quiz. Please try again.", code: "FAILED" }`
(`NOT_FOUND` = DB user row missing.) Callers must check `result.code` / `result.error` before using `quizId`.

### `submitQuiz(quizId, answers)`
- Input: `quizId: string` (non-empty, max 64); `answers: (string | null)[]`, one entry per question in order, each the exact option text chosen, or `null` for unanswered. Length must equal the number of questions. Unanswered or unknown text counts as wrong.
- Server loads the session by `quizId` AND the user's id (foreign or unknown ids behave as not found), rejects an already-submitted session, computes the score, writes the `Assessment` (same shape as before: `quizScore`, `questions` Json[], `category: "Technical"`, `improvementTip`), and marks the session submitted. The claim and the `Assessment` insert run in ONE `db.$transaction` (a double submit cannot score twice; a crash cannot leave a submitted quiz without a result). The improvement tip AI call runs before and outside the transaction; if it fails, `improvementTip` is `null`.
- Returns:

```ts
{
  assessmentId: string,
  score: number,                     // 0-100 float, correct / total * 100
  correctCount: number,
  total: number,
  improvementTip: string | null,     // null if all correct or the tip AI call failed
  results: {
    question: string,
    options: string[],
    userAnswer: string | null,
    correctAnswer: string,
    isCorrect: boolean,
    explanation: string
  }[]
}
```

- Errors: only signed-out THROWS (`Error("Unauthorized")`). Expected failures are RETURNED as `{ error: string, code }`:

| code | when | example `error` |
|---|---|---|
| `INVALID` | zod/length failure | `"Invalid input. Please check your submission and try again."` |
| `NOT_FOUND` | unknown quiz, not yours, or no DB user | `"Quiz not found."` |
| `ALREADY_SUBMITTED` | session already submitted (incl. lost double-submit race) | `"This quiz has already been submitted."` |
| `FAILED` | unexpected/DB error (nothing is saved; the transaction rolled back so the user can retry) | `"Failed to save quiz result. Please try again."` |

Example: `{ error: "This quiz has already been submitted.", code: "ALREADY_SUBMITTED" }`. Success shape is the object above (no `error`/`code` keys).
- A tip failure (including `AI_LIMIT`) never fails the submit; the tip is just `null`.

### Removed in Phase 3
`saveQuizResult` and `getLatestQuiz` no longer exist (zero callers).

### Unchanged
- `getAssessments()`: same as before.
- Assessment `questions[]` entry shape stays `{ question, answer, userAnswer, isCorrect, explanation }`.

---

## 3. `POST /api/chat`  (`src/app/api/chat/route.js`)

Read-only, grounded in the signed-in user's records. It writes nothing except `AiUsage` rows (via `runAI`). Runtime: nodejs.

### Request
`Content-Type: application/json`

```json
{ "message": "What's my latest ATS score?" }
```

- `message`: string, trimmed, 1-4000 chars (required; empty is now a 400). Extra fields are ignored.

### Pre-stream errors (plain JSON, not SSE)
| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }` | no Clerk user |
| 400 | `{ "error": "<message>", "code": "BAD_REQUEST" }` | invalid JSON or invalid `message` |
| 500 | `{ "error": "Failed to process chat", "code": "INTERNAL" }` | failure before the stream starts |

### Response
`200`, `Content-Type: text/event-stream`. Each event is one line `data: <json>\n\n`. Every JSON has a `type`.

Events, in order of occurrence:

1. `step` (1-3 times): `{"type":"step","step":"detective"|"thinking"|"wizard"|"headphones"|"coffee","text":"reading your records..."}`
   - The server emits `detective` first ("reading your records...") and `thinking` before the AI call, and `coffee` last on success. `wizard` and `headphones` are no longer emitted but stay valid values.
2. `text` (exactly once on success): `{"type":"text","content":"You have one ATS score: 78/100 for Frontend Engineer at Acme."}`
   - `content` is the full reply (not token-by-token), plain text, may contain newlines.
3. `tool_result` (0-3 times, after `text`): `{"type":"tool_result","tool":"<cardType>","data":{...}}` (card shapes below).
4. `done`: `{"type":"done"}` is the last event on success.

Error: `{"type":"error","code":"AI_LIMIT","message":"You've reached today's AI limit. Try again tomorrow."}`
- Sent instead of `text`/`tool_result`/`done`. It is terminal: the stream closes right after it, with no `done`. The client must treat `error` and `done` both as end of stream.
- `message` is user-safe and already friendly. The UI should special-case `code === "AI_LIMIT"`.
- `tool_call` is removed (it was ignored by the client).

Error codes in the `error` event:
| code | Meaning |
|---|---|
| `AI_LIMIT` | Per-user daily AI cap reached (section 4) |
| `AI_UNAVAILABLE` | All providers failed or rate-limited |
| `AI_BAD_OUTPUT` | Model output could not be validated |
| `AI_CONFIG` | AI is not configured on the server |
| `AI_FAILED` | Other AI failure |
| `INTERNAL` | Anything else (for example the DB failed while building context) |

Example (user with one ATS score):

```
data: {"type":"step","step":"detective","text":"reading your records..."}

data: {"type":"step","step":"thinking","text":"putting an answer together..."}

data: {"type":"text","content":"Your latest ATS score is 78/100 for Frontend Engineer at Acme."}

data: {"type":"tool_result","tool":"ats_score","data":{"recordId":"clx1","score":78,"matchPercentage":71,"company":"Acme","role":"Frontend Engineer","summary":"Strong React experience; missing testing keywords.","createdAt":"2026-11-10T09:12:00.000Z","href":"/resume-parser"}}

data: {"type":"step","step":"coffee","text":"all set! what would you like to review next?"}

data: {"type":"done"}
```

If the DB user row does not exist yet, the stream is `step`, `text` ("I can't find your profile yet. Please finish onboarding first."), `done`.

Example (new user): one `text` ("You don't have any ATS scores yet. Run your resume through the ATS checker first."), no `tool_result`, then `done`.

### Cards (`tool_result.tool` + `data`)
Server-built. The model only proposes `{type, recordId}` pairs. The server loads each record by id AND user id; unknown, foreign or wrong-type ids are silently dropped; duplicates are dropped; max 3 cards. Strings come from the DB verbatim (summaries are cut to 300 chars). Every `data` has `recordId` (string), `createdAt` (ISO string) and `href` (the real route to open it; never `/tools/*`).

| `tool` | `data` | `href` |
|---|---|---|
| `ats_score` | `{ recordId, score: number, matchPercentage: number\|null, company: string\|null, role: string\|null, summary: string, createdAt, href }` | `/resume-parser` (no detail route exists) |
| `cover_letter` | `{ recordId, company: string, role: string, status: string, createdAt, href }` | `/cover-letter/<recordId>` |
| `cold_email` | `{ recordId, company: string, role: string, status: string, createdAt, href }` | `/cold-email/<recordId>` |
| `roadmap` | `{ recordId, currentRole: string, targetRole: string, progress: number (0-100), completedSteps: number, totalSteps: number, nextSteps: { id: number, title: string }[] (max 3, incomplete only), createdAt, href }` | `/roadmap/<recordId>` |
| `assessment` | `{ recordId, score: number (0-100), category: string, improvementTip: string\|null, createdAt, href }` | `/interview` |

Removed card types: `resume_edit`, `interview_question`, `roadmap_task` (they depended on invented data). The client should render unknown `tool` values as nothing.

Grounding: the model gets only the user's profile (industry, skills, experience, bio), latest 3 ATS scores, active roadmaps with next steps, latest 3 cover letters and cold emails (company, role, status only; no body), and the latest assessment score. If something is not in that context it says so. It never writes to the DB.

---

## 4. Daily AI cap and the `AI_LIMIT` error

- Env `AI_DAILY_LIMIT` (D30): unset, empty or invalid means **50** calls per user per day; `0` disables the cap; a positive integer sets it.
- `runAI` (when it has a `userId`) counts that user's `AiUsage` rows with `createdAt` since 00:00 UTC today. Every attempt, including failed ones, is a row. If `count >= AI_DAILY_LIMIT` it throws `AIError` with `code = "AI_LIMIT"` and message `"Daily AI limit reached"` before any provider call.
- If the `AiUsage` table is missing (migration not applied) or the count fails, the cap is skipped (fail open) with one console warning per process.
- The count is checked once per `runAI` call. A call that retries providers still counts one attempt per provider try.
- Surfacing it:
  - `/api/chat`: SSE `error` event with `code: "AI_LIMIT"` (section 3).
  - Server actions that use AI (`generateQuiz`, `generateCoverLetter`, `generateColdEmail`, `generateCareerRoadmap`, `createATSAnalysis`, `improveWithAI`, `generateProgressRecommendations`): Next.js hides thrown messages in production for uncaught errors, so the existing catch blocks in those actions keep their current generic messages. `generateQuiz`, `generateCoverLetter`, `generateColdEmail`, `generateCareerRoadmap`, `improveWithAI` and `createATSAnalysis` now RETURN `code: "AI_LIMIT"` (see section 6). `generateQuiz` was first: it RETURNS `{ error: "Daily AI limit reached. Please try again tomorrow.", code: "AI_LIMIT" }` (no message-prefix convention anymore). For the other actions, the UI will see their existing failure message; improving this is out of scope for Phase 2.

Frontend handling: on `AI_LIMIT` show a friendly "daily limit reached, try again tomorrow" message, not a generic failure.

---

## 5. Other actions
Unchanged unless listed in section 6. `generateQuiz` also deletes the caller's own unsubmitted `QuizSession` rows older than 7 days.

---

## 6. Sources (Phase 3, D26-D31)

Every newly generated item cites what it is based on. The server builds a catalog from things the user provided, the model may only cite catalog ids (or, for ATS, verbatim resume quotes), and the server drops anything it cannot verify. Spending: a generation can use up to 2 AI attempts (one retry, D28).

### 6.1 Snapshot (stored with the record, never recomputed)

```ts
Snapshot = {
  id: string,        // catalog id, e.g. "exp:e_1a2b3c4d5e6f", "profile:skills", "jd:3", "jd:4.2", "input:current"
  kind: "experience" | "education" | "project" | "profile" | "resume" | "jd" | "input",
  label: string,     // chip text, e.g. "Experience: Engineer at Acme", "Profile: skills", "Job description, line 3"
  excerpt: string    // max 200 chars, whitespace collapsed; show as tooltip
}
```

Catalog ids: `exp:<id>`, `edu:<id>`, `proj:<id>`, `profile:industry|skills|bio|experience`, `resume:summary|skills`, `jd:<lineNo>` (1-based line of the job description; a line of at most 400 chars) or `jd:<lineNo>.<n>` (chunk n, from 1, of a longer line, split on sentence or word boundaries, each at most 400 chars, label "Job description, line 3 (part 2)"; a line is never both). The whole JD (up to 20000 chars) is in the catalog and is sent to the model unclipped. `input:<name>` (text the user typed into this request). Resume entries that have no id (saved before Phase 3 and never re-saved) get a deterministic id `l-<section>-<hash>` (section `exp|edu|proj`; hash of section, index, title, organization, startDate) from `legacyEntryId` in `src/lib/entryIds.js`; they are cited as `exp:l-exp-<hash>`. The same function is used by the catalog, `saveResume` (`assignEntryIds`), tailoring and the client (`ensureEntryIds(resumeJson)`, which fills only missing ids), so all ids agree. The old `exp:i<index>` form is no longer produced. The snapshot still shows the right label and excerpt.

### 6.2 Legacy rule (D29)

A record is **legacy** (show "Created before sources were added") when its sources field is missing:
- `ATSScore.evidence === null`
- `CoverLetter.sources === null`, `ColdEmail.sources === null`
- Roadmap: a step without a `sources` key is legacy. A roadmap is legacy when no step has `sources`.
Never regenerate or backfill. `improveWithAI` results are not stored, so it has no legacy case.

### 6.3 New error codes and messages
All expected failures are RETURNED as `{ error: string, code }` (never thrown; only signed-out throws `Error("Unauthorized")`).

| code | where | friendly `error` (already user-safe) |
|---|---|---|
| `INVALID_FILE` | `createATSAnalysis` | "Please upload a valid PDF resume (up to 5 MB) that contains selectable text." / "That file is larger than 5 MB. Please upload a smaller PDF." / "We couldn't read any text in that PDF. Please upload a text-based (not scanned) resume." |
| `NO_SOURCES` | letter, email, roadmap, ATS | "We couldn't ground this in your details. Add more to your profile or resume, or paste a fuller job description, then try again." (roadmap/ATS wording differs slightly; show `error` as is) |
| `AI_LIMIT` | all generators | "Daily AI limit reached. Please try again tomorrow." |
| `INVALID` | all generators | input failed validation |
| `NOT_FOUND` | letter, email, roadmap, improve | "We couldn't find your profile. Please finish onboarding first." |
| `INVENTED_DETAIL` | `improveWithAI` | "We couldn't improve this without adding details you didn't write. Add the specifics you want to keep (numbers, results) and try again." |
| `FAILED` | all generators | generic retry message |

### 6.4 `createATSAnalysis(formData)`
Input: `{ companyName?: string, jobTitle?: string, jobDescription: string (1-20000), resumeBase64: string, resumeType?: string }`. `resumeBase64` is raw base64 of the PDF (a `data:` prefix is tolerated). **New optional `resumeType`: pass `file.type`**; anything other than `application/pdf` is rejected. The server also checks size (<= 5 MB decoded), `%PDF-` magic bytes and that text can be extracted, all before any AI call. The AI now reads the extracted text, not the raw PDF.

Returns `{ success: true, data: ATSScore }` or `{ success: false, message, error, code }` (`message` equals `error`, so existing `!response.success` code keeps working; use `code` to special-case).

`data` (the saved row) keeps every old column. `strengths`/`weaknesses` stay `string[]`, `recommendations` stays `{category, priority, action, impact}[]`. New field `data.evidence`:

```ts
Evidence = null | {          // null => legacy
  version: 1,
  strengths:       EvItem[],  // same order/length as data.strengths
  weaknesses:      EvItem[],  // same as data.weaknesses
  recommendations: (EvItem & { category, priority, action, impact })[]  // text === action; same order as data.recommendations
}
EvItem = { text: string, sources: EvSource[] }   // sources.length >= 1, always
EvSource =
  | { type: "resume_quote", quote: string }                         // verbatim text from the uploaded resume PDF (verified)
  | { type: "jd", id: "jd:<n>" | "jd:<n>.<k>", label: string, excerpt: string }    // a job description line
```

Show quotes as "From your resume: \"...\"" and jd as the line excerpt. Rules enforced by the server: every strength and weakness has at least one `resume_quote` (a JD line alone is not accepted for a claim about the resume); recommendations may cite only JD lines; quotes are at least 20 chars and are matched after Unicode NFKC, smart-quote/dash/soft-hyphen/hyphenation normalization, whitespace collapse and lowercasing; recommendation `text` is always the `action` (recommendations with an empty action are dropped). If the retry call fails, the first attempt's verified items are kept. `improvements` are not sourced. `getATSScoreById` returns the row with `evidence`; `updateATSScore(scoreId, data)` (no UI callers) accepts only `{ jobTitle?, companyName?, jobDescription? }` (strict zod; any other key such as `evidence`, `userId`, `atsScore` is rejected), checks ownership, and returns `{ success: true, data }` or `{ success: false, error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`; `getUserATSScores` select does not include it.

### 6.5 `generateCoverLetter(data)` and `generateColdEmail(data)`
Input: `{ jobTitle?: string, companyName?: string, jobDescription?: string }` (<= 200/200/20000 chars). Returns the created row, or `{ error, code }`. The row's `content` is markdown/plain text: paragraphs joined by exactly one blank line (`"\n\n"`), so the editor works as before. New field:

```ts
sources: null | {            // null => legacy
  version: 1,
  paragraphs: { kind: "greeting" | "body" | "closing", sources: Snapshot[] }[]
}
```

Sources show what the text was built from, not that each claim is verified: the server checks that cited ids exist, not that the paragraph is entailed by them. The server enforces at most one greeting (only as the first paragraph) and at most one closing (only as the last); extra ones are treated as body paragraphs and need sources.

`sources.paragraphs[i]` describes `content.split(/\n{2,}/)[i]` (no paragraph contains a blank line). Every `body` has `sources.length >= 1`; greeting and closing may be `[]`. Alignment rule (D27): after the user edits, if `content.split(/\n{2,}/).filter(Boolean).length !== sources.paragraphs.length`, show one "Based on" list of the union of all snapshots (dedupe by `id`) instead of per-paragraph chips. The email no longer receives the user's email address; the letter no longer has a markdown header/signature block (the closing paragraph carries the sign-off).

### 6.6 `generateCareerRoadmap(data)`
Input: `{ currentRole: string, targetRole: string, industry?: string }` (all trimmed, max 200; roles required). Returns the created `CareerPath`, or `{ error, code }` (callers must check `result.error`). Each item in `steps` gains:

```ts
step.sourceIds: string[]      // >= 1, all valid
step.sources:   Snapshot[]    // same ids; legacy step => key absent
```

Unsourced steps are dropped; step ids are renumbered 1..n. Cited ids can include `input:currentRole`, `input:targetRole`, `input:industry`, `profile:*` and the user's resume entries. `completeRoadmapStep` keeps `sources` (it spreads the step).

### 6.7 `improveWithAI({ current, type })`
Contract change: used to return a string and throw. Now returns

```ts
{ text: string, sources: Snapshot[] } | { error: string, code: "INVALID" | "NOT_FOUND" | "AI_LIMIT" | "INVENTED_DETAIL" | "FAILED" }
```

`current` 1-5000 chars, `type` 1-40 chars. `sources` is always exactly `[input:current]`, labelled "Rewritten from your text" (the industry chip is gone). The server checks that every number (digits, %, $ amounts) in the output also appears in `current`; on a mismatch it retries once, then returns `{ error: "We couldn't improve this without adding details you didn't write. Add the specifics you want to keep (numbers, results) and try again.", code: "INVENTED_DETAIL" }` (show `error` as is). Not persisted by the server; the UI keeps it next to the text while shown.

### 6.8 `saveResume` stable ids
`saveResume` adds a stable `id` (`"e_" + 12 hex`) to every `experience`, `education` and `projects` entry that lacks one, and keeps existing ids (duplicates within one array are regenerated). Only saving does this; nothing is batch-rewritten. The saved resume returned by `saveResume` / `getResume` includes the ids. **The client must send entries back with their `id`** (react-hook-form + `entrySchema` in `src/app/lib/schema.js` will strip an `id` unless the schema has `id: z.string().optional()`; use it as the React key).

### 6.9 Schema changes (migration `20261117020000_phase3_sources`, NOT applied by the agent)
`CoverLetter.sources Json?`, `ColdEmail.sources Json?`, `ATSScore.evidence Json?`, `User.email` becomes optional (the code no longer writes `""` or `...@placeholder.com`; email is the Clerk primary email or null). Until the migration is applied, generators that write `sources`/`evidence` will fail with `FAILED`.


---

## 7. Phase 4 (D32-D38): Resume + ATS parity

No migration. All actions are `"use server"` actions: signed-out throws `Error("Unauthorized")`; every expected failure is RETURNED as `{ error: string, code }` (`error` is user-safe, show as is). All queries are owner-scoped. Check `result.error` before using a result.

### 7.1 New and changed error codes

| code | when | `error` text |
|---|---|---|
| `AI_UNAVAILABLE` | `NODE_ENV==="production"` and `AiUsage` can't be read (cap fails closed, D33), or every AI provider failed | "AI is temporarily unavailable. Please try again later." (the cap itself throws `AIError("AI is temporarily unavailable")`; `/api/chat` already maps `AI_UNAVAILABLE`). Now RETURNED by every generator (`generateCoverLetter`, `generateColdEmail`, `generateCareerRoadmap`, `generateQuiz`, `improveWithAI`, `createATSAnalysis`, `tailorResume`, `proposeAtsFix`, `applyAtsFix`). In dev the cap fails open with a warning. |
| `NEEDS_REUPLOAD` | `proposeAtsFix` / `applyAtsFix` on a score with no stored `resumeText` (anything analyzed before Phase 4) | "This result was saved before we kept the analyzed resume text, so we can't test a fix on it. Please upload your PDF again and re-run the analysis." |
| `STALE` | tailoring draft expired (24 h) or the resume changed; fix token expired (24 h) or no longer matches the stored text | message says to run tailoring / propose the fix again |
| `FIX_UNAVAILABLE` | `proposeAtsFix` / `applyAtsFix` in production when `ATS_FIX_SIGNING_SECRET` is missing or shorter than 32 chars (fails closed, D39). Dev falls back to an ephemeral key. | "Fixes are temporarily unavailable. Please try again later." |
| `ALREADY_APPLIED` | `applyAtsFix` with a fix token already used (single-use, nonce). Result also carries `newScoreId` of the score created the first time: `{ error, code, newScoreId }`. | "You've already applied this fix. Opening the result you got." (navigate to `newScoreId`) |
| `NOT_RESTORABLE` | `restoreResumeVersion` on a pre-Phase-4 copy that only kept plain text | "This older copy only kept plain text, so it can't be restored. Your resume was not changed." |
| `AI_LIMIT`, `NO_SOURCES`, `INVENTED_DETAIL`, `INVALID`, `NOT_FOUND`, `FAILED` | as in section 6.3 | `NOT_FOUND` for a missing resume: "Save your resume first, then try again." |

Frontend: map `AI_UNAVAILABLE` in `generationError.js`; `STALE` and `NEEDS_REUPLOAD` can show `error` as is.

### 7.2 Saving letter and email edits

`updateCoverLetter(id: string, content: string)` and `updateColdEmail(id, content)` (`src/actions/CoverLetter.js`, `ColdEmail.js`). `content` is trimmed, 1-10000 chars. Owner-scoped. Only `content` changes; the stored `sources` are kept as they are (apply the alignment rule from 6.5 in the UI). Returns the updated row (same shape as `getCoverLetter` / `getColdEmail`) or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`.

### 7.3 Resume versions (`src/actions/Resume.js`)

Stored in `ResumeVersion` with a JSON envelope in `tailoredContent` (the label lives there; there is no label column). Versions made before Phase 4 (`duplicateResume` "Copy"/"Duplicate") show as `label = "<jobTitle> at <companyName>"` or "Saved copy" and have `restorable: false`. `duplicateResume` now writes a real full snapshot labelled "Copy of resume (<UTC date>)".

- `listResumeVersions()` returns `Array<{ id, label, jobTitle: string|null, companyName: string|null, matchPercentage: number|null, restorable: boolean, createdAt: Date }>`, newest first, max 100. No resume yet gives `[]`. Failure gives `{ error, code: "NOT_FOUND" | "FAILED" }` (not an array). Pending tailoring drafts are never listed.
- `saveResumeVersion({ label (1-120), jobTitle?: string (<=200), companyName?: string (<=200), jobDescription?: string (<=20000) })` snapshots the CURRENT SAVED resume (not unsaved form state; save first). With a `jobDescription`, `matchPercentage` is computed (7.4). Returns `{ id, label, matchPercentage: number|null, createdAt }` or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`.
- `getResumeVersion(id)` returns `{ id, label, jobTitle, companyName, jobDescription: string|null, matchPercentage, createdAt, content: ResumeForm, applied: AppliedEdit[] }` or `{ error, code }`. `applied` is empty for manual versions; for tailored ones it lists the accepted edits, each `{ proposalId, entryId, bulletIndex, original, proposed, reason, sources: Snapshot[] }` (feed `sources` to `SourceChips` for the Sources panel).
- `restoreResumeVersion(id)` first saves the current resume as a version labelled "Before restore <UTC date>", then writes the version's snapshot through the existing `saveResume` path (so entry ids and template lookup behave as on any save). Returns `{ success: true, backupVersionId }` or `{ error, code: "INVALID" | "NOT_FOUND" | "NOT_RESTORABLE" | "FAILED" }`. Reload the resume form afterwards.

`ResumeForm` = `{ content: string, templateId: string|null (templateKey), photoUrl, contactInfo, summary, skills, experience[], education[], projects[] }`, the shape `saveResume` accepts.

### 7.4 Match % (no AI, D37)

`computeMatch({ jobDescription (1-20000), versionId?: string, resume?: ResumeFormLike })` returns `{ percent: number (0-100, rounded), matched: string[], missing: string[], termCount: number }` or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`. Compares against `versionId` if given, else the optional unsaved `resume` form JSON (summary, skills, experience/education/projects with title, organization, description), else the saved resume. Terms are canonical lowercase names ("node.js", "ci/cd", "rest api") from a curated vocabulary (`src/lib/match.js`, exported `VOCAB`) plus capitalised acronyms from the JD. `termCount === 0` means no recognizable skills in the JD (percent is 0; say so instead of "0% match"). Label it "computed from keywords, not AI".

### 7.5 Tailoring (D36)

`tailorResume({ jobTitle?: string, companyName?: string, jobDescription: string (1-20000) })`: one `write` AI call (one retry if too few valid proposals; counts against the daily cap). Returns

```ts
{
  draftId: string,              // server-held pending proposals, expires in 24 h
  jobTitle: string, companyName: string,
  matchBefore: { percent, matched, missing, termCount },
  proposals: {
    proposalId: string,         // "p1", "p2", ...
    entryId: string,            // "exp:<id>" or "proj:<id>"
    bulletIndex: number,        // n-th non-empty line of that entry's description
    original: string,           // from the saved resume, never from the model
    proposed: string, reason: string,
    sources: Snapshot[]         // the resume entry first, then >=1 job description line
  }[]                           // 1-8
}
```
or `{ error, code: "INVALID" | "NOT_FOUND" | "NO_SOURCES" | "INVENTED_DETAIL" | "AI_LIMIT" | "AI_UNAVAILABLE" | "FAILED" }`. Server checks: entry and bullet exist in the saved resume; at least one valid `jd:` id; `proposed` differs from `original`, is <= 600 chars and every number in it appears in the original bullet or the JD (otherwise dropped). Bullets longer than 400 chars are not offered. Nothing is applied; the main resume is not touched.

`saveTailoredVersion({ draftId: string, acceptedProposalIds: string[] (1-8), label?: string })`: accepts ONLY ids. The proposal text is read from the server-side draft and re-verified against the CURRENT saved resume and the stored JD (bullet unchanged, numbers still valid). Applies only the accepted proposals to a copy and turns the draft into a saved version (`matchPercentage` = match after). The main `Resume` row is never modified. Returns `{ versionId, label, applied: proposalId[], skipped: { proposalId, reason: "UNKNOWN" | "RESUME_CHANGED" | "FAILED_CHECK" }[], matchBefore, matchAfter }` or `{ error, code: "INVALID" | "NOT_FOUND" | "STALE" | "FAILED" }`. Striking a proposal = simply not sending its id. A new `tailorResume` call replaces any earlier unsaved draft of that user. To use the result the user calls `restoreResumeVersion(versionId)`.

### 7.6 ATS evidence fields (`src/actions/ResumeParser.js`, `src/lib/ats/weights.js`)

`ATSScore.evidence` now stores (version stays 1, fields are additive):

```ts
Evidence = null | {
  version: 1,
  strengths, weaknesses, recommendations,           // as in 6.4
  requirements: { requirement: string, status: "matched" | "gap", sources: EvSource[] }[],  // 0-12
  candidateLevel: string | null,                    // model's own label, e.g. "Junior (0-2 yrs)"
  // resumeText: the analyzed PDF text (<= 30000 chars). STORED but NEVER returned to the client.
  previousScoreId?: string,                         // set on scores created by applyAtsFix
  appliedFix?: { original: string, proposed: string }
}
```
Rules: `matched` has >= 1 verified `resume_quote`; `gap` has >= 1 `jd` source. Scores made before this phase have `requirements: []` (or evidence without the key) and `candidateLevel: null`; scores with `evidence === null` stay legacy (6.2).

Returned to the client (the `resumeText` is stripped everywhere):
- `createATSAnalysis` -> `data`, `getATSScoreById(id)` and `updateATSScore` -> `data`: the row plus `hasResumeText: boolean`, `candidateLevel: string|null`, `previousScoreId: string|null`; `evidence.requirements` is always an array when evidence exists.
- `getUserATSScores()` rows (still no evidence arrays): `{ id, atsScore, matchPercentage, jobTitle, companyName, analyzedBy, createdAt, finalSummary, jobDescription, isLegacy, candidateLevel, previousScoreId, hasResumeText, requirementsMatched, requirementsTotal }`. Newest first, limited to the latest 50 rows. Link before/after pairs with `previousScoreId`. For "re-run with this job", pre-fill company, title and `jobDescription` from this row and ask for the PDF again.

`src/lib/ats/weights.js` (import in the UI, plain JS): `CANDIDATE_LEVELS`, `WEIGHT_GROUPS` (`early` Student/Fresher 50/25/15/10, `junior` 40/40/20, `senior` Mid/Senior 50/30/20, each `{label, levels, weights:[{key,value}]}`), `normalizeLevel(raw)` -> "Student"|"Fresher"|"Junior"|"Mid"|"Senior"|null, `weightsForLevel(raw)` -> `{ level, label, weights }` or `null` (unknown level: show no weights), `weightsPromptText()`. The prompt is generated from the same data, so the panel always matches.

### 7.7 ATS 1-click fix (D38)

`proposeAtsFix(scoreId: string, weaknessIndex: number)` (index into `evidence.weaknesses` / `weaknesses[]`): one `write` AI call (one retry). Returns `{ fixId: string, original: string, proposed: string, sources: EvSource[], weakness: string }` or `{ error, code: "INVALID" | "NOT_FOUND" | "NEEDS_REUPLOAD" | "NO_SOURCES" | "INVENTED_DETAIL" | "AI_LIMIT" | "AI_UNAVAILABLE" | "FAILED" }`. `original` is the resume line (from the stored text) that the weakness's verified quote points to; `sources` = that line as a `resume_quote` plus >= 1 `jd` line. `proposed` is <= 600 chars and its numbers come from the original line or the JD. Nothing is saved or changed.

`applyAtsFix(scoreId: string, fixId: string)`: run ONLY on the user's click. Accepts only the id: `fixId` is an opaque server-signed token (HMAC, 24 h) that carries the proposed text, so it can't be edited or forged, and the server still re-verifies it against the stored text and JD. It replaces `original` with `proposed` in the stored analyzed text (not the main resume), runs a real `fast` re-score with the same prompt and validation as a fresh analysis (1-2 AI calls against the cap), and saves a NEW `ATSScore` with `evidence.previousScoreId` and `evidence.appliedFix`. Returns `{ newScoreId, before: { atsScore, matchPercentage }, after: { atsScore, matchPercentage } }` (`after` comes from the real call; the delta can be negative) or `{ error, code: "INVALID" | "NOT_FOUND" | "NEEDS_REUPLOAD" | "STALE" | "ALREADY_APPLIED" | "FIX_UNAVAILABLE" | "NO_SOURCES" | "AI_LIMIT" | "AI_UNAVAILABLE" | "FAILED" }`. The token is single-use (random nonce stored in `evidence.appliedFix.nonce`) and carries the character offset of the quoted line; a text mismatch at that offset gives `STALE`. The old score, `updateATSScore` and the main resume are never changed. Open the result via `getATSScoreById(newScoreId)`.

Legacy scores (no stored text) return `NEEDS_REUPLOAD` from both; use `hasResumeText` to hide or disable "Propose fix" up front. Fixes are unavailable for results older than 90 days (`NEEDS_REUPLOAD` even if the text has not been purged yet; `applyAtsFix` also re-checks this under a row lock right before saving).

### 7.8 Cap behaviour (section 4 amended)

In production, if the `AiUsage` count can't be read, `runAI` throws `AIError` code `AI_UNAVAILABLE` before any provider call. In dev it skips the cap with one console warning (as before).

---

## 8. Phase 5 (D34, D35, D40-D43): writing tools, ATS delete and purge, redirects

One migration `20261117030000_cold_email_fields` (SQL only, NOT applied by the agent): optional columns on `ColdEmail`: `recipientName`, `recipientRole`, `recipientEmail`, `subject` (all `String?`) and `followUpAt` (`DateTime?`), plus an index on `(userId, followUpAt)`. Until it is applied, the cold email actions fail with `FAILED`. All actions are `"use server"`: signed-out throws `Error("Unauthorized")`; every expected failure is RETURNED as `{ error, code }` (`error` is user-safe). Everything is owner-scoped. Check `result.error` first. Nothing here sends anything (D35).

New codes: `NOT_SHORTENABLE` (see 8.2) and `MIGRATION_PENDING` (see 8.3). Other codes as in 6.3 and 7.1 (`AI_LIMIT`, `AI_UNAVAILABLE`, `NO_SOURCES`, `INVENTED_DETAIL`, `INVALID`, `NOT_FOUND`, `FAILED`).

### 8.1 `src/lib/writing.js` (plain JS, import in server and UI; no AI)

```ts
COVER_LETTER_WORDS = { min: 250, max: 350 }        // the ONE range: used in the prompt and for the UI word count
COLD_EMAIL_WORDS   = { min: 100, max: 140, target: 120 }   // prompt says 100-140; UI shows target 120 within the range
COVER_LETTER_TONES = ["stiff", "confident", "eager"]       // default "confident"; labels: stiff (formal), confident (solution-focused), eager (startup energy)
COVER_LETTER_FORMALITY = ["standard", "formal"]            // default "standard"
CLICHES: string[]                                          // curated lowercase phrases
findCliches(text: string): { phrase: string, start: number, end: number }[]
//   case-insensitive, whole-phrase, non-overlapping, sorted by start; offsets index into the ORIGINAL text. [] for empty/non-string.
countWords(text: string): number                           // whitespace-separated, 0 for empty
```

### 8.2 Cover letter (`src/actions/CoverLetter.js`)

- `generateCoverLetter({ jobTitle?, companyName?, jobDescription?, tone? })`: new optional `tone` in `COVER_LETTER_TONES` (invalid value => `INVALID`; omitted => "confident"). Everything else as 6.5. The tone used is stored in `sources.tone` (no migration). Formality is not stored.
- `regenerateCoverLetter(id: string, opts?: { tone?: Tone, formality?: "standard" | "formal" })`: replaces `content` and `sources` of THE SAME ROW (D43), using the row's stored `jobTitle`, `companyName`, `jobDescription` and a fresh catalog from the current profile and resume. Previous text and edits are lost: the UI must confirm first. "More formal" = `{ formality: "formal" }` (optionally with `tone`). One `write` call, up to 2 attempts, counts against the cap. Omitting `tone` reuses the stored `sources.tone` (default "confident" when missing). The used tone is saved to `sources.tone`. Returns the updated row (same shape as `getCoverLetter`, with `sources` version 1) or `{ error, code: "INVALID" | "NOT_FOUND" | "NO_SOURCES" | "AI_LIMIT" | "AI_UNAVAILABLE" | "FAILED" }`. Numbers in the new text must appear in the SOURCES, job title or company name, otherwise the paragraph is dropped (retry, then `NO_SOURCES`).
- `shortenCoverLetter(id: string)`: rewrites the BODY paragraphs of the CURRENT saved text (including the user's edits) shorter (aim about 25% fewer words overall), same row in place. Greeting and closing text are kept as they are. `sources` are kept exactly as stored: each paragraph keeps its existing source ids/snapshots. Every number in the result must appear in the current text (`inventedNumbers`), otherwise it retries once and returns `INVENTED_DETAIL`. A body paragraph that did not get shorter keeps its old text. Returns the updated row, or `{ error, code }` with `code`: `INVALID` | `NOT_FOUND` | `NOT_SHORTENABLE` (letter has no sources, i.e. legacy, or the edited text no longer has the same paragraph count as `sources.paragraphs`; message tells the user to regenerate instead) | `INVENTED_DETAIL` | `AI_LIMIT` | `AI_UNAVAILABLE` | `FAILED` (also when the result is not shorter). The UI must confirm first (D43) and then refresh content and sources.

- Read shape (`getCoverLetter`, `getCoverLetters`, create/update/regenerate/shorten results) gains `tone: "stiff"|"confident"|"eager"|null` (from `sources.tone`; `null` on letters created before this change). A greeting or closing with a number not found in the SOURCES is no longer dropped: a greeting becomes "Hello," and a closing becomes "Best regards," plus the user's name when known (also for cold emails). The prompt forbids numbers there.

### 8.3 Cold email (`src/actions/ColdEmail.js`)

Row shape (`getColdEmail`, `getColdEmails`, create/update results) gains: `recipientName: string|null`, `recipientRole: string|null`, `recipientEmail: string|null`, `subject: string|null`, `followUpAt: Date|null` (a Date at 00:00 UTC of the chosen day). `sources` gains an optional `subject` key (additive, version stays 1): `sources.subject?: { sources: Snapshot[] }` (what the subject was built from; absent on older rows or when the subject came from nothing).

- `generateColdEmail({ jobTitle?, companyName?, jobDescription?, recipientName?, recipientRole?, recipientEmail? })`: `recipientName` trimmed, no line breaks, max 100; `recipientRole` max 150; `recipientEmail` trimmed, valid email, max 254; empty string means not provided; invalid => `INVALID`. **`recipientEmail` is only stored; it is never put in the prompt, the source catalog or any AI input** (enforced and commented in the code). The recipient name and role are used for the greeting ("Hi <first name>,") and context only; when no name is given the greeting is generic. The model also returns a `subject` (max 80 chars, no line breaks), cited to company, role or job-description ids (`input:companyName`, `input:jobTitle`, `jd:*`) and number-checked; subjects with claims such as percentages, "open rate" or guarantees are rejected. If the model gives no valid subject and both company and role were given, the server uses the plain fallback `Interested in the <jobTitle> role at <companyName>` (sourced to those inputs); otherwise `subject` is `null` (the user can type one). Returns the created row or `{ error, code }` as in 6.5. Body paragraphs also get the number check (a number not found in the SOURCES, title, company, or recipient fields drops that paragraph).
- `updateColdEmail(id: string, content?: string, fields?: { recipientName?, recipientRole?, recipientEmail?, subject? })`: `content` (trimmed, 1-10000) is optional now: pass `null`/`undefined` to change only fields. `fields` keys: each is `string | null`; `""` or `null` clears the column; same limits as above; `subject` max 200, no line breaks; email must be a valid address. At least one of `content` / a field is required, otherwise `INVALID`. Unknown keys are rejected (`INVALID`). Sources untouched. Returns the updated row or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`. Existing calls `updateColdEmail(id, content)` keep working.
- `MIGRATION_PENDING`: returned (not thrown) when the Phase 5 columns are missing in the database (Prisma P2022). `getColdEmail(id)` returns `{ error, code: "MIGRATION_PENDING" }` instead of a row (the detail page must check `result.error`); `generateColdEmail`, `updateColdEmail`, `setColdEmailFollowUp` return it instead of `FAILED` in that case. `getColdEmails()` selects only the pre-Phase-5 columns (`id, userId, content, jobDescription, companyName, jobTitle, status, sources, createdAt, updatedAt`), so list rows do NOT include `recipientName`, `recipientRole`, `recipientEmail`, `subject`, `followUpAt`; use `getColdEmail(id)` for those. The subject fallback has whitespace collapsed and is capped at 80 characters.
- `setColdEmailFollowUp(id: string, date: string | null)`: `date` is `"YYYY-MM-DD"` (a real calendar day) or an ISO-8601 string (only the UTC date part is kept); `null` clears the reminder. Stored as 00:00 UTC of that day. A reminder only; nothing is ever sent. Returns the updated row (with `followUpAt`) or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`.

When `updateColdEmail` saves a `subject` that differs (after trim) from the stored one, or clears it, the server removes `sources.subject` (all other `sources` keys are kept), so the UI shows no subject chips for an edited subject; an unchanged subject keeps them.

### 8.4 `getDashboardData()` adds `dueFollowUps`

```ts
dueFollowUps: {
  id: string,                   // ColdEmail id
  company: string,              // "" if unknown
  role: string,                 // "" if unknown
  recipientName: string | null,
  subject: string | null,
  followUpAt: string,           // ISO date
  href: string                  // "/cold-email/<id>"
}[]                              // followUpAt <= end of today (UTC), the user's own, oldest first, max 10; [] otherwise
```
Also `counts.dueFollowUps: number` is NOT added; use `dueFollowUps.length` (a user with more than 10 due sees the oldest 10). If the migration is not applied, `dueFollowUps` is `[]` (the rest of the dashboard still loads). The empty-state object has `dueFollowUps: []`.

### 8.5 ATS (`src/actions/ResumeParser.js`)

- `deleteATSScore(scoreId: string)`: owner-scoped hard delete. Returns `{ success: true, message }` or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }` (it used to throw; no UI called it). Other scores that point to it through `evidence.previousScoreId` keep working (`previousScoreId` then refers to a missing row: treat a failed lookup as "no previous"). Not found / not yours is `NOT_FOUND`.
- Purge (D42): `evidence.resumeText` is removed from the signed-in user's results older than 90 days. It runs opportunistically at the start of `getUserATSScores` and `createATSAnalysis`, for that user only, at most 50 rows per call (oldest first; a user with more is purged over several calls), in one atomic SQL statement that touches ONLY the `resumeText` key (all other evidence stays) and adds `evidence.resumePurgedAt` (ISO string). A failure is logged and ignored; it never breaks the request. Afterwards the row has `hasResumeText: false`, and `getATSScoreById` / `publicScore` already report `hasResumeText: false` and `resumePurged: true` for any result older than 90 days even before the purge has run, and `proposeAtsFix` / `applyAtsFix` return `NEEDS_REUPLOAD`.
- New field `resumePurged: boolean` (true when the text was removed by the purge, as opposed to a pre-Phase-4 result that never had text) on `getUserATSScores` rows, `getATSScoreById`, `createATSAnalysis` `data` and `updateATSScore` `data`. Use it for the note "Resume text is removed after 90 days; re-upload to use fixes".
- New field `candidateYears: number | null` (profile `User.experience`, whole years, no AI; `null` when not set) on `getUserATSScores` rows, `getATSScoreById`, `createATSAnalysis` `data` and `updateATSScore` `data`. It is the user's current profile value, not a per-result value. Show it next to the level badge ("3 years exp") only when not null.

### 8.6 Redirects (`next.config.mjs`, permanent, 308)

`/tools/resume` -> `/resume`, `/tools/ats` -> `/resume-parser`, `/tools/cover-letter` -> `/cover-letter`, `/tools/cold-email` -> `/cold-email`. Next redirects run before pages, so they apply even while the old preview pages still exist; the frontend then deletes those pages. `/tools/interview` and `/tools/roadmap` stay.


---

## 9. Phase 6 (D44-D48): open interview practice, roadmap parity, redirects

Conventions as before: only signed-out THROWS `Error("Unauthorized")`; expected failures are RETURNED as `{ error, code }`. Every query is scoped to the signed-in user's rows. New codes: `ALREADY_SCORED` and `SCORING_IN_PROGRESS` (9.2) and `MIGRATION_PENDING` (also for interview actions when the `interview_answer` migration is not applied; no AI call is spent). Other codes as in 6.3 / 7.1 (`AI_LIMIT`, `AI_UNAVAILABLE`, `NO_SOURCES`, `INVALID`, `NOT_FOUND`, `FAILED`). New migration `20261117040000_interview_answer` (SQL only, NOT applied by the agent).

### 9.1 `src/lib/interview/rubric.js` (plain JS, no imports; safe in server and UI)

```ts
RUBRIC_WEIGHTS = { clarity: 30, depth: 40, evidence: 30 }   // sums to 100
RUBRIC_CRITERIA = ["clarity", "depth", "evidence"]           // display order
RUBRIC_LABELS = { clarity: "Clarity", depth: "Depth", evidence: "Evidence" }
CRITERION_SCORE_MAX = 10                                     // each criterion is scored 0-10
ANSWER_MIN_CHARS = 20; ANSWER_MAX_CHARS = 5000                // answer length (after trim)
OPEN_QUESTION_COUNT = { min: 3, max: 10, default: 5 }
WEAK_AREA_MIN_ANSWERS = 2
computeOverall(criteria: {name, score}[]): number            // integer 0-100 = round(sum(score/10 * weight)); scores clamped, missing = 0
```

### 9.2 Open practice (`src/actions/Practice.js`, new file; the MCQ actions in `Interview.js` are unchanged)

Open questions live in `QuizSession.questions` as items `{ type: "open", question, topic, timeLimitSec, sourceIds, sources }`. Nothing server-only is stored there beyond that (there are no answers or rubric in the session); the rubric is only ever in `InterviewAnswer`.

`generateOpenQuestions({ count?: number, jobDescription?: string | null })`
- `count` integer 3-10 (default 5), `jobDescription` max 20000 chars; unknown keys or bad values => `INVALID`.
- One `write` call, plus at most one retry when too few sourced questions remain (D28; both count against the cap). Sources can only be job-description lines (`jd:<n>`) and the profile skills (`profile:skills`). A question with no valid source, a duplicate, or a number not found in the sources is dropped; harmless counts are allowed in questions (number words "two" to "ten" and bare digits 2-10, e.g. "Describe two approaches"), while years, percentages, currency, durations and numbers above 10 must still appear in the sources. May return fewer than `count` (at least 1); none => `NO_SOURCES` (also when there is no job description and the profile has no skills). `timeLimitSec` is clamped to 60-300.
- Returns:

```ts
{
  sessionId: string,
  questions: { index: number, question: string, topic: string, timeLimitSec: number, sources: Snapshot[] }[]
  // Snapshot = { id, kind: "jd"|"profile", label, excerpt }  (same as section 6.1; use SourceChips)
}
```
- Errors: `INVALID`, `NOT_FOUND` (no DB user), `NO_SOURCES`, `AI_LIMIT`, `AI_UNAVAILABLE`, `FAILED`.
- Housekeeping keeps open sessions that have scored answers; old (7 days) unsubmitted MCQ sessions and open sessions without scored answers are deleted. The two parts are independent: MCQ pruning still runs when the `interview_answer` table does not exist yet.

`scoreOpenAnswer(sessionId: string, index: number, answerText: string)`
- `answerText` trimmed, 20-5000 chars (`ANSWER_MIN_CHARS`, enforced on the server); `index` 0-9; else `INVALID`. Session must be yours and an open session, else `NOT_FOUND`; an index past the last question is `INVALID`.
- Scored once per (session, index). If a stored result exists, NO AI call is made and the stored result is returned with `code: "ALREADY_SCORED"`. Otherwise exactly one `fast` call (counts against the cap; there is no retry). Concurrency: the server first inserts a claim row for (session, index) (unique index). Only the claim winner calls the AI. A concurrent request while the claim has no result yet returns `SCORING_IN_PROGRESS` (no AI call); if the AI call or validation fails the claim is deleted so the user can retry; claims older than 2 minutes without a result are treated as stale and can be re-claimed.
- Server rules: every `quote` must appear verbatim in `answerText` after `normalizeText` on both sides, else that criterion's `quote` is `null` (the score stays). A quote must also be at least 3 words or 12 characters to count, otherwise it is `null`. The model's rubric must contain exactly the criteria clarity, depth and evidence, once each; anything else counts as a failed AI output (`FAILED`, claim released, nothing stored; no silent 0). Feedback and summary pass `inventedNumbers` (strict) against question + answer; sentences with unbacked numbers are dropped (empty string if nothing is left). `overall` is recomputed on the server from `RUBRIC_WEIGHTS`; the model's overall is ignored.
- Success returns:

```ts
{
  index: number,
  answerText: string,
  overall: number,                    // integer 0-100, label "AI estimate"
  createdAt: string,                  // ISO
  rubric: {
    criteria: {                       // always exactly 3, order clarity, depth, evidence
      name: "clarity" | "depth" | "evidence",
      weight: 30 | 40 | 30,
      score: number,                  // integer 0-10
      quote: string | null,           // verbatim from answerText (exact original substring when locatable), else null
      quoteRange: [number, number] | null,  // [start, end) offsets into answerText for highlighting; null when the quote matched only through normalization (e.g. hyphenation): then show the quote without highlight
      feedback: string                // may be ""
    }[],
    summary: string,                  // may be ""
    overall: number                   // same as above
  }
}
```
- Repeat: `{ error: "This question has already been scored.", code: "ALREADY_SCORED", index, answerText, overall, createdAt, rubric }` (the stored result, same fields as success).
- `{ error, code: "SCORING_IN_PROGRESS" }`: the same answer is being scored by another request. UI: keep the answer text, show the message, and let the user retry/refresh after a few seconds (calling again returns `ALREADY_SCORED` with the result once it finishes).
- Errors: `INVALID`, `NOT_FOUND`, `MIGRATION_PENDING`, `SCORING_IN_PROGRESS`, `AI_LIMIT`, `AI_UNAVAILABLE`, `FAILED`. When every question has a score, the session's `submittedAt` is set.
- `submitQuiz` now returns `INVALID` ("This is an open practice session...") for open sessions.

`getOpenSession(sessionId: string)` (ignores unfinished claim rows) returns (or `NOT_FOUND` for unknown / not yours / MCQ session, `MIGRATION_PENDING`, `INVALID`, `FAILED`):

```ts
{
  sessionId: string, createdAt: string, total: number, answered: number, completed: boolean,
  averageOverall: number | null,      // over scored answers, rounded
  questions: { index, question, topic, timeLimitSec, sources: Snapshot[],
               answer: { answerText, rubric, overall, createdAt } | null }[]   // answer shape as in scoreOpenAnswer
}
```

`getPracticeHistory()` returns `{ sessions: { sessionId, createdAt, total, answered, completed, averageOverall: number|null, topics: string[], href: "/interview/practice/<sessionId>" }[] }` (own sessions with at least one scored answer, newest first, max 50; `[]` when none) or `{ error, code: "MIGRATION_PENDING" | "FAILED" }`. The review route `/interview/practice/[sessionId]` is a frontend choice; `href` is only a suggestion.

`getWeakAreas()` (no AI) returns `{ topics: { topic, average, count }[], minAnswers: 2, totalAnswers: number, hiddenTopics: number }` or `{ error, code }`. Averages of `overall` per topic (case/whitespace-insensitive) over the user's own `InterviewAnswer` rows (latest 1000); only topics with at least 2 answers are listed, weakest first; `hiddenTopics` = topics with too few answers; empty `topics` => show the empty state. MCQ results are not included.

### 9.3 Roadmap (`src/actions/CareerRoadmap.js`)

`setRoadmapStepDone(id: string, stepId: number, done: boolean)`: owner-scoped; sets `completed` (adds `completedAt` ISO when done, removes it on undo), recomputes `progress` (completed / total * 100) and `currentStep` (id of the first incomplete step, else the step count). Safe against concurrent toggles (optimistic retry). Returns `{ success: true, id, stepId, done, progress, currentStep, steps }` or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`. Undo = call again with the old value; the UI reverts its local state if the result has `error`.
`updateRoadmapProgress(id, stepId, progress)` (existing, still throws on errors): the `progress` argument is now ignored (kept for compatibility); progress is always recomputed from the steps. Prefer `setRoadmapStepDone`.

`getGapFrequency()` (no AI): returns `{ gaps: { skill: string, count: number }[], resultCount: number }`. Counts `missingSkills` across the user's latest 200 ATS results; grouped case/whitespace/edge-punctuation-insensitively; a skill counts once per result; `skill` is the most common original spelling; sorted by count desc, max 50. `resultCount` = ATS results counted (use for "based on N ATS results"); `[]`/`0` when none. Error: `{ error, code: "FAILED" }`.

`getStepTargets(roadmapId: string)` (no AI): returns `{ targets: { [stepId: string]: { company: string, role: string, jdExcerpt: string, kinds: ("ats"|"coverLetter"|"coldEmail")[] }[] } }` with every step id present (possibly `[]`). Targets come from the user's own ATS results, cover letters and cold emails (D18, deduplicated by company+role, newest first, a pair needs a company or role), and appear only when the STORED job description names the step's skill or title (whole-term match through `normalizeText`; skills from the match vocabulary found in the step's `skill`/`title`, the whole title, multi-word phrases of 2-3 consecutive non-generic words from the title, and terms from the step's stored `sources` (profile skills and vocabulary terms in target-role excerpts) that count only if the step's own title, description or skill also names them as a whole word; generic single words such as "skills" or "project" never match alone). `jdExcerpt` is the matching job-description line, max 240 chars; at most 5 targets per step. Errors: `INVALID`, `NOT_FOUND`, `FAILED`. The shape is wrapped in `{ targets }` so errors can be told apart.

### 9.4 Cold email check and redirects

- `generateColdEmail`: before the AI call it probes the Phase 5 columns with a one-row `findFirst`. Missing columns (Prisma P2022) => `{ error, code: "MIGRATION_PENDING" }` with NO AI call and no `AiUsage` row. Other DB errors => `FAILED`.
- Redirects (`next.config.mjs`, permanent 308): `/tools/interview` -> `/interview`, `/tools/roadmap` -> `/roadmap`, `/tools` -> `/dashboard` (plus the four from 8.6). The middleware `/tools(.*)` guard stays (harmless).

## 10. Phase 7 (D49-D53): cap per action, profile validation, paragraph hashes

### 10.1 Migrations (SQL only, NOT applied by the agent)
Apply order (renamed so they sort after `20261117010000_quiz_session`; contents unchanged): `20261117000000_ai_usage`, `20261117010000_quiz_session`, `20261117020000_phase3_sources`, `20261117030000_cold_email_fields`, `20261117040000_interview_answer`, then NEW `20261117050000_ai_usage_action_id` (adds nullable `AiUsage.actionId` and index `(userId, createdAt)`). Runbook: `docs/ai/DEPLOY.md`. Before the new migration is applied the cap query fails: production blocks AI with `AI_UNAVAILABLE` (D33), dev fails open.

### 10.2 Cap counts one per user action (amends section 4 and 7.8, D50)
- `withAiAction(fn)` (`src/lib/ai/action.js`, re-exported from `@/lib/ai`) gives one `actionId` to every `runAI` call made inside it. The cap is checked once, right before the first call of the action; later calls in the same action (retries, re-scores, regenerate/shorten second try) are never blocked part-way. Every call is still logged as an `AiUsage` row (with `actionId`).
- Used count = distinct `actionId`s today (UTC) + legacy rows with `actionId` NULL counted individually. Over the limit => the NEXT action returns `AI_LIMIT`. Disabled with `AI_DAILY_LIMIT=0`; unset = 50 actions/day. The cap is a SOFT cap: the check and the usage log are not atomic, so concurrent actions started at limit-1 can each pass and overshoot slightly.
- Wrapped entry points: `improveWithAI`, `tailorResume`, `createATSAnalysis`, `proposeAtsFix`, `applyAtsFix`, `generateCoverLetter`, `regenerateCoverLetter`, `shortenCoverLetter`, `generateColdEmail`, `generateCareerRoadmap`, `generateProgressRecommendations`, `generateQuiz`, `submitQuiz` (tip), `generateOpenQuestions`, `scoreOpenAnswer`, and the `/api/chat` POST. No request or response shape changed. UI: the "N per day" copy now means actions, not calls.

### 10.3 `updateUser(data)` (`src/actions/User.js`)
Input is validated with zod: `industry` string 1-100, `experience` integer 0-60 (numeric strings accepted), `skills` array of at most 50 strings of 1-50 chars (optional), `bio` at most 500 chars (optional). Signed out still THROWS `Error("Unauthorized")`. Everything else is RETURNED: `{ error: string, code: "INVALID" | "NOT_FOUND" | "FAILED" }` (these used to throw). Success returns the updated user row spread plus `success: true` (the onboarding form already checks `result.success`). The form must show `result.error` when present. No `IndustryInsight` rows are created any more (D54); `User.industry` is a plain string.

### 10.4 Paragraph hashes (cover letter, cold email)
`sources.paragraphs[i]` is now `{ kind, hash, sources }` on NEW generations (`generateCoverLetter`, `generateColdEmail`, `regenerateCoverLetter`). `hash = paragraphHash(text)` from `src/lib/entryIds.js` (plain, isomorphic: FNV-1a base36, 7 chars, over the paragraph text with whitespace collapsed and trimmed). `shortenCoverLetter` refreshes `hash` for every paragraph it rewrote (source ids untouched). Legacy rows have no `hash`: use the old index rule. To map chips in the UI: split content on blank lines, `paragraphHash(each)`, find the stored paragraph with the same `hash`; no match means the paragraph was edited (show no chips). Conservative behavior: a paragraph that `shortenCoverLetter` shortened gets fresh hashes, so its chips stay; a paragraph the user edited by hand matches nothing and shows no chips.

### 10.5 Other
- `derive.js`: generic phrases ("customer facing", "cross functional", "fast paced", "best practices", ...) no longer produce step targets.
- Sentry (D51) is server/browser inert without `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`; no API change.
- `npm test` (Vitest) runs the unit tests; `node scripts/selfcheck-matching.mjs` still works.

---

## 11. UX flow pass (D55-D63): jobs, applications, pipeline, needs you, onboarding, undo

Branch `ux-flow-pass`. Conventions as in the top of this file: signed-out THROWS `Error("Unauthorized")`; everything else RETURNS `{ error: string, code }`; dates are ISO strings; every query is scoped by the caller's user id. **Status key:** BUILT = implemented in this branch (tasks 1-3); DESIGN = frozen shape, backend built in tasks 4-6 (frontend may build against it, and must handle `{ error, code }` anyway).

### 11.1 Migration `20261117070000_job_application_flow` (SQL only, NOT applied by the agent)
Apply after `20261117060000_remove_industry_insight` (runbook: `docs/ai/DEPLOY.md`). One migration for tasks 1-6:
- enums `ApplicationStatus` (`SAVED | APPLIED | INTERVIEWING | OFFER | CLOSED`) and `JobSearchStage` (`JUST_STARTING | APPLYING | INTERVIEWING`).
- `Job` (id, userId, url?, jdText, company?, title?, location?, sources Json?, createdAt, updatedAt, deletedAt?) and `Application` (id, userId, jobId UNIQUE, status default SAVED, appliedAt?, interviewAt?, nextActionAt?, followUpCount default 0, closedReason?, closedAt?, gapTasksAddedAt?, prepSessionId?, pipeline Json?, createdAt, updatedAt, deletedAt?). Deleting a Job/User cascades to its Application.
- optional `jobId` (FK `ON DELETE SET NULL`) on `CoverLetter`, `ColdEmail`, `ATSScore`, `ResumeVersion`; `deletedAt` on `CoverLetter`, `ColdEmail`, `ATSScore` (Job and Application have their own).
- `User.targetRole` (text?) and `User.jobSearchStage` (enum?).
- indexes: `Job(userId, deletedAt)`, `Application(userId, status, deletedAt)`, `Application(userId, nextActionAt)`, `(userId, deletedAt)` and `(jobId)` on the three document tables, `ResumeVersion(jobId)`.
- No column for letter snapshots: the previous content lives in `sources.previous` (11.7). No column for "reviewed": see `needsYou` in 11.4.
- Until it is applied, reads that filter `deletedAt`/`jobId` fail (the app must not be promoted before `prisma migrate deploy`). `tailorResume` now filters its draft cleanup on `jobId`, so it also needs the migration.

### 11.2 Security fix (BUILT)
`seedResumeTemplates` is gone from `src/actions/Resume.js` (an exported server action is callable by any visitor and wrote global rows). Seeding is script-only: `seeder/seedTemplates.js` / `seeder/seed.js` (unchanged). No UI used it.

### 11.3 Job intake (BUILT, `src/actions/Jobs.js`)

Shared shapes:
```ts
Snapshot = { id: string, kind: string, label: string, excerpt: string }   // as in section 6
Job = {
  id: string, url: string | null,                 // url = "Open job page" target
  company: string | null, title: string | null, location: string | null,   // null = not stated, chip is empty + editable
  sources:  { company: Snapshot[], title: Snapshot[], location: Snapshot[] },  // jd:<line> evidence; [] when null or user-typed
  origin:   { company: "page"|"ai"|"user"|null, title: ..., location: ... },
  jdText?: string,                                 // only from getJob
  createdAt: string,
  application: Application | null
}
Application = { id, status: ApplicationStatus, appliedAt: string|null, interviewAt: string|null, nextActionAt: string|null, followUpCount: number, closedReason: string|null }
```

`intakeJob({ input: string (1-60000), url?: https string (<=2000), asJob?: boolean })` returns one of:
- `{ kind: "question", text }`: the input is a question. NO AI call, nothing stored. Send `text` to chat (D62).
- `{ kind: "job", job: Job, applicationId: string, notice: null | "AI_LIMIT" | "AI_UNAVAILABLE" | "EXTRACT_FAILED" }`: Job + Application(SAVED) created atomically. With a `notice` the job exists but company/title/location may be null; show the chips as empty and editable (optionally a small hint). Chips read from a JSON-LD/labelled header need no AI.
- `{ error, code, url? }`.

Classification (`src/lib/jobs/classify.js`, pure, importable in the UI too): `classifyInput(input)` gives `{kind:"url",url}` (a link, alone or with up to 80 other chars; bare `www.` links count), `{kind:"text",text}` (job-description phrases plus length: 3+ phrases from 150 chars, 1 phrase from 400, or 1200+ chars), `{kind:"question",text}` (anything else, especially a trailing `?` or a leading question word) or `{kind:"empty"}`. `asJob: true` forces pasted text to be treated as a job (a "this is a job" escape hatch). `url` is the link the pasted text came from (after `PASTE_NEEDED`); it is only stored, never fetched.

Error codes of `intakeJob`:
| code | when | friendly `error` / notes |
|---|---|---|
| `INVALID` | empty/oversized input, text under 40 chars, bad `url` | "Paste a job link, the job text, or a question." |
| `NOT_FOUND` | no DB user | "We couldn't find your profile. Please finish onboarding first." |
| `URL_BLOCKED` | not https, credentials in the link, port other than 443, localhost/internal name, or the host resolves (any address, also after a redirect) to a private, loopback, link-local, CGNAT, metadata, multicast, reserved, IPv6 ULA/link-local, or IPv4-mapped/NAT64/6to4 private address | "That link points to a private or internal address..." / "Only https links can be read..." Returns `url`. Offer the paste box. |
| `PASTE_NEEDED` | site answered 401/403/429/451, is not `text/html`, is over 2 MB, or the readable text is under 200 chars (login wall, script-rendered page) | "We couldn't read that page ... Paste the job text here". Returns `url`; show the paste box and send `intakeJob({input: pastedText, url})`. |
| `FETCH_FAILED` | DNS failure, timeout (5 s), network error, more than 3 redirects, 404/5xx | "We couldn't reach that page right now. Try again, or paste the job text instead." Returns `url`. |
| `NOT_A_JOB` | page text has no JSON-LD `JobPosting` and does not read like a job posting | "That page doesn't look like a job posting..." Returns `url`. |
| `FAILED` | anything else | generic retry |
`AI_LIMIT`/`AI_UNAVAILABLE` do not fail intake (see `notice`). The call is one cap-counted action (D50).

URL guard (D56, `src/lib/jobs/fetch.js`): https only; DNS resolved server-side and ALL addresses vetted; the connection is pinned to the vetted IP and the socket's remote address is re-checked; every redirect (max 3) repeats all checks; 5 s total timeout; 2 MB streamed cap; `text/html` only; no cookies/credentials; generic User-Agent; no compression. Text is extracted with script/style removed; a JSON-LD `JobPosting` wins and is written as `Job title:` / `Company:` / `Location:` header lines followed by the description. Every chip is checked against the `jd:` lines it cites (ids exist, every word and number is in those lines); anything unverified is `null`.

Other actions (all BUILT, owner-scoped, not-deleted only):
- `getJob(id)` returns `Job` (with `jdText`, `application`) or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`.
- `updateJobField(id, field: "company"|"title"|"location", value: string | null)` (value trimmed, single line, 0-200 chars; `""`/`null` clears). Saves on Enter/blur. The edited chip's `sources` become `[]` and `origin[field]` becomes `"user"` (or `null` if cleared). Returns the updated `Job` (no `jdText`) or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`.
- `deleteJob(id)` soft-deletes the job AND its application; returns `{ success: true, id }`. `restoreJob(id)` is the 5 s Undo (works up to 7 days; later `NOT_FOUND`). Errors: `INVALID | NOT_FOUND | FAILED`.

### 11.4 Pipeline (BUILT, `src/actions/Pipeline.js`; D57, D50, D34)

Steps, always in this order: `CHECKER` (computed match % from keywords + an ATS score of the saved resume text against the job description, stored as an `ATSScore` with `jobId`), `TAILOR` (a `tailorResume` draft with `jobId`), `WRITER` (a cover letter with `jobId`), `CONNECTOR` (a cold email draft with `jobId`; NEVER with recipient name, role or email, the user types those; nothing is ever sent).

```ts
Pipeline = {
  applicationId: string, jobId: string,
  steps: {
    step: "CHECKER"|"TAILOR"|"WRITER"|"CONNECTOR",
    status: "pending"|"running"|"done"|"skipped"|"failed",
    reason: string | null,                      // skipped: "NO_RESUME"
    error: { code: string, error: string } | null,   // failed only
    output: object | null,                      // CHECKER {matchPercent, matched[], missing[], termCount, atsScore, atsScoreId}
                                                // TAILOR {draftId, proposalCount, matchPercent}; WRITER {coverLetterId}; CONNECTOR {coldEmailId}
    ids: { atsScoreId? | draftId? | coverLetterId? | coldEmailId? },
    needsYou: boolean,                          // true when the output awaits approval (TAILOR, WRITER, CONNECTOR when done)
    startedAt: string | null, finishedAt: string | null
  }[],                                          // always 4 entries, in order
  next: step | null,                            // the step the next runNextStep call will run
  busy: boolean,                                // another tab holds a fresh claim on `next`
  complete: boolean,                            // every step done or skipped
  completedCount: number                        // 0-4, for the progress bar
}
```
- `getPipeline(applicationId)` returns `Pipeline` (read only; a never-started application shows 4 `pending`) or `{ error, code: "INVALID" | "NOT_FOUND" | "FAILED" }`.
- `runNextStep(applicationId)` runs ONE step and returns `Pipeline & { ran: step | null }`. The page loops: call it until `complete`, on `busy` wait ~2 s and call again, and call it again on return to resume. When a step fails the result also has `{ error, code, step }` (top level) alongside the pipeline; the step stays `failed` and the next call retries that step only. Codes: `INVALID | NOT_FOUND | FAILED` for the call itself; per step `AI_LIMIT | AI_UNAVAILABLE | NO_SOURCES | INVENTED_DETAIL | FAILED | NOT_FOUND`. Map them with the existing generation-error helper.
- A missing resume skips CHECKER and TAILOR (`status: "skipped"`, `reason: "NO_RESUME"`): say "add your resume to see your match" and carry on; WRITER and CONNECTOR still run from the profile and job description.
- Idempotent: a done or skipped step never runs again, so repeated calls never duplicate rows; the step is claimed with a compare-and-swap on the application row, so two tabs cannot both run it; a claim older than 3 min (tab closed mid-step) is taken over, and an output already linked to the job (same `jobId`, not deleted) is adopted instead of regenerated.
- ONE `actionId` per run (D50), stored in `Application.pipeline.run`. The daily cap is checked once, before the run's first AI call; later steps and retries are never blocked part-way. `AI_LIMIT` on the first step leaves the run unstarted; try again tomorrow.
- Generators accept an optional `jobId` (`generateCoverLetter`, `generateColdEmail`, `tailorResume`, and the manual tools via the job picker in task 12). A `jobId` that is not the caller's, or is deleted, returns `NOT_FOUND` "We couldn't find that job." before any AI call. The letter/email/score/version rows then carry `jobId`.
- `ATSScore` rows made by the pipeline are real scores (evidence, resume text) and show in the ATS tool; `ResumeVersion` drafts follow the 24 h expiry of 7.5.
- "Needs you" source (task 4): an item exists while the pipeline step has `needsYou: true`; approving it (task 4 action) sets it to false. Nothing is applied to the main resume by the pipeline.

### 11.5 Needs you, application status, result taps (BUILT, task 4; `src/actions/Applications.js`, `Dashboard.js`)
```ts
NeedsYouItem = {
  id: string,                                   // stable: "<type>:<refId>"
  type: "TAILOR_DRAFT" | "COVER_LETTER" | "COLD_EMAIL" | "ATS_FIX" | "FOLLOW_UP" | "PREP_INTERVIEW",
  applicationId: string | null, jobId: string | null,
  title: string,                                // e.g. "Review resume edits for Acme"
  company: string | null, jobTitle: string | null,
  refId: string,                                // draftId | coverLetterId | coldEmailId | atsScoreId | applicationId
  href: string,                                 // where to review it
  dueAt: string | null,                         // FOLLOW_UP / PREP_INTERVIEW
  createdAt: string
}
```
- `getNeedsYou()` returns `{ count: number, items: NeedsYouItem[] }` (derived, newest first, max 50) or `{ error, code }`. Sources: pipeline steps with `needsYou`, ATS scores with fixable weaknesses, follow-ups due (5 quiet days after `appliedAt` while status is APPLIED; at most 2 per application, tracked in `followUpCount`/`nextActionAt`, created lazily on load; the draft is only written when the user clicks it and is never sent), and INTERVIEWING applications with `interviewAt` in the future and no `prepSessionId`.
- `approveNeedsYou(applicationId, step: "TAILOR"|"WRITER"|"CONNECTOR")` sets that step's `needsYou` to false. Returns `{ success: true }`.
- `setApplicationStatus(id, status)` returns `{ application: Application, previousStatus: ApplicationStatus }` (use `previousStatus` for Undo by calling it again). `markApplied(id)` sets APPLIED and `appliedAt` (returns the same shape). `setInterviewDate(id, date: ISO string | "YYYY-MM-DD")` sets INTERVIEWING + `interviewAt` and creates the prep session from the job description (`prepSessionId`; one AI action), returning `{ application, previousStatus, prepSessionId: string | null }`; if prep could not be created, `prepSessionId` is null and `prepError` holds the code (the date is still saved). `closeApplication(id, reason: string 0-300)` sets CLOSED + `closedReason`, turns the ATS gaps linked to that job into roadmap tasks with NO AI (once, `gapTasksAddedAt`), returns `{ application, previousStatus, tasksAdded: number }`. Errors: `INVALID | NOT_FOUND | FAILED` (`NO_ROADMAP` is not an error: `tasksAdded` is 0 and tasks go to a new "Gaps" roadmap only if the user has an active one).
- `getApplications()` returns `{ applications: { id, status, job: {id, company, title, location, url}, appliedAt, interviewAt, prepSessionId: string | null, nextActionAt, nextAction: { label: string, href: string } | null, updatedAt }[] }` (not deleted, newest activity first) for the board and home.
- `getDashboardData()` adds `applications` (max 10, same shape as above), `needsYouCount: number`, `hasOffer: boolean` (any non-deleted application in OFFER), `profileStrength: number | null`. Existing fields and `targets` are unchanged (old derived targets stay as a fallback).

### 11.6 Onboarding and profile (BUILT, task 5; `src/actions/Onboarding.js`, `User.js`)
```ts
Chip = { id: string, kind: "role"|"project"|"skill"|"years", label: string, detail?: string,
         source: { quote: string } }            // quote verified against the extracted PDF text; unverified items are dropped
```
- `parseResumeToProfile({ resumeBase64, resumeType? })` (same PDF rules and `INVALID_FILE` as 6.3; text extracted in memory, one `write` call) returns `{ chips: Chip[], suggestedTargetRole: string | null, suggestedIndustry: string | null, years: number | null }`. NOTHING is stored. Errors: `INVALID_FILE | NO_SOURCES | AI_LIMIT | AI_UNAVAILABLE | FAILED`.
- `saveProfileChips({ chips: { kind, label, detail? }[] (<=80), industry?: string, years?: number })` writes builder entries (with stable ids) into the resume, skills and years into the user, returns `{ success: true, strength: ProfileStrength }`. Errors: `INVALID | NOT_FOUND | FAILED`.
- `saveOnboardingAnswers({ targetRole: string (1-100), stage: "JUST_STARTING"|"APPLYING"|"INTERVIEWING" })` returns `{ success: true }`.
- `getProfileStrength()` returns `{ percent: number (0-100), nextAction: { label: string, href: string } | null, parts: { name: string, done: boolean }[] }`.
- Onboarded (D59) = the user has a resume OR both `targetRole` and `jobSearchStage` set; existing users stay onboarded. `updateUser` (10.3) keeps working.

### 11.7 Undo and deleting data (BUILT, task 6)
- Soft deletes set `deletedAt`: `deleteCoverLetter`, `deleteColdEmail`, `deleteATSScore` now return `{ success: true, id }`; `restoreCoverLetter(id)`, `restoreColdEmail(id)`, `restoreATSScore(id)` return `{ success: true, id }` (7 days, then `NOT_FOUND`). Every reader (lists, get-by-id, dashboard counts, targets, analytics) hides deleted rows; rows are hard-deleted lazily 7 days after `deletedAt`.
- `restoreResumeVersion(id)` additionally returns `undoVersionId` (= `backupVersionId`); Undo is `restoreResumeVersion(undoVersionId)`.
- Letter edits that replace content: `regenerateCoverLetter`, `shortenCoverLetter` and the new tone `"warmer"` (`COVER_LETTER_TONES` gains `warmer`; `TONE_PROMPTS` too) store `{ content, sources, at }` in `sources.previous` first. `undoLetterChange(id)` swaps it back (and clears it) and returns the letter row, or `{ error, code: "NOTHING_TO_UNDO" | "NOT_FOUND" | "FAILED" }`. Only one level of undo is kept.
- `deleteAllMyData({ confirmation: string })` and `deleteAccount({ confirmation: string })` (src/actions/Account.js). `confirmation` must equal exactly `DELETE MY DATA` / `DELETE MY ACCOUNT` (trimmed, case-sensitive) else `{ error, code: "CONFIRMATION_REQUIRED" }`. `deleteAllMyData` deletes all the caller's rows in dependency order (InterviewAnswer first, applications, jobs, documents, resume and versions, roadmaps, goals, sessions, assessments) and resets the profile fields; the account stays. `deleteAccount` does the same, deletes the user row and then the Clerk user. Both return `{ success: true }` or `{ error, code: "CONFIRMATION_REQUIRED" | "FAILED" }` and never touch another user's rows. The UI signs the user out after `deleteAccount`.

### 11.7b Shape notes and additions from tasks 4-6 (read these)
- **Item hrefs (11.5):** `COVER_LETTER` -> `/cover-letter/<id>`, `COLD_EMAIL` -> `/cold-email/<id>`, `ATS_FIX` -> `/resume-parser`, `TAILOR_DRAFT` -> `/needs-you?item=<id>` (the review queue, task 11), `FOLLOW_UP` and `PREP_INTERVIEW` -> `/jobs/<jobId>`. Use `type` and `refId` to route differently. A TAILOR draft that expired (24 h) or was already saved drops out of the queue; a deleted letter/email drops out; an `ATS_FIX` item exists only for the NEWEST non-deleted ATS result of a job that has a resume quote in a weakness and stored resume text (under 90 days).
- **`approveNeedsYou` also accepts `step: "CHECKER"`** (dismisses the ATS_FIX item; not in the original enum). Idempotent.
- **Added actions (src/actions/Applications.js):** `createFollowUpDraft(applicationId)` is the click behind a `FOLLOW_UP` item. It writes ONE cold-email draft from the job record (template text, no AI, no recipient, nothing sent), increments `followUpCount` (max 2) and moves `nextActionAt` 5 days out. Returns `{ coldEmailId, href, followUpCount }` or `{ error, code: INVALID | NOT_FOUND | NOT_DUE | FAILED }`. `createInterviewPrep(applicationId)` retries prep for a `PREP_INTERVIEW` item (one AI action): `{ prepSessionId }` or `{ error, code }`.
- **Interview date:** `YYYY-MM-DD` is stored as 00:00 UTC of that day (no time is invented); an interview counts as upcoming through that whole day. Allowed range: 1 year back to 2 years ahead (else `INVALID`). Prep is created INSIDE `setInterviewDate` (not deferred), 5 questions from the job description.
- **Close -> gaps:** the tasks are appended as `Skill gap` steps ("Learn <skill>", max 10, deduped, skipped when a step with that skill already exists) to the user's most recently updated ACTIVE roadmap, not to a new "Gaps" roadmap. No active roadmap: `tasksAdded` 0 and `gapTasksAddedAt` stays unset so a later close can still add them. Moving out of CLOSED (Undo) clears `closedReason`; tasks already added are not removed.
- **Status side effects:** `APPLIED` sets `appliedAt` (kept when already set, except from SAVED) and `nextActionAt = appliedAt + 5 days`; `SAVED` clears `appliedAt`/`nextActionAt`; INTERVIEWING/OFFER/CLOSED clear `nextActionAt`.
- **Dashboard (11.5):** the four new fields fall back to `[]`, `0`, `false`, `null` if their own query fails. `profileStrength` is the percent.
- **Onboarding:** `Chip.kind` also has `"years"` (label "5 years", only when the text states it). A role chip's `detail` is the employer, a project chip's `detail` a phrase from the text; both are dropped when not in the text. `saveProfileChips` accepts `kind: "years"` chips too (used if `years` is absent). Roles/projects are merged into the existing resume (existing entries kept, duplicates skipped); skills are merged into `User.skills` (max 50) and `Resume.skills`. `suggestedIndustry`/`suggestedTargetRole` are null unless backed by a quote. `getUserOnboardingStatus` = industry set OR resume exists OR (`targetRole` and `jobSearchStage`). `getProfileStrength` parts: Resume added, Experience or projects, Skills (3+), Target role, Job search stage, First job added.
- **`getProfileChips()` (src/actions/Onboarding.js):** returns the signed-in user's current profile as chips for `/onboarding?edit=1`: `{ chips, suggestedTargetRole: null, suggestedIndustry: { value, source: null } | null, years, industry }`. Chip shape as `parseResumeToProfile` (`{ id, kind: role|project|skill|years, label, detail?, source }`) but every `source` is `null` (existing data has no quotes). Role/project chips have `id` = the resume builder entry id (`label` = title, `detail` = organization for roles, description for projects); skills come from `User.skills`; a `years` chip from `User.experience`. Errors (returned): `NOT_FOUND`, `FAILED`.
- **`saveProfileChips` edit mode:** input accepts an optional `id` per chip and `mode: "merge" | "replace"` (default `merge`, unchanged). With `mode: "replace"` the chips are the full profile: skills not sent are removed from `User.skills` and `Resume.skills`; role/project entries whose `id` is not sent are removed from the resume builder (the user deleted that chip; no undo); entries sent with their `id` get the edited label/detail; chips with an unknown or `c_...` id are added (deduped by title+organization); no `years` chip (and no `years` field) clears `User.experience`; `industry: ""` clears industry. Entry fields other than title/organization/description (dates, bullets) are kept. Limitation: if the chip list is sent empty in replace mode, all roles, projects and skills are removed. Send the ids from `getProfileChips` unchanged.
- **Soft delete readers:** `deleteATSScore` now returns `{ success: true, id, message }`; `restoreATSScore(id)` is in `src/actions/ResumeParser.js`. `getCoverLetter`/`getColdEmail` return `null` for deleted rows. `applyAtsFix` copies `jobId` to the new result. Lazy hard-delete (7 days, max 50 per model per call, per user) runs from the list readers and the dashboard, for letters, emails, ATS results and jobs.
- **Letters:** `regenerateCoverLetter` (including `formality: "formal"` and tones, `warmer` included) and `shortenCoverLetter` write `sources.previous = { content, sources, at }` (one level).
- **Account:** the field is `confirmation` (`confirm` is accepted as an alias). Extra codes: `NOT_FOUND` (deleteAllMyData, no profile) and `CLERK_FAILED` (deleteAccount: the data is already gone, calling it again retries only the Clerk step). `deleteAllMyData` keeps AiUsage rows from the last 24 h so it cannot reset the daily AI limit; `deleteAccount` deletes them all.

### 11.8 Frontend checklist
- Home input: `intakeJob({ input })` -> `kind:"question"` opens chat with `text` pre-sent; `kind:"job"` goes to `/jobs/<job.id>` and starts the `runNextStep` loop.
- On `PASTE_NEEDED`, `URL_BLOCKED`, `FETCH_FAILED`, `NOT_A_JOB`: show `error`, keep `url`, offer a paste box, then call `intakeJob({ input: pasted, url, asJob: true })`.
- Chips: `updateJobField` on Enter/blur; show `sources[field]` on hover (`SourceChips`); `origin` tells "from the page" / "AI" / "you".
- `deleteJob` -> 5 s Undo toast -> `restoreJob`.
- Nothing in 11 sends an email or edits the main resume; chat stays read-only (D62).


### 11.9 Fix round 1 (backend)
- **`prepSessionId`** (string | null) is now on `Application` everywhere: `getJob`/`publicJob.application`, every `application` returned by `Applications.js` actions, `getApplications` and the dashboard. `nextAction` for INTERVIEWING with an upcoming date and a prep session is `{ label: "Practice for your interview", href: "/interview/practice?session=<id>" }`. With no `interviewAt` at all it is `{ label: "Add your interview date", href: "/jobs/<id>" }`; with a past date it stays "Add the result".
- **`PREP_INTERVIEW` needs-you item** stays until at least one `InterviewAnswer` of the prep session has a score (`overall` not null). Its `href` is `/interview/practice?session=<id>` when a session exists, else `/jobs/<jobId>`.
- **`setApplicationStatus(id, status, interviewAt?)`**: every result now has `previousInterviewAt: string | null` (the value before the move). For Undo call `setApplicationStatus(id, previousStatus, previousInterviewAt)`: a date string sets `interviewAt`, `null` clears it, omitted leaves it unchanged. A plain board move never changes `interviewAt`, so moving to INTERVIEWING without a date shows "Add your interview date". `setInterviewDate` also returns `previousInterviewAt`. Invalid date string: `INVALID`.
- `deleteATSScore` removes `evidence.resumeText` in the same update as `deletedAt` (a restored result needs a re-upload for the resume fix).
- Job chip values must read contiguously inside one cited line; `suggestedIndustry` must appear (whole word) in its quote.

### 11.10 Fix round 2 (backend): saved resume for ATS, resume and roadmap undo, board interview prep

**Migration:** still ONE unapplied migration, `20261117070000_job_application_flow`. It gains `CareerPath.deletedAt`, `Resume.deletedAt` (both `TIMESTAMP(3)` null) and index `CareerPath(userId, deletedAt)`. Same rule as 11.1: do not promote the app before `prisma migrate deploy` (readers now filter `deletedAt`).

1. **`createATSAnalysis({ ..., useSavedResume: true })`** is an alternative to `resumeBase64` (send one of them; neither gives `INVALID_FILE`). The text is `resumeToText` of the user's builder resume (the same text the pipeline CHECKER uses, max 30000 chars) and quotes are verified against it. No saved resume (or no text in it): `{ success:false, code:"NO_RESUME", error }` before any AI call. The PDF path is unchanged. Both paths store `evidence.resumeSource: "saved" | "pdf"` (the stored resume text stays server-side; `resumeSource` is returned in `data.evidence`).
2. **`deleteResume()`** is now a soft delete: it writes a `ResumeVersion` labelled `Deleted resume <date> UTC` (full snapshot) and sets `Resume.deletedAt`; the versions stay attached, so there is no FK error. Returns `{ success: true, undoId }` (`undoId` = the snapshot version id; `null` when there was no resume). **`restoreDeletedResume(undoId)`** clears `deletedAt` within 7 days and returns `{ success: true }` or `{ error, code: INVALID | NOT_FOUND | CONFLICT | FAILED }`; `CONFLICT` means the user already started a new resume (a save reuses the deleted row, resetting it first), which is never overwritten; the snapshot stays in the version list and can be restored with `restoreResumeVersion`. Every resume reader ignores a deleted resume (resume page, tailor, ATS saved text, pipeline, letters, emails, roadmap generation, profile strength, onboarding, dashboard). Hard delete after 7 days by the lazy prune (`pruneDeleted`, versions first).
3. **`deleteCareerRoadmap(id)`** is a soft delete (`CareerPath.deletedAt`) and now RETURNS `{ success: true, id }` or `{ error, code: INVALID | NOT_FOUND | FAILED }` (it used to return the deleted row or throw). **`restoreCareerRoadmap(id)`** returns `{ success: true, id }` or `{ error, code }` (7 days, then `NOT_FOUND`). Readers that filter `deletedAt: null`: `getCareerRoadmaps`, `getCareerRoadmap`, `updateRoadmapProgress`, `completeRoadmapStep`, `generateProgressRecommendations`, `setRoadmapStepDone`, `getStepTargets`, dashboard `nextTasks`/targets, `chatContext`, gap tasks from `closeApplication`/board close (appended to the most recently updated ACTIVE non-deleted roadmap). `deleteAllMyData`/`deleteAccount` remove deleted rows too; the lazy prune hard-deletes them after 7 days.
4. **`setApplicationStatus(id, "INTERVIEWING", date)`** with a date now behaves exactly like `setInterviewDate` (shared helper, one AI action): it saves status and date, then creates or links the prep session. The result has `prepSessionId: string | null` and, on failure, `prepError` (the code, e.g. `AI_LIMIT`); the status and date are saved either way. Without a date nothing changes (no prep, no `prepSessionId` key). Undo still works with `setApplicationStatus(id, previousStatus, previousInterviewAt)`. Note: undoing an interview move keeps `prepSessionId` linked on purpose, so the same session is reused the next time a date is set.
5. Internal: the doc comment of `pinnedLookup`/`httpsRequest` in `src/lib/jobs/fetch.js` is no longer split.

## Requests from frontend

All five requests from the UX flow pass (frontend tasks 10-12) are RESOLVED. Exact shapes:

1. **RESOLVED `getTailorDraft(draftId: string)`** (`src/actions/Resume.js`). Owner-scoped (the draft must belong to the caller's resume). Returns
   `{ draftId, jobId: string | null, jobTitle, companyName, matchBefore: {percent,matched,missing,termCount}, proposals: [{ proposalId, entryId, bulletIndex, original, proposed, reason, sources: Snapshot[] }], expiresAt: ISO string }` (same shape as `tailorResume` plus `jobId` and `expiresAt`; `matchBefore` is computed against the CURRENT resume) or `{ error, code }` with `INVALID` (empty id), `NOT_FOUND` (not yours, missing, or already saved as a version), `STALE` (older than 24 h; this is the "expired" code, same as `saveTailoredVersion`), `FAILED`. Signed-out throws.
2. **RESOLVED `saveTailoredVersion` `edits`.** Input is now `{ draftId, acceptedProposalIds, label?, edits?: { [proposalId]: string } }`. Each edit is whitespace-collapsed to one line and must be 1-600 chars; its key must be in `acceptedProposalIds` AND a proposal of this draft, otherwise the whole call returns `INVALID` ("You can only edit lines you accepted." / "...from this draft." / length) before anything is saved. Edited text replaces `proposed` for that save and goes through the same checks as any proposal: the original bullet must still be unchanged (else skipped `RESUME_CHANGED`) and every number must appear in the original bullet or the job description (else skipped `FAILED_CHECK`). It skips the AI-source requirement: the stored `applied[]` entry has `userEdited: true` and `sources: []` (no chips). `getResumeVersion(id).applied[]` therefore may contain `userEdited: true`. Return shape unchanged (`applied` lists ids, including edited ones).
3. **RESOLVED `getProfileChips()`** now also returns `targetRole: string | null` and `jobSearchStage: "JUST_STARTING" | "APPLYING" | "INTERVIEWING" | null`.
4. **RESOLVED `createATSAnalysis` `jobId`.** Optional `jobId: string` (1-100) in the input object. Same check as `generateCoverLetter`: a job that is not the caller's or is deleted returns `{ success:false, error:"We couldn't find that job.", code:"NOT_FOUND" }` before any AI call; otherwise `ATSScore.jobId` is set. Without it nothing changes.
5. **RESOLVED `unapproveNeedsYou(applicationId, step)`** (`src/actions/Applications.js`), the Undo of `approveNeedsYou`. `step` as in `approveNeedsYou` (`CHECKER | TAILOR | WRITER | CONNECTOR`). TAILOR/WRITER/CONNECTOR set `needsYou: true` again (only when that step is `done`; otherwise a no-op); CHECKER clears the dismissal so the ATS_FIX item returns. Idempotent. Returns `{ success: true }` or `{ error, code: INVALID | NOT_FOUND | FAILED }`.

Also changed (item 6 of the follow-up): **`setApplicationStatus(id, "CLOSED")` now behaves like `closeApplication`** (the board drop and the job-page Closed agree). It sets CLOSED and runs the same gap-task logic (no AI, once via `gapTasksAddedAt`, skills of the job's ATS results added to the most recently updated active roadmap; no active roadmap leaves `gapTasksAddedAt` unset so a later close still adds them). For CLOSED the return gains `tasksAdded: number`: `{ application, previousStatus, tasksAdded }` (other statuses are unchanged and have no `tasksAdded`). Calling it on an already CLOSED application retries only the gap tasks. No `closedReason` is set by the board move (use `closeApplication` for a reason). Moving back out of CLOSED (Undo) clears `closedReason` but does NOT remove tasks already added; closing again adds nothing twice.

## Task 5: intake + server runner (D-HF1)

Server actions (Clerk session required; signed-out throws "Unauthorized"):
- `startIntake({ input, url?, asJob? })` in `src/actions/Intake.js`. Returns `{ kind:"question", text }` (open chat; nothing stored) or
  `{ kind:"job", jobId, applicationId, job, notice, chips:{ company, role, location, requirementCount } }` or `{ error, code }`
  (INVALID | NOT_FOUND | URL_BLOCKED | FETCH_FAILED | PASTE_NEEDED | NOT_A_JOB | FAILED). Ids return before the slow AI work:
  `notice:"PENDING"` means missing company/role/location are still being filled (poll `getJob`). The run then continues on the server
  after the response (Next `after()`), survives a closed tab, and writes a Notification (`pipeline_done` / `pipeline_failed`, href `/jobs/:id`).
- `getPipelineStatus(applicationId)` returns `{ applicationId, jobId, run:"idle|running|needs_you|done|failed", completedCount, total,
  steps:[{ id:"checker|tailor|writer|connector", step, label, task, status:"pending|running|done|skipped|failed",
  chips:[{ label, value, tone:"neutral|good|warn|bad" }], ids, needsYou, error, startedAt, finishedAt }] }`. Tailor chips include
  `Invented` (numberCheck count). Polling this also resumes a stalled run in the background.
- `retryPipeline(applicationId)` returns `{ started }`; use after a failed step (failed steps are never auto-retried).
- `getHomeState()` now also resumes the user's stalled runs in the background. `intakeJob`, `runNextStep`, `getPipeline` unchanged.

Route: `GET|POST /api/cron/pipeline` with `Authorization: Bearer $CRON_SECRET` (401 otherwise, also when CRON_SECRET is unset).
Resumes stalled runs for all users (10 per call). Not in `vercel.json` (sub-daily crons need Vercel Pro); point any scheduler at it every 5 to 10 minutes.

## Requests from frontend
- `startIntake` chips: add optional `employmentType` (e.g. "full-time") and `experience` (e.g. "0-2 yrs") to `chips` when the job text has them (home job card shows them if present; for pasted text the client sniffs them itself).
- `getHomeState`: optionally include `targets` (the "other targets from your documents" list) and `dueFollowUps`, so home needs one call. Home currently also calls `getDashboardData` for these.
