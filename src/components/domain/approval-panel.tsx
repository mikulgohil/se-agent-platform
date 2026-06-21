"use client";

import { approveWorkflowAction } from "@/lib/actions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea, Label } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type {
  PullRequestArtifact,
  ReviewRecommendation,
} from "@/lib/engineering-agent/types";

interface ApprovalPanelProps {
  workflowId: string;
  recommendation: ReviewRecommendation | null;
  confidence: number | null;
}

const REC_TONE: Record<ReviewRecommendation, BadgeTone> = {
  approve: "success",
  approve_with_changes: "warning",
  request_changes: "danger",
};

export function ApprovalPanel({
  workflowId,
  recommendation,
  confidence,
}: ApprovalPanelProps) {
  return (
    <Card className="border-warning/30">
      <CardHeader className="border-warning/20">
        <CardTitle as="h2">Human approval required</CardTitle>
        {recommendation ? (
          <Badge tone={REC_TONE[recommendation]}>
            Review: {recommendation.replace(/_/g, " ")}
            {confidence != null ? ` · ${confidence}%` : ""}
          </Badge>
        ) : null}
      </CardHeader>
      <CardBody>
        <p className="text-sm text-fg-muted">
          The agents finished and produced a recommendation. Approve to generate
          the PR artifact, or request changes to reject this run.
        </p>
        <form action={approveWorkflowAction} className="mt-4 space-y-3">
          <input type="hidden" name="workflowId" value={workflowId} />
          <div>
            <Label htmlFor="note">Decision note (optional)</Label>
            <Textarea
              id="note"
              name="note"
              rows={2}
              placeholder="e.g. Looks good — tests cover the toggle. Ship it."
            />
          </div>
          <div className="flex items-center gap-2">
            <SubmitButton
              name="decision"
              value="approve"
              variant="primary"
              pendingLabel="Working…"
            >
              Approve &amp; generate PR
            </SubmitButton>
            <SubmitButton
              name="decision"
              value="reject"
              variant="danger"
              pendingLabel="Working…"
            >
              Request changes
            </SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/** Read-only summary shown once a decision has been made. */
export function ApprovalOutcome({
  approved,
  note,
  decidedBy,
  artifact,
}: {
  approved: boolean;
  note: string;
  decidedBy: string;
  artifact: PullRequestArtifact | null;
}) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge tone={approved ? "success" : "danger"}>
            {approved ? "Approved" : "Rejected"}
          </Badge>
          <span className="text-xs text-fg-subtle">by {decidedBy}</span>
        </div>
        {note ? <p className="text-sm text-fg-muted">“{note}”</p> : null}
        {approved && artifact ? (
          <a
            href={`/artifacts/${artifact.id}`}
            className="inline-block text-sm text-accent hover:underline"
          >
            View the generated PR artifact →
          </a>
        ) : null}
      </CardBody>
    </Card>
  );
}
