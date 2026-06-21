import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-5xl font-semibold tracking-tight text-fg">404</div>
      <p className="mt-3 max-w-sm text-sm text-fg-muted">
        That page doesn&apos;t exist. The workflow or artifact may have been
        removed, or the link is wrong.
      </p>
      <div className="mt-6 flex gap-2">
        <ButtonLink href="/dashboard" size="sm">
          Go to dashboard
        </ButtonLink>
        <ButtonLink href="/workflows" variant="secondary" size="sm">
          View workflows
        </ButtonLink>
      </div>
    </div>
  );
}
