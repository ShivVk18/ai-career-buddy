// One entry per task. To add a task: add an entry here and an AI_ROUTE_<TASK> env var.
export const TASKS = {
  fast: { temperature: 0, routeEnv: "AI_ROUTE_FAST" }, // parsing, scoring, classifying
  write: { temperature: 0.4, routeEnv: "AI_ROUTE_WRITE" }, // resumes, letters, emails
};

/** Parse "provider:model,provider:model" from the task's env var. Models come only from env. */
export function getRoute(task) {
  const cfg = TASKS[task];
  if (!cfg) throw new Error(`Unknown AI task: ${task}`);
  const raw = process.env[cfg.routeEnv];
  if (!raw || !raw.trim()) {
    throw new Error(`${cfg.routeEnv} is not set`);
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const i = entry.indexOf(":");
      if (i <= 0 || i === entry.length - 1) {
        throw new Error(`${cfg.routeEnv} has an invalid entry (expected provider:model)`);
      }
      return { provider: entry.slice(0, i).toLowerCase(), model: entry.slice(i + 1) };
    });
}
