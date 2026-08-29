import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "kickball-timer";
const REFRESH_KEY = "kickball-timer-refresh";
const GAME_LENGTH = 50 * 60;

interface TimerState {
  /** Seconds remaining, banked before the current run. */
  remaining: number;
  /** Epoch ms the current run started, or null when paused. */
  runningSince: number | null;
}

const initialTimer: TimerState = { remaining: GAME_LENGTH, runningSince: null };

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
    if (typeof parsed.remaining !== "number") return null;
    return {
      remaining: parsed.remaining,
      runningSince: typeof parsed.runningSince === "number" ? parsed.runningSince : null,
    };
  } catch {
    return null;
  }
}

const remaining = (t: TimerState) =>
  t.remaining - (t.runningSince ? (Date.now() - t.runningSince) / 1000 : 0);

export function useTimer() {
  const [timer, setTimer] = useState<TimerState>(initialTimer);
  const [hydrated, setHydrated] = useState(false);
  const [seconds, setSeconds] = useState(GAME_LENGTH);

  // Restore a running clock after a refresh or app switch.
  useEffect(() => {
    const saved = loadTimer();
    if (saved) {
      setTimer(saved);
      setSeconds(Math.floor(remaining(saved)));
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
    setSeconds(Math.floor(remaining(timer)));
    if (!timer.runningSince) return;
    const interval = setInterval(() => setSeconds(Math.floor(remaining(timer))), 500);
    return () => clearInterval(interval);
  }, [timer]);

  const start = useCallback(() => {
    setTimer((t) => (t.runningSince ? t : { ...t, runningSince: Date.now() }));
  }, []);

  const pause = useCallback(() => {
    setTimer((t) => (t.runningSince ? { remaining: remaining(t), runningSince: null } : t));
  }, []);

  const reset = useCallback(() => {
    setTimer(initialTimer);
    setSeconds(GAME_LENGTH);
  }, []);

  // Past 00:00 the clock runs negative (overtime), shown as -MM:SS.
  const abs = Math.abs(seconds);
  const minutes = Math.floor(abs / 60);
  const remainingSeconds = abs % 60;
  const formattedTime = `${seconds < 0 ? "-" : ""}${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

  return {
    seconds,
    isRunning: timer.runningSince !== null,
    formattedTime,
    start,
    pause,
    reset,
  };
}
