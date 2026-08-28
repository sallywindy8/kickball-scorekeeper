import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CounterProps {
  label: string;
  value: number;
  onAdd: () => void;
  onRemove: () => void;
  max?: number;
  disabled?: boolean;
  variant?: "default" | "outline" | "foul" | "out";
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

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border-2 border-primary text-primary hover:bg-primary/10",
    foul: "bg-amber-500 text-white hover:bg-amber-600",
    out: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-base font-bold uppercase tracking-wider text-foreground">
        {label}
      </span>
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-2xl text-5xl font-bold shadow-sm",
          variant === "foul" && "bg-amber-500/10 text-amber-600",
          variant === "out" && "bg-destructive/10 text-destructive",
          variant !== "foul" && variant !== "out" && "bg-card text-foreground",
        )}
      >
        {value}
        {badge && (
          <span
            role="status"
            className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-primary px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-md"
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-14 w-14 rounded-full text-2xl", variantClasses[variant])}
          onClick={onRemove}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-6 w-6" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-14 w-14 rounded-full text-2xl", variantClasses[variant])}
          onClick={onAdd}
          disabled={disabled || isAtMax}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
