import type {
  ReviewFinding,
  ReviewRecommendation,
  StepKind,
  StepOutput,
} from "../types";
import {
  type Agent,
  type AgentContext,
  type AgentRunResult,
  buildPromptDigest,
  findOutput,
  outputTokens,
} from "./shared";

const SYSTEM =
  "You are the Review agent. Assess security and performance risk, then recommend an approval decision.";

function securityReview(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const findings: ReviewFinding[] = [];

  if (/input|form|upload|search|query/i.test(request.description) || request.framework === "node") {
    findings.push({
      id: ctx.id("find"),
      title: "Validate and sanitize untrusted input",
      severity: request.riskLevel === "high" ? "high" : "medium",
      detail: "User-supplied input reaches application logic.",
      recommendation: "Validate with a schema (Zod) at the boundary; encode on output.",
    });
  }
  if (request.riskLevel !== "low" && !/auth|role|permission/i.test(request.description)) {
    findings.push({
      id: ctx.id("find"),
      title: "Confirm authorization boundary",
      severity: "medium",
      detail: "A medium/high-risk change without an explicit authz check.",
      recommendation: "Gate the action behind the existing authz check; add a test.",
    });
  }
  findings.push({
    id: ctx.id("find"),
    title: "No secrets in client bundle",
    severity: "info",
    detail: "Change introduces no client-exposed secrets.",
    recommendation: "Keep keys server-side; verify env access is server-only.",
  });

  return {
    kind: "security_review",
    summary: `${findings.filter((f) => f.severity !== "info").length} actionable security item(s) identified.`,
    findings,
  };
}

function performanceReview(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const impl = findOutput(ctx.priorOutputs, "implementation");
  const additions = impl?.fileChanges.reduce((a, f) => a + f.additions, 0) ?? 0;
  const findings: ReviewFinding[] = [
    {
      id: ctx.id("find"),
      title: "Bundle size delta is modest",
      severity: additions > 300 ? "low" : "info",
      detail: `~${additions} added lines; no heavy dependencies introduced.`,
      recommendation:
        additions > 300
          ? "Lazy-load below-the-fold parts of the feature."
          : "No action needed.",
    },
    {
      id: ctx.id("find"),
      title:
        request.framework === "nextjs"
          ? "Keep client JS minimal"
          : "Avoid unnecessary work on hot paths",
      severity: "info",
      detail:
        request.framework === "nextjs"
          ? "Page stays server-rendered; only the interactive leaf ships JS."
          : "No N+1 or repeated heavy computation detected in the plan.",
      recommendation: "Memoize derived values only where measurably hot.",
    },
  ];

  return {
    kind: "performance_review",
    summary: "Performance risk is low for this change.",
    findings,
  };
}

function recommend(ctx: AgentContext): {
  recommendation: ReviewRecommendation;
  confidence: number;
  summary: string;
} {
  const security = findOutput(ctx.priorOutputs, "security_review")?.findings ?? [];
  const perf = findOutput(ctx.priorOutputs, "performance_review")?.findings ?? [];
  const a11y = findOutput(ctx.priorOutputs, "accessibility_review")?.checklist ?? [];

  const high = [...security, ...perf].filter((f) => f.severity === "high").length;
  const medium = [...security, ...perf].filter((f) => f.severity === "medium").length;
  const a11yWarns = a11y.filter((c) => c.status !== "pass").length;

  let recommendation: ReviewRecommendation = "approve";
  if (high > 0) recommendation = "request_changes";
  else if (medium + a11yWarns > 0) recommendation = "approve_with_changes";

  const confidence = Math.max(
    55,
    Math.min(98, 95 - high * 25 - medium * 8 - a11yWarns * 4),
  );

  const summary =
    recommendation === "approve"
      ? "Change is low-risk and meets the acceptance criteria — recommend approve."
      : recommendation === "approve_with_changes"
        ? `Recommend approve with ${medium + a11yWarns} minor follow-up(s) before merge.`
        : `Recommend changes — ${high} high-severity item(s) must be resolved first.`;

  return { recommendation, confidence, summary };
}

export const reviewAgent: Agent = {
  name: "review",
  handles: ["security_review", "performance_review", "pr_summary"],
  async run(kind: StepKind, ctx: AgentContext): Promise<AgentRunResult> {
    let output: StepOutput;
    switch (kind) {
      case "security_review":
        ctx.log("info", "Scanning for security risks (input, authz, secrets).");
        output = securityReview(ctx);
        break;
      case "performance_review":
        ctx.log("info", "Assessing bundle delta and hot-path performance risk.");
        output = performanceReview(ctx);
        break;
      case "pr_summary": {
        ctx.log("info", "Synthesizing the review into an approval recommendation.");
        const { recommendation, confidence, summary } = recommend(ctx);
        output = { kind: "pr_summary", summary, recommendation, confidence };
        break;
      }
      default:
        throw new Error(`review-agent cannot handle step "${kind}"`);
    }
    return {
      output,
      inputTokens: buildPromptDigest(ctx, SYSTEM),
      outputTokens: outputTokens(output),
    };
  },
};
