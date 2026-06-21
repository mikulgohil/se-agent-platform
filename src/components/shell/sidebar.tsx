"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import {
  IconDashboard,
  IconPlus,
  IconWorkflows,
  IconArtifact,
  IconSettings,
  IconLogo,
  IconGauge,
  IconBranch,
} from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/requests/new", label: "New request", icon: IconPlus },
  { href: "/workflows", label: "Workflows", icon: IconWorkflows },
  { href: "/analytics", label: "Analytics", icon: IconGauge },
  { href: "/compare", label: "Compare", icon: IconBranch },
  { href: "/artifacts", label: "Artifacts", icon: IconArtifact },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        <span className="text-accent">
          <IconLogo width={26} height={26} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-fg">Forge</div>
          <div className="text-[11px] text-fg-subtle">Agent Platform</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-elevated text-fg"
                  : "text-fg-muted hover:bg-elevated hover:text-fg",
              )}
            >
              <Icon className={cn(active ? "text-accent" : "text-fg-subtle")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-line bg-elevated px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-fg">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-ring" />
          Mock mode
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-fg-subtle">
          Agents run deterministically. Plug in a real LLM via the adapter seam.
        </p>
      </div>
    </aside>
  );
}
