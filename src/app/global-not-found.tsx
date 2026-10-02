import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/seo";
import { fontKlassen } from "@/lib/fonts";
import { ThemaScript } from "@/components/thema-script";

// Voor adressen zonder geldige taal als eerste segment (/wp-login.php,
// /BingSiteAuth.xml, /.env): daar roept de [locale]-root layout zelf
// notFound() aan, dus er is geen layout om een 404 in te tonen.
// Vereist experimental.globalNotFound in next.config.ts én
// `dynamicParams = false` in [locale]/page.tsx (niet in de layout): anders
// matcht /wp-login.php de route /[locale] en toont Next zijn eigen kale 404.
// Diepere onbekende adressen (/wp-admin/x.php) matchen /[locale]/[...pad] en
// krijgen ook die kale 404, wel met status 404.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "404 — Studio VM",
  robots: { index: false, follow: false },
};

const TALEN = [
  { href: "/nl", label: "Nederlands", lang: "nl" },
  { href: "/fr", label: "Français", lang: "fr" },
  { href: "/en", label: "English", lang: "en" },
  { href: "/de", label: "Deutsch", lang: "de" },
  { href: "/es", label: "Español", lang: "es" },
] as const;

export default function GlobalNotFound() {
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
