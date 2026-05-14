import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchTrigger } from "@/components/search";
import { MobileMenu } from "@/components/mobile-menu";
import { primaryNav } from "@/lib/nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          aria-label="Studio VM"
          className="font-mono text-base font-semibold tracking-tight"
        >
          <span className="text-accent">&lt;</span>
          vm
          <span className="text-accent">/&gt;</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SearchTrigger />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
