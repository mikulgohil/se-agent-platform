import type { Metadata } from "next";
import { getRepository } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { ScoreRing } from "@/components/domain/score-ring";
import { WorkflowRow } from "@/components/domain/workflow-row";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import {
  IconWorkflows,
  IconCheck,
  IconX,
  IconClock,
  IconArrowRight,
} from "@/components/ui/icons";
import { formatCost, formatDuration } from "@/lib/utils";
import { serverNow } from "@/lib/server-time";

export const metadata: Metadata = { title: "Dashboard" };

// Reads the live in-memory store, which mutates as workflows are created/approved.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const repo = await getRepository();
  const metrics = await repo.getDashboardMetrics();
  const now = serverNow();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational view across every agent workflow — throughput, quality, and cost."
        actions={
          <ButtonLink href="/requests/new" size="sm">
            New request
            <IconArrowRight width={14} height={14} />
          </ButtonLink>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total workflows"
          value={String(metrics.total)}
          icon={IconWorkflows}
          hint={`${metrics.running} running`}
        />
        <StatCard
          label="Completed"
          value={String(metrics.completed)}
          icon={IconCheck}
          accent="success"
        />
        <StatCard
          label="Awaiting approval"
          value={String(metrics.awaitingApproval)}
          icon={IconClock}
          accent="warning"
          hint="needs a human decision"
        />
        <StatCard
          label="Failed"
          value={String(metrics.failed)}
          icon={IconX}
          accent="danger"
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 p-5">
          <ScoreRing score={metrics.avgQualityScore ?? 0} label="avg" />
          <div>
            <div className="text-sm font-medium text-fg">Average quality score</div>
            <p className="mt-1 text-sm text-fg-muted">
              Weighted mean across the six quality gates for scored runs.
            </p>
          </div>
        </Card>
        <StatCard
          label="Avg run duration"
          value={formatDuration(metrics.avgDurationMs)}
          icon={IconClock}
          hint="planning → PR summary"
        />
        <StatCard
          label="Total est. cost"
          value={formatCost(metrics.totalCost)}
          hint="across all runs (mock pricing)"
        />
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Recent workflows</CardTitle>
            <ButtonLink href="/workflows" variant="ghost" size="sm">
              View all
              <IconArrowRight width={14} height={14} />
            </ButtonLink>
          </CardHeader>
          {metrics.recent.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-fg-muted">
              No workflows yet.{" "}
              <a href="/requests/new" className="text-accent hover:underline">
                Create the first request
              </a>
              .
            </div>
          ) : (
            <div>
              {metrics.recent.map((wf) => (
                <WorkflowRow key={wf.id} wf={wf} now={now} />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
