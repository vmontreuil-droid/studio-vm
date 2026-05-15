"use client";

import { useState, useTransition } from "react";
import { Search, Check, X, Loader2 } from "lucide-react";
import { checkDomain } from "@/app/actions/domain";
import type { DomainCheck } from "@/lib/openprovider";
import type { Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    title: string;
    placeholder: string;
    button: string;
    checking: string;
    free: (d: string) => string;
    taken: (d: string) => string;
    premium: (d: string) => string;
    invalid: string;
    error: string;
    cta: string;
  }
> = {
  nl: {
    title: "Is jouw domeinnaam nog vrij?",
    placeholder: "jouwzaak.be",
    button: "Check",
    checking: "Bezig…",
    free: (d) => `${d} is vrij — wij registreren het meteen voor je.`,
    taken: (d) => `${d} is al bezet. Is het van jou? Dan verhuizen we het.`,
    premium: (d) => `${d} is beschikbaar als premium-domein (afwijkende prijs).`,
    invalid: "Geef een geldige domeinnaam in (bv. jouwzaak.be).",
    error: "Even niet bereikbaar — laat het me weten, ik check het manueel.",
    cta: "Reserveer dit domein",
  },
  fr: {
    title: "Votre nom de domaine est-il encore libre ?",
    placeholder: "votresociete.be",
    button: "Vérifier",
    checking: "En cours…",
    free: (d) => `${d} est libre — nous l'enregistrons tout de suite pour vous.`,
    taken: (d) => `${d} est déjà pris. Il est à vous ? On le transfère.`,
    premium: (d) => `${d} est disponible en domaine premium (prix spécifique).`,
    invalid: "Entrez un nom de domaine valide (ex. votresociete.be).",
    error: "Indisponible un instant — dites-le-moi, je vérifie manuellement.",
    cta: "Réserver ce domaine",
  },
  en: {
    title: "Is your domain name still available?",
    placeholder: "yourbiz.be",
    button: "Check",
    checking: "Checking…",
    free: (d) => `${d} is free — we register it for you right away.`,
    taken: (d) => `${d} is already taken. Is it yours? Then we transfer it.`,
    premium: (d) => `${d} is available as a premium domain (special price).`,
    invalid: "Enter a valid domain name (e.g. yourbiz.be).",
    error: "Briefly unreachable — let me know, I'll check it manually.",
    cta: "Reserve this domain",
  },
};

export function DomainCheck({
  locale,
  contactHref,
}: {
  locale: Locale;
  contactHref: string;
}) {
  const t = T[locale];
  const [res, setRes] = useState<DomainCheck | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border bg-card p-6">
      <p className="mb-3 text-center font-semibold">{t.title}</p>
      <form
        action={(fd) =>
          start(async () => setRes(await checkDomain(fd)))
        }
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
          <input
            name="domain"
            required
            placeholder={t.placeholder}
            className="w-full rounded-full border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Search className="h-4 w-4" strokeWidth={2} />
          )}
          {pending ? t.checking : t.button}
        </button>
      </form>

      {res && (
        <div className="mt-4 text-sm">
          {res.ok ? (
            res.available ? (
              <p className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
                {res.premium ? t.premium(res.domain) : t.free(res.domain)}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <X className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
                {t.taken(res.domain)}
              </p>
            )
          ) : (
            <p className="text-muted">
              {res.error === "invalid" ? t.invalid : t.error}
            </p>
          )}
          {res.ok && (
            <a
              href={contactHref}
              className="mt-3 inline-flex rounded-full border px-4 py-2 text-xs font-medium transition-colors hover:bg-card-hover"
            >
              {t.cta}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
