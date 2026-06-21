import { cn } from "@/lib/utils";

interface ScoreRingProps {
  /** 0–100 */
  score: number;
  size?: number;
  label?: string;
}

function colorFor(score: number): string {
  if (score >= 80) return "var(--color-success)";
  if (score >= 60) return "var(--color-warning)";
  return "var(--color-danger)";
}

/** Circular quality-score gauge rendered as inline SVG (no JS, no deps). */
export function ScoreRing({ score, size = 96, label }: ScoreRingProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;
  const color = colorFor(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Quality score ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-fg">{clamped}</span>
        {label ? (
          <span className="text-[10px] uppercase tracking-wide text-fg-subtle">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Horizontal score bar for compact contexts (gate rows, lists). */
export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-strong">
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, background: colorFor(clamped) }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-fg-muted">
        {clamped}
      </span>
    </div>
  );
}
