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
  const fillColor = isOut ? "bg-red-600" : "bg-red-600";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-1 rounded-3xl border p-2 shadow-sm",
        isOut ? "border-red-200 bg-red-50" : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "text-base font-black uppercase tracking-[0.14em]",
          isOut ? "text-red-600" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            "text-5xl font-black tabular-nums",
            isOut ? "text-red-600" : "text-foreground",
          )}
        >
          {value}
        </span>
        {badge && (
          <span
            role="status"
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1 text-sm font-black uppercase tracking-widest text-white shadow-lg",
              badgeTone === "red" ? "bg-red-600" : "bg-green-600",
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Indicator dots */}
      <div className="flex items-center justify-center gap-1.5 py-0.5">
        {Array.from({ length: dotCount }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full border transition-colors",
              i < value
                ? cn(fillColor, "border-transparent")
                : "border-gray-400 bg-white",
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors disabled:opacity-40",
            isOut
              ? "bg-red-100 text-red-600 active:bg-red-200"
              : "bg-muted text-foreground active:bg-muted/70",
          )}
          onClick={onRemove}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-6 w-6" strokeWidth={3} />
        </button>
        <button
          type="button"
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-40",
            isOut
              ? "bg-red-600 text-white shadow-red-200 active:bg-red-700"
              : "bg-primary text-primary-foreground active:bg-primary/90",
          )}
          onClick={onAdd}
          disabled={disabled || isAtMax}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
