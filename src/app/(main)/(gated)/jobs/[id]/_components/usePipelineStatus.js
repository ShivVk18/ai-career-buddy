"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPipelineStatus, retryPipeline } from "@/actions/Pipeline";

const POLL_MS = 2000;
const MAX_IDLE_POLLS = 8;

/**
 * Polls getPipelineStatus every 2s while the run is going; stops when it is done, needs you, or failed.
 * `actions` can be swapped for mocks (/dev/bots). Returns { status, loading, error, retrying, retry }.
 */
export default function usePipelineStatus(applicationId, actions) {
  const api = actions || { getPipelineStatus, retryPipeline };
  const apiRef = useRef(api);
  apiRef.current = api;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [kick, setKick] = useState(0);
  // Rate-limit cooldown: absolute time (ms) when retry is allowed again, and seconds left for display.
  const [until, setUntil] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!until) {
      setCooldown(0);
      return;
    }
    const update = () => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setCooldown(left);
      if (left === 0) setUntil(0);
    };
    update();
    const t = setInterval(update, 500);
    return () => clearInterval(t);
  }, [until]);

  useEffect(() => {
    if (!applicationId) return;
    let alive = true;
    let timer;
    let idle = 0;
    const tick = async () => {
      let res;
      try {
        res = await apiRef.current.getPipelineStatus(applicationId);
      } catch {
        res = { error: "We lost the connection.", code: "FAILED" };
      }
      if (!alive) return;
      setLoading(false);
      if (!res || res.error) {
        setError(res?.error || "We couldn't load pip's progress.");
        return; // stop; the user retries
      }
      setError(null);
      setStatus(res);
      const failedStep = res.steps?.find((s) => s.status === "failed");
      const wait = Number(failedStep?.error?.retryAfterSec);
      if (failedStep?.error?.code === "RATE_LIMITED" && wait > 0) setUntil((u) => (u > Date.now() ? u : Date.now() + wait * 1000));
      if (res.run === "idle") idle += 1;
      const going = res.run === "running" || (res.run === "idle" && idle < MAX_IDLE_POLLS);
      if (going) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [applicationId, kick]);

  const retry = useCallback(async () => {
    if (cooldown > 0) return;
    if (error) {
      setLoading(true);
      setKick((k) => k + 1);
      return;
    }
    setRetrying(true);
    try {
      const res = await apiRef.current.retryPipeline(applicationId);
      if (res?.code === "RATE_LIMITED") setUntil(Date.now() + (Number(res.retryAfterSec) || 30) * 1000);
      else if (res?.error) setError(res.error);
    } catch {
      setError("We couldn't restart that. Please try again.");
    }
    setRetrying(false);
    setKick((k) => k + 1);
  }, [applicationId, error, cooldown]);

  return { status, loading, error, retrying, retry, cooldown };
}
