import type { Metadata } from "next";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE } from "@/lib/seo";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { fontKlassen } from "@/lib/fonts";
import { ThemaScript } from "@/components/thema-script";
import { AmbientBackdrop } from "@/components/ambient-backdrop";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { SiteChrome } from "@/components/site-chrome";
import { PageViewTracker } from "@/components/page-view-tracker";

// Root layout van de publieke site en het klantenportaal. Hij staat onder
// [locale], zodat <html lang> al in de server-HTML klopt. Geen headers(),
// cookies() of searchParams hier: dan wordt de hele site per request
// gerenderd in plaats van statisch. Geen dynamicParams = false: dan geven
// /factuur/[token] en /portail/[token] altijd 404.

const NAAR_INHOUD: Record<Locale, string> = {
  nl: "Naar de inhoud",
  fr: "Aller au contenu",
  en: "Skip to content",
  de: "Zum Inhalt springen",
  es: "Ir al contenido",
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const m = getMessages(locale);
  // Geen canonical hier: elke pagina zet haar eigen adres + taalvarianten
  // (zie talen() in lib/seo). Op layoutniveau zou elke pagina zonder eigen
  // alternates naar de startpagina wijzen.
  // Om dezelfde reden geen openGraph.title/description/url: die zet elke
  // pagina zelf via paginaMeta().
  return {
    metadataBase: new URL(SITE),
    title: { default: m.meta.title, template: "%s" },
    description: m.meta.description,
    applicationName: "Studio VM",
    authors: [{ name: "Vincent Montreuil", url: `${SITE}/${locale}/over` }],
    creator: "Vincent Montreuil",
    publisher: "Studio VM",
    openGraph: {
      type: "website",
      siteName: "Studio VM",
      locale: m.meta.locale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map(
        (l) => getMessages(l).meta.locale,
      ),
    },
    twitter: { card: "summary_large_image" },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
        : undefined,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const typedLocale: Locale = locale;

  // Header/footer-keuze gebeurt client-side (SiteChrome) op basis van
  // het live pad; een gedeelde server-layout re-rendert niet bij
  // client-navigatie, waardoor de chrome anders bleef hangen.
  return (
    <html lang={typedLocale} className={fontKlassen} suppressHydrationWarning>
      <head>
        <ThemaScript />
      </head>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <AmbientBackdrop />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
        >
          {NAAR_INHOUD[typedLocale]}
        </a>
        <SiteChrome
          header={<SiteHeader locale={typedLocale} />}
          footer={<SiteFooter locale={typedLocale} />}
          extras={
            <>
              <CookieBanner locale={typedLocale} />
              <ShortcutsOverlay locale={typedLocale} />
              <PageViewTracker locale={typedLocale} />
            </>
          }
        >
          {children}
        </SiteChrome>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
