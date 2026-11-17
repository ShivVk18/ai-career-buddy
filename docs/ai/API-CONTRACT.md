# API Contract (Phase 2, plus Phase 3 Sources in section 6)

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

### 6.9 Schema changes (migration `20261118000000_phase3_sources`, NOT applied by the agent)
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

Legacy scores (no stored text) return `NEEDS_REUPLOAD` from both; use `hasResumeText` to hide or disable "Propose fix" up front.

### 7.8 Cap behaviour (section 4 amended)

In production, if the `AiUsage` count can't be read, `runAI` throws `AIError` code `AI_UNAVAILABLE` before any provider call. In dev it skips the cap with one console warning (as before).
