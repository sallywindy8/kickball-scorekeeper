import { useState, useCallback, useRef, useEffect } from "react";

type HalfInning = "top" | "bottom";
export type Team = "away" | "home";

export interface Flash {
  counter: "balls" | "strikes" | "fouls" | "outs";
  text: string;
  tone?: "green" | "red";
  /** Show as a large centered full-screen overlay instead of a small badge. */
  overlay?: boolean;
}

export type PromptKind = "runCap" | "mercy12" | "mercy15" | "time50" | "time55";

export interface GamePrompt {
  kind: PromptKind;
  title: string;
  description: string;
}

export interface GameState {
  awayTeam: string;
  homeTeam: string;
  awayColor: string;
  homeColor: string;
  /** Runs scored per inning (index 0 = 1st inning). */
  awayRuns: number[];
  homeRuns: number[];
  inning: number;
  halfInning: HalfInning;
  balls: number;
  strikes: number;
  fouls: number;
  outs: number;
  /** Ordered pitches in the current at-bat; the walk streak is derived from it
   *  so erasing a strike/foul restores the true consecutive-ball count. */
  pitchLog: ("ball" | "strike" | "foul")[];
  isGameOver: boolean;
  /** Ump-flagged (or clock-forced) final inning: suspends the 7-run cap. */
  finalInning: boolean;
  /** Temporary flourish badge shown over a counter (auto-cleared). */
  flash: Flash | null;
  /** Active league-rule dialog, if any. */
  prompt: GamePrompt | null;
  /** Prompt keys already answered, so we don't re-ask. */
  answered: string[];
}

export const MAX_INNINGS = 7;
const MAX_FOULS = 3;
const RUN_CAP = 7;
const MAX_HISTORY = 100;
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"] as const;

const zeros = () => Array.from({ length: MAX_INNINGS }, () => 0);

const initialState: GameState = {
  awayTeam: "Away",
  homeTeam: "Home",
  awayColor: "",
  homeColor: "",
  awayRuns: zeros(),
  homeRuns: zeros(),
  inning: 1,
  halfInning: "top",
  balls: 0,
  strikes: 0,
  fouls: 0,
  outs: 0,
  pitchLog: [],
  isGameOver: false,
  finalInning: false,
  flash: null,
  prompt: null,
  answered: [],
};

export const total = (runs: number[]) => runs.reduce((a, b) => a + b, 0);

const isFinal = (s: GameState) => s.finalInning || s.inning >= MAX_INNINGS;

/** Message shown when the third out ends a half-inning. */
function endFlash(prev: GameState): Flash {
  if (prev.halfInning === "top") {
    return { counter: "outs", text: "End Half Inning", overlay: true };
  }
  if (prev.inning >= MAX_INNINGS || prev.finalInning) {
    return { counter: "outs", text: "Game Over", overlay: true };
  }
  return {
    counter: "outs",
    text: `End of ${ORDINALS[prev.inning - 1]} Inning`,
    overlay: true,
  };
}

/** Advance past the current half-inning, clearing the count. */
function advanceHalf(prev: GameState): GameState {
  const cleared = {
    ...prev,
    balls: 0,
    strikes: 0,
    fouls: 0,
    outs: 0,
    pitchLog: [],
    prompt: null,
  };
  if (prev.halfInning === "top") {
    return { ...cleared, halfInning: "bottom" };
  }
  if (prev.inning >= MAX_INNINGS || prev.finalInning) {
    return { ...cleared, outs: 3, isGameOver: true };
  }
  return { ...cleared, inning: prev.inning + 1, halfInning: "top" };
}

/** Consecutive balls at the end of the current at-bat's pitch log. */
function currentBallStreak(log: GameState["pitchLog"]): number {
  let streak = 0;
  for (let i = log.length - 1; i >= 0 && log[i] === "ball"; i--) streak++;
  return streak;
}

/** Remove the most recent occurrence of a pitch from the log. */
function removeLast(log: GameState["pitchLog"], pitch: "ball" | "strike" | "foul") {
  const idx = log.lastIndexOf(pitch);
  if (idx === -1) return log;
  return [...log.slice(0, idx), ...log.slice(idx + 1)];
}

