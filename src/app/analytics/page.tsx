import type { Metadata } from "next";
import { getRepository } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { MiniAreaChart } from "@/components/ui/charts";
import { ScoreBar } from "@/components/domain/score-ring";
import { Badge } from "@/components/ui/badge";
import { IconBeaker, IconCheck, IconGauge } from "@/components/ui/icons";
import { formatCost } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics & evals" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const repo = await getRepository();
  const [evals, activity, metrics] = await Promise.all([
    repo.getEvalSummary(),
    repo.getActivitySeries(14),
    repo.getDashboardMetrics(),
  ]);

  return (
    <div>
      <PageHeader
        title="Analytics & evals"
        description="Treats each quality gate as an evaluator. Track score trends, pass rates, and spend across every run."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Scored runs" value={String(evals.scoredRuns)} icon={IconBeaker} />
        <StatCard
          label="Avg quality"
          value={evals.avgQuality != null ? String(evals.avgQuality) : "—"}
          icon={IconGauge}
          accent="success"
        />
        <StatCard
          label="Overall pass rate"
          value={evals.overallPassRate != null ? `${evals.overallPassRate}%` : "—"}
          icon={IconCheck}
          accent="success"
        />
        <StatCard label="Total spend" value={formatCost(metrics.totalCost)} hint="mock pricing" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Quality score over runs</CardTitle>
            <span className="text-xs text-fg-subtle">{evals.trend.length} scored</span>
          </CardHeader>
          <CardBody>
            {evals.trend.length > 1 ? (
              <MiniAreaChart
                values={evals.trend.map((t) => t.score)}
                labels={evals.trend.map((t) => t.label)}
                color="var(--color-success)"
                valueFormat={(v) => `${v}`}
              />
            ) : (
              <p className="py-8 text-center text-sm text-fg-subtle">
                Need at least two scored runs to chart a trend.
              </p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Spend per day</CardTitle>
            <span className="text-xs text-fg-subtle">last 14 days</span>
          </CardHeader>
          <CardBody>
            <MiniAreaChart
              values={activity.map((p) => p.cost)}
              labels={activity.map((p) => p.label)}
              color="var(--color-info)"
              valueFormat={(v) => formatCost(v)}
            />
          </CardBody>
        </Card>
      </section>

      <section className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Evaluators</CardTitle>
            <span className="text-xs text-fg-subtle">quality gates across all runs</span>
          </CardHeader>
          {evals.gates.length === 0 ? (
            <CardBody>
              <p className="text-sm text-fg-muted">No scored runs yet.</p>
            </CardBody>
          ) : (
            <div>
              <div className="hidden grid-cols-[minmax(0,1.4fr)_120px_1fr_90px] gap-4 border-b border-line px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-fg-subtle sm:grid">
                <span>Evaluator</span>
                <span>Outcomes</span>
                <span>Avg score</span>
                <span className="text-right">Pass rate</span>
              </div>
              {evals.gates.map((g) => (
                <div
                  key={g.name}
                  className="grid grid-cols-1 gap-3 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_120px_1fr_90px] sm:items-center"
                >
                  <span className="text-sm font-medium text-fg">{g.name}</span>
                  <div className="flex items-center gap-1.5">
                    {g.passed > 0 ? <Badge tone="success">{g.passed}✓</Badge> : null}
                    {g.warning > 0 ? <Badge tone="warning">{g.warning}!</Badge> : null}
                    {g.failed > 0 ? <Badge tone="danger">{g.failed}✗</Badge> : null}
                  </div>
                  <ScoreBar score={g.avgScore} />
                  <span className="text-left text-sm tabular-nums text-fg-muted sm:text-right">
                    {g.passRate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
