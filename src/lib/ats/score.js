// The ATS scoring engine (moved out of the "use server" ResumeParser.js so it can be shared by
// createATSAnalysis, applyAtsFix and the pipeline without becoming a callable server action).
import { runAIStructured } from "@/lib/ai";
import { weightsPromptText } from "@/lib/ats/weights";
import { buildSources, formatCatalogForPrompt, snapshot, normalizeText } from "@/lib/ai/sources";
import { atsSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";

const MIN_ITEMS = 2;
const MIN_QUOTE = 20;

/** Keep only sources the server can verify. Quotes must appear in the extracted PDF text. */
function verifySources(sources, normResume, catalog) {
  const out = [];
  for (const src of sources || []) {
    if (src?.type === "resume_quote") {
      const quote = String(src.quote ?? "").replace(/\s+/g, " ").trim();
      if (quote.length >= MIN_QUOTE && quote.length <= 400 && normResume.includes(normalizeText(quote))) {
        out.push({ type: "resume_quote", quote });
      }
    } else if (src?.type === "jd") {
      const [snap] = snapshot([src.id], catalog);
      if (snap) out.push({ type: "jd", id: snap.id, label: snap.label, excerpt: snap.excerpt });
    }
  }
  return out;
}

/** requireQuote: a claim about the resume (strength/weakness) needs at least one verified resume_quote. */
function verifyItems(items, normResume, catalog, requireQuote) {
  return (items || [])
    .map((it) => ({ ...it, text: String(it.text ?? "").trim(), sources: verifySources(it.sources, normResume, catalog) }))
    .filter(
      (it) =>
        it.text &&
        it.sources.length > 0 &&
        (!requireQuote || it.sources.some((s) => s.type === "resume_quote"))
    );
}

export const stripRec = ({ sources, ...rest }) => ({ ...rest });


/** Requirements: "matched" needs a verified resume quote; "gap" needs a verified job description id. */
function verifyRequirements(items, normResume, catalog) {
  const out = [];
  for (const it of items || []) {
    const requirement = String(it?.requirement ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
    const status = String(it?.status ?? "").trim().toLowerCase();
    if (!requirement || (status !== "matched" && status !== "gap")) continue;
    const sources = verifySources(it.sources, normResume, catalog);
    const ok =
      status === "matched" ? sources.some((x) => x.type === "resume_quote") : sources.some((x) => x.type === "jd");
    if (ok) out.push({ requirement, status, sources });
    if (out.length >= 12) break;
  }
  return out;
}

/**
 * The shared analysis used by createATSAnalysis and applyAtsFix, so a re-score has exactly the same
 * prompt and validation as a fresh analysis. Returns { empty: true } when nothing could be sourced,
 * otherwise { result, raw, evidence } (evidence also carries candidateLevel and the analyzed resumeText).
 */
export async function scoreResume({ userId, resumeText, jobDescription, jobTitle, companyName }) {
    const normResume = normalizeText(resumeText);
    const catalog = buildSources({ jobDescription });

   const today = new Date().toISOString().split("T")[0];

const prompt = `
You are a REALISTIC ATS (Applicant Tracking System) scoring engine used by top tech companies.

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown
- No explanation
- No reasoning
- No extra text
- No hallucination
- If information unclear → assume neutral, not negative

CURRENT DATE: ${today}

JOB DETAILS:
Company: ${companyName}
Position: ${jobTitle}
Job Description (one line per id):
${formatCatalogForPrompt(catalog)}

RESUME TEXT (extracted from the candidate's PDF):
"""
${resumeText}
"""

STEP 1 — DETECT CANDIDATE LEVEL:
Classify candidate into one:
- Student
- Fresher
- Junior (0-2 yrs)
- Mid (2-5 yrs)
- Senior (5+ yrs)

STEP 2 — EXPERIENCE DATE RULE:
- If end date = "Present" → current role
- If end date >= CURRENT DATE → current role
- Do NOT assume future employment
- If date unclear → assume current

STEP 3 — SCORING WEIGHTS (Dynamic):

${weightsPromptText()}

STEP 4 — KEYWORD MATCH:
Extract ONLY technical required skills from job description.

STEP 5 — EXPERIENCE RELEVANCE:
- Title similarity
- Tech stack similarity
- Responsibility similarity
- Domain relevance (BONUS only, no penalty)

STEP 6 — WEAKNESS RULE:
- Do NOT invent weaknesses
- Only include REAL missing skills
- Maximum weaknesses = 5

STEP 7 — INDUSTRY RULE:
- If industry matches → bonus
- If not → no penalty

STEP 8 — FORMAT RULE:
ATS friendly means:
- Standard headings
- No tables
- No images
- Proper structure

STEP 9 — SKILL RULES:
Include ONLY:
- Programming languages
- Frameworks
- Databases
- DevOps
- Cloud
- AI/ML
- System tools

Exclude:
- Soft skills
- Office tools
- Generic tools

STEP 10 — FINAL SCORE:
- Score must feel realistic like real ATS
- Fresher should NOT score <55 unless very poor
- Strong candidate should NOT score <70

EVIDENCE RULE (mandatory):
- Every item in "strengths", "weaknesses" and "recommendations" needs a non-empty "sources" array.
- A source is either {"type":"resume_quote","quote":"..."} where quote is an EXACT contiguous excerpt (20-200 characters) copied verbatim from the RESUME TEXT, or {"type":"jd","id":"jd:<n>"} using an id from the job description lines above.
- Every strength and every weakness MUST include at least one "resume_quote" (a claim about the resume must be backed by the resume). For a weakness or missing skill, cite the job description line that requires it (type "jd") AND a resume_quote showing what the resume says in that area (for example its skills line).
- Recommendations may cite only job description lines.
- "requirements": list up to 12 of the most important requirements from the job description. status "matched" needs a resume_quote proving it (verbatim, 20-200 characters); status "gap" needs the job description line id ("jd:<n>") that states the requirement. Use only those two statuses.
- Items without a verifiable source will be discarded. Give at least 2 items for each of those three lists when the evidence exists.

OUTPUT JSON STRUCTURE:
{
  "candidateLevel": "",
  "atsScore": 0,
  "matchPercentage": 0,
  "strengths": [{ "text": "", "sources": [{ "type": "resume_quote", "quote": "" }] }],
  "requirements": [{ "requirement": "", "status": "matched", "sources": [{ "type": "resume_quote", "quote": "" }] }, { "requirement": "", "status": "gap", "sources": [{ "type": "jd", "id": "jd:1" }] }],
  "weaknesses": [{ "text": "", "sources": [{ "type": "jd", "id": "jd:1" }] }],
  "improvements": [],
  "relevantSkills": [],
  "missingSkills": [],
  "recommendations": [
    {
      "category": "",
      "priority": "",
      "action": "",
      "impact": "",
      "sources": [{ "type": "jd", "id": "jd:1" }]
    }
  ],
  "finalSummary": ""
}
`;

    const analyze = async (note) => {
      const raw = await runAIStructured("fast", atsSchema, () => [["user", prompt + note]], { userId });
      return {
        raw,
        strengths: verifyItems(raw.strengths, normResume, catalog, true),
        weaknesses: verifyItems(raw.weaknesses, normResume, catalog, true),
        requirements: verifyRequirements(raw.requirements, normResume, catalog),
        recommendations: verifyItems(
          raw.recommendations
            .filter((r) => String(r.action ?? "").trim())
            .map((r) => ({ ...r, text: r.action })),
          normResume,
          catalog,
          false
        ),
      };
    };
    const lacking = (r) => [r.strengths, r.weaknesses, r.recommendations].some((l) => l.length < MIN_ITEMS) || r.requirements.length < 1;
    const total = (r) => r.strengths.length + r.weaknesses.length + r.recommendations.length + r.requirements.length;

    let result = await analyze("");
    if (lacking(result)) {
      try {
        const retry = await analyze(
          "\n\nIMPORTANT: your previous answer had too few items with verifiable sources. Quotes (at least 20 characters) must be copied verbatim from the RESUME TEXT; every strength and weakness needs a resume_quote; jd ids must come from the job description lines."
        );
        if (total(retry) >= total(result)) result = retry;
      } catch (e) {
        console.error("ATS scoring retry failed, keeping first attempt:", safeErr(e));
      }
    }
    if (result.strengths.length + result.weaknesses.length + result.recommendations.length === 0) return { empty: true };

    const { raw } = result;
    const evidence = {
      version: 1,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
      requirements: result.requirements,
      candidateLevel: String(raw.candidateLevel ?? "").trim().slice(0, 60) || null,
      resumeText,
    };
    return { result, raw, evidence };
}

