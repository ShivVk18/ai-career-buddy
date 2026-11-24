"use client";

import { useMemo } from "react";
import OfferLive from "@/components/offer/OfferLive";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const app = (status) => ({ id: "a1", status, job: { id: "j1", company: "Razorpay", title: "Frontend Engineer", location: "bengaluru", url: null } });
const SAVED = { base: 2400000, bonus: 200000, equity: null, other: null, currency: "INR", total: 2600000 };
const NONE = { base: null, bonus: null, equity: null, other: null, currency: "INR", total: null };
const NOTE = "pip has no market data, so nothing here says what this role should pay.";

export default function DevOffer({ mode }) {
  const api = useMemo(() => {
    let saved = mode === "offer-bare" ? NONE : SAVED;
    let target = mode === "offer" ? 2200000 : null;
    const status = mode === "closed" || mode === "closed-empty" ? "CLOSED" : mode === "other" ? "APPLIED" : "OFFER";
    const compare = async (id, body) => {
      await wait(500);
      if (mode === "error") return { error: "we couldn't compare that offer.", code: "FAILED" };
      const keys = ["base", "bonus", "equity", "other"];
      if (keys.some((k) => body[k] !== undefined)) {
        saved = { ...NONE, ...Object.fromEntries(keys.filter((k) => body[k] !== undefined).map((k) => [k, body[k]])), currency: body.currency || "INR" };
        saved.total = keys.reduce((n, k) => n + (saved[k] || 0), 0);
      }
      const diff = saved.base != null && target != null ? saved.base - target : null;
      return {
        applicationId: id,
        offer: saved,
        vsTarget: diff == null ? null : { targetBase: target, diff, pct: 0, meets: diff >= 0 },
        others: mode === "offer" ? [{ applicationId: "a2", company: "CRED", title: "ui engineer", currency: "INR", total: 2900000, totalDiff: 300000 }] : [],
        marketData: null,
        notes: saved.total == null ? ["you haven't entered amounts yet.", NOTE] : [NOTE],
      };
    };
    return {
      getApplications: async () => {
        await wait(mode === "loading" ? 60000 : 500);
        if (mode === "error") return { error: "we couldn't load your applications.", code: "FAILED" };
        if (mode === "missing") return { applications: [] };
        return { applications: [app(status)] };
      },
      getHomeState: async () => ({
        tasks:
          mode === "closed"
            ? [
                { kind: "task", taskId: "t1", applicationId: "a1", source: "rejection_gap", title: "Work on payments", dueAt: "2026-11-30T09:00:00.000Z" },
                { kind: "task", taskId: "t2", applicationId: "a1", source: "rejection_gap", title: "Work on design systems", dueAt: "2026-11-30T09:00:00.000Z" },
              ]
            : [],
      }),
      compare,
      setTarget: async (n) => {
        await wait(200);
        target = n;
        return { targetBase: n };
      },
      draft: async () => {
        await wait(700);
        return {
          subject: "Razorpay frontend engineer offer",
          text: "Hi,\n\nThank you for the offer for the Frontend Engineer role at Razorpay. I'm excited about the team.\n\nI was hoping for a base closer to INR 2,200,000. Is there room to talk about that?\n\nThanks,\nShivansh",
          basedOn: { hasOffer: true, hasTarget: true, otherOffers: 0 },
          notes: [NOTE],
        };
      },
    };
  }, [mode]);
  return (
    <main className="min-h-screen bg-bg text-text">
      <OfferLive applicationId={mode === "missing" ? "zzz" : "a1"} api={api} />
    </main>
  );
}
