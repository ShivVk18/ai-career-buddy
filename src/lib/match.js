// Deterministic job-description vs resume keyword match (D37). No AI, no network.
// Plain module (not a server action file) so it can be self-checked in node.
import { normalizeText } from "./ai/sources.js";

/** Curated vocabulary: canonical term -> aliases (all lowercase). Exported so it is testable. */
export const VOCAB = {
  javascript: ["js", "ecmascript", "es6"],
  typescript: ["ts"],
  python: [],
  java: [],
  "c++": ["cpp"],
  "c#": ["csharp"],
  c: [],
  go: ["golang"],
  rust: [],
  ruby: [],
  php: [],
  swift: [],
  kotlin: [],
  scala: [],
  sql: [],
  nosql: [],
  r: [],
  bash: ["shell scripting"],
  html: ["html5"],
  css: ["css3"],
  sass: ["scss"],
  tailwind: ["tailwindcss", "tailwind css"],
  react: ["reactjs", "react.js"],
  "next.js": ["nextjs", "next js"],
  "react native": [],
  redux: [],
  vue: ["vuejs", "vue.js"],
  angular: ["angularjs"],
  svelte: [],
  "node.js": ["nodejs", "node js", "node"],
  express: ["expressjs", "express.js"],
  nestjs: ["nest.js"],
  django: [],
  flask: [],
  fastapi: [],
  spring: ["spring boot", "springboot"],
  ".net": ["dotnet", "asp.net"],
  rails: ["ruby on rails"],
  laravel: [],
  graphql: [],
  "rest api": ["restful", "restful api", "rest apis", "restful apis"],
  grpc: [],
  websocket: ["websockets"],
  microservices: ["microservice"],
  postgresql: ["postgres"],
  mysql: [],
  mongodb: ["mongo"],
  redis: [],
  elasticsearch: ["elastic search"],
  dynamodb: [],
  firebase: [],
  prisma: [],
  kafka: [],
  rabbitmq: [],
  aws: ["amazon web services"],
  azure: [],
  gcp: ["google cloud", "google cloud platform"],
  docker: [],
  kubernetes: ["k8s"],
  terraform: [],
  ansible: [],
  jenkins: [],
  "ci/cd": ["cicd", "ci cd", "continuous integration", "continuous delivery", "continuous deployment"],
  "github actions": [],
  git: [],
  linux: [],
  devops: [],
  serverless: [],
  "machine learning": ["ml"],
  "deep learning": [],
  "data science": [],
  nlp: ["natural language processing"],
  "computer vision": [],
  tensorflow: [],
  pytorch: [],
  "scikit-learn": ["sklearn", "scikit learn"],
  pandas: [],
  numpy: [],
  llm: ["llms", "large language model", "large language models"],
  "data engineering": [],
  "data analysis": ["data analytics"],
  spark: ["apache spark", "pyspark"],
  hadoop: [],
  airflow: [],
  tableau: [],
  "power bi": ["powerbi"],
  excel: [],
  "unit testing": ["unit tests"],
  jest: [],
  cypress: [],
  selenium: [],
  playwright: [],
  "test automation": ["automated testing"],
  tdd: ["test driven development", "test-driven development"],
  agile: [],
  scrum: [],
  jira: [],
  figma: [],
  "ui/ux": ["ux", "ui design", "ux design"],
  "system design": [],
  "object oriented programming": ["oop", "object-oriented programming", "object oriented"],
  "data structures": ["data structures and algorithms", "dsa"],
  algorithms: [],
  oauth: ["oauth2"],
  jwt: [],
  "web accessibility": ["accessibility", "a11y", "wcag"],
  seo: [],
  "responsive design": [],
  "mobile development": [],
  android: [],
  ios: [],
  "project management": [],
  "stakeholder management": [],
  "product management": [],
  "technical writing": [],
  leadership: [],
  mentoring: ["mentorship"],
  salesforce: [],
  sap: [],
};

// Acronyms that show up in job descriptions but say nothing about skills.
export const ACRONYM_STOPLIST = new Set([
  "AND", "THE", "FOR", "YOU", "OUR", "ARE", "WITH", "ALL", "NOT", "CAN", "WHO", "WHY", "NEW", "USA", "USD",
  "EEO", "API", "APIS", "URL", "PDF", "CSV", "SLA", "EOE", "FAQ", "FYI", "ETC", "LLC", "INC", "LTD", "PTO", "HR", "CEO", "CTO", "CFO", "COO", "VP",
  "US", "UK", "EU", "UAE", "IT", "AM", "PM", "OK", "OR", "IF", "AS", "AT", "BY", "ON", "IN", "TO", "OF",
  "IS", "BE", "WE", "MUST", "NOTE", "PLUS", "ASAP", "KPI", "OKR", "B2B", "B2C", "MBA", "BS", "MS", "PHD",
  "COVID", "USP", "TBD", "NA", "EST", "PST", "GMT", "UTC", "DEI", "ADA", "FTE", "WFH", "ERP", "CRM",
]);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// A term matches only when not glued to another word character (so "java" != "javascript", "c" != "css").
const termRe = (t) => new RegExp(`(?<![a-z0-9+#.])${escapeRe(t)}(?![a-z0-9+#]|\\.[a-z0-9])`, "i");

