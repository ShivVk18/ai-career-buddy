import { getRoute, TASKS } from "./tasks.js";
import { createModel, isSupportedProvider } from "./providers.js";
import { nextKey, coolDown, getKeys } from "./keys.js";
import { logAttempt, debugLog } from "./log.js";

const TIMEOUT_MS = 90_000;

/** Thrown when AI cannot be used. Message never contains keys or user content. */
export class AIError extends Error {
  constructor(message, { code = "AI_UNAVAILABLE", attempts = [] } = {}) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.attempts = attempts;
  }
}

function classify(err) {
  const raw = [err?.status, err?.statusCode, err?.response?.status, err?.code].find(
    (v) => v !== undefined && v !== null && /^\d{3}$/.test(String(v))
  );
  const status = raw === undefined ? undefined : Number(raw);
  const msg = String(err?.message || "").toLowerCase();
  if (status === 429 || /\b429\b|rate.?limit|quota|resource_exhausted|resource exhausted/.test(msg)) return "rate_limited";
  if (err?.name === "TimeoutError" || /timed? ?out|timeout|etimedout|econnreset|fetch failed/.test(msg)) return "timeout";
  if ((typeof status === "number" && status >= 500 && status < 600) || /overloaded|unavailable|internal ?(server )?error/.test(msg)) return "server_error";
  return null; // not retryable
}

function withTimeout(promise) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => {
      const e = new Error("AI call timed out");
      e.name = "TimeoutError";
      reject(e);
    }, TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

/**
 * runAI(task, (model) => result, { userId })
 * Tries each provider:model in AI_ROUTE_<TASK> in order, rotating keys.
 */
export async function runAI(task, callback, { userId, temperature: tempOverride, maxOutputTokens } = {}) {
  if (!TASKS[task]) throw new AIError(`Unknown AI task: ${task}`, { code: "AI_CONFIG" });
  let route;
  try {
    route = getRoute(task);
  } catch (e) {
    throw new AIError(e.message, { code: "AI_CONFIG" });
  }

  const temperature = tempOverride ?? TASKS[task].temperature;
  const attempts = [];

  for (const { provider, model } of route) {
    if (!isSupportedProvider(provider)) {
      attempts.push(`${provider}: unsupported provider`);
      continue;
    }
    const tried = new Set();
    const total = getKeys(provider).length;
    if (total === 0) {
      attempts.push(`${provider}: no API key configured`);
      continue;
    }
    while (tried.size < total) {
      const k = nextKey(provider, tried);
      if (!k) {
        attempts.push(`${provider}: all keys cooling down`);
        break;
      }
      tried.add(k.index);
      const started = Date.now();
      try {
        const chat = createModel(provider, model, k.key, { temperature, maxOutputTokens });
        const result = await withTimeout(Promise.resolve(callback(chat)));
        logAttempt({ userId, task, provider, model, ok: true, latencyMs: Date.now() - started });
        return result;
      } catch (err) {
        const kind = classify(err);
        const code = kind || (err?.name === "AIOutputError" ? "invalid_output" : "error");
        logAttempt({ userId, task, provider, model, ok: false, latencyMs: Date.now() - started, errorCode: code });
        debugLog("error", err);
        if (!kind) {
          throw new AIError(`AI request failed (${provider}: ${code})`, {
            code: err?.name === "AIOutputError" ? "AI_BAD_OUTPUT" : "AI_FAILED",
            attempts: [`${provider}: ${code}`],
          });
        }
        if (kind === "rate_limited") coolDown(provider, k.index);
        attempts.push(`${provider}: ${kind}`);
      }
    }
  }

  throw new AIError(`All AI providers failed: ${attempts.join("; ") || "none configured"}`, { attempts });
}

class AIOutputError extends Error {
  constructor(message) {
    super(message);
    this.name = "AIOutputError";
  }
}

export function messageText(res) {
  const c = res?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p) => (typeof p === "string" ? p : p?.text || "")).join("");
  return "";
}

export function extractJson(text) {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const s = cleaned.search(/[{[]/);
  const e = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (s === -1 || e <= s) throw new AIOutputError("No JSON in AI output");
  return JSON.parse(cleaned.slice(s, e + 1));
}

/** Plain text generation. buildMessages() returns LangChain messages or [role, text] tuples. */
export async function runAIText(task, buildMessages, { userId, temperature, maxOutputTokens } = {}) {
  return runAI(
    task,
    async (model) => {
      const res = await model.invoke(buildMessages());
      const text = messageText(res).trim();
      if (!text) throw new AIOutputError("Empty AI output");
      debugLog("output", text);
      return text;
    },
    { userId, temperature, maxOutputTokens }
  );
}

/** Structured generation validated with zod; retries once on a parse/validation failure. */
export async function runAIStructured(task, schema, buildMessages, { userId, temperature, maxOutputTokens } = {}) {
  return runAI(
    task,
    async (model) => {
      let lastErr;
      for (let i = 0; i < 2; i++) {
        const res = await model.invoke(buildMessages());
        const text = messageText(res);
        debugLog("output", text);
        try {
          const parsed = schema.safeParse(extractJson(text));
          if (parsed.success) return parsed.data;
          lastErr = new AIOutputError("AI output failed schema validation");
        } catch {
          lastErr = new AIOutputError("AI output was not valid JSON");
        }
      }
      throw lastErr;
    },
    { userId, temperature, maxOutputTokens }
  );
}

/** Inline PDF content part for multimodal messages. */
export function pdfPart(base64) {
  return { type: "media", mimeType: "application/pdf", data: base64 };
}
