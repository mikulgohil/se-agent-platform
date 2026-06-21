import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { RequestForm } from "@/components/domain/request-form";

export const metadata: Metadata = { title: "New request" };

export default function NewRequestPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New engineering request"
        description="Describe a feature the way you'd brief an engineer. The agents take it from requirement analysis through to a PR-ready artifact."
      />
      <RequestForm />
    </div>
  );
}
