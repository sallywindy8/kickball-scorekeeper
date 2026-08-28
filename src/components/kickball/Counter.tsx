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
}: CounterProps) {
  const isAtMax = max !== undefined && value >= max;
  const isOut = variant === "out";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-center rounded-3xl border p-2 shadow-sm",
        isOut ? "border-red-200 bg-red-50" : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "text-sm font-black uppercase tracking-[0.14em]",
          isOut ? "text-red-600" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-4xl font-black tabular-nums",
          isOut ? "text-red-600" : "text-foreground",
        )}
      >
        {value}
      </span>
      {badge && (
        <span
          role="status"
          className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-md"
        >
          {badge}
        </span>
      )}
      <div className="flex justify-center gap-2 pt-1">
        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-40",
            isOut
              ? "bg-red-100 text-red-600 active:bg-red-200"
              : "bg-muted text-foreground active:bg-muted/70",
          )}
          onClick={onRemove}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-40",
            isOut
              ? "bg-red-600 text-white shadow-red-200 active:bg-red-700"
              : "bg-primary text-primary-foreground active:bg-primary/90",
          )}
          onClick={onAdd}
          disabled={disabled || isAtMax}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
