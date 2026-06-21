import type { Metadata } from "next";
import { getRepository } from "@/lib/store";
import { durationMsOf } from "@/lib/store/repository";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { ComparePicker } from "@/components/domain/compare-picker";
import { WorkflowStatusBadge } from "@/components/domain/status";
import { ScoreBar } from "@/components/domain/score-ring";
import type { WorkflowDetail, QualityGateName } from "@/lib/engineering-agent/types";
import { QUALITY_GATE_NAMES } from "@/lib/engineering-agent/types";
import { formatCost, formatCompact, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Compare runs" };
export const dynamic = "force-dynamic";

/** Colored delta between baseline (A) and candidate (B). */
function Delta({
  a,
  b,
  higherBetter,
  format,
}: {
  a: number;
  b: number;
  higherBetter: boolean;
  format: (n: number) => string;
}) {
  const diff = b - a;
  if (diff === 0) return <span className="text-fg-subtle">±0</span>;
  const better = higherBetter ? diff > 0 : diff < 0;
  const tone = better ? "text-success" : "text-danger";
  const arrow = diff > 0 ? "▲" : "▼";
  return (
    <span className={`tabular-nums ${tone}`}>
      {arrow} {format(Math.abs(diff))}
    </span>
  );
}

function MetricRow({
  label,
  a,
  b,
  higherBetter,
  format,
}: {
  label: string;
  a: number;
  b: number;
  higherBetter: boolean;
  format: (n: number) => string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_90px] items-center gap-2 border-b border-line px-5 py-3 text-sm last:border-b-0">
      <span className="text-fg-muted">{label}</span>
      <span className="text-right tabular-nums text-fg">{format(a)}</span>
      <span className="text-right tabular-nums text-fg">{format(b)}</span>
      <span className="text-right">
        <Delta a={a} b={b} higherBetter={higherBetter} format={format} />
      </span>
    </div>
  );
}

function gateMap(detail: WorkflowDetail): Map<QualityGateName, number> {
  const m = new Map<QualityGateName, number>();
  for (const g of detail.gates) m.set(g.name, g.score);
  return m;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const repo = await getRepository();
  const workflows = await repo.listWorkflows();
  const options = workflows.map((w) => ({ id: w.id, title: w.title }));

  const [detailA, detailB] = await Promise.all([
    a ? repo.getWorkflowDetail(a) : Promise.resolve(null),
    b ? repo.getWorkflowDetail(b) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader
        title="Compare runs"
        description="Diff two runs side by side — quality gates, cost, tokens, and timing. Green is an improvement from baseline (A) to candidate (B)."
      />

      <Card className="mb-6">
        <CardBody>
          <ComparePicker options={options} a={a} b={b} />
        </CardBody>
      </Card>

      {!detailA || !detailB ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-fg-muted">
              Select two runs above to see a side-by-side diff.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_90px] gap-2 px-5 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            <span />
            <span className="text-right">A</span>
            <span className="text-right">B</span>
            <span className="text-right">Δ</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Runs</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 divide-x divide-line">
              {[detailA, detailB].map((d, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="mb-1.5 text-[11px] uppercase tracking-wide text-fg-subtle">
                    {i === 0 ? "Baseline (A)" : "Candidate (B)"}
                  </div>
                  <div className="truncate text-sm font-medium text-fg">
                    {d.request.title}
                  </div>
                  <div className="mt-2">
                    <WorkflowStatusBadge status={d.workflow.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Metrics</CardTitle>
            </CardHeader>
            <div>
              <MetricRow
                label="Quality score"
                a={detailA.workflow.qualityScore}
                b={detailB.workflow.qualityScore}
                higherBetter
                format={(n) => String(Math.round(n))}
              />
              <MetricRow
                label="Tokens"
                a={detailA.workflow.tokensEstimate}
                b={detailB.workflow.tokensEstimate}
                higherBetter={false}
                format={(n) => formatCompact(n)}
              />
              <MetricRow
                label="Est. cost"
                a={detailA.workflow.estimatedCost}
                b={detailB.workflow.estimatedCost}
                higherBetter={false}
                format={(n) => formatCost(n)}
              />
              <MetricRow
                label="Duration"
                a={durationMsOf(detailA.workflow.startedAt, detailA.workflow.completedAt) ?? 0}
                b={durationMsOf(detailB.workflow.startedAt, detailB.workflow.completedAt) ?? 0}
                higherBetter={false}
                format={(n) => formatDuration(n)}
              />
              <MetricRow
                label="Steps succeeded"
                a={detailA.steps.filter((s) => s.status === "succeeded").length}
                b={detailB.steps.filter((s) => s.status === "succeeded").length}
                higherBetter
                format={(n) => String(n)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Quality gates</CardTitle>
            </CardHeader>
            <div>
              {(() => {
                const ma = gateMap(detailA);
                const mb = gateMap(detailB);
                const names = QUALITY_GATE_NAMES.filter((n) => ma.has(n) || mb.has(n));
                if (names.length === 0) {
                  return (
                    <CardBody>
                      <p className="text-sm text-fg-muted">
                        One or both runs have no gates (a failed run produces none).
                      </p>
                    </CardBody>
                  );
                }
                return names.map((name) => {
                  const sa = ma.get(name) ?? 0;
                  const sb = mb.get(name) ?? 0;
                  return (
                    <div
                      key={name}
                      className="grid grid-cols-[minmax(0,1fr)_1fr_1fr_70px] items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
                    >
                      <span className="text-sm text-fg-muted">{name}</span>
                      <ScoreBar score={sa} />
                      <ScoreBar score={sb} />
                      <span className="text-right">
                        <Delta a={sa} b={sb} higherBetter format={(n) => String(Math.round(n))} />
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
