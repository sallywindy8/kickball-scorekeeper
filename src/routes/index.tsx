import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Pause, Play, RotateCcw, Undo2 } from "lucide-react";

import { Counter } from "@/components/kickball/Counter";
import { LineScore } from "@/components/kickball/LineScore";
import { TeamScore } from "@/components/kickball/TeamScore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
const FIFTY_MINUTES = 50 * 60;
const FIFTY_FIVE_MINUTES = 55 * 60;

function Index() {
  const {
    state,
    awayScore,
    homeScore,
    isFinalInning,
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
    setCellRuns,
    resetBSF,
    setFinalInning,
    notifyFiftyMinutes,
    notifyFiftyFiveMinutes,
    revertToPreviousInning,
    dismissPrompt,
    endHalfInning,
    endGame,
    resumeGame,
    confirmFinalInning,
    newGame,
    undo,
    clearFlash,
  } = useKickballGame();

  const { formattedTime, seconds, isRunning, start, pause, reset: resetTimer } = useTimer();
  const timerStarted = seconds > 0 || isRunning;

  // Warn umpires if they accidentally refresh mid-game.
  useEffect(() => {
    const hasProgress =
      state.balls > 0 ||
      state.strikes > 0 ||
      state.fouls > 0 ||
      state.outs > 0 ||
      awayScore > 0 ||
      homeScore > 0 ||
      state.inning > 1 ||
      state.isGameOver;

    if (!hasProgress) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state, awayScore, homeScore]);

  // Auto-clear flourish badges after 2s.
  useEffect(() => {
    if (!state.flash) return;
    const t = setTimeout(clearFlash, 2000);
    return () => clearTimeout(t);
  }, [state.flash, clearFlash]);

  // 50-minute mark: no new inning may begin.
  useEffect(() => {
    if (seconds >= FIFTY_MINUTES) notifyFiftyMinutes();
  }, [seconds, notifyFiftyMinutes]);

  // 55-minute mark: the in-progress inning cannot count.
  useEffect(() => {
    if (seconds >= FIFTY_FIVE_MINUTES) notifyFiftyFiveMinutes();
  }, [seconds, notifyFiftyFiveMinutes]);

  const handleNewGame = () => {
    newGame();
    resetTimer();
  };

  const overlayFlash = state.flash?.overlay ? state.flash : null;
  const badgeFor = (counter: "balls" | "strikes" | "fouls" | "outs") =>
    state.flash && !state.flash.overlay && state.flash.counter === counter
      ? state.flash.text
      : undefined;

  const prompt = state.prompt;
  const promptConfirmLabel =
    prompt?.kind === "runCap"
      ? state.halfInning === "top"
        ? "End half inning"
        : "End inning"
      : prompt?.kind === "time50"
        ? "Yes, final inning"
        : prompt?.kind === "time55"
          ? "Revert & end game"
          : "End game";
  const promptCancelLabel =
    prompt?.kind === "runCap"
      ? "Keep playing"
      : prompt?.kind === "time50"
        ? "Not yet"
        : prompt?.kind === "time55"
          ? "Keep playing"
          : "Continue game";
  const handlePromptConfirm = () => {
    if (!prompt) return;
    if (prompt.kind === "runCap") endHalfInning();
    else if (prompt.kind === "time50") confirmFinalInning();
    else if (prompt.kind === "time55") revertToPreviousInning();
    else endGame();
  };

  const overtime = seconds >= FIFTY_FIVE_MINUTES && !state.isGameOver;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-1.5 bg-background p-2 text-foreground">
      <header className="text-center">
        <h1 className="text-lg font-black uppercase tracking-widest text-primary">WAKA Scorekeeping</h1>
      </header>
      {overlayFlash && (
        <div
          role="status"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <div className="rounded-3xl bg-red-600 px-8 py-6 text-center text-white shadow-2xl">
            <p className="text-3xl font-black uppercase leading-tight tracking-wide">
              {overlayFlash.text}
            </p>
            {overlayFlash.description && (
              <p className="mt-2 text-base font-bold opacity-95">{overlayFlash.description}</p>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={prompt !== null}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{prompt?.title}</AlertDialogTitle>
            <AlertDialogDescription>{prompt?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl" onClick={dismissPrompt}>
              {promptCancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={handlePromptConfirm}>
              {promptConfirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={state.isGameOver}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Game Over</AlertDialogTitle>
            <AlertDialogDescription>
              Final score: {state.awayTeam} {awayScore} - {state.homeTeam} {homeScore}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-center text-xs font-black uppercase tracking-wider text-muted-foreground">
            Score a new game?
          </p>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={resumeGame} className="rounded-xl">
              Go back to score
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNewGame}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              New Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="grid grid-cols-2 gap-2">
        <TeamScore
          label="Away"
          name={state.awayTeam}
          score={awayScore}
          color={state.awayColor}
          onNameChange={setAwayTeam}
          onColorChange={setAwayColor}
          onAdjustScore={adjustAwayScore}
          disabled={state.isGameOver}
          isKicking={state.halfInning === "top"}
          dimInactive={timerStarted}
        />
        <TeamScore
          label="Home"
          name={state.homeTeam}
          score={homeScore}
          color={state.homeColor}
          onNameChange={setHomeTeam}
          onColorChange={setHomeColor}
          onAdjustScore={adjustHomeScore}
          disabled={state.isGameOver}
          isKicking={state.halfInning === "bottom"}
          dimInactive={timerStarted}
        />
      </section>

      <section className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Inning</p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-widest",
                state.halfInning === "top"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Top
            </span>
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-widest",
                state.halfInning === "bottom"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Bot
            </span>
            <span className="text-2xl font-extrabold text-foreground">{ORDINALS[state.inning - 1]}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Game Time</p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-3xl font-bold tabular-nums text-primary",
                overtime && "text-red-400",
              )}
            >
              {formattedTime}
            </span>
            <button
              type="button"
              onClick={isRunning ? pause : start}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
              className="rounded-full bg-muted p-2 text-foreground transition-colors hover:bg-muted/70"
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset timer"
              className="rounded-full bg-muted p-2 text-foreground transition-colors hover:bg-muted/70"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2">
        <div className="flex w-1/2 items-center justify-between gap-2 rounded-xl bg-muted px-3 py-1">
          <label
            htmlFor="final-inning"
            className="text-[11px] font-black uppercase tracking-wider text-muted-foreground"
          >
            Final inning
            <br />
            (no run cap)
          </label>
          <input
            id="final-inning"
            type="checkbox"
            className="h-5 w-5 accent-primary"
            checked={isFinalInning}
            disabled={state.inning >= 7}
            onChange={(e) => setFinalInning(e.target.checked)}
          />
        </div>
        <button
          type="button"
          className="flex flex-1 items-center justify-center rounded-xl bg-destructive/20 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-destructive/60 shadow-sm transition-colors active:bg-destructive/30 disabled:opacity-40"
          onClick={resetBSF}
          disabled={state.balls === 0 && state.strikes === 0 && state.fouls === 0}
        >
          Reset B/S/F Count
        </button>
      </div>

      {overtime && (
        <p className="rounded-xl bg-destructive/20 px-3 py-1.5 text-center text-[11px] font-black uppercase tracking-wider text-destructive">
          Past 55:00 — revert score to the last completed inning
        </p>
      )}

      <section className="grid flex-1 grid-cols-2 gap-2">
        <Counter
          label="Balls"
          value={state.balls}
          onAdd={addBall}
          onRemove={removeBall}
          max={4}
          disabled={state.isGameOver}
          badge={badgeFor("balls")}
          badgeTone="green"
        />
        <Counter
          label="Strikes"
          value={state.strikes}
          onAdd={addStrike}
          onRemove={removeStrike}
          max={3}
          disabled={state.isGameOver}
          badge={badgeFor("strikes")}
          badgeTone="red"
        />
        <Counter
          label="Fouls"
          value={state.fouls}
          onAdd={addFoul}
          onRemove={removeFoul}
          max={3}
          disabled={state.isGameOver}
          badge={badgeFor("fouls")}
          badgeTone="red"
        />
        <Counter
          label="Outs"
          value={state.outs}
          onAdd={addOut}
          onRemove={removeOut}
          max={3}
          disabled={state.isGameOver}
          variant="out"
          badge={badgeFor("outs")}
          badgeTone="red"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <LineScore
          awayName={state.awayTeam}
          homeName={state.homeTeam}
          awayRuns={state.awayRuns}
          homeRuns={state.homeRuns}
          inning={state.inning}
          halfInning={state.halfInning}
          onCellChange={setCellRuns}
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={state.isGameOver}
              className="flex-1 rounded-2xl bg-destructive py-2.5 text-xs font-extrabold uppercase tracking-wider text-destructive-foreground shadow-lg transition-colors active:bg-destructive/90 disabled:opacity-40"
            >
              End Game
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>End the game?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end the game now and show the final score.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">No, keep scoring</AlertDialogCancel>
              <AlertDialogAction
                onClick={endGame}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, end game
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </main>
  );
}
