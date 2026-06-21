import type { EngineeringRequest } from "@/lib/engineering-agent/types";
import type { EngineDeps } from "@/lib/engineering-agent/logger";
import { runWorkflow, decideApproval, type RunOptions } from "@/lib/engineering-agent/runtime";
import type { EngineeringRequestInput } from "@/lib/engineering-agent/schema";
import type { SeedData } from "./memory-store";

interface SeedSpec {
  input: EngineeringRequestInput;
  /** Hours ago this workflow was created (for realistic relative timestamps). */
  hoursAgo: number;
  options?: RunOptions;
  /** Approval to apply after the run (omit to leave awaiting_approval). */
  decision?: { approved: boolean; note: string };
}

const SPECS: SeedSpec[] = [
  {
    input: {
      title: "Pricing page with monthly/yearly toggle",
      description:
        "Add a responsive pricing page with three tiers and a monthly/yearly billing toggle. Yearly shows a discount badge. Cards must be responsive and keyboard accessible.",
      framework: "nextjs",
      complexity: "medium",
      riskLevel: "low",
      acceptanceCriteria: [
        "Three pricing tiers render with feature lists",
        "Monthly/yearly toggle updates all prices",
        "Yearly billing shows a discount badge",
        "Layout is responsive at sm/md/lg breakpoints",
      ],
    },
    hoursAgo: 2,
    options: { faults: { implementation: 1 } }, // retry-then-succeed demo
    decision: { approved: true, note: "Clean plan, tests cover the toggle. Ship it." },
  },
  {
    input: {
      title: "Multi-step contact form with validation",
      description:
        "Build a three-step contact form (details, message, review) with per-step validation, inline errors, and a final submit. Validate all user input on the server.",
      framework: "react",
      complexity: "medium",
      riskLevel: "medium",
      acceptanceCriteria: [
        "Three steps with next/back navigation",
        "Per-field validation with inline errors",
        "Server-side validation on submit",
        "Submitting shows a success confirmation",
      ],
    },
    hoursAgo: 6,
    // left awaiting_approval to demo the human-in-the-loop gate
  },
  {
    input: {
      title: "Refactor legacy Bootstrap card to Tailwind",
      description:
        "Replace a legacy Bootstrap card component with a Tailwind implementation using existing design tokens. Behaviour and markup semantics must be preserved.",
      framework: "react",
      complexity: "small",
      riskLevel: "low",
      acceptanceCriteria: [
        "Visual parity with the Bootstrap version",
        "No Bootstrap classes remain",
        "Existing tests still pass",
      ],
    },
    hoursAgo: 28,
    decision: { approved: true, note: "Behaviour-preserving and smaller. Approved." },
  },
  {
    input: {
      title: "Audit logging for the admin dashboard",
      description:
        "Add immutable audit logging for all admin mutations (who, what, when) with a queryable log view. Must handle concurrent updates and protect against tampering.",
      framework: "node",
      complexity: "large",
      riskLevel: "high",
      acceptanceCriteria: [
        "Every admin mutation writes an audit entry",
        "Entries are immutable and timestamped",
        "Log view supports filtering by actor and action",
        "Concurrent writes do not lose entries",
      ],
    },
    hoursAgo: 50,
    options: { faults: { security_review: 5 } }, // exhausts retries -> failed workflow
  },
];

/** A shared counter id factory so all seeded ids are unique and deterministic. */
function makeCounterId(): (prefix: string) => string {
  let n = 0;
  return (prefix) => `${prefix}_s${(++n).toString(36).padStart(4, "0")}`;
}

export async function buildSeed(): Promise<SeedData> {
  const id = makeCounterId();
  const nowMs = Date.now();
  const seed: SeedData = {
    requests: [],
    workflows: [],
    steps: [],
    gates: [],
    logs: [],
    artifacts: [],
  };

  for (const spec of SPECS) {
    const baseMs = nowMs - spec.hoursAgo * 3_600_000;
    const deps: EngineDeps = { now: () => baseMs, id };
    const request: EngineeringRequest = {
      id: id("req"),
      ...spec.input,
      createdAt: new Date(baseMs).toISOString(),
    };
    const run = await runWorkflow(deps, request, spec.options ?? {});

    seed.requests.push(request);
    seed.steps.push(...run.steps);
    seed.gates.push(...run.gates);
    seed.logs.push(...run.logs);

    if (spec.decision && run.workflow.status === "awaiting_approval") {
      const decideDeps: EngineDeps = {
        now: () => baseMs + 90_000,
        id,
      };
      const { workflow, artifact } = decideApproval(
        decideDeps,
        { workflow: run.workflow, request, steps: run.steps },
        spec.decision,
      );
      seed.workflows.push(workflow);
      if (artifact) seed.artifacts.push(artifact);
      seed.logs.push({
        id: id("log"),
        workflowId: workflow.id,
        stepId: null,
        level: spec.decision.approved ? "info" : "warn",
        message: `${spec.decision.approved ? "Approved" : "Rejected"} — "${spec.decision.note}"`,
        timestamp: new Date(baseMs + 90_000).toISOString(),
      });
    } else {
      seed.workflows.push(run.workflow);
    }
  }

  return seed;
}
