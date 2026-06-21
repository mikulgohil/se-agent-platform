import { z } from "zod";
import { FRAMEWORKS, COMPLEXITIES, RISK_LEVELS } from "./types";

/**
 * Input validation for the "new request" form. Server Actions are public
 * endpoints, so this schema is the trust boundary — the UI uses the same
 * shape for client-side hints.
 */
export const engineeringRequestInput = z.object({
  title: z
    .string()
    .trim()
    .min(6, "Give the request a descriptive title (6+ characters).")
    .max(120, "Keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Describe the requirement in a sentence or two (20+ characters).")
    .max(4000, "That description is very long — trim it under 4000 characters."),
  framework: z.enum(FRAMEWORKS),
  complexity: z.enum(COMPLEXITIES),
  riskLevel: z.enum(RISK_LEVELS),
  acceptanceCriteria: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one acceptance criterion.")
    .max(12, "Keep acceptance criteria focused (12 or fewer)."),
});

export type EngineeringRequestInput = z.infer<typeof engineeringRequestInput>;

/**
 * Parse raw FormData (from a Server Action) into a validated input.
 * Acceptance criteria arrive as repeated fields or a newline-delimited textarea.
 */
export function parseRequestForm(formData: FormData):
  | { ok: true; data: EngineeringRequestInput }
  | { ok: false; errors: Record<string, string> } {
  const rawCriteria = formData.get("acceptanceCriteria");
  const acceptanceCriteria =
    typeof rawCriteria === "string"
      ? rawCriteria
          .split("\n")
          .map((line) => line.replace(/^[-*•\s]+/, "").trim())
          .filter(Boolean)
      : [];

  const candidate = {
    title: formData.get("title"),
    description: formData.get("description"),
    framework: formData.get("framework"),
    complexity: formData.get("complexity"),
    riskLevel: formData.get("riskLevel"),
    acceptanceCriteria,
  };

  const result = engineeringRequestInput.safeParse(candidate);
  if (result.success) return { ok: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
