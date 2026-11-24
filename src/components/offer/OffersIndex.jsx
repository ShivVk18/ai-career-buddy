"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCw } from "lucide-react";
import { getApplications } from "@/actions/Applications";
import { generationErrorMessage } from "@/components/shared/generationError";
import AppWindow from "@/components/ui/AppWindow";
import EmptyState from "@/components/ui/EmptyState";
import SceneScreen from "@/components/ui/SceneScreen";
import Skeleton from "@/components/ui/Skeleton";

/** /offers: one offer opens straight away, several get a short list, none gets an honest empty state. */
export default function OffersIndex() {
  const router = useRouter();
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await getApplications();
      if (!res || res.error) return setState({ status: "error", error: generationErrorMessage(res, "we couldn't load your applications.") });
      const offers = (res.applications || []).filter((a) => a.status === "OFFER");
      if (offers.length === 1) return router.replace(`/offers/${offers[0].id}`);
      setState({ status: "ready", offers });
    } catch {
      setState({ status: "error", error: "we couldn't reach the server." });
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  let body;
  if (state.status === "loading") {
    body = (
      <div aria-busy="true" aria-label="loading offers" className="space-y-3 p-6 sm:p-10">
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  } else if (state.status === "error") {
    body = (
      <div role="alert" className="p-6 sm:p-10">
        <EmptyState outfit="detective" title="we couldn't load your offers" text={state.error} action={
          <button type="button" onClick={load} className="btn-pill-secondary inline-flex min-h-11 items-center gap-2 px-5 text-sm">
            <RotateCw className="size-4" aria-hidden="true" /> retry
          </button>
        } />
      </div>
    );
  } else if (state.offers.length === 0) {
    body = (
      <div className="p-6 sm:p-10">
        <EmptyState title="no offers yet" text="when a job moves to offer, pip helps you compare it and draft your reply here." action={
          <Link href="/applications" className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ink-foreground">see applications</Link>
        } />
      </div>
    );
  } else {
    body = (
      <ul className="p-4 sm:p-8">
        {state.offers.map((a) => (
          <li key={a.id} className="border-b border-dashed border-line last:border-b-0">
            <Link href={`/offers/${a.id}`} className="flex min-h-14 items-center justify-between gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <span className="min-w-0">
                <span className="block truncate font-doc text-base text-text">{a.job.company || "company not set"}</span>
                <span className="block truncate font-doc text-sm text-faint">{a.job.title || "title not set"}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-faint" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <SceneScreen variant="night" seed={707} center label="offers">
      <h1 className="sr-only">offers</h1>
      <AppWindow title="ascendai · offers" className="relative mx-auto max-w-[900px]" bodyClassName="p-0">
        {body}
      </AppWindow>
    </SceneScreen>
  );
}
