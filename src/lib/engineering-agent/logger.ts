import type { LogLevel, WorkflowLog } from "./types";

export interface EngineDeps {
  /** Milliseconds since epoch. Injected so seeds are deterministic. */
  now: () => number;
  /** Monotonic-ish id factory, prefixed by entity kind. */
  id: (prefix: string) => string;
}

export interface RuntimeLogger {
  log(
    level: LogLevel,
    message: string,
    opts?: {
      stepId?: string | null;
      metadata?: Record<string, string | number | boolean>;
    },
  ): void;
  entries: WorkflowLog[];
}

/** Create a logger that accumulates entries for a single workflow run. */
export function createLogger(
  deps: EngineDeps,
  workflowId: string,
): RuntimeLogger {
  const entries: WorkflowLog[] = [];
  return {
    entries,
    log(level, message, opts) {
      entries.push({
        id: deps.id("log"),
        workflowId,
        stepId: opts?.stepId ?? null,
        level,
        message,
        timestamp: new Date(deps.now()).toISOString(),
        metadata: opts?.metadata,
      });
    },
  };
}
