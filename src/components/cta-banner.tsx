import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n/config";

export function CtaBanner({
  locale,
  eyebrow,
  title,
  sub,
  button,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  sub: string;
  button: string;
}) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-8 sm:p-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(36rem 26rem at 100% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 68%)",
            }}
          />
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">{sub}</p>
          <Link
            href={localePath(locale, "/#contact")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {button}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
