import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { OrganizationJsonLd } from "@/components/json-ld";

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

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader locale={typedLocale} />
      <div id="main" className="flex-1">
        {children}
      </div>
      <SiteFooter locale={typedLocale} />
      <CookieBanner />
    </>
  );
}
