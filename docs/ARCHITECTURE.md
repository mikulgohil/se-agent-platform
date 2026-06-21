# Architecture

This document explains how Forge is put together and the decisions behind it.

## Goals

1. **Look and behave like a real agentic engineering tool**, not a chat demo.
2. **Run with zero configuration** so anyone can clone and explore it.
3. **Make the seams obvious** — swapping the mock model or in-memory store for
   real ones should be a contained change, not a rewrite.

## Layers

```
UI (App Router, RSC)
  → Server Actions (actions.ts)          ← trust boundary (Zod)
      → Repository (storage seam)
      → Runtime engine
          → Agents → Model (model seam)
          → Quality gates
          → Logger
          → Artifact builder
```

The UI never imports the runtime or the store internals directly for mutations —
it goes through Server Actions. Read paths (Server Components) call the
`Repository` interface.

## The domain model (`lib/engineering-agent/types.ts`)

Everything is **JSON-serializable**:

- **String-literal unions, not enums.** `as const` arrays double as both the type
  and the runtime list used to render selects.
- **ISO string timestamps, not `Date`.** No serialization surprises crossing the
  server/client boundary or landing in `jsonb`.
- **`StepOutput` is a discriminated union** keyed by `kind`. Each agent step
  carries a fully-typed, differently-shaped payload; the renderer narrows with a
  single `switch`. This is the type-system centerpiece — it makes adding a new
  step kind a compile-time-checked change end to end.

## The model seam (`lib/engineering-agent/mock-model.ts`)

Agents depend on a `ModelDescriptor` (id, provider, pricing, `ready`) and two
shared helpers — `estimateTokens` and `estimateCost` — never on "mock". The
`LanguageModel` interface is the contract a live provider implements.

In mock mode, agents generate structured output **directly** (deterministic,
no text parsing) and report token/cost estimated from the size of the synthetic
prompt and the serialized output. The numbers are therefore realistic without any
network call. To go live you implement `generate()` once and switch each agent to
call it with a Zod-validated structured response.

**Why deterministic mocks?** They make the demo reproducible, the seed data exercise
the exact same code path as live runs, and the timeline render identically on every
build (timing is synthesized from output size, not wall-clock).

## The agents (`lib/engineering-agent/agents/`)

Four agents implement a common `Agent` interface (`name`, `handles`, async `run`):

- **Planner** — requirement analysis, architecture planning, task breakdown.
- **Code** — implementation simulation (file changes + snippets).
- **QA** — test plan, accessibility checklist.
- **Review** — security review, performance review, PR recommendation.

`run` is async to mirror a real provider call; the mock resolves immediately. A
registry (`agents/index.ts`) maps each `StepKind` to its agent, so the runtime
never hard-codes which agent does what.

## The runtime (`lib/engineering-agent/runtime.ts`)

`runWorkflow` is a pure async function over its inputs — it returns new state and
persists nothing. It:

1. Builds the steps from the fixed `STEP_PLAN`.
2. Runs each in order, threading prior outputs forward as context.
3. Retries transient failures up to `maxAttempts`; on exhaustion the step fails,
   the workflow fails, and remaining steps are marked `skipped`.
4. Computes quality gates and the weighted quality score.
5. Pauses at `awaiting_approval`.

`decideApproval` applies the human decision: approve → `buildArtifact` +
`completed`; reject → `rejected`. Keeping these pure makes them trivial to test
and lets any storage adapter drive them.

### Injected dependencies

The engine takes `EngineDeps { now, id }`. Production passes a real clock and
collision-resistant ids; the seed passes a fixed clock and a deterministic
counter. This is what makes seeds reproducible and the engine testable.

## The storage seam (`lib/store/`)

`Repository` is the only storage contract the app knows. `MemoryStore` backs the
demo; `SupabaseRepository` is a documented skeleton implementing the same
interface. `store/index.ts` decides which to construct (today always in-memory),
caching the instance on `globalThis` so it survives dev HMR.

Because the domain model is already serializable, the Supabase mapping is direct:
structured payloads → `jsonb`, unions → `text` + `CHECK`. See `supabase/schema.sql`.

## Quality gates (`lib/engineering-agent/quality-gates.ts`)

Pure function: `(request, outputs) → QualityGate[]`. Each gate derives its score
from the agents' structured findings (e.g. Security risk drops with each
high-severity finding; Test coverage compares test count to a target). Same
inputs → same gates, always.

## Observability

`logger.ts` accumulates `WorkflowLog` entries during a run. Each step records
attempts, duration, tokens, and cost. The detail page surfaces all of it: a
timeline, a log stream, and a metrics strip.

## UI conventions

- **Server Components by default**; `"use client"` pushed to the leaves that need
  it (the form, the approval buttons, the copy-to-clipboard button).
- **Design tokens only** — semantic Tailwind v4 utilities (`bg-surface`,
  `text-fg-muted`, `border-line`) driven by `@theme`, no hard-coded colors.
- **Accessibility**: semantic HTML, labelled inputs, `aria-invalid` on errors,
  visible focus rings, `prefers-reduced-motion` respected, expandable steps use
  native `<details>` (keyboard-accessible, no JS).

## Trade-offs

- **In-memory store** keeps the demo zero-config but is per-process and
  non-durable. Acceptable for a showcase; Supabase is the documented next step.
- **Synchronous runs** (the whole pipeline executes within the Server Action)
  keep the code simple. Live streaming via SSE is on the roadmap.
- **Deterministic mock agents** trade "real intelligence" for reproducibility and
  zero cost — the right call for a demo whose point is the *architecture*.
