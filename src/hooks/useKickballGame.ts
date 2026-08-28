import { useState, useCallback } from "react";

type HalfInning = "top" | "bottom";

export interface GameState {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  inning: number;
  halfInning: HalfInning;
  balls: number;
  strikes: number;
  fouls: number;
  outs: number;
  isGameOver: boolean;
  /** True briefly after the 4th ball — drives the "Walk" flourish. */
  showWalk: boolean;
}

const MAX_INNINGS = 7;

const initialState: GameState = {
  awayTeam: "Away",
  homeTeam: "Home",
  awayScore: 0,
  homeScore: 0,
  inning: 1,
  halfInning: "top",
  balls: 0,
  strikes: 0,
  fouls: 0,
  outs: 0,
  isGameOver: false,
  showWalk: false,
};

const MAX_FOULS = 4;
const MAX_HISTORY = 100;

export function useKickballGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [history, setHistory] = useState<GameState[]>([]);

  // Push current state onto the undo stack, then apply the update.
  const apply = useCallback((updater: (prev: GameState) => GameState) => {
    setState((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      setHistory((h) => [...h.slice(-MAX_HISTORY + 1), prev]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setState(prev);
      return h.slice(0, -1);
    });
  }, []);

  const setAwayTeam = useCallback((name: string) => {
    setState((prev) => ({ ...prev, awayTeam: name || "Away" }));
  }, []);

  const setHomeTeam = useCallback((name: string) => {
    setState((prev) => ({ ...prev, homeTeam: name || "Home" }));
  }, []);

  const addBall = useCallback(() => {
    setState((prev) => {
      if (prev.isGameOver) return prev;
      const nextBalls = prev.balls + 1;
      if (nextBalls >= 4) {
        return { ...prev, balls: 0 };
      }
      return { ...prev, balls: nextBalls };
    });
  }, []);

  const removeBall = useCallback(() => {
    setState((prev) => ({ ...prev, balls: Math.max(0, prev.balls - 1) }));
  }, []);

  const addStrike = useCallback(() => {
    setState((prev) => {
      if (prev.isGameOver) return prev;
      const nextStrikes = prev.strikes + 1;
      if (nextStrikes >= 3) {
        return addOutImpl({ ...prev, strikes: 0 });
      }
      return { ...prev, strikes: nextStrikes };
    });
  }, []);

  const removeStrike = useCallback(() => {
    setState((prev) => ({ ...prev, strikes: Math.max(0, prev.strikes - 1) }));
  }, []);

  const addFoul = useCallback(() => {
    setState((prev) => {
      if (prev.isGameOver) return prev;
      const nextFouls = prev.fouls + 1;
      if (nextFouls >= 3) {
        return addOutImpl({ ...prev, fouls: 0 });
      }
      return { ...prev, fouls: nextFouls };
    });
  }, []);

  const removeFoul = useCallback(() => {
    setState((prev) => ({ ...prev, fouls: Math.max(0, prev.fouls - 1) }));
  }, []);

  const addOut = useCallback(() => {
    setState((prev) => {
      if (prev.isGameOver) return prev;
      return addOutImpl(prev);
    });
  }, []);

  const removeOut = useCallback(() => {
    setState((prev) => ({ ...prev, outs: Math.max(0, prev.outs - 1) }));
  }, []);

  const adjustAwayScore = useCallback((delta: number) => {
    setState((prev) => ({
      ...prev,
      awayScore: Math.max(0, prev.awayScore + delta),
    }));
  }, []);

  const adjustHomeScore = useCallback((delta: number) => {
    setState((prev) => ({
      ...prev,
      homeScore: Math.max(0, prev.homeScore + delta),
    }));
  }, []);

  const newGame = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setAwayTeam,
    setHomeTeam,
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
    newGame,
  };
}

function addOutImpl(current: GameState): GameState {
  const nextOuts = current.outs + 1;
  if (nextOuts < 3) {
    return { ...current, outs: nextOuts };
  }

  // Three outs: end the half-inning.
  if (current.halfInning === "top") {
    return {
      ...current,
      outs: 0,
      halfInning: "bottom",
    };
  }

  // Bottom of the inning.
  if (current.inning >= MAX_INNINGS) {
    return {
      ...current,
      outs: 3,
      isGameOver: true,
    };
  }

  return {
    ...current,
    inning: current.inning + 1,
    halfInning: "top",
    outs: 0,
  };
}
