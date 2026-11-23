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
    if (error) {
      setLoading(true);
      setKick((k) => k + 1);
      return;
    }
    setRetrying(true);
    try {
      const res = await apiRef.current.retryPipeline(applicationId);
      if (res?.error) setError(res.error);
    } catch {
      setError("We couldn't restart that. Please try again.");
    }
    setRetrying(false);
    setKick((k) => k + 1);
  }, [applicationId, error]);

  return { status, loading, error, retrying, retry };
}
