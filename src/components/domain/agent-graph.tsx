import type { AgentName, StepStatus, WorkflowStep } from "@/lib/engineering-agent/types";
import { AGENT_META, AGENTS } from "@/lib/engineering-agent/agents";
import { IconArrowRight } from "@/components/ui/icons";

type NodeStatus = "succeeded" | "running" | "failed" | "skipped" | "pending";

function aggregate(statuses: StepStatus[]): NodeStatus {
  if (statuses.some((s) => s === "failed")) return "failed";
  if (statuses.some((s) => s === "running")) return "running";
  if (statuses.length > 0 && statuses.every((s) => s === "succeeded")) return "succeeded";
  if (statuses.length > 0 && statuses.every((s) => s === "skipped")) return "skipped";
  return "pending";
}

const DOT: Record<NodeStatus, string> = {
  succeeded: "bg-success",
  running: "bg-info animate-status-pulse",
  failed: "bg-danger",
  skipped: "bg-fg-subtle",
  pending: "bg-line-strong",
};

const RING: Record<NodeStatus, string> = {
  succeeded: "border-success/40",
  running: "border-info/50",
  failed: "border-danger/50",
  skipped: "border-line",
  pending: "border-line",
};

const AGENT_ACCENT: Record<AgentName, string> = {
  planner: "bg-agent-planner",
  code: "bg-agent-code",
  qa: "bg-agent-qa",
  review: "bg-agent-review",
};

/**
 * Agent dependency graph (the LangGraph-Studio metaphor) for the fixed
 * Planner → Code → QA → Review pipeline. Each node aggregates the status of the
 * steps its agent owns. Hand-rendered (no React Flow dependency).
 */
export function AgentGraph({ steps }: { steps: WorkflowStep[] }) {
  const order: AgentName[] = AGENTS.map((a) => a.name);

  const nodes = order.map((agent) => {
    const own = steps.filter((s) => s.agentName === agent);
    const status = aggregate(own.map((s) => s.status));
    const done = own.filter((s) => s.status === "succeeded").length;
    return { agent, status, done, total: own.length };
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {nodes.map((node, i) => (
        <div key={node.agent} className="flex flex-1 items-center gap-3">
          <div
            className={`relative flex-1 rounded-lg border bg-elevated p-3 ${RING[node.status]}`}
          >
            <span
              className={`absolute inset-x-0 top-0 h-0.5 rounded-t-lg ${AGENT_ACCENT[node.agent]}`}
              aria-hidden
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-fg">
                {AGENT_META[node.agent].label}
              </span>
              <span className={`h-2 w-2 rounded-full ${DOT[node.status]}`} aria-hidden />
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-fg-subtle">
              {AGENT_META[node.agent].role}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              {Array.from({ length: node.total }).map((_, j) => (
                <span
                  key={j}
                  className={`h-1.5 flex-1 rounded-full ${
                    j < node.done ? AGENT_ACCENT[node.agent] : "bg-line-strong"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
            <div className="mt-1.5 text-[10px] tabular-nums text-fg-subtle">
              {node.done}/{node.total} steps
            </div>
          </div>

          {i < nodes.length - 1 ? (
            <IconArrowRight
              className="hidden shrink-0 text-fg-subtle sm:block"
              width={16}
              height={16}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
