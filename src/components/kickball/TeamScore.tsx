import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TEAM_COLORS, readableText } from "@/lib/team-colors";
import { cn } from "@/lib/utils";

interface TeamScoreProps {
  label: string;
  name: string;
  score: number;
  color: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onAdjustScore: (delta: number) => void;
  disabled?: boolean;
}

export function TeamScore({
  label,
  name,
  score,
  color,
  onNameChange,
  onColorChange,
  onAdjustScore,
  disabled = false,
}: TeamScoreProps) {
  const [open, setOpen] = useState(false);
  const fg = color ? readableText(color) : undefined;
  const cardStyle = color ? { backgroundColor: color, color: fg, borderColor: color } : undefined;
  const displayName = name || label;

  return (
    <div
      className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm"
      style={cardStyle}
    >
      <div className="grid w-full grid-cols-[1.5rem_1fr_1.5rem] items-start gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-current/40 shadow-inner"
            style={{ backgroundColor: color || "transparent" }}
            aria-label={`Pick ${label} team color`}
          />
          <PopoverContent className="w-72 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {label} team color
            </p>
            <div className="grid grid-cols-6 gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    onColorChange(c.value);
                    setOpen(false);
                  }}
                  aria-label={c.name}
                  title={c.name}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform active:scale-95",
                    color === c.value ? "border-foreground" : "border-border",
                    c.value ? "" : "bg-transparent",
                  )}
                  style={c.value ? { backgroundColor: c.value } : undefined}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <label htmlFor={`team-name-${label}`} className="sr-only">
          {label} team name
        </label>
        <textarea
          id={`team-name-${label}`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          rows={1}
          style={{ fieldSizing: "content" }}
          className="min-h-[1.25rem] w-full min-w-0 resize-none overflow-hidden rounded-md border-0 bg-transparent py-0.5 text-center text-xs font-extrabold uppercase leading-tight tracking-wider outline-none placeholder:opacity-60 focus-visible:ring-1 focus-visible:ring-current"
          placeholder={label}
        />
        <div aria-hidden="true" />
      </div>
      <div className="flex w-full items-center justify-between gap-1">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current/40 transition-colors disabled:opacity-40"
          onClick={() => onAdjustScore(-1)}
          disabled={disabled || score <= 0}
          aria-label={`Decrease ${displayName} score`}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <span className="min-w-[3ch] text-center text-3xl font-black tabular-nums">{score}</span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current/40 transition-colors disabled:opacity-40"
          onClick={() => onAdjustScore(1)}
          disabled={disabled}
          aria-label={`Increase ${displayName} score`}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
