import type { Metadata } from "next";
import { getRepository } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { ScoreRing } from "@/components/domain/score-ring";
import { WorkflowRow } from "@/components/domain/workflow-row";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { MiniAreaChart, MiniBarChart } from "@/components/ui/charts";
import { AGENT_META } from "@/lib/engineering-agent/agents";
import type { AgentName } from "@/lib/engineering-agent/types";
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
  const [metrics, activity, tokensByAgent] = await Promise.all([
    repo.getDashboardMetrics(),
    repo.getActivitySeries(14),
    repo.getTokensByAgent(),
  ]);
  const now = serverNow();

  const runsSeries = activity.map((p) => p.runs);
  const qualitySeries = activity.map((p) => p.avgQuality);
  const costSeries = activity.map((p) => p.cost);

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
          series={runsSeries}
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

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Activity</CardTitle>
            <span className="text-xs text-fg-subtle">runs / day · last 14 days</span>
          </CardHeader>
          <CardBody>
            <MiniAreaChart
              values={runsSeries}
              labels={activity.map((p) => p.label)}
              valueFormat={(v) => `${v} runs`}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
              <span>
                Avg quality trend:{" "}
                <span className="text-fg-muted tabular-nums">
                  {qualitySeries[0]} → {qualitySeries[qualitySeries.length - 1]}
                </span>
              </span>
              <span>
                Spend trend:{" "}
                <span className="text-fg-muted tabular-nums">
                  {formatCost(costSeries.reduce((a, b) => a + b, 0))} total
                </span>
              </span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Tokens by agent</CardTitle>
            <span className="text-xs text-fg-subtle">all runs</span>
          </CardHeader>
          <CardBody>
            {tokensByAgent.length === 0 ? (
              <p className="text-sm text-fg-muted">No runs yet.</p>
            ) : (
              <MiniBarChart
                data={tokensByAgent.map((t) => ({
                  label: AGENT_META[t.agent as AgentName].label,
                  value: t.tokens,
                  color: AGENT_META[t.agent as AgentName].colorVar,
                }))}
                valueFormat={(v) => `${(v / 1000).toFixed(1)}k`}
              />
            )}
          </CardBody>
        </Card>
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
