import type { WorkflowStep } from "@/lib/engineering-agent/types";
import { AgentChip } from "@/components/domain/status";
import { StepOutputView } from "@/components/domain/step-output";
import {
  IconCheck,
  IconX,
  IconClock,
  IconSpinner,
  IconChevronRight,
} from "@/components/ui/icons";
import { formatCost, formatCompact, formatDuration } from "@/lib/utils";
import { durationMsOf } from "@/lib/store/repository";

function StepIcon({ status }: { status: WorkflowStep["status"] }) {
  switch (status) {
    case "succeeded":
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-success/40 bg-success-bg text-success">
          <IconCheck width={15} height={15} />
        </span>
      );
    case "failed":
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-danger/40 bg-danger-bg text-danger">
          <IconX width={15} height={15} />
        </span>
      );
    case "running":
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-info/40 bg-info-bg text-info">
          <IconSpinner className="animate-spin" width={15} height={15} />
        </span>
      );
    case "skipped":
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-overlay text-fg-subtle">
          –
        </span>
      );
    default:
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-overlay text-fg-subtle">
          <IconClock width={14} height={14} />
        </span>
      );
  }
}

export function StepTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const duration = durationMsOf(step.startedAt, step.completedAt);
        const isLast = i === steps.length - 1;
        const expandable = step.output !== null || step.error !== null;
        return (
          <li key={step.id} className="relative flex gap-3.5 pb-1">
            {/* connector */}
            {!isLast ? (
              <span
                className="absolute left-[13px] top-8 h-[calc(100%-1rem)] w-px bg-line"
                aria-hidden
              />
            ) : null}
            <div className="z-[1] shrink-0 pt-0.5">
              <StepIcon status={step.status} />
            </div>

            <div className="min-w-0 flex-1 pb-4">
              <details className="group" open={step.status === "failed"}>
                <summary
                  className={`flex cursor-pointer list-none items-start justify-between gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                    expandable ? "hover:bg-elevated" : "cursor-default"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-fg">{step.name}</span>
                      <AgentChip agent={step.agentName} />
                      {step.attempts > 1 ? (
                        <span className="text-xs text-warning">
                          retried ×{step.attempts - 1}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {step.output?.summary ?? step.error ?? step.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-fg-subtle">
                    {step.status === "succeeded" ? (
                      <>
                        <span title="duration">{formatDuration(duration)}</span>
                        <span title="tokens">{formatCompact(step.tokensEstimate)} tok</span>
                        <span title="cost">{formatCost(step.costEstimate)}</span>
                      </>
                    ) : null}
                    {expandable ? (
                      <IconChevronRight
                        className="text-fg-subtle transition-transform group-open:rotate-90"
                        width={15}
                        height={15}
                      />
                    ) : null}
                  </div>
                </summary>

                {expandable ? (
                  <div className="mt-2 rounded-md border border-line bg-surface p-4">
                    {step.error ? (
                      <p className="text-sm text-danger">{step.error}</p>
                    ) : step.output ? (
                      <StepOutputView output={step.output} />
                    ) : null}
                  </div>
                ) : null}
              </details>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
