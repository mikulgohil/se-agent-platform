import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AGENT_META } from "@/lib/engineering-agent/agents";
import { STEP_PLAN } from "@/lib/engineering-agent/step-plan";
import { AgentChip } from "@/components/domain/status";
import {
  IconArrowRight,
  IconShield,
  IconBeaker,
  IconBranch,
  IconGauge,
} from "@/components/ui/icons";
import type { AgentName } from "@/lib/engineering-agent/types";

const HIGHLIGHTS = [
  {
    icon: IconBranch,
    title: "Multi-agent pipeline",
    body: "Planner, Code, QA, and Review agents collaborate across a 9-step workflow.",
  },
  {
    icon: IconShield,
    title: "Quality gates",
    body: "Six scored gates — TypeScript, a11y, performance, security, coverage, maintainability.",
  },
  {
    icon: IconBeaker,
    title: "Human-in-the-loop",
    body: "Every run pauses for explicit approval before the PR artifact is generated.",
  },
  {
    icon: IconGauge,
    title: "Full observability",
    body: "Per-step agent, status, duration, token + cost estimates, retries, and logs.",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative px-6 py-14 sm:px-12 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-overlay px-3 py-1 text-xs font-medium text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Mock mode · runs with zero API keys
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
            A control center for software-engineering agents.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
            Submit a feature request and watch specialist agents plan it,
            simulate the implementation, write a test plan, run quality gates,
            and produce a pull-request-ready artifact — with you approving before
            anything ships.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/requests/new" size="md">
              Create a request
              <IconArrowRight width={16} height={16} />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" size="md">
              View the dashboard
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-5">
            <Icon className="h-5 w-5 text-accent" />
            <h2 className="mt-3 text-sm font-semibold text-fg">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{body}</p>
          </Card>
        ))}
      </section>

      {/* The agents */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
          The agents
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(AGENT_META) as AgentName[]).map((agent) => (
            <Card key={agent} className="p-5">
              <AgentChip agent={agent} />
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {AGENT_META[agent].role}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* The pipeline */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
          The pipeline
        </h2>
        <Card className="mt-4 p-5">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
            {STEP_PLAN.map((step, i) => (
              <li key={step.kind} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-md border border-line bg-overlay px-2.5 py-1.5">
                  <span className="text-xs tabular-nums text-fg-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-fg">{step.name}</span>
                </span>
                {i < STEP_PLAN.length - 1 ? (
                  <IconArrowRight className="text-fg-subtle" width={14} height={14} />
                ) : null}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <IconArrowRight className="text-fg-subtle" width={14} height={14} />
              <span className="inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning-bg px-2.5 py-1.5 text-warning">
                Human approval
              </span>
            </li>
          </ol>
        </Card>
      </section>
    </div>
  );
}
