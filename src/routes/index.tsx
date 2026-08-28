import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Pause, Play, RotateCcw, Undo2 } from "lucide-react";

import { Counter } from "@/components/kickball/Counter";
import { NewGameDialog } from "@/components/kickball/NewGameDialog";
import { TeamScore } from "@/components/kickball/TeamScore";
import { useKickballGame } from "@/hooks/useKickballGame";
import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kickball Umpire Tally" },
      {
        name: "description",
        content:
          "Mobile-first tally tool for kickball umpires. Track balls, strikes, fouls, outs, score, innings, and game time.",
      },
      { property: "og:title", content: "Kickball Umpire Tally" },
      {
        property: "og:description",
        content:
          "Mobile-first tally tool for kickball umpires. Track balls, strikes, fouls, outs, score, innings, and game time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"] as const;

function Index() {
  const {
    state,
    canUndo,
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
  } = useKickballGame();

  const { formattedTime, isRunning, start, pause, reset: resetTimer } = useTimer();

  // Warn umpires if they accidentally refresh mid-game.
  useEffect(() => {
    const hasProgress =
      state.balls > 0 ||
      state.strikes > 0 ||
      state.fouls > 0 ||
      state.outs > 0 ||
      state.awayScore > 0 ||
      state.homeScore > 0 ||
      state.inning > 1 ||
      state.isGameOver;

    if (!hasProgress) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state]);

  // Auto-clear flourish badges after 2s.
  useEffect(() => {
    if (!state.flash) return;
    const t = setTimeout(clearFlash, 2000);
    return () => clearTimeout(t);
  }, [state.flash, clearFlash]);

  const handleNewGame = () => {
    newGame();
    resetTimer();
  };

  const overlayFlash = state.flash?.overlay ? state.flash : null;
  const badgeFor = (counter: "balls" | "strikes" | "fouls" | "outs") =>
    state.flash && !state.flash.overlay && state.flash.counter === counter
      ? state.flash.text
      : undefined;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-2 bg-background p-3 text-foreground">
      <h1 className="text-center text-lg font-black tracking-tight">Umpire Tally</h1>

      {overlayFlash && (
        <div
          role="status"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <div className="rounded-3xl bg-red-600 px-8 py-6 text-center text-3xl font-black uppercase leading-tight tracking-wide text-white shadow-2xl">
            {overlayFlash.text}
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3">
        <TeamScore
          label="Away"
          name={state.awayTeam}
          score={state.awayScore}
          color={state.awayColor}
          onNameChange={setAwayTeam}
          onColorChange={setAwayColor}
          onAdjustScore={adjustAwayScore}
          disabled={state.isGameOver}
        />
        <TeamScore
          label="Home"
          name={state.homeTeam}
          score={state.homeScore}
          color={state.homeColor}
          onNameChange={setHomeTeam}
          onColorChange={setHomeColor}
          onAdjustScore={adjustHomeScore}
          disabled={state.isGameOver}
        />
      </section>

      <section className="flex items-center justify-between gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-tight opacity-60">Inning</p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-widest",
                state.halfInning === "top"
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary-foreground/20 text-primary-foreground/70",
              )}
            >
              Top
            </span>
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-widest",
                state.halfInning === "bottom"
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary-foreground/20 text-primary-foreground/70",
              )}
            >
              Bot
            </span>
            <span className="text-2xl font-extrabold">{ORDINALS[state.inning - 1]}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold uppercase tracking-tight opacity-60">Game Time</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">{formattedTime}</span>
            <button
              type="button"
              onClick={isRunning ? pause : start}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
              className="rounded-full bg-primary-foreground/15 p-2 transition-colors hover:bg-primary-foreground/25"
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset timer"
              className="rounded-full bg-primary-foreground/15 p-2 transition-colors hover:bg-primary-foreground/25"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {state.isGameOver && (
        <div className="rounded-xl bg-primary p-3 text-center text-primary-foreground shadow-sm">
          <p className="text-base font-bold">Game Over</p>
          <p className="text-sm opacity-90">
            Final score: {state.awayTeam} {state.awayScore} - {state.homeTeam} {state.homeScore}
          </p>
        </div>
      )}

      <section className="grid flex-1 grid-cols-2 gap-2">
        <Counter
          label="Balls"
          value={state.balls}
          onAdd={addBall}
          onRemove={removeBall}
          max={4}
          disabled={state.isGameOver}
          badge={state.flash?.counter === "balls" ? state.flash.text : undefined}
        />
        <Counter
          label="Strikes"
          value={state.strikes}
          onAdd={addStrike}
          onRemove={removeStrike}
          max={3}
          disabled={state.isGameOver}
          badge={state.flash?.counter === "strikes" ? state.flash.text : undefined}
        />
        <Counter
          label="Fouls"
          value={state.fouls}
          onAdd={addFoul}
          onRemove={removeFoul}
          max={4}
          disabled={state.isGameOver}
          badge={state.flash?.counter === "fouls" ? state.flash.text : undefined}
        />
        <Counter
          label="Outs"
          value={state.outs}
          onAdd={addOut}
          onRemove={removeOut}
          max={3}
          disabled={state.isGameOver}
          variant="out"
          badge={state.flash?.counter === "outs" ? state.flash.text : undefined}
        />
      </section>

      <section className="mt-auto flex gap-2">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-muted py-2.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground transition-colors active:bg-muted/70 disabled:opacity-40"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="h-4 w-4" /> Undo
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-muted py-2.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground transition-colors active:bg-muted/70 disabled:opacity-40"
          onClick={resetBSF}
          disabled={state.balls === 0 && state.strikes === 0 && state.fouls === 0}
        >
          Reset B/S/F
        </button>
        <NewGameDialog onConfirm={handleNewGame} className="flex-1 py-2.5 text-xs" />
      </section>
    </main>
  );
}
