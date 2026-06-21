import { describe, it, expect } from "vitest";
import { MemoryStore } from "./memory-store";
import type { EngineeringRequestInput } from "@/lib/engineering-agent/schema";

const input: EngineeringRequestInput = {
  title: "Add a pricing page with a toggle",
  description: "A responsive pricing page with a monthly/yearly toggle.",
  framework: "nextjs",
  complexity: "medium",
  riskLevel: "low",
  acceptanceCriteria: ["Three tiers render", "Toggle updates prices"],
};

describe("MemoryStore", () => {
  it("creates a workflow and exposes it via list + detail", async () => {
    const store = new MemoryStore();
    const id = await store.createAndRunWorkflow(input, "forge-sim-1");

    const list = await store.listWorkflows();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(id);

    const detail = await store.getWorkflowDetail(id);
    expect(detail?.workflow.status).toBe("awaiting_approval");
    expect(detail?.steps).toHaveLength(9);
    expect(detail?.gates).toHaveLength(6);
  });

  it("approval generates a retrievable artifact", async () => {
    const store = new MemoryStore();
    const id = await store.createAndRunWorkflow(input, "forge-sim-1");
    await store.approveWorkflow(id, { approved: true, note: "ship" });

    const detail = await store.getWorkflowDetail(id);
    expect(detail?.workflow.status).toBe("completed");
    expect(detail?.artifact).not.toBeNull();

    const artifacts = await store.listArtifacts();
    expect(artifacts).toHaveLength(1);
    const fetched = await store.getArtifact(artifacts[0].id);
    expect(fetched?.artifact.workflowId).toBe(id);
  });

  it("rejects approving a workflow that is not awaiting approval", async () => {
    const store = new MemoryStore();
    const id = await store.createAndRunWorkflow(input, "forge-sim-1");
    await store.approveWorkflow(id, { approved: false, note: "no" });
    await expect(
      store.approveWorkflow(id, { approved: true, note: "again" }),
    ).rejects.toThrow();
  });

  it("aggregates dashboard metrics across runs", async () => {
    const store = new MemoryStore();
    const a = await store.createAndRunWorkflow(input, "forge-sim-1");
    await store.createAndRunWorkflow(input, "forge-sim-1");
    await store.approveWorkflow(a, { approved: true, note: "ship" });

    const metrics = await store.getDashboardMetrics();
    expect(metrics.total).toBe(2);
    expect(metrics.completed).toBe(1);
    expect(metrics.awaitingApproval).toBe(1);
    expect(metrics.recent.length).toBe(2);
    expect(metrics.totalCost).toBeGreaterThan(0);
  });
});
