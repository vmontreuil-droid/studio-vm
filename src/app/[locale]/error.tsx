"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const copy: Record<
  Locale,
  { eyebrow: string; title: string; body: string; retry: string; home: string }
> = {
  nl: {
    eyebrow: "Er ging iets mis",
    title: "Oeps — daar liep iets fout.",
    body: "Er gebeurde een onverwachte fout. Probeer 't opnieuw, of ga terug naar de homepage. De fout is gelogd.",
    retry: "Probeer opnieuw",
    home: "Naar home",
  },
  fr: {
    eyebrow: "Une erreur est survenue",
    title: "Oups — quelque chose a mal tourné.",
    body: "Une erreur inattendue s'est produite. Réessayez, ou retournez à l'accueil. L'erreur a été enregistrée.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
  en: {
    eyebrow: "Something went wrong",
    title: "Oops — something broke.",
    body: "An unexpected error occurred. Try again, or go back to the homepage. The error has been logged.",
    retry: "Try again",
    home: "To home",
  },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = copy[locale];

  useEffect(() => {
    console.error("[studio-vm] route error:", error);
  }, [error]);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border bg-card">
            <AlertTriangle className="h-7 w-7 text-accent" strokeWidth={1.5} />
          </div>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">{c.body}</p>
          {error.digest && (
            <p className="mt-3 font-mono text-[10px] text-muted">
              ref: {error.digest}
            </p>
          )}
          <div className="mt-10 flex justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              {c.retry}
            </button>
            <a
              href={localePath(locale, "/")}
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
            >
              {c.home}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
