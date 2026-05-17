import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/json-ld";
import { SiteChrome } from "@/components/site-chrome";

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
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.description,
      url: "https://studio-vm.be",
      siteName: m.meta.siteName,
      locale: m.meta.locale,
      type: "website",
    },
    alternates: {
      canonical: `https://studio-vm.be/${locale}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `https://studio-vm.be/${l}`]),
      ),
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
          <CookieBanner />
          <ShortcutsOverlay locale={typedLocale} />
        </>
      }
    >
      {children}
    </SiteChrome>
  );
}
