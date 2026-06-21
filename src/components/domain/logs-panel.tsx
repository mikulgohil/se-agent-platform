import type { LogLevel, WorkflowLog } from "@/lib/engineering-agent/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "text-fg-subtle",
  info: "text-info",
  warn: "text-warning",
  error: "text-danger",
};

function clockTime(iso: string): string {
  // HH:MM:SS slice of the ISO string — deterministic, no locale dependency.
  return iso.slice(11, 19);
}

export function LogsPanel({ logs }: { logs: WorkflowLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Logs</CardTitle>
        <span className="text-xs text-fg-subtle">{logs.length} entries</span>
      </CardHeader>
      <div className="max-h-80 overflow-y-auto px-2 py-2 font-mono text-xs">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex gap-2.5 rounded px-2 py-1 hover:bg-elevated"
          >
            <span className="shrink-0 text-fg-subtle tabular-nums">
              {clockTime(log.timestamp)}
            </span>
            <span className={`w-10 shrink-0 uppercase ${LEVEL_COLOR[log.level]}`}>
              {log.level}
            </span>
            <span className="text-fg-muted">{log.message}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
