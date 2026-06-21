import type { AgentName, WorkflowStep } from "@/lib/engineering-agent/types";
import { AGENT_META } from "@/lib/engineering-agent/agents";
import { formatDuration } from "@/lib/utils";

const AGENT_BAR: Record<AgentName, string> = {
  planner: "bg-agent-planner",
  code: "bg-agent-code",
  qa: "bg-agent-qa",
  review: "bg-agent-review",
};

/**
 * Horizontal span waterfall (the LangSmith/Phoenix trace look). Each step is a
 * bar positioned on a shared time axis, proportional to its duration. Pure
 * server component — layout math only, no client JS.
 */
export function Waterfall({ steps }: { steps: WorkflowStep[] }) {
  const timed = steps
    .filter((s) => s.startedAt && s.completedAt)
    .map((s) => ({
      step: s,
      start: new Date(s.startedAt as string).getTime(),
      end: new Date(s.completedAt as string).getTime(),
    }));

  if (timed.length === 0) {
    return (
      <p className="px-1 py-4 text-sm text-fg-subtle">
        No timing data yet — run the workflow to populate the trace.
      </p>
    );
  }

  const minStart = Math.min(...timed.map((t) => t.start));
  const maxEnd = Math.max(...timed.map((t) => t.end));
  const total = Math.max(maxEnd - minStart, 1);
  const timedIds = new Set(timed.map((t) => t.step.id));

  return (
    <div className="space-y-px">
      {/* axis */}
      <div className="mb-2 flex justify-between text-[10px] tabular-nums text-fg-subtle">
        <span>0ms</span>
        <span>{formatDuration(total / 2)}</span>
        <span>{formatDuration(total)}</span>
      </div>

      {steps.map((s) => {
        const t = timed.find((x) => x.step.id === s.id);
        const left = t ? ((t.start - minStart) / total) * 100 : 0;
        const width = t ? Math.max(((t.end - t.start) / total) * 100, 1.2) : 0;
        const failed = s.status === "failed";
        const inactive = !timedIds.has(s.id);

        return (
          <div
            key={s.id}
            className="grid grid-cols-[150px_1fr_56px] items-center gap-3 rounded-md px-1 py-1 hover:bg-elevated"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${inactive ? "bg-line-strong" : AGENT_BAR[s.agentName]}`}
                title={AGENT_META[s.agentName].label}
                aria-hidden
              />
              <span className="truncate text-xs text-fg-muted" title={s.name}>
                {s.name}
              </span>
            </div>

            <div className="relative h-5 rounded bg-inset">
              {inactive ? (
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-[10px] text-fg-subtle">
                  {s.status}
                </div>
              ) : (
                <div
                  className={`absolute inset-y-0.5 rounded ${failed ? "bg-danger" : AGENT_BAR[s.agentName]} ${failed ? "" : "opacity-90"}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${s.name} · ${formatDuration(t ? t.end - t.start : 0)}`}
                />
              )}
            </div>

            <span className="text-right text-[11px] tabular-nums text-fg-subtle">
              {t ? formatDuration(t.end - t.start) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
