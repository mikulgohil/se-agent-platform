/**
 * Core domain model for the Software Engineering Agent Platform.
 *
 * Design notes:
 * - String-literal unions (not enums) keep the model JSON-serializable and
 *   tree-shakeable, so the same objects move unchanged from the in-memory
 *   store to a Supabase `jsonb` column.
 * - `StepOutput` is a discriminated union keyed by `kind` — each agent step
 *   carries a differently-shaped, fully-typed payload.
 * - All timestamps are ISO strings, never `Date`, so everything serializes.
 */

/* ------------------------------------------------------------------ */
/* Request inputs                                                      */
/* ------------------------------------------------------------------ */

export const FRAMEWORKS = ["nextjs", "react", "node", "typescript"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export const COMPLEXITIES = ["small", "medium", "large"] as const;
export type Complexity = (typeof COMPLEXITIES)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface EngineeringRequest {
  id: string;
  title: string;
  description: string;
  framework: Framework;
  complexity: Complexity;
  riskLevel: RiskLevel;
  acceptanceCriteria: string[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Agents & steps                                                      */
/* ------------------------------------------------------------------ */

export const AGENT_NAMES = ["planner", "code", "qa", "review"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const STEP_KINDS = [
  "requirement_analysis",
  "architecture_planning",
  "task_breakdown",
  "implementation",
  "test_plan",
  "accessibility_review",
  "security_review",
  "performance_review",
  "pr_summary",
] as const;
export type StepKind = (typeof STEP_KINDS)[number];

export const STEP_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "skipped",
] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const WORKFLOW_STATUSES = [
  "queued",
  "running",
  "awaiting_approval",
  "approved",
  "completed",
  "failed",
  "rejected",
] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

/* ------------------------------------------------------------------ */
/* Structured payloads referenced by StepOutput                       */
/* ------------------------------------------------------------------ */

export interface TechnicalTask {
  id: string;
  title: string;
  detail: string;
  estimate: "S" | "M" | "L";
  agent: AgentName;
}

export type FileChangeKind = "added" | "modified" | "deleted";

export interface FileChange {
  path: string;
  kind: FileChangeKind;
  additions: number;
  deletions: number;
  summary: string;
  /** A short illustrative snippet (not a full file) for the diff preview. */
  snippet?: string;
}

export type TestType = "unit" | "integration" | "e2e" | "a11y";

export interface TestCase {
  id: string;
  title: string;
  type: TestType;
  given: string;
  expect: string;
}

export type ChecklistStatus = "pass" | "warn" | "fail";

export interface ChecklistItem {
  label: string;
  status: ChecklistStatus;
  note: string;
}

export type FindingSeverity = "info" | "low" | "medium" | "high";

export interface ReviewFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  detail: string;
  recommendation: string;
}

export type ReviewRecommendation =
  | "approve"
  | "approve_with_changes"
  | "request_changes";

/* ------------------------------------------------------------------ */
/* StepOutput — discriminated union, one variant per StepKind          */
/* ------------------------------------------------------------------ */

export type StepOutput =
  | {
      kind: "requirement_analysis";
      summary: string;
      clarifiedRequirements: string[];
      missingDetails: string[];
      assumptions: string[];
    }
  | {
      kind: "architecture_planning";
      summary: string;
      approach: string;
      components: string[];
      dataFlow: string[];
      tradeoffs: string[];
    }
  | {
      kind: "task_breakdown";
      summary: string;
      tasks: TechnicalTask[];
    }
  | {
      kind: "implementation";
      summary: string;
      fileChanges: FileChange[];
      notes: string[];
    }
  | {
      kind: "test_plan";
      summary: string;
      testCases: TestCase[];
      edgeCases: string[];
      regressionRisks: string[];
    }
  | {
      kind: "accessibility_review";
      summary: string;
      checklist: ChecklistItem[];
    }
  | {
      kind: "security_review";
      summary: string;
      findings: ReviewFinding[];
    }
  | {
      kind: "performance_review";
      summary: string;
      findings: ReviewFinding[];
    }
  | {
      kind: "pr_summary";
      summary: string;
      recommendation: ReviewRecommendation;
      confidence: number;
    };

export interface WorkflowStep {
  id: string;
  workflowId: string;
  kind: StepKind;
  agentName: AgentName;
  name: string;
  description: string;
  status: StepStatus;
  output: StepOutput | null;
  error: string | null;
  /** Observability — populated by the runtime as the step executes. */
  tokensEstimate: number;
  costEstimate: number;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
}

/* ------------------------------------------------------------------ */
/* Quality gates                                                       */
/* ------------------------------------------------------------------ */

export const QUALITY_GATE_NAMES = [
  "TypeScript safety",
  "Accessibility",
  "Performance risk",
  "Security risk",
  "Test coverage",
  "Maintainability",
] as const;
export type QualityGateName = (typeof QUALITY_GATE_NAMES)[number];

export const GATE_STATUSES = ["passed", "warning", "failed"] as const;
export type GateStatus = (typeof GATE_STATUSES)[number];

export interface QualityGate {
  id: string;
  workflowId: string;
  name: QualityGateName;
  status: GateStatus;
  /** 0–100 */
  score: number;
  explanation: string;
}

/* ------------------------------------------------------------------ */
/* Logs                                                                */
/* ------------------------------------------------------------------ */

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface WorkflowLog {
  id: string;
  workflowId: string;
  stepId: string | null;
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

/* ------------------------------------------------------------------ */
/* PR artifact                                                         */
/* ------------------------------------------------------------------ */

export interface PullRequestArtifact {
  id: string;
  workflowId: string;
  title: string;
  summary: string;
  implementationPlan: string[];
  filesChanged: FileChange[];
  testingPlan: string[];
  risks: string[];
  reviewerChecklist: string[];
  rollbackPlan: string[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Workflow aggregate                                                  */
/* ------------------------------------------------------------------ */

export interface ApprovalDecision {
  decidedBy: string;
  approved: boolean;
  note: string;
  decidedAt: string;
}

export interface AgentWorkflow {
  id: string;
  requestId: string;
  status: WorkflowStatus;
  /** 0–100 weighted average of quality-gate scores. */
  qualityScore: number;
  tokensEstimate: number;
  estimatedCost: number;
  approval: ApprovalDecision | null;
  artifactId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

/** Convenience aggregate used by detail views. */
export interface WorkflowDetail {
  workflow: AgentWorkflow;
  request: EngineeringRequest;
  steps: WorkflowStep[];
  gates: QualityGate[];
  logs: WorkflowLog[];
  artifact: PullRequestArtifact | null;
}
