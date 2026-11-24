"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const WAVE_BARS = 48;
const flat = () => Array(WAVE_BARS).fill(0);

/**
 * Voice answer: browser speech recognition (Web Speech API) for the transcript plus a live level history
 * from the mic (Web Audio AnalyserNode) for the waveform.
 *
 * state: "idle" | "starting" | "recording" | "denied" | "error"
 * supported: null until mounted, then true/false (needs SpeechRecognition + getUserMedia)
 * levels: WAVE_BARS numbers 0..1, newest last. Stays flat under prefers-reduced-motion (the UI draws static bars).
 */
export function useVoiceAnswer(onTranscript) {
  const [supported, setSupported] = useState(null);
  const [state, setState] = useState("idle");
  const [levels, setLevels] = useState(flat);
  const [message, setMessage] = useState("");

  const cbRef = useRef(onTranscript);
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const timerRef = useRef(null);
  const wantRef = useRef(false);
  const finalRef = useRef("");

  useEffect(() => {
    cbRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!(SR && navigator.mediaDevices?.getUserMedia));
  }, []);

  const teardown = useCallback(() => {
    wantRef.current = false;
    clearInterval(timerRef.current);
    timerRef.current = null;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.stop();
      } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setLevels(flat());
  }, []);

  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    teardown();
    setState((s) => (s === "recording" || s === "starting" ? "idle" : s));
  }, [teardown]);

  const start = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      return;
    }
    setMessage("");
    setState("starting");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("denied");
      setMessage("the mic is blocked, so type your answer instead.");
      return;
    }
    streamRef.current = stream;
    wantRef.current = true;
    finalRef.current = "";

    // Level meter for the waveform (skipped under reduced motion).
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        ctxRef.current = ctx;
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        timerRef.current = setInterval(() => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const level = Math.min(1, Math.sqrt(sum / buf.length) * 5);
          setLevels((prev) => [...prev.slice(1), level]);
        }, 70);
      } catch {
        // no meter: transcript still works
      }
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current = (finalRef.current + " " + piece).trim();
        else interim += piece;
      }
      const full = (finalRef.current + " " + interim).trim();
      if (full) cbRef.current?.(full);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      const denied = e.error === "not-allowed" || e.error === "service-not-allowed";
      teardown();
      setState(denied ? "denied" : "error");
      setMessage(denied ? "the mic is blocked, so type your answer instead." : "voice didn't work here, so type your answer instead.");
    };
    // Chrome ends recognition after a pause; keep going while the user has not pressed stop.
    rec.onend = () => {
      if (!wantRef.current) return;
      try {
        rec.start();
      } catch {}
    };
    recRef.current = rec;
    try {
      rec.start();
      setState("recording");
    } catch {
      teardown();
      setState("error");
      setMessage("voice didn't work here, so type your answer instead.");
    }
  }, [teardown]);

  return { supported, state, isRecording: state === "recording" || state === "starting", levels, message, start, stop };
}
