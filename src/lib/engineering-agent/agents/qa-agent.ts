import type { ChecklistItem, StepKind, StepOutput, TestCase } from "../types";
import {
  type Agent,
  type AgentContext,
  type AgentRunResult,
  buildPromptDigest,
  outputTokens,
} from "./shared";

const SYSTEM =
  "You are the QA agent. Produce a test plan, edge cases, regression risks, and an accessibility checklist.";

function testPlan(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const base: Array<Omit<TestCase, "id">> = [
    {
      title: "Renders with valid inputs",
      type: "unit",
      given: "the feature mounts with the expected props",
      expect: "the primary content and acceptance criteria are visible",
    },
    ...request.acceptanceCriteria.slice(0, 3).map((c) => ({
      title: `Satisfies: ${c.slice(0, 48)}`,
      type: "integration" as const,
      given: "a user exercises the feature end-to-end",
      expect: c,
    })),
    {
      title: "Handles the empty / loading state",
      type: "unit",
      given: "no data is available yet",
      expect: "a non-broken empty/loading state is shown",
    },
  ];
  if (request.complexity !== "small") {
    base.push({
      title: "End-to-end happy path",
      type: "e2e",
      given: "a user completes the primary flow",
      expect: "the expected outcome is persisted and reflected in the UI",
    });
  }

  const testCases: TestCase[] = base.map((t) => ({ ...t, id: ctx.id("test") }));

  return {
    kind: "test_plan",
    summary: `Drafted ${testCases.length} test cases covering acceptance criteria, edges, and regressions.`,
    testCases,
    edgeCases: [
      "Empty / null inputs and boundary values.",
      "Rapid repeated interaction (debounce / double-submit).",
      "Very long content and small-viewport overflow.",
      ...(request.riskLevel === "high"
        ? ["Concurrent updates and stale-state handling."]
        : []),
    ],
    regressionRisks: [
      "Shared UI primitives touched by this change.",
      "Routing/navigation wiring near the new surface.",
      ...(request.complexity === "large"
        ? ["The new data-access boundary and its callers."]
        : []),
    ],
  };
}

function accessibilityReview(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const checklist: ChecklistItem[] = [
    { label: "Semantic landmarks & headings", status: "pass", note: "Uses section/nav/heading structure." },
    { label: "All controls keyboard reachable", status: "pass", note: "Tab order is logical; no positive tabindex." },
    { label: "Visible focus indicators", status: "pass", note: "focus-visible ring on interactive elements." },
    {
      label: "Labels on inputs / icon buttons",
      status: request.framework === "node" ? "pass" : "warn",
      note:
        request.framework === "node"
          ? "No UI surface in scope."
          : "Confirm aria-label on any icon-only control.",
    },
    {
      label: "Color contrast ≥ 4.5:1",
      status: "pass",
      note: "Tokens meet AA on the dark surface set.",
    },
    {
      label: "Respects prefers-reduced-motion",
      status: /anim|transition|motion/i.test(request.description) ? "warn" : "pass",
      note: /anim|transition|motion/i.test(request.description)
        ? "Animation requested — gate it behind reduced-motion."
        : "No non-essential motion introduced.",
    },
  ];

  const warns = checklist.filter((c) => c.status !== "pass").length;
  return {
    kind: "accessibility_review",
    summary:
      warns === 0
        ? "Accessibility checklist passes (WCAG 2.2 AA spot-check)."
        : `Accessibility mostly passing — ${warns} item(s) to confirm.`,
    checklist,
  };
}

export const qaAgent: Agent = {
  name: "qa",
  handles: ["test_plan", "accessibility_review"],
  async run(kind: StepKind, ctx: AgentContext): Promise<AgentRunResult> {
    let output: StepOutput;
    switch (kind) {
      case "test_plan":
        ctx.log("info", "Generating test cases, edge cases, and regression risks.");
        output = testPlan(ctx);
        break;
      case "accessibility_review":
        ctx.log("info", "Running accessibility checklist against WCAG 2.2 AA.");
        output = accessibilityReview(ctx);
        break;
      default:
        throw new Error(`qa-agent cannot handle step "${kind}"`);
    }
    return {
      output,
      inputTokens: buildPromptDigest(ctx, SYSTEM),
      outputTokens: outputTokens(output),
    };
  },
};
