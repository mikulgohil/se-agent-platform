import type {
  AgentWorkflow,
  EngineeringRequest,
  PullRequestArtifact,
  QualityGate,
  WorkflowDetail,
  WorkflowLog,
  WorkflowStep,
} from "@/lib/engineering-agent/types";
import type { EngineDeps } from "@/lib/engineering-agent/logger";
import { runWorkflow, decideApproval } from "@/lib/engineering-agent/runtime";
import {
  type ActivityPoint,
  type ApprovalInput,
  type ArtifactSummary,
  type DashboardMetrics,
  type Repository,
  type WorkflowSummary,
  durationMsOf,
} from "./repository";
import type { EngineeringRequestInput } from "@/lib/engineering-agent/schema";

export interface SeedData {
  requests: EngineeringRequest[];
  workflows: AgentWorkflow[];
  steps: WorkflowStep[];
  gates: QualityGate[];
  logs: WorkflowLog[];
  artifacts: PullRequestArtifact[];
}

/** Production deps: real clock + collision-resistant ids. */
function liveDeps(): EngineDeps {
  return {
    now: () => Date.now(),
    id: (prefix) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`,
  };
}

export class MemoryStore implements Repository {
  private requests = new Map<string, EngineeringRequest>();
  private workflows = new Map<string, AgentWorkflow>();
  private steps = new Map<string, WorkflowStep[]>();
  private gates = new Map<string, QualityGate[]>();
  private logs = new Map<string, WorkflowLog[]>();
  private artifacts = new Map<string, PullRequestArtifact>();

  constructor(seed?: SeedData) {
    if (seed) this.load(seed);
  }

  private load(seed: SeedData): void {
    for (const r of seed.requests) this.requests.set(r.id, r);
    for (const w of seed.workflows) this.workflows.set(w.id, w);
    for (const s of seed.steps) {
      const list = this.steps.get(s.workflowId) ?? [];
      list.push(s);
      this.steps.set(s.workflowId, list);
    }
    for (const g of seed.gates) {
      const list = this.gates.get(g.workflowId) ?? [];
      list.push(g);
      this.gates.set(g.workflowId, list);
    }
    for (const l of seed.logs) {
      const list = this.logs.get(l.workflowId) ?? [];
      list.push(l);
      this.logs.set(l.workflowId, list);
    }
    for (const a of seed.artifacts) this.artifacts.set(a.id, a);
  }

  private toSummary(w: AgentWorkflow): WorkflowSummary {
    const request = this.requests.get(w.requestId);
    const steps = this.steps.get(w.id) ?? [];
    return {
      id: w.id,
      requestId: w.requestId,
      title: request?.title ?? "(unknown request)",
      framework: request?.framework ?? "typescript",
      complexity: request?.complexity ?? "medium",
      riskLevel: request?.riskLevel ?? "low",
      status: w.status,
      qualityScore: w.qualityScore,
      estimatedCost: w.estimatedCost,
      tokensEstimate: w.tokensEstimate,
      durationMs: durationMsOf(w.startedAt, w.completedAt),
      stepCount: steps.length,
      createdAt: w.createdAt,
    };
  }

  async createAndRunWorkflow(
    input: EngineeringRequestInput,
    modelId: string,
  ): Promise<string> {
    const deps = liveDeps();
    const request: EngineeringRequest = {
      id: deps.id("req"),
      ...input,
      createdAt: new Date(deps.now()).toISOString(),
    };
    this.requests.set(request.id, request);

    const run = await runWorkflow(deps, request, { modelId });
    this.persistRun(run.workflow, run.steps, run.gates, run.logs);
    return run.workflow.id;
  }

  async retryWorkflow(workflowId: string): Promise<string> {
    const existing = this.workflows.get(workflowId);
    if (!existing) throw new Error("workflow not found");
    const request = this.requests.get(existing.requestId);
    if (!request) throw new Error("request not found");
    const deps = liveDeps();
    const run = await runWorkflow(deps, request, {});
    this.persistRun(run.workflow, run.steps, run.gates, run.logs);
    return run.workflow.id;
  }

  private persistRun(
    workflow: AgentWorkflow,
    steps: WorkflowStep[],
    gates: QualityGate[],
    logs: WorkflowLog[],
  ): void {
    this.workflows.set(workflow.id, workflow);
    this.steps.set(workflow.id, steps);
    this.gates.set(workflow.id, gates);
    this.logs.set(workflow.id, logs);
  }

  async approveWorkflow(
    workflowId: string,
    decision: ApprovalInput,
  ): Promise<void> {
    const detail = await this.getWorkflowDetail(workflowId);
    if (!detail) throw new Error("workflow not found");
    if (detail.workflow.status !== "awaiting_approval") {
      throw new Error("workflow is not awaiting approval");
    }
    const deps = liveDeps();
    const { workflow, artifact } = decideApproval(deps, detail, decision);
    this.workflows.set(workflow.id, workflow);
    if (artifact) this.artifacts.set(artifact.id, artifact);
    const note = decision.approved ? "Approved by reviewer." : "Rejected by reviewer.";
    const list = this.logs.get(workflowId) ?? [];
    list.push({
      id: deps.id("log"),
      workflowId,
      stepId: null,
      level: decision.approved ? "info" : "warn",
      message: `${note}${decision.note ? ` — "${decision.note}"` : ""}`,
      timestamp: new Date(deps.now()).toISOString(),
    });
    this.logs.set(workflowId, list);
  }

  async listWorkflows(): Promise<WorkflowSummary[]> {
    return [...this.workflows.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((w) => this.toSummary(w));
  }

  async getWorkflowDetail(id: string): Promise<WorkflowDetail | null> {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;
    const request = this.requests.get(workflow.requestId);
    if (!request) return null;
    const artifact = workflow.artifactId
      ? (this.artifacts.get(workflow.artifactId) ?? null)
      : null;
    return {
      workflow,
      request,
      steps: this.steps.get(id) ?? [],
      gates: this.gates.get(id) ?? [],
      logs: [...(this.logs.get(id) ?? [])].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp),
      ),
      artifact,
    };
  }

  async listArtifacts(): Promise<ArtifactSummary[]> {
    return [...this.artifacts.values()]
      .map((a) => {
        const w = this.workflows.get(a.workflowId);
        return {
          id: a.id,
          workflowId: a.workflowId,
          title: a.title,
          createdAt: a.createdAt,
          qualityScore: w?.qualityScore ?? 0,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getArtifact(id: string): Promise<{
    artifact: PullRequestArtifact;
    summary: WorkflowSummary;
  } | null> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;
    const workflow = this.workflows.get(artifact.workflowId);
    if (!workflow) return null;
    return { artifact, summary: this.toSummary(workflow) };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const all = [...this.workflows.values()];
    const summaries = all.map((w) => this.toSummary(w));
    const completed = all.filter((w) => w.status === "completed");
    const durations = summaries
      .map((s) => s.durationMs)
      .filter((d): d is number => d != null);
    const scored = all.filter(
      (w) => w.status === "completed" || w.status === "awaiting_approval",
    );

    return {
      total: all.length,
      completed: completed.length,
      failed: all.filter((w) => w.status === "failed").length,
      awaitingApproval: all.filter((w) => w.status === "awaiting_approval").length,
      running: all.filter((w) => w.status === "running" || w.status === "queued")
        .length,
      avgDurationMs: durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null,
      avgQualityScore: scored.length
        ? Math.round(
            scored.reduce((a, w) => a + w.qualityScore, 0) / scored.length,
          )
        : null,
      totalCost:
        Math.round(all.reduce((a, w) => a + w.estimatedCost, 0) * 1e6) / 1e6,
      recent: summaries
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    };
  }

  /**
   * Deterministic synthetic daily activity (mock mode has no real backlog).
   * A real adapter would replace this with an aggregate query over `workflows`.
   */
  async getActivitySeries(days: number): Promise<ActivityPoint[]> {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = Date.now();
    const points: ActivityPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      // deterministic waves (no Math.random) so the chart is stable per build
      const wave = (Math.sin(i * 1.1) + 1) / 2;
      const wave2 = (Math.cos(i * 0.7) + 1) / 2;
      const runs = 2 + Math.round(wave * 7);
      const avgQuality = 80 + Math.round(wave2 * 16);
      const tokens = runs * (3200 + Math.round(wave * 1800));
      const cost = Math.round(tokens * 0.0000016 * 1e4) / 1e4;
      points.push({
        label: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
        runs,
        avgQuality,
        cost,
        tokens,
      });
    }
    return points;
  }

  async getTokensByAgent(): Promise<{ agent: string; tokens: number }[]> {
    const totals = new Map<string, number>();
    for (const steps of this.steps.values()) {
      for (const s of steps) {
        totals.set(s.agentName, (totals.get(s.agentName) ?? 0) + s.tokensEstimate);
      }
    }
    const order = ["planner", "code", "qa", "review"];
    return order
      .filter((a) => totals.has(a))
      .map((agent) => ({ agent, tokens: totals.get(agent) ?? 0 }));
  }
}
