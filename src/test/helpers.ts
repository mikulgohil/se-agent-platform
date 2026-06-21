import type { EngineDeps } from "@/lib/engineering-agent/logger";
import type { EngineeringRequest } from "@/lib/engineering-agent/types";

/** Deterministic engine deps: fixed clock + counter ids (stable across runs). */
export function makeDeps(startMs = 0): EngineDeps {
  let n = 0;
  return {
    now: () => startMs,
    id: (prefix) => `${prefix}_${(++n).toString(36).padStart(3, "0")}`,
  };
}

export function makeRequest(
  overrides: Partial<EngineeringRequest> = {},
): EngineeringRequest {
  return {
    id: "req_test",
    title: "Add a pricing page with monthly/yearly toggle",
    description:
      "Responsive pricing page with three tiers and a monthly/yearly toggle.",
    framework: "nextjs",
    complexity: "medium",
    riskLevel: "low",
    acceptanceCriteria: [
      "Three tiers render",
      "Toggle updates prices",
      "Layout is responsive",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
