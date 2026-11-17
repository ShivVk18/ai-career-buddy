import assert from "node:assert/strict";
import { inventedNumbers } from "../src/lib/ai/numberCheck.js";
import { normalizeText } from "../src/lib/ai/sources.js";
import { legacyEntryId, ensureEntryIds } from "../src/lib/entryIds.js";
import { extractTerms, matchText, resumeToText } from "../src/lib/match.js";
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
console.log("all self-checks passed");
