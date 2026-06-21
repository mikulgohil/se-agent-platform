import { describe, it, expect } from "vitest";
import { artifactToMarkdown } from "./artifact-markdown";
import type { PullRequestArtifact } from "./types";

const artifact: PullRequestArtifact = {
  id: "artifact_1",
  workflowId: "wf_1",
  title: "feat: pricing page",
  summary: "Adds a responsive pricing page.",
  implementationPlan: ["Scaffold the page", "Wire the toggle"],
  filesChanged: [
    {
      path: "src/app/pricing/page.tsx",
      kind: "added",
      additions: 80,
      deletions: 0,
      summary: "Pricing surface",
    },
  ],
  testingPlan: ["[unit] renders tiers"],
  risks: ["No significant risks identified."],
  reviewerChecklist: ["Acceptance criteria met"],
  rollbackPlan: ["Revert the PR"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("artifactToMarkdown", () => {
  const md = artifactToMarkdown(artifact);

  it("starts with the PR title as an h1", () => {
    expect(md.startsWith("# feat: pricing page")).toBe(true);
  });

  it("includes every section heading", () => {
    for (const heading of [
      "## Implementation plan",
      "## Files changed",
      "## Testing plan",
      "## Risks",
      "## Reviewer checklist",
      "## Rollback plan",
    ]) {
      expect(md).toContain(heading);
    }
  });

  it("renders the reviewer checklist as GitHub task items", () => {
    expect(md).toContain("- [ ] Acceptance criteria met");
  });

  it("renders file changes with path and line deltas", () => {
    expect(md).toContain("`src/app/pricing/page.tsx`");
    expect(md).toContain("+80/-0");
  });
});
