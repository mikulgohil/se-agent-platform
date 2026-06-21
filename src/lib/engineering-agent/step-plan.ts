import type { AgentName, StepKind } from "./types";

export interface StepDefinition {
  kind: StepKind;
  name: string;
  description: string;
  agent: AgentName;
}

/**
 * The fixed pipeline every workflow runs, in order. Human approval is a
 * workflow-level gate that occurs after `pr_summary`, not a step here.
 */
export const STEP_PLAN: StepDefinition[] = [
  {
    kind: "requirement_analysis",
    name: "Requirement analysis",
    description: "Clarify the request and surface missing details.",
    agent: "planner",
  },
  {
    kind: "architecture_planning",
    name: "Architecture planning",
    description: "Design the implementation approach and boundaries.",
    agent: "planner",
  },
  {
    kind: "task_breakdown",
    name: "Task breakdown",
    description: "Decompose the approach into estimated technical tasks.",
    agent: "planner",
  },
  {
    kind: "implementation",
    name: "Implementation simulation",
    description: "Propose concrete file changes for each task.",
    agent: "code",
  },
  {
    kind: "test_plan",
    name: "Test plan generation",
    description: "Author test cases, edge cases, and regression risks.",
    agent: "qa",
  },
  {
    kind: "accessibility_review",
    name: "Accessibility review",
    description: "Check semantics, keyboard, contrast, and motion.",
    agent: "qa",
  },
  {
    kind: "security_review",
    name: "Security review",
    description: "Scan for input, authz, and secret-handling risks.",
    agent: "review",
  },
  {
    kind: "performance_review",
    name: "Performance review",
    description: "Assess bundle delta and hot-path performance risk.",
    agent: "review",
  },
  {
    kind: "pr_summary",
    name: "PR summary generation",
    description: "Synthesize findings into an approval recommendation.",
    agent: "review",
  },
];
