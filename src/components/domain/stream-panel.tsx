"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlay, IconSpinner, IconCheck } from "@/components/ui/icons";
import { formatCompact, formatCost, formatDuration } from "@/lib/utils";

type Level = "debug" | "info" | "warn" | "error";
interface Line {
  id: number;
  level: Level;
  message: string;
}
type Phase = "idle" | "streaming" | "done";

const LEVEL_COLOR: Record<Level, string> = {
  debug: "text-fg-subtle",
  info: "text-info",
  warn: "text-warning",
  error: "text-danger",
};

export function StreamPanel({ workflowId }: { workflowId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [tokens, setTokens] = useState(0);
  const [cost, setCost] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState<{ index: number; total: number; name: string }>({
    index: 0,
    total: 9,
    name: "",
  });
  const [final, setFinal] = useState<{ status: string; qualityScore: number } | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const lineId = useRef(0);

  const cleanup = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // auto-scroll the terminal to the newest line
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  const start = useCallback(() => {
    cleanup();
    setLines([]);
    setTokens(0);
    setCost(0);
    setElapsed(0);
    setFinal(null);
    setPhase("streaming");
    lineId.current = 0;

    const startedAt = Date.now();
    timerRef.current = setInterval(() => setElapsed(Date.now() - startedAt), 100);

    const es = new EventSource(`/api/workflows/${workflowId}/stream`);
    esRef.current = es;

    es.addEventListener("log", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLines((prev) => [...prev, { id: lineId.current++, level: d.level, message: d.message }]);
    });
    es.addEventListener("progress", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setTokens(d.tokens);
      setCost(d.cost);
      setStep({ index: d.index, total: d.total, name: d.name });
    });
    es.addEventListener("done", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setFinal({ status: d.status, qualityScore: d.qualityScore });
      setTokens(d.tokens);
      setCost(d.cost);
      setPhase("done");
      cleanup();
    });
    es.onerror = () => {
      setPhase("done");
      cleanup();
    };
  }, [workflowId, cleanup]);

  const progressPct =
    phase === "done" ? 100 : Math.round(((step.index + (phase === "streaming" ? 0.5 : 0)) / step.total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Live trace</CardTitle>
        <div className="flex items-center gap-4 text-xs tabular-nums text-fg-subtle">
          <span title="elapsed">{formatDuration(elapsed)}</span>
          <span title="tokens" className="text-fg-muted">
            {formatCompact(tokens)} tok
          </span>
          <span title="cost">{formatCost(cost)}</span>
        </div>
      </CardHeader>
      <CardBody>
        {phase === "idle" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="max-w-sm text-sm text-fg-muted">
              Replay this run as a live server-sent stream — watch each agent
              execute with a real-time token and cost counter.
            </p>
            <Button onClick={start} size="sm">
              <IconPlay width={14} height={14} />
              Watch run
            </Button>
          </div>
        ) : (
          <>
            {/* progress header */}
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-fg-muted">
                {phase === "streaming" ? (
                  <IconSpinner className="animate-spin text-info" width={14} height={14} />
                ) : (
                  <IconCheck className="text-success" width={14} height={14} />
                )}
                {phase === "streaming"
                  ? `Step ${step.index + 1}/${step.total} · ${step.name}`
                  : `Finished — ${final?.status?.replace(/_/g, " ")} · quality ${final?.qualityScore}`}
              </span>
              <button
                onClick={start}
                className="text-fg-subtle transition-colors hover:text-fg"
              >
                ↻ replay
              </button>
            </div>
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-line-strong">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* terminal */}
            <div
              ref={logRef}
              className="h-64 overflow-y-auto rounded-md border border-line bg-inset p-3 font-mono text-xs leading-relaxed"
            >
              {lines.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={LEVEL_COLOR[l.level]}
                >
                  <span className="select-none text-fg-subtle">$ </span>
                  {l.message}
                </motion.div>
              ))}
              {phase === "streaming" ? (
                <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-status-pulse bg-accent" />
              ) : null}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
