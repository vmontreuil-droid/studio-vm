import type { Metadata } from "next";
import { SITE } from "@/lib/seo";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/json-ld";
import { SiteChrome } from "@/components/site-chrome";
import { PageViewTracker } from "@/components/page-view-tracker";

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
  return {
    metadataBase: new URL(SITE),
    title: m.meta.title,
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.description,
      url: `${SITE}/${locale}`,
      siteName: m.meta.siteName,
      locale: m.meta.locale,
      type: "website",
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
    <SiteChrome
      header={<SiteHeader locale={typedLocale} />}
      footer={<SiteFooter locale={typedLocale} />}
      extras={
        <>
          <OrganizationJsonLd />
          <WebsiteJsonLd locale={typedLocale} />
          <CookieBanner locale={typedLocale} />
          <ShortcutsOverlay locale={typedLocale} />
          <PageViewTracker locale={typedLocale} />
        </>
      }
    >
      {children}
    </SiteChrome>
  );
}
