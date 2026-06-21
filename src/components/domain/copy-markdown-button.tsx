"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";

/** Copies the pre-rendered markdown to the clipboard with transient feedback. */
export function CopyMarkdownButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy} type="button">
      {copied ? <IconCheck width={15} height={15} className="text-success" /> : null}
      {copied ? "Copied" : "Copy as Markdown"}
    </Button>
  );
}
