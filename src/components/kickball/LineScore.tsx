import { MAX_INNINGS, total, type Team } from "@/hooks/useKickballGame";
import { cn } from "@/lib/utils";

interface LineScoreProps {
  awayName: string;
  homeName: string;
  awayRuns: number[];
  homeRuns: number[];
  inning: number;
  halfInning: "top" | "bottom";
  onCellChange: (team: Team, inningIndex: number, value: number) => void;
}

export function LineScore({
  awayName,
  homeName,
  awayRuns,
  homeRuns,
  inning,
  halfInning,
  onCellChange,
}: LineScoreProps) {
  const rows: { team: Team; name: string; runs: number[]; active: boolean }[] = [
    { team: "away", name: awayName || "Away", runs: awayRuns, active: halfInning === "top" },
    { team: "home", name: homeName || "Home", runs: homeRuns, active: halfInning === "bottom" },
  ];

  return (
    <table className="w-full table-fixed border-collapse overflow-hidden rounded-xl text-center text-[11px] font-bold tabular-nums">
      <thead>
        <tr className="bg-muted text-muted-foreground">
          <th className="w-[22%] truncate px-1 py-0.5 text-left text-[10px] font-black uppercase tracking-wider" />
          {Array.from({ length: MAX_INNINGS }, (_, i) => (
            <th key={i} className="px-0 py-0.5 font-black">
              {i + 1}
            </th>
          ))}
          <th className="px-0 py-0.5 font-black uppercase">R</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.team} className="border-t border-border">
            <td className="max-w-0 truncate px-1 py-0.5 text-left text-[10px] font-black uppercase tracking-wide">
              {row.name}
            </td>
            {row.runs.map((runs, i) => (
              <td
                key={i}
                className={cn(
                  "p-0",
                  row.active && i === inning - 1 && "bg-primary/10 ring-1 ring-inset ring-primary",
                )}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={runs}
                  onChange={(e) => onCellChange(row.team, i, Number(e.target.value))}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label={`${row.name} runs in inning ${i + 1}`}
                  className="h-6 w-full [appearance:textfield] border-0 bg-transparent text-center text-[11px] font-bold outline-none focus-visible:ring-1 focus-visible:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </td>
            ))}
            <td className="bg-muted/60 px-0 py-0.5 text-[12px] font-black">{total(row.runs)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
