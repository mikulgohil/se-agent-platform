import type {
  Complexity,
  Framework,
  GateStatus,
  PullRequestArtifact,
  QualityGateName,
  RiskLevel,
  WorkflowDetail,
  WorkflowStatus,
} from "@/lib/engineering-agent/types";
import type { EngineeringRequestInput } from "@/lib/engineering-agent/schema";

/** Flattened row for list/dashboard views. */
export interface WorkflowSummary {
  id: string;
  requestId: string;
  title: string;
  framework: Framework;
  complexity: Complexity;
  riskLevel: RiskLevel;
  status: WorkflowStatus;
  qualityScore: number;
  estimatedCost: number;
  tokensEstimate: number;
  durationMs: number | null;
  stepCount: number;
  createdAt: string;
}

export interface ArtifactSummary {
  id: string;
  workflowId: string;
  title: string;
  createdAt: string;
  qualityScore: number;
}

export interface DashboardMetrics {
  total: number;
  completed: number;
  failed: number;
  awaitingApproval: number;
  running: number;
  avgDurationMs: number | null;
  avgQualityScore: number | null;
  totalCost: number;
  recent: WorkflowSummary[];
}

/** One day of activity for the dashboard trend charts. */
export interface ActivityPoint {
  label: string;
  runs: number;
  avgQuality: number;
  cost: number;
  tokens: number;
}

/** Per-evaluator (quality gate) aggregate across all scored runs. */
export interface GateAggregate {
  name: QualityGateName;
  avgScore: number;
  passed: number;
  warning: number;
  failed: number;
  runs: number;
  /** % of runs where this gate passed. */
  passRate: number;
}

/** A single scored run's quality score, for the trend chart. */
export interface QualityTrendPoint {
  workflowId: string;
  label: string;
  score: number;
  status: GateStatus | "scored";
}

export interface EvalSummary {
  gates: GateAggregate[];
  trend: QualityTrendPoint[];
  scoredRuns: number;
  avgQuality: number | null;
  /** % of all (gate × run) checks that passed. */
  overallPassRate: number | null;
}

export interface ApprovalInput {
  approved: boolean;
  note: string;
  decidedBy?: string;
}

/**
 * The storage seam. The app depends only on this interface; the in-memory
 * adapter backs the demo, and a Supabase adapter (see `supabase-adapter.ts`)
 * implements the same contract for production. Swapping is a one-line change
 * in `index.ts`.
 */
export interface Repository {
  createAndRunWorkflow(
    input: EngineeringRequestInput,
    modelId: string,
  ): Promise<string>;
  approveWorkflow(workflowId: string, decision: ApprovalInput): Promise<void>;
  retryWorkflow(workflowId: string): Promise<string>;

  listWorkflows(): Promise<WorkflowSummary[]>;
  getWorkflowDetail(id: string): Promise<WorkflowDetail | null>;

  listArtifacts(): Promise<ArtifactSummary[]>;
  getArtifact(id: string): Promise<{
    artifact: PullRequestArtifact;
    summary: WorkflowSummary;
  } | null>;

  getDashboardMetrics(): Promise<DashboardMetrics>;
  /** Daily activity series for trend charts (most recent `days` days). */
  getActivitySeries(days: number): Promise<ActivityPoint[]>;
  /** Estimated token usage broken down by agent across all runs. */
  getTokensByAgent(): Promise<{ agent: string; tokens: number }[]>;
  /** Per-evaluator aggregates + quality trend for the analytics page. */
  getEvalSummary(): Promise<EvalSummary>;
}

/** Duration helper shared by adapters. */
export function durationMsOf(
  startedAt: string | null,
  completedAt: string | null,
): number | null {
  if (!startedAt || !completedAt) return null;
  return new Date(completedAt).getTime() - new Date(startedAt).getTime();
}
