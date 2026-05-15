import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Home, Search } from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    titlePrefix: string;
    titleSuffix: string;
    intro: string;
    suggestions: { href: string; label: string; desc: string }[];
    home: string;
    searchHint: string;
  }
> = {
  nl: {
    eyebrow: "404 · niet gevonden",
    titlePrefix: "page",
    titleSuffix: " bestaat niet.",
    intro:
      "Misschien heb je een oude link, of typte iemand iets verkeerd. Probeer een van deze:",
    suggestions: [
      { href: "/", label: "Home", desc: "Begin opnieuw" },
      { href: "/#werk", label: "Werk", desc: "Bekijk recente projecten" },
      { href: "/pricing", label: "Pricing", desc: "Pakketten en abonnementen" },
      { href: "/#contact", label: "Contact", desc: "Stuur me een bericht" },
    ],
    home: "Naar home",
    searchHint: "of druk ⌘K om te zoeken",
  },
  fr: {
    eyebrow: "404 · introuvable",
    titlePrefix: "page",
    titleSuffix: " n'existe pas.",
    intro:
      "Peut-être un ancien lien, ou une faute de frappe. Essayez l'un de ceux-ci :",
    suggestions: [
      { href: "/", label: "Accueil", desc: "Recommencer" },
      { href: "/#werk", label: "Travaux", desc: "Voir les projets récents" },
      { href: "/pricing", label: "Tarifs", desc: "Forfaits et abonnements" },
      { href: "/#contact", label: "Contact", desc: "Envoyez-moi un message" },
    ],
    home: "Vers l'accueil",
    searchHint: "ou appuyez ⌘K pour rechercher",
  },
  en: {
    eyebrow: "404 · not found",
    titlePrefix: "page",
    titleSuffix: " does not exist.",
    intro:
      "Maybe an old link, or someone mistyped something. Try one of these:",
    suggestions: [
      { href: "/", label: "Home", desc: "Start over" },
      { href: "/#werk", label: "Work", desc: "See recent projects" },
      { href: "/pricing", label: "Pricing", desc: "Packages and subscriptions" },
      { href: "/#contact", label: "Contact", desc: "Send me a message" },
    ],
    home: "To home",
    searchHint: "or press ⌘K to search",
  },
};

export default async function NotFound() {
  const c = await cookies();
  const cookieLocale = c.get("locale")?.value;
  const locale: Locale = isValidLocale(cookieLocale)
    ? cookieLocale
    : DEFAULT_LOCALE;
  const m = copy[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {m.eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
            <span className="text-accent">&lt;</span>
            {m.titlePrefix}
            <span className="text-accent">/&gt;</span>
            {m.titleSuffix}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">{m.intro}</p>
          <ul className="mx-auto mt-10 max-w-md space-y-2 text-left">
            {m.suggestions.map((s) => (
              <li key={s.href}>
                <Link
                  href={localePath(locale, s.href)}
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
              href={localePath(locale, "/")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <Home className="h-4 w-4" strokeWidth={2} />
              {m.home}
            </Link>
            <p className="hidden items-center gap-2 self-center font-mono text-xs text-muted sm:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={2} />
              {m.searchHint}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
