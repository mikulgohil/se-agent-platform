import type { Metadata } from "next";
import { getRepository } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { WorkflowRow } from "@/components/domain/workflow-row";
import { IconArrowRight } from "@/components/ui/icons";
import { serverNow } from "@/lib/server-time";

export const metadata: Metadata = { title: "Workflows" };

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const repo = await getRepository();
  const workflows = await repo.listWorkflows();
  const now = serverNow();

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Every agent run, newest first. Open one to inspect the timeline, logs, quality gates, and artifact."
        actions={
          <ButtonLink href="/requests/new" size="sm">
            New request
            <IconArrowRight width={14} height={14} />
          </ButtonLink>
        }
      />

      <Card>
        {workflows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-fg-muted">
            No workflows yet.{" "}
            <a href="/requests/new" className="text-accent hover:underline">
              Create a request
            </a>{" "}
            to start one.
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_140px_24px] gap-4 border-b border-line px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-fg-subtle sm:grid">
              <span>Request</span>
              <span>Status</span>
              <span>Quality</span>
              <span />
            </div>
            {workflows.map((wf) => (
              <WorkflowRow key={wf.id} wf={wf} now={now} />
            ))}
          </>
        )}
      </Card>
    </div>
  );
}