/** True when `term` (already normalized) occurs as a whole term in `normText`. */
export function hasTerm(normText, term) {
  return termRe(term).test(normText);
}

// alias -> canonical
const ALIAS = new Map();
for (const [canon, aliases] of Object.entries(VOCAB)) {
  ALIAS.set(normalizeText(canon), canon);
  for (const a of aliases) ALIAS.set(normalizeText(a), canon);
}
// Short aliases that are ordinary words or letters: in the JD they only count with exact capitalization.
const CASE_SENSITIVE = { js: "JS", ts: "TS", ml: "ML", ux: "UX", go: "Go" };

const MAX_TERMS = 60;

/** The skills mentioned in the job description: [{term}] in order of first appearance. */
export function extractTerms(jobDescription) {
  const jd = String(jobDescription ?? "").slice(0, 20000);
  const norm = normalizeText(jd);
  if (!norm) return [];
  const found = new Map(); // canon -> position

  for (const [alias, canon] of ALIAS) {
    if (alias.length === 1) {
      // "C" / "R": require a clear programming context: "C," "C/" "C++" is its own term; bare letters are skipped
      // unless the JD lists them in a "languages: ... C ..." style comma list.
      const re = new RegExp(`(?:languages?|skills?|experience (?:in|with)|proficien\\w*)[^\\n.]{0,80}[\\s,/(]${escapeRe(alias)}(?=[\\s,/)]|$)`, "i");
      const m = re.exec(norm);
      if (m) found.set(canon, Math.min(found.get(canon) ?? Infinity, m.index));
      continue;
    }
    if (CASE_SENSITIVE[alias]) {
      const re = new RegExp(`(?<![A-Za-z0-9+#.])${CASE_SENSITIVE[alias]}(?![A-Za-z0-9+#])`);
      const m = re.exec(jd);
      if (m) found.set(canon, Math.min(found.get(canon) ?? Infinity, m.index));
      continue;
    }
    const m = termRe(alias).exec(norm);
    if (m) found.set(canon, Math.min(found.get(canon) ?? Infinity, m.index));
  }

  // Acronyms written in capitals that are not already covered by the vocabulary.
  const known = new Set([...ALIAS.keys()]);
  for (const m of jd.matchAll(/(?<![A-Za-z0-9])([A-Z][A-Z0-9]{1,5})(?![A-Za-z0-9])/g)) {
    const a = m[1];
    if (ACRONYM_STOPLIST.has(a) || /^\d/.test(a) || /^[A-Z]\d+$/.test(a)) continue;
    const n = a.toLowerCase();
    if (known.has(n) || found.has(n)) continue;
    // a piece of a multi-word term already found ("CI" and "CD" in CI/CD, "REST" in REST APIs)
    if ([...found.keys(), ...ALIAS.keys()].some((k) => k.split(/[^a-z0-9]+/).includes(n) && k !== n && (found.has(k) || hasTerm(norm, k)))) continue;
    // all-caps words inside an all-caps line (headings) are not acronyms
    const lineStart = jd.lastIndexOf("\n", m.index) + 1;
    const line = jd.slice(lineStart, jd.indexOf("\n", m.index) === -1 ? undefined : jd.indexOf("\n", m.index));
    const letters = line.replace(/[^A-Za-z]/g, "");
    if (letters.length > 6 && letters === letters.toUpperCase()) continue;
    found.set(n, m.index);
  }

  return [...found.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, MAX_TERMS)
    .map(([term]) => term);
}

/** Flattens the resume form JSON (or a plain string) into searchable text. */
export function resumeToText(resume) {
  if (!resume) return "";
  if (typeof resume === "string") return resume;
  const parts = [resume.summary, resume.skills];
  for (const key of ["experience", "education", "projects"]) {
    if (Array.isArray(resume[key]))
      for (const e of resume[key]) {
        if (e && typeof e === "object") parts.push(e.title, e.organization, e.description);
      }
  }
  const text = parts.filter(Boolean).join("\n");
  return text.trim() ? text : typeof resume.content === "string" ? resume.content : "";
}

/** Pure matcher: { percent, matched, missing, termCount }. */
export function matchText(jobDescription, resumeText) {
  const terms = extractTerms(jobDescription);
  const norm = normalizeText(resumeText);
  const matched = [];
  const missing = [];
  for (const t of terms) {
    const aliases = [t, ...[...ALIAS.entries()].filter(([, c]) => c === t).map(([a]) => a)];
    const hit = aliases.some((a) => (a.length === 1 ? new RegExp(`(?<![a-z0-9+#.])${escapeRe(a)}(?![a-z0-9+#])`).test(norm) : hasTerm(norm, a)));
    (hit ? matched : missing).push(t);
  }
  const percent = terms.length ? Math.round((matched.length / terms.length) * 100) : 0;
  return { percent, matched, missing, termCount: terms.length };
}
