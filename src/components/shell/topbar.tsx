import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { CommandTrigger } from "@/components/shell/command-palette";
import { IconArrowRight, IconLogo, IconPlus } from "@/components/ui/icons";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg/80 px-6 backdrop-blur lg:px-10">
      {/* Mobile brand (sidebar is hidden < md) */}
      <Link href="/" className="flex items-center gap-2 md:hidden">
        <span className="text-accent">
          <IconLogo width={22} height={22} />
        </span>
        <span className="text-sm font-semibold tracking-tight">Forge</span>
      </Link>

      <div className="hidden items-center gap-3 md:flex">
        <CommandTrigger />
        <a
          href="https://github.com/mikulgohil/se-agent-platform"
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-2 py-1 text-sm text-fg-subtle transition-colors hover:text-fg"
        >
          Docs &amp; source
        </a>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ButtonLink href="/requests/new" size="sm">
          <IconPlus width={15} height={15} />
          New request
          <IconArrowRight width={14} height={14} className="opacity-70" />
        </ButtonLink>
      </div>
    </header>
  );
}
