import Link from "next/link";
import type { Metadata } from "next";
import { WifiOff, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline — Studio VM",
  description: "Geen internetverbinding gedetecteerd.",
};

export default function OfflinePage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border bg-card">
            <WifiOff className="h-7 w-7 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
            Geen verbinding
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Lijkt erop dat je offline bent.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">
            Geen paniek — je verloor enkel je internetverbinding. Probeer 't opnieuw
            zodra je terug online bent.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              Probeer opnieuw
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
