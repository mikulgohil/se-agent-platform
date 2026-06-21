# Changelog

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
