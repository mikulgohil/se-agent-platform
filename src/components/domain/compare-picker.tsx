"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/field";

interface Option {
  id: string;
  title: string;
}

/** Two workflow selectors that drive the comparison via URL query params. */
export function ComparePicker({
  options,
  a,
  b,
}: {
  options: Option[];
  a?: string;
  b?: string;
}) {
  const router = useRouter();

  function update(next: { a?: string; b?: string }) {
    const params = new URLSearchParams();
    const na = next.a ?? a;
    const nb = next.b ?? b;
    if (na) params.set("a", na);
    if (nb) params.set("b", nb);
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-subtle">
          Baseline (A)
        </label>
        <Select value={a ?? ""} onChange={(e) => update({ a: e.target.value })}>
          <option value="">Select a run…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id} disabled={o.id === b}>
              {o.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-subtle">
          Candidate (B)
        </label>
        <Select value={b ?? ""} onChange={(e) => update({ b: e.target.value })}>
          <option value="">Select a run…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id} disabled={o.id === a}>
              {o.title}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
