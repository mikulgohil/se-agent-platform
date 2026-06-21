"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";

interface SubmitButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Submitted via `name`/`value` so multiple submit buttons can share a form. */
  name?: string;
  value?: string;
  pendingLabel?: string;
}

/** A submit button that reflects the enclosing form's pending state. */
export function SubmitButton({
  children,
  variant,
  size,
  name,
  value,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name={name} value={value} variant={variant} size={size} disabled={pending}>
      {pending ? <IconSpinner className="animate-spin" width={15} height={15} /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
