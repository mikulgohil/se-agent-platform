import type { QualityGate } from "@/lib/engineering-agent/types";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { GateStatusBadge } from "@/components/domain/status";
import { ScoreBar } from "@/components/domain/score-ring";

export function QualityGatesPanel({ gates }: { gates: QualityGate[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Quality gates</CardTitle>
        <span className="text-xs text-fg-subtle">{gates.length} checks</span>
      </CardHeader>
      <CardBody className="space-y-4">
        {gates.map((gate) => (
          <div key={gate.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-fg">{gate.name}</span>
              <GateStatusBadge status={gate.status} />
            </div>
            <div className="mt-1.5">
              <ScoreBar score={gate.score} />
            </div>
            <p className="mt-1 text-xs text-fg-subtle">{gate.explanation}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
