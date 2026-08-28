import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Pause, Play, RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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

function Index() {
  const {
    state,
    canUndo,
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
    undo,
    clearWalk,
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

  // Auto-clear the "Walk" flourish after a few seconds.
  useEffect(() => {
    if (!state.showWalk) return;
    const t = setTimeout(clearWalk, 3000);
    return () => clearTimeout(t);
  }, [state.showWalk, clearWalk]);

  const handleNewGame = () => {
    newGame();
    resetTimer();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-background p-4 text-foreground">
      <h1 className="text-center text-2xl font-bold tracking-tight">Umpire Tally</h1>

      <section className="grid grid-cols-2 gap-3">
        <TeamScore
          label="Away"
          name={state.awayTeam}
          score={state.awayScore}
          onNameChange={setAwayTeam}
          onAdjustScore={adjustAwayScore}
          disabled={state.isGameOver}
        />
        <TeamScore
          label="Home"
          name={state.homeTeam}
          score={state.homeScore}
          onNameChange={setHomeTeam}
          onAdjustScore={adjustHomeScore}
          disabled={state.isGameOver}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-lg px-3 py-1 text-sm font-bold uppercase tracking-wider",
                state.halfInning === "top"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Top
            </span>
            <span
              className={cn(
                "rounded-lg px-3 py-1 text-sm font-bold uppercase tracking-wider",
                state.halfInning === "bottom"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Bot
            </span>
            <span className="text-3xl font-bold">{state.inning}</span>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold tabular-nums">{formattedTime}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={isRunning ? "secondary" : "default"}
            className="flex-1 rounded-xl py-5 text-base font-semibold"
            onClick={isRunning ? pause : start}
          >
            {isRunning ? (
              <>
                <Pause className="mr-2 h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> Start
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl px-5 py-5 text-base font-semibold"
            onClick={resetTimer}
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
      </section>

      {state.isGameOver && (
        <div className="rounded-xl bg-primary p-4 text-center text-primary-foreground shadow-sm">
          <p className="text-lg font-bold">Game Over</p>
          <p className="text-sm opacity-90">
            Final score: {state.awayTeam} {state.awayScore} - {state.homeTeam} {state.homeScore}
          </p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-4">
        <Counter
          label="Balls"
          value={state.balls}
          onAdd={addBall}
          onRemove={removeBall}
          max={4}
          disabled={state.isGameOver}
          badge={state.showWalk ? "Walk" : undefined}
        />
        <Counter
          label="Strikes"
          value={state.strikes}
          onAdd={addStrike}
          onRemove={removeStrike}
          max={3}
          disabled={state.isGameOver}
        />
        <Counter
          label="Fouls"
          value={state.fouls}
          onAdd={addFoul}
          onRemove={removeFoul}
          max={4}
          disabled={state.isGameOver}
          variant="foul"
        />
        <Counter
          label="Outs"
          value={state.outs}
          onAdd={addOut}
          onRemove={removeOut}
          max={3}
          disabled={state.isGameOver}
          variant="out"
        />
      </section>

      <Button
        type="button"
        variant="outline"
        className="rounded-xl py-5 text-base font-semibold"
        onClick={undo}
        disabled={!canUndo}
      >
        <Undo2 className="mr-2 h-5 w-5" /> Undo
      </Button>

      <NewGameDialog onConfirm={handleNewGame} />
    </main>
  );
}