/** Attach a league-rule prompt to the state if one now applies. */
function withRulePrompt(next: GameState): GameState {
  const away = total(next.awayRuns);
  const home = total(next.homeRuns);
  const lead = Math.abs(away - home);
  const leader = away > home ? next.awayTeam || "Away" : next.homeTeam || "Home";

  // Mercy rules take priority over the per-inning run cap.
  if (next.inning >= 4 && lead >= 15) {
    const key = `mercy15-${next.inning}-${next.halfInning}-${lead}`;
    if (!next.answered.includes(key)) {
      return {
        ...next,
        prompt: {
          kind: "mercy15",
          title: "Mercy rule: 15-run lead",
          description: `${leader} leads by ${lead} in the ${ORDINALS[next.inning - 1]} inning. The mercy rule ends the game. End the game now or keep playing?`,
        },
        answered: [...next.answered, key],
      };
    }
  }

  if (next.inning >= 5 && lead >= 12) {
    const key = `mercy12-${next.inning}-${next.halfInning}-${lead}`;
    if (!next.answered.includes(key)) {
      return {
        ...next,
        prompt: {
          kind: "mercy12",
          title: "Mercy rule: 12-run lead",
          description: `${leader} leads by ${lead} in the ${ORDINALS[next.inning - 1]} inning. The mercy rule ends the game. End the game now or keep playing?`,
        },
        answered: [...next.answered, key],
      };
    }
  }

  // 7-run cap per half inning — suspended in the final inning.
  if (!isFinal(next)) {
    const runs =
      next.halfInning === "top" ? next.awayRuns[next.inning - 1] : next.homeRuns[next.inning - 1];
    const key = `runcap-${next.inning}-${next.halfInning}`;
    if ((runs ?? 0) >= RUN_CAP && !next.answered.includes(key)) {
      return {
        ...next,
        prompt: {
          kind: "runCap",
          title: `${RUN_CAP}-run cap reached`,
          description: `${next.halfInning === "top" ? next.awayTeam || "Away" : next.homeTeam || "Home"} has scored ${runs} runs this half inning. End the half inning now, or keep playing until 3 outs?`,
        },
        answered: [...next.answered, key],
      };
    }
  }

  return next;
}

const STORAGE_KEY = "kickball-game-state";

function loadState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!Array.isArray(parsed.awayRuns) || !Array.isArray(parsed.homeRuns)) return null;
    return { ...initialState, ...parsed, flash: null, prompt: null };
  } catch {
    return null;
  }
}

