import { describe, it, expect } from "vitest";
import { runWorkflow, decideApproval } from "./runtime";
import { STEP_PLAN } from "./step-plan";
import { makeDeps, makeRequest } from "@/test/helpers";

describe("runWorkflow", () => {
  it("runs every step and pauses for approval on success", async () => {
    const run = await runWorkflow(makeDeps(), makeRequest());

    expect(run.steps).toHaveLength(STEP_PLAN.length);
    expect(run.steps.every((s) => s.status === "succeeded")).toBe(true);
    expect(run.workflow.status).toBe("awaiting_approval");
    expect(run.workflow.qualityScore).toBeGreaterThan(0);
    expect(run.workflow.tokensEstimate).toBeGreaterThan(0);
    expect(run.workflow.estimatedCost).toBeGreaterThan(0);
    expect(run.gates).toHaveLength(6);
  });

  it("retries a transient failure then succeeds", async () => {
    const run = await runWorkflow(makeDeps(), makeRequest(), {
      faults: { implementation: 1 },
    });

    const impl = run.steps.find((s) => s.kind === "implementation");
    expect(impl?.status).toBe("succeeded");
    expect(impl?.attempts).toBe(2);
    expect(run.workflow.status).toBe("awaiting_approval");
  });

  it("fails the workflow and skips later steps when retries are exhausted", async () => {
    const run = await runWorkflow(makeDeps(), makeRequest(), {
      faults: { security_review: 5 },
      maxAttempts: 2,
    });

    const sec = run.steps.find((s) => s.kind === "security_review");
    expect(sec?.status).toBe("failed");
    expect(run.workflow.status).toBe("failed");
    expect(run.workflow.qualityScore).toBe(0);
    expect(run.gates).toHaveLength(0);
    // performance_review + pr_summary come after security_review -> skipped
    expect(run.steps.find((s) => s.kind === "pr_summary")?.status).toBe("skipped");
  });

  it("is deterministic for identical inputs", async () => {
    const a = await runWorkflow(makeDeps(), makeRequest());
    const b = await runWorkflow(makeDeps(), makeRequest());
    expect(a.workflow.qualityScore).toBe(b.workflow.qualityScore);
    expect(a.workflow.tokensEstimate).toBe(b.workflow.tokensEstimate);
    expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps));
  });
});

describe("decideApproval", () => {
  it("approve -> completed workflow + a PR artifact", async () => {
    const request = makeRequest();
    const run = await runWorkflow(makeDeps(), request);
    const { workflow, artifact } = decideApproval(
      makeDeps(),
      { workflow: run.workflow, request, steps: run.steps },
      { approved: true, note: "ship it" },
    );

    expect(workflow.status).toBe("completed");
    expect(workflow.approval?.approved).toBe(true);
    expect(artifact).not.toBeNull();
    expect(artifact?.filesChanged.length).toBeGreaterThan(0);
    expect(workflow.artifactId).toBe(artifact?.id);
  });

  it("reject -> rejected workflow, no artifact", async () => {
    const request = makeRequest();
    const run = await runWorkflow(makeDeps(), request);
    const { workflow, artifact } = decideApproval(
      makeDeps(),
      { workflow: run.workflow, request, steps: run.steps },
      { approved: false, note: "needs work" },
    );

    expect(workflow.status).toBe("rejected");
    expect(artifact).toBeNull();
    expect(workflow.artifactId).toBeNull();
  });
});
