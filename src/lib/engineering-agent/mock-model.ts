/**
 * The model seam.
 *
 * Agents depend on a `ModelDescriptor` (id + pricing) and the shared token/cost
 * estimators below — never on "mock" directly. To run the platform against a
 * real provider you implement one `LanguageModel.generate()` (e.g. against the
 * Anthropic SDK) and register its descriptor; agents, runtime and UI are
 * untouched. See `docs/ARCHITECTURE.md` → "Plugging in a real LLM".
 */

export type ModelProvider = "mock" | "anthropic" | "openai";

export interface ModelPricing {
  /** USD per 1K input tokens. */
  inputPer1k: number;
  /** USD per 1K output tokens. */
  outputPer1k: number;
}

export interface ModelDescriptor {
  id: string;
  label: string;
  provider: ModelProvider;
  pricing: ModelPricing;
  /** Whether this model can actually run without extra credentials. */
  ready: boolean;
}

/**
 * The deterministic simulator is the only `ready` model — it needs no keys.
 * The Claude descriptors are real (id + public pricing) but gated behind
 * `ready: false` until an API key + adapter are wired in.
 */
export const MODELS: ModelDescriptor[] = [
  {
    id: "forge-sim-1",
    label: "Forge Sim (deterministic)",
    provider: "mock",
    pricing: { inputPer1k: 0.0008, outputPer1k: 0.0024 },
    ready: true,
  },
  {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    provider: "anthropic",
    pricing: { inputPer1k: 0.015, outputPer1k: 0.075 },
    ready: false,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    pricing: { inputPer1k: 0.003, outputPer1k: 0.015 },
    ready: false,
  },
];

export const DEFAULT_MODEL_ID = "forge-sim-1";

export function getModel(id: string): ModelDescriptor {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

/** Cheap, deterministic token estimate (~4 chars/token, +overhead). */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4) + 8);
}

export function estimateCost(
  model: ModelDescriptor,
  inputTokens: number,
  outputTokens: number,
): number {
  const cost =
    (inputTokens / 1000) * model.pricing.inputPer1k +
    (outputTokens / 1000) * model.pricing.outputPer1k;
  // round to 6 dp to keep numbers stable/serializable
  return Math.round(cost * 1e6) / 1e6;
}

/**
 * The interface a real provider implements. The deterministic agents in this
 * repo produce structured output directly (no text parsing), so they don't call
 * `generate` — but this is the contract a live adapter fulfils, and the type
 * the README references.
 */
export interface LanguageModel {
  readonly descriptor: ModelDescriptor;
  generate(req: {
    system: string;
    prompt: string;
  }): Promise<{ text: string; inputTokens: number; outputTokens: number }>;
}
