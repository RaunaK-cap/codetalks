import { FileUser } from "lucide-react";
import { GithubIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

/* Score out of 5 as a thin bar. Weak scores (<=2) get a hatched fill so they read without colour. */
export function ScoreBar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]", className)}>
      <span
        className={cn(
          "block h-full rounded-full",
          value <= 2
            ? "bg-[repeating-linear-gradient(135deg,var(--foreground)_0_2px,transparent_2px_4px)]"
            : "bg-foreground",
        )}
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </span>
  );
}

/* Five small pips, used inside dense rows. */
export function ScorePips({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn("size-1.5 rounded-full", n <= value ? "bg-foreground" : "bg-foreground/[0.1]")}
        />
      ))}
    </span>
  );
}

export function ScoreNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {value.toFixed(1)}
      <span className="text-muted-foreground">/5</span>
    </span>
  );
}

/* Tiny line chart for overall score over time. Values 1..5, oldest first. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 240;
  const h = 64;
  const pad = 6;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
    const y = h - pad - ((v - 1) / 4) * (h - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${d} L${pts.at(-1)![0]},${h} L${pts[0]![0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-16 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === pts.length - 1 ? 3 : 2}
          className={i === pts.length - 1 ? "fill-live" : "fill-foreground"}
        />
      ))}
    </svg>
  );
}

export function SourceIcon({ kind, className }: { kind: "github" | "linkedin"; className?: string }) {
  const c = cn("size-3.5", className);
  return kind === "github" ? <GithubIcon className={c} /> : <FileUser className={c} />;
}
