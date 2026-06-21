"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  IconDashboard,
  IconPlus,
  IconWorkflows,
  IconArtifact,
  IconSettings,
  IconGauge,
  IconBranch,
} from "@/components/ui/icons";

/** A button that opens the palette — for the topbar. */
export function CommandTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("forge:open-command"))}
      className="flex items-center gap-2 rounded-md border border-line-strong bg-elevated px-2.5 py-1.5 text-xs text-fg-subtle transition-colors hover:text-fg"
      aria-label="Open command palette"
    >
      <span>Search…</span>
      <kbd className="rounded border border-line bg-overlay px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
        ⌘K
      </kbd>
    </button>
  );
}

interface WorkflowLite {
  id: string;
  title: string;
  status: string;
}

const NAV = [
  { href: "/dashboard", label: "Go to Dashboard", icon: IconDashboard },
  { href: "/requests/new", label: "New request", icon: IconPlus },
  { href: "/workflows", label: "Go to Workflows", icon: IconWorkflows },
  { href: "/analytics", label: "Go to Analytics & evals", icon: IconGauge },
  { href: "/compare", label: "Compare runs", icon: IconBranch },
  { href: "/artifacts", label: "Go to Artifacts", icon: IconArtifact },
  { href: "/settings", label: "Go to Settings", icon: IconSettings },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowLite[]>([]);

  // ⌘K / Ctrl+K to toggle; custom event from the topbar button; Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("forge:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("forge:open-command", onOpen);
    };
  }, []);

  // Lazy-load the workflow list the first time the palette opens.
  useEffect(() => {
    if (open && workflows.length === 0) {
      fetch("/api/workflows")
        .then((r) => r.json())
        .then((data: WorkflowLite[]) => setWorkflows(data))
        .catch(() => {});
    }
  }, [open, workflows.length]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="animate-enter-up mx-auto mt-[14vh] w-[92%] max-w-xl overflow-hidden rounded-xl border border-line-strong bg-overlay shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-fg-subtle">
          <Command.Input
            autoFocus
            placeholder="Search or jump to…"
            className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-fg-subtle">
              No results.
            </Command.Empty>

            <Command.Group heading="Navigation">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Command.Item
                  key={href}
                  value={label}
                  onSelect={() => go(href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-fg-muted data-[selected=true]:bg-elevated data-[selected=true]:text-fg"
                >
                  <Icon className="text-fg-subtle" width={16} height={16} />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {workflows.length > 0 ? (
              <Command.Group heading="Workflows">
                {workflows.map((w) => (
                  <Command.Item
                    key={w.id}
                    value={`${w.title} ${w.id}`}
                    onSelect={() => go(`/workflows/${w.id}`)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-fg-muted data-[selected=true]:bg-elevated data-[selected=true]:text-fg"
                  >
                    <span className="truncate">{w.title}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-fg-subtle">
                      {w.status.replace(/_/g, " ")}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </Command.List>
          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[11px] text-fg-subtle">
            <span>↑↓ navigate · ↵ select · esc close</span>
            <span>⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
