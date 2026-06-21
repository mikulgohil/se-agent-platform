import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRepository } from "@/lib/store";
import { retryWorkflowAction } from "@/lib/actions";
import { findOutput } from "@/lib/engineering-agent/agents/shared";
import { durationMsOf } from "@/lib/store/repository";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  WorkflowStatusBadge,
  RiskBadge,
} from "@/components/domain/status";
import { ScoreRing } from "@/components/domain/score-ring";
import { StepTimeline } from "@/components/domain/step-timeline";
import { QualityGatesPanel } from "@/components/domain/quality-gates-panel";
import { LogsPanel } from "@/components/domain/logs-panel";
import { ApprovalPanel, ApprovalOutcome } from "@/components/domain/approval-panel";
import { IconArrowRight, IconArtifact } from "@/components/ui/icons";
import { formatCost, formatCompact, formatDuration } from "@/lib/utils";

const FRAMEWORK_LABEL: Record<string, string> = {
  nextjs: "Next.js",
  react: "React",
  node: "Node",
  typescript: "TypeScript",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const repo = await getRepository();
  const detail = await repo.getWorkflowDetail(id);
  return { title: detail ? detail.request.title : "Workflow" };
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = await getRepository();
  const detail = await repo.getWorkflowDetail(id);
  if (!detail) notFound();

  const { workflow, request, steps, gates, logs, artifact } = detail;
  const duration = durationMsOf(workflow.startedAt, workflow.completedAt);
  const outputs = steps
    .map((s) => s.output)
    .filter((o): o is NonNullable<typeof o> => o !== null);
  const prSummary = findOutput(outputs, "pr_summary");

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="mb-2 text-sm text-fg-subtle">
        <Link href="/workflows" className="hover:text-fg">
          Workflows
        </Link>{" "}
        <span className="px-1">/</span>
        <span className="text-fg-muted">{workflow.id}</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">
            {request.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WorkflowStatusBadge status={workflow.status} />
            <Badge tone="neutral">
              {FRAMEWORK_LABEL[request.framework] ?? request.framework}
            </Badge>
            <Badge tone="neutral">{request.complexity}</Badge>
            <RiskBadge risk={request.riskLevel} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {artifact ? (
            <ButtonLink href={`/artifacts/${artifact.id}`} variant="secondary" size="sm">
              <IconArtifact width={15} height={15} />
              PR artifact
            </ButtonLink>
          ) : null}
          {workflow.status === "failed" ? (
            <form action={retryWorkflowAction}>
              <input type="hidden" name="workflowId" value={workflow.id} />
              <SubmitButton size="sm" pendingLabel="Retrying…">
                Retry run
                <IconArrowRight width={14} height={14} />
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      {/* Observability strip */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <Card className="flex items-center gap-3 p-4">
          <ScoreRing score={workflow.qualityScore} size={56} />
          <div className="text-xs text-fg-subtle">
            Quality
            <br />
            score
          </div>
        </Card>
        <Metric label="Duration" value={formatDuration(duration)} />
        <Metric label="Tokens" value={`${formatCompact(workflow.tokensEstimate)}`} />
        <Metric label="Est. cost" value={formatCost(workflow.estimatedCost)} />
        <Metric
          label="Steps"
          value={`${steps.filter((s) => s.status === "succeeded").length}/${steps.length}`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Request</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm leading-relaxed text-fg-muted">
                {request.description}
              </p>
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  Acceptance criteria
                </div>
                <ul className="space-y-1.5">
                  {request.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-fg-muted">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Agent timeline</CardTitle>
              <span className="text-xs text-fg-subtle">
                4 agents · {steps.length} steps
              </span>
            </CardHeader>
            <CardBody>
              <StepTimeline steps={steps} />
            </CardBody>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {workflow.status === "awaiting_approval" ? (
            <ApprovalPanel
              workflowId={workflow.id}
              recommendation={prSummary?.recommendation ?? null}
              confidence={prSummary?.confidence ?? null}
            />
          ) : null}

          {workflow.approval ? (
            <ApprovalOutcome
              approved={workflow.approval.approved}
              note={workflow.approval.note}
              decidedBy={workflow.approval.decidedBy}
              artifact={artifact}
            />
          ) : null}

          {gates.length > 0 ? <QualityGatesPanel gates={gates} /> : null}

          <LogsPanel logs={logs} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-fg-subtle">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-fg">{value}</div>
    </Card>
  );
}
