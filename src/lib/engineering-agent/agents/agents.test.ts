import { describe, it, expect } from "vitest";
import { AGENTS, agentForStep } from "./index";
import { STEP_KINDS } from "../types";
import { plannerAgent } from "./planner-agent";
import { findOutput } from "./shared";
import type { AgentContext } from "./shared";
import { getModel } from "../mock-model";
import { makeDeps, makeRequest } from "@/test/helpers";

function ctx(overrides: Partial<AgentContext> = {}): AgentContext {
  const deps = makeDeps();
  return {
    request: makeRequest(),
    model: getModel("forge-sim-1"),
    priorOutputs: [],
    log: () => {},
    id: deps.id,
    ...overrides,
  };
}

describe("agent registry", () => {
  it("maps every step kind to exactly one agent", () => {
    for (const kind of STEP_KINDS) {
      expect(() => agentForStep(kind)).not.toThrow();
    }
  });

  it("each registered agent only claims kinds it handles", () => {
    for (const agent of AGENTS) {
      for (const kind of agent.handles) {
        expect(agentForStep(kind)).toBe(agent);
      }
    }
  });
});

describe("planner agent", () => {
  it("scales task count with complexity", async () => {
    const small = await plannerAgent.run(
      "task_breakdown",
      ctx({ request: makeRequest({ complexity: "small" }) }),
    );
    const large = await plannerAgent.run(
      "task_breakdown",
      ctx({ request: makeRequest({ complexity: "large" }) }),
    );
    const count = (r: Awaited<ReturnType<typeof plannerAgent.run>>) =>
      r.output.kind === "task_breakdown" ? r.output.tasks.length : 0;
    expect(count(large)).toBeGreaterThan(count(small));
  });

  it("reports non-zero token usage", async () => {
    const r = await plannerAgent.run("requirement_analysis", ctx());
    expect(r.inputTokens).toBeGreaterThan(0);
    expect(r.outputTokens).toBeGreaterThan(0);
  });

  it("throws for a step it does not handle", async () => {
    await expect(plannerAgent.run("implementation", ctx())).rejects.toThrow();
  });
});

describe("findOutput", () => {
  it("returns the typed output for a matching kind", () => {
    const found = findOutput(
      [{ kind: "pr_summary", summary: "s", recommendation: "approve", confidence: 90 }],
      "pr_summary",
    );
    expect(found?.recommendation).toBe("approve");
  });

  it("returns undefined when absent", () => {
    expect(findOutput([], "implementation")).toBeUndefined();
  });
});
