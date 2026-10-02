import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SITE } from "@/lib/seo";
import { fontKlassen } from "@/lib/fonts";
import { TAAL_HEADER, isValidLocale, type Locale } from "@/lib/i18n/config";
import { ThemaScript } from "@/components/thema-script";
import { AmbientBackdrop } from "@/components/ambient-backdrop";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotFoundInhoud } from "@/components/not-found-inhoud";

// Elke URL die geen route heeft, komt hier terecht (Next rendert dit
// bestand dan als volledige pagina, met status 404):
// - met een taal ervoor (/es/foo, /nl/kennis/bestaat-niet): de vertaalde
//   404 met header en footer. middleware.ts geeft de taal mee als
//   verzoekheader (TAAL_HEADER).
// - zonder taal (/wp-login.php, /BingSiteAuth.xml, /.env, /admin/x): de
//   meertalige 404 hieronder.
// Bewust geen [locale]/[...pad] met notFound(): een notFound() tijdens het
// renderen geeft in Next 16 een lege foutschil in de server-HTML; de
// vertaalde 404 verscheen pas na hydratatie.
// Vereist experimental.globalNotFound in next.config.ts, `dynamicParams =
// false` in [locale]/page.tsx en in [locale]/kennis/[slug]/page.tsx.

async function taal(): Promise<Locale | null> {
  const t = (await headers()).get(TAAL_HEADER);
  return isValidLocale(t) ? t : null;
}

const TITEL: Record<Locale, string> = {
  nl: "Pagina niet gevonden | Studio VM",
  fr: "Page introuvable | Studio VM",
  en: "Page not found | Studio VM",
  de: "Seite nicht gefunden | Studio VM",
  es: "Página no encontrada | Studio VM",
};

const NAAR_INHOUD: Record<Locale, string> = {
  nl: "Naar de inhoud",
  fr: "Aller au contenu",
  en: "Skip to content",
  de: "Zum Inhalt springen",
  es: "Ir al contenido",
};

export async function generateMetadata(): Promise<Metadata> {
  const l = await taal();
  return {
    metadataBase: new URL(SITE),
    title: l ? TITEL[l] : "404 — Studio VM",
    robots: { index: false, follow: false },
  };
}

const TALEN = [
  { href: "/nl", label: "Nederlands", lang: "nl" },
  { href: "/fr", label: "Français", lang: "fr" },
  { href: "/en", label: "English", lang: "en" },
  { href: "/de", label: "Deutsch", lang: "de" },
  { href: "/es", label: "Español", lang: "es" },
] as const;

export default async function GlobalNotFound() {
  const l = await taal();

  if (l) {
    return (
      <html lang={l} className={fontKlassen} suppressHydrationWarning>
        <head>
          <ThemaScript />
        </head>
        <body className="flex min-h-dvh flex-col font-sans antialiased">
          <AmbientBackdrop />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
          >
            {NAAR_INHOUD[l]}
          </a>
          <SiteHeader locale={l} />
          <div id="main" className="flex-1">
            <NotFoundInhoud locale={l} />
          </div>
          <SiteFooter locale={l} />
        </body>
      </html>
    );
  }

  return (
    <html lang="nl" className={fontKlassen} suppressHydrationWarning>
      <head>
        <ThemaScript />
      </head>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center font-sans antialiased">
        <p className="text-3xl font-bold tracking-tight">
          vm<span className="text-accent">.</span>
        </p>
        <h1 className="text-6xl font-semibold tracking-tight sm:text-8xl">
          404
        </h1>
        <p className="max-w-xl text-balance text-muted">
          Pagina niet gevonden · Page introuvable · Page not found · Seite nicht
          gefunden · Página no encontrada
        </p>
        <ul className="flex flex-wrap justify-center gap-2">
          {TALEN.map((t) => (
            <li key={t.href}>
              <a
                href={t.href}
                hrefLang={t.lang}
                lang={t.lang}
                className="inline-flex rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </body>
    </html>
  );
}
