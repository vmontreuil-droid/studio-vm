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
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden bg-foreground px-8 py-16 text-background sm:px-14 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 85% 20%, color-mix(in oklab, var(--accent) 45%, transparent), transparent 60%)",
          }}
        />
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-background/70 sm:text-lg">
          {sub}
        </p>
        <Link
          href={localePath(locale, "/#contact")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
        >
          {button}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
