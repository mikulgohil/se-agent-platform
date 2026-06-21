import type { FileChange, StepKind, StepOutput } from "../types";
import {
  type Agent,
  type AgentContext,
  type AgentRunResult,
  buildPromptDigest,
  byComplexity,
  featureName,
  findOutput,
  frameworkPaths,
  outputTokens,
  slugify,
} from "./shared";

const SYSTEM =
  "You are the Code agent. Propose concrete, minimal file changes that satisfy the plan.";

function primarySnippet(name: string, framework: string): string {
  if (framework === "node" || framework === "typescript") {
    return [
      `export interface ${name.replace(/\s+/g, "")}Options {`,
      "  /* typed inputs */",
      "}",
      "",
      `export function create${name.replace(/\s+/g, "")}(opts: ${name.replace(/\s+/g, "")}Options) {`,
      "  // validated, framework-idiomatic implementation",
      "}",
    ].join("\n");
  }
  return [
    `export function ${name.replace(/\s+/g, "")}({ ... }: ${name.replace(/\s+/g, "")}Props) {`,
    "  // server-first; interaction state pushed to the leaf",
    "  return (",
    "    <section aria-labelledby=\"heading\">",
    "      {/* responsive layout using existing tokens */}",
    "    </section>",
    "  );",
    "}",
  ].join("\n");
}

function implementation(ctx: AgentContext): StepOutput {
  const { request } = ctx;
  const paths = frameworkPaths(request.framework);
  const slug = slugify(request.title);
  const name = featureName(request);
  const tasks = findOutput(ctx.priorOutputs, "task_breakdown")?.tasks ?? [];

  const fileChanges: FileChange[] = [
    {
      path: `${paths.componentDir}/${slug}/${slug}.${paths.ext}`,
      kind: "added",
      additions: byComplexity(request.complexity, { small: 64, medium: 118, large: 184 }),
      deletions: 0,
      summary: `Primary ${name} surface with typed props and responsive layout.`,
      snippet: primarySnippet(name, request.framework),
    },
    {
      path: `${paths.componentDir}/${slug}/index.ts`,
      kind: "added",
      additions: 3,
      deletions: 0,
      summary: "Barrel export for the feature module.",
    },
    {
      path: `${paths.routeDir}/${slug === "feature" ? "page" : slug}.${paths.ext}`,
      kind: "modified",
      additions: 14,
      deletions: 2,
      summary: "Wire the feature into routing/navigation.",
    },
  ];

  if (request.complexity !== "small") {
    fileChanges.push({
      path: `${paths.componentDir}/${slug}/use-${slug}.ts`,
      kind: "added",
      additions: 42,
      deletions: 0,
      summary: "Extract interaction logic into a typed hook/utility.",
    });
  }
  if (request.complexity === "large") {
    fileChanges.push({
      path: `${paths.componentDir}/${slug}/types.ts`,
      kind: "added",
      additions: 28,
      deletions: 0,
      summary: "Shared types + a thin data-access boundary.",
    });
  }

  return {
    kind: "implementation",
    summary: `Proposed ${fileChanges.length} file change(s) implementing ${tasks.length || "the planned"} task(s) — ${fileChanges.reduce((a, f) => a + f.additions, 0)} additions.`,
    fileChanges,
    notes: [
      "Reused existing UI primitives and design tokens — no new style layer.",
      request.framework === "nextjs"
        ? "Kept the page a Server Component; only the interactive leaf is a Client Component."
        : "Kept side effects isolated and the public surface small and typed.",
      "No new dependencies introduced.",
    ],
  };
}

export const codeAgent: Agent = {
  name: "code",
  handles: ["implementation"],
  async run(kind: StepKind, ctx: AgentContext): Promise<AgentRunResult> {
    if (kind !== "implementation") {
      throw new Error(`code-agent cannot handle step "${kind}"`);
    }
    ctx.log("info", "Proposing file changes from the approved task breakdown.");
    const output = implementation(ctx);
    ctx.log("debug", `Generated ${(output as { fileChanges: unknown[] }).fileChanges.length} file changes.`);
    return {
      output,
      inputTokens: buildPromptDigest(ctx, SYSTEM),
      outputTokens: outputTokens(output),
    };
  },
};
