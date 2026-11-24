# AscendAI (ai-career-buddy)

Career coach for job seekers. Mascot: Pip. Promise: nothing invented; every generated line cites a source.
Stack: Next.js (JS), Clerk, Prisma + Postgres (pgvector), LangChain.js v1, LangGraph.js, zod.
All AI calls go through runAI() in src/lib/ai. Never call a provider SDK directly.
Six tools must always keep working: resume builder, interview prep, cover letter, cold email,
career roadmap, resume parser/ATS.

Read docs/ai/CONTEXT.md before exploring code. The full product plan is docs/ai/BUILD-PLAN.md;
read only the section you need. Current work lives in docs/ai/PLAN.md.

Rules: Clerk auth + zod validation on every API route; userId scopes every query;
never read or edit .env; never auto-send or auto-apply; new Prisma migrations only.
Design: see docs/ai/DESIGN.md (D64-D67): premium minimal, indigo + lime, Pip kept; Aceternity-style components adapted; never copy other sites.
