import type { StepKind, StepOutput, TechnicalTask } from "../types";
import {
  type Agent,
  type AgentContext,
  type AgentRunResult,
  buildPromptDigest,
  byComplexity,
  featureName,
  frameworkPaths,
  outputTokens,
} from "./shared";

const SYSTEM =
  "You are the Planner agent. Clarify the requirement, design an approach, and break it into technical tasks.";

function requirementAnalysis(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const missing: string[] = [];
  if (request.acceptanceCriteria.length < 2) {
    missing.push("Acceptance criteria are thin — confirm the full done-definition.");
  }
  if (!/responsive|mobile|breakpoint/i.test(request.description)) {
    missing.push("Responsive behaviour / target breakpoints not specified.");
  }
  if (request.riskLevel !== "low" && !/auth|permission|role/i.test(request.description)) {
    missing.push("Auth/permission scope unclear for a medium/high-risk change.");
  }

  return {
    kind: "requirement_analysis",
    summary: `Parsed "${request.title}" into ${request.acceptanceCriteria.length} acceptance criteria and ${missing.length} open question(s).`,
    clarifiedRequirements: [
      `Deliver: ${request.title}.`,
      ...request.acceptanceCriteria.map((c) => `Acceptance: ${c}`),
      `Target stack: ${request.framework}.`,
    ],
    missingDetails: missing.length
      ? missing
      : ["No blocking gaps — requirement is well specified."],
    assumptions: [
      `Implementation targets the existing ${request.framework} codebase conventions.`,
      "No new third-party services are introduced unless stated.",
      "Existing design tokens / component library are reused where possible.",
    ],
  };
}

function architecturePlanning(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const paths = frameworkPaths(request.framework);
  return {
    kind: "architecture_planning",
    summary: `Proposed a ${request.complexity}-sized approach with a clear server/client boundary and reuse of existing primitives.`,
    approach: byComplexity(request.complexity, {
      small: `Implement as a single feature module under ${paths.componentDir}, no new shared abstractions.`,
      medium: `Add a feature module under ${paths.componentDir} plus one shared utility; keep state local and colocate logic.`,
      large: `Introduce a feature folder with a small internal API, shared types, and a thin data-access layer to keep the surface testable.`,
    }),
    components: [
      `${paths.componentDir}/${featureName(request)} — primary feature surface`,
      `${paths.componentDir}/ui — reuse existing primitives (Button, Card, …)`,
      `${paths.routeDir} — wire the feature into routing/navigation`,
    ],
    dataFlow: [
      "Server fetches/validates inputs at the boundary.",
      "Typed props flow down; interaction state stays in the leaf client component.",
      "Mutations validated with a schema before persistence.",
    ],
    tradeoffs: [
      "Local state over a global store — simpler, fewer moving parts for this scope.",
      "Reuse existing tokens over a bespoke style layer — consistency over novelty.",
    ],
  };
}

function taskBreakdown(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const count = byComplexity(request.complexity, { small: 3, medium: 5, large: 7 });
  const seeds: Array<Omit<TechnicalTask, "id">> = [
    {
      title: `Scaffold the ${request.title} surface`,
      detail: "Create the component/route skeleton with typed props and placeholder content.",
      estimate: "S",
      agent: "code",
    },
    {
      title: "Implement core logic & state",
      detail: "Wire interaction state, derive view-model, handle empty/loading states.",
      estimate: "M",
      agent: "code",
    },
    {
      title: "Apply responsive layout & design tokens",
      detail: "Build the responsive layout using existing tokens; verify at sm/md/lg.",
      estimate: "M",
      agent: "code",
    },
    {
      title: "Author unit & integration tests",
      detail: "Cover happy path, edge cases, and the acceptance criteria.",
      estimate: "M",
      agent: "qa",
    },
    {
      title: "Accessibility & keyboard pass",
      detail: "Semantic markup, labels, focus order, reduced-motion.",
      estimate: "S",
      agent: "qa",
    },
    {
      title: "Security & input validation review",
      detail: "Validate untrusted input, check authz boundaries, scan for injection.",
      estimate: "S",
      agent: "review",
    },
    {
      title: "Performance budget check",
      detail: "Watch bundle delta, avoid needless client JS, memoize hot paths.",
      estimate: "S",
      agent: "review",
    },
  ];
  const tasks: TechnicalTask[] = seeds.slice(0, count).map((t) => ({
    ...t,
    id: ctx.id("task"),
  }));

  return {
    kind: "task_breakdown",
    summary: `Decomposed into ${tasks.length} technical tasks across code, QA, and review.`,
    tasks,
  };
}

export const plannerAgent: Agent = {
  name: "planner",
  handles: ["requirement_analysis", "architecture_planning", "task_breakdown"],
  async run(kind: StepKind, ctx: AgentContext): Promise<AgentRunResult> {
    let output: StepOutput;
    switch (kind) {
      case "requirement_analysis":
        ctx.log("info", "Analysing requirement and surfacing open questions.");
        output = requirementAnalysis(ctx);
        break;
      case "architecture_planning":
        ctx.log("info", "Designing implementation approach and component boundaries.");
        output = architecturePlanning(ctx);
        break;
      case "task_breakdown":
        ctx.log("info", "Breaking the approach into estimated technical tasks.");
        output = taskBreakdown(ctx);
        break;
      default:
        throw new Error(`planner-agent cannot handle step "${kind}"`);
    }
    return {
      output,
      inputTokens: buildPromptDigest(ctx, SYSTEM),
      outputTokens: outputTokens(output),
    };
  },
};
