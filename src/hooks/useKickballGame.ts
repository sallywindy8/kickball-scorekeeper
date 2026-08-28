import { useState, useCallback, useRef, useEffect } from "react";

type HalfInning = "top" | "bottom";

export interface Flash {
  counter: "balls" | "strikes" | "fouls" | "outs";
  text: string;
  tone?: "green" | "red";
  /** Show as a large centered full-screen overlay instead of a small badge. */
  overlay?: boolean;
}

export interface GameState {
  awayTeam: string;
  homeTeam: string;
  awayColor: string;
  homeColor: string;
  awayScore: number;
  homeScore: number;
  inning: number;
  halfInning: HalfInning;
  balls: number;
  strikes: number;
  fouls: number;
  outs: number;
  isGameOver: boolean;
  /** Temporary flourish badge shown over a counter (auto-cleared). */
  flash: Flash | null;
}

const MAX_INNINGS = 7;
const MAX_FOULS = 3;
const MAX_HISTORY = 100;
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"] as const;

const initialState: GameState = {
  awayTeam: "Away",
  homeTeam: "Home",
  awayColor: "",
  homeColor: "",
  awayScore: 0,
  homeScore: 0,
  inning: 1,
  halfInning: "top",
  balls: 0,
  strikes: 0,
  fouls: 0,
  outs: 0,
  isGameOver: false,
  flash: null,
};

/** Message shown when the third out ends a half-inning. */
function endFlash(prev: GameState): Flash {
  if (prev.halfInning === "top") {
    return { counter: "outs", text: "End Half Inning", overlay: true };
  }
  if (prev.inning >= MAX_INNINGS) {
    return { counter: "outs", text: "Game Over", overlay: true };
  }
  return {
    counter: "outs",
    text: `End of ${ORDINALS[prev.inning - 1]} Inning`,
    overlay: true,
  };
}

export function useKickballGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [history, setHistory] = useState<GameState[]>([]);

  // Ref mirror of state so history pushes happen outside the setState
  // updater (updaters are double-invoked in dev, which broke undo).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
      if (nextBalls >= 4) {
        return {
          ...prev,
          balls: 0,
          flash: { counter: "balls", text: "Walk", tone: "green" },
        };
      }
      return { ...prev, balls: nextBalls };
    });
  }, [apply]);

  const clearFlash = useCallback(() => {
    setState((prev) => (prev.flash ? { ...prev, flash: null } : prev));
  }, []);

  const removeBall = useCallback(() => {
    apply((prev) => ({ ...prev, balls: Math.max(0, prev.balls - 1) }));
  }, [apply]);

  const addStrike = useCallback(() => {
    apply((prev) => {
      if (prev.isGameOver) return prev;
      const nextStrikes = prev.strikes + 1;
      if (nextStrikes >= 3) {
        // Strike-out: reset balls, strikes, and fouls for the next batter.
        const { state: next, halfEnded } = addOutImpl({ ...prev, balls: 0, strikes: 0, fouls: 0 });
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
      if (nextFouls >= MAX_FOULS) {
        // Foul-out: reset balls, strikes, and fouls for the next batter.
        const { state: next, halfEnded } = addOutImpl({ ...prev, balls: 0, strikes: 0, fouls: 0 });
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

  const adjustAwayScore = useCallback(
    (delta: number) => {
      apply((prev) => ({
        ...prev,
        awayScore: Math.max(0, prev.awayScore + delta),
      }));
    },
    [apply],
  );

  const adjustHomeScore = useCallback(
    (delta: number) => {
      apply((prev) => ({
        ...prev,
        homeScore: Math.max(0, prev.homeScore + delta),
      }));
    },
    [apply],
  );

  const resetBSF = useCallback(() => {
    apply((prev) => {
      if (prev.balls === 0 && prev.strikes === 0 && prev.fouls === 0) return prev;
      return { ...prev, balls: 0, strikes: 0, fouls: 0 };
    });
  }, [apply]);

  const newGame = useCallback(() => {
    setState(initialState);
    setHistory([]);
  }, []);

  return {
    state,
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
    resetBSF,
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
  if (current.inning >= MAX_INNINGS) {
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
