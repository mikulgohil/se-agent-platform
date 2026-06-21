import Link from "next/link";
import type { WorkflowSummary } from "@/lib/store";
import { WorkflowStatusBadge, RiskBadge } from "@/components/domain/status";
import { ScoreBar } from "@/components/domain/score-ring";
import { IconChevronRight } from "@/components/ui/icons";
import { formatCost, formatDuration, formatCompact, timeAgo } from "@/lib/utils";

const FRAMEWORK_LABEL: Record<string, string> = {
  nextjs: "Next.js",
  react: "React",
  node: "Node",
  typescript: "TypeScript",
};

export function WorkflowRow({ wf, now }: { wf: WorkflowSummary; now: number }) {
  return (
    <Link
      href={`/workflows/${wf.id}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-elevated sm:grid-cols-[minmax(0,1fr)_120px_140px_24px]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-fg">{wf.title}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
          <span className="rounded bg-overlay px-1.5 py-0.5 text-fg-muted">
            {FRAMEWORK_LABEL[wf.framework] ?? wf.framework}
          </span>
          <RiskBadge risk={wf.riskLevel} />
          <span>·</span>
          <span>{timeAgo(wf.createdAt, now)}</span>
          <span>·</span>
          <span className="tabular-nums">{formatCompact(wf.tokensEstimate)} tok</span>
          <span>·</span>
          <span className="tabular-nums">{formatCost(wf.estimatedCost)}</span>
          <span>·</span>
          <span className="tabular-nums">{formatDuration(wf.durationMs)}</span>
        </div>
      </div>

      <div className="hidden sm:block">
        <WorkflowStatusBadge status={wf.status} />
      </div>

      <div className="hidden sm:block">
        {wf.status === "failed" ? (
          <span className="text-xs text-fg-subtle">—</span>
        ) : (
          <ScoreBar score={wf.qualityScore} />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-0">
        <span className="sm:hidden">
          <WorkflowStatusBadge status={wf.status} />
        </span>
        <IconChevronRight className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
