# 1. Visualization, streaming, and the libraries behind them

Date: 2026-06-21
Status: Accepted

## Context

The v1 app worked and was tested, but read as "simple": flat surfaces, numbers
without trends, and a run that completed instantly with no sense of agents
working. To present as a production-grade agent platform (the bar set by
LangSmith, LangGraph Studio, Langfuse, Vercel), it needed data visualization, a
trace view, an agent graph, live streaming, and keyboard-first navigation —
without abandoning the zero-config mock-mode demo or the clean seams.

## Decision

**Charts, waterfall, sparklines, and the agent DAG are hand-coded in SVG** rather
than pulling in a charting/graph library.

- Considered: Recharts (~70 KB), Tremor (~120 KB, wraps Recharts), Highcharts
  (rejected — source-available/commercial, not free for OSS), React Flow /
  `@xyflow/react` (~50 KB) for the DAG.
- For sparklines, small area/bar charts, a span waterfall, and a fixed 4-node
  pipeline graph, the SVG math is ~30–80 lines each, renders in Server
  Components with no client JS, and stays dependency-free. The "I built the
  renderer" signal is also stronger for an engineering portfolio than "I imported
  a chart."

**Live streaming uses real Server-Sent Events**, not a fake client animation.

- A Next route handler (`/api/workflows/[id]/stream`) returns a
  `text/event-stream` `ReadableStream` and the client consumes it with the native
  `EventSource` API and named events (`log`, `progress`, `done`).
- It *replays* a completed run with paced timing — an honest way to demo
  server-push streaming on deterministic mock data, exercising the exact pattern
  a live agent platform uses.

**Two client libraries were added** where hand-rolling is not worth it:

- `motion` (motion.dev, MIT, ~30 KB, React 19-ready) — page transitions
  (`template.tsx`) and streamed-log line entry. ~90% smaller than GSAP.
- `cmdk` (MIT, ~15 KB) — the ⌘K command palette. Building an accessible,
  filterable palette from scratch is error-prone; cmdk is the de-facto standard.

**New analytics data lives behind the `Repository` seam** (`getActivitySeries`,
`getTokensByAgent`) — deterministic synthetic history in mock mode, an aggregate
SQL query in the documented Supabase adapter.

## Consequences

- **Positive:** App now reads as a telemetry/observability product. Only ~45 KB
  of new runtime deps (motion + cmdk); everything visual is zero-dep SVG/CSS.
  Streaming is genuinely SSE, so it demonstrates real infra competence. Server
  Components and the storage seam are preserved.
- **Negative:** The app is no longer "zero runtime deps beyond React." The SSE
  endpoint and synthetic analytics are replay/seeded (not driven by a live
  engine run) — acceptable for a mock-mode demo, called out in the README.
- **Follow-ups:** Run-vs-run comparison and an evals/score-over-time page were
  scoped out of this pass (see roadmap). A real Claude adapter would let the SSE
  stream emit true token deltas instead of replayed ones.
