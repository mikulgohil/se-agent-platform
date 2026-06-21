/**
 * Supabase adapter — the production storage seam (skeleton).
 *
 * This file intentionally has NO `@supabase/supabase-js` import so the demo
 * builds with zero extra dependencies. It documents exactly how the same
 * `Repository` contract maps onto Postgres tables (see `supabase/schema.sql`).
 *
 * To activate:
 *   1. `pnpm add @supabase/supabase-js`
 *   2. Apply `supabase/schema.sql` to your project.
 *   3. Replace the `throw`s below with the queries described in each comment.
 *   4. In `store/index.ts`, return `new SupabaseRepository(client)` when
 *      `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are set.
 *
 * Because every domain object is already JSON-serializable, the agent outputs,
 * gates, logs and artifacts persist as-is into `jsonb` columns — no mapping
 * layer required.
 */
/* eslint-disable @typescript-eslint/no-unused-vars
   -- Intentional: this is a documented skeleton. Params are named to show the
   real method signatures; bodies throw until @supabase/supabase-js is wired. */
import type {
  ApprovalInput,
  ArtifactSummary,
  DashboardMetrics,
  Repository,
  WorkflowSummary,
} from "./repository";
import type {
  PullRequestArtifact,
  WorkflowDetail,
} from "@/lib/engineering-agent/types";
import type { EngineeringRequestInput } from "@/lib/engineering-agent/schema";

const NOT_IMPLEMENTED =
  "SupabaseRepository is a documented skeleton. Wire up @supabase/supabase-js to enable it — see supabase-adapter.ts.";

export class SupabaseRepository implements Repository {
  // constructor(private readonly client: SupabaseClient) {}

  async createAndRunWorkflow(
    _input: EngineeringRequestInput,
    _modelId: string,
  ): Promise<string> {
    // 1. insert into `requests`
    // 2. run `runWorkflow(...)` (same engine as the memory store)
    // 3. insert workflow + steps + gates + logs in a transaction
    throw new Error(NOT_IMPLEMENTED);
  }

  async approveWorkflow(
    _workflowId: string,
    _decision: ApprovalInput,
  ): Promise<void> {
    // update workflows set status/approval; insert artifact row if approved
    throw new Error(NOT_IMPLEMENTED);
  }

  async retryWorkflow(_workflowId: string): Promise<string> {
    // re-run the engine for the existing request; insert a new workflow row
    throw new Error(NOT_IMPLEMENTED);
  }

  async listWorkflows(): Promise<WorkflowSummary[]> {
    // select from `workflow_summary` view (workflows joined to requests)
    throw new Error(NOT_IMPLEMENTED);
  }

  async getWorkflowDetail(_id: string): Promise<WorkflowDetail | null> {
    // parallel selects: workflow, request, steps, gates, logs, artifact
    throw new Error(NOT_IMPLEMENTED);
  }

  async listArtifacts(): Promise<ArtifactSummary[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getArtifact(_id: string): Promise<{
    artifact: PullRequestArtifact;
    summary: WorkflowSummary;
  } | null> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // aggregate query over `workflows` (count by status, avg score/duration)
    throw new Error(NOT_IMPLEMENTED);
  }
}
