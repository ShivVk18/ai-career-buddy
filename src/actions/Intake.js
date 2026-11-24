"use server";

import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { withAiAction } from "@/lib/ai";
import { runAsUser } from "@/lib/runAsUser";
import { safeErr } from "@/lib/utils";
import { requireUser } from "@/lib/jobs/common";
import { intakeJobImpl, fillJobMeta } from "@/lib/jobs/intake";
import { intakeChips } from "@/lib/jobs/chips";
import { advanceRun } from "@/lib/jobs/runner";

/**
 * The home input: a job link, pasted job text, or a question.
 *   { kind: "question", text }                                   nothing stored; open chat
 *   { kind: "job", jobId, applicationId, chips: { company, role, location, requirementCount }, job, notice, url }
 *       The rows exist when this returns. Missing chips (company/role/location the page header did not give) are
 *       filled by one `fast` call AFTER the response (notice "PENDING": poll getJob / getPipelineStatus, or re-read
 *       chips later). The checker -> tailor -> writer -> connector run then continues on the server even if the
 *       tab is closed (D-HF1) and a Notification is written when it finishes or fails.
 *   { error, code: INVALID | NOT_FOUND | URL_BLOCKED | FETCH_FAILED | PASTE_NEEDED | NOT_A_JOB | FAILED, url? }
 * Input: { input, url?, asJob? } as intakeJob. Links are fetched here (SSRF-guarded), so a link costs one page fetch
 * before the ids come back; pasted text returns after one DB write.
 */
export async function startIntake(data) {
  const { authUserId, user } = await requireUser();
  const res = await withAiAction(() =>
    intakeJobImpl(data, {
      deferAi: true,
      withText: true,
      initialPipeline: { v: 1, run: { actionId: randomUUID(), capChecked: false, startedAt: new Date().toISOString() }, steps: {} },
    })
  );
  if (res.kind !== "job") return res; // question or error, unchanged shape
  const { jdText, ...rest } = res;
  const jobId = res.job.id;
  after(async () => {
    try {
      // Chips first so the steps see company and role.
      await runAsUser(authUserId, () => withAiAction(() => fillJobMeta({ jobId, userDbId: user.id, authUserId })));
    } catch (e) {
      console.error("fillJobMeta failed:", safeErr(e));
    }
    await advanceRun({ applicationId: res.applicationId, user, authUserId });
  });
  return { ...rest, jobId, chips: intakeChips(res.job, jdText) };
}
