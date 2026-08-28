import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const TEAM_COLORS = [
  { name: "None", value: "" },
  { name: "Red", value: "#dc2626" },
  { name: "Coral", value: "#f43f5e" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#facc15" },
  { name: "Lime", value: "#84cc16" },
  { name: "Green", value: "#16a34a" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#0d9488" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Fuchsia", value: "#c026d3" },
  { name: "Pink", value: "#db2777" },
  { name: "Rose", value: "#fb7185" },
  { name: "Maroon", value: "#7f1d1d" },
  { name: "Brown", value: "#92400e" },
  { name: "Black", value: "#111827" },
  { name: "Gray", value: "#6b7280" },
  { name: "Slate", value: "#475569" },
  { name: "White", value: "#f8fafc" },
] as const;

/** Pick black or white text for readable contrast on the given hex color. */
export function readableText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return l > 0.45 ? "#0f172a" : "#ffffff";
}

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
  const [nameHeight, setNameHeight] = useState<number | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fg = color ? readableText(color) : undefined;
  const cardStyle = color ? { backgroundColor: color, color: fg, borderColor: color } : undefined;
  const displayName = name || label;

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    setNameHeight(el.scrollHeight);
  };

  useEffect(() => {
    adjustHeight();
  }, [name]);

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
          ref={textareaRef}
          id={`team-name-${label}`}
          value={name}
          onChange={(e) => {
            onNameChange(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          rows={1}
          style={{ height: nameHeight }}
          className="w-full min-w-0 resize-none overflow-hidden rounded-md border-0 bg-transparent py-0.5 text-center text-xs font-extrabold uppercase leading-tight tracking-wider outline-none placeholder:opacity-60 focus-visible:ring-1 focus-visible:ring-current"
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
