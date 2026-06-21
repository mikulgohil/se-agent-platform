import type {
  AgentWorkflow,
  ApprovalDecision,
  EngineeringRequest,
  PullRequestArtifact,
  QualityGate,
  StepKind,
  StepOutput,
  WorkflowDetail,
  WorkflowLog,
  WorkflowStep,
} from "./types";
import { STEP_PLAN } from "./step-plan";
import { agentForStep } from "./agents";
import { findOutput } from "./agents/shared";
import { createLogger, type EngineDeps } from "./logger";
import {
  DEFAULT_MODEL_ID,
  estimateCost,
  getModel,
} from "./mock-model";
import {
  aggregateQualityScore,
  computeQualityGates,
} from "./quality-gates";

export interface RunResult {
  workflow: AgentWorkflow;
  steps: WorkflowStep[];
  gates: QualityGate[];
  logs: WorkflowLog[];
}

export interface RunOptions {
  modelId?: string;
  /** Transient failures to inject per step before it succeeds (for demos/tests). */
  faults?: Partial<Record<StepKind, number>>;
  /** If a step still fails after this many attempts, the workflow fails. Default 2. */
  maxAttempts?: number;
}

const GAP_MS = 120;

/**
 * Execute the full agent pipeline for a request. Runs each step in order,
 * retries transient failures, computes quality gates, then pauses the workflow
 * for human approval. Pure over its inputs — returns new state, persists nothing.
 */
export async function runWorkflow(
  deps: EngineDeps,
  request: EngineeringRequest,
  options: RunOptions = {},
): Promise<RunResult> {
  const model = getModel(options.modelId ?? DEFAULT_MODEL_ID);
  const maxAttempts = options.maxAttempts ?? 2;
  const faults = options.faults ?? {};

  const workflowId = deps.id("wf");
  const baseStart = deps.now();
  // Internal monotonic clock so step/log timestamps are realistic & deterministic.
  const clock = { value: baseStart };
  const localDeps: EngineDeps = { now: () => clock.value, id: deps.id };
  const logger = createLogger(localDeps, workflowId);

  const steps: WorkflowStep[] = STEP_PLAN.map((def) => ({
    id: deps.id("step"),
    workflowId,
    kind: def.kind,
    agentName: def.agent,
    name: def.name,
    description: def.description,
    status: "pending",
    output: null,
    error: null,
    tokensEstimate: 0,
    costEstimate: 0,
    attempts: 0,
    startedAt: null,
    completedAt: null,
  }));

  logger.log("info", `Workflow created for "${request.title}".`, {
    metadata: { model: model.id, steps: steps.length },
  });

  const outputs: StepOutput[] = [];
  let failed = false;
  let totalTokens = 0;
  let totalCost = 0;

  for (const step of steps) {
    const agent = agentForStep(step.kind);
    step.startedAt = new Date(clock.value).toISOString();
    step.status = "running";

    let remainingFaults = faults[step.kind] ?? 0;
    let succeeded = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      step.attempts = attempt;
      try {
        if (remainingFaults > 0) {
          remainingFaults -= 1;
          throw new Error("upstream model timeout");
        }
        const result = await agent.run(step.kind, {
          request,
          model,
          priorOutputs: outputs,
          id: deps.id,
          log: (level, message) =>
            logger.log(level, message, { stepId: step.id }),
        });

        const cost = estimateCost(model, result.inputTokens, result.outputTokens);
        const tokens = result.inputTokens + result.outputTokens;
        const duration = 250 + Math.round(result.outputTokens * 1.5) + (attempt - 1) * 400;

        step.output = result.output;
        step.tokensEstimate = tokens;
        step.costEstimate = cost;
        clock.value += duration;
        step.completedAt = new Date(clock.value).toISOString();
        step.status = "succeeded";

        outputs.push(result.output);
        totalTokens += tokens;
        totalCost += cost;
        logger.log("info", `${agent.name} agent completed "${step.name}".`, {
          stepId: step.id,
          metadata: { tokens, costUsd: cost, attempt },
        });
        succeeded = true;
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        clock.value += 300;
        if (attempt < maxAttempts) {
          logger.log("warn", `"${step.name}" failed (attempt ${attempt}/${maxAttempts}): ${message}. Retrying.`, {
            stepId: step.id,
          });
        } else {
          step.status = "failed";
          step.error = message;
          step.completedAt = new Date(clock.value).toISOString();
          logger.log("error", `"${step.name}" failed after ${maxAttempts} attempts: ${message}.`, {
            stepId: step.id,
          });
        }
      }
    }

    if (!succeeded) {
      failed = true;
      // Mark the remaining steps skipped.
      for (const later of steps) {
        if (later.status === "pending") {
          later.status = "skipped";
          logger.log("debug", `Skipped "${later.name}" due to upstream failure.`, {
            stepId: later.id,
          });
        }
      }
      break;
    }
    clock.value += GAP_MS;
  }

  const gates = failed
    ? []
    : computeQualityGates(localDeps, workflowId, request, outputs);
  const qualityScore = failed ? 0 : aggregateQualityScore(gates);

  if (failed) {
    logger.log("error", "Workflow failed — no PR artifact generated.");
  } else {
    logger.log("info", `Quality score ${qualityScore}/100. Awaiting human approval.`, {
      metadata: { qualityScore },
    });
  }

  const workflow: AgentWorkflow = {
    id: workflowId,
    requestId: request.id,
    status: failed ? "failed" : "awaiting_approval",
    qualityScore,
    tokensEstimate: totalTokens,
    estimatedCost: Math.round(totalCost * 1e6) / 1e6,
    approval: null,
    artifactId: null,
    startedAt: new Date(baseStart).toISOString(),
    completedAt: failed ? new Date(clock.value).toISOString() : null,
    createdAt: new Date(baseStart).toISOString(),
  };

  return { workflow, steps, gates, logs: logger.entries };
}

