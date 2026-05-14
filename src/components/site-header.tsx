import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          aria-label="Studio VM"
          className="font-mono text-base font-semibold tracking-tight"
        >
          <span className="text-accent">&lt;</span>
          vm
          <span className="text-accent">/&gt;</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-6">
          <Link
            href="/#werk"
            className="hidden text-muted transition-colors hover:text-foreground sm:inline"
          >
            Werk
          </Link>
          <Link
            href="/#mogelijkheden"
            className="hidden text-muted transition-colors hover:text-foreground sm:inline"
          >
            Mogelijkheden
          </Link>
          <Link
            href="/pricing"
            className="text-muted transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/#contact"
            className="text-muted transition-colors hover:text-foreground"
          >
            Contact
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
