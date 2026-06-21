import type {
  EngineeringRequest,
  GateStatus,
  QualityGate,
  QualityGateName,
  StepOutput,
} from "./types";
import { findOutput } from "./agents/shared";
import type { EngineDeps } from "./logger";

function statusFromScore(score: number): GateStatus {
  if (score >= 80) return "passed";
  if (score >= 60) return "warning";
  return "failed";
}

interface GateInput {
  name: QualityGateName;
  score: number;
  explanation: string;
}

/**
 * Compute the six quality gates from the agents' structured outputs. Pure and
 * deterministic — the same outputs always produce the same gates and scores.
 */
export function computeQualityGates(
  deps: EngineDeps,
  workflowId: string,
  request: EngineeringRequest,
  outputs: StepOutput[],
): QualityGate[] {
  const impl = findOutput(outputs, "implementation");
  const tests = findOutput(outputs, "test_plan");
  const a11y = findOutput(outputs, "accessibility_review");
  const security = findOutput(outputs, "security_review");
  const perf = findOutput(outputs, "performance_review");

  const additions = impl?.fileChanges.reduce((a, f) => a + f.additions, 0) ?? 0;
  const fileCount = impl?.fileChanges.length ?? 0;

  const a11yWarns = a11y?.checklist.filter((c) => c.status === "warn").length ?? 0;
  const a11yFails = a11y?.checklist.filter((c) => c.status === "fail").length ?? 0;

  const secHigh = security?.findings.filter((f) => f.severity === "high").length ?? 0;
  const secMed = security?.findings.filter((f) => f.severity === "medium").length ?? 0;

  const perfHigh = perf?.findings.filter((f) => f.severity === "high").length ?? 0;
  const perfLow = perf?.findings.filter((f) => f.severity === "low").length ?? 0;

  const testCount = tests?.testCases.length ?? 0;
  const coverageTarget = Math.max(3, request.acceptanceCriteria.length + 2);

  const gates: GateInput[] = [
    {
      name: "TypeScript safety",
      score: 94,
      explanation: "Strict types throughout; no `any`, discriminated unions for outputs.",
    },
    {
      name: "Accessibility",
      score: 100 - a11yWarns * 10 - a11yFails * 30,
      explanation:
        a11yWarns + a11yFails === 0
          ? "WCAG 2.2 AA checklist passes."
          : `${a11yWarns} warning(s), ${a11yFails} failure(s) on the AA checklist.`,
    },
    {
      name: "Performance risk",
      score: 96 - perfHigh * 35 - perfLow * 8 - Math.max(0, additions - 250) / 25,
      explanation:
        perfHigh > 0
          ? "High-impact performance risk flagged."
          : `Modest footprint (~${additions} added lines, ${fileCount} files).`,
    },
    {
      name: "Security risk",
      score: 98 - secHigh * 40 - secMed * 14,
      explanation:
        secHigh > 0
          ? `${secHigh} high-severity security finding(s).`
          : secMed > 0
            ? `${secMed} medium security item(s) to address.`
            : "No actionable security risks.",
    },
    {
      name: "Test coverage",
      score: Math.min(100, Math.round((testCount / coverageTarget) * 100)),
      explanation: `${testCount} test cases vs target of ${coverageTarget}.`,
    },
    {
      name: "Maintainability",
      score:
        request.complexity === "large"
          ? 82
          : request.complexity === "medium"
            ? 88
            : 92,
      explanation: `Surface kept small for a ${request.complexity} change; logic colocated and typed.`,
    },
  ];

  return gates.map(({ name, score, explanation }) => {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    return {
      id: deps.id("gate"),
      workflowId,
      name,
      status: statusFromScore(clamped),
      score: clamped,
      explanation,
    };
  });
}

/** Weighted average across gates (security & tests weighted higher). */
export function aggregateQualityScore(gates: QualityGate[]): number {
  const weights: Record<QualityGateName, number> = {
    "TypeScript safety": 1,
    Accessibility: 1,
    "Performance risk": 1,
    "Security risk": 1.5,
    "Test coverage": 1.5,
    Maintainability: 1,
  };
  let total = 0;
  let weightSum = 0;
  for (const g of gates) {
    const w = weights[g.name] ?? 1;
    total += g.score * w;
    weightSum += w;
  }
  return weightSum === 0 ? 0 : Math.round(total / weightSum);
}
