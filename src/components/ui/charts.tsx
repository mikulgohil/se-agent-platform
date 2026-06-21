/**
 * Zero-dependency SVG charts. Small, server-renderable (no client JS), and
 * styled with design tokens. Sized via viewBox so they scale to any container.
 */

function buildPath(values: number[], width: number, height: number, pad = 1) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(values.length - 1, 1);
  return values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return { x, y };
  });
}

function toLine(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** CSS color (token var) for the line + fill. */
  color?: string;
  className?: string;
}

/** A tiny trend line with a soft gradient fill — for metric cards. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  color = "var(--color-accent)",
  className,
}: SparklineProps) {
  if (values.length === 0) return null;
  const pts = buildPath(values, width, height);
  const line = toLine(pts);
  const area = `${line} L${pts[pts.length - 1].x.toFixed(2)} ${height} L${pts[0].x.toFixed(2)} ${height} Z`;
  const gid = `spark-${values.length}-${Math.round(values[0])}-${Math.round(values[values.length - 1])}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface AreaChartProps {
  values: number[];
  labels?: string[];
  height?: number;
  color?: string;
  valueFormat?: (v: number) => string;
}

/** A labelled area chart with a baseline grid — for the analytics strip. */
export function MiniAreaChart({
  values,
  labels,
  height = 140,
  color = "var(--color-accent)",
  valueFormat,
}: AreaChartProps) {
  const width = 600;
  const pad = 6;
  const pts = buildPath(values, width, height - 18, pad);
  const line = toLine(pts);
  const area = `${line} L${pts[pts.length - 1].x.toFixed(2)} ${height - 18} L${pts[0].x.toFixed(2)} ${height - 18} Z`;
  const max = Math.max(...values, 1);
  const maxIdx = values.indexOf(max);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={width - pad}
          y1={(height - 18) * f}
          y2={(height - 18) * f}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#area-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* peak marker */}
      {maxIdx >= 0 ? (
        <g>
          <circle cx={pts[maxIdx].x} cy={pts[maxIdx].y} r="3" fill={color} />
          <text
            x={Math.min(pts[maxIdx].x, width - 40)}
            y={Math.max(pts[maxIdx].y - 8, 12)}
            fill="var(--color-fg-muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {valueFormat ? valueFormat(max) : max}
          </text>
        </g>
      ) : null}
      {labels ? (
        <g>
          {[0, Math.floor(labels.length / 2), labels.length - 1].map((i) => (
            <text
              key={i}
              x={pad + (i / Math.max(labels.length - 1, 1)) * (width - pad * 2)}
              y={height - 4}
              fill="var(--color-fg-subtle)"
              fontSize="10"
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
            >
              {labels[i]}
            </text>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  valueFormat?: (v: number) => string;
}

/** Horizontal bar chart — for "tokens by agent" style breakdowns. */
export function MiniBarChart({ data, valueFormat }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-fg-muted">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line-strong">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color ?? "var(--color-accent)",
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-fg-muted">
            {valueFormat ? valueFormat(d.value) : d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
