import type {
  AgentName,
  GateStatus,
  RiskLevel,
  StepStatus,
  WorkflowStatus,
} from "@/lib/engineering-agent/types";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { AGENT_META } from "@/lib/engineering-agent/agents";
import { cn } from "@/lib/utils";

const WORKFLOW_TONE: Record<WorkflowStatus, { tone: BadgeTone; label: string }> = {
  queued: { tone: "neutral", label: "Queued" },
  running: { tone: "info", label: "Running" },
  awaiting_approval: { tone: "warning", label: "Awaiting approval" },
  approved: { tone: "success", label: "Approved" },
  completed: { tone: "success", label: "Completed" },
  failed: { tone: "danger", label: "Failed" },
  rejected: { tone: "danger", label: "Rejected" },
};

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const { tone, label } = WORKFLOW_TONE[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const STEP_TONE: Record<StepStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  running: { tone: "info", label: "Running" },
  succeeded: { tone: "success", label: "Succeeded" },
  failed: { tone: "danger", label: "Failed" },
  skipped: { tone: "neutral", label: "Skipped" },
};

export function StepStatusBadge({ status }: { status: StepStatus }) {
  const { tone, label } = STEP_TONE[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const GATE_TONE: Record<GateStatus, BadgeTone> = {
  passed: "success",
  warning: "warning",
  failed: "danger",
};

export function GateStatusBadge({ status }: { status: GateStatus }) {
  return <Badge tone={GATE_TONE[status]}>{status}</Badge>;
}

const RISK_TONE: Record<RiskLevel, BadgeTone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <Badge tone={RISK_TONE[risk]}>{risk} risk</Badge>;
}

const AGENT_DOT: Record<AgentName, string> = {
  planner: "bg-agent-planner",
  code: "bg-agent-code",
  qa: "bg-agent-qa",
  review: "bg-agent-review",
};

export function AgentChip({
  agent,
  className,
}: {
  agent: AgentName;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line bg-overlay px-2 py-0.5 text-xs font-medium text-fg-muted",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", AGENT_DOT[agent])} aria-hidden />
      {AGENT_META[agent].label}
    </span>
  );
}
