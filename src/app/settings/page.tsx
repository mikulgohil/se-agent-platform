import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODELS } from "@/lib/engineering-agent/mock-model";
import { formatCost } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const SEAMS = [
  {
    title: "Model adapter",
    body: "Agents depend on a ModelDescriptor + shared token/cost estimators. Implement one LanguageModel.generate() to run against a real provider.",
    file: "src/lib/engineering-agent/mock-model.ts",
  },
  {
    title: "Persistence",
    body: "The app talks to a Repository interface. The in-memory adapter backs the demo; SupabaseRepository implements the same contract for production.",
    file: "src/lib/store/repository.ts",
  },
  {
    title: "Agents",
    body: "Each agent is a small module behind a common Agent interface. Add a step kind + agent without touching the runtime.",
    file: "src/lib/engineering-agent/agents/",
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="How this instance is configured. The demo runs in mock mode — everything below is wired behind a seam so it can go live without app changes."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Models</CardTitle>
            <Badge tone="success">mock mode active</Badge>
          </CardHeader>
          <div>
            {MODELS.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 last:border-b-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{m.label}</span>
                    <Badge tone={m.ready ? "success" : "neutral"}>
                      {m.ready ? "ready" : "needs API key"}
                    </Badge>
                  </div>
                  <code className="text-xs text-fg-subtle">{m.id}</code>
                </div>
                <div className="text-right text-xs text-fg-muted">
                  <div>{formatCost(m.pricing.inputPer1k)} / 1K in</div>
                  <div>{formatCost(m.pricing.outputPer1k)} / 1K out</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Architecture seams</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {SEAMS.map((seam) => (
              <div key={seam.title}>
                <div className="text-sm font-medium text-fg">{seam.title}</div>
                <p className="mt-0.5 text-sm text-fg-muted">{seam.body}</p>
                <code className="mt-1 inline-block text-xs text-accent">{seam.file}</code>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Environment</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm text-fg-muted">
            <p>
              No environment variables are required to run the demo. To go live,
              set the variables documented in <code className="text-accent">.env.example</code>:
            </p>
            <ul className="space-y-1.5">
              {[
                "ANTHROPIC_API_KEY — enables the Claude model adapter",
                "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — enables Postgres persistence",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
                  <code className="text-xs">{line}</code>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
