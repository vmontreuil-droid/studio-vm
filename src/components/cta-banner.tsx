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
      <div className="wrap py-16 sm:py-20">
        <div className="relative isolate overflow-hidden rounded-3xl border bg-card p-8 sm:p-12 lg:flex lg:items-end lg:justify-between lg:gap-12 xl:p-16">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(48rem 30rem at 100% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 68%)",
            }}
          />
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {eyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:max-w-3xl xl:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted xl:max-w-2xl xl:text-lg">{sub}</p>
          </div>
          <Link
            href={localePath(locale, "/offerte")}
            className="mt-8 inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 lg:mt-0 xl:px-8 xl:py-4 xl:text-base"
          >
            {button}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
