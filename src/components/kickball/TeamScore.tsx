import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TeamScoreProps {
  label: string;
  name: string;
  score: number;
  onNameChange: (name: string) => void;
  onAdjustScore: (delta: number) => void;
  disabled?: boolean;
}

export function TeamScore({
  label,
  name,
  score,
  onNameChange,
  onAdjustScore,
  disabled = false,
}: TeamScoreProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
      <label htmlFor={`team-name-${label}`} className="sr-only">
        {label} team name
      </label>
      <Input
        id={`team-name-${label}`}
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-7 border-0 bg-transparent text-center text-sm font-extrabold uppercase tracking-widest focus-visible:ring-1"
        placeholder={label}
      />
      <div className="flex w-full items-center justify-between gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onAdjustScore(-1)}
          disabled={disabled || score <= 0}
          aria-label={`Decrease ${name} score`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[3ch] text-center text-3xl font-black tabular-nums">{score}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onAdjustScore(1)}
          disabled={disabled}
          aria-label={`Increase ${name} score`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
