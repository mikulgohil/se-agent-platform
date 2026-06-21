import { describe, it, expect } from "vitest";
import { parseRequestForm, engineeringRequestInput } from "./schema";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = {
  title: "Add a pricing page with a toggle",
  description: "A responsive pricing page with monthly/yearly billing toggle.",
  framework: "nextjs",
  complexity: "medium",
  riskLevel: "low",
  acceptanceCriteria: "Three tiers render\nToggle updates prices",
};

describe("parseRequestForm", () => {
  it("parses a valid form and splits criteria by line", () => {
    const result = parseRequestForm(form(valid));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.acceptanceCriteria).toEqual([
        "Three tiers render",
        "Toggle updates prices",
      ]);
      expect(result.data.framework).toBe("nextjs");
    }
  });

  it("strips list markers and blank lines from criteria", () => {
    const result = parseRequestForm(
      form({ ...valid, acceptanceCriteria: "- one\n\n* two\n• three\n" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.acceptanceCriteria).toEqual(["one", "two", "three"]);
    }
  });

  it("rejects a too-short title with a field error", () => {
    const result = parseRequestForm(form({ ...valid, title: "x" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title).toBeTruthy();
  });

  it("rejects an invalid framework enum", () => {
    const result = parseRequestForm(form({ ...valid, framework: "svelte" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.framework).toBeTruthy();
  });

  it("rejects when no acceptance criteria are provided", () => {
    const result = parseRequestForm(form({ ...valid, acceptanceCriteria: "  \n " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.acceptanceCriteria).toBeTruthy();
  });
});

describe("engineeringRequestInput", () => {
  it("is the single source of truth for the input shape", () => {
    const parsed = engineeringRequestInput.safeParse({
      ...valid,
      acceptanceCriteria: ["one"],
    });
    expect(parsed.success).toBe(true);
  });
});
