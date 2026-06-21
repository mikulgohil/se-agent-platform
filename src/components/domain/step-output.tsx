import type {
  FileChange,
  FindingSeverity,
  StepOutput,
  ReviewFinding,
  ChecklistItem,
} from "@/lib/engineering-agent/types";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { AgentChip } from "@/components/domain/status";
import { IconCheck, IconAlert, IconX } from "@/components/ui/icons";

function BulletList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li
          key={i}
          className={`flex gap-2 text-sm ${muted ? "text-fg-subtle" : "text-fg-muted"}`}
        >
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
        {title}
      </div>
      {children}
    </div>
  );
}

const SEVERITY_TONE: Record<FindingSeverity, BadgeTone> = {
  info: "neutral",
  low: "info",
  medium: "warning",
  high: "danger",
};

const FILE_KIND_TONE: Record<FileChange["kind"], BadgeTone> = {
  added: "success",
  modified: "info",
  deleted: "danger",
};

function FindingList({ findings }: { findings: ReviewFinding[] }) {
  return (
    <div className="space-y-2.5">
      {findings.map((f) => (
        <div key={f.id} className="rounded-md border border-line bg-elevated p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg">{f.title}</span>
            <Badge tone={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>
          </div>
          <p className="mt-1 text-xs text-fg-muted">{f.detail}</p>
          <p className="mt-1.5 text-xs text-fg-subtle">
            <span className="text-fg-muted">Fix:</span> {f.recommendation}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChecklistView({ items }: { items: ChecklistItem[] }) {
  const icon = {
    pass: <IconCheck className="text-success" width={15} height={15} />,
    warn: <IconAlert className="text-warning" width={15} height={15} />,
    fail: <IconX className="text-danger" width={15} height={15} />,
  };
  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c.label} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 shrink-0">{icon[c.status]}</span>
          <span>
            <span className="text-fg">{c.label}</span>
            <span className="text-fg-subtle"> — {c.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const TEST_TONE: Record<string, BadgeTone> = {
  unit: "info",
  integration: "accent",
  e2e: "success",
  a11y: "warning",
};

/** Renders a step's typed output. The discriminant `output.kind` narrows the
 * payload to its exact shape — no `any`, no optional-chaining guesswork. */
export function StepOutputView({ output }: { output: StepOutput }) {
  switch (output.kind) {
    case "requirement_analysis":
      return (
        <div className="space-y-4">
          <Section title="Clarified requirements">
            <BulletList items={output.clarifiedRequirements} />
          </Section>
          <Section title="Open questions">
            <BulletList items={output.missingDetails} />
          </Section>
          <Section title="Assumptions">
            <BulletList items={output.assumptions} muted />
          </Section>
        </div>
      );
    case "architecture_planning":
      return (
        <div className="space-y-4">
          <Section title="Approach">
            <p className="text-sm text-fg-muted">{output.approach}</p>
          </Section>
          <Section title="Components">
            <BulletList items={output.components} />
          </Section>
          <Section title="Data flow">
            <BulletList items={output.dataFlow} />
          </Section>
          <Section title="Trade-offs">
            <BulletList items={output.tradeoffs} muted />
          </Section>
        </div>
      );
    case "task_breakdown":
      return (
        <div className="space-y-2">
          {output.tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-md border border-line bg-elevated p-3"
            >
              <div>
                <div className="text-sm font-medium text-fg">{t.title}</div>
                <div className="mt-0.5 text-xs text-fg-muted">{t.detail}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone="neutral">{t.estimate}</Badge>
                <AgentChip agent={t.agent} />
              </div>
            </div>
          ))}
        </div>
      );
    case "implementation":
      return (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-md border border-line">
            {output.fileChanges.map((f) => (
              <div key={f.path} className="border-b border-line last:border-b-0">
                <div className="flex items-center justify-between gap-2 bg-elevated px-3 py-2">
                  <code className="truncate font-mono text-xs text-fg">{f.path}</code>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs text-success">+{f.additions}</span>
                    <span className="font-mono text-xs text-danger">-{f.deletions}</span>
                    <Badge tone={FILE_KIND_TONE[f.kind]}>{f.kind}</Badge>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs text-fg-muted">{f.summary}</p>
                  {f.snippet ? (
                    <pre className="mt-2 overflow-x-auto rounded bg-bg p-3 font-mono text-xs leading-relaxed text-fg-muted">
                      {f.snippet}
                    </pre>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <Section title="Notes">
            <BulletList items={output.notes} muted />
          </Section>
        </div>
      );
    case "test_plan":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {output.testCases.map((t) => (
              <div key={t.id} className="rounded-md border border-line bg-elevated p-3">
                <div className="flex items-center gap-2">
                  <Badge tone={TEST_TONE[t.type] ?? "neutral"}>{t.type}</Badge>
                  <span className="text-sm font-medium text-fg">{t.title}</span>
                </div>
                <p className="mt-1.5 text-xs text-fg-subtle">
                  <span className="text-fg-muted">Given</span> {t.given},{" "}
                  <span className="text-fg-muted">expect</span> {t.expect}.
                </p>
              </div>
            ))}
          </div>
          <Section title="Edge cases">
            <BulletList items={output.edgeCases} />
          </Section>
          <Section title="Regression risks">
            <BulletList items={output.regressionRisks} muted />
          </Section>
        </div>
      );
    case "accessibility_review":
      return <ChecklistView items={output.checklist} />;
    case "security_review":
    case "performance_review":
      return <FindingList findings={output.findings} />;
    case "pr_summary": {
      const tone: BadgeTone =
        output.recommendation === "approve"
          ? "success"
          : output.recommendation === "approve_with_changes"
            ? "warning"
            : "danger";
      return (
        <div className="flex items-center gap-3">
          <Badge tone={tone}>{output.recommendation.replace(/_/g, " ")}</Badge>
          <span className="text-sm text-fg-muted">
            {output.confidence}% confidence
          </span>
        </div>
      );
    }
  }
}
