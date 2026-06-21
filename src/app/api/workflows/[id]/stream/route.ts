import { getRepository } from "@/lib/store";
import { AGENT_META } from "@/lib/engineering-agent/agents";

export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Server-Sent Events endpoint that replays a completed run progressively, so the
 * UI can show agents "working" in real time. Real SSE (text/event-stream +
 * EventSource on the client), paced for watchability rather than wall-clock.
 *
 * Events: `log` (terminal line), `progress` (step state + cumulative counters),
 * `done` (final status). Demoable on mock data — no live LLM needed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repo = await getRepository();
  const detail = await repo.getWorkflowDetail(id);
  if (!detail) return new Response("not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      let cumTokens = 0;
      let cumCost = 0;

      send("log", { level: "info", message: `▶ Starting run ${detail.workflow.id}` });
      await sleep(300);

      for (let i = 0; i < detail.steps.length; i++) {
        const step = detail.steps[i];
        const agentLabel = AGENT_META[step.agentName].label;
        const active = step.status !== "skipped" && step.status !== "pending";

        send("progress", {
          index: i,
          total: detail.steps.length,
          name: step.name,
          agent: step.agentName,
          status: "running",
          tokens: cumTokens,
          cost: cumCost,
        });
        send("log", {
          level: "info",
          message: `[${agentLabel}] ${step.name}…`,
          step: step.id,
        });

        // emit this step's own logs, lightly paced
        const stepLogs = detail.logs.filter((l) => l.stepId === step.id);
        for (const l of stepLogs) {
          await sleep(active ? 160 : 40);
          send("log", { level: l.level, message: `  ${l.message}`, step: step.id });
        }

        await sleep(active ? 520 : 90);

        cumTokens += step.tokensEstimate;
        cumCost = Math.round((cumCost + step.costEstimate) * 1e6) / 1e6;

        send("progress", {
          index: i,
          total: detail.steps.length,
          name: step.name,
          agent: step.agentName,
          status: step.status,
          tokens: cumTokens,
          cost: cumCost,
          duration:
            step.startedAt && step.completedAt
              ? new Date(step.completedAt).getTime() -
                new Date(step.startedAt).getTime()
              : null,
        });
      }

      await sleep(250);
      send("done", {
        status: detail.workflow.status,
        qualityScore: detail.workflow.qualityScore,
        tokens: cumTokens,
        cost: cumCost,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
