import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconArtifact, IconChevronRight } from "@/components/ui/icons";
import { timeAgo } from "@/lib/utils";
import { serverNow } from "@/lib/server-time";

export const metadata: Metadata = { title: "Artifacts" };

export const dynamic = "force-dynamic";

export default async function ArtifactsPage() {
  const repo = await getRepository();
  const artifacts = await repo.listArtifacts();
  const now = serverNow();

  return (
    <div>
      <PageHeader
        title="PR artifacts"
        description="Pull-request-ready summaries generated after human approval — paste-able straight into GitHub."
      />

      {artifacts.length === 0 ? (
        <Card className="px-5 py-16 text-center text-sm text-fg-muted">
          No artifacts yet. Approve a workflow to generate one.
        </Card>
      ) : (
        <div className="grid gap-3">
          {artifacts.map((a) => (
            <Link key={a.id} href={`/artifacts/${a.id}`}>
              <Card className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-elevated">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-overlay text-accent">
                    <IconArtifact width={17} height={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">
                      {a.title}
                    </div>
                    <div className="text-xs text-fg-subtle">
                      {timeAgo(a.createdAt, now)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone="success">score {a.qualityScore}</Badge>
                  <IconChevronRight className="text-fg-subtle" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
