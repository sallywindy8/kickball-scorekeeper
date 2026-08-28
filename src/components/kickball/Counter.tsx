import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CounterProps {
  label: string;
  value: number;
  onAdd: () => void;
  onRemove: () => void;
  max?: number;
  disabled?: boolean;
  variant?: "default" | "out";
  /** Temporary badge shown over the count, e.g. "Walk" on the 4th ball. */
  badge?: string | undefined;
  /** Badge color tone. */
  badgeTone?: "green" | "red";
}

export function Counter({
  label,
  value,
  onAdd,
  onRemove,
  max,
  disabled = false,
  variant = "default",
  badge,
  badgeTone = "green",
}: CounterProps) {
  const isAtMax = max !== undefined && value >= max;
  const isOut = variant === "out";
  const dotCount = max ?? 3;
  const accentClass = isOut ? "bg-outs" : "bg-count-accent";
  const textClass = isOut ? "text-outs" : "text-count-accent";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl border p-1.5 shadow-sm",
        isOut ? "border-destructive/30 bg-destructive/10" : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "text-sm font-black uppercase tracking-[0.14em]",
          isOut ? textClass : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <div className="relative flex items-center justify-center">
        <span
          className={cn("text-5xl font-black tabular-nums", isOut ? textClass : "text-foreground")}
        >
          {value}
        </span>
        {badge && (
          <span
            role="status"
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1 text-sm font-black uppercase tracking-widest text-white shadow-lg",
              badgeTone === "red" ? "bg-destructive" : "bg-emerald-600",
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Indicator dots */}
      <div className="flex items-center justify-center gap-1 py-0.5">
        {Array.from({ length: dotCount }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full border transition-colors",
              i < value
                ? cn(accentClass, "border-transparent")
                : "border-muted-foreground/50 bg-background",
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <button
          type="button"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-40",
            isOut
              ? "bg-destructive/20 text-outs active:bg-destructive/30"
              : "bg-muted text-foreground active:bg-muted/70",
          )}
          onClick={onRemove}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-5 w-5" strokeWidth={3} />
        </button>
        <button
          type="button"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-40",
            isOut
              ? "bg-outs text-destructive-foreground shadow-destructive/20 active:bg-destructive/90"
              : "bg-primary text-primary-foreground active:bg-primary/90",
          )}
          onClick={onAdd}
          disabled={disabled || isAtMax}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
