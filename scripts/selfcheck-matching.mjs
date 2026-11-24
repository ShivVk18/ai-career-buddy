import assert from "node:assert/strict";
import { inventedNumbers, inventedQuestionNumbers } from "../src/lib/ai/numberCheck.js";
import { normalizeText } from "../src/lib/ai/sources.js";
import { legacyEntryId, ensureEntryIds } from "../src/lib/entryIds.js";
import { extractTerms, matchText, resumeToText } from "../src/lib/match.js";
import { findCliches, countWords, COVER_LETTER_WORDS, COLD_EMAIL_WORDS } from "../src/lib/writing.js";
import { RUBRIC_WEIGHTS, computeOverall } from "../src/lib/interview/rubric.js";
import { verifyQuote, stripInventedSentences } from "../src/lib/interview/verify.js";
import { countGaps, deriveStepTargets, matchStepToJd } from "../src/lib/roadmap/derive.js";
import { weightsForLevel, weightsPromptText, WEIGHT_GROUPS } from "../src/lib/ats/weights.js";
const ok = (o, i) => assert.equal(inventedNumbers(o, i).length, 0, `ok: ${o} <- ${i}`);
const bad = (o, i) => assert.ok(inventedNumbers(o, i).length > 0, `flagged: ${o} <- ${i}`);
ok("led five engineers", "led 5 engineers");
bad("led five engineers", "led engineers");
ok("one of the leads", "one of the leads");
ok("in 2023", "in 2023");
bad("grew 40%", "grew sales");
ok("led 5 engineers", "led five engineers");
ok("twenty-five users", "25 users");
ok("three hundred users", "300 users");
bad("Twenty-five users", "users");
ok("first place", "place");
const m = (q, t) => assert.ok(normalizeText(t).includes(normalizeText(q)), `match: ${q} | ${t}`);
m("full-stack developer", "full-\nstack developer");
m("re-\nsponsible", "responsible");
m("end-to-end", "end-to-end");
m("full-stack", "fullstack");
m("full- stack", "full-stack");
// Deterministic match % (D37)
const JD = `About us\nWe need a Senior Frontend Engineer with React, TypeScript and Node.js.\nExperience with AWS, Docker, CI/CD and REST APIs. Knowledge of GraphQL is a plus.\nMust be a team player. EEO employer. Familiar with JS, SQL, WCAG and HIPAA. We value the rest of the team.`;
const terms = extractTerms(JD);
assert.deepEqual(terms, ["react", "typescript", "node.js", "aws", "docker", "ci/cd", "rest api", "graphql", "javascript", "sql", "web accessibility", "hipaa"]);
assert.ok(!terms.includes("ci") && !terms.includes("cd") && !terms.includes("rest") && !terms.includes("eeo"));
assert.deepEqual(extractTerms("We use Java and some C++ daily"), ["java", "c++"]);
assert.ok(!extractTerms("javascript only").includes("java"));
assert.deepEqual(extractTerms("go to market with great results"), []);
assert.deepEqual(extractTerms("Backend in Go and Kubernetes (k8s)"), ["go", "kubernetes"]);
assert.deepEqual(extractTerms(""), []);
const r = matchText(JD, "Built React and typescript apps on AWS with docker, nodejs, SQL. Wrote JavaScript and RESTful APIs.");
assert.equal(r.percent, Math.round((r.matched.length / 12) * 100));
assert.deepEqual(r.matched, ["react", "typescript", "node.js", "aws", "docker", "rest api", "javascript", "sql"]);
assert.deepEqual(r.missing, ["ci/cd", "graphql", "web accessibility", "hipaa"]);
assert.equal(r.percent, 67);
assert.equal(matchText("nothing technical here", "anything").percent, 0);
assert.equal(matchText(JD, "").percent, 0);
assert.ok(resumeToText({ summary: "S", skills: "k", experience: [{ title: "T", organization: "O", description: "D" }] }).includes("O"));
// Weights shown in the UI are the ones in the prompt
assert.equal(weightsForLevel("Junior (0-2 yrs)").level, "Junior");
assert.equal(weightsForLevel("Senior").weights[0].value, 50);
assert.equal(weightsForLevel("nonsense"), null);
for (const g of Object.values(WEIGHT_GROUPS)) {
  assert.equal(g.weights.reduce((a, w) => a + w.value, 0), 100);
  for (const w of g.weights) assert.ok(weightsPromptText().includes(`${w.key} → ${w.value}`));
}
// Legacy entry ids
{
  const a = { title: "Dev", organization: "Acme", startDate: "2020-01", description: "x" };
  const b = { title: "Dev", organization: "Beta", startDate: "2020-01" };
  assert.equal(legacyEntryId("exp", 0, a), legacyEntryId("exp", 0, { ...a }));
  assert.match(legacyEntryId("exp", 0, a), /^l-exp-[0-9a-z]+$/);
  assert.notEqual(legacyEntryId("exp", 0, a), legacyEntryId("exp", 1, a));
  assert.notEqual(legacyEntryId("exp", 0, a), legacyEntryId("exp", 0, b));
  assert.notEqual(legacyEntryId("exp", 0, a), legacyEntryId("proj", 0, a));
  const r = { experience: [a, { ...b, id: "e_keep" }], projects: [b] };
  const e1 = ensureEntryIds(r);
  assert.equal(e1.experience[1].id, "e_keep");
  assert.equal(e1.experience[0].id, legacyEntryId("exp", 0, a));
  assert.equal(e1.projects[0].id, legacyEntryId("proj", 0, b));
  assert.deepEqual(ensureEntryIds(e1), e1);
  assert.equal(r.experience[0].id, undefined);
}
// Writing rules (D40): deterministic cliche check, one word range
{
  const t = "I am thrilled to apply. A proven track record, and I am a Team Player!";
  const hits = findCliches(t);
  assert.deepEqual(hits.map((h) => h.phrase), ["i am thrilled to apply", "proven track record", "team player"]);
  assert.equal(t.slice(hits[2].start, hits[2].end), "Team Player");
  assert.deepEqual(findCliches("I built a React dashboard and cut load time."), []);
  assert.deepEqual(findCliches("steam players"), []);
  assert.deepEqual(findCliches(""), []);
  assert.deepEqual(findCliches(null), []);
  assert.equal(countWords("  one two\nthree "), 3);
  assert.equal(countWords(""), 0);
  assert.ok(COVER_LETTER_WORDS.min < COVER_LETTER_WORDS.max);
  assert.ok(COLD_EMAIL_WORDS.min <= COLD_EMAIL_WORDS.target && COLD_EMAIL_WORDS.target <= COLD_EMAIL_WORDS.max);
}
// Interview rubric (D46): weights, server-side overall, verbatim quotes, feedback numbers
{
  assert.deepEqual(RUBRIC_WEIGHTS, { clarity: 30, depth: 40, evidence: 30 });
  assert.equal(Object.values(RUBRIC_WEIGHTS).reduce((a, b) => a + b, 0), 100);
  const c = (a, b, d) => [{ name: "clarity", score: a }, { name: "depth", score: b }, { name: "evidence", score: d }];
  assert.equal(computeOverall(c(10, 10, 10)), 100);
  assert.equal(computeOverall(c(0, 0, 0)), 0);
  assert.equal(computeOverall(c(5, 5, 5)), 50);
  assert.equal(computeOverall(c(10, 0, 0)), 30);
  assert.equal(computeOverall(c(0, 10, 0)), 40);
  assert.equal(computeOverall(c(8, 6, 7)), 24 + 24 + 21);
  assert.equal(computeOverall(c(99, -5, 10)), 60); // clamped to 0-10
  assert.equal(computeOverall([{ name: "clarity", score: 10 }]), 30); // missing criteria count as 0
  assert.equal(computeOverall([]), 0);
  const ans = "I used React and cut the full-\nstack build time.  Then I wrote tests.";
  assert.equal(verifyQuote("I used React", ans).quote, "I used React");
  assert.deepEqual(verifyQuote("i USED react", ans).range, [0, 12]);
  assert.ok(verifyQuote("full-stack build time", ans)); // matches through normalization
  assert.equal(verifyQuote("then   I wrote tests", ans).quote, "Then I wrote tests");
  assert.equal(verifyQuote("I led a team of ten", ans), null);
  assert.equal(verifyQuote("React", ans), null); // too short to verify (1 word, < 12 chars)
  assert.equal(verifyQuote("I used", ans), null); // 2 words, < 12 chars
  assert.ok(verifyQuote("then I wrote", ans)); // 3 words
  assert.equal(verifyQuote("", ans), null);
  assert.equal(verifyQuote(null, ans), null);
  const allowed = "Tell me about a project. I built a tool for 5 users.";
  assert.equal(stripInventedSentences("Good example. You saved 40% of time. Add more detail.", allowed), "Good example. Add more detail.");
  assert.equal(stripInventedSentences("Nice with 5 users.", allowed), "Nice with 5 users.");
  assert.equal(stripInventedSentences("You saved 40%.", allowed), "");
}
// Gap frequency (normalized) and step targets (deterministic, from stored job descriptions)
{
  const gaps = countGaps([
    { missingSkills: ["Docker", " docker ", "Kubernetes"] },
    { missingSkills: ["DOCKER", "kubernetes.", "GraphQL"] },
    { missingSkills: ["docker"] },
    { missingSkills: [] },
  ]);
  assert.deepEqual(gaps, [{ skill: "docker", count: 3 }, { skill: "Kubernetes", count: 2 }, { skill: "GraphQL", count: 1 }]);
  assert.deepEqual(countGaps([]), []);
  assert.deepEqual(countGaps(null), []);
  const step = { id: 1, title: "Learn Docker and containerization" };
  assert.equal(matchStepToJd(step, "We use Kubernetes.\nExperience with Docker is a plus.").jdExcerpt, "Experience with Docker is a plus.");
  assert.equal(matchStepToJd(step, "We use Dockerfile conventions and python."), null);
  assert.equal(matchStepToJd({ id: 2, title: "Build a portfolio" }, "Experience with Docker."), null);
  const docs = [
    { kind: "ats", company: "Acme", role: "Dev", jobDescription: "Must know Docker." },
    { kind: "coldEmail", company: "acme", role: "dev", jobDescription: "Docker again." },
    { kind: "coverLetter", company: "Globex", role: "SRE", jobDescription: "Terraform only." },
    { kind: "ats", company: "", role: "", jobDescription: "Docker." },
  ];
  const t = deriveStepTargets([step, { id: 3, title: "Practice Terraform" }, { id: 4, title: "Network" }], docs);
  assert.deepEqual(t["1"].map((x) => [x.company, x.role, x.kinds]), [["Acme", "Dev", ["ats", "coldEmail"]]]);
  assert.deepEqual(t["3"].map((x) => x.company), ["Globex"]);
  assert.deepEqual(t["4"], []);
  // Steps with no vocabulary skill: source snapshots and title phrases.
  const src = { id: 5, title: "Ship something real", sources: [{ id: "profile:skills", kind: "profile", label: "Profile: skills", excerpt: "Figma, Product Analytics, Go, skills" }] };
  assert.equal(matchStepToJd(src, "Own product analytics for the team."), null); // not named by the step text
  assert.equal(matchStepToJd(src, "Design in Figma daily."), null); // profile skill not named by the step text: dropped
  const srcNamed = { ...src, id: 9, description: "Practice Figma prototyping and product analytics with a small team." };
  assert.ok(matchStepToJd(srcNamed, "Design in Figma daily."));
  assert.ok(matchStepToJd(srcNamed, "Own product analytics for the team."));
  assert.equal(matchStepToJd(src, "Strong skills and experience required. Go getter."), null); // generic / too short
  const ph = { id: 6, title: "Master event driven architecture patterns" };
  assert.ok(matchStepToJd(ph, "You know event driven architecture."));
  assert.equal(matchStepToJd(ph, "Event planning and architecture of homes."), null); // phrase must appear whole
  assert.equal(matchStepToJd({ id: 7, title: "Learn and build skills" }, "Build team skills and learn."), null); // only stopwords
  const jdSrc = { id: 8, title: "Ship it", description: "Deploy on Kubernetes.", sources: [{ id: "jd:1", kind: "jd", label: "JD", excerpt: "Experience with Kubernetes required." }] };
  assert.ok(matchStepToJd(jdSrc, "Run Kubernetes clusters."));
  assert.equal(matchStepToJd(jdSrc, "Experience with teams."), null);
}
{
  const qok = (o, i = "React, Node") => assert.equal(inventedQuestionNumbers(o, i).length, 0, `q ok: ${o}`);
  const qbad = (o, i = "React, Node") => assert.ok(inventedQuestionNumbers(o, i).length > 0, `q flagged: ${o}`);
  qok("Describe two approaches to state management in React.");
  qok("Name 3 trade-offs of using Node. Then explain Ten of them?");
  qok("Walk me through the top 5 risks.");
  qbad("Tell me about your 12 years building React apps.");
  qbad("Describe how you improved speed by 30%.");
  qbad("Describe how you improved speed by 5%.");
  qbad("How did you handle a $5 budget?");
  qbad("What happened in 2019?");
  qbad("Describe twenty approaches.");
  qbad("You have 5 minutes to explain it.");
  qbad("Spend 10 mins on it, or two hours.");
  qbad("Answer in three seconds or 4 secs or 2 hrs.");
  qbad("Describe 25 approaches.");
  qbad("Describe two years of experience.");
  qbad("Describe twenty-two cases.");
  qok("Describe four cases.", "We handle four cases");
  assert.ok(inventedNumbers("Describe two approaches.", "React").length > 0); // strict rule unchanged
}
console.log("all self-checks passed");
