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
      { href: "/realisaties", label: "Realisaties", desc: "Bekijk gerealiseerde modellen" },
      { href: "/offerte", label: "Offerte aanvragen", desc: "Stuur uw plannen" },
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
      { href: "/realisaties", label: "Réalisations", desc: "Voir les modèles réalisés" },
      { href: "/offerte", label: "Demander un devis", desc: "Envoyez vos plans" },
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
      { href: "/realisaties", label: "Projects", desc: "See completed models" },
      { href: "/offerte", label: "Request a quote", desc: "Send your plans" },
      { href: "/#contact", label: "Contact", desc: "Send me a message" },
    ],
    home: "To home",
    searchHint: "or press ⌘K to search",
  },
  de: {
    eyebrow: "404 · nicht gefunden",
    titlePrefix: "Seite",
    titleSuffix: " existiert nicht.",
    intro:
      "Vielleicht ein veralteter Link oder ein Tippfehler. Versuchen Sie es mit einer dieser Seiten:",
    suggestions: [
      { href: "/", label: "Start", desc: "Von vorn beginnen" },
      { href: "/realisaties", label: "Referenzen", desc: "Umgesetzte Modelle ansehen" },
      { href: "/offerte", label: "Angebot anfordern", desc: "Senden Sie Ihre Pläne" },
      { href: "/#contact", label: "Kontakt", desc: "Schreiben Sie mir eine Nachricht" },
    ],
    home: "Zur Startseite",
    searchHint: "oder drücken Sie ⌘K, um zu suchen",
  },
  es: {
    eyebrow: "404 · no encontrada",
    titlePrefix: "página",
    titleSuffix: " no existe.",
    intro:
      "Quizá se trate de un enlace antiguo o de un error al escribir. Pruebe con una de estas:",
    suggestions: [
      { href: "/", label: "Inicio", desc: "Volver a empezar" },
      { href: "/realisaties", label: "Proyectos", desc: "Ver modelos realizados" },
      { href: "/offerte", label: "Solicitar presupuesto", desc: "Envíe sus planos" },
      { href: "/#contact", label: "Contacto", desc: "Envíeme un mensaje" },
    ],
    home: "Ir al inicio",
    searchHint: "o pulse ⌘K para buscar",
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
        <div className="wrap py-24 text-center sm:py-32 2xl:py-40">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {m.eyebrow}
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl 2xl:text-8xl">
            {m.titlePrefix}
            <span className="text-accent">.</span>
            {m.titleSuffix}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">{m.intro}</p>
          <ul className="mx-auto mt-10 grid max-w-md gap-2 text-left sm:max-w-3xl sm:grid-cols-2 xl:mt-14 xl:max-w-6xl xl:grid-cols-4 xl:gap-3">
            {m.suggestions.map((s) => (
              <li key={s.href}>
                <Link
                  href={localePath(locale, s.href)}
                  className="group flex h-full items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 transition-colors hover:bg-card-hover"
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
