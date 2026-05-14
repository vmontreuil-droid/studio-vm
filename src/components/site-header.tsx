import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
          studio-vm
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/#werk"
            className="text-muted transition-colors hover:text-foreground"
          >
            Werk
          </Link>
          <Link
            href="/#mogelijkheden"
            className="text-muted transition-colors hover:text-foreground"
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
        </nav>
      </div>
    </header>
  );
}
