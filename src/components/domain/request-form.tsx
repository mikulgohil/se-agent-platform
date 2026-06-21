"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  createWorkflowAction,
  type CreateWorkflowState,
} from "@/lib/actions";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Label,
  Input,
  Textarea,
  Select,
  FieldError,
  FieldHint,
} from "@/components/ui/field";
import { IconPlay, IconSpinner } from "@/components/ui/icons";
import { FRAMEWORKS, COMPLEXITIES, RISK_LEVELS } from "@/lib/engineering-agent/types";
import { MODELS } from "@/lib/engineering-agent/mock-model";

const FRAMEWORK_LABEL: Record<string, string> = {
  nextjs: "Next.js",
  react: "React",
  node: "Node",
  typescript: "TypeScript (generic)",
};

interface Preset {
  label: string;
  title: string;
  description: string;
  framework: string;
  complexity: string;
  riskLevel: string;
  acceptanceCriteria: string;
}

const PRESETS: Preset[] = [
  {
    label: "Pricing page",
    title: "Pricing page with monthly/yearly toggle",
    description:
      "Add a responsive pricing page with three tiers and a monthly/yearly billing toggle. Yearly shows a discount badge. Cards must be responsive and keyboard accessible.",
    framework: "nextjs",
    complexity: "medium",
    riskLevel: "low",
    acceptanceCriteria:
      "Three pricing tiers render with feature lists\nMonthly/yearly toggle updates all prices\nYearly billing shows a discount badge\nLayout is responsive at sm/md/lg",
  },
  {
    label: "Audit logging",
    title: "Audit logging for the admin dashboard",
    description:
      "Add immutable audit logging for all admin mutations (who, what, when) with a queryable log view. Must handle concurrent updates and protect against tampering.",
    framework: "node",
    complexity: "large",
    riskLevel: "high",
    acceptanceCriteria:
      "Every admin mutation writes an audit entry\nEntries are immutable and timestamped\nLog view supports filtering by actor and action\nConcurrent writes do not lose entries",
  },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <IconSpinner className="animate-spin" width={16} height={16} />
      ) : (
        <IconPlay width={14} height={14} />
      )}
      {pending ? "Running agents…" : "Run agent workflow"}
    </Button>
  );
}

export function RequestForm() {
  const [state, formAction] = useActionState<CreateWorkflowState, FormData>(
    createWorkflowAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  function applyPreset(preset: Preset) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("title") as HTMLInputElement).value = preset.title;
    (form.elements.namedItem("description") as HTMLTextAreaElement).value =
      preset.description;
    (form.elements.namedItem("framework") as HTMLSelectElement).value =
      preset.framework;
    (form.elements.namedItem("complexity") as HTMLSelectElement).value =
      preset.complexity;
    (form.elements.namedItem("riskLevel") as HTMLSelectElement).value =
      preset.riskLevel;
    (form.elements.namedItem("acceptanceCriteria") as HTMLTextAreaElement).value =
      preset.acceptanceCriteria;
  }

  return (
    <form ref={formRef} action={formAction}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-fg-subtle">Load an example:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-md border border-line-strong bg-elevated px-2.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-5">
          <div>
            <Label htmlFor="title">Feature title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Add a pricing page with monthly/yearly toggle"
              defaultValue={values.title}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              required
            />
            <span id="title-error">
              <FieldError message={errors.title} />
            </span>
          </div>

          <div>
            <Label htmlFor="description">Requirement description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe what to build, the behaviour, and any constraints…"
              defaultValue={values.description}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "description-error" : undefined}
              required
            />
            <span id="description-error">
              <FieldError message={errors.description} />
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="framework">Target framework</Label>
              <Select id="framework" name="framework" defaultValue={values.framework || "nextjs"}>
                {FRAMEWORKS.map((f) => (
                  <option key={f} value={f}>
                    {FRAMEWORK_LABEL[f]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="complexity">Complexity</Label>
              <Select id="complexity" name="complexity" defaultValue={values.complexity || "medium"}>
                {COMPLEXITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="riskLevel">Risk level</Label>
              <Select id="riskLevel" name="riskLevel" defaultValue={values.riskLevel || "low"}>
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="acceptanceCriteria">Acceptance criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              name="acceptanceCriteria"
              rows={4}
              placeholder={"One per line —\nToggle updates all prices\nLayout is responsive"}
              defaultValue={values.acceptanceCriteria}
              aria-invalid={Boolean(errors.acceptanceCriteria)}
              aria-describedby="ac-help"
              required
            />
            <span id="ac-help">
              {errors.acceptanceCriteria ? (
                <FieldError message={errors.acceptanceCriteria} />
              ) : (
                <FieldHint>One criterion per line.</FieldHint>
              )}
            </span>
          </div>

          <div className="max-w-xs">
            <Label htmlFor="modelId">Model</Label>
            <Select id="modelId" name="modelId" defaultValue={MODELS[0].id}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} disabled={!m.ready}>
                  {m.label}
                  {m.ready ? "" : " — needs API key"}
                </option>
              ))}
            </Select>
            <FieldHint>Only the deterministic simulator runs without keys.</FieldHint>
          </div>
        </CardBody>
      </Card>

      <div className="mt-5 flex items-center gap-3">
        <SubmitButton />
        <span className="text-xs text-fg-subtle">
          Runs all 9 agent steps, then pauses for your approval.
        </span>
      </div>
    </form>
  );
}
