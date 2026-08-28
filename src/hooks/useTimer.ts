import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "kickball-timer";
const REFRESH_KEY = "kickball-timer-refresh";

interface TimerState {
  /** Seconds banked before the current run. */
  accumulated: number;
  /** Epoch ms the current run started, or null when paused. */
  runningSince: number | null;
}

const initialTimer: TimerState = { accumulated: 0, runningSince: null };

function loadTimer(): TimerState | null {
  if (typeof window === "undefined") return null;
  try {
    // A refresh leaves a sessionStorage backup; a true tab close wipes it.
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = window.sessionStorage.getItem(REFRESH_KEY);
      if (raw) {
        window.localStorage.setItem(STORAGE_KEY, raw);
        window.sessionStorage.removeItem(REFRESH_KEY);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TimerState>;
    if (typeof parsed.accumulated !== "number") return null;
    return {
      accumulated: parsed.accumulated,
      runningSince: typeof parsed.runningSince === "number" ? parsed.runningSince : null,
    };
  } catch {
    return null;
  }
}

const elapsed = (t: TimerState) =>
  Math.max(
    0,
    Math.floor(t.accumulated + (t.runningSince ? (Date.now() - t.runningSince) / 1000 : 0)),
  );

export function useTimer() {
  const [timer, setTimer] = useState<TimerState>(initialTimer);
  const [hydrated, setHydrated] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Restore a running clock after a refresh or app switch.
  useEffect(() => {
    const saved = loadTimer();
    if (saved) {
      setTimer(saved);
      setSeconds(elapsed(saved));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } catch {
      /* storage unavailable — keep running in memory */
    }
  }, [timer, hydrated]);

  // On unload: stash to sessionStorage (survives a refresh in the same tab)
  // and clear localStorage, so closing the tab/browser resets the timer.
  useEffect(() => {
    if (!hydrated) return;
    const handleUnload = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) window.sessionStorage.setItem(REFRESH_KEY, raw);
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable */
      }
    };
    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, [hydrated]);

  // Tick from wall-clock time so a backgrounded tab stays accurate.
  useEffect(() => {
    setSeconds(elapsed(timer));
    if (!timer.runningSince) return;
    const interval = setInterval(() => setSeconds(elapsed(timer)), 500);
    return () => clearInterval(interval);
  }, [timer]);

  const start = useCallback(() => {
    setTimer((t) => (t.runningSince ? t : { ...t, runningSince: Date.now() }));
  }, []);

  const pause = useCallback(() => {
    setTimer((t) => (t.runningSince ? { accumulated: elapsed(t), runningSince: null } : t));
  }, []);

  const reset = useCallback(() => {
    setTimer(initialTimer);
    setSeconds(0);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

  return {
    seconds,
    isRunning: timer.runningSince !== null,
    formattedTime,
    start,
    pause,
    reset,
  };
}
