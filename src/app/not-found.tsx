import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Home, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Niet gevonden — Studio VM",
};

const suggestions = [
  { href: "/", label: "Home", desc: "Begin opnieuw" },
  { href: "/#werk", label: "Werk", desc: "Bekijk recente projecten" },
  { href: "/pricing", label: "Pricing", desc: "Pakketten en abonnementen" },
  { href: "/#contact", label: "Contact", desc: "Stuur me een bericht" },
];

export default function NotFound() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            404 · niet gevonden
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
            <span className="text-accent">&lt;</span>page
            <span className="text-accent">/&gt;</span> bestaat niet.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">
            Misschien heb je een oude link, of typte iemand iets verkeerd. Probeer een
            van deze:
          </p>
          <ul className="mx-auto mt-10 max-w-md space-y-2 text-left">
            {suggestions.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="group flex items-center justify-between rounded-2xl border bg-card px-5 py-4 transition-colors hover:bg-card-hover"
                >
                  <div>
                    <p className="font-semibold tracking-tight">{s.label}</p>
                    <p className="font-mono text-xs text-muted">{s.desc}</p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-foreground"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <Home className="h-4 w-4" strokeWidth={2} />
              Naar home
            </Link>
            <p className="hidden items-center gap-2 self-center font-mono text-xs text-muted sm:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={2} />
              of druk ⌘K om te zoeken
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
