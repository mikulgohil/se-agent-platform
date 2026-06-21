import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/charts";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: "default" | "success" | "warning" | "danger" | "info";
  /** Optional trend series rendered as a sparkline in the corner. */
  series?: number[];
}

const accentColor: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
};

const accentText: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "text-fg-subtle",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
  series,
}: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </span>
        {Icon ? <Icon className={cn("h-4 w-4", accentText[accent])} /> : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold tracking-tight tabular-nums text-fg">
          {value}
        </div>
        {series && series.length > 1 ? (
          <Sparkline values={series} color={accentColor[accent]} />
        ) : null}
      </div>
      {hint ? <div className="mt-1 text-xs text-fg-muted">{hint}</div> : null}
    </Card>
  );
}
