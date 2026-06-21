import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRepository } from "@/lib/store";
import { artifactToMarkdown } from "@/lib/engineering-agent/artifact-markdown";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CopyMarkdownButton } from "@/components/domain/copy-markdown-button";
import type { FileChange } from "@/lib/engineering-agent/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const repo = await getRepository();
  const found = await repo.getArtifact(id);
  return { title: found ? found.artifact.title : "Artifact" };
}

const FILE_KIND_TONE: Record<FileChange["kind"], BadgeTone> = {
  added: "success",
  modified: "info",
  deleted: "danger",
};

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-fg-muted">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
              {item}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = await getRepository();
  const found = await repo.getArtifact(id);
  if (!found) notFound();

  const { artifact, summary } = found;
  const markdown = artifactToMarkdown(artifact);

  return (
    <div className="max-w-4xl">
      <div className="mb-2 text-sm text-fg-subtle">
        <Link href="/artifacts" className="hover:text-fg">
          Artifacts
        </Link>{" "}
        <span className="px-1">/</span>
        <span className="text-fg-muted">{artifact.id}</span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-fg">{artifact.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="success">quality {summary.qualityScore}</Badge>
            <Link
              href={`/workflows/${artifact.workflowId}`}
              className="text-xs text-accent hover:underline"
            >
              View source workflow →
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyMarkdownButton markdown={markdown} />
          <ButtonLink
            href={`/workflows/${artifact.workflowId}`}
            variant="ghost"
            size="sm"
          >
            Workflow
          </ButtonLink>
        </div>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Summary</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm leading-relaxed text-fg-muted">{artifact.summary}</p>
          </CardBody>
        </Card>

        <ListSection title="Implementation plan" items={artifact.implementationPlan} />

        <Card>
          <CardHeader>
            <CardTitle as="h2">Files changed</CardTitle>
            <span className="text-xs text-fg-subtle">
              {artifact.filesChanged.length} files
            </span>
          </CardHeader>
          <div>
            {artifact.filesChanged.map((f) => (
              <div
                key={f.path}
                className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 last:border-b-0"
              >
                <code className="truncate font-mono text-xs text-fg">{f.path}</code>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-success">+{f.additions}</span>
                  <span className="font-mono text-xs text-danger">-{f.deletions}</span>
                  <Badge tone={FILE_KIND_TONE[f.kind]}>{f.kind}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <ListSection title="Testing plan" items={artifact.testingPlan} />
        <ListSection title="Risks" items={artifact.risks} />

        <Card>
          <CardHeader>
            <CardTitle as="h2">Reviewer checklist</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {artifact.reviewerChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-fg-muted">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line-strong text-[10px]">
                    ☐
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <ListSection title="Rollback plan" items={artifact.rollbackPlan} />

        <Card>
          <CardHeader>
            <CardTitle as="h2">Raw markdown</CardTitle>
            <CopyMarkdownButton markdown={markdown} />
          </CardHeader>
          <CardBody>
            <pre className="overflow-x-auto rounded-md bg-bg p-4 font-mono text-xs leading-relaxed text-fg-muted">
              {markdown}
            </pre>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
