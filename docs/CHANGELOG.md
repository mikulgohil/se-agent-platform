# Changelog

## 2026-06-21 — Roadmap: analytics & comparison

- **Summary:** Shipped the two remaining mock-data roadmap features. An
  **Analytics & evals** page (`/analytics`) treats each quality gate as an
  evaluator — score-over-runs trend, per-evaluator pass rates + average scores,
  and spend over time. A **Run comparison** page (`/compare`) diffs two runs side
  by side (quality gates, cost, tokens, timing) with green/red deltas.
- **Files touched:** `src/app/analytics/*`, `src/app/compare/*`,
  `src/components/domain/compare-picker.tsx`, `src/lib/store/*` (new
  `getEvalSummary`), `src/components/shell/{sidebar,command-palette}.tsx`,
  `README.md`, screenshots.
- **Decisions:** Reused the zero-dep SVG charts and existing components — no new
  dependencies. `getEvalSummary` added behind the `Repository` seam.
- **Deliberately not shipped:** real Claude adapter and Supabase implementation —
  both need external credentials to verify, so they remain documented seams
  rather than untested code.
- **Follow-ups:** model selector + dark/light theme.

## 2026-06-21 — Production UI v2

- **Summary:** Live SSE run streaming, agent DAG graph, span-waterfall trace,
  dashboard analytics (activity/tokens/sparklines), ⌘K command palette, Motion
  transitions, skeleton loaders, layered elevation tokens.
- **Decisions:** Charts/waterfall/graph hand-coded in SVG; only `motion` + `cmdk`
  added as runtime deps. See `docs/decisions/0001-visualization-and-streaming.md`.

## 2026-06-21 — Initial build

- **Summary:** Built Forge, the Software Engineering Agent Platform, end to end —
  typed runtime engine, four mock agents, quality gates, observability, human
  approval, PR artifacts, and the full App Router UI (dashboard, new request,
  workflow list + detail, artifacts, settings). Mock mode runs with zero keys.
- **Key decisions:**
  - `StepOutput` modeled as a discriminated union for fully-typed per-agent output.
  - Three seams — model, persistence, agents — so real Claude/Supabase plug in
    without app changes.
  - Engine takes injected `{ now, id }` deps; seeds run the real engine
    deterministically (incl. a retry-then-succeed and a hard-failed workflow).
  - Data pages are `force-dynamic` to reflect the mutable in-memory store.
- **Files touched:** `src/lib/engineering-agent/*`, `src/lib/store/*`,
  `src/components/*`, `src/app/*`, `supabase/schema.sql`, `README.md`,
  `docs/ARCHITECTURE.md`.
- **Follow-ups:** real Claude adapter, Supabase implementation, SSE step
  streaming, screenshots in `docs/screenshots/`.
