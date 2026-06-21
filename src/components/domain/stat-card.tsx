import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: "default" | "success" | "warning" | "danger" | "info";
}

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
}: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </span>
        {Icon ? <Icon className={cn("h-4 w-4", accentText[accent])} /> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-fg">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-fg-muted">{hint}</div> : null}
    </Card>
  );
}