export function useKickballGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [history, setHistory] = useState<GameState[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Restore any game in progress after a refresh / app switch.
  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setHydrated(true);
  }, []);

  // Ref mirror of state so history pushes happen outside the setState
  // updater (updaters are double-invoked in dev, which broke undo).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist every change so a refresh, lock screen, or app switch keeps the game.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — keep playing in memory */
    }
  }, [state, hydrated]);

  const apply = useCallback((updater: (prev: GameState) => GameState) => {
    const prev = stateRef.current;
    const next = updater(prev);
    if (next === prev) return;
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), prev]);
    setState(next);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (prev === undefined) return h;
      setState(prev);
      return h.slice(0, -1);
    });
  }, []);

  const setAwayTeam = useCallback((name: string) => {
    setState((prev) => ({ ...prev, awayTeam: name }));
  }, []);

  const setHomeTeam = useCallback((name: string) => {
    setState((prev) => ({ ...prev, homeTeam: name }));
  }, []);

  const setAwayColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, awayColor: color }));
  }, []);

  const setHomeColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, homeColor: color }));
  }, []);

  const addBall = useCallback(() => {
    apply((prev) => {
      if (prev.isGameOver) return prev;
      const nextBalls = prev.balls + 1;
      const nextStreak = prev.ballStreak + 1;
      if (nextBalls >= 4) {
        // Four consecutive balls in one at-bat is a two-base walk.
        const twoBases = nextStreak >= 4;
        return {
          ...prev,
          balls: 0,
          ballStreak: 0,
          flash: {
            counter: "balls",
            text: twoBases ? "Walk - 2 Bases" : "Walk - 1 Base",
            tone: "green",
          },
        };
      }
      return { ...prev, balls: nextBalls, ballStreak: nextStreak };
    });
  }, [apply]);

  const clearFlash = useCallback(() => {
    setState((prev) => (prev.flash ? { ...prev, flash: null } : prev));
  }, []);

  const removeBall = useCallback(() => {
    apply((prev) => ({
      ...prev,
      balls: Math.max(0, prev.balls - 1),
      ballStreak: Math.max(0, prev.ballStreak - 1),
    }));
  }, [apply]);

  const addStrike = useCallback(() => {
    apply((prev) => {
      if (prev.isGameOver) return prev;
      const nextStrikes = prev.strikes + 1;
      prev = { ...prev, ballStreak: 0 };
      if (nextStrikes >= 3) {
        // Strike-out: reset balls, strikes, and fouls for the next batter.
        const { state: next, halfEnded } = addOutImpl({
          ...prev,
          balls: 0,
          strikes: 0,
          fouls: 0,
          ballStreak: 0,
        });
        return {
          ...next,
          flash: halfEnded
            ? endFlash(prev)
            : { counter: "strikes", text: "+1 Out", tone: "red" as const },
        };
      }
      return { ...prev, strikes: nextStrikes };
    });
  }, [apply]);

  const removeStrike = useCallback(() => {
    apply((prev) => ({ ...prev, strikes: Math.max(0, prev.strikes - 1) }));
  }, [apply]);

  const addFoul = useCallback(() => {
    apply((prev) => {
      if (prev.isGameOver) return prev;
      const nextFouls = prev.fouls + 1;
      prev = { ...prev, ballStreak: 0 };
      if (nextFouls >= MAX_FOULS) {
        // Foul-out: reset balls, strikes, and fouls for the next batter.
        const { state: next, halfEnded } = addOutImpl({
          ...prev,
          balls: 0,
          strikes: 0,
          fouls: 0,
          ballStreak: 0,
        });
        return {
          ...next,
          flash: halfEnded
            ? endFlash(prev)
            : { counter: "fouls", text: "+1 Out", tone: "red" as const },
        };
      }
      return { ...prev, fouls: nextFouls };
    });
  }, [apply]);

  const removeFoul = useCallback(() => {
    apply((prev) => ({ ...prev, fouls: Math.max(0, prev.fouls - 1) }));
  }, [apply]);

  const addOut = useCallback(() => {
    apply((prev) => {
      if (prev.isGameOver) return prev;
      const { state: next, halfEnded } = addOutImpl(prev);
      if (halfEnded) {
        return { ...next, flash: endFlash(prev) };
      }
      return next;
    });
  }, [apply]);

  const removeOut = useCallback(() => {
    apply((prev) => ({ ...prev, outs: Math.max(0, prev.outs - 1) }));
  }, [apply]);

  /** Adjust a team's runs for the current inning (score buttons). */
  const adjustScore = useCallback(
    (team: Team, delta: number) => {
      apply((prev) => {
        const key = team === "away" ? "awayRuns" : "homeRuns";
        const runs = [...prev[key]];
        const idx = prev.inning - 1;
        runs[idx] = Math.max(0, (runs[idx] ?? 0) + delta);
        return withRulePrompt({ ...prev, [key]: runs });
      });
    },
    [apply],
  );

  /** Directly set the runs in one linescore cell. */
  const setCellRuns = useCallback(
    (team: Team, inningIndex: number, value: number) => {
      apply((prev) => {
        const key = team === "away" ? "awayRuns" : "homeRuns";
        const runs = [...prev[key]];
        runs[inningIndex] = Math.max(0, Math.min(99, Math.floor(value) || 0));
        return withRulePrompt({ ...prev, [key]: runs });
      });
    },
    [apply],
  );

  const adjustAwayScore = useCallback((delta: number) => adjustScore("away", delta), [adjustScore]);
  const adjustHomeScore = useCallback((delta: number) => adjustScore("home", delta), [adjustScore]);

  const resetBSF = useCallback(() => {
    apply((prev) => {
      if (prev.balls === 0 && prev.strikes === 0 && prev.fouls === 0) return prev;
      return { ...prev, balls: 0, strikes: 0, fouls: 0, ballStreak: 0 };
    });
  }, [apply]);

  const setFinalInning = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, finalInning: value }));
  }, []);

  /** Clock passed 50:00 — no new inning may begin. */
  const notifyFiftyMinutes = useCallback(() => {
    setState((prev) => {
      if (prev.isGameOver || prev.answered.includes("time50") || prev.prompt) return prev;
      return {
        ...prev,
        prompt: {
          kind: "time50",
          title: "50 minute mark",
          description:
            "No new inning may begin after 50 minutes. Mark the current inning as the final inning? The 7-run cap does not apply in the final inning.",
        },
        answered: [...prev.answered, "time50"],
      };
    });
  }, []);

  /** Clock passed 55:00 — the in-progress inning cannot count. */
  const notifyFiftyFiveMinutes = useCallback(() => {
    setState((prev) => {
      if (prev.isGameOver || prev.answered.includes("time55") || prev.prompt) return prev;
      return {
        ...prev,
        prompt: {
          kind: "time55",
          title: "55 MIN REACHED",
          description: "End game and revert to previous inning score?",
        },
        answered: [...prev.answered, "time55"],
      };
    });
  }, []);

  /** "Revert" answer to the 55-minute prompt: drop the in-progress inning. */
  const revertToPreviousInning = useCallback(() => {
    apply((prev) => {
      const idx = prev.inning - 1;
      const awayRuns = [...prev.awayRuns];
      const homeRuns = [...prev.homeRuns];
      awayRuns[idx] = 0;
      homeRuns[idx] = 0;
      return {
        ...prev,
        awayRuns,
        homeRuns,
        prompt: null,
        balls: 0,
        strikes: 0,
        fouls: 0,
        outs: 0,
        isGameOver: true,
        flash: { counter: "outs", text: "Game Over", overlay: true },
      };
    });
  }, [apply]);

  const dismissPrompt = useCallback(() => {
    setState((prev) => (prev.prompt ? { ...prev, prompt: null } : prev));
  }, []);

  /** "End half inning" answer to the run-cap prompt. */
  const endHalfInning = useCallback(() => {
    apply((prev) => {
      const next = advanceHalf(prev);
      return { ...next, flash: endFlash(prev) };
    });
  }, [apply]);

  /** "End game" answer to a mercy-rule prompt. */
  const endGame = useCallback(() => {
    apply((prev) => ({
      ...prev,
      prompt: null,
      isGameOver: true,
      flash: { counter: "outs", text: "Game Over", overlay: true },
    }));
  }, [apply]);

  /** "Yes, final inning" answer to the 50-minute prompt. */
  const confirmFinalInning = useCallback(() => {
    apply((prev) => ({ ...prev, prompt: null, finalInning: true }));
  }, [apply]);

  const newGame = useCallback(() => {
    setState(initialState);
    setHistory([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return {
    state,
    awayScore: total(state.awayRuns),
    homeScore: total(state.homeRuns),
    isFinalInning: isFinal(state),
    canUndo: history.length > 0,
    setAwayTeam,
    setHomeTeam,
    setAwayColor,
    setHomeColor,
    addBall,
    removeBall,
    addStrike,
    removeStrike,
    addFoul,
    removeFoul,
    addOut,
    removeOut,
    adjustAwayScore,
    adjustHomeScore,
    setCellRuns,
    resetBSF,
    setFinalInning,
    notifyFiftyMinutes,
    notifyFiftyFiveMinutes,
    revertToPreviousInning,
    dismissPrompt,
    endHalfInning,
    endGame,
    confirmFinalInning,
    newGame,
    undo,
    clearFlash,
  };
}

function addOutImpl(current: GameState): { state: GameState; halfEnded: boolean } {
  const nextOuts = current.outs + 1;
  if (nextOuts < 3) {
    return { state: { ...current, outs: nextOuts }, halfEnded: false };
  }

  // Three outs: end the half-inning.
  if (current.halfInning === "top") {
    return {
      state: { ...current, outs: 0, halfInning: "bottom" },
      halfEnded: true,
    };
  }

  // Bottom of the inning.
  if (current.inning >= MAX_INNINGS || current.finalInning) {
    return {
      state: { ...current, outs: 3, isGameOver: true },
      halfEnded: true,
    };
  }

  return {
    state: { ...current, inning: current.inning + 1, halfInning: "top", outs: 0 },
    halfEnded: true,
  };
}
