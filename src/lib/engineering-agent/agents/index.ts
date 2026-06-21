import type { AgentName, StepKind } from "../types";
import type { Agent } from "./shared";
import { plannerAgent } from "./planner-agent";
import { codeAgent } from "./code-agent";
import { qaAgent } from "./qa-agent";
import { reviewAgent } from "./review-agent";

export const AGENTS: Agent[] = [plannerAgent, codeAgent, qaAgent, reviewAgent];

const BY_STEP = new Map<StepKind, Agent>();
for (const agent of AGENTS) {
  for (const kind of agent.handles) BY_STEP.set(kind, agent);
}

export function agentForStep(kind: StepKind): Agent {
  const agent = BY_STEP.get(kind);
  if (!agent) throw new Error(`No agent registered for step "${kind}"`);
  return agent;
}

export const AGENT_META: Record<
  AgentName,
  { label: string; role: string; colorVar: string }
> = {
  planner: {
    label: "Planner",
    role: "Understands the request, designs the approach, breaks down tasks.",
    colorVar: "var(--color-agent-planner)",
  },
  code: {
    label: "Code",
    role: "Proposes concrete file changes and implementation choices.",
    colorVar: "var(--color-agent-code)",
  },
  qa: {
    label: "QA",
    role: "Writes test cases, edge cases, and the accessibility checklist.",
    colorVar: "var(--color-agent-qa)",
  },
  review: {
    label: "Review",
    role: "Assesses security & performance risk, recommends a decision.",
    colorVar: "var(--color-agent-review)",
  },
};

export type { Agent, AgentContext, AgentRunResult } from "./shared";
