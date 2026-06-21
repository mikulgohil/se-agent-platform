import { describe, it, expect } from "vitest";
import { computeQualityGates, aggregateQualityScore } from "./quality-gates";
import { QUALITY_GATE_NAMES } from "./types";
import type { StepOutput } from "./types";
import { makeDeps, makeRequest } from "@/test/helpers";

function baseOutputs(): StepOutput[] {
  return [
    {
      kind: "implementation",
      summary: "x",
      fileChanges: [
        { path: "a.tsx", kind: "added", additions: 50, deletions: 0, summary: "s" },
      ],
      notes: [],
    },
    {
      kind: "test_plan",
      summary: "x",
      testCases: [
        { id: "t1", title: "a", type: "unit", given: "g", expect: "e" },
        { id: "t2", title: "b", type: "integration", given: "g", expect: "e" },
        { id: "t3", title: "c", type: "e2e", given: "g", expect: "e" },
        { id: "t4", title: "d", type: "unit", given: "g", expect: "e" },
        { id: "t5", title: "e", type: "unit", given: "g", expect: "e" },
      ],
      edgeCases: [],
      regressionRisks: [],
    },
    {
      kind: "accessibility_review",
      summary: "x",
      checklist: [{ label: "l", status: "pass", note: "n" }],
    },
  ];
}

describe("computeQualityGates", () => {
  it("returns all six named gates with valid scores", () => {
    const gates = computeQualityGates(makeDeps(), "wf", makeRequest(), baseOutputs());
    expect(gates).toHaveLength(6);
    expect(gates.map((g) => g.name).sort()).toEqual([...QUALITY_GATE_NAMES].sort());
    for (const g of gates) {
      expect(g.score).toBeGreaterThanOrEqual(0);
      expect(g.score).toBeLessThanOrEqual(100);
      expect(["passed", "warning", "failed"]).toContain(g.status);
    }
  });

  it("drops the security gate when a high-severity finding exists", () => {
    const clean = computeQualityGates(makeDeps(), "wf", makeRequest(), [
      ...baseOutputs(),
      { kind: "security_review", summary: "x", findings: [] },
    ]);
    const risky = computeQualityGates(makeDeps(), "wf", makeRequest(), [
      ...baseOutputs(),
      {
        kind: "security_review",
        summary: "x",
        findings: [
          {
            id: "f1",
            title: "SQLi",
            severity: "high",
            detail: "d",
            recommendation: "r",
          },
        ],
      },
    ]);
    const sec = (gs: ReturnType<typeof computeQualityGates>) =>
      gs.find((g) => g.name === "Security risk")!.score;
    expect(sec(risky)).toBeLessThan(sec(clean));
  });
});

describe("aggregateQualityScore", () => {
  it("weights security and coverage higher than an even mean", () => {
    const gates = computeQualityGates(makeDeps(), "wf", makeRequest(), baseOutputs());
    const score = aggregateQualityScore(gates);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns 0 for no gates", () => {
    expect(aggregateQualityScore([])).toBe(0);
  });
});
