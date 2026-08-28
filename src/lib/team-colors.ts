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
