import type {
  AgentName,
  Complexity,
  EngineeringRequest,
  Framework,
  LogLevel,
  StepKind,
  StepOutput,
} from "../types";
import type { ModelDescriptor } from "../mock-model";
import { estimateTokens } from "../mock-model";

export interface AgentContext {
  request: EngineeringRequest;
  model: ModelDescriptor;
  /** Outputs of all previously-completed steps, in order. */
  priorOutputs: StepOutput[];
  /** Scoped to the current step by the runtime. */
  log: (level: LogLevel, message: string) => void;
  /** Deterministic id factory (so seeds are stable). */
  id: (prefix: string) => string;
}

export interface AgentRunResult {
  output: StepOutput;
  inputTokens: number;
  outputTokens: number;
}

export interface Agent {
  readonly name: AgentName;
  readonly handles: StepKind[];
  /**
   * Async to mirror a real provider call. The deterministic agents resolve
   * immediately; a live adapter would await `model.generate(...)`.
   */
  run(kind: StepKind, ctx: AgentContext): Promise<AgentRunResult>;
}

/** Typed lookup of a prior step output by its discriminant. */
export function findOutput<K extends StepOutput["kind"]>(
  outputs: StepOutput[],
  kind: K,
): Extract<StepOutput, { kind: K }> | undefined {
  return outputs.find((o) => o.kind === kind) as
    | Extract<StepOutput, { kind: K }>
    | undefined;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "feature";
}

/** A reasonable base directory + extension per target framework. */
export function frameworkPaths(framework: Framework): {
  componentDir: string;
  routeDir: string;
  testDir: string;
  ext: string;
} {
  switch (framework) {
    case "nextjs":
      return {
        componentDir: "src/components",
        routeDir: "src/app",
        testDir: "src/__tests__",
        ext: "tsx",
      };
    case "react":
      return {
        componentDir: "src/components",
        routeDir: "src/pages",
        testDir: "src/__tests__",
        ext: "tsx",
      };
    case "node":
      return {
        componentDir: "src/services",
        routeDir: "src/routes",
        testDir: "test",
        ext: "ts",
      };
    case "typescript":
      return {
        componentDir: "src/lib",
        routeDir: "src",
        testDir: "test",
        ext: "ts",
      };
  }
}

/** Scale a value by complexity — used to size task lists, file counts, etc. */
export function byComplexity<T>(
  complexity: Complexity,
  values: { small: T; medium: T; large: T },
): T {
  return values[complexity];
}

/** A short synthetic "prompt" string so input-token estimates are realistic. */
export function buildPromptDigest(
  ctx: AgentContext,
  system: string,
): number {
  const { request, priorOutputs } = ctx;
  const prior = priorOutputs.map((o) => `${o.kind}:${o.summary}`).join("\n");
  const prompt = [
    system,
    `Title: ${request.title}`,
    `Description: ${request.description}`,
    `Framework: ${request.framework}  Complexity: ${request.complexity}  Risk: ${request.riskLevel}`,
    `Acceptance:\n${request.acceptanceCriteria.join("\n")}`,
    prior,
  ].join("\n");
  return estimateTokens(prompt);
}

export function outputTokens(output: StepOutput): number {
  return estimateTokens(JSON.stringify(output));
}

/** Title-cased feature noun derived from the request, e.g. "Pricing Page". */
export function featureName(request: EngineeringRequest): string {
  return request.title.replace(/\b\w/g, (c) => c.toUpperCase());
}
