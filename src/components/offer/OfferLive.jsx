"use client";

import { useCallback, useEffect, useState } from "react";
import { getApplications } from "@/actions/Applications";
import { getHomeState } from "@/actions/Home";
import { compareOffer, draftNegotiation, setTargetSalary } from "@/actions/Offer";
import { generationErrorMessage } from "@/components/shared/generationError";
import OfferScreen from "./OfferScreen";

const REAL = {
  getApplications,
  getHomeState,
  compare: compareOffer,
  draft: draftNegotiation,
  setTarget: setTargetSalary,
};
const LABEL = { SAVED: "saved", APPLIED: "applied", INTERVIEWING: "interviewing", OFFER: "offer", CLOSED: "closed" };

/** Loads one application and shows the offer helper (OFFER), the calm rejection card (CLOSED), or a short note. `api` is for the dev page. */
export default function OfferLive({ applicationId, api = REAL }) {
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const list = await api.getApplications();
      if (!list || list.error) {
        setState({ status: "error", error: generationErrorMessage(list, "we couldn't load your applications.") });
        return;
      }
      const app = (list.applications || []).find((a) => a.id === applicationId);
      if (!app) {
        setState({ status: "empty" });
        return;
      }
      const base = { id: app.id, jobId: app.job.id, company: app.job.company, title: app.job.title, statusLabel: LABEL[app.status] };
      if (app.status === "OFFER") {
        const cmp = await api.compare(app.id, {});
        if (!cmp || cmp.error) {
          setState({ status: "error", error: generationErrorMessage(cmp, "we couldn't open this offer.") });
          return;
        }
        setState({ status: "ready", data: { ...base, kind: "offer", offer: cmp.offer, targetBase: cmp.vsTarget?.targetBase ?? null, compare: null } });
      } else if (app.status === "CLOSED") {
        let tasks = [];
        try {
          const home = await api.getHomeState();
          tasks = (home?.tasks || [])
            .filter((t) => t.kind === "task" && t.source === "rejection_gap" && t.applicationId === app.id)
            .map((t) => ({ id: t.taskId, title: t.title, dueAt: t.dueAt }));
        } catch {
          // the card still works without the task list
        }
        setState({ status: "ready", data: { ...base, kind: "closed", tasks } });
      } else {
        setState({ status: "ready", data: { ...base, kind: "other" } });
      }
    } catch {
      setState({ status: "error", error: "we couldn't reach the server." });
    }
  }, [api, applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  return <OfferScreen status={state.status} error={state.error} onRetry={load} data={state.data} actions={api} />;
}