/**
 * Build the final PR artifact from a completed run. Called at approval time so
 * the artifact reflects the human decision.
 */
export function buildArtifact(
  deps: EngineDeps,
  detail: Pick<WorkflowDetail, "workflow" | "request" | "steps">,
): PullRequestArtifact {
  const { workflow, request, steps } = detail;
  const outputs = steps
    .map((s) => s.output)
    .filter((o): o is StepOutput => o !== null);

  const arch = findOutput(outputs, "architecture_planning");
  const tasks = findOutput(outputs, "task_breakdown")?.tasks ?? [];
  const impl = findOutput(outputs, "implementation");
  const tests = findOutput(outputs, "test_plan");
  const security = findOutput(outputs, "security_review")?.findings ?? [];
  const perf = findOutput(outputs, "performance_review")?.findings ?? [];
  const a11y = findOutput(outputs, "accessibility_review")?.checklist ?? [];

  const risks = [
    ...security
      .filter((f) => f.severity !== "info")
      .map((f) => `Security: ${f.title} — ${f.recommendation}`),
    ...perf
      .filter((f) => f.severity === "high" || f.severity === "low")
      .map((f) => `Performance: ${f.title}`),
    ...a11y
      .filter((c) => c.status !== "pass")
      .map((c) => `Accessibility: ${c.label} — ${c.note}`),
  ];

  return {
    id: deps.id("artifact"),
    workflowId: workflow.id,
    title: `feat: ${request.title}`,
    summary:
      arch?.approach ??
      `Implements ${request.title} for the ${request.framework} codebase.`,
    implementationPlan: tasks.map((t) => `${t.title} (${t.estimate}) — ${t.detail}`),
    filesChanged: impl?.fileChanges ?? [],
    testingPlan: (tests?.testCases ?? []).map(
      (t) => `[${t.type}] ${t.title}: given ${t.given}, expect ${t.expect}.`,
    ),
    risks: risks.length ? risks : ["No significant risks identified."],
    reviewerChecklist: [
      "Acceptance criteria met and demoed.",
      "Tests added and passing in CI.",
      "Accessibility checklist reviewed.",
      "No secrets or unsafe input handling introduced.",
      "Bundle/performance impact acceptable.",
    ],
    rollbackPlan: [
      "Revert this PR (single squash commit).",
      "No data migrations included — revert is safe and immediate.",
      "Feature is additive; removing the route restores prior behaviour.",
    ],
    createdAt: new Date(deps.now()).toISOString(),
  };
}

/** Apply a human approval decision, returning the updated workflow + artifact. */
export function decideApproval(
  deps: EngineDeps,
  detail: Pick<WorkflowDetail, "workflow" | "request" | "steps">,
  decision: { approved: boolean; note: string; decidedBy?: string },
): { workflow: AgentWorkflow; artifact: PullRequestArtifact | null } {
  const decidedAt = new Date(deps.now()).toISOString();
  const approval: ApprovalDecision = {
    decidedBy: decision.decidedBy ?? "you",
    approved: decision.approved,
    note: decision.note,
    decidedAt,
  };

  if (!decision.approved) {
    return {
      workflow: {
        ...detail.workflow,
        status: "rejected",
        approval,
        completedAt: decidedAt,
      },
      artifact: null,
    };
  }

  const artifact = buildArtifact(deps, detail);
  return {
    workflow: {
      ...detail.workflow,
      status: "completed",
      approval,
      artifactId: artifact.id,
      completedAt: decidedAt,
    },
    artifact,
  };
}
